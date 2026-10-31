// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, type Device} from '@luma.gl/core';
import {
  GPUDataEvaluator,
  GPUVectorEvaluator,
  getGPUDataEvaluatorInspection,
  type GPUEvaluationScope,
  type GPUDataEvaluatorTargetBuffer
} from '@luma.gl/gpgpu';
import type {GPUVector, GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';

import {
  GPURenderOperation,
  GPUCompositeOperation,
  GPUGraphScalarLiteral,
  GPUGraphScalarOperation,
  GPUGraphVectorMADD,
  type GPUGraphBindings,
  getGPUOperationTree,
  type GPUOperationLike,
  type GPUOperationTree,
  type GPUGraphOperation
} from '@luma.gl/graph/gpu-core';
import {
  GPUSimpleGraphOperation,
  getSimpleGraphEvaluatorFormat,
  type GPUSimpleGraphEvaluator
} from './gpu-simple-graph-operation';
import {
  GPUSimpleGraphUploadOperation,
  GPUSimpleGraphCopyOperation,
  makeCopyEvaluator
} from './gpu-simple-graph-transfer';
import {GPUSimpleGraphValue, GPUSimpleGraphValueOperation} from './gpu-simple-graph-value';
import {SimpleGraphLowering, type SimpleOperation} from './gpu-simple-graph-lowering';
import {GPUCommandGraphBuilder, type CompiledGPUCommandGraph} from '../gpu-core/gpu-command-graph';

/** Inspection record for one evaluator in dependency order. */
export type GPUSimpleGraphNode = {
  readonly id: string;
  readonly operation: string;
  readonly dependencies: readonly string[];
  readonly rowCount: number;
  readonly format?: GPUVectorFormat;
};

export type GPUSimpleGraphCompileOptions = {
  /** Named values to materialize. Defaults to the last registered value. */
  outputs?: readonly string[];
  /** Fixed vector bindings, using the existing GPUGraphCompiler convention. */
  bindings?: GPUGraphBindings;
  /** Borrowed storage for selected outputs. Vector outputs require one target per chunk.
   * This first pass copies final results into targets without retargeting borrowed evaluators.
   */
  outputTargets?: Readonly<
    Record<string, GPUDataEvaluatorTargetBuffer | readonly GPUDataEvaluatorTargetBuffer[]>
  >;
};

/** Run options; scopes defer submission until the caller submits or cancels. */
export type GPUSimpleGraphRunOptions = {scope?: GPUEvaluationScope};

/**
 * Prototype graph-shaped interface to the existing lazy GPGPU evaluator.
 *
 * Operations, backend selection, fusion, caching, and storage ownership remain with
 * the evaluators. Explicit evaluator inputs are borrowed; semantic lowering owns its adapters.
 */
export class GPUSimpleGraph {
  readonly device: Device;
  readonly id: string;
  private readonly leafOperations: SimpleOperation[] = [];
  private readonly evaluatorIds = new Set<string>();
  private readonly programOperations: GPUGraphOperation[] = [];
  private compiled = false;
  private readonly renderOperations: GPURenderOperation[] = [];

  /** Execution capabilities; evaluators retain control of backend submission. */
  readonly capabilities: Readonly<{
    callerControlledSubmission: boolean;
    dynamicBindings: false;
    /** Graph-managed transient render textures; evaluator storage retains its existing pool. */
    transientAllocation: true;
  }>;

  constructor(device: Device, props: {id?: string} = {}) {
    this.device = device;
    this.id = props.id ?? 'simple-graph';
    this.capabilities = Object.freeze({
      callerControlledSubmission: device.type === 'webgpu',
      dynamicBindings: false,
      transientAllocation: true
    });
  }

  /** Accepts evaluator operations, semantic composites, and recursively nested arrays. */
  add(operation: GPUOperationLike): this {
    // Compilation freezes the builder, as it does for GPUCommandGraph.
    assert(!this.compiled);
    const pending: (SimpleOperation | GPURenderOperation)[] = [];
    let hasRenderOperation = this.renderOperations.length > 0;
    const pendingEvaluatorIds = new Set<string>();
    const operations: GPUGraphOperation[] = [];
    const visit = (value: GPUOperationLike): void => {
      if (Array.isArray(value)) {
        for (const child of value) visit(child);
      } else if (value instanceof GPUCompositeOperation) {
        // Control-flow composites cannot be executed as unconditional groups.
        assert(value.type === 'composite');
        for (const child of value.operations) visit(child);
      } else if (value instanceof GPURenderOperation) {
        hasRenderOperation = true;
        pending.push(value);
      } else {
        // Evaluator work precedes render work; never silently reorder the authored graph.
        assert(!hasRenderOperation);
        // Only the initial portable semantic subset and explicit evaluator adapters are supported.
        assert(
          value instanceof GPUSimpleGraphValueOperation ||
            value instanceof GPUSimpleGraphOperation ||
            value instanceof GPUSimpleGraphUploadOperation ||
            value instanceof GPUSimpleGraphCopyOperation ||
            value instanceof GPUGraphScalarLiteral ||
            value instanceof GPUGraphScalarOperation ||
            value instanceof GPUGraphVectorMADD
        );
        if (
          value instanceof GPUSimpleGraphValueOperation ||
          value instanceof GPUSimpleGraphOperation ||
          value instanceof GPUSimpleGraphUploadOperation ||
          value instanceof GPUSimpleGraphCopyOperation
        ) {
          // Explicit evaluator output names must be nonempty and unique within the graph.
          assert(
            value.id && !this.evaluatorIds.has(value.id) && !pendingEvaluatorIds.has(value.id)
          );
          pendingEvaluatorIds.add(value.id);
        }
        // Semantic operation IDs are labels, not output identifiers, and may repeat.
        pending.push(value);
      }
    };
    const collect = (value: GPUOperationLike): void => {
      if (Array.isArray(value)) {
        for (const child of value) collect(child);
      } else {
        // Arrays were handled above; this is one semantic operation or group.
        operations.push(value as GPUGraphOperation);
      }
    };
    visit(operation);
    collect(operation);
    for (const value of pending) {
      if (value instanceof GPURenderOperation) this.renderOperations.push(value);
      else this.leafOperations.push(value);
    }
    for (const identifier of pendingEvaluatorIds) this.evaluatorIds.add(identifier);
    this.programOperations.push(...operations);
    return this;
  }

  /** Publish a graph value; compilation owns its internal execution state. */
  addValue<Value extends GPUSimpleGraphValue | readonly GPUSimpleGraphValue[]>(
    identifier: string,
    value: Value
  ): Value {
    this.add(new GPUSimpleGraphValueOperation({id: identifier, value}));
    return value;
  }

  /** Compatibility adapter for existing evaluator-based callers. Prefer addValue() for new code. */
  addEvaluator<Evaluator extends GPUSimpleGraphEvaluator>(
    identifier: string,
    evaluator: Evaluator
  ): Evaluator {
    this.add(new GPUSimpleGraphOperation({id: identifier, evaluator}));
    return evaluator;
  }

  /** Appends shared render passes after the evaluator phase. Use the same operation in GPUGraph. */
  addRenderOperation(operation: GPURenderOperation): this {
    return this.add(operation);
  }

  get operationTree(): readonly GPUOperationTree[] {
    return Object.freeze(this.programOperations.map(getGPUOperationTree));
  }

  /** Captures selected roots and an inspectable dependency plan without executing work. */
  compile(options: GPUSimpleGraphCompileOptions = {}): CompiledGPUSimpleGraph {
    // A graph is compiled once, including when compilation fails.
    assert(!this.compiled);
    this.compiled = true;
    const lowering = new SimpleGraphLowering(options.bindings ?? {});
    let renderGraph: CompiledGPUCommandGraph | undefined;
    try {
      for (const operation of this.leafOperations) lowering.lower(operation);
      const evaluators = lowering.outputs;
      const lastIdentifier = Array.from(evaluators.keys()).at(-1);
      const outputNames = options.outputs ?? (lastIdentifier === undefined ? [] : [lastIdentifier]);
      const roots = outputNames.map(identifier => {
        const operation = evaluators.get(identifier);
        // Selected outputs must be registered before compiling the graph.
        assert(operation);
        return operation;
      });
      for (const [id, target] of Object.entries(options.outputTargets ?? {})) {
        const rootIndex = roots.findIndex(root => root.id === id);
        // Output bindings address selected roots only, avoiding hidden writes to unused values.
        assert(rootIndex >= 0);
        const evaluator = makeCopyEvaluator(roots[rootIndex].evaluator, lowering.owned);
        const chunks =
          evaluator instanceof GPUVectorEvaluator ? evaluator.gpuDataEvaluators : [evaluator];
        const targets = 'buffer' in target ? [target] : target;
        assert(targets.length === chunks.length);
        for (const [index, chunk] of chunks.entries()) {
          assert(targets[index].buffer.device === this.device);
          chunk.setTargetBuffer(targets[index]);
        }
        roots[rootIndex] = new GPUSimpleGraphOperation({id, evaluator});
      }
      const identifiers = new Map<GPUSimpleGraphEvaluator, string>();
      for (const [identifier, {evaluator}] of evaluators) {
        if (roots.some(root => root.id === identifier && root.evaluator !== evaluator)) continue;
        if (!identifiers.has(evaluator)) identifiers.set(evaluator, identifier);
      }
      const usedIdentifiers = new Set(evaluators.keys());
      const nodes: GPUSimpleGraphNode[] = [];
      let nextIdentifier = 0;

      const getIdentifier = (evaluator: GPUSimpleGraphEvaluator): string => {
        let identifier = identifiers.get(evaluator);
        if (identifier === undefined) {
          do {
            identifier = `${this.id}-node-${nextIdentifier++}`;
          } while (usedIdentifiers.has(identifier));
          identifiers.set(evaluator, identifier);
          usedIdentifiers.add(identifier);
        }
        return identifier;
      };

      // The GPGPU snapshot owns dependency traversal, cycle checks, and format inference.
      // Graph adds only named output identities and chunk-collection nodes.
      for (const {id, evaluator} of roots) {
        if (!identifiers.has(evaluator)) identifiers.set(evaluator, id);
      }
      const dataRoots = roots.flatMap(({evaluator}) =>
        evaluator instanceof GPUVectorEvaluator ? [...evaluator.gpuDataEvaluators] : [evaluator]
      );
      const inspection = getGPUDataEvaluatorInspection(dataRoots, getIdentifier);
      for (const node of inspection.nodes) {
        nodes.push({
          id: node.id,
          operation:
            node.operation ??
            (node.kind === 'alias' ? 'alias' : node.isConstant ? 'constant' : 'input'),
          dependencies: node.dependencies,
          rowCount: node.length,
          format: node.format
        });
      }
      const collected = new Set<GPUVectorEvaluator>();
      for (const {evaluator} of roots) {
        if (evaluator instanceof GPUVectorEvaluator && !collected.has(evaluator)) {
          collected.add(evaluator);
          nodes.push({
            id: getIdentifier(evaluator),
            operation: 'collect-chunks',
            dependencies: evaluator.gpuDataEvaluators.map(getIdentifier),
            rowCount: evaluator.length,
            format: getSimpleGraphEvaluatorFormat(evaluator)
          });
        }
      }
      if (this.renderOperations.length) {
        const renderBuilder = new GPUCommandGraphBuilder(this.device, {id: `${this.id}-render`});
        for (const operation of this.renderOperations) renderBuilder.add(operation);
        renderGraph = renderBuilder.compile();
      }
      return new CompiledGPUSimpleGraph(
        this.device,
        nodes,
        roots,
        this.operationTree,
        lowering.owned,
        Object.fromEntries(roots.map(({id, evaluator}) => [id, getIdentifier(evaluator)])),
        renderGraph
      );
    } catch (error) {
      renderGraph?.destroy();
      lowering.destroy();
      throw error;
    }
  }
}

/** Snapshot of named evaluator outputs and their reachable dependency plan. */
export class CompiledGPUSimpleGraph {
  readonly nodes: readonly GPUSimpleGraphNode[];
  readonly outputs: Readonly<Record<string, GPUSimpleGraphEvaluator>>;
  /** Maps every selected output ID, including aliases, to its dependency inspection node. */
  readonly outputNodes: Readonly<Record<string, string>>;
  readonly operationTree: readonly GPUOperationTree[];
  private readonly executionPlan: readonly GPUSimpleGraphOperation[];
  private readonly device: Device;
  private running = false;
  private destroyed = false;
  private pendingScope?: GPUEvaluationScope;

  constructor(
    device: Device,
    nodes: readonly GPUSimpleGraphNode[],
    roots: readonly GPUSimpleGraphOperation[],
    operationTree: readonly GPUOperationTree[],
    private readonly ownedEvaluators: ReadonlySet<GPUSimpleGraphEvaluator> = new Set(),
    outputNodes: Readonly<Record<string, string>> = {},
    /** Shared render executor, including buffer/texture inspection and ownership. */
    readonly renderGraph?: CompiledGPUCommandGraph
  ) {
    this.device = device;
    this.nodes = Object.freeze(
      nodes.map(node =>
        Object.freeze({...node, dependencies: Object.freeze([...node.dependencies])})
      )
    );
    this.executionPlan = Object.freeze([...roots]);
    this.operationTree = operationTree;
    this.outputNodes = Object.freeze({...outputNodes});
    this.outputs = Object.freeze(
      Object.fromEntries(roots.map(({id, evaluator}) => [id, evaluator]))
    );
  }

  /** Releases semantic evaluator results, preserving borrowed inputs and wrappers. */
  destroy(): void {
    // Results must no longer be in use; borrowed evaluators and input buffers remain caller-owned.
    assert(!this.running && !this.pendingScope);
    if (this.destroyed) return;
    this.renderGraph?.destroy();
    for (const evaluator of this.ownedEvaluators) evaluator.destroy();
    this.destroyed = true;
  }

  /** Executes supported synchronous evaluators and render passes on WebGL, without readback. */
  runSync(): Record<string, GPUVector> {
    assert(this.device.type === 'webgl');
    assert(!this.running && !this.destroyed && !this.pendingScope);
    this.running = true;
    try {
      const results: Record<string, GPUVector> = {};
      const evaluated = new Set<GPUSimpleGraphEvaluator>();
      const evaluate = (evaluator: GPUSimpleGraphEvaluator): void => {
        if (evaluated.has(evaluator)) return;
        for (const dependency of getDependencies(evaluator)) evaluate(dependency);
        evaluator.evaluateSync(this.device);
        evaluated.add(evaluator);
      };
      for (const {id, evaluator} of this.executionPlan) {
        evaluate(evaluator);
        results[id] = evaluator.gpuVector;
      }
      this.encodeRenderPasses();
      return results;
    } finally {
      this.running = false;
    }
  }

  private encodeRenderPasses(scope?: GPUEvaluationScope): void {
    if (!this.renderGraph) return;
    const commandEncoder = scope?.commandEncoder ?? this.device.createCommandEncoder();
    try {
      this.renderGraph.encode(commandEncoder, {parameters: undefined});
      if (!scope) this.device.submit(commandEncoder.finish());
    } finally {
      if (!scope) commandEncoder.destroy();
    }
  }

  /** Materializes selected outputs without CPU readback. Semantic results live until destroy(). */
  async run({scope}: GPUSimpleGraphRunOptions = {}): Promise<Record<string, GPUVector>> {
    // The underlying evaluators do not support concurrent evaluation of shared outputs.
    assert(!this.running && !this.destroyed && !this.pendingScope);
    if (scope) {
      // One compiled graph has one device and stays leased until the scope finishes.
      assert(scope.device === this.device);
      scope.assertIdle();
      scope.retain(() => {
        this.pendingScope = undefined;
      });
      this.pendingScope = scope;
    }
    this.running = true;
    try {
      const results: [string, GPUVector][] = [];
      const evaluated = new Set<GPUSimpleGraphEvaluator>();
      const evaluateDependencies = async (evaluator: GPUSimpleGraphEvaluator): Promise<void> => {
        if (evaluated.has(evaluator)) return;
        for (const dependency of getDependencies(evaluator)) {
          await evaluateDependencies(dependency);
        }
        // Materialize shared inputs before vector collection starts parallel chunk evaluation.
        await evaluator.evaluate(this.device);
        evaluated.add(evaluator);
      };
      for (const {id, evaluator} of this.executionPlan) {
        if (scope) await scope.evaluate(evaluator);
        else await evaluateDependencies(evaluator);
        results.push([id, evaluator.gpuVector]);
      }
      this.encodeRenderPasses(scope);
      return Object.fromEntries(results);
    } catch (error) {
      scope?.cancel();
      throw error;
    } finally {
      this.running = false;
    }
  }
}

function getDependencies(evaluator: GPUSimpleGraphEvaluator): readonly GPUSimpleGraphEvaluator[] {
  if (evaluator instanceof GPUVectorEvaluator) return evaluator.gpuDataEvaluators;
  if (evaluator.source instanceof GPUDataEvaluator) return [evaluator.source];
  return evaluator.source?.dependencies ?? [];
}
