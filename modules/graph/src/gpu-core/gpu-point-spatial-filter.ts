// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandNode} from './gpu-command-node';
import {
  GPUCommandGraph,
  type GraphVectorView,
  type GraphBufferUse,
  type GraphDataView
} from './gpu-command-graph';
import {
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from './graph-data-view-utils';

import {alignGraphVectorViews, getGraphVectorData} from './graph-vector-view-utils';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {getSpatialCommandNodes, validateSpatialWrites} from './gpu-spatial-utils';

const POINT_FILTER_WORKGROUP_SIZE = 256;

/** Exact point predicate evaluated by {@link GPUPointSpatialFilter}. */
export type GPUPointSpatialFilterKind = 'bounds' | 'radius';

/** Optional compact candidate rows used instead of scanning every source point. */
export type GPUPointSpatialFilterCandidates = {
  /** Source-row IDs to test. */
  ids: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
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
  positions: GraphDataView<'float32x2' | 'float32x3'> | GraphVectorView<'float32x2' | 'float32x3'>;
  /** Exact predicate to evaluate. */
  kind: GPUPointSpatialFilterKind;
  /** Packed bounds or center/radius values, mutable between graph encodings. */
  query: GraphDataView<'float32'>;
  /** Source-row-aligned mask, cleared on every encoding. */
  outputMask: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
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
  readonly positions:
    | GraphDataView<'float32x2' | 'float32x3'>
    | GraphVectorView<'float32x2' | 'float32x3'>;
  readonly kind: GPUPointSpatialFilterKind;
  readonly query: GraphDataView<'float32'>;
  readonly outputMask: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
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

    for (const chunk of getGraphVectorData(this.positions))
      validatePackedView(chunk, ['float32x2', 'float32x3'], `${this.id} positions`);
    validatePackedView(this.query, ['float32'], `${this.id} query`);
    for (const chunk of getGraphVectorData(this.outputMask))
      validatePackedUint32View(chunk, `${this.id} outputMask`);
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
      for (const chunk of getGraphVectorData(this.candidates.ids))
        validatePackedUint32View(chunk, `${this.id} candidate IDs`);
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
    if (this.positions.length > 0xffffffff || (this.candidates?.ids.length ?? 0) > 0xffffffff) {
      throw new Error(`${this.id} logical row counts must fit in uint32`);
    }
    validateSpatialWrites(
      this.id,
      [
        ...getGraphVectorData(this.positions),
        this.query,
        ...(this.candidates
          ? [
              ...getGraphVectorData(this.candidates.ids),
              this.candidates.count,
              ...(this.candidates.overflow ? [this.candidates.overflow] : [])
            ]
          : [])
      ],
      [...getGraphVectorData(this.outputMask), this.overflow]
    );
  }

  /** Adds mask initialization and exact point filtering without submission or readback. */
  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const nodes: GPUCommandNode<Parameters>[] = [];
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
    if (views.flatMap(view => getGraphVectorData(view)).some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    nodes.push(...addInitializePass(graph, this));
    let positionStart = 0;
    for (const [spanIndex, [positions, outputMask]] of alignGraphVectorViews(graph, [
      this.positions,
      this.outputMask
    ]).entries()) {
      if (this.candidates) {
        let candidateStart = 0;
        for (const [candidateIndex, ids] of getGraphVectorData(this.candidates.ids).entries()) {
          if (ids.length)
            nodes.push(
              ...addFilterPass(graph, {
                ...this,
                id: `${this.id}-positions-${spanIndex}-candidates-${candidateIndex}`,
                positions,
                outputMask,
                positionStart,
                candidateStart,
                candidateCapacity: this.candidates.ids.length,
                candidates: {...this.candidates, ids}
              })
            );
          candidateStart += ids.length;
        }
      } else {
        nodes.push(
          ...addFilterPass(graph, {
            ...this,
            id: `${this.id}-positions-${spanIndex}`,
            positions,
            outputMask,
            positionStart,
            candidateStart: 0,
            candidateCapacity: 0,
            candidates: undefined
          })
        );
      }
      positionStart += positions.length;
    }

    return nodes;
  }
}

function addInitializePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  filter: GPUPointSpatialFilter
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  for (const [chunkIndex, outputMask] of getGraphVectorData(filter.outputMask).entries()) {
    if (!outputMask.length) continue;
    const dispatch = getBoundedDispatchLayout(
      filter.id,
      outputMask.length,
      POINT_FILTER_WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    nodes.push(
      ...getSpatialCommandNodes(graph, {
        id: `${filter.id}-clear-mask-${chunkIndex}`,
        source: /* wgsl */ `
@group(0) @binding(0) var<storage, read_write> outputMask: array<u32>;
@compute @workgroup_size(${POINT_FILTER_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatch, POINT_FILTER_WORKGROUP_SIZE)}
  if (index < ${outputMask.length}u) {
    outputMask[${getViewElementOffset(outputMask)}u + index] = 0u;
  }
}`,
        resources: [{buffer: outputMask, usage: 'storage-write'}],
        bindings: {outputMask},
        dispatch
      })
    );
  }
  const candidates = filter.candidates;
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read_write> outputOverflow: array<u32>;
${candidates ? '@group(0) @binding(1) var<storage, read> candidateCount: array<u32>;' : ''}
${candidates?.overflow ? '@group(0) @binding(2) var<storage, read> sourceOverflow: array<u32>;' : ''}
@compute @workgroup_size(1) fn main() {
  outputOverflow[${getViewElementOffset(filter.overflow)}u] = ${
    candidates
      ? `select(0u, 1u, candidateCount[${getViewElementOffset(candidates.count)}u] > ${candidates.ids.length}u${candidates.overflow ? ` || sourceOverflow[${getViewElementOffset(candidates.overflow)}u] != 0u` : ''})`
      : '0u'
  };
}`;
  nodes.push(
    ...getSpatialCommandNodes(graph, {
      id: `${filter.id}-initialize-overflow`,
      source,
      resources: [
        {buffer: filter.overflow, usage: 'storage-write'},
        ...(candidates
          ? [{buffer: candidates.count, usage: 'storage-read'} as GraphBufferUse]
          : []),
        ...(candidates?.overflow
          ? [{buffer: candidates.overflow, usage: 'storage-read'} as GraphBufferUse]
          : [])
      ],
      bindings: {
        outputOverflow: filter.overflow,
        ...(candidates ? {candidateCount: candidates.count} : {}),
        ...(candidates?.overflow ? {sourceOverflow: candidates.overflow} : {})
      },
      dispatch: {x: 1, y: 1, z: 1}
    })
  );

  return nodes;
}

function addFilterPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  filter: Pick<GPUPointSpatialFilter, 'id' | 'kind' | 'dimension' | 'query'> & {
    positions: GraphDataView<'float32x2' | 'float32x3'>;
    outputMask: GraphDataView<'uint32'>;
    positionStart: number;
    candidateStart: number;
    candidateCapacity: number;
    candidates?: Omit<GPUPointSpatialFilterCandidates, 'ids'> & {ids: GraphDataView<'uint32'>};
  }
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const dispatchLength = filter.candidates?.ids.length ?? filter.positions.length;
  const dispatch = getBoundedDispatchLayout(
    filter.id,
    dispatchLength,
    POINT_FILTER_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const candidateBindings = filter.candidates
    ? `@group(0) @binding(3) var<storage, read> candidateIds: array<u32>;
@group(0) @binding(4) var<storage, read> candidateCount: array<u32>;`
    : '';
  const candidateConstants = filter.candidates
    ? `const CANDIDATE_IDS_OFFSET: u32 = ${getViewElementOffset(filter.candidates.ids)}u;
const CANDIDATE_COUNT_OFFSET: u32 = ${getViewElementOffset(filter.candidates.count)}u;
const CANDIDATE_CAPACITY: u32 = ${filter.candidateCapacity}u;
const CANDIDATE_START: u32 = ${filter.candidateStart}u;
const CANDIDATE_CHUNK_LENGTH: u32 = ${filter.candidates.ids.length}u;`
    : '';
  const rowSelection = filter.candidates
    ? `let storedCandidateCount = min(candidateCount[CANDIDATE_COUNT_OFFSET], CANDIDATE_CAPACITY);
  if (index >= CANDIDATE_CHUNK_LENGTH || CANDIDATE_START + index >= storedCandidateCount) { return; }
  let globalRow = candidateIds[CANDIDATE_IDS_OFFSET + index];
  if (globalRow < ${filter.positionStart}u || globalRow - ${filter.positionStart}u >= POSITION_COUNT) { return; }
  let sourceRow = globalRow - ${filter.positionStart}u;`
    : `if (index >= POSITION_COUNT) { return; }
  let sourceRow = index;`;
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
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatch, POINT_FILTER_WORKGROUP_SIZE)}
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
  nodes.push(
    ...getSpatialCommandNodes(graph, {
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
      dispatch
    })
  );

  return nodes;
}

function makePredicate(filter: Pick<GPUPointSpatialFilter, 'kind' | 'dimension'>): string {
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
    .map((axis, axisIndex) => `let query${axis} = queryValues[QUERY_OFFSET + ${axisIndex}u];`)
    .join('\n  ');
  const finiteCenter = axes.map(axis => `finite(query${axis})`).join(' && ');
  const scale = makeNestedMaximum([
    'radius',
    ...axes.flatMap(axis => [`abs(position${axis})`, `abs(query${axis})`])
  ]);
  const squaredDistance = axes
    .map(
      axis =>
        `(position${axis} / scale - query${axis} / scale) * (position${axis} / scale - query${axis} / scale)`
    )
    .join(' + ');
  return `${positionValues}
  ${centerValues}
  let radius = queryValues[QUERY_OFFSET + ${filter.dimension}u];
  let scale = ${scale};
  let selected = ${finitePosition} && ${finiteCenter} && finite(radius) && radius >= 0.0 && (scale == 0.0 || ${squaredDistance} <= (radius / scale) * (radius / scale));`;
}

function makeNestedMaximum(values: string[]): string {
  return values.slice(1).reduce((maximum, value) => `max(${maximum}, ${value})`, values[0]);
}
