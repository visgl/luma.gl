// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, type Device} from '@luma.gl/core';
import {GPUDataEvaluator, GPUVectorEvaluator} from '@luma.gl/gpgpu';
import type {GPUVector, GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';

import {
  GPUCompositeOperation,
  getGPUOperationTree,
  type GPUOperationLike,
  type GPUOperationTree,
  type GPUProgramOperation
} from '@luma.gl/gpu-graph/gpu-core';
import {GPUSimpleGraphOperation, type GPUSimpleGraphEvaluator} from './gpu-simple-graph-operation';

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
};

/**
 * Prototype graph-shaped interface to the existing lazy GPGPU evaluator.
 *
 * Operations, backend selection, fusion, caching, and storage ownership remain with
 * the evaluators. The graph borrows every registered value and never destroys it.
 */
export class GPUSimpleGraph {
  readonly device: Device;
  readonly id: string;
  private readonly evaluators = new Map<string, GPUSimpleGraphOperation>();
  private readonly programOperations: GPUProgramOperation[] = [];
  private compiled = false;

  /** Execution capabilities; evaluators retain control of backend submission. */
  readonly capabilities = Object.freeze({
    callerControlledSubmission: false,
    dynamicBindings: false,
    transientAllocation: false
  });

  constructor(device: Device, props: {id?: string} = {}) {
    this.device = device;
    this.id = props.id ?? 'simple-graph';
  }

  /** Accepts evaluator operations, semantic composites, and recursively nested arrays. */
  add(operation: GPUOperationLike): this {
    // Compilation freezes the builder, as it does for GPUGraph.
    assert(!this.compiled);
    const pending = new Map<string, GPUSimpleGraphOperation>();
    const operations: GPUProgramOperation[] = [];
    const visit = (value: GPUOperationLike): void => {
      if (Array.isArray(value)) {
        for (const child of value) visit(child);
      } else if (value instanceof GPUCompositeOperation) {
        for (const child of value.operations) visit(child);
      } else {
        // This executor only supports evaluator-backed semantic operations.
        assert(value instanceof GPUSimpleGraphOperation);
        // Operation names must be nonempty and unique, including within one group.
        assert(value.id && !this.evaluators.has(value.id) && !pending.has(value.id));
        pending.set(value.id, value);
      }
    };
    const collect = (value: GPUOperationLike): void => {
      if (Array.isArray(value)) {
        for (const child of value) collect(child);
      } else {
        // Arrays were handled above; this is one semantic operation or group.
        operations.push(value as GPUProgramOperation);
      }
    };
    visit(operation);
    collect(operation);
    for (const [identifier, value] of pending) this.evaluators.set(identifier, value);
    this.programOperations.push(...operations);
    return this;
  }

  /** Convenience adapter preserving the existing expression-authoring style. */
  addEvaluator<Evaluator extends GPUSimpleGraphEvaluator>(
    identifier: string,
    evaluator: Evaluator
  ): Evaluator {
    this.add(new GPUSimpleGraphOperation({id: identifier, evaluator}));
    return evaluator;
  }

  get operationTree(): readonly GPUOperationTree[] {
    return Object.freeze(this.programOperations.map(getGPUOperationTree));
  }

  /** Captures selected roots and an inspectable dependency plan without executing work. */
  compile(options: GPUSimpleGraphCompileOptions = {}): CompiledGPUSimpleGraph {
    // A graph is compiled once, including when compilation fails.
    assert(!this.compiled);
    this.compiled = true;
    const lastIdentifier = Array.from(this.evaluators.keys()).at(-1);
    const outputNames = options.outputs ?? (lastIdentifier === undefined ? [] : [lastIdentifier]);
    const roots = outputNames.map(identifier => {
      const operation = this.evaluators.get(identifier);
      // Selected outputs must be registered before compiling the graph.
      assert(operation);
      return operation;
    });
    const identifiers = new Map<GPUSimpleGraphEvaluator, string>();
    for (const [identifier, {evaluator}] of this.evaluators) {
      if (!identifiers.has(evaluator)) identifiers.set(evaluator, identifier);
    }
    const usedIdentifiers = new Set(this.evaluators.keys());
    const visiting = new Set<GPUSimpleGraphEvaluator>();
    const visited = new Set<GPUSimpleGraphEvaluator>();
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

    const visit = (evaluator: GPUSimpleGraphEvaluator): void => {
      if (visited.has(evaluator)) return;
      // Mutable custom operations must not introduce dependency cycles.
      assert(!visiting.has(evaluator));
      visiting.add(evaluator);
      const dependencies = getDependencies(evaluator);
      for (const dependency of dependencies) visit(dependency);
      nodes.push({
        id: getIdentifier(evaluator),
        operation: getOperationName(evaluator),
        dependencies: dependencies.map(getIdentifier),
        rowCount: evaluator.length,
        format: evaluator.format
      });
      visiting.delete(evaluator);
      visited.add(evaluator);
    };
    for (const {evaluator} of roots) visit(evaluator);
    return new CompiledGPUSimpleGraph(this.device, nodes, roots, this.operationTree);
  }
}

/** Snapshot of named evaluator outputs and their reachable dependency plan. */
export class CompiledGPUSimpleGraph {
  readonly nodes: readonly GPUSimpleGraphNode[];
  readonly outputs: Readonly<Record<string, GPUSimpleGraphEvaluator>>;
  readonly operationTree: readonly GPUOperationTree[];
  private readonly executionPlan: readonly GPUSimpleGraphOperation[];
  private readonly device: Device;
  private running = false;

  constructor(
    device: Device,
    nodes: readonly GPUSimpleGraphNode[],
    roots: readonly GPUSimpleGraphOperation[],
    operationTree: readonly GPUOperationTree[]
  ) {
    this.device = device;
    this.nodes = Object.freeze(
      nodes.map(node =>
        Object.freeze({...node, dependencies: Object.freeze([...node.dependencies])})
      )
    );
    this.executionPlan = Object.freeze([...roots]);
    this.operationTree = operationTree;
    this.outputs = Object.freeze(
      Object.fromEntries(roots.map(({id, evaluator}) => [id, evaluator]))
    );
  }

  /**
   * Materializes named outputs through the existing CPU, WebGL, or WebGPU handlers.
   * Returned vectors remain owned by their evaluators. No CPU readback is performed.
   */
  async run(): Promise<Record<string, GPUVector>> {
    // The underlying evaluators do not support concurrent evaluation of shared outputs.
    assert(!this.running);
    this.running = true;
    try {
      const results: [string, GPUVector][] = [];
      for (const {id, evaluator} of this.executionPlan) {
        results.push([id, await evaluator.evaluate(this.device)]);
      }
      return Object.fromEntries(results);
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

function getOperationName(evaluator: GPUSimpleGraphEvaluator): string {
  if (evaluator instanceof GPUVectorEvaluator) return 'collect-chunks';
  if (evaluator.source instanceof GPUDataEvaluator) return 'alias';
  return evaluator.source?.name ?? (evaluator.isConstant ? 'constant' : 'input');
}
