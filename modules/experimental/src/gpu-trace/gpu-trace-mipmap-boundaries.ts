// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUGallopingSearch} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUCommandGraph,
  type GPUCommandGraphContributor,
  type GraphBufferUse,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource,
  type GPUBoundedDispatchLayout
} from '@luma.gl/gpgpu/gpu-core';
import {
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from '@luma.gl/gpgpu/gpu-core';

const MIPMAP_BOUNDARY_WORKGROUP_SIZE = 64;
const DEFAULT_BOUNDARIES_PER_TILE = 32;
const MAXIMUM_BOUNDARIES_PER_TILE = 256;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

/** Query controls for regularly spaced trace-time pixel boundaries. */
export type GPUTraceMipmapBoundaryQuery = {
  /** Packed `[firstBoundaryTime, timePerPixel]`, updated without recompiling the graph. */
  domain: GraphDataView<'float32'>;
  /** Number of active pixels, from zero through `maximumPixelCount`. */
  pixelCount: GraphDataView<'uint32'>;
};

/** Properties for one segmented batch of monotonic lower-bound queries. */
export type GPUTraceMipmapBoundariesProps = {
  /** Diagnostic prefix for the generated graph nodes. */
  id?: string;
  /** Scalar span start times, sorted directly or through startTimeOrder within every segment. */
  startTimes: GraphDataView<'float32'>;
  /** Optional packed sorted row indices into startTimes. */
  startTimeOrder?: GraphDataView<'uint32'>;
  /** Packed monotonic segment offsets with one trailing sentinel. */
  segmentOffsets: GraphDataView<'uint32'>;
  /** Dynamic trace-time query controls. */
  query: GPUTraceMipmapBoundaryQuery;
  /** Maximum number of pixels reserved per segment. */
  maximumPixelCount: number;
  /** Number of consecutive boundaries searched by one shader invocation. Defaults to 32. */
  boundariesPerTile?: number;
  /** Packed segment-major lower-bound positions with `(maximumPixelCount + 1)` rows per segment. */
  output: GraphDataView<'uint32'>;
  /** One validation word. Bit 1 reports an invalid domain; bit 2 invalid offsets. */
  validationErrors: GraphDataView<'uint32'>;
};

/** Immutable capacity and dispatch information for a batched trace-time boundary query. */
export type GPUTraceMipmapBoundariesStats = {
  /** Number of independently sorted lane/depth segments. */
  segmentCount: number;
  /** Maximum number of pixel ranges emitted for each segment. */
  maximumPixelCount: number;
  /** Number of monotonic boundaries handled by one shader invocation. */
  boundariesPerTile: number;
  /** Maximum independent segment/tile searches used by one query. */
  maximumSearchCount: number;
};

/**
 * Generates regular trace-time pixel queries and resolves them through {@link GPUGallopingSearch}.
 *
 * gpu-trace owns the pixel domain and lane/depth segment semantics. The generic primitive owns
 * segmented batched lower bounds: each tile starts with binary search and then gallops forward
 * through its remaining nondecreasing queries.
 */
export class GPUTraceMipmapBoundaries implements GPUCommandGraphContributor {
  readonly id: string;
  readonly startTimes: GraphDataView<'float32'>;
  readonly startTimeOrder?: GraphDataView<'uint32'>;
  readonly segmentOffsets: GraphDataView<'uint32'>;
  readonly query: GPUTraceMipmapBoundaryQuery;
  readonly output: GraphDataView<'uint32'>;
  readonly validationErrors: GraphDataView<'uint32'>;
  readonly stats: Readonly<GPUTraceMipmapBoundariesStats>;

  constructor(props: GPUTraceMipmapBoundariesProps) {
    this.id = props.id ?? 'gpu-trace-mipmap-boundaries';
    this.startTimes = props.startTimes;
    this.startTimeOrder = props.startTimeOrder;
    this.segmentOffsets = props.segmentOffsets;
    this.query = props.query;
    this.output = props.output;
    this.validationErrors = props.validationErrors;

    validateScalarFloat32View(this.startTimes, `${this.id} startTimes`);
    if (this.startTimeOrder) {
      validatePackedUint32View(this.startTimeOrder, `${this.id} startTimeOrder`);
    }
    validatePackedUint32View(this.segmentOffsets, `${this.id} segmentOffsets`);
    validatePackedView(this.query.domain, ['float32'], `${this.id} query domain`);
    validatePackedUint32View(this.query.pixelCount, `${this.id} query pixelCount`);
    validatePackedUint32View(this.output, `${this.id} output`);
    validatePackedUint32View(this.validationErrors, `${this.id} validationErrors`);
    if (this.segmentOffsets.length < 2) {
      throw new Error(`${this.id} segmentOffsets must contain at least one segment and sentinel`);
    }
    if (this.query.domain.length !== 2 || this.query.pixelCount.length !== 1) {
      throw new Error(`${this.id} query must contain two domain values and one pixel count`);
    }
    if (this.validationErrors.length !== 1) {
      throw new Error(`${this.id} validationErrors must contain one uint32`);
    }
    if (!Number.isSafeInteger(props.maximumPixelCount) || props.maximumPixelCount < 1) {
      throw new Error(`${this.id} maximumPixelCount must be a positive safe integer`);
    }
    const boundariesPerTile = props.boundariesPerTile ?? DEFAULT_BOUNDARIES_PER_TILE;
    if (
      !Number.isSafeInteger(boundariesPerTile) ||
      boundariesPerTile < 1 ||
      boundariesPerTile > MAXIMUM_BOUNDARIES_PER_TILE
    ) {
      throw new Error(
        `${this.id} boundariesPerTile must be an integer from 1 through ${MAXIMUM_BOUNDARIES_PER_TILE}`
      );
    }
    const segmentCount = this.segmentOffsets.length - 1;
    const outputRowsPerSegment = props.maximumPixelCount + 1;
    const requiredOutputLength = segmentCount * outputRowsPerSegment;
    if (
      !Number.isSafeInteger(requiredOutputLength) ||
      this.output.length !== requiredOutputLength
    ) {
      throw new Error(
        `${this.id} output must contain exactly segmentCount * (maximumPixelCount + 1) rows`
      );
    }
    const sources = [
      this.startTimes,
      ...(this.startTimeOrder ? [this.startTimeOrder] : []),
      this.segmentOffsets,
      this.query.domain,
      this.query.pixelCount
    ];
    if (
      sources.some(view => view.buffer === this.output.buffer) ||
      sources.some(view => view.buffer === this.validationErrors.buffer) ||
      this.output.buffer === this.validationErrors.buffer
    ) {
      throw new Error(`${this.id} sources, output, and validationErrors must use separate buffers`);
    }
    const tilesPerSegment = Math.ceil(outputRowsPerSegment / boundariesPerTile);
    this.stats = Object.freeze({
      segmentCount,
      maximumPixelCount: props.maximumPixelCount,
      boundariesPerTile,
      maximumSearchCount: segmentCount * tilesPerSegment
    });
  }

  /** Adds regular query generation and generic tiled lower-bound search to the target graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const view of [
      this.startTimes,
      ...(this.startTimeOrder ? [this.startTimeOrder] : []),
      this.segmentOffsets,
      this.query.domain,
      this.query.pixelCount,
      this.output,
      this.validationErrors
    ]) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }

    const queryTimes = graph.createDataView(
      graph.createTransientBuffer({
        id: `${this.id}-query-times`,
        byteLength: this.output.length * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE
      }),
      {format: 'float32', length: this.output.length}
    );
    const searchSegments = graph.createDataView(
      graph.createTransientBuffer({
        id: `${this.id}-search-segments`,
        byteLength: this.stats.segmentCount * 4 * UINT32_BYTE_LENGTH,
        usage: Buffer.STORAGE
      }),
      {format: 'uint32', length: this.stats.segmentCount * 4}
    );

    addValidationClearPass(graph, this);
    addPixelQueryPreparationPass(graph, this, queryTimes, searchSegments);
    new GPUGallopingSearch({
      id: `${this.id}-galloping-search`,
      values: this.startTimes,
      valueOrder: this.startTimeOrder,
      queries: queryTimes,
      segments: searchSegments,
      maximumQueryCount: this.stats.maximumPixelCount + 1,
      queriesPerTile: this.stats.boundariesPerTile,
      output: this.output,
      validationErrors: this.validationErrors,
      preserveValidationErrors: true
    }).addToGraph(graph);
  }
}

function addValidationClearPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  query: GPUTraceMipmapBoundaries
): void {
  const source = /* wgsl */ `
const ERROR_OFFSET: u32 = ${getViewElementOffset(query.validationErrors)}u;
@group(0) @binding(0) var<storage, read_write> errors: array<u32>;
@compute @workgroup_size(1) fn main() { errors[ERROR_OFFSET] = 0u; }`;
  graph.addComputePass({
    id: `${query.id}-clear-validation`,
    resources: [{buffer: query.validationErrors, usage: 'storage-write'}],
    workload: {
      operation: 'GPUTraceMipmapBoundaries',
      commandCount: 1,
      maximumWorkgroupCount: 1,
      maximumInvocationCount: 1
    },
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: `${query.id}-clear-validation`,
        source,
        shaderLayout: {
          bindings: [{name: 'errors', type: 'storage', group: 0, location: 0}]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          computation.setBindings({errors: getViewBinding(query.validationErrors, getBuffer)});
          computation.dispatch(computePass, 1);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function addPixelQueryPreparationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  query: GPUTraceMipmapBoundaries,
  queryTimes: GraphDataView<'float32'>,
  searchSegments: GraphDataView<'uint32'>
): void {
  const {stats} = query;
  const rowsPerSegment = stats.maximumPixelCount + 1;
  const tilesPerSegment = Math.ceil(rowsPerSegment / stats.boundariesPerTile);
  const dispatchLayout = getBoundedDispatchLayout(
    `${query.id}-prepare`,
    stats.maximumSearchCount,
    MIPMAP_BOUNDARY_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const START_COUNT: u32 = ${query.startTimeOrder?.length ?? query.startTimes.length}u;
const SEGMENT_COUNT: u32 = ${stats.segmentCount}u;
const MAXIMUM_PIXEL_COUNT: u32 = ${stats.maximumPixelCount}u;
const ROWS_PER_SEGMENT: u32 = ${rowsPerSegment}u;
const BOUNDARIES_PER_TILE: u32 = ${stats.boundariesPerTile}u;
const TILES_PER_SEGMENT: u32 = ${tilesPerSegment}u;
const JOB_COUNT: u32 = ${stats.maximumSearchCount}u;
const SOURCE_SEGMENT_OFFSET: u32 = ${getViewElementOffset(query.segmentOffsets)}u;
const DOMAIN_OFFSET: u32 = ${getViewElementOffset(query.query.domain)}u;
const PIXEL_COUNT_OFFSET: u32 = ${getViewElementOffset(query.query.pixelCount)}u;
const QUERY_TIME_OFFSET: u32 = ${getViewElementOffset(queryTimes)}u;
const SEARCH_SEGMENT_OFFSET: u32 = ${getViewElementOffset(searchSegments)}u;
const ERROR_OFFSET: u32 = ${getViewElementOffset(query.validationErrors)}u;

@group(0) @binding(0) var<storage, read> sourceSegmentOffsets: array<u32>;
@group(0) @binding(1) var<storage, read> domain: array<f32>;
@group(0) @binding(2) var<storage, read> pixelCounts: array<u32>;
@group(0) @binding(3) var<storage, read_write> queryTimes: array<f32>;
@group(0) @binding(4) var<storage, read_write> searchSegments: array<u32>;
@group(0) @binding(5) var<storage, read_write> validationErrors: array<atomic<u32>>;

@compute @workgroup_size(${MIPMAP_BOUNDARY_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, MIPMAP_BOUNDARY_WORKGROUP_SIZE)}
  if (index >= JOB_COUNT) { return; }
  let segmentIndex = index / TILES_PER_SEGMENT;
  let tileIndex = index % TILES_PER_SEGMENT;
  if (segmentIndex >= SEGMENT_COUNT) { return; }

  let sourceStart = sourceSegmentOffsets[SOURCE_SEGMENT_OFFSET + segmentIndex];
  let sourceEnd = sourceSegmentOffsets[SOURCE_SEGMENT_OFFSET + segmentIndex + 1u];
  let firstBoundaryTime = domain[DOMAIN_OFFSET];
  let timePerPixel = domain[DOMAIN_OFFSET + 1u];
  let validOffsets = sourceStart <= sourceEnd && sourceEnd <= START_COUNT;
  let validDomain = firstBoundaryTime == firstBoundaryTime && timePerPixel == timePerPixel &&
    abs(firstBoundaryTime) <= 3.402823466e+38 &&
    abs(timePerPixel) <= 3.402823466e+38 && timePerPixel > 0.0;
  let segmentQueryOffset = segmentIndex * ROWS_PER_SEGMENT;
  let descriptor = SEARCH_SEGMENT_OFFSET + segmentIndex * 4u;
  let activePixelCount = min(pixelCounts[PIXEL_COUNT_OFFSET], MAXIMUM_PIXEL_COUNT);

  if (tileIndex == 0u) {
    searchSegments[descriptor + 2u] = segmentQueryOffset;
    if (validOffsets) {
      searchSegments[descriptor] = sourceStart;
      searchSegments[descriptor + 1u] = sourceEnd - sourceStart;
      searchSegments[descriptor + 3u] = select(0u, activePixelCount + 1u, validDomain);
    } else {
      searchSegments[descriptor] = 0u;
      searchSegments[descriptor + 1u] = 0u;
      searchSegments[descriptor + 3u] = 0u;
    }
  }
  if (!validOffsets) {
    atomicOr(&validationErrors[ERROR_OFFSET], 2u);
    return;
  }
  if (!validDomain) {
    atomicOr(&validationErrors[ERROR_OFFSET], 1u);
    return;
  }

  let firstBoundaryIndex = tileIndex * BOUNDARIES_PER_TILE;
  if (firstBoundaryIndex > activePixelCount) { return; }
  for (var tileOffset = 0u; tileOffset < BOUNDARIES_PER_TILE; tileOffset++) {
    let boundaryIndex = firstBoundaryIndex + tileOffset;
    if (boundaryIndex > activePixelCount || boundaryIndex >= ROWS_PER_SEGMENT) { break; }
    queryTimes[QUERY_TIME_OFFSET + segmentQueryOffset + boundaryIndex] =
      firstBoundaryTime + f32(boundaryIndex) * timePerPixel;
  }
}`;
  addPreparationComputationPass(graph, query, queryTimes, searchSegments, source, dispatchLayout);
}

function validateScalarFloat32View(
  view: GraphDataView,
  name: string
): asserts view is GraphDataView<'float32'> {
  if (
    view.format !== 'float32' ||
    view.rowByteLength !== UINT32_BYTE_LENGTH ||
    view.byteStride < UINT32_BYTE_LENGTH ||
    view.byteStride % UINT32_BYTE_LENGTH !== 0 ||
    view.byteOffset % UINT32_BYTE_LENGTH !== 0
  ) {
    throw new Error(`${name} must be uint32-aligned float32 scalar GPU data`);
  }
}

function addPreparationComputationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  query: GPUTraceMipmapBoundaries,
  queryTimes: GraphDataView<'float32'>,
  searchSegments: GraphDataView<'uint32'>,
  source: string,
  dispatchLayout: GPUBoundedDispatchLayout
): void {
  const bindings = {
    sourceSegmentOffsets: query.segmentOffsets,
    domain: query.query.domain,
    pixelCounts: query.query.pixelCount,
    queryTimes,
    searchSegments,
    validationErrors: query.validationErrors
  };
  const resources: GraphBufferUse[] = [
    {buffer: query.segmentOffsets, usage: 'storage-read'},
    {buffer: query.query.domain, usage: 'storage-read'},
    {buffer: query.query.pixelCount, usage: 'storage-read'},
    {buffer: queryTimes, usage: 'storage-write'},
    {buffer: searchSegments, usage: 'storage-write'},
    {buffer: query.validationErrors, usage: 'storage-read-write'}
  ];
  graph.addComputePass({
    id: `${query.id}-prepare`,
    resources,
    workload: {
      operation: 'GPUTraceMipmapBoundaries',
      commandCount: 1,
      maximumWorkgroupCount: dispatchLayout.x * dispatchLayout.y * dispatchLayout.z,
      maximumInvocationCount:
        dispatchLayout.x * dispatchLayout.y * dispatchLayout.z * MIPMAP_BOUNDARY_WORKGROUP_SIZE
    },
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: `${query.id}-prepare`,
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
          computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}
