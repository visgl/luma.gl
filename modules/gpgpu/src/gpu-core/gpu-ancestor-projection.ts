// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type GPUCommandNode, createGPUComputeCommandNode} from './gpu-command-node';
import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView, GraphVectorView} from './gpu-command-graph';
import {
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';

import {getGraphVectorData, alignGraphVectorViews} from './graph-vector-view-utils';
import {getGraphDataRange, createChunkNode, validateChunkViews} from './gpu-chunk-utils';
import {GPUUint32Gather} from './gpu-uint32-gather';
import {createTransientVectorView} from './graph-data-view-utils';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';

const ANCESTOR_PROJECTION_WORKGROUP_SIZE = 256;
const DEFAULT_INVALID_ANCESTOR = 0xffffffff;
const MAXIMUM_UINT32 = 0xffffffff;

/** Properties for nearest-visible canonical parent projection. */
export type GPUAncestorProjectionProps = {
  /** Prefix for the generated command-graph node. */
  id?: string;
  /** One canonical parent node index per source row. */
  parents: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  /** Current source-aligned, zero/nonzero visibility mask. */
  visibility: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  /** Optional one-row value that marks currently visible entries instead of any nonzero value. */
  visibilityValue?: GraphDataView<'uint32'>;
  /** Caller-owned nearest-visible source index per node. */
  output: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  /** Maximum number of hidden canonical parent edges to follow. Defaults to 32. */
  maxDepth?: number;
  /** Sentinel returned for missing, cyclic, or out-of-range ancestry. */
  invalidValue?: number;
};

/**
 * Projects hidden source nodes onto their nearest visible canonical ancestors.
 *
 * Visible nodes project to themselves. Hidden parent chains are followed up to a fixed bound, so
 * corrupt and cyclic relationships cannot stall an interaction. Outputs retain source-node
 * identity and can directly drive filtered dependency endpoint routing.
 */
export class GPUAncestorProjection {
  /** Prefix for the generated command-graph node. */
  readonly id: string;
  /** Canonical parent source IDs. */
  readonly parents: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  /** Current source-aligned visibility mask. */
  readonly visibility: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  /** Optional exact visibility value, useful for generation-tagged sparse masks. */
  readonly visibilityValue?: GraphDataView<'uint32'>;
  /** Caller-owned resolved source IDs. */
  readonly output: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  /** Maximum number of ancestry edges visited per source row. */
  readonly maxDepth: number;
  /** Sentinel for unresolved ancestry. */
  readonly invalidValue: number;

  constructor(props: GPUAncestorProjectionProps) {
    this.id = props.id ?? 'gpu-ancestor-projection';
    this.parents = props.parents;
    this.visibility = props.visibility;
    this.visibilityValue = props.visibilityValue;
    this.output = props.output;
    this.maxDepth = props.maxDepth ?? 32;
    this.invalidValue = props.invalidValue ?? DEFAULT_INVALID_ANCESTOR;
    for (const [name, view] of [
      ['parents', this.parents],
      ['visibility', this.visibility],
      ['output', this.output]
    ] as const) {
      for (const chunk of getGraphVectorData(view))
        validatePackedUint32View(chunk, `${this.id} ${name}`);
    }
    if (
      this.parents.length !== this.output.length ||
      this.visibility.length !== this.output.length
    ) {
      throw new Error(`${this.id} parents, visibility, and output must have matching lengths`);
    }
    if (this.visibilityValue) {
      validatePackedUint32View(this.visibilityValue, `${this.id} visibilityValue`);
      if (this.visibilityValue.length < 1) {
        throw new Error(`${this.id} visibilityValue must contain one uint32 row`);
      }
    }
    if (!Number.isSafeInteger(this.maxDepth) || this.maxDepth < 0) {
      throw new Error(`${this.id} maxDepth must be a nonnegative safe integer`);
    }
    if (this.maxDepth > MAXIMUM_UINT32) {
      throw new Error(`${this.id} maxDepth must be a uint32`);
    }
    if (
      !Number.isSafeInteger(this.invalidValue) ||
      this.invalidValue < 0 ||
      this.invalidValue > MAXIMUM_UINT32
    ) {
      throw new Error(`${this.id} invalidValue must be a uint32`);
    }
    if (
      getGraphVectorData(this.output).some(output =>
        [...getGraphVectorData(this.parents), ...getGraphVectorData(this.visibility)].some(
          input => output.buffer === input.buffer
        )
      )
    ) {
      throw new Error(`${this.id} output must use a separate buffer from ancestry inputs`);
    }
  }

  /** Adds one bounded, source-aligned projection pass without submitting GPU work. */
  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    validateChunkViews(
      graph,
      [this.parents, this.visibility, ...(this.visibilityValue ? [this.visibilityValue] : [])],
      [this.output]
    );
    if (
      [this.parents, this.visibility, this.output].some(view => view instanceof GraphVectorView)
    ) {
      return getChunkedAncestorNodes(graph, this);
    }
    return getAtomicAncestorNodes(graph, this as AtomicAncestorProjection);
  }
}

type AtomicAncestorProjection = Omit<GPUAncestorProjection, 'parents' | 'visibility' | 'output'> & {
  parents: GraphDataView<'uint32'>;
  visibility: GraphDataView<'uint32'>;
  output: GraphDataView<'uint32'>;
};

function getAtomicAncestorNodes<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  projection: AtomicAncestorProjection
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  if (
    projection.parents.buffer.graph !== graph ||
    projection.visibility.buffer.graph !== graph ||
    projection.output.buffer.graph !== graph ||
    (projection.visibilityValue && projection.visibilityValue.buffer.graph !== graph)
  ) {
    throw new Error(`${projection.id} views must belong to the target graph`);
  }
  if (projection.output.length === 0) {
    return nodes;
  }

  const source = /* wgsl */ `
const NODE_COUNT: u32 = ${projection.output.length}u;
const MAX_DEPTH: u32 = ${projection.maxDepth}u;
const INVALID_ANCESTOR: u32 = ${projection.invalidValue}u;
const PARENTS_OFFSET: u32 = ${getViewElementOffset(projection.parents)}u;
const VISIBILITY_OFFSET: u32 = ${getViewElementOffset(projection.visibility)}u;
${projection.visibilityValue ? `const VISIBILITY_VALUE_OFFSET: u32 = ${getViewElementOffset(projection.visibilityValue)}u;` : ''}
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(projection.output)}u;
@group(0) @binding(0) var<storage, read> parents: array<u32>;
@group(0) @binding(1) var<storage, read> visibility: array<u32>;
@group(0) @binding(2) var<storage, read_write> projectedAncestors: array<u32>;
${projection.visibilityValue ? '@group(0) @binding(3) var<storage, read> visibilityValue: array<u32>;' : ''}

fn isVisible(index: u32) -> bool {
  ${projection.visibilityValue ? 'return visibility[VISIBILITY_OFFSET + index] == visibilityValue[VISIBILITY_VALUE_OFFSET];' : 'return visibility[VISIBILITY_OFFSET + index] != 0u;'}
}

@compute @workgroup_size(${ANCESTOR_PROJECTION_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let sourceIndex = globalId.x;
  if (sourceIndex >= NODE_COUNT) {
    return;
  }
  if (isVisible(sourceIndex)) {
    projectedAncestors[OUTPUT_OFFSET + sourceIndex] = sourceIndex;
    return;
  }
  var parentIndex = parents[PARENTS_OFFSET + sourceIndex];
  var depth = 0u;
  loop {
    if (depth >= MAX_DEPTH || parentIndex >= NODE_COUNT) {
      projectedAncestors[OUTPUT_OFFSET + sourceIndex] = INVALID_ANCESTOR;
      return;
    }
    if (isVisible(parentIndex)) {
      projectedAncestors[OUTPUT_OFFSET + sourceIndex] = parentIndex;
      return;
    }
    parentIndex = parents[PARENTS_OFFSET + parentIndex];
    depth++;
  }
}`;
  const views = {
    parents: projection.parents,
    visibility: projection.visibility,
    projectedAncestors: projection.output,
    ...(projection.visibilityValue ? {visibilityValue: projection.visibilityValue} : {})
  };
  nodes.push(
    createGPUComputeCommandNode<Parameters>({
      id: projection.id,
      resources: [
        {buffer: projection.parents, usage: 'storage-read'},
        {buffer: projection.visibility, usage: 'storage-read'},
        {buffer: projection.output, usage: 'storage-write'},
        ...(projection.visibilityValue
          ? [{buffer: projection.visibilityValue, usage: 'storage-read'} as const]
          : [])
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: projection.id,
          source,
          shaderLayout: {
            bindings: Object.keys(views).map((name, location) => ({
              name,
              type: 'storage' as const,
              group: 0,
              location
            }))
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const resolvedBindings: Record<string, Binding> = {};
            for (const [name, view] of Object.entries(views)) {
              resolvedBindings[name] = getViewBinding(view, getBuffer);
            }
            computation.setBindings(resolvedBindings);
            computation.dispatch(
              computePass,
              Math.ceil(projection.output.length / ANCESTOR_PROJECTION_WORKGROUP_SIZE)
            );
          },
          destroy: () => computation.destroy()
        };
      }
    })
  );

  return nodes;
}

function getChunkedAncestorNodes<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  projection: GPUAncestorProjection
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const output = getGraphDataRange(graph, projection.output, 0, projection.output.length);
  if (!output.length) return nodes;
  let current = createTransientVectorView(graph, `${projection.id}-current`, output);
  let next = createTransientVectorView(graph, `${projection.id}-next`, output);
  let jumps = createTransientVectorView(graph, `${projection.id}-jumps`, output);
  let nextJumps = createTransientVectorView(graph, `${projection.id}-next-jumps`, output);
  const visibleAncestors = createTransientVectorView(
    graph,
    `${projection.id}-visible-ancestors`,
    output
  );
  const maximum = graph.device.limits.maxComputeWorkgroupsPerDimension;
  const value = projection.visibilityValue;
  let firstRow = 0;
  const spans = alignGraphVectorViews(graph, [
    projection.parents,
    projection.visibility,
    jumps,
    current
  ]);
  for (const [chunkIndex, [parents, visibility, jump, cursor]] of spans.entries()) {
    const dispatch = getBoundedDispatchLayout(projection.id, parents.length, 256, maximum);
    nodes.push(
      createChunkNode(graph, {
        id: `${projection.id}-initialize-${chunkIndex}`,
        inputs: {parents, visibility, ...(value ? {visibilityValue: value} : {})},
        outputs: {jumps: jump, current: cursor},
        dispatch,
        source: `
@group(0) @binding(0) var<storage, read> parents: array<u32>;
@group(0) @binding(1) var<storage, read> visibility: array<u32>;
${value ? '@group(0) @binding(2) var<storage, read> visibilityValue: array<u32>;' : ''}
@group(0) @binding(${value ? 3 : 2}) var<storage, read_write> jumps: array<u32>;
@group(0) @binding(${value ? 4 : 3}) var<storage, read_write> current: array<u32>;
@compute @workgroup_size(256)
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${getBoundedInvocationIndexSource(dispatch, 256)}
  if (index >= ${parents.length}u) { return; }
  let source = ${firstRow}u + index;
  let visible = visibility[${getViewElementOffset(visibility)}u + index] ${value ? `== visibilityValue[${getViewElementOffset(value)}u]` : '!= 0u'};
  // Visible nodes are absorbing: repeated composition retains the nearest visible ancestor.
  jumps[${getViewElementOffset(jump)}u + index] = select(parents[${getViewElementOffset(parents)}u + index], source, visible);
  current[${getViewElementOffset(cursor)}u + index] = source;
}`
      })
    );
    firstRow += parents.length;
  }
  // Binary composition of F(node) = visible(node) ? node : parent(node).
  // At most 32 levels cover every accepted uint32 depth, without unrolling one pass per edge.
  let remainingDepth = projection.maxDepth;
  let level = 0;
  while (remainingDepth > 0) {
    if (remainingDepth % 2 === 1) {
      nodes.push(
        ...new GPUUint32Gather({
          id: `${projection.id}-advance-${level}`,
          source: jumps,
          indices: current,
          output: next,
          invalidValue: DEFAULT_INVALID_ANCESTOR
        }).getCommandNodes(graph)
      );
      [current, next] = [next, current];
    }
    remainingDepth = Math.floor(remainingDepth / 2);
    if (remainingDepth > 0) {
      nodes.push(
        ...new GPUUint32Gather({
          id: `${projection.id}-square-${level}`,
          source: jumps,
          indices: jumps,
          output: nextJumps,
          invalidValue: DEFAULT_INVALID_ANCESTOR
        }).getCommandNodes(graph)
      );
      [jumps, nextJumps] = [nextJumps, jumps];
    }
    level++;
  }
  nodes.push(
    ...new GPUUint32Gather({
      id: `${projection.id}-visibility`,
      source: projection.visibility,
      indices: current,
      output: visibleAncestors
    }).getCommandNodes(graph)
  );
  for (const [chunkIndex, [cursor, visibility, destination]] of alignGraphVectorViews(graph, [
    current,
    visibleAncestors,
    output
  ]).entries()) {
    const dispatch = getBoundedDispatchLayout(projection.id, destination.length, 256, maximum);
    nodes.push(
      createChunkNode(graph, {
        id: `${projection.id}-publish-${chunkIndex}`,
        inputs: {current: cursor, visibility, ...(value ? {visibilityValue: value} : {})},
        outputs: {output: destination},
        dispatch,
        source: `
@group(0) @binding(0) var<storage, read> current: array<u32>;
@group(0) @binding(1) var<storage, read> visibility: array<u32>;
${value ? '@group(0) @binding(2) var<storage, read> visibilityValue: array<u32>;' : ''}
@group(0) @binding(${value ? 3 : 2}) var<storage, read_write> output: array<u32>;
@compute @workgroup_size(256)
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${getBoundedInvocationIndexSource(dispatch, 256)}
  if (index >= ${destination.length}u) { return; }
  let ancestor = current[${getViewElementOffset(cursor)}u + index];
  let visible = visibility[${getViewElementOffset(visibility)}u + index] ${value ? `== visibilityValue[${getViewElementOffset(value)}u]` : '!= 0u'};
  output[${getViewElementOffset(destination)}u + index] = select(${projection.invalidValue}u, ancestor, ancestor < ${output.length}u && visible);
}`
      })
    );
  }
  return nodes;
}
