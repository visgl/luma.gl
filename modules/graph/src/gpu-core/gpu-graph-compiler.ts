// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TextureFormat} from '@luma.gl/core';
import type {GraphTextureHandle, GraphImportedTexture} from './gpu-command-graph';
import {GPUGraphTextureView, type GPUGraphTexture} from './gpu-graph-value';

import {Buffer, type Device} from '@luma.gl/core';
import type {GPUVectorInput} from '@luma.gl/graph/gpu-data';
import {type GPUCommandGraph, GraphVectorView} from './gpu-command-graph';
import {
  addGPUCommandNodes,
  type GPUCommandNode,
  type GPUCommandNodeProducer
} from './gpu-command-node';
import {GPUCommandLoweringGraph} from './gpu-command-graph-lowering-scope';
import {createTransientView} from './graph-data-view-utils';
import {GPUScalarDispatchGate} from './gpu-scalar-dispatch-gate';
import {createGPUScalar, type GPUScalar} from './gpu-scalar';
import {GPUScalarCompute} from './gpu-scalar-operation';
import {GPUScalarLiteral} from './gpu-scalar-literal';
import {GPUVectorScalarMADD} from './gpu-elementwise-scalar';
import {GPUDotProductScalar} from './gpu-dot-product-scalar';
import {GPUAdaptiveSpMV} from './gpu-adaptive-spmv';
import {GPUPredicateConjunction} from './gpu-predicate-conjunction';
import {GPUGraphScalarOperation} from './gpu-semantic-scalar-operation';
import {GPUGraphScalarLiteral} from './gpu-semantic-state-operation';
import {GPUGraphVectorMADD, GPUGraphDotProduct} from './gpu-semantic-vector-operation';
import {GPUGraphSpMV} from './gpu-semantic-spmv';
import {
  setGPUComputeDispatchWorkgroups,
  getGPUComputeDispatchWorkgroups
} from './gpu-command-dispatch-metadata';
import {
  GPUCompositeOperation,
  isGPUCommandNodeProducer,
  isGPUOperation,
  type GPUGraphOperation,
  type GPUOperationTree
} from './gpu-operation';
import {
  GPUConditionalOperation,
  GPULoopOperation,
  type GPUOperationPredicate
} from './gpu-control-flow-operation';
import {
  GPUOperationLoweringRegistry,
  type GPUOperationLoweringDecision,
  type GPUGraphBackendCapabilities
} from './gpu-graph-lowering';
import {validateGPUGraph, type GPUGraphValidationReport} from './gpu-graph-validation';
import type {GPUGraphScalar, GPUGraphVector} from './gpu-graph-value';
import type {GPUGraph} from './gpu-graph';
export type GPUGraphBindings = {
  scalars?: Readonly<Record<string, number>>;
  vectors?: Readonly<Record<string, GPUVectorInput>>;
  textures?: Readonly<Record<string, GraphImportedTexture>>;
};
export type GPUGraphLoweredNode = {
  nodeId: string;
  nodeType: 'compute' | 'render' | 'copy';
  operationPath: readonly string[];
};
export type GPUGraphLoweringReport = {
  operations: readonly GPUOperationTree[];
  nodes: readonly GPUGraphLoweredNode[];
  decisions: readonly GPUOperationLoweringDecision[];
};
export type GPUGraphCompilation<Parameters = void> = {
  program: GPUGraph;
  graph: GPUCommandGraph<Parameters>;
  scalars: ReadonlyMap<string, GPUScalar>;
  vectors: ReadonlyMap<string, GraphVectorView>;
  textures: ReadonlyMap<string, GraphTextureHandle>;
  validation: GPUGraphValidationReport;
  lowering: GPUGraphLoweringReport;
};
type LoweringState = {
  path: string[];
  nodes: GPUGraphLoweredNode[];
  decisions: GPUOperationLoweringDecision[];
  predicates: GPUOperationPredicate[];
  scalars: Map<string, GPUScalar>;
  vectors: Map<string, GraphVectorView>;
  textures: Map<string, GraphTextureHandle>;
  textureValues: readonly GPUGraphTexture[];
  predicateConjunctions: Map<string, GPUScalar<'uint32'>>;
  commandNodeIds: Set<string>;
};
export class GPUGraphCompiler<Parameters = void> {
  readonly device: Device;
  readonly capabilities: GPUGraphBackendCapabilities;
  readonly lowerings: GPUOperationLoweringRegistry<Parameters>;
  constructor(device: Device, lowerings?: GPUOperationLoweringRegistry<Parameters>) {
    this.lowerings = lowerings ?? new GPUOperationLoweringRegistry<Parameters>();
    this.device = device;
    this.capabilities = Object.freeze({
      backend: 'webgpu',
      gpuConditionals: true,
      nativeLoops: false,
      childGraphs: false
    });
    if (!lowerings) this.registerCoreLowerings();
  }
  compile(program: GPUGraph, bindings: GPUGraphBindings = {}): GPUGraphCompilation<Parameters> {
    const validation = validateGPUGraph(program, bindings);
    if (!validation.valid)
      throw new Error(
        `GPUGraph "${program.id}" validation failed: ${validation.issues
          .filter(i => i.level === 'error')
          .map(i => i.message)
          .join('; ')}`
      );
    const graph = new GPUCommandLoweringGraph<Parameters>(this.device, {
      id: `${program.id}-commands`
    });
    const scalars = new Map<string, GPUScalar>();
    for (const scalar of program.scalars)
      scalars.set(scalar.id, createGPUScalar(graph, scalar.id, scalar.format));
    for (const [name, value] of Object.entries(bindings.scalars ?? {})) {
      const scalar = scalars.get(name);
      if (!scalar) throw new Error(`Undeclared scalar binding ${name}`);
      const view = scalar.view;
      graph.addCopyPass({
        id: `${name}-binding`,
        resources: [{buffer: view, usage: 'copy-destination'}],
        compile: ({device}) => {
          const data =
            scalar.format === 'float32'
              ? new Float32Array([value])
              : scalar.format === 'uint32'
                ? new Uint32Array([value])
                : new Int32Array([value]);
          const buffer = device.createBuffer({data, usage: Buffer.COPY_SRC});
          return {
            encode: ({commandEncoder, getBuffer}) =>
              commandEncoder.copyBufferToBuffer({
                sourceBuffer: buffer,
                destinationBuffer: getBuffer(view),
                destinationOffset: view.byteOffset,
                size: 4
              }),
            destroy: () => buffer.destroy()
          };
        }
      });
    }
    const vectors = new Map<string, GraphVectorView>();
    for (const vector of program.vectors) {
      if (vector.length === undefined)
        throw new Error(
          `${vector.id}: bind dynamic dimensions through program.compile(device).run(bindings)`
        );
      let resolved: GraphVectorView;
      if (vector.external) {
        const binding = bindings.vectors![vector.id];
        const source =
          'data' in binding
            ? binding
            : {
                format: vector.format,
                length: vector.length,
                data: 'buffer' in binding ? [binding] : binding
              };
        resolved = graph.importGPUVector(vector.id, source);
        if (resolved.format !== vector.format || resolved.length !== vector.length) {
          throw new Error(`${vector.id} binding format and length must match its logical vector`);
        }
        if (
          vector.chunkLengths &&
          (vector.chunkLengths.length !== resolved.data.length ||
            vector.chunkLengths.some((length, index) => length !== resolved.data[index].length))
        ) {
          throw new Error(`${vector.id} binding must preserve its declared chunk topology`);
        }
      } else {
        const chunkLengths =
          vector.chunkLengths ?? getTransientChunkLengths(vector.length, this.device);
        const data = chunkLengths.map((length, index) =>
          createTransientView(
            graph,
            chunkLengths.length === 1 ? vector.id : `${vector.id}-chunk-${index}`,
            vector.format,
            length
          )
        );
        resolved = new GraphVectorView({
          id: vector.id,
          name: vector.id,
          format: vector.format,
          length: vector.length,
          valueLength: vector.length,
          stride: 1,
          byteStride: 4,
          rowByteLength: 4,
          data
        });
      }
      vectors.set(vector.id, resolved);
    }
    const textures = new Map<string, GraphTextureHandle>();
    for (const texture of program.textures) {
      const handle = texture.external
        ? graph.importTexture(texture, bindings.textures?.[texture.id])
        : graph.createTransientTexture(texture);
      textures.set(texture.id, handle);
    }
    const state: LoweringState = {
      path: [],
      nodes: [],
      decisions: [],
      predicates: [],
      scalars,
      vectors,
      textures,
      textureValues: program.textures,
      predicateConjunctions: new Map(),
      commandNodeIds: new Set()
    };
    for (const operation of program.operations) this.lower(graph, operation, state);
    return Object.freeze({
      program,
      graph,
      scalars,
      vectors,
      textures,
      validation,
      lowering: Object.freeze({
        operations: program.operationTree,
        nodes: Object.freeze(
          state.nodes.map(node =>
            Object.freeze({...node, operationPath: Object.freeze([...node.operationPath])})
          )
        ),
        decisions: Object.freeze(state.decisions.map(decision => Object.freeze({...decision})))
      })
    });
  }
  protected registerCoreLowerings(): void {
    this.lowerings.register<GPUGraphScalarLiteral>('scalar-literal', (o, c) => {
      const e = new GPUScalarLiteral({
        id: o.id,
        output: c.resolveScalar(o.props.output),
        value: o.props.value
      });
      this.emitProducer(c.graph, e, [[1, 1, 1]]);
      c.recordDecision({
        operationId: o.id,
        operationType: o.type,
        lowering: 'webgpu-scalar-literal',
        reason: 'host-known literal lowers to one compute command node'
      });
    });
    this.lowerings.register<GPUGraphScalarOperation>('scalar-operation', (o, c) => {
      const e = new GPUScalarCompute({
        id: o.id,
        operation: o.operation,
        left: c.resolveScalar(o.left),
        right: o.right ? c.resolveScalar(o.right) : undefined,
        output: c.resolveScalar(o.output)
      });
      this.emitProducer(c.graph, e, [[1, 1, 1]]);
      c.recordDecision({
        operationId: o.id,
        operationType: o.type,
        lowering: 'webgpu-scalar-kernel',
        reason: 'scalar operation lowers to one compute command node'
      });
    });
    this.lowerings.register<GPUGraphVectorMADD>('vector-madd', (o, c) => {
      const p = o.props,
        e = new GPUVectorScalarMADD({
          id: o.id,
          input: c.resolveVector(p.input),
          scale: c.resolveScalar(p.scale),
          addend: c.resolveVector(p.addend),
          output: c.resolveVector(p.output)
        });
      this.emitProducer(c.graph, e);
      c.recordDecision({
        operationId: o.id,
        operationType: o.type,
        lowering: 'webgpu-vector-madd',
        reason: 'dense float32 MADD lowers through explicit command nodes'
      });
    });
    this.lowerings.register<GPUGraphDotProduct>('dot-product', (o, c) => {
      const p = o.props,
        e = new GPUDotProductScalar({
          id: o.id,
          left: c.resolveVector(p.left),
          right: c.resolveVector(p.right),
          output: c.resolveScalar(p.output)
        });
      this.emitProducer(c.graph, e);
      c.recordDecision({
        operationId: o.id,
        operationType: o.type,
        lowering: 'webgpu-hierarchical-dot',
        reason: 'chunk dot products use bounded hierarchical reductions into the scalar arena'
      });
    });
    this.lowerings.register<GPUGraphSpMV>('spmv', (o, c) => {
      const p = o.props,
        m = p.matrix,
        e = new GPUAdaptiveSpMV({
          id: o.id,
          rowOffsets: c.resolveVector(m.rowOffsets),
          columnIndices: c.resolveVector(m.columnIndices),
          values: c.resolveVector(m.values),
          vector: c.resolveVector(p.vector),
          output: c.resolveVector(p.output),
          columns: m.columns,
          statistics: m.statistics,
          strategy: p.strategy
        });
      const d = e.getStrategy(c.graph);
      this.emitProducer(c.graph, e);
      c.recordDecision({
        operationId: o.id,
        operationType: o.type,
        lowering: `webgpu-spmv:${d.id}`,
        reason: d.reason
      });
    });
    this.lowerings.register<GPUConditionalOperation>('conditional', (o, c) => {
      c.recordDecision({
        operationId: o.id,
        operationType: o.type,
        lowering: 'gpu-indirect-gate',
        reason: 'WebGPU realizes runtime predicates with zero/nonzero indirect dispatch'
      });
      for (const child of o.operations) c.lowerConditional(o.predicate, child);
    });
    this.lowerings.register<GPULoopOperation>('loop', (o, c) => {
      if (!o.predicate || o.lowering === 'unroll') {
        c.recordDecision({
          operationId: o.id,
          operationType: o.type,
          lowering: 'bounded-unroll',
          reason: o.predicate ? 'explicit unroll preference' : 'loop has no runtime predicate'
        });
        for (let i = 0; i < o.maximumIterations; i++)
          for (const child of o.operations) c.lower(child);
        return;
      }
      c.recordDecision({
        operationId: o.id,
        operationType: o.type,
        lowering: 'gpu-gated-bounded-sequence',
        reason: 'WebGPU has indirect dispatch but no native graph loop'
      });
      for (let i = 0; i < o.maximumIterations; i++) {
        const gated = i >= o.minimumIterations;
        for (const child of o.operations)
          gated ? c.lowerConditional(o.predicate, child) : c.lower(child);
      }
    });
  }
  protected lower(
    graph: GPUCommandLoweringGraph<Parameters>,
    operation: GPUGraphOperation,
    state: LoweringState
  ): void {
    const id =
      'id' in operation && typeof operation.id === 'string'
        ? operation.id
        : (operation.constructor?.name ?? 'command-node-producer');
    state.path.push(id);
    try {
      if (operation instanceof GPUCompositeOperation && operation.type === 'composite') {
        state.decisions.push({
          operationId: operation.id,
          operationType: operation.type,
          lowering: 'flatten',
          reason: 'WebGPU has no executable child-graph primitive'
        });
        for (const child of operation.operations) this.lower(graph, child, state);
        return;
      }
      if (isGPUOperation(operation)) {
        const lowerer = this.lowerings.get(operation.type);
        if (lowerer) {
          const invoke = () =>
            lowerer(operation, {
              graph,
              capabilities: this.capabilities,
              lower: child => this.lower(graph, child, state),
              lowerConditional: (predicate, child) => {
                state.predicates.push(predicate);
                try {
                  this.lower(graph, child, state);
                } finally {
                  state.predicates.pop();
                }
              },
              resolveScalar: s => this.resolveScalar(s, state),
              resolveVector: v => this.resolveVector(v, state),
              resolveTexture: texture => this.resolveTexture(texture, state),
              resolveTextureView: value => {
                const texture = value instanceof GPUGraphTextureView ? value.texture : value;
                const props = value instanceof GPUGraphTextureView ? value.props : {};
                return graph.createTextureView(this.resolveTexture(texture, state), props);
              },
              recordDecision: d => state.decisions.push(d)
            });
          if (operation instanceof GPUConditionalOperation || operation instanceof GPULoopOperation)
            invoke();
          else this.withNodeDecoration(graph, state, invoke);
          return;
        }
      }
      if ('getNodes' in operation || isGPUCommandNodeProducer(operation)) {
        state.decisions.push({
          operationId: id,
          operationType: 'command-node-producer',
          lowering: 'explicit-command-nodes',
          reason: 'execution primitive constructs explicit command nodes'
        });
        this.withNodeDecoration(graph, state, () => graph.add(operation));
        return;
      }
      throw new Error(`GPUGraph operation "${id}" has no WebGPU lowering`);
    } finally {
      state.path.pop();
    }
  }
  private emitProducer(
    graph: GPUCommandGraph<Parameters>,
    producer: GPUCommandNodeProducer<Parameters>,
    dispatches?: [number, number, number][]
  ): void {
    const nodes = producer.getCommandNodes(graph);
    if (!dispatches) {
      addGPUCommandNodes(graph, nodes);
      return;
    }
    if (nodes.length !== dispatches.length)
      throw new Error(
        `lowering produced ${nodes.length} command nodes but declared ${dispatches.length} dispatches`
      );
    const decorated = nodes.map((node, index) => this.attachDispatch(node, dispatches[index]));
    addGPUCommandNodes(graph, decorated);
  }
  private attachDispatch(
    node: GPUCommandNode<Parameters>,
    dispatch: [number, number, number]
  ): GPUCommandNode<Parameters> {
    if (node.type !== 'compute')
      throw new Error(
        `dispatch geometry can only be attached to compute command nodes; got ${node.type} node "${node.id}"`
      );
    return setGPUComputeDispatchWorkgroups(node, dispatch) as GPUCommandNode<Parameters>;
  }
  private withNodeDecoration<Result>(
    graph: GPUCommandLoweringGraph<Parameters>,
    state: LoweringState,
    callback: () => Result
  ): Result {
    return graph.withComputeLowering(
      node => this.decorateComputeNode(graph, node, state),
      () =>
        graph.withOtherLowering(node => {
          if (state.predicates.length)
            throw new Error(`GPU predicates do not support ${node.type} node "${node.id}"`);
          const decorated = this.makeCommandNodeIdUnique(node, state);
          state.nodes.push({
            nodeId: decorated.id,
            nodeType: decorated.type,
            operationPath: [...state.path]
          });
          return decorated;
        }, callback)
    );
  }
  private decorateComputeNode(
    graph: GPUCommandLoweringGraph<Parameters>,
    node: any,
    state: LoweringState
  ): any {
    node = this.makeCommandNodeIdUnique(node, state);
    if (state.path.length)
      state.nodes.push({nodeId: node.id, nodeType: 'compute', operationPath: [...state.path]});
    if (!state.predicates.length) return node;
    if (node.condition) throw new Error(`compute node "${node.id}" already has condition`);
    const workgroups = getGPUComputeDispatchWorkgroups(node);
    if (!workgroups)
      throw new Error(
        `compute node "${node.id}" under runtime predicate must declare exact dispatch geometry`
      );
    let active: GPUScalar<'uint32'>;
    if (state.predicates.length === 1) {
      active = state.scalars.get(state.predicates[0].value.id) as GPUScalar<'uint32'>;
    } else {
      const key = state.predicates.map(p => p.value.id).join('&&');
      let conjunction = state.predicateConjunctions.get(key);
      if (!conjunction) {
        conjunction = createGPUScalar(
          graph,
          `predicate-and-${state.predicateConjunctions.size}`,
          'uint32'
        );
        state.predicateConjunctions.set(key, conjunction);
      }
      const inputs = state.predicates.map(
        p => state.scalars.get(p.value.id) as GPUScalar<'uint32'>
      );
      const conjunctionNodes = new GPUPredicateConjunction({
        id: `${node.id}-predicate-and`,
        inputs,
        output: conjunction!
      })
        .getCommandNodes(graph)
        .map(n => this.attachDispatch(n, [1, 1, 1]));
      graph.withoutComputeLowering(() => addGPUCommandNodes(graph, conjunctionNodes));
      active = conjunction;
    }
    if (!active) throw new Error(`runtime predicate for "${node.id}" could not be resolved`);
    const gate = new GPUScalarDispatchGate(graph, {id: `${node.id}-predicate`, active, workgroups});
    const gateNodes = gate
      .getUpdateCommandNodes(graph, `${node.id}-predicate-update`)
      .map(n => this.attachDispatch(n, [1, 1, 1]));
    graph.withoutComputeLowering(() => addGPUCommandNodes(graph, gateNodes));
    return {...node, condition: gate.condition};
  }
  private makeCommandNodeIdUnique(
    node: GPUCommandNode<Parameters>,
    state: LoweringState
  ): GPUCommandNode<Parameters> {
    if (!state.commandNodeIds.has(node.id)) {
      state.commandNodeIds.add(node.id);
      return node;
    }
    let iteration = 1;
    let id = `${node.id}-iteration-${iteration}`;
    while (state.commandNodeIds.has(id)) {
      iteration++;
      id = `${node.id}-iteration-${iteration}`;
    }
    state.commandNodeIds.add(id);
    return {...node, id};
  }
  private resolveTexture<Format extends TextureFormat>(
    texture: GPUGraphTexture<Format>,
    state: LoweringState
  ): GraphTextureHandle<Format> {
    if (!state.textureValues.includes(texture))
      throw new Error(`Undeclared program texture "${texture.id}"`);
    // The map erases formats; identity validation above preserves the declared texture's format.
    return state.textures.get(texture.id)! as GraphTextureHandle<Format>;
  }

  private resolveScalar<T extends 'float32' | 'uint32' | 'sint32'>(
    s: GPUGraphScalar<T>,
    state: LoweringState
  ): GPUScalar<T> {
    const r = state.scalars.get(s.id);
    if (!r || r.format !== s.format)
      throw new Error(`GPUGraph scalar "${s.id}" is not part of compilation`);
    return r as GPUScalar<T>;
  }
  private resolveVector<T extends 'float32' | 'uint32' | 'sint32'>(
    v: GPUGraphVector<T>,
    state: LoweringState
  ): GraphVectorView<T> {
    const r = state.vectors.get(v.id);
    if (!r || r.format !== v.format || (v.length !== undefined && r.length !== v.length))
      throw new Error(`GPUGraph vector "${v.id}" is not part of compilation`);
    return r as GraphVectorView<T>;
  }
}

function getTransientChunkLengths(length: number, device: Device): readonly number[] {
  const maximumLength = Math.floor(device.limits.maxStorageBufferBindingSize / 4);
  if (maximumLength < 1 || length <= maximumLength) return [length];
  const lengths: number[] = [];
  for (let offset = 0; offset < length; offset += maximumLength) {
    lengths.push(Math.min(maximumLength, length - offset));
  }
  return lengths;
}
