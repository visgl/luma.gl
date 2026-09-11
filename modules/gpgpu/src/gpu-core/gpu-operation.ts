// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUCommandGraph, type GPUCommandGraphContributor} from './gpu-command-graph';

/** One named logical input or output visible to planners and inspectors. */
export type GPUOperationResource = {
  /** Human-readable role such as `matrix`, `vector`, `solution`, or `spectrum`. */
  name: string;
  /** Optional semantic kind such as `scalar`, `vector`, `matrix`, `csr-matrix`, or `field2d`. */
  kind?: string;
  /** Optional element/value format when meaningful. */
  format?: string;
  /** Optional logical dimensions. */
  shape?: readonly number[];
};

/** Static workload metadata that describes problem size without prescribing execution strategy. */
export type GPUOperationWorkload = Readonly<Record<string, number | string | boolean>>;

/** Declarative requirements that may constrain legal execution strategies. */
export type GPUOperationConstraints = Readonly<Record<string, number | string | boolean>>;

/** Semantic metadata carried by an operation before it lowers into command nodes. */
export type GPUOperationMetadata = {
  inputs?: readonly GPUOperationResource[];
  outputs?: readonly GPUOperationResource[];
  workload?: GPUOperationWorkload;
  constraints?: GPUOperationConstraints;
};

/**
 * Semantic unit of GPU computation.
 *
 * Operations describe what should be done. `addToGraph()` is the current lowering hook that turns
 * semantic operations into executable command-graph nodes. Keeping the operation object alive lets
 * future planners inspect and transform intent before or while lowering.
 */
export interface GPUOperation extends GPUCommandGraphContributor {
  readonly id: string;
  readonly type: string;
  readonly metadata?: GPUOperationMetadata;
}

export type GPUOperationContributor = GPUOperation | GPUCommandGraphContributor;
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
  readonly metadata?: GPUOperationMetadata;

  constructor(
    props:
      | readonly GPUOperationContributor[]
      | {
          id?: string;
          operations: readonly GPUOperationContributor[];
          metadata?: GPUOperationMetadata;
        }
  ) {
    const normalized = Array.isArray(props) ? {operations: props} : props;
    this.id = normalized.id ?? 'gpu-composite-operation';
    this.operations = Object.freeze([...normalized.operations]);
    this.metadata = normalized.metadata;
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const operation of this.operations) operation.addToGraph(graph);
  }
}

/** Serializable semantic tree suitable for inspectors without exposing mutable operation objects. */
export type GPUOperationTree = {
  id: string;
  type: string;
  metadata?: GPUOperationMetadata;
  children?: readonly GPUOperationTree[];
};

const graphOperations = new WeakMap<GPUCommandGraph<unknown>, GPUOperationContributor[]>();

export function getGPUCommandGraphOperationTree(
  graph: GPUCommandGraph<unknown>
): readonly GPUOperationTree[] {
  return Object.freeze((graphOperations.get(graph) ?? []).map(getOperationTree));
}

function getOperationTree(operation: GPUOperationContributor): GPUOperationTree {
  if (operation instanceof GPUCompositeOperation) {
    return Object.freeze({
      id: operation.id,
      type: operation.type,
      ...(operation.metadata ? {metadata: operation.metadata} : {}),
      children: Object.freeze(operation.operations.map(getOperationTree))
    });
  }
  if (isGPUOperation(operation)) {
    return Object.freeze({
      id: operation.id,
      type: operation.type,
      ...(operation.metadata ? {metadata: operation.metadata} : {})
    });
  }
  return Object.freeze({
    id: operation.constructor?.name ?? 'gpu-command-graph-contributor',
    type: 'contributor'
  });
}

export function isGPUOperation(operation: GPUOperationContributor): operation is GPUOperation {
  const candidate = operation as Partial<GPUOperation>;
  return typeof candidate.id === 'string' && typeof candidate.type === 'string';
}

function addOperationLike<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  operation: GPUOperationLike
): void {
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
    add(operation: GPUOperationLike): this;
    readonly operations: readonly GPUOperationTree[];
  }
}

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
