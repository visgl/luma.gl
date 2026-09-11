// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUCommandGraph, type GPUCommandGraphContributor} from './gpu-command-graph';

/**
 * Semantic unit of GPU computation.
 *
 * Operations describe what should be done. `addToGraph()` is the current lowering hook that turns
 * semantic operations into executable command-graph nodes. Keeping the operation object alive lets
 * future planners inspect and transform intent before or while lowering.
 */
export interface GPUOperation extends GPUCommandGraphContributor {
  /** Stable semantic identity used by inspectors and planners. */
  readonly id: string;
  /** Operation family independent of the concrete command nodes emitted while lowering. */
  readonly type: string;
}

/** A contributor accepted during migration even when it does not yet expose semantic metadata. */
export type GPUOperationContributor = GPUOperation | GPUCommandGraphContributor;

/** Construction convenience accepted by `GPUCommandGraph.add()`. Nested arrays are flattened. */
export type GPUOperationLike = GPUOperationContributor | readonly GPUOperationLike[];

/**
 * Explicit semantic hierarchy in the operation IR.
 *
 * A composite groups operations for planning, diagnostics and inspection. It does not imply a
 * barrier, pass boundary or synchronization point: resource/control dependencies remain the only
 * source of execution ordering.
 */
export class GPUCompositeOperation implements GPUOperation {
  readonly id: string;
  readonly type = 'composite';
  readonly operations: readonly GPUOperationContributor[];

  constructor(
    props:
      | readonly GPUOperationContributor[]
      | {id?: string; operations: readonly GPUOperationContributor[]}
  ) {
    const normalized = Array.isArray(props) ? {operations: props} : props;
    this.id = normalized.id ?? 'gpu-composite-operation';
    this.operations = Object.freeze([...normalized.operations]);
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    // Lower children directly. Calling graph.add() here would incorrectly register every child as
    // a top-level operation in addition to this preserved semantic composite.
    for (const operation of this.operations) operation.addToGraph(graph);
  }
}

/** Serializable semantic tree suitable for inspectors without exposing mutable operation objects. */
export type GPUOperationTree = {
  id: string;
  type: string;
  children?: readonly GPUOperationTree[];
};

const graphOperations = new WeakMap<GPUCommandGraph<unknown>, GPUOperationContributor[]>();

/** Returns a stable semantic snapshot of operations added to a graph. */
export function getGPUCommandGraphOperationTree(graph: GPUCommandGraph<unknown>): readonly GPUOperationTree[] {
  return Object.freeze((graphOperations.get(graph) ?? []).map(getOperationTree));
}

function getOperationTree(operation: GPUOperationContributor): GPUOperationTree {
  if (operation instanceof GPUCompositeOperation) {
    return Object.freeze({
      id: operation.id,
      type: operation.type,
      children: Object.freeze(operation.operations.map(getOperationTree))
    });
  }
  if (isGPUOperation(operation)) return Object.freeze({id: operation.id, type: operation.type});
  return Object.freeze({
    id: operation.constructor?.name ?? 'gpu-command-graph-contributor',
    type: 'contributor'
  });
}

export function isGPUOperation(operation: GPUOperationContributor): operation is GPUOperation {
  const candidate = operation as Partial<GPUOperation>;
  return typeof candidate.id === 'string' && typeof candidate.type === 'string';
}

function addOperationLike<Parameters>(graph: GPUCommandGraph<Parameters>, operation: GPUOperationLike): void {
  if (Array.isArray(operation)) {
    for (const child of operation) addOperationLike(graph, child);
    return;
  }
  let operations = graphOperations.get(graph as GPUCommandGraph<unknown>);
  if (!operations) {
    operations = [];
    graphOperations.set(graph as GPUCommandGraph<unknown>, operations);
  }
  operations.push(operation as GPUOperationContributor);
  (operation as GPUOperationContributor).addToGraph(graph);
}

declare module './gpu-command-graph' {
  interface GPUCommandGraph<Parameters = void> {
    /**
     * Adds semantic operations to the graph and lowers them into command nodes.
     *
     * Arrays are construction sugar and flatten into sibling operations. A
     * `GPUCompositeOperation` retains its semantic identity in the operation tree.
     */
    add(operation: GPUOperationLike): this;

    /** Semantic operation hierarchy added through `add()`. */
    readonly operations: readonly GPUOperationTree[];
  }
}

// Install the additive operation API without changing existing pass/contributor contracts. This
// compatibility bridge can move directly into GPUCommandGraph once the operation IR lands.
if (!GPUCommandGraph.prototype.add) {
  GPUCommandGraph.prototype.add = function <Parameters>(
    this: GPUCommandGraph<Parameters>,
    operation: GPUOperationLike
  ): GPUCommandGraph<Parameters> {
    addOperationLike(this, operation);
    return this;
  };
  Object.defineProperty(GPUCommandGraph.prototype, 'operations', {
    get(this: GPUCommandGraph<unknown>) {
      return getGPUCommandGraphOperationTree(this);
    }
  });
}
