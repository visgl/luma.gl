// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUGraph} from '../gpu-core/gpu-graph';
import type {TextureFormat} from '@luma.gl/core';
import type {GPUGraphOutputs} from '../gpu-core/gpu-texture-plan';
import {GPUGraphTexture, type GPUGraphTextureDescriptor} from '../gpu-core/gpu-graph-value';
import {GPUExpressionOperation} from '../gpu-core/gpu-expression-operation';
import type {GPUGraphCompileOptions} from '../gpu-core/gpu-expression-plan';
import type {
  GPUGraphScalarFormat,
  GPUGraphVectorFormat,
  GPUGraphScalarDescriptor,
  GPUGraphVectorDescriptor,
  GPUGraphValueDescriptor,
  GPUGraphScalar,
  GPUGraphVector
} from '../gpu-core/gpu-graph-value';
import {CompiledGPUSimpleExpressionGraph} from './compiled-gpu-expression-graph';
import {assert, type Device} from '@luma.gl/core';
import {GPUDataEvaluator, type GPUDataEvaluatorTargetBuffer} from './operation/gpu-data-evaluator';
import {GPUVectorEvaluator} from './operation/gpu-vector-evaluator';
import {inspectEvaluators as getGPUDataEvaluatorInspection} from './operation/gpu-evaluator-inspection';
import {type GPUEvaluationScope} from './operation/gpu-evaluation-scope';
import type {GPUVector, GPUVectorFormat} from '@luma.gl/graph/gpu-data';

import {
  GPURenderOperation,
  type GPUCommandGraphEncodeOptions,
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
export type GPUSimpleGraphRunOptions<Parameters = void> = {
  scope?: GPUEvaluationScope;
} & Pick<GPUCommandGraphEncodeOptions<Parameters>, 'buffers' | 'textures'> &
  ([Parameters] extends [void] ? {parameters?: Parameters} : {parameters: Parameters});

/**
 * Prototype graph-shaped interface to the existing lazy GPGPU evaluator.
 *
 * Operations, backend selection, fusion, caching, and storage ownership remain with
 * the evaluators. Explicit evaluator inputs are borrowed; semantic lowering owns its adapters.
 */
export class GPUSimpleGraph<Parameters = void> {
  private readonly declarations = new GPUGraph();
  readonly device?: Device;
  readonly id: string;
  private readonly leafOperations: SimpleOperation[] = [];
  private readonly evaluatorIds = new Set<string>();
  private readonly programOperations: GPUGraphOperation[] = [];
  private compiled = false;
  private readonly renderOperations: GPURenderOperation<Parameters>[] = [];

  /** Execution capabilities; evaluators retain control of backend submission. */
  readonly capabilities: Readonly<{
    callerControlledSubmission: boolean;
    dynamicBindings: true;
    /** Evaluator render mode uses graph-managed transient resources. */
    transientAllocation: boolean;
  }>;

  constructor(deviceOrProps?: Device | {id?: string}, props: {id?: string} = {}) {
    const device = deviceOrProps && 'type' in deviceOrProps ? deviceOrProps : undefined;
    this.device = device;
    this.id = (device ? props.id : deviceOrProps?.id) ?? 'simple-graph';
    this.capabilities = Object.freeze({
      callerControlledSubmission: device?.type === 'webgpu',
      dynamicBindings: true,
      transientAllocation: Boolean(device)
    });
  }

  addInput<T extends GPUGraphScalarFormat>(
    id: string,
    descriptor: GPUGraphScalarDescriptor<T>
  ): GPUGraphScalar<T>;
  addInput<T extends GPUGraphVectorFormat>(
    id: string,
    descriptor: GPUGraphVectorDescriptor<T>
  ): GPUGraphVector<T>;
  addInput<Format extends TextureFormat>(
    id: string,
    descriptor: GPUGraphTextureDescriptor<Format>
  ): GPUGraphTexture<Format>;
  addInput(
    id: string,
    descriptor: GPUGraphValueDescriptor
  ): GPUGraphScalar | GPUGraphVector | GPUGraphTexture {
    assert(!this.compiled);
    if (descriptor.type === 'texture') return this.declarations.addInput(id, descriptor);
    return descriptor.type === 'scalar'
      ? this.declarations.addInput(id, descriptor)
      : this.declarations.addInput(id, descriptor);
  }

  addState<T extends GPUGraphVectorFormat>(
    id: string,
    descriptor: GPUGraphVectorDescriptor<T>
  ): GPUGraphVector<T> {
    assert(!this.compiled);
    return this.declarations.addState(id, descriptor);
  }

  scalar<T extends GPUGraphScalarFormat>(id: string, format: T) {
    assert(!this.compiled);
    return this.declarations.scalar(id, format);
  }

  vector<T extends GPUGraphVectorFormat>(
    id: string,
    format: T,
    lengthOrProps?:
      | number
      | {length?: number; external?: boolean; chunkLengths?: readonly number[]},
    props: {external?: boolean; chunkLengths?: readonly number[]} = {}
  ) {
    assert(!this.compiled);
    return this.declarations.vector(id, format, lengthOrProps, props);
  }

  /** Accepts evaluator operations, semantic composites, and recursively nested arrays. */
  add<Operation extends GPUOperationLike>(
    operation: Operation &
      (true extends HasIncompatibleRenderParameters<NoInfer<Operation>, Parameters>
        ? never
        : unknown)
  ): this {
    return this.addOperations(operation);
  }

  private addOperations(operation: GPUOperationLike): this {
    // Compilation freezes the builder, as it does for GPUCommandGraph.
    assert(!this.compiled);
    if (!this.device || operation instanceof GPUExpressionOperation) {
      this.declarations.add(operation);
      return this;
    }
    const pending: (SimpleOperation | GPURenderOperation<Parameters>)[] = [];
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
    this.addOperations(new GPUSimpleGraphValueOperation({id: identifier, value}));
    return value;
  }

  /** Compatibility adapter for existing evaluator-based callers. Prefer addValue() for new code. */
  addEvaluator<Evaluator extends GPUSimpleGraphEvaluator>(
    identifier: string,
    evaluator: Evaluator
  ): Evaluator {
    this.addOperations(new GPUSimpleGraphOperation({id: identifier, evaluator}));
    return evaluator;
  }

  /** Appends shared render passes after the evaluator phase. Use the same operation in GPUGraph. */
  addRenderOperation(operation: GPURenderOperation<Parameters>): this {
    return this.addOperations(operation);
  }

  get operationTree(): readonly GPUOperationTree[] {
    return Object.freeze(
      [...this.programOperations, ...this.declarations.operations].map(getGPUOperationTree)
    );
  }

  /** Captures selected roots and an inspectable dependency plan without executing work. */
  compile<Outputs extends GPUGraphOutputs = Record<string, GPUVector>>(
    device: Device,
    options?: GPUGraphCompileOptions
  ): CompiledGPUSimpleExpressionGraph<Outputs>;
  compile(options?: GPUSimpleGraphCompileOptions): CompiledGPUSimpleGraph<Parameters>;
  compile(
    deviceOrOptions: Device | GPUSimpleGraphCompileOptions = {},
    expressionOptions: GPUGraphCompileOptions = {}
  ): CompiledGPUSimpleGraph<Parameters> | CompiledGPUSimpleExpressionGraph<GPUGraphOutputs> {
    if ('type' in deviceOrOptions) {
      // Reusable expression compilation cannot silently discard evaluator/render recipes.
      assert(
        !this.compiled && this.leafOperations.length === 0 && this.renderOperations.length === 0
      );
      this.compiled = true;
      return new CompiledGPUSimpleExpressionGraph(
        deviceOrOptions,
        this.declarations,
        expressionOptions
      );
    }
    // Evaluator recipes bind their device in the constructor.
    assert(this.device && this.declarations.operations.length === 0);
    if (
      [
        ...this.declarations.scalars,
        ...this.declarations.vectors,
        ...this.declarations.textures
      ].some(value => value.role)
    )
      throw new Error('Explicit input/state declarations require compile(device)');
    const options = deviceOrOptions;
    // A graph is compiled once, including when compilation fails.
    assert(!this.compiled);
    this.compiled = true;
    const lowering = new SimpleGraphLowering(options.bindings ?? {});
    let renderGraph: CompiledGPUCommandGraph<Parameters> | undefined;
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
        const renderBuilder = new GPUCommandGraphBuilder<Parameters>(this.device, {
          id: `${this.id}-render`
        });
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
        renderGraph,
        lowering.inputs
      );
    } catch (error) {
      renderGraph?.destroy();
      lowering.destroy();
      throw error;
    }
  }
}

/** Snapshot of named evaluator outputs and their reachable dependency plan. */
export class CompiledGPUSimpleGraph<Parameters = void> {
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
    readonly renderGraph?: CompiledGPUCommandGraph<Parameters>,
    private readonly inputs: ReadonlyMap<string, GPUSimpleGraphEvaluator> = new Map()
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

  /** Invalidates changed named inputs and their reachable consumers, preserving other channels. */
  invalidate(inputIds: readonly string[]): void {
    assert(!this.running && !this.destroyed && !this.pendingScope);
    const changed = new Set<GPUSimpleGraphEvaluator>();
    for (const identifier of inputIds) {
      const input = this.inputs.get(identifier);
      // Only graph-owned, named leaf inputs can be invalidated through this API.
      assert(input && this.ownedEvaluators.has(input));
      changed.add(input);
      if (input instanceof GPUVectorEvaluator) {
        for (const chunk of input.gpuDataEvaluators) changed.add(chunk);
      }
    }
    const affected = new Map<GPUSimpleGraphEvaluator, boolean>();
    const visit = (evaluator: GPUSimpleGraphEvaluator): boolean => {
      const existing = affected.get(evaluator);
      if (existing !== undefined) return existing;
      // Visit every dependency, even if an earlier dependency is already dirty.
      const dependencies = getDependencies(evaluator).map(visit);
      const dirty = changed.has(evaluator) || dependencies.some(Boolean);
      affected.set(evaluator, dirty);
      return dirty;
    };
    for (const input of changed) visit(input);
    for (const {evaluator} of this.executionPlan) visit(evaluator);
    // Validate the whole change before clearing anything; borrowed evaluator caches stay untouched.
    for (const [evaluator, dirty] of affected) {
      if (dirty) assert(this.ownedEvaluators.has(evaluator));
    }
    for (const [evaluator, dirty] of affected) {
      if (dirty) evaluator.invalidate();
    }
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
  runSync(this: CompiledGPUSimpleGraph<void>): Record<string, GPUVector>;
  runSync(options: GPUSimpleGraphRunOptions<Parameters>): Record<string, GPUVector>;
  runSync(options?: GPUSimpleGraphRunOptions<Parameters>): Record<string, GPUVector> {
    assert(this.device.type === 'webgl' && !options?.scope);
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
      this.encodeRenderPasses(options);
      return results;
    } finally {
      this.running = false;
    }
  }

  private encodeRenderPasses(options?: GPUSimpleGraphRunOptions<Parameters>): void {
    const scope = options?.scope;
    if (!this.renderGraph) return;
    const commandEncoder = scope?.commandEncoder ?? this.device.createCommandEncoder();
    try {
      this.renderGraph.encode(commandEncoder, {
        buffers: options?.buffers,
        textures: options?.textures,
        // The public overload requires parameters unless Parameters is void.
        parameters: options?.parameters as Parameters
      });
      if (!scope) this.device.submit(commandEncoder.finish());
    } finally {
      if (!scope) commandEncoder.destroy();
    }
  }

  /** Materializes selected outputs without CPU readback. Semantic results live until destroy(). */
  run(this: CompiledGPUSimpleGraph<void>): Promise<Record<string, GPUVector>>;
  run(options: GPUSimpleGraphRunOptions<Parameters>): Promise<Record<string, GPUVector>>;
  async run(options?: GPUSimpleGraphRunOptions<Parameters>): Promise<Record<string, GPUVector>> {
    const scope = options?.scope;
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
      this.encodeRenderPasses(options);
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

/** Preserve render parameter requirements without expanding the recursive GPUOperationLike type. */
type HasIncompatibleRenderParameters<Operation, Parameters> = GPUOperationLike extends Operation
  ? false
  : Operation extends GPURenderOperation<infer RequiredParameters>
    ? [Parameters] extends [RequiredParameters]
      ? false
      : true
    : Operation extends GPUCompositeOperation<infer Child>
      ? HasIncompatibleRenderParameters<Child, Parameters>
      : Operation extends readonly (infer Child)[]
        ? HasIncompatibleRenderParameters<Child, Parameters>
        : false;
