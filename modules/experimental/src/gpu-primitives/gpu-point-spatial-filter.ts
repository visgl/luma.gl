// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphBufferUse, type GraphDataView} from './gpu-command-graph';
import {
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from './graph-data-view-utils';

const POINT_FILTER_WORKGROUP_SIZE = 256;

/** Exact point predicate evaluated by {@link GPUPointSpatialFilter}. */
export type GPUPointSpatialFilterKind = 'bounds' | 'radius';

/** Optional compact candidate rows used instead of scanning every source point. */
export type GPUPointSpatialFilterCandidates = {
  /** Source-row IDs to test. */
  ids: GraphDataView<'uint32'>;
  /** Number of valid IDs, which may exceed `ids.length` when the producer overflowed. */
  count: GraphDataView<'uint32'>;
  /** Optional producer overflow flag propagated to the filter output. */
  overflow?: GraphDataView<'uint32'>;
};

/** Properties for one exact point spatial predicate. */
export type GPUPointSpatialFilterProps = {
  /** Prefix for generated graph node IDs. */
  id?: string;
  /** Packed two- or three-dimensional source points. */
  positions: GraphDataView<'float32x2'> | GraphDataView<'float32x3'>;
  /** Exact predicate to evaluate. */
  kind: GPUPointSpatialFilterKind;
  /** Packed bounds or center/radius values, mutable between graph encodings. */
  query: GraphDataView<'float32'>;
  /** Source-row-aligned mask, cleared on every encoding. */
  outputMask: GraphDataView<'uint32'>;
  /** Receives candidate truncation or producer overflow. */
  overflow: GraphDataView<'uint32'>;
  /** When present, test only these source rows instead of scanning all positions. */
  candidates?: GPUPointSpatialFilterCandidates;
};

/**
 * Evaluates exact bounds or radius predicates over packed 2D or 3D points.
 *
 * Without candidates, every source point is scanned and the primitive provides an unindexed
 * correctness and cost baseline. With candidates, only the compact source-row IDs produced by a
 * spatial index are tested. Both modes publish the same source-aligned mask so downstream
 * visibility, compaction, and indirect drawing remain independent of the acceleration strategy.
 */
export class GPUPointSpatialFilter {
  readonly id: string;
  readonly positions: GraphDataView<'float32x2'> | GraphDataView<'float32x3'>;
  readonly kind: GPUPointSpatialFilterKind;
  readonly query: GraphDataView<'float32'>;
  readonly outputMask: GraphDataView<'uint32'>;
  readonly overflow: GraphDataView<'uint32'>;
  readonly candidates?: GPUPointSpatialFilterCandidates;
  readonly dimension: 2 | 3;

  constructor(props: GPUPointSpatialFilterProps) {
    this.id = props.id ?? 'gpu-point-spatial-filter';
    this.positions = props.positions;
    this.kind = props.kind;
    this.query = props.query;
    this.outputMask = props.outputMask;
    this.overflow = props.overflow;
    this.candidates = props.candidates;
    this.dimension = this.positions.format === 'float32x2' ? 2 : 3;

    validatePackedView(this.positions, ['float32x2', 'float32x3'], `${this.id} positions`);
    validatePackedView(this.query, ['float32'], `${this.id} query`);
    validatePackedUint32View(this.outputMask, `${this.id} outputMask`);
    validatePackedUint32View(this.overflow, `${this.id} overflow`);
    if (this.outputMask.length !== this.positions.length) {
      throw new Error(`${this.id} outputMask.length must equal positions.length`);
    }
    if (this.overflow.length < 1) {
      throw new Error(`${this.id} overflow must contain one uint32 row`);
    }
    const expectedQueryLength = this.kind === 'bounds' ? this.dimension * 2 : this.dimension + 1;
    if (this.query.length !== expectedQueryLength) {
      throw new Error(`${this.id} ${this.kind} query must contain ${expectedQueryLength} floats`);
    }
    if (this.candidates) {
      validatePackedUint32View(this.candidates.ids, `${this.id} candidate IDs`);
      validatePackedUint32View(this.candidates.count, `${this.id} candidate count`);
      if (this.candidates.count.length < 1) {
        throw new Error(`${this.id} candidate count must contain one uint32 row`);
      }
      if (this.candidates.overflow) {
        validatePackedUint32View(this.candidates.overflow, `${this.id} candidate overflow`);
        if (this.candidates.overflow.length < 1) {
          throw new Error(`${this.id} candidate overflow must contain one uint32 row`);
        }
      }
    }
  }

  /** Adds mask initialization and exact point filtering without submission or readback. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const views = [
      this.positions,
      this.query,
      this.outputMask,
      this.overflow,
      ...(this.candidates
        ? [
            this.candidates.ids,
            this.candidates.count,
            ...(this.candidates.overflow ? [this.candidates.overflow] : [])
          ]
        : [])
    ];
    if (views.some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    addInitializePass(graph, this);
    const dispatchLength = this.candidates?.ids.length ?? this.positions.length;
    if (dispatchLength > 0) addFilterPass(graph, this, dispatchLength);
  }
}

function addInitializePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  filter: GPUPointSpatialFilter
): void {
  const candidateBindings = filter.candidates
    ? `@group(0) @binding(2) var<storage, read> candidateCount: array<u32>;
${
  filter.candidates.overflow
    ? '@group(0) @binding(3) var<storage, read> sourceOverflow: array<u32>;'
    : ''
}`
    : '';
  const initialOverflow = filter.candidates
    ? `select(0u, 1u, candidateCount[CANDIDATE_COUNT_OFFSET] > CANDIDATE_CAPACITY${
        filter.candidates.overflow ? ' || sourceOverflow[SOURCE_OVERFLOW_OFFSET] != 0u' : ''
      })`
    : '0u';
  const source = /* wgsl */ `
const MASK_LENGTH: u32 = ${filter.outputMask.length}u;
const MASK_OFFSET: u32 = ${getViewElementOffset(filter.outputMask)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(filter.overflow)}u;
${
  filter.candidates
    ? `const CANDIDATE_COUNT_OFFSET: u32 = ${getViewElementOffset(filter.candidates.count)}u;
const CANDIDATE_CAPACITY: u32 = ${filter.candidates.ids.length}u;
${
  filter.candidates.overflow
    ? `const SOURCE_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(filter.candidates.overflow)}u;`
    : ''
}`
    : ''
}
@group(0) @binding(0) var<storage, read_write> outputMask: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputOverflow: array<u32>;
${candidateBindings}

@compute @workgroup_size(${POINT_FILTER_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  if (globalId.x < MASK_LENGTH) { outputMask[MASK_OFFSET + globalId.x] = 0u; }
  if (globalId.x == 0u) { outputOverflow[OVERFLOW_OFFSET] = ${initialOverflow}; }
}`;
  const resources: GraphBufferUse[] = [
    {buffer: filter.outputMask, usage: 'storage-write'},
    {buffer: filter.overflow, usage: 'storage-write'},
    ...(filter.candidates
      ? ([{buffer: filter.candidates.count, usage: 'storage-read'}] as GraphBufferUse[])
      : []),
    ...(filter.candidates?.overflow
      ? ([{buffer: filter.candidates.overflow, usage: 'storage-read'}] as GraphBufferUse[])
      : [])
  ];
  addComputationPass(graph, {
    id: `${filter.id}-initialize`,
    source,
    resources,
    bindings: {
      outputMask: filter.outputMask,
      outputOverflow: filter.overflow,
      ...(filter.candidates ? {candidateCount: filter.candidates.count} : {}),
      ...(filter.candidates?.overflow ? {sourceOverflow: filter.candidates.overflow} : {})
    },
    dispatchCount: Math.ceil(Math.max(filter.outputMask.length, 1) / POINT_FILTER_WORKGROUP_SIZE)
  });
}

function addFilterPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  filter: GPUPointSpatialFilter,
  dispatchLength: number
): void {
  const candidateBindings = filter.candidates
    ? `@group(0) @binding(3) var<storage, read> candidateIds: array<u32>;
@group(0) @binding(4) var<storage, read> candidateCount: array<u32>;`
    : '';
  const candidateConstants = filter.candidates
    ? `const CANDIDATE_IDS_OFFSET: u32 = ${getViewElementOffset(filter.candidates.ids)}u;
const CANDIDATE_COUNT_OFFSET: u32 = ${getViewElementOffset(filter.candidates.count)}u;
const CANDIDATE_CAPACITY: u32 = ${filter.candidates.ids.length}u;`
    : '';
  const rowSelection = filter.candidates
    ? `let storedCandidateCount = min(candidateCount[CANDIDATE_COUNT_OFFSET], CANDIDATE_CAPACITY);
  if (invocationIndex >= storedCandidateCount) { return; }
  let sourceRow = candidateIds[CANDIDATE_IDS_OFFSET + invocationIndex];`
    : `if (invocationIndex >= POSITION_COUNT) { return; }
  let sourceRow = invocationIndex;`;
  const predicate = makePredicate(filter);
  const source = /* wgsl */ `
const POSITION_COUNT: u32 = ${filter.positions.length}u;
const POSITIONS_OFFSET: u32 = ${getViewElementOffset(filter.positions)}u;
const QUERY_OFFSET: u32 = ${getViewElementOffset(filter.query)}u;
const MASK_OFFSET: u32 = ${getViewElementOffset(filter.outputMask)}u;
${candidateConstants}
@group(0) @binding(0) var<storage, read> positions: array<f32>;
@group(0) @binding(1) var<storage, read> queryValues: array<f32>;
@group(0) @binding(2) var<storage, read_write> outputMask: array<atomic<u32>>;
${candidateBindings}

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${POINT_FILTER_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let invocationIndex = globalId.x;
  ${rowSelection}
  if (sourceRow >= POSITION_COUNT) { return; }
  ${predicate}
  if (selected) { atomicStore(&outputMask[MASK_OFFSET + sourceRow], 1u); }
}`;
  const resources: GraphBufferUse[] = [
    {buffer: filter.positions, usage: 'storage-read'},
    {buffer: filter.query, usage: 'storage-read'},
    {buffer: filter.outputMask, usage: 'storage-read-write'},
    ...(filter.candidates
      ? ([
          {buffer: filter.candidates.ids, usage: 'storage-read'},
          {buffer: filter.candidates.count, usage: 'storage-read'}
        ] as GraphBufferUse[])
      : [])
  ];
  addComputationPass(graph, {
    id: filter.id,
    source,
    resources,
    bindings: {
      positions: filter.positions,
      queryValues: filter.query,
      outputMask: filter.outputMask,
      ...(filter.candidates
        ? {candidateIds: filter.candidates.ids, candidateCount: filter.candidates.count}
        : {})
    },
    dispatchCount: Math.ceil(dispatchLength / POINT_FILTER_WORKGROUP_SIZE)
  });
}

function makePredicate(filter: GPUPointSpatialFilter): string {
  const axes = ['X', 'Y', ...(filter.dimension === 3 ? ['Z'] : [])];
  const positionValues = axes
    .map(
      (axis, axisIndex) =>
        `let position${axis} = positions[POSITIONS_OFFSET + sourceRow * ${filter.dimension}u + ${axisIndex}u];`
    )
    .join('\n  ');
  const finitePosition = axes.map(axis => `finite(position${axis})`).join(' && ');
  if (filter.kind === 'bounds') {
    const queryValues = axes
      .map(
        (axis, axisIndex) =>
          `let queryMin${axis} = queryValues[QUERY_OFFSET + ${axisIndex}u];
  let queryMax${axis} = queryValues[QUERY_OFFSET + ${axisIndex + filter.dimension}u];`
      )
      .join('\n  ');
    const validBounds = axes
      .map(
        axis =>
          `finite(queryMin${axis}) && finite(queryMax${axis}) && queryMin${axis} <= queryMax${axis}`
      )
      .join(' && ');
    const inside = axes
      .map(axis => `position${axis} >= queryMin${axis} && position${axis} <= queryMax${axis}`)
      .join(' && ');
    return `${positionValues}
  ${queryValues}
  let selected = ${finitePosition} && ${validBounds} && ${inside};`;
  }

  const centerValues = axes
    .map(
      (axis, axisIndex) =>
        `let query${axis} = queryValues[QUERY_OFFSET + ${axisIndex}u];
  let distance${axis} = position${axis} - query${axis};`
    )
    .join('\n  ');
  const finiteCenter = axes.map(axis => `finite(query${axis})`).join(' && ');
  const squaredDistance = axes.map(axis => `distance${axis} * distance${axis}`).join(' + ');
  return `${positionValues}
  ${centerValues}
  let radius = queryValues[QUERY_OFFSET + ${filter.dimension}u];
  let selected = ${finitePosition} && ${finiteCenter} && finite(radius) && radius >= 0.0 && ${squaredDistance} <= radius * radius;`;
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
