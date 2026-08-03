// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Binding} from '@luma.gl/core';
import {Computation, DynamicBuffer} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  type GraphBufferUse,
  type GraphDataView,
  type GPUCommandGraphContributor
} from '../gpu-primitives/gpu-command-graph';
import {
  createTransientView,
  getViewBinding,
  getViewBindingRange,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from '../gpu-primitives/graph-data-view-utils';
import type {GPUGridIndexBounds, GPUGridIndexSize} from '../gpu-primitives/gpu-grid-index';
import type {GPUSpatialQueryOutput} from './gpu-spatial-query-types';

const POINT_QUERY_WORKGROUP_SIZE = 256;
const QUERY_STATE_LENGTH = 12;

/** Read-only storage and domain contract consumed by {@link GPUPointSpatialQuery}. */
export type GPUGridIndexView = {
  /** Two- or three-dimensional grid dimensions. */
  gridSize: GPUGridIndexSize;
  /** Inclusive index domain as minima followed by maxima. */
  bounds: GPUGridIndexBounds;
  /** Exclusive cell offsets with `cellCount + 1` rows. */
  cellOffsets: GraphDataView<'uint32'>;
  /** Position-row indices grouped by cell. Each value must address a row in `positions`. */
  rowIndices: GraphDataView<'uint32'>;
  /** Scalar containing the accepted position-row count. */
  count: GraphDataView<'uint32'>;
  /** Scalar set when the index exceeded `rowIndices` capacity. */
  overflow: GraphDataView<'uint32'>;
};

/** Point predicate evaluated by {@link GPUPointSpatialQuery}. */
export type GPUPointSpatialQueryKind = 'bounds' | 'radius' | 'polygon';

/** Polygon rings for a two-dimensional point query. */
export type GPUPointSpatialQueryPolygon = {
  /** Packed vertices for one polygon, disjoint polygons, or their holes. Rings close implicitly. */
  positions: GraphDataView<'float32x2'>;
  /** Ring offsets including the terminal vertex offset. All rings use even/odd fill semantics. */
  ringOffsets: GraphDataView<'uint32'>;
};

/** Properties for one point query, with an optional uniform-grid broad phase. */
export type GPUPointSpatialQueryProps = {
  /** Prefix for generated graph-node and transient-resource IDs. */
  id?: string;
  /** Packed source points addressed by zero-based row index. */
  positions: GraphDataView<'float32x2'> | GraphDataView<'float32x3'>;
  /**
   * Optional application IDs aligned one-to-one with `positions`.
   *
   * Outputs use zero-based position-row indices when this view is absent.
   */
  sourceIds?: GraphDataView<'uint32'>;
  /** Optional grid index. Without it the narrow-phase predicate scans all positions. */
  index?: GPUGridIndexView;
  /** Predicate applied during the narrow phase. */
  kind: GPUPointSpatialQueryKind;
  /**
   * Mutable query values.
   *
   * Bounds and polygon queries use `[minimum..., maximum...]`; radius queries use
   * `[center..., radius]`.
   */
  query: GraphDataView<'float32'>;
  /** Polygon rings required for `polygon`; their conservative bounds are supplied in `query`. */
  polygon?: GPUPointSpatialQueryPolygon;
  /** Caller-owned compact query output. */
  output: GPUSpatialQueryOutput;
};

/**
 * Evaluates point bounds, radius, or polygon predicates and appends matching IDs directly.
 *
 * An indexed query first maps its query envelope to a compact rectangular cell range. A GPU-written
 * indirect dispatch launches one workgroup per intersecting cell, so work scales with intersected
 * cells plus candidates instead of the complete index. The result count is safe to consume as an
 * indirect draw count: it is always clamped to `output.ids.length`; `totalCount` remains unclamped
 * over the candidates that refinement examined. An overflowing index makes that candidate set, and
 * therefore `totalCount`, incomplete relative to the original positions.
 * Results contain `sourceIds[rowIndex]` when aligned source IDs are supplied, or row indices by
 * default. Query-facing index entries are always row indices, independent of result identity.
 * Polygon tests use f32 even/odd fill semantics and include points on a ring boundary; they do not
 * provide a robust-topology or four-state classification result.
 */
export class GPUPointSpatialQuery implements GPUCommandGraphContributor {
  readonly id: string;
  readonly positions: GraphDataView<'float32x2'> | GraphDataView<'float32x3'>;
  readonly sourceIds?: GraphDataView<'uint32'>;
  readonly index?: GPUGridIndexView;
  readonly kind: GPUPointSpatialQueryKind;
  readonly query: GraphDataView<'float32'>;
  readonly polygon?: GPUPointSpatialQueryPolygon;
  readonly output: GPUSpatialQueryOutput;
  readonly dimension: 2 | 3;

  /** Creates a query contributor without compiling or submitting GPU work. */
  constructor(props: GPUPointSpatialQueryProps) {
    this.id = props.id ?? 'gpu-point-spatial-query';
    this.positions = props.positions;
    this.sourceIds = props.sourceIds;
    this.index = props.index;
    this.kind = props.kind;
    this.query = props.query;
    this.polygon = props.polygon;
    this.output = props.output;
    this.dimension = this.positions.format === 'float32x2' ? 2 : 3;

    validatePackedView(this.positions, ['float32x2', 'float32x3'], `${this.id} positions`);
    if (this.sourceIds) {
      validatePackedUint32View(this.sourceIds, `${this.id} sourceIds`);
      if (this.sourceIds.length !== this.positions.length) {
        throw new Error(`${this.id} sourceIds.length must equal positions.length`);
      }
    }
    validatePackedView(this.query, ['float32'], `${this.id} query`);
    validateQueryOutput(this.id, this.output);
    if (this.index) validateIndexView(this.id, this.index, this.dimension);

    const expectedQueryLength = this.kind === 'radius' ? this.dimension + 1 : this.dimension * 2;
    if (this.query.length !== expectedQueryLength) {
      throw new Error(`${this.id} ${this.kind} query must contain ${expectedQueryLength} floats`);
    }
    if (this.kind === 'polygon') {
      if (this.dimension !== 2 || !this.polygon) {
        throw new Error(`${this.id} polygon queries require two-dimensional polygon data`);
      }
      validatePackedView(this.polygon.positions, ['float32x2'], `${this.id} polygon positions`);
      validatePackedUint32View(this.polygon.ringOffsets, `${this.id} polygon ringOffsets`);
      if (this.polygon.ringOffsets.length < 2) {
        throw new Error(`${this.id} polygon ringOffsets must contain at least two offsets`);
      }
    } else if (this.polygon) {
      throw new Error(`${this.id} polygon data is only valid for polygon queries`);
    }
    validateDisjointQueryViews(this.id, this);
  }

  /** Adds query preparation, indirect refinement, and count finalization to the target graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const views = [
      this.positions,
      ...(this.sourceIds ? [this.sourceIds] : []),
      this.query,
      this.output.ids,
      this.output.count,
      this.output.overflow,
      ...(this.output.totalCount ? [this.output.totalCount] : []),
      ...(this.index
        ? [this.index.cellOffsets, this.index.rowIndices, this.index.count, this.index.overflow]
        : []),
      ...(this.polygon ? [this.polygon.positions, this.polygon.ringOffsets] : [])
    ];
    if (views.some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }

    const queryStateBuffer = graph.createTransientBuffer({
      id: `${this.id}-state`,
      byteLength: QUERY_STATE_LENGTH * Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE | Buffer.INDIRECT
    });
    const queryState = graph.createDataView(queryStateBuffer, {
      format: 'uint32',
      length: QUERY_STATE_LENGTH
    });
    const resultState = createTransientView(graph, `${this.id}-result-state`, 'uint32', 2);
    addPreparePass(graph, this, queryState, resultState);
    addRefinementPass(graph, this, queryState, resultState);
    addFinalizePass(graph, this, resultState);
  }
}

function addPreparePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  query: GPUPointSpatialQuery,
  queryState: GraphDataView<'uint32'>,
  resultState: GraphDataView<'uint32'>
): void {
  const index = query.index;
  const width = index?.gridSize[0] ?? 1;
  const height = index?.gridSize[1] ?? 1;
  const depth = query.dimension === 3 ? (index?.gridSize[2] ?? 1) : 1;
  const bounds = index?.bounds ?? makeUnindexedBounds(query.dimension);
  const queryEnvelope = makeQueryEnvelope(query);
  const indexedPreparation = index
    ? `
  let clippedMinimum = max(envelopeMinimum, DOMAIN_MINIMUM);
  let clippedMaximum = min(envelopeMaximum, DOMAIN_MAXIMUM);
  valid = valid && all(clippedMinimum <= clippedMaximum);
  if (valid) {
    let mappedMinimumCell = getCell(clippedMinimum);
    let mappedMaximumCell = getCell(clippedMaximum);
    let maximumGridCell = vec3<u32>(WIDTH - 1u, HEIGHT - 1u, DEPTH - 1u);
    // Include the adjacent cells so f32 cell mapping cannot exclude a narrow-phase match at a
    // shared boundary.
    minimumCell = max(mappedMinimumCell, vec3<u32>(1u)) - vec3<u32>(1u);
    maximumCell = min(mappedMaximumCell + vec3<u32>(1u), maximumGridCell);
    cellExtent = maximumCell - minimumCell + vec3<u32>(1u);
    workgroupCount = cellExtent.x * cellExtent.y * cellExtent.z;
  }`
    : `
  if (valid) {
    workgroupCount = divideRoundUp(${query.positions.length}u, ${POINT_QUERY_WORKGROUP_SIZE}u);
  }`;
  const indexOverflowBinding = index
    ? '@group(0) @binding(3) var<storage, read> indexOverflow: array<u32>;'
    : '';
  const initialOverflow = index
    ? `min(indexOverflow[${getViewElementOffset(index.overflow)}u], 1u)`
    : '0u';
  const source = /* wgsl */ `
const QUERY_OFFSET: u32 = ${getViewElementOffset(query.query)}u;
const STATE_OFFSET: u32 = ${getViewElementOffset(queryState)}u;
const RESULT_OFFSET: u32 = ${getViewElementOffset(resultState)}u;
const WIDTH: u32 = ${width}u;
const HEIGHT: u32 = ${height}u;
const DEPTH: u32 = ${depth}u;
const DOMAIN_MINIMUM = vec3<f32>(${getFloatLiteral(bounds[0])}, ${getFloatLiteral(bounds[1])}, ${getFloatLiteral(query.dimension === 3 ? bounds[2]! : 0)});
const DOMAIN_MAXIMUM = vec3<f32>(${getFloatLiteral(bounds[query.dimension])}, ${getFloatLiteral(bounds[query.dimension + 1])}, ${getFloatLiteral(query.dimension === 3 ? bounds[5]! : 0)});
@group(0) @binding(0) var<storage, read> queryValues: array<f32>;
@group(0) @binding(1) var<storage, read_write> queryState: array<u32>;
@group(0) @binding(2) var<storage, read_write> resultState: array<u32>;
${indexOverflowBinding}

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

fn getCoordinate(value: f32, minimum: f32, maximum: f32, size: u32) -> u32 {
  if (maximum == minimum || value <= minimum) { return 0u; }
  if (value >= maximum) { return size - 1u; }
  if (minimum < 0.0 && maximum > 0.0) {
    let scale = max(abs(minimum), abs(maximum));
    let scaledValue = value / scale;
    let scaledMinimum = minimum / scale;
    let scaledMaximum = maximum / scale;
    return min(
      u32((scaledValue - scaledMinimum) / (scaledMaximum - scaledMinimum) * f32(size)),
      size - 1u
    );
  }
  return min(u32((value - minimum) / (maximum - minimum) * f32(size)), size - 1u);
}

fn getCell(position: vec3<f32>) -> vec3<u32> {
  return vec3<u32>(
    getCoordinate(position.x, DOMAIN_MINIMUM.x, DOMAIN_MAXIMUM.x, WIDTH),
    getCoordinate(position.y, DOMAIN_MINIMUM.y, DOMAIN_MAXIMUM.y, HEIGHT),
    getCoordinate(position.z, DOMAIN_MINIMUM.z, DOMAIN_MAXIMUM.z, DEPTH)
  );
}

fn divideRoundUp(value: u32, divisor: u32) -> u32 {
  return value / divisor + select(0u, 1u, value % divisor != 0u);
}

@compute @workgroup_size(1) fn main() {
  ${queryEnvelope}
  var minimumCell = vec3<u32>(0u);
  var maximumCell = vec3<u32>(0u);
  var cellExtent = vec3<u32>(1u);
  var workgroupCount = 0u;
  ${indexedPreparation}
  var dispatchSize = vec3<u32>(0u, 1u, 1u);
  if (workgroupCount > 0u) {
    dispatchSize.x = min(workgroupCount, 65535u);
    let remainingRows = divideRoundUp(workgroupCount, dispatchSize.x);
    dispatchSize.y = min(remainingRows, 256u);
    dispatchSize.z = divideRoundUp(remainingRows, dispatchSize.y);
  }
  queryState[STATE_OFFSET] = dispatchSize.x;
  queryState[STATE_OFFSET + 1u] = dispatchSize.y;
  queryState[STATE_OFFSET + 2u] = dispatchSize.z;
  queryState[STATE_OFFSET + 3u] = minimumCell.x;
  queryState[STATE_OFFSET + 4u] = minimumCell.y;
  queryState[STATE_OFFSET + 5u] = minimumCell.z;
  queryState[STATE_OFFSET + 6u] = cellExtent.x;
  queryState[STATE_OFFSET + 7u] = cellExtent.y;
  queryState[STATE_OFFSET + 8u] = cellExtent.z;
  queryState[STATE_OFFSET + 9u] = workgroupCount;
  queryState[STATE_OFFSET + 10u] = dispatchSize.x;
  queryState[STATE_OFFSET + 11u] = dispatchSize.y;
  resultState[RESULT_OFFSET] = 0u;
  resultState[RESULT_OFFSET + 1u] = ${initialOverflow};
}`;
  const bindings: Record<string, GraphDataView> = {
    queryValues: query.query,
    queryState,
    resultState,
    ...(index ? {indexOverflow: index.overflow} : {})
  };
  addComputationPass(graph, {
    id: `${query.id}-prepare`,
    source,
    resources: [
      {buffer: query.query, usage: 'storage-read'},
      {buffer: queryState, usage: 'storage-write'},
      {buffer: resultState, usage: 'storage-write'},
      ...(index ? ([{buffer: index.overflow, usage: 'storage-read'}] as GraphBufferUse[]) : [])
    ],
    bindings,
    dispatchCount: 1
  });
}

function addRefinementPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  query: GPUPointSpatialQuery,
  queryState: GraphDataView<'uint32'>,
  resultState: GraphDataView<'uint32'>
): void {
  const index = query.index;
  let nextBinding = 1;
  const sourceIdsBinding = query.sourceIds ? nextBinding++ : undefined;
  const queryValuesBinding = query.kind === 'polygon' ? undefined : nextBinding++;
  const queryStateBinding = nextBinding++;
  const cellOffsetsBinding = index ? nextBinding++ : undefined;
  const rowIndicesBinding = index ? nextBinding++ : undefined;
  const resultStateBinding = nextBinding++;
  const outputIdsBinding = nextBinding++;
  const indexedBindings = index
    ? `@group(0) @binding(${cellOffsetsBinding}) var<storage, read> cellOffsets: array<u32>;
@group(0) @binding(${rowIndicesBinding}) var<storage, read> rowIndices: array<u32>;`
    : '';
  const indexedConstants = index
    ? `const CELL_OFFSETS_OFFSET: u32 = ${getViewElementOffset(index.cellOffsets)}u;
const ROW_INDICES_OFFSET: u32 = ${getViewElementOffset(index.rowIndices)}u;
const INDEX_CAPACITY: u32 = ${index.rowIndices.length}u;
const CELL_COUNT: u32 = ${index.cellOffsets.length - 1}u;
const WIDTH: u32 = ${index.gridSize[0]}u;
const HEIGHT: u32 = ${index.gridSize[1]}u;`
    : '';
  const sourceIdsDeclaration = query.sourceIds
    ? `const SOURCE_IDS_OFFSET: u32 = ${getViewElementOffset(query.sourceIds)}u;
@group(0) @binding(${sourceIdsBinding}) var<storage, read> sourceIds: array<u32>;`
    : '';
  const outputSourceId = query.sourceIds
    ? 'let sourceId = sourceIds[SOURCE_IDS_OFFSET + rowIndex];'
    : 'let sourceId = rowIndex;';
  const polygonBindings = query.polygon
    ? `@group(0) @binding(${outputIdsBinding + 1}) var<storage, read> polygonPositions: array<f32>;
@group(0) @binding(${outputIdsBinding + 2}) var<storage, read> ringOffsets: array<u32>;`
    : '';
  const polygonConstants = query.polygon
    ? `const POLYGON_POSITIONS_OFFSET: u32 = ${getViewElementOffset(query.polygon.positions)}u;
const POLYGON_POSITION_COUNT: u32 = ${query.polygon.positions.length}u;
const RING_OFFSETS_OFFSET: u32 = ${getViewElementOffset(query.polygon.ringOffsets)}u;
const RING_COUNT: u32 = ${query.polygon.ringOffsets.length - 1}u;`
    : '';
  const rowSelection = index
    ? `let dispatchWidth = queryState[STATE_OFFSET + 10u];
  let workgroupCount = queryState[STATE_OFFSET + 9u];
  let dispatchRow = workgroupId.z * queryState[STATE_OFFSET + 11u] + workgroupId.y;
  let fullDispatchRows = workgroupCount / dispatchWidth;
  let finalDispatchRowWidth = workgroupCount % dispatchWidth;
  if (dispatchRow > fullDispatchRows ||
      (dispatchRow == fullDispatchRows &&
       (finalDispatchRowWidth == 0u || workgroupId.x >= finalDispatchRowWidth))) { return; }
  let cellOrdinal = dispatchRow * dispatchWidth + workgroupId.x;
  let extentX = queryState[STATE_OFFSET + 6u];
  let extentY = queryState[STATE_OFFSET + 7u];
  let localX = cellOrdinal % extentX;
  let localY = (cellOrdinal / extentX) % extentY;
  let localZ = cellOrdinal / (extentX * extentY);
  let column = queryState[STATE_OFFSET + 3u] + localX;
  let row = queryState[STATE_OFFSET + 4u] + localY;
  let layer = queryState[STATE_OFFSET + 5u] + localZ;
  let cellIndex = (layer * HEIGHT + row) * WIDTH + column;
  let storedCount = min(cellOffsets[CELL_OFFSETS_OFFSET + CELL_COUNT], INDEX_CAPACITY);
  let cellStart = min(cellOffsets[CELL_OFFSETS_OFFSET + cellIndex], storedCount);
  let cellEnd = min(cellOffsets[CELL_OFFSETS_OFFSET + cellIndex + 1u], storedCount);
  var candidateIndex = cellStart + localId.x;
  loop {
    if (candidateIndex >= cellEnd) { break; }
    let rowIndex = rowIndices[ROW_INDICES_OFFSET + candidateIndex];
    testRow(rowIndex);
    candidateIndex += ${POINT_QUERY_WORKGROUP_SIZE}u;
  }`
    : `let dispatchWidth = queryState[STATE_OFFSET + 10u];
  let workgroupCount = queryState[STATE_OFFSET + 9u];
  let dispatchRow = workgroupId.z * queryState[STATE_OFFSET + 11u] + workgroupId.y;
  let fullDispatchRows = workgroupCount / dispatchWidth;
  let finalDispatchRowWidth = workgroupCount % dispatchWidth;
  if (dispatchRow > fullDispatchRows ||
      (dispatchRow == fullDispatchRows &&
       (finalDispatchRowWidth == 0u || workgroupId.x >= finalDispatchRowWidth))) { return; }
  let workgroupOrdinal = dispatchRow * dispatchWidth + workgroupId.x;
  let rowIndex = workgroupOrdinal * ${POINT_QUERY_WORKGROUP_SIZE}u + localId.x;
  if (rowIndex < POSITION_COUNT) { testRow(rowIndex); }`;
  const predicate = makeExactPredicate(query);
  const source = /* wgsl */ `
const POSITION_COUNT: u32 = ${query.positions.length}u;
const POSITIONS_OFFSET: u32 = ${getViewElementOffset(query.positions)}u;
const QUERY_OFFSET: u32 = ${getViewElementOffset(query.query)}u;
const STATE_OFFSET: u32 = ${getViewElementOffset(queryState)}u;
const RESULT_OFFSET: u32 = ${getViewElementOffset(resultState)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(query.output.ids)}u;
const OUTPUT_CAPACITY: u32 = ${query.output.ids.length}u;
${indexedConstants}
${polygonConstants}
@group(0) @binding(0) var<storage, read> positions: array<f32>;
${sourceIdsDeclaration}
${queryValuesBinding === undefined ? '' : `@group(0) @binding(${queryValuesBinding}) var<storage, read> queryValues: array<f32>;`}
@group(0) @binding(${queryStateBinding}) var<storage, read> queryState: array<u32>;
${indexedBindings}
@group(0) @binding(${resultStateBinding}) var<storage, read_write> resultState: array<atomic<u32>>;
@group(0) @binding(${outputIdsBinding}) var<storage, read_write> outputIds: array<u32>;
${polygonBindings}

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

${makePolygonHelpers(query)}

fn appendRow(rowIndex: u32) {
  let outputIndex = atomicAdd(&resultState[RESULT_OFFSET], 1u);
  if (outputIndex < OUTPUT_CAPACITY) {
    ${outputSourceId}
    outputIds[OUTPUT_OFFSET + outputIndex] = sourceId;
  } else {
    atomicStore(&resultState[RESULT_OFFSET + 1u], 1u);
  }
}

fn testRow(rowIndex: u32) {
  if (rowIndex >= POSITION_COUNT) { return; }
  ${predicate}
  if (selected) { appendRow(rowIndex); }
}

@compute @workgroup_size(${POINT_QUERY_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  ${rowSelection}
}`;
  const bindings: Record<string, GraphDataView> = {
    positions: query.positions,
    ...(query.sourceIds ? {sourceIds: query.sourceIds} : {}),
    ...(queryValuesBinding === undefined ? {} : {queryValues: query.query}),
    queryState,
    ...(index
      ? {
          cellOffsets: index.cellOffsets,
          rowIndices: index.rowIndices
        }
      : {}),
    resultState,
    outputIds: query.output.ids,
    ...(query.polygon
      ? {
          polygonPositions: query.polygon.positions,
          ringOffsets: query.polygon.ringOffsets
        }
      : {})
  };
  graph.addComputePass({
    id: `${query.id}-refine`,
    resources: [
      {buffer: query.positions, usage: 'storage-read'},
      ...(query.sourceIds
        ? ([{buffer: query.sourceIds, usage: 'storage-read'}] as GraphBufferUse[])
        : []),
      ...(queryValuesBinding === undefined
        ? []
        : ([{buffer: query.query, usage: 'storage-read'}] as GraphBufferUse[])),
      {buffer: queryState, usage: 'storage-read'},
      {buffer: queryState, usage: 'indirect'},
      ...(index
        ? ([
            {buffer: index.cellOffsets, usage: 'storage-read'},
            {buffer: index.rowIndices, usage: 'storage-read'}
          ] as GraphBufferUse[])
        : []),
      {buffer: resultState, usage: 'storage-read-write'},
      {buffer: query.output.ids, usage: 'storage-write'},
      ...(query.polygon
        ? ([
            {buffer: query.polygon.positions, usage: 'storage-read'},
            {buffer: query.polygon.ringOffsets, usage: 'storage-read'}
          ] as GraphBufferUse[])
        : [])
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: `${query.id}-refine`,
        source,
        shaderLayout: {
          bindings: Object.keys(bindings).map((name, location) => ({
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
          for (const [name, view] of Object.entries(bindings)) {
            resolvedBindings[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(resolvedBindings);
          computation.dispatchIndirect(computePass, getBuffer(queryState), queryState.byteOffset);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function addFinalizePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  query: GPUPointSpatialQuery,
  resultState: GraphDataView<'uint32'>
): void {
  const totalCountDeclaration = query.output.totalCount
    ? `const TOTAL_OFFSET: u32 = ${getViewElementOffset(query.output.totalCount)}u;
@group(0) @binding(3) var<storage, read_write> outputTotalCount: array<u32>;`
    : '';
  const totalCountWrite = query.output.totalCount ? 'outputTotalCount[TOTAL_OFFSET] = total;' : '';
  const source = /* wgsl */ `
const RESULT_OFFSET: u32 = ${getViewElementOffset(resultState)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(query.output.count)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(query.output.overflow)}u;
const OUTPUT_CAPACITY: u32 = ${query.output.ids.length}u;
@group(0) @binding(0) var<storage, read> resultState: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputCount: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputOverflow: array<u32>;
${totalCountDeclaration}
@compute @workgroup_size(1) fn main() {
  let total = resultState[RESULT_OFFSET];
  outputCount[COUNT_OFFSET] = min(total, OUTPUT_CAPACITY);
  outputOverflow[OVERFLOW_OFFSET] = max(
    resultState[RESULT_OFFSET + 1u],
    select(0u, 1u, total > OUTPUT_CAPACITY)
  );
  ${totalCountWrite}
}`;
  addComputationPass(graph, {
    id: `${query.id}-finalize`,
    source,
    resources: [
      {buffer: resultState, usage: 'storage-read'},
      {buffer: query.output.count, usage: 'storage-write'},
      {buffer: query.output.overflow, usage: 'storage-write'},
      ...(query.output.totalCount
        ? ([{buffer: query.output.totalCount, usage: 'storage-write'}] as GraphBufferUse[])
        : [])
    ],
    bindings: {
      resultState,
      outputCount: query.output.count,
      outputOverflow: query.output.overflow,
      ...(query.output.totalCount ? {outputTotalCount: query.output.totalCount} : {})
    },
    dispatchCount: 1
  });
}

function makeQueryEnvelope(query: GPUPointSpatialQuery): string {
  const components = query.dimension === 2 ? ['x', 'y'] : ['x', 'y', 'z'];
  if (query.kind === 'radius') {
    const center = components
      .map(
        (component, componentIndex) =>
          `let center${component.toUpperCase()} = queryValues[QUERY_OFFSET + ${componentIndex}u];`
      )
      .join('\n  ');
    const validity = components
      .map(component => `finite(center${component.toUpperCase()})`)
      .join(' && ');
    return `${center}
  let radius = queryValues[QUERY_OFFSET + ${query.dimension}u];
  let envelopeMinimum = vec3<f32>(centerX - radius, centerY - radius, ${query.dimension === 3 ? 'centerZ - radius' : '0.0'});
  let envelopeMaximum = vec3<f32>(centerX + radius, centerY + radius, ${query.dimension === 3 ? 'centerZ + radius' : '0.0'});
  var valid = ${validity} && finite(radius) && radius >= 0.0;`;
  }
  const minimum = components
    .map((component, componentIndex) => {
      return `let minimum${component.toUpperCase()} = queryValues[QUERY_OFFSET + ${componentIndex}u];`;
    })
    .join('\n  ');
  const maximum = components
    .map((component, componentIndex) => {
      return `let maximum${component.toUpperCase()} = queryValues[QUERY_OFFSET + ${componentIndex + query.dimension}u];`;
    })
    .join('\n  ');
  const validity = components
    .map(component => {
      const upper = component.toUpperCase();
      return `finite(minimum${upper}) && finite(maximum${upper}) && minimum${upper} <= maximum${upper}`;
    })
    .join(' && ');
  return `${minimum}
  ${maximum}
  let envelopeMinimum = vec3<f32>(minimumX, minimumY, ${query.dimension === 3 ? 'minimumZ' : '0.0'});
  let envelopeMaximum = vec3<f32>(maximumX, maximumY, ${query.dimension === 3 ? 'maximumZ' : '0.0'});
  var valid = ${validity};`;
}

function makeExactPredicate(query: GPUPointSpatialQuery): string {
  const axes = ['X', 'Y', ...(query.dimension === 3 ? ['Z'] : [])];
  const positions = axes
    .map(
      (axis, axisIndex) =>
        `let position${axis} = positions[POSITIONS_OFFSET + rowIndex * ${query.dimension}u + ${axisIndex}u];`
    )
    .join('\n  ');
  const finitePosition = axes.map(axis => `finite(position${axis})`).join(' && ');
  if (query.kind === 'radius') {
    const centers = axes
      .map((axis, axisIndex) => `let center${axis} = queryValues[QUERY_OFFSET + ${axisIndex}u];`)
      .join('\n  ');
    const finiteCenter = axes.map(axis => `finite(center${axis})`).join(' && ');
    const deltas = axes
      .map(axis => `let delta${axis} = position${axis} - center${axis};`)
      .join('\n  ');
    const finiteDeltas = axes.map(axis => `finite(delta${axis})`).join(' && ');
    const scale = makeNestedMaximum(['radius', ...axes.map(axis => `abs(delta${axis})`)]);
    const squaredDistance = axes
      .map(axis => `(delta${axis} / scale) * (delta${axis} / scale)`)
      .join(' + ');
    return `${positions}
  ${centers}
  ${deltas}
  let radius = queryValues[QUERY_OFFSET + ${query.dimension}u];
  let scale = ${scale};
  let squaredDistance = ${squaredDistance};
  let squaredRadius = (radius / scale) * (radius / scale);
  // The operands are delta-scale-normalized; eight f32 epsilons cover subtraction,
  // multiplication, and accumulation rounding at an inclusive boundary.
  let comparisonTolerance =
    (abs(squaredDistance) + abs(squaredRadius)) * 9.5367431640625e-7;
  let selected = ${finitePosition} && ${finiteCenter} && ${finiteDeltas} && finite(radius) && radius >= 0.0 && (scale == 0.0 || squaredDistance <= squaredRadius + comparisonTolerance);`;
  }
  if (query.kind === 'polygon') {
    return `${positions}
  let selected = ${finitePosition} && pointInPolygon(vec2<f32>(positionX, positionY));`;
  }
  const bounds = axes
    .map(
      (axis, axisIndex) =>
        `let minimum${axis} = queryValues[QUERY_OFFSET + ${axisIndex}u];
  let maximum${axis} = queryValues[QUERY_OFFSET + ${axisIndex + query.dimension}u];`
    )
    .join('\n  ');
  const validBounds = axes
    .map(
      axis => `finite(minimum${axis}) && finite(maximum${axis}) && minimum${axis} <= maximum${axis}`
    )
    .join(' && ');
  const inside = axes
    .map(axis => `position${axis} >= minimum${axis} && position${axis} <= maximum${axis}`)
    .join(' && ');
  return `${positions}
  ${bounds}
  let selected = ${finitePosition} && ${validBounds} && ${inside};`;
}

function makePolygonHelpers(query: GPUPointSpatialQuery): string {
  if (!query.polygon) return '';
  return /* wgsl */ `
fn readPolygonPosition(index: u32) -> vec2<f32> {
  let offset = POLYGON_POSITIONS_OFFSET + index * 2u;
  return vec2<f32>(polygonPositions[offset], polygonPositions[offset + 1u]);
}

fn pointOnSegment(point: vec2<f32>, start: vec2<f32>, end: vec2<f32>) -> bool {
  let segment = end - start;
  let relative = point - start;
  let leftProduct = segment.x * relative.y;
  let rightProduct = segment.y * relative.x;
  let crossProduct = leftProduct - rightProduct;
  let tolerance = max(1.0e-12, (abs(leftProduct) + abs(rightProduct)) * 9.5367431640625e-7);
  return abs(crossProduct) <= tolerance &&
    dot(relative, point - end) <= 0.0;
}

fn pointInPolygon(point: vec2<f32>) -> bool {
  var inside = false;
  for (var ring = 0u; ring < RING_COUNT; ring++) {
    let first = min(ringOffsets[RING_OFFSETS_OFFSET + ring], POLYGON_POSITION_COUNT);
    let end = min(ringOffsets[RING_OFFSETS_OFFSET + ring + 1u], POLYGON_POSITION_COUNT);
    if (end <= first) { continue; }
    var previous = readPolygonPosition(end - 1u);
    if (!finite(previous.x) || !finite(previous.y)) { return false; }
    for (var vertexIndex = first; vertexIndex < end; vertexIndex++) {
      let current = readPolygonPosition(vertexIndex);
      if (!finite(current.x) || !finite(current.y)) { return false; }
      if (pointOnSegment(point, previous, current)) { return true; }
      if ((current.y > point.y) != (previous.y > point.y)) {
        let intersectionX = (previous.x - current.x) * (point.y - current.y) /
          (previous.y - current.y) + current.x;
        if (point.x < intersectionX) { inside = !inside; }
      }
      previous = current;
    }
  }
  return inside;
}`;
}

function validateQueryOutput(id: string, output: GPUSpatialQueryOutput): void {
  validatePackedUint32View(output.ids, `${id} output ids`);
  validatePackedUint32View(output.count, `${id} output count`);
  validatePackedUint32View(output.overflow, `${id} output overflow`);
  if (output.totalCount) validatePackedUint32View(output.totalCount, `${id} output totalCount`);
  if (
    output.count.length < 1 ||
    output.overflow.length < 1 ||
    (output.totalCount && output.totalCount.length < 1)
  ) {
    throw new Error(`${id} output count, overflow, and totalCount must contain one uint32 row`);
  }
}

function validateDisjointQueryViews(id: string, query: GPUPointSpatialQuery): void {
  const inputs: [string, GraphDataView][] = [
    ['positions', query.positions],
    ...(query.sourceIds ? ([['sourceIds', query.sourceIds]] as [string, GraphDataView][]) : []),
    ['query', query.query],
    ...(query.index
      ? ([
          ['index cellOffsets', query.index.cellOffsets],
          ['index rowIndices', query.index.rowIndices],
          ['index count', query.index.count],
          ['index overflow', query.index.overflow]
        ] as [string, GraphDataView][])
      : []),
    ...(query.polygon
      ? ([
          ['polygon positions', query.polygon.positions],
          ['polygon ringOffsets', query.polygon.ringOffsets]
        ] as [string, GraphDataView][])
      : [])
  ];
  const outputs = [
    ['ids', query.output.ids],
    ['count', query.output.count],
    ['overflow', query.output.overflow],
    ...(query.output.totalCount
      ? ([['totalCount', query.output.totalCount]] as [string, GraphDataView][])
      : [])
  ] as [string, GraphDataView][];
  for (let outputIndex = 0; outputIndex < outputs.length; outputIndex++) {
    const [outputName, output] = outputs[outputIndex];
    for (const [inputName, input] of inputs) {
      if (doQueryBindingFootprintsOverlap(output, input)) {
        throw new Error(`${id} output ${outputName} and ${inputName} must not overlap`);
      }
    }
    for (let previousIndex = 0; previousIndex < outputIndex; previousIndex++) {
      if (doQueryBindingFootprintsOverlap(output, outputs[previousIndex][1])) {
        throw new Error(
          `${id} output ${outputName} and output ${outputs[previousIndex][0]} must not overlap`
        );
      }
    }
  }
}

/** Returns whether two query views occupy any of the bytes made available to their bindings. */
function doQueryBindingFootprintsOverlap(first: GraphDataView, second: GraphDataView): boolean {
  const firstDefaultBuffer = getDefaultCoreBuffer(first);
  const secondDefaultBuffer = getDefaultCoreBuffer(second);
  if (
    first.buffer !== second.buffer &&
    firstDefaultBuffer !== undefined &&
    firstDefaultBuffer === secondDefaultBuffer
  ) {
    // Separate logical handles cannot safely describe hazards on one physical allocation.
    return true;
  }
  if (first.buffer !== second.buffer) {
    return false;
  }

  const firstRange = getViewBindingRange(first);
  const secondRange = getViewBindingRange(second);
  const firstEnd = firstRange.offset + firstRange.size;
  const secondEnd = secondRange.offset + secondRange.size;
  return firstRange.offset < secondEnd && secondRange.offset < firstEnd;
}

function getDefaultCoreBuffer(view: GraphDataView): Buffer | undefined {
  const defaultBuffer = view.buffer.defaultBuffer;
  return defaultBuffer instanceof DynamicBuffer ? defaultBuffer.buffer : defaultBuffer;
}

function validateIndexView(id: string, index: GPUGridIndexView, dimension: 2 | 3): void {
  if (index.gridSize.length !== dimension || index.bounds.length !== dimension * 2) {
    throw new Error(`${id} positions, index gridSize, and bounds must have matching dimensions`);
  }
  if (index.gridSize.some(size => !Number.isSafeInteger(size) || size <= 0)) {
    throw new Error(`${id} index gridSize must contain positive integers`);
  }
  if (
    !index.bounds.every(Number.isFinite) ||
    Array.from({length: dimension}, (_, axis) => axis).some(
      axis => index.bounds[axis] > index.bounds[axis + dimension]
    )
  ) {
    throw new Error(`${id} index bounds must contain finite ordered minima and maxima`);
  }
  const cellCount = index.gridSize.reduce((product, size) => product * size, 1);
  for (const [name, view] of [
    ['cellOffsets', index.cellOffsets],
    ['rowIndices', index.rowIndices],
    ['count', index.count],
    ['overflow', index.overflow]
  ] as const) {
    validatePackedUint32View(view, `${id} index ${name}`);
  }
  if (index.cellOffsets.length !== cellCount + 1) {
    throw new Error(`${id} index cellOffsets.length must equal cellCount + 1`);
  }
  if (index.count.length < 1 || index.overflow.length < 1) {
    throw new Error(`${id} index count and overflow must each contain one uint32 row`);
  }
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

function makeUnindexedBounds(dimension: 2 | 3): GPUGridIndexBounds {
  return dimension === 2 ? [0, 0, 0, 0] : [0, 0, 0, 0, 0, 0];
}

function makeNestedMaximum(values: string[]): string {
  return values.slice(1).reduce((maximum, value) => `max(${maximum}, ${value})`, values[0]);
}

function getFloatLiteral(value: number): string {
  return Number.isInteger(value) ? `${value}.0` : `${value}`;
}
