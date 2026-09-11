// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUCommandGraph, type GPUCommandGraphContributor} from './gpu-command-graph';

export type GPUOperationResource = {
  name: string;
  kind?: string;
  format?: string;
  shape?: readonly number[];
};
export type GPUOperationWorkload = Readonly<Record<string, number | string | boolean>>;
export type GPUOperationConstraints = Readonly<Record<string, number | string | boolean>>;
export type GPUOperationMetadata = {
  inputs?: readonly GPUOperationResource[];
  outputs?: readonly GPUOperationResource[];
  workload?: GPUOperationWorkload;
  constraints?: GPUOperationConstraints;
};

export interface GPUOperation extends GPUCommandGraphContributor {
  readonly id: string;
  readonly type: string;
  readonly metadata?: GPUOperationMetadata;
}
export type GPUOperationContributor = GPUOperation | GPUCommandGraphContributor;
export type GPUOperationLike = GPUOperationContributor | readonly GPUOperationLike[];

/** One command node emitted while lowering a semantic operation. */
export type GPUOperationLoweredNode = {
  nodeId: string;
  nodeType: 'compute' | 'render' | 'copy';
  /** Root-to-leaf semantic operation path active when this node was emitted. */
  operationPath: readonly string[];
};

/** Inspector-facing provenance linking semantic operation hierarchy to executable command nodes. */
export type GPUOperationLoweringReport = {
  operations: readonly GPUOperationTree[];
  nodes: readonly GPUOperationLoweredNode[];
};

/** Semantic hierarchy. Grouping never implies synchronization. */
export class GPUCompositeOperation implements GPUOperation {
  readonly id: string;
  readonly type: string = 'composite';
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
    for (const operation of this.operations) lowerGPUOperationContributor(graph, operation);
  }
}

export type GPUOperationTree = {
  id: string;
  type: string;
  metadata?: GPUOperationMetadata;
  children?: readonly GPUOperationTree[];
};

type LoweringState = {
  path: string[];
  nodes: GPUOperationLoweredNode[];
};

const graphOperations = new WeakMap<GPUCommandGraph<unknown>, GPUOperationContributor[]>();
const graphLoweringState = new WeakMap<GPUCommandGraph<unknown>, LoweringState>();

export function getGPUCommandGraphOperationTree(
  graph: GPUCommandGraph<unknown>
): readonly GPUOperationTree[] {
  return Object.freeze((graphOperations.get(graph) ?? []).map(getOperationTree));
}

/** Returns immutable semantic-to-command provenance for inspection and compiler diagnostics. */
export function getGPUOperationLoweringReport(
  graph: GPUCommandGraph<unknown>
): GPUOperationLoweringReport {
  const state = graphLoweringState.get(graph);
  return Object.freeze({
    operations: getGPUCommandGraphOperationTree(graph),
    nodes: Object.freeze(
      (state?.nodes ?? []).map(node =>
        Object.freeze({...node, operationPath: Object.freeze([...node.operationPath])})
      )
    )
  });
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

function getLoweringState(graph: GPUCommandGraph<unknown>): LoweringState {
  let state = graphLoweringState.get(graph);
  if (!state) {
    state = {path: [], nodes: []};
    graphLoweringState.set(graph, state);
  }
  return state;
}

/** @internal Lowers one contributor while preserving semantic ancestry for emitted nodes. */
export function lowerGPUOperationContributor<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  operation: GPUOperationContributor
): void {
  const state = getLoweringState(graph as GPUCommandGraph<unknown>);
  const operationId = isGPUOperation(operation)
    ? operation.id
    : operation.constructor?.name ?? 'gpu-command-graph-contributor';
  state.path.push(operationId);
  try {
    operation.addToGraph(graph);
  } finally {
    state.path.pop();
  }
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
  lowerGPUOperationContributor(graph, operation as GPUOperationContributor);
}

function recordLoweredNode(
  graph: GPUCommandGraph<unknown>,
  nodeType: GPUOperationLoweredNode['nodeType'],
  nodeId: string
): void {
  const state = getLoweringState(graph);
  if (state.path.length === 0) return;
  state.nodes.push(
    Object.freeze({
      nodeId,
      nodeType,
      operationPath: Object.freeze([...state.path])
    })
  );
}

declare module './gpu-command-graph' {
  interface GPUCommandGraph<Parameters = void> {
    add(operation: GPUOperationLike): this;
    readonly operations: readonly GPUOperationTree[];
    readonly operationLowering: GPUOperationLoweringReport;
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
  Object.defineProperty(GPUCommandGraph.prototype, 'operationLowering', {
    get(this: GPUCommandGraph<unknown>) {
      return getGPUOperationLoweringReport(this);
    }
  });
}

// Temporary additive instrumentation while the operation IR is experimental. Once the API settles,
// these three hooks move into GPUCommandGraph's native node insertion path.
const prototype = GPUCommandGraph.prototype as any;
if (!prototype.__operationLoweringInstrumented) {
  for (const [method, nodeType] of [
    ['addComputePass', 'compute'],
    ['addRenderPass', 'render'],
    ['addCopyPass', 'copy']
  ] as const) {
    const original = prototype[method];
    if (typeof original === 'function') {
      prototype[method] = function (this: GPUCommandGraph<unknown>, node: {id: string}, ...rest: unknown[]) {
        recordLoweredNode(this, nodeType, node.id);
        return original.call(this, node, ...rest);
      };
    }
  }
  Object.defineProperty(prototype, '__operationLoweringInstrumented', {value: true});
}
