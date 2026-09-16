// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type GPUCommandNode, createGPUComputeCommandNode} from './gpu-command-node';
import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  type GraphBufferUse,
  type GraphDataView,
  GraphVectorView
} from './gpu-command-graph';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource,
  type GPUBoundedDispatchLayout
} from './gpu-dispatch-utils';
import {
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from './graph-data-view-utils';

import {getGraphVectorData} from './graph-vector-view-utils';
import {validateChunkViews} from './gpu-chunk-utils';
import {getChunkedGallopingSearchNodes} from './gpu-galloping-search-chunks';

const GALLOPING_SEARCH_WORKGROUP_SIZE = 64;
const DEFAULT_QUERIES_PER_TILE = 32;
const MAXIMUM_QUERIES_PER_TILE = 256;
const SEGMENT_WORD_LENGTH = 4;

/** `validationErrors` bit indicating a value segment outside the value view. */
export const GPU_GALLOPING_SEARCH_INVALID_VALUE_RANGE = 1;
/** `validationErrors` bit indicating a query segment outside the query view. */
export const GPU_GALLOPING_SEARCH_INVALID_QUERY_RANGE = 2;
/** `validationErrors` bit indicating that queries decrease within one tile. */
export const GPU_GALLOPING_SEARCH_UNSORTED_QUERIES = 4;
/** `validationErrors` bit indicating a non-finite floating-point query. */
export const GPU_GALLOPING_SEARCH_INVALID_QUERY = 8;

/** Scalar formats supported by {@link GPUGallopingSearch}. */
export type GPUGallopingSearchFormat = 'float32' | 'uint32';

/** Properties for segmented batched lower-bound searches over sorted scalar values. */
export type GPUGallopingSearchProps<
  Format extends GPUGallopingSearchFormat = GPUGallopingSearchFormat
> = {
  /** Prefix for generated graph nodes. */
  id?: string;
  /** Packed values sorted in ascending order within each declared value segment. */
  values: GraphDataView<Format> | GraphVectorView<Format>;
  /** Optional packed sorted row indices into values. Segment value ranges then address this view. */
  valueOrder?: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  /** Packed queries, normally sorted in ascending order within each query segment. */
  queries: GraphDataView<Format> | GraphVectorView<Format>;
  /** Packed `[valueOffset, valueCount, queryOffset, queryCount]` records. */
  segments: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  /** Largest query count reserved by any segment. */
  maximumQueryCount: number;
  /** Consecutive queries handled by one shader invocation. Defaults to 32. */
  queriesPerTile?: number;
  /** Packed lower-bound positions addressed like the query view. */
  output: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  /** One persistent validation word populated by malformed GPU-visible inputs. */
  validationErrors: GraphDataView<'uint32'>;
  /** Preserve existing validation bits instead of clearing them before this operation. */
  preserveValidationErrors?: boolean;
};

/** Static capacity and scheduling information for one galloping-search contributor. */
export type GPUGallopingSearchStats = {
  /** Number of searchable positions, either values or the optional value-order index. */
  orderedValueCount: number;
  /** Whether values are read indirectly through a sorted row-index vector. */
  indirect: boolean;
  /** Number of independent value/query segment pairs. */
  segmentCount: number;
  /** Largest query count reserved by one segment. */
  maximumQueryCount: number;
  /** Consecutive monotonic queries handled by one shader invocation. */
  queriesPerTile: number;
  /** Maximum independent segment/tile searches. */
  maximumSearchCount: number;
};

/**
 * Computes segmented batched lower bounds using tiled forward exponential search.
 *
 * The first query in each tile uses binary search. Remaining nondecreasing queries reuse the
 * previous result, probe forward exponentially, and finish with binary then short linear search.
 * Segment/tile pairs run independently, retaining parallel GPU work while exploiting ordered-query
 * locality. Output positions are absolute indices relative to the supplied value view.
 */
export class GPUGallopingSearch<
  Format extends GPUGallopingSearchFormat = GPUGallopingSearchFormat
> {
  readonly id: string;
  readonly values: GraphDataView<Format> | GraphVectorView<Format>;
  readonly valueOrder?: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  readonly queries: GraphDataView<Format> | GraphVectorView<Format>;
  readonly segments: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  readonly output: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  readonly validationErrors: GraphDataView<'uint32'>;
  readonly preserveValidationErrors: boolean;
  readonly stats: Readonly<GPUGallopingSearchStats>;

  constructor(props: GPUGallopingSearchProps<Format>) {
    this.id = props.id ?? 'gpu-galloping-search';
    this.values = props.values;
    this.valueOrder = props.valueOrder;
    this.queries = props.queries;
    this.segments = props.segments;
    this.output = props.output;
    this.validationErrors = props.validationErrors;
    this.preserveValidationErrors = props.preserveValidationErrors ?? false;

    for (const chunk of getGraphVectorData(this.values))
      validateScalarValueView(chunk, `${this.id} values`);
    if (this.valueOrder) {
      for (const chunk of getGraphVectorData(this.valueOrder))
        validatePackedUint32View(chunk, `${this.id} valueOrder`);
    }
    for (const chunk of getGraphVectorData(this.queries))
      validatePackedView(chunk, ['float32', 'uint32'], `${this.id} queries`);
    for (const chunk of getGraphVectorData(this.segments))
      validatePackedUint32View(chunk, `${this.id} segments`);
    for (const chunk of getGraphVectorData(this.output))
      validatePackedUint32View(chunk, `${this.id} output`);
    validatePackedUint32View(this.validationErrors, `${this.id} validationErrors`);
    if (this.values.format !== this.queries.format) {
      throw new Error(`${this.id} values and queries must have matching scalar formats`);
    }
    if (this.segments.length % SEGMENT_WORD_LENGTH !== 0) {
      throw new Error(`${this.id} segments must contain complete four-word records`);
    }
    if (this.output.length !== this.queries.length) {
      throw new Error(`${this.id} output and queries must have matching lengths`);
    }
    if (this.validationErrors.length !== 1) {
      throw new Error(`${this.id} validationErrors must contain one uint32`);
    }
    if (
      !Number.isSafeInteger(props.maximumQueryCount) ||
      props.maximumQueryCount < 0 ||
      props.maximumQueryCount > 0xffffffff
    ) {
      throw new Error(`${this.id} maximumQueryCount must be a non-negative safe integer`);
    }
    const queriesPerTile = props.queriesPerTile ?? DEFAULT_QUERIES_PER_TILE;
    if (
      !Number.isSafeInteger(queriesPerTile) ||
      queriesPerTile < 1 ||
      queriesPerTile > MAXIMUM_QUERIES_PER_TILE
    ) {
      throw new Error(
        `${this.id} queriesPerTile must be an integer from 1 through ${MAXIMUM_QUERIES_PER_TILE}`
      );
    }
    const sources: (GraphDataView | GraphVectorView)[] = [
      this.values,
      ...(this.valueOrder ? [this.valueOrder] : []),
      this.queries,
      this.segments
    ];
    if (
      sources
        .flatMap(getGraphVectorData)
        .some(view =>
          getGraphVectorData(this.output).some(output => view.buffer === output.buffer)
        ) ||
      sources
        .flatMap(getGraphVectorData)
        .some(view => view.buffer === this.validationErrors.buffer) ||
      getGraphVectorData(this.output).some(output => output.buffer === this.validationErrors.buffer)
    ) {
      throw new Error(`${this.id} sources, output, and validationErrors must use separate buffers`);
    }

    const segmentCount = this.segments.length / SEGMENT_WORD_LENGTH;
    const tilesPerSegment = Math.ceil(props.maximumQueryCount / queriesPerTile);
    this.stats = Object.freeze({
      orderedValueCount: this.valueOrder?.length ?? this.values.length,
      indirect: Boolean(this.valueOrder),
      segmentCount,
      maximumQueryCount: props.maximumQueryCount,
      queriesPerTile,
      maximumSearchCount: segmentCount * tilesPerSegment
    });
  }

  /** Adds optional validation reset and one tiled search pass to a caller-owned graph. */
  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const nodes: GPUCommandNode<Parameters>[] = [];
    validateChunkViews(
      graph,
      [this.values, this.queries, this.segments, ...(this.valueOrder ? [this.valueOrder] : [])],
      [this.output, this.validationErrors]
    );
    if (!this.preserveValidationErrors) {
      nodes.push(...addValidationClearPass(graph, this.id, this.validationErrors));
    }
    if (this.stats.maximumSearchCount > 0) {
      if (
        [this.values, this.valueOrder, this.queries, this.segments, this.output].some(
          view => view instanceof GraphVectorView
        )
      ) {
        nodes.push(...getChunkedGallopingSearchNodes(graph, this));
      } else {
        nodes.push(...addSearchPass(graph, this as AtomicGallopingSearch<Format>));
      }
    }

    return nodes;
  }
}

function addValidationClearPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  validationErrors: GraphDataView<'uint32'>
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const source = /* wgsl */ `
const ERROR_OFFSET: u32 = ${getViewElementOffset(validationErrors)}u;
@group(0) @binding(0) var<storage, read_write> errors: array<u32>;
@compute @workgroup_size(1) fn main() { errors[ERROR_OFFSET] = 0u; }`;
  nodes.push(
    createGPUComputeCommandNode<Parameters>({
      id: `${id}-clear-validation`,
      resources: [{buffer: validationErrors, usage: 'storage-write'}],
      workload: {
        operation: 'GPUGallopingSearch',
        commandCount: 1,
        maximumWorkgroupCount: 1,
        maximumInvocationCount: 1
      },
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${id}-clear-validation`,
          source,
          shaderLayout: {
            bindings: [{name: 'errors', type: 'storage', group: 0, location: 0}]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({errors: getViewBinding(validationErrors, getBuffer)});
            computation.dispatch(computePass, 1);
          },
          destroy: () => computation.destroy()
        };
      }
    })
  );

  return nodes;
}

function addSearchPass<Parameters, Format extends GPUGallopingSearchFormat>(
  graph: GPUCommandGraph<Parameters>,
  search: AtomicGallopingSearch<Format>
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const tilesPerSegment = Math.ceil(search.stats.maximumQueryCount / search.stats.queriesPerTile);
  const dispatchLayout = getBoundedDispatchLayout(
    search.id,
    search.stats.maximumSearchCount,
    GALLOPING_SEARCH_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const scalarType = search.values.format === 'float32' ? 'f32' : 'u32';
  const valueStride = search.values.byteStride / Uint32Array.BYTES_PER_ELEMENT;
  const orderDeclaration = search.valueOrder
    ? `@group(0) @binding(1) var<storage, read> valueOrder: array<u32>;`
    : '';
  const queryBinding = search.valueOrder ? 2 : 1;
  const segmentBinding = queryBinding + 1;
  const outputBinding = queryBinding + 2;
  const validationBinding = queryBinding + 3;
  const valueRead = search.valueOrder
    ? `let row = valueOrder[ORDER_OFFSET + position];
  return values[VALUE_OFFSET + row * VALUE_STRIDE];`
    : 'return values[VALUE_OFFSET + position * VALUE_STRIDE];';
  const finiteQuery =
    search.values.format === 'float32'
      ? '(bitcast<u32>(searchValue) & 0x7f800000u) != 0x7f800000u'
      : 'true';
  const source = /* wgsl */ `
const VALUE_COUNT: u32 = ${search.stats.orderedValueCount}u;
const QUERY_COUNT: u32 = ${search.queries.length}u;
const SEGMENT_COUNT: u32 = ${search.stats.segmentCount}u;
const MAXIMUM_QUERY_COUNT: u32 = ${search.stats.maximumQueryCount}u;
const QUERIES_PER_TILE: u32 = ${search.stats.queriesPerTile}u;
const TILES_PER_SEGMENT: u32 = ${tilesPerSegment}u;
const JOB_COUNT: u32 = ${search.stats.maximumSearchCount}u;
const VALUE_OFFSET: u32 = ${getViewElementOffset(search.values)}u;
const VALUE_STRIDE: u32 = ${valueStride}u;
const ORDER_OFFSET: u32 = ${search.valueOrder ? getViewElementOffset(search.valueOrder) : 0}u;
const QUERY_OFFSET: u32 = ${getViewElementOffset(search.queries)}u;
const SEGMENT_OFFSET: u32 = ${getViewElementOffset(search.segments)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(search.output)}u;
const ERROR_OFFSET: u32 = ${getViewElementOffset(search.validationErrors)}u;

@group(0) @binding(0) var<storage, read> values: array<${scalarType}>;
${orderDeclaration}
@group(0) @binding(${queryBinding}) var<storage, read> queries: array<${scalarType}>;
@group(0) @binding(${segmentBinding}) var<storage, read> segments: array<u32>;
@group(0) @binding(${outputBinding}) var<storage, read_write> outputPositions: array<u32>;
@group(0) @binding(${validationBinding}) var<storage, read_write> validationErrors: array<atomic<u32>>;

fn readValue(position: u32) -> ${scalarType} {
  ${valueRead}
}

fn lowerBound(first: u32, last: u32, searchValue: ${scalarType}) -> u32 {
  var low = first;
  var high = last;
  while (high - low > 16u) {
    let middle = low + (high - low) / 2u;
    if (readValue(middle) < searchValue) {
      low = middle + 1u;
    } else {
      high = middle;
    }
  }
  while (low < high && readValue(low) < searchValue) { low++; }
  return low;
}

fn gallopForward(segmentEnd: u32, position: u32, searchValue: ${scalarType}) -> u32 {
  if (position >= segmentEnd || readValue(position) >= searchValue) { return position; }
  var step = 16u;
  var previous = position;
  loop {
    let remaining = segmentEnd - position;
    if (step >= remaining) { break; }
    let probe = position + step;
    if (readValue(probe) >= searchValue) { break; }
    previous = probe;
    step = min(step * 2u, remaining);
  }
  let upper = min(segmentEnd - 1u, position + step);
  return lowerBound(previous + 1u, upper + 1u, searchValue);
}

@compute @workgroup_size(${GALLOPING_SEARCH_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GALLOPING_SEARCH_WORKGROUP_SIZE)}
  if (index >= JOB_COUNT) { return; }
  let segmentIndex = index / TILES_PER_SEGMENT;
  let tileIndex = index % TILES_PER_SEGMENT;
  if (segmentIndex >= SEGMENT_COUNT) { return; }

  let descriptor = SEGMENT_OFFSET + segmentIndex * ${SEGMENT_WORD_LENGTH}u;
  let valueStart = segments[descriptor];
  let valueCount = segments[descriptor + 1u];
  let queryStart = segments[descriptor + 2u];
  let queryCount = segments[descriptor + 3u];
  if (valueStart > VALUE_COUNT || valueCount > VALUE_COUNT - valueStart) {
    atomicOr(&validationErrors[ERROR_OFFSET], ${GPU_GALLOPING_SEARCH_INVALID_VALUE_RANGE}u);
    return;
  }
  if (queryStart > QUERY_COUNT || queryCount > QUERY_COUNT - queryStart ||
      queryCount > MAXIMUM_QUERY_COUNT) {
    atomicOr(&validationErrors[ERROR_OFFSET], ${GPU_GALLOPING_SEARCH_INVALID_QUERY_RANGE}u);
    return;
  }

  let firstQueryIndex = tileIndex * QUERIES_PER_TILE;
  if (firstQueryIndex >= queryCount) { return; }
  var searchValue = queries[QUERY_OFFSET + queryStart + firstQueryIndex];
  if (!(${finiteQuery})) {
    atomicOr(&validationErrors[ERROR_OFFSET], ${GPU_GALLOPING_SEARCH_INVALID_QUERY}u);
    return;
  }
  let valueEnd = valueStart + valueCount;
  var position = lowerBound(valueStart, valueEnd, searchValue);
  outputPositions[OUTPUT_OFFSET + queryStart + firstQueryIndex] = position;

  for (var tileOffset = 1u; tileOffset < QUERIES_PER_TILE; tileOffset++) {
    let localQueryIndex = firstQueryIndex + tileOffset;
    if (localQueryIndex >= queryCount) { break; }
    let nextSearchValue = queries[QUERY_OFFSET + queryStart + localQueryIndex];
    if (!(${finiteQuery.replaceAll('searchValue', 'nextSearchValue')})) {
      atomicOr(&validationErrors[ERROR_OFFSET], ${GPU_GALLOPING_SEARCH_INVALID_QUERY}u);
      break;
    }
    if (nextSearchValue < searchValue) {
      atomicOr(&validationErrors[ERROR_OFFSET], ${GPU_GALLOPING_SEARCH_UNSORTED_QUERIES}u);
      position = lowerBound(valueStart, valueEnd, nextSearchValue);
    } else {
      position = gallopForward(valueEnd, position, nextSearchValue);
    }
    outputPositions[OUTPUT_OFFSET + queryStart + localQueryIndex] = position;
    searchValue = nextSearchValue;
  }
}`;
  nodes.push(...addSearchComputationPass(graph, search, source, dispatchLayout));

  return nodes;
}

function addSearchComputationPass<Parameters, Format extends GPUGallopingSearchFormat>(
  graph: GPUCommandGraph<Parameters>,
  search: AtomicGallopingSearch<Format>,
  source: string,
  dispatchLayout: GPUBoundedDispatchLayout
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const bindings = {
    values: search.values,
    ...(search.valueOrder ? {valueOrder: search.valueOrder} : {}),
    queries: search.queries,
    segments: search.segments,
    outputPositions: search.output,
    validationErrors: search.validationErrors
  };
  const resources: GraphBufferUse[] = [
    {buffer: search.values, usage: 'storage-read'},
    ...(search.valueOrder ? [{buffer: search.valueOrder, usage: 'storage-read' as const}] : []),
    {buffer: search.queries, usage: 'storage-read'},
    {buffer: search.segments, usage: 'storage-read'},
    {buffer: search.output, usage: 'storage-write'},
    {buffer: search.validationErrors, usage: 'storage-read-write'}
  ];
  nodes.push(
    createGPUComputeCommandNode<Parameters>({
      id: `${search.id}-query`,
      resources,
      workload: {
        operation: 'GPUGallopingSearch',
        commandCount: 1,
        maximumWorkgroupCount: dispatchLayout.x * dispatchLayout.y * dispatchLayout.z,
        maximumInvocationCount:
          dispatchLayout.x * dispatchLayout.y * dispatchLayout.z * GALLOPING_SEARCH_WORKGROUP_SIZE
      },
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${search.id}-query`,
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
    })
  );

  return nodes;
}

function validateScalarValueView(
  view: GraphDataView,
  name: string
): asserts view is GraphDataView<GPUGallopingSearchFormat> {
  if (
    (view.format !== 'float32' && view.format !== 'uint32') ||
    view.rowByteLength !== Uint32Array.BYTES_PER_ELEMENT ||
    view.byteStride < Uint32Array.BYTES_PER_ELEMENT ||
    view.byteStride % Uint32Array.BYTES_PER_ELEMENT !== 0 ||
    view.byteOffset % Uint32Array.BYTES_PER_ELEMENT !== 0
  ) {
    throw new Error(`${name} must be uint32-aligned scalar GPU data`);
  }
}

type AtomicGallopingSearch<Format extends GPUGallopingSearchFormat> = Omit<
  GPUGallopingSearch<Format>,
  'values' | 'valueOrder' | 'queries' | 'segments' | 'output'
> & {
  values: GraphDataView<Format>;
  valueOrder?: GraphDataView<'uint32'>;
  queries: GraphDataView<Format>;
  segments: GraphDataView<'uint32'>;
  output: GraphDataView<'uint32'>;
};
