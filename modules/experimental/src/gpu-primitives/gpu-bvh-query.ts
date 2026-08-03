// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphBufferUse, type GraphDataView} from './gpu-command-graph';
import type {GPUBVHBoundsView} from './gpu-bvh';
import {
  createTransientView,
  doGraphDataViewsOverlap,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from './graph-data-view-utils';

const BVH_QUERY_WORKGROUP_SIZE = 256;
const INVALID_NODE = 0xffffffff;

/** Flat complete-binary hierarchy consumed by {@link GPUBVHQuery}. */
export type GPUBVHView = {
  leafCapacity: number;
  nodeMinima: GPUBVHBoundsView;
  nodeMaxima: GPUBVHBoundsView;
  nodeChildren: GraphDataView<'uint32x2'>;
  leafIds: GraphDataView<'uint32'>;
  overflow: GraphDataView<'uint32'>;
};

/** Bounds predicate evaluated during BVH traversal. */
export type GPUBVHQueryKind = 'point' | 'bounds';

/** Properties for one complete-binary BVH traversal. */
export type GPUBVHQueryProps = {
  /** Prefix for generated graph resources and node IDs. */
  id?: string;
  /** Flat hierarchy, commonly a `GPUBVH` instance. */
  bvh: GPUBVHView;
  /** Node intersection rule. */
  kind: GPUBVHQueryKind;
  /** Packed point or minima/maxima query, mutable between graph encodings. */
  query: GraphDataView<'float32'>;
  /** Caller-owned capacity-bounded stable leaf IDs. */
  output: GraphDataView<'uint32'>;
  /** Caller-owned row receiving the full stored-tree match count. */
  count: GraphDataView<'uint32'>;
  /** Caller-owned row receiving source-tree or output-capacity overflow. */
  overflow: GraphDataView<'uint32'>;
  /** Optional source-ID-addressed result mask, cleared on every encoding. */
  outputMask?: GraphDataView<'uint32'>;
  /** Optional row receiving the number of active nodes whose bounds were tested. */
  visitedCount?: GraphDataView<'uint32'>;
};

/**
 * Traverses a complete-binary GPU BVH for point containment or bounds intersection.
 *
 * One compute pass processes each tree depth. Only active nodes test their bounds and activate
 * children, while matched leaves append stable IDs atomically. Output order is unspecified;
 * `visitedCount` exposes traversal work for topology-quality and cost comparisons.
 */
export class GPUBVHQuery {
  readonly id: string;
  readonly bvh: GPUBVHView;
  readonly kind: GPUBVHQueryKind;
  readonly query: GraphDataView<'float32'>;
  readonly output: GraphDataView<'uint32'>;
  readonly count: GraphDataView<'uint32'>;
  readonly overflow: GraphDataView<'uint32'>;
  readonly outputMask?: GraphDataView<'uint32'>;
  readonly visitedCount?: GraphDataView<'uint32'>;
  readonly dimension: 2 | 3;
  readonly nodeCount: number;
  readonly internalNodeCount: number;
  readonly levelCount: number;

  constructor(props: GPUBVHQueryProps) {
    this.id = props.id ?? 'gpu-bvh-query';
    this.bvh = props.bvh;
    this.kind = props.kind;
    this.query = props.query;
    this.output = props.output;
    this.count = props.count;
    this.overflow = props.overflow;
    this.outputMask = props.outputMask;
    this.visitedCount = props.visitedCount;
    this.dimension = this.bvh.nodeMinima.format === 'float32x2' ? 2 : 3;

    if (!Number.isSafeInteger(this.bvh.leafCapacity) || !isPowerOfTwo(this.bvh.leafCapacity)) {
      throw new Error(`${this.id} bvh leafCapacity must be a positive power of two`);
    }
    this.nodeCount = this.bvh.leafCapacity * 2 - 1;
    this.internalNodeCount = this.bvh.leafCapacity - 1;
    this.levelCount = Math.log2(this.bvh.leafCapacity) + 1;
    validateIndexView(this);
    validatePackedView(this.query, ['float32'], `${this.id} query`);
    validatePackedUint32View(this.output, `${this.id} output`);
    validatePackedUint32View(this.count, `${this.id} count`);
    validatePackedUint32View(this.overflow, `${this.id} overflow`);
    if (this.outputMask) validatePackedUint32View(this.outputMask, `${this.id} outputMask`);
    if (this.visitedCount) validatePackedUint32View(this.visitedCount, `${this.id} visitedCount`);
    if (
      this.count.length < 1 ||
      this.overflow.length < 1 ||
      (this.visitedCount && this.visitedCount.length < 1)
    ) {
      throw new Error(`${this.id} count, overflow, and visitedCount must contain one uint32 row`);
    }
    const expectedQueryLength = this.kind === 'point' ? this.dimension : this.dimension * 2;
    if (this.query.length !== expectedQueryLength) {
      throw new Error(`${this.id} ${this.kind} query must contain ${expectedQueryLength} floats`);
    }
    validateDisjointViews(this);
  }

  /** Adds initialization and level-ordered traversal without submission or readback. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const views = [
      this.bvh.nodeMinima,
      this.bvh.nodeMaxima,
      this.bvh.nodeChildren,
      this.bvh.leafIds,
      this.bvh.overflow,
      this.query,
      this.output,
      this.count,
      this.overflow,
      ...(this.outputMask ? [this.outputMask] : []),
      ...(this.visitedCount ? [this.visitedCount] : [])
    ];
    if (views.some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    const activeNodes = createTransientView(
      graph,
      `${this.id}-active-nodes`,
      'uint32',
      this.nodeCount
    );
    addInitializePass(graph, this, activeNodes);
    for (let depth = 0; depth < this.levelCount; depth++) {
      addTraversalLevelPass(graph, this, activeNodes, depth);
    }
    if (this.outputMask && this.output.length > 0) addOutputMaskPass(graph, this);
  }
}

function validateIndexView(query: GPUBVHQuery): void {
  validatePackedView(query.bvh.nodeMinima, ['float32x2', 'float32x3'], `${query.id} nodeMinima`);
  validatePackedView(query.bvh.nodeMaxima, ['float32x2', 'float32x3'], `${query.id} nodeMaxima`);
  validatePackedView(query.bvh.nodeChildren, ['uint32x2'], `${query.id} nodeChildren`);
  validatePackedUint32View(query.bvh.leafIds, `${query.id} leafIds`);
  validatePackedUint32View(query.bvh.overflow, `${query.id} bvh overflow`);
  if (
    query.bvh.nodeMinima.format !== query.bvh.nodeMaxima.format ||
    query.bvh.nodeMinima.length !== query.nodeCount ||
    query.bvh.nodeMaxima.length !== query.nodeCount ||
    query.bvh.nodeChildren.length !== query.nodeCount ||
    query.bvh.leafIds.length !== query.bvh.leafCapacity
  ) {
    throw new Error(`${query.id} bvh views must match its complete-binary topology`);
  }
  if (query.bvh.overflow.length < 1) {
    throw new Error(`${query.id} bvh overflow must contain one uint32 row`);
  }
}

function addInitializePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  query: GPUBVHQuery,
  activeNodes: GraphDataView<'uint32'>
): void {
  const maskBinding = query.outputMask
    ? '@group(0) @binding(4) var<storage, read_write> outputMask: array<u32>;'
    : '';
  const visitedBinding = query.visitedCount
    ? `@group(0) @binding(${query.outputMask ? 5 : 4}) var<storage, read_write> visitedCount: array<u32>;`
    : '';
  const source = /* wgsl */ `
const NODE_COUNT: u32 = ${query.nodeCount}u;
const ACTIVE_OFFSET: u32 = ${getViewElementOffset(activeNodes)}u;
const BVH_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(query.bvh.overflow)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(query.count)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(query.overflow)}u;
${
  query.outputMask
    ? `const MASK_OFFSET: u32 = ${getViewElementOffset(query.outputMask)}u;
const MASK_LENGTH: u32 = ${query.outputMask.length}u;`
    : ''
}
${
  query.visitedCount
    ? `const VISITED_OFFSET: u32 = ${getViewElementOffset(query.visitedCount)}u;`
    : ''
}
@group(0) @binding(0) var<storage, read_write> activeNodes: array<u32>;
@group(0) @binding(1) var<storage, read> bvhOverflow: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputCount: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputOverflow: array<u32>;
${maskBinding}
${visitedBinding}

@compute @workgroup_size(${BVH_QUERY_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let index = globalId.x;
  if (index < NODE_COUNT) { activeNodes[ACTIVE_OFFSET + index] = select(0u, 1u, index == 0u); }
  ${query.outputMask ? 'if (index < MASK_LENGTH) { outputMask[MASK_OFFSET + index] = 0u; }' : ''}
  if (index == 0u) {
    outputCount[COUNT_OFFSET] = 0u;
    outputOverflow[OVERFLOW_OFFSET] = min(bvhOverflow[BVH_OVERFLOW_OFFSET], 1u);
    ${query.visitedCount ? 'visitedCount[VISITED_OFFSET] = 1u;' : ''}
  }
}`;
  const resources: GraphBufferUse[] = [
    {buffer: activeNodes, usage: 'storage-write'},
    {buffer: query.bvh.overflow, usage: 'storage-read'},
    {buffer: query.count, usage: 'storage-write'},
    {buffer: query.overflow, usage: 'storage-write'},
    ...(query.outputMask
      ? ([{buffer: query.outputMask, usage: 'storage-write'}] as GraphBufferUse[])
      : []),
    ...(query.visitedCount
      ? ([{buffer: query.visitedCount, usage: 'storage-write'}] as GraphBufferUse[])
      : [])
  ];
  addComputationPass(graph, {
    id: `${query.id}-initialize`,
    source,
    resources,
    bindings: {
      activeNodes,
      bvhOverflow: query.bvh.overflow,
      outputCount: query.count,
      outputOverflow: query.overflow,
      ...(query.outputMask ? {outputMask: query.outputMask} : {}),
      ...(query.visitedCount ? {visitedCount: query.visitedCount} : {})
    },
    dispatchCount: Math.ceil(
      Math.max(query.nodeCount, query.outputMask?.length ?? 0, 1) / BVH_QUERY_WORKGROUP_SIZE
    )
  });
}

function addTraversalLevelPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  query: GPUBVHQuery,
  activeNodes: GraphDataView<'uint32'>,
  depth: number
): void {
  const firstNode = 2 ** depth - 1;
  const levelNodeCount = 2 ** depth;
  const leafLevel = depth === query.levelCount - 1;
  const predicate = makeNodePredicate(query);
  if (leafLevel) {
    const source = /* wgsl */ `
const FIRST_NODE: u32 = ${firstNode}u;
const LEVEL_NODE_COUNT: u32 = ${levelNodeCount}u;
const INTERNAL_NODE_COUNT: u32 = ${query.internalNodeCount}u;
const DIMENSION: u32 = ${query.dimension}u;
const OUTPUT_CAPACITY: u32 = ${query.output.length}u;
const ACTIVE_OFFSET: u32 = ${getViewElementOffset(activeNodes)}u;
const NODE_MINIMA_OFFSET: u32 = ${getViewElementOffset(query.bvh.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${getViewElementOffset(query.bvh.nodeMaxima)}u;
const LEAF_IDS_OFFSET: u32 = ${getViewElementOffset(query.bvh.leafIds)}u;
const QUERY_OFFSET: u32 = ${getViewElementOffset(query.query)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(query.output)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(query.count)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(query.overflow)}u;
@group(0) @binding(0) var<storage, read_write> activeNodes: array<atomic<u32>>;
@group(0) @binding(1) var<storage, read> nodeMinima: array<f32>;
@group(0) @binding(2) var<storage, read> nodeMaxima: array<f32>;
@group(0) @binding(3) var<storage, read> leafIds: array<u32>;
@group(0) @binding(4) var<storage, read> queryValues: array<f32>;
@group(0) @binding(5) var<storage, read_write> outputIds: array<u32>;
@group(0) @binding(6) var<storage, read_write> outputCount: array<atomic<u32>>;
@group(0) @binding(7) var<storage, read_write> outputOverflow: array<atomic<u32>>;

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${BVH_QUERY_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  if (globalId.x >= LEVEL_NODE_COUNT) { return; }
  let nodeIndex = FIRST_NODE + globalId.x;
  if (atomicLoad(&activeNodes[ACTIVE_OFFSET + nodeIndex]) == 0u) { return; }
  ${predicate}
  if (selected) {
    let leafIndex = nodeIndex - INTERNAL_NODE_COUNT;
    let objectId = leafIds[LEAF_IDS_OFFSET + leafIndex];
    let outputIndex = atomicAdd(&outputCount[COUNT_OFFSET], 1u);
    if (outputIndex < OUTPUT_CAPACITY) {
      outputIds[OUTPUT_OFFSET + outputIndex] = objectId;
    } else {
      atomicStore(&outputOverflow[OVERFLOW_OFFSET], 1u);
    }
  }
}`;
    addComputationPass(graph, {
      id: `${query.id}-depth-${depth}`,
      source,
      resources: [
        {buffer: activeNodes, usage: 'storage-read-write'},
        {buffer: query.bvh.nodeMinima, usage: 'storage-read'},
        {buffer: query.bvh.nodeMaxima, usage: 'storage-read'},
        {buffer: query.bvh.leafIds, usage: 'storage-read'},
        {buffer: query.query, usage: 'storage-read'},
        {buffer: query.output, usage: 'storage-write'},
        {buffer: query.count, usage: 'storage-read-write'},
        {buffer: query.overflow, usage: 'storage-read-write'}
      ],
      bindings: {
        activeNodes,
        nodeMinima: query.bvh.nodeMinima,
        nodeMaxima: query.bvh.nodeMaxima,
        leafIds: query.bvh.leafIds,
        queryValues: query.query,
        outputIds: query.output,
        outputCount: query.count,
        outputOverflow: query.overflow
      },
      dispatchCount: Math.ceil(levelNodeCount / BVH_QUERY_WORKGROUP_SIZE)
    });
    return;
  }

  const visitedBinding = query.visitedCount
    ? '@group(0) @binding(5) var<storage, read_write> visitedCount: array<atomic<u32>>;'
    : '';
  const source = /* wgsl */ `
const FIRST_NODE: u32 = ${firstNode}u;
const LEVEL_NODE_COUNT: u32 = ${levelNodeCount}u;
const DIMENSION: u32 = ${query.dimension}u;
const ACTIVE_OFFSET: u32 = ${getViewElementOffset(activeNodes)}u;
const NODE_MINIMA_OFFSET: u32 = ${getViewElementOffset(query.bvh.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${getViewElementOffset(query.bvh.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${getViewElementOffset(query.bvh.nodeChildren)}u;
const QUERY_OFFSET: u32 = ${getViewElementOffset(query.query)}u;
${
  query.visitedCount
    ? `const VISITED_OFFSET: u32 = ${getViewElementOffset(query.visitedCount)}u;`
    : ''
}
@group(0) @binding(0) var<storage, read_write> activeNodes: array<atomic<u32>>;
@group(0) @binding(1) var<storage, read> nodeMinima: array<f32>;
@group(0) @binding(2) var<storage, read> nodeMaxima: array<f32>;
@group(0) @binding(3) var<storage, read> nodeChildren: array<u32>;
@group(0) @binding(4) var<storage, read> queryValues: array<f32>;
${visitedBinding}

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${BVH_QUERY_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  if (globalId.x >= LEVEL_NODE_COUNT) { return; }
  let nodeIndex = FIRST_NODE + globalId.x;
  if (atomicLoad(&activeNodes[ACTIVE_OFFSET + nodeIndex]) == 0u) { return; }
  ${predicate}
  if (selected) {
    let childComponent = nodeIndex * 2u;
    let left = nodeChildren[CHILDREN_OFFSET + childComponent];
    let right = nodeChildren[CHILDREN_OFFSET + childComponent + 1u];
    if (left != ${INVALID_NODE}u) { atomicStore(&activeNodes[ACTIVE_OFFSET + left], 1u); }
    if (right != ${INVALID_NODE}u) { atomicStore(&activeNodes[ACTIVE_OFFSET + right], 1u); }
    ${query.visitedCount ? 'atomicAdd(&visitedCount[VISITED_OFFSET], 2u);' : ''}
  }
}`;
  addComputationPass(graph, {
    id: `${query.id}-depth-${depth}`,
    source,
    resources: [
      {buffer: activeNodes, usage: 'storage-read-write'},
      {buffer: query.bvh.nodeMinima, usage: 'storage-read'},
      {buffer: query.bvh.nodeMaxima, usage: 'storage-read'},
      {buffer: query.bvh.nodeChildren, usage: 'storage-read'},
      {buffer: query.query, usage: 'storage-read'},
      ...(query.visitedCount
        ? ([{buffer: query.visitedCount, usage: 'storage-read-write'}] as GraphBufferUse[])
        : [])
    ],
    bindings: {
      activeNodes,
      nodeMinima: query.bvh.nodeMinima,
      nodeMaxima: query.bvh.nodeMaxima,
      nodeChildren: query.bvh.nodeChildren,
      queryValues: query.query,
      ...(query.visitedCount ? {visitedCount: query.visitedCount} : {})
    },
    dispatchCount: Math.ceil(levelNodeCount / BVH_QUERY_WORKGROUP_SIZE)
  });
}

function validateDisjointViews(query: GPUBVHQuery): void {
  const inputs = [
    query.bvh.nodeMinima,
    query.bvh.nodeMaxima,
    query.bvh.nodeChildren,
    query.bvh.leafIds,
    query.bvh.overflow,
    query.query
  ];
  const outputs = [
    query.output,
    query.count,
    query.overflow,
    ...(query.outputMask ? [query.outputMask] : []),
    ...(query.visitedCount ? [query.visitedCount] : [])
  ];
  for (let outputIndex = 0; outputIndex < outputs.length; outputIndex++) {
    const output = outputs[outputIndex]!;
    if (inputs.some(input => doGraphDataViewsOverlap(input, output))) {
      throw new Error(`${query.id} output views must not overlap query or BVH inputs`);
    }
    if (outputs.slice(outputIndex + 1).some(other => doGraphDataViewsOverlap(output, other))) {
      throw new Error(`${query.id} output views must not overlap one another`);
    }
  }
}

function addOutputMaskPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  query: GPUBVHQuery
): void {
  const source = /* wgsl */ `
const OUTPUT_CAPACITY: u32 = ${query.output.length}u;
const MASK_LENGTH: u32 = ${query.outputMask!.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(query.output)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(query.count)}u;
const MASK_OFFSET: u32 = ${getViewElementOffset(query.outputMask!)}u;
@group(0) @binding(0) var<storage, read> outputIds: array<u32>;
@group(0) @binding(1) var<storage, read> outputCount: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputMask: array<atomic<u32>>;

@compute @workgroup_size(${BVH_QUERY_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let index = globalId.x;
  let storedCount = min(outputCount[COUNT_OFFSET], OUTPUT_CAPACITY);
  if (index >= storedCount) { return; }
  let objectId = outputIds[OUTPUT_OFFSET + index];
  if (objectId < MASK_LENGTH) { atomicStore(&outputMask[MASK_OFFSET + objectId], 1u); }
}`;
  addComputationPass(graph, {
    id: `${query.id}-output-mask`,
    source,
    resources: [
      {buffer: query.output, usage: 'storage-read'},
      {buffer: query.count, usage: 'storage-read'},
      {buffer: query.outputMask!, usage: 'storage-read-write'}
    ],
    bindings: {outputIds: query.output, outputCount: query.count, outputMask: query.outputMask!},
    dispatchCount: Math.ceil(query.output.length / BVH_QUERY_WORKGROUP_SIZE)
  });
}

function makeNodePredicate(query: GPUBVHQuery): string {
  const axes = ['X', 'Y', ...(query.dimension === 3 ? ['Z'] : [])];
  const nodeValues = axes
    .map(
      (axis, axisIndex) =>
        `let nodeMin${axis} = nodeMinima[NODE_MINIMA_OFFSET + nodeIndex * DIMENSION + ${axisIndex}u];
  let nodeMax${axis} = nodeMaxima[NODE_MAXIMA_OFFSET + nodeIndex * DIMENSION + ${axisIndex}u];`
    )
    .join('\n  ');
  const validNode = axes
    .map(
      axis => `finite(nodeMin${axis}) && finite(nodeMax${axis}) && nodeMin${axis} <= nodeMax${axis}`
    )
    .join(' && ');
  if (query.kind === 'point') {
    const queryValues = axes
      .map((axis, axisIndex) => `let query${axis} = queryValues[QUERY_OFFSET + ${axisIndex}u];`)
      .join('\n  ');
    const validQuery = axes.map(axis => `finite(query${axis})`).join(' && ');
    const contains = axes
      .map(axis => `query${axis} >= nodeMin${axis} && query${axis} <= nodeMax${axis}`)
      .join(' && ');
    return `${nodeValues}
  ${queryValues}
  let selected = ${validNode} && ${validQuery} && ${contains};`;
  }
  const queryValues = axes
    .map(
      (axis, axisIndex) =>
        `let queryMin${axis} = queryValues[QUERY_OFFSET + ${axisIndex}u];
  let queryMax${axis} = queryValues[QUERY_OFFSET + ${axisIndex + query.dimension}u];`
    )
    .join('\n  ');
  const validQuery = axes
    .map(
      axis =>
        `finite(queryMin${axis}) && finite(queryMax${axis}) && queryMin${axis} <= queryMax${axis}`
    )
    .join(' && ');
  const intersects = axes
    .map(axis => `nodeMax${axis} >= queryMin${axis} && nodeMin${axis} <= queryMax${axis}`)
    .join(' && ');
  return `${nodeValues}
  ${queryValues}
  let selected = ${validNode} && ${validQuery} && ${intersects};`;
}

function addComputationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    resources: GraphBufferUse[];
    bindings: Record<string, GraphDataView>;
    dispatchCount: number;
  }
): void {
  graph.addComputePass({
    id: props.id,
    resources: props.resources,
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source: props.source,
        shaderLayout: {
          bindings: Object.keys(props.bindings).map((name, location) => ({
            name,
            type: 'storage' as const,
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {};
          for (const [name, view] of Object.entries(props.bindings)) {
            bindings[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(bindings);
          computation.dispatch(computePass, props.dispatchCount);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function isPowerOfTwo(value: number): boolean {
  return value > 0 && Number.isInteger(Math.log2(value));
}
