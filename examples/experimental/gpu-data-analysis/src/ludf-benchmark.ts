// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {makeGPUAnalyticsTableFromArrowTable} from '@luma.gl/arrow';
import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUBatchHashIndex,
  GPUCommandGraph,
  GPU_HASH_INDEX_STATISTICS_LENGTH,
  type CompiledGPUCommandGraph
} from '@luma.gl/experimental';
import {
  LuDataFrame,
  and,
  column,
  literal,
  type CompiledLuDataFrameGroupedAggregation,
  type CompiledLuDataFrameJoin,
  type CompiledLuDataFrameQuery,
  type CompiledLuDataFrameSort,
  type LuDataFrameQueryParameters
} from '@luma.gl/experimental/ludf';
import {GPUVector, type GPUData} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';

const DEFAULT_ROW_COUNT = 512;
const MAXIMUM_ROW_COUNT = 4096;
const SLICE_OFFSET = 9;
const CATEGORY_LABELS = ['North', 'East', 'South', 'West'] as const;
const MINIMUM_FARE = 20;
const DRIVER_TIP = 2.5;
const TOP_K_LIMIT = 5;
const JOIN_CAPACITY = 8;
const INDEX_CAPACITY = 8;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

type BenchmarkDictionary = arrow.Dictionary<arrow.Utf8, arrow.Uint32>;

type BenchmarkArrowColumns = {
  fare: arrow.Float32;
  category: BenchmarkDictionary;
  tripId: arrow.Uint32;
};

type BenchmarkRightArrowColumns = {
  category: BenchmarkDictionary;
  weight: arrow.Float32;
};

type BenchmarkColumns = {
  fare: 'float32';
  category: 'uint32';
  tripId: 'uint32';
};

type BenchmarkDerivedColumns = BenchmarkColumns & {adjustedFare: 'float32'};

type BenchmarkRightColumns = {
  category: 'uint32';
  weight: 'float32';
};

type BenchmarkDataset = {
  left: arrow.Table<BenchmarkArrowColumns>;
  right: arrow.Table<BenchmarkRightArrowColumns>;
  rows: readonly BenchmarkSourceRow[];
  batchRowCounts: readonly number[];
};

type BenchmarkSourceRow = {
  rowId: number;
  batchIndex: number;
  fare: number | null;
  category: number | null;
};

type BenchmarkReference = {
  filterCounts: number[];
  groupCounts: number[];
  groupSums: number[];
  topKRowIds: number[][];
  joinRequiredCounts: number[];
  joinLeftRowIds: number[][];
  joinRightRowIds: number[][];
};

type BenchmarkGraphs = {
  filter: CompiledLuDataFrameQuery<BenchmarkDerivedColumns>;
  groups: CompiledLuDataFrameGroupedAggregation<{
    category: 'uint32';
    count: 'uint32';
    totalAdjustedFare: 'float32';
  }>;
  sorting: CompiledLuDataFrameSort<BenchmarkDerivedColumns>;
  join: CompiledLuDataFrameJoin<BenchmarkDerivedColumns, BenchmarkRightColumns>;
  index: CompiledGPUCommandGraph<LuDataFrameQueryParameters>;
};

/** Explicit timing phases recorded from real local Arrow, CPU, and fence-synchronized GPU work. */
export type LuDataFrameBenchmarkTimings = {
  /** Construction and completed upload of both original Arrow analytics tables. */
  uploadMilliseconds: number;
  /** Compilation of four dataframe graphs and one separate equivalent right-index graph. */
  compileMilliseconds: number;
  /** Independently submitted and fence-synchronized equivalent right-index construction. */
  indexMilliseconds: number;
  /** Four dataframe encodings, submissions, and completed GPU execution fences. */
  executionMilliseconds: number;
  /** Explicit bounded output readback required only for correctness verification. */
  readbackMilliseconds: number;
  /** Equivalent JavaScript filter, grouping, batch-local top-K, and bounded join work. */
  cpuMilliseconds: number;
};

/** Small independently verified outputs; full Arrow columns are never read back from the GPU. */
export type LuDataFrameBenchmarkSummaries = {
  filterCount: number;
  groupCounts: number[];
  topKRowIds: number[][];
  joinCounts: number[];
  joinLeftRowIds: number[][];
  joinRightRowIds: number[][];
};

/** Completed opt-in Arrow-to-luDF benchmark, measured on the caller's actual WebGPU device. */
export type LuDataFrameBenchmarkResult = {
  rowCount: number;
  batchRowCounts: number[];
  timings: LuDataFrameBenchmarkTimings;
  validation: {
    filter: boolean;
    groups: boolean;
    sorting: boolean;
    join: boolean;
  };
  summaries: LuDataFrameBenchmarkSummaries;
  readbackBytes: number;
};

/** Runs real Arrow uploads and correctness-gated dataframe workloads only when explicitly invoked. */
export async function runLuDataFrameBenchmark(
  device: Device,
  {rowCount = DEFAULT_ROW_COUNT, signal}: {rowCount?: number; signal?: AbortSignal} = {}
): Promise<LuDataFrameBenchmarkResult> {
  if (device.type !== 'webgpu') {
    throw new Error('The luDF benchmark requires a WebGPU device');
  }
  if (!Number.isSafeInteger(rowCount) || rowCount < 2 || rowCount > MAXIMUM_ROW_COUNT) {
    throw new Error(`The luDF benchmark requires between 2 and ${MAXIMUM_ROW_COUNT} rows`);
  }
  signal?.throwIfAborted();

  const dataset = createBenchmarkDataset(rowCount);
  const cpuStarted = performance.now();
  const reference = createBenchmarkReference(dataset.rows, dataset.batchRowCounts);
  const cpuMilliseconds = performance.now() - cpuStarted;

  const ownedBuffers: Buffer[] = [];
  let left: LuDataFrame<BenchmarkColumns> | undefined;
  let right: LuDataFrame<BenchmarkRightColumns> | undefined;
  let graphs: BenchmarkGraphs | undefined;
  try {
    const uploadStarted = performance.now();
    const leftUpload = makeGPUAnalyticsTableFromArrowTable(device, dataset.left);
    try {
      left = new LuDataFrame({...leftUpload, ownership: 'owned'});
    } catch (error) {
      leftUpload.table.destroy();
      for (const validity of Object.values(leftUpload.validity)) validity?.destroy();
      throw error;
    }
    const rightUpload = makeGPUAnalyticsTableFromArrowTable(device, dataset.right);
    try {
      right = new LuDataFrame({...rightUpload, ownership: 'owned'});
    } catch (error) {
      rightUpload.table.destroy();
      for (const validity of Object.values(rightUpload.validity)) validity?.destroy();
      throw error;
    }
    await waitForBenchmarkGPU(device, signal);
    const uploadMilliseconds = performance.now() - uploadStarted;
    signal?.throwIfAborted();

    const compileStarted = performance.now();
    graphs = compileBenchmarkGraphs(device, left, right, ownedBuffers);
    const compileMilliseconds = performance.now() - compileStarted;
    signal?.throwIfAborted();

    const indexMilliseconds = await executeBenchmarkGraph(
      device,
      graphs.index,
      'ludf-benchmark-standalone-index',
      signal
    );
    let executionMilliseconds = 0;
    for (const [name, graph] of [
      ['filter', graphs.filter],
      ['groups', graphs.groups],
      ['sorting', graphs.sorting],
      ['join', graphs.join]
    ] as const) {
      executionMilliseconds += await executeBenchmarkGraph(
        device,
        graph,
        `ludf-benchmark-${name}`,
        signal
      );
    }

    const readbackStarted = performance.now();
    const bytes = {value: 0};
    const filterCounts = await readBenchmarkScalars(graphs.filter.selectedCounts, bytes, signal);
    const groupCounts = await readBenchmarkUint32(
      graphs.groups.table.gpuVectors.count.data[0],
      CATEGORY_LABELS.length,
      bytes,
      signal
    );
    const groupSums = await readBenchmarkFloat32(
      graphs.groups.table.gpuVectors.totalAdjustedFare.data[0],
      CATEGORY_LABELS.length,
      bytes,
      signal
    );
    const topKCounts = await readBenchmarkScalars(graphs.sorting.selectedCounts, bytes, signal);
    const topKRowIds = await readBenchmarkPrefixes(
      graphs.sorting.rowIndices,
      topKCounts,
      bytes,
      signal
    );
    const joinCounts = await readBenchmarkScalars(graphs.join.selectedCounts, bytes, signal);
    const requiredCounts = await readBenchmarkScalars(graphs.join.requiredCounts, bytes, signal);
    const overflows = await readBenchmarkScalars(graphs.join.overflows, bytes, signal);
    const joinLeftRowIds = await readBenchmarkPrefixes(
      graphs.join.rowIndices,
      joinCounts,
      bytes,
      signal
    );
    const joinRightRowIds = await readBenchmarkPrefixes(
      graphs.join.rightRowIndices,
      joinCounts,
      bytes,
      signal
    );
    const contractViolation = await readBenchmarkUint32(
      graphs.join.contractViolation.data[0],
      1,
      bytes,
      signal
    );
    const readbackMilliseconds = performance.now() - readbackStarted;

    const filter = compareNumberArrays(filterCounts, reference.filterCounts);
    const groups =
      compareNumberArrays(groupCounts, reference.groupCounts) &&
      groupSums.every((sum, index) => approximatelyEqualBenchmark(sum, reference.groupSums[index]));
    const sorting = compareNestedNumberArrays(topKRowIds, reference.topKRowIds);
    const join =
      contractViolation[0] === 0 &&
      compareNumberArrays(requiredCounts, reference.joinRequiredCounts) &&
      overflows.every(
        (overflow, index) =>
          overflow === Number(reference.joinRequiredCounts[index] > JOIN_CAPACITY)
      ) &&
      compareNestedNumberArrays(joinLeftRowIds, reference.joinLeftRowIds) &&
      compareNestedNumberArrays(joinRightRowIds, reference.joinRightRowIds);

    if (!filter || !groups || !sorting || !join) {
      throw new Error('The luDF benchmark GPU outputs do not match the shared CPU reference');
    }
    signal?.throwIfAborted();
    return {
      rowCount,
      batchRowCounts: [...dataset.batchRowCounts],
      timings: {
        uploadMilliseconds,
        compileMilliseconds,
        indexMilliseconds,
        executionMilliseconds,
        readbackMilliseconds,
        cpuMilliseconds
      },
      validation: {filter, groups, sorting, join},
      summaries: {
        filterCount: filterCounts.reduce((total, count) => total + count, 0),
        groupCounts,
        topKRowIds,
        joinCounts,
        joinLeftRowIds,
        joinRightRowIds
      },
      readbackBytes: bytes.value
    };
  } finally {
    if (graphs) {
      graphs.filter.destroy();
      graphs.groups.destroy();
      graphs.sorting.destroy();
      graphs.join.destroy();
      graphs.index.destroy();
    }
    left?.destroy();
    right?.destroy();
    for (const buffer of ownedBuffers) buffer.destroy();
  }
}

/** Constructs sliced nullable Arrow columns and dictionary-compatible independent right batches. */
function createBenchmarkDataset(rowCount: number): BenchmarkDataset {
  const totalRows = rowCount + SLICE_OFFSET;
  const fares: (number | null)[] = [];
  const categories = new Uint32Array(totalRows);
  const tripIds = new Uint32Array(totalRows);
  const categoryBitmap = new Uint8Array(Math.ceil(totalRows / 8));
  let categoryNullCount = 0;

  for (let index = 0; index < totalRows; index++) {
    fares.push(index % 13 === 0 ? null : Math.fround(((index * 37) % 121) - 30 + (index % 7) / 10));
    categories[index] = index % CATEGORY_LABELS.length;
    tripIds[index] = index - SLICE_OFFSET >= 0 ? index - SLICE_OFFSET : 0;
    if (index % 11 === 0) {
      categoryNullCount++;
    } else {
      categoryBitmap[index >> 3] |= 1 << (index & 7);
    }
  }

  const dictionaryType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Uint32(), 41, true);
  const dictionary = arrow.vectorFromArray([...CATEGORY_LABELS], new arrow.Utf8());
  const categoryData = arrow.makeData({
    type: dictionaryType,
    length: totalRows,
    data: categories,
    nullBitmap: categoryBitmap,
    nullCount: categoryNullCount,
    dictionary
  });
  const categoryVector = new arrow.Vector([categoryData]);
  const fareVector = arrow.vectorFromArray(fares, new arrow.Float32());
  const tripIdVector = arrow.makeVector(tripIds);
  const fields = [
    new arrow.Field('fare', new arrow.Float32(), true, new Map([['unit', 'USD']])),
    new arrow.Field('category', dictionaryType, true),
    new arrow.Field('tripId', new arrow.Uint32(), false)
  ];
  const schema = new arrow.Schema<BenchmarkArrowColumns>(
    fields,
    new Map([['dataset', 'arrow-ludf-taxi']])
  );
  const midpoint = Math.floor(rowCount / 2);
  const rowRanges: readonly [number, number][] = [
    [SLICE_OFFSET, SLICE_OFFSET + midpoint],
    [SLICE_OFFSET + midpoint, SLICE_OFFSET + midpoint],
    [SLICE_OFFSET + midpoint, SLICE_OFFSET + rowCount]
  ];
  const batches = rowRanges.map(([start, end], batchIndex) => {
    const batchSchema = new arrow.Schema<BenchmarkArrowColumns>(
      fields,
      new Map([['sourceBatch', String(batchIndex)]])
    );
    return new arrow.RecordBatch(
      batchSchema,
      arrow.makeData({
        type: new arrow.Struct(batchSchema.fields),
        length: end - start,
        children: [
          fareVector.slice(start, end).data[0],
          categoryVector.slice(start, end).data[0],
          tripIdVector.slice(start, end).data[0]
        ]
      })
    );
  });

  const rightFields = [
    new arrow.Field('category', dictionaryType, false),
    new arrow.Field('weight', new arrow.Float32(), false)
  ];
  const rightSchema = new arrow.Schema<BenchmarkRightArrowColumns>(
    rightFields,
    new Map([['dataset', 'arrow-ludf-categories']])
  );
  const rightCategories = new arrow.Vector([
    arrow.makeData({
      type: dictionaryType,
      length: CATEGORY_LABELS.length,
      data: Uint32Array.from(CATEGORY_LABELS, (_, index) => index),
      dictionary
    })
  ]);
  const rightWeights = arrow.makeVector(Float32Array.from([1, 1.5, 2, 2.5]));
  const rightRanges: readonly [number, number][] = [
    [0, 2],
    [2, 2],
    [2, 4]
  ];
  const rightBatches = rightRanges.map(([start, end], batchIndex) => {
    const batchSchema = new arrow.Schema<BenchmarkRightArrowColumns>(
      rightFields,
      new Map([['sourceBatch', String(batchIndex)]])
    );
    return new arrow.RecordBatch(
      batchSchema,
      arrow.makeData({
        type: new arrow.Struct(batchSchema.fields),
        length: end - start,
        children: [
          rightCategories.slice(start, end).data[0],
          rightWeights.slice(start, end).data[0]
        ]
      })
    );
  });

  const rows: BenchmarkSourceRow[] = [];
  for (let rowId = 0; rowId < rowCount; rowId++) {
    const sourceIndex = rowId + SLICE_OFFSET;
    rows.push({
      rowId,
      batchIndex: rowId < midpoint ? 0 : 2,
      fare: fares[sourceIndex],
      category: sourceIndex % 11 === 0 ? null : categories[sourceIndex]
    });
  }
  return {
    left: new arrow.Table(schema, batches),
    right: new arrow.Table(rightSchema, rightBatches),
    rows,
    batchRowCounts: [midpoint, 0, rowCount - midpoint]
  };
}

/** Computes exact source-batch-aware CPU oracles for every independent GPU workload. */
function createBenchmarkReference(
  rows: readonly BenchmarkSourceRow[],
  batchRowCounts: readonly number[]
): BenchmarkReference {
  const filterCounts = batchRowCounts.map(() => 0);
  const groupCounts = CATEGORY_LABELS.map(() => 0);
  const groupSums = CATEGORY_LABELS.map(() => 0);
  const selectedByBatch = batchRowCounts.map(
    () => [] as Array<{rowId: number; adjusted: number; category: number}>
  );

  for (const row of rows) {
    if (row.fare === null || row.fare <= MINIMUM_FARE || row.category === null) {
      continue;
    }
    const adjusted = Math.fround(row.fare + DRIVER_TIP);
    filterCounts[row.batchIndex]++;
    groupCounts[row.category]++;
    groupSums[row.category] += adjusted;
    selectedByBatch[row.batchIndex].push({rowId: row.rowId, adjusted, category: row.category});
  }

  const topKRowIds = selectedByBatch.map(values =>
    [...values]
      .sort((left, right) => right.adjusted - left.adjusted || left.rowId - right.rowId)
      .slice(0, TOP_K_LIMIT)
      .map(row => row.rowId)
  );
  const joinRequiredCounts = selectedByBatch.map(values => values.length);
  const joinLeftRowIds = selectedByBatch.map(values =>
    values.slice(0, JOIN_CAPACITY).map(row => row.rowId)
  );
  const joinRightRowIds = selectedByBatch.map(values =>
    values.slice(0, JOIN_CAPACITY).map(row => row.category)
  );

  return {
    filterCounts,
    groupCounts,
    groupSums,
    topKRowIds,
    joinRequiredCounts,
    joinLeftRowIds,
    joinRightRowIds
  };
}

/** Compiles four reusable dataframe workloads plus one truthful, standalone equivalent index. */
function compileBenchmarkGraphs(
  device: Device,
  left: LuDataFrame<BenchmarkColumns>,
  right: LuDataFrame<BenchmarkRightColumns>,
  ownedBuffers: Buffer[]
): BenchmarkGraphs {
  const query = left
    .withColumn('adjustedFare', column('fare').add(literal(DRIVER_TIP)), {format: 'float32'})
    .filter(and(column('fare').greaterThan(literal(MINIMUM_FARE)), column('category').isValid()));

  const filter = query.compile(
    new GPUCommandGraph<LuDataFrameQueryParameters>(device, {id: 'ludf-benchmark-filter'})
  );
  let groups: BenchmarkGraphs['groups'] | undefined;
  let sorting: BenchmarkGraphs['sorting'] | undefined;
  let join: BenchmarkGraphs['join'] | undefined;
  let index: BenchmarkGraphs['index'] | undefined;
  try {
    groups = query
      .groupBy('category')
      .aggregate({count: 'count', totalAdjustedFare: {sum: 'adjustedFare'}})
      .compile(new GPUCommandGraph(device, {id: 'ludf-benchmark-groups'}));
    sorting = query
      .topK('adjustedFare', TOP_K_LIMIT)
      .compile(new GPUCommandGraph(device, {id: 'ludf-benchmark-sorting'}));
    join = query
      .innerJoin(right, {leftOn: 'category', rightOn: 'category', capacity: JOIN_CAPACITY})
      .compile(new GPUCommandGraph(device, {id: 'ludf-benchmark-join'}));
    index = compileStandaloneBenchmarkIndex(device, right, ownedBuffers);
    return {filter, groups, sorting, join, index};
  } catch (error) {
    filter.destroy();
    groups?.destroy();
    sorting?.destroy();
    join?.destroy();
    index?.destroy();
    throw error;
  }
}

/** Builds exactly the same chunk-preserving unique-right hash index as the joined dataframe. */
function compileStandaloneBenchmarkIndex(
  device: Device,
  right: LuDataFrame<BenchmarkRightColumns>,
  ownedBuffers: Buffer[]
): CompiledGPUCommandGraph<LuDataFrameQueryParameters> {
  const graph = new GPUCommandGraph<LuDataFrameQueryParameters>(device, {
    id: 'ludf-benchmark-equivalent-index'
  });
  const category = right.column('category');
  if (!(category instanceof GPUVector)) {
    throw new Error('The luDF benchmark right category must be a GPU vector');
  }
  const keys = graph.importGPUVector('ludf-index-source', category);
  const keyBuffer = createBenchmarkIndexBuffer(
    device,
    'ludf-index-keys',
    INDEX_CAPACITY,
    ownedBuffers
  );
  const valueBuffer = createBenchmarkIndexBuffer(
    device,
    'ludf-index-values',
    INDEX_CAPACITY,
    ownedBuffers
  );
  const statisticsBuffer = createBenchmarkIndexBuffer(
    device,
    'ludf-index-statistics',
    GPU_HASH_INDEX_STATISTICS_LENGTH,
    ownedBuffers
  );
  const tableKeys = importBenchmarkUint32(
    graph,
    'ludf-index-table-keys',
    keyBuffer,
    INDEX_CAPACITY
  );
  const tableValues = importBenchmarkUint32(
    graph,
    'ludf-index-table-values',
    valueBuffer,
    INDEX_CAPACITY
  );
  const statistics = importBenchmarkUint32(
    graph,
    'ludf-index-build-statistics',
    statisticsBuffer,
    GPU_HASH_INDEX_STATISTICS_LENGTH
  );
  const firstValues = right.batches.map(batch => batch.sourceInfo?.sourceRowIndexOffset ?? 0);
  new GPUBatchHashIndex({
    id: 'ludf-equivalent-right-index',
    keys,
    firstValues,
    tableKeys,
    tableValues,
    statistics,
    maxProbeCount: INDEX_CAPACITY
  }).addToGraph(graph);
  return graph.compile();
}

/** Creates one explicitly owned small hash-index buffer for the isolated build measurement. */
function createBenchmarkIndexBuffer(
  device: Device,
  id: string,
  length: number,
  ownedBuffers: Buffer[]
): Buffer {
  const buffer = device.createBuffer({
    id,
    byteLength: length * UINT32_BYTE_LENGTH,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  ownedBuffers.push(buffer);
  return buffer;
}

/** Imports a packed standalone-index buffer through the normal application-owned graph boundary. */
function importBenchmarkUint32(
  graph: GPUCommandGraph<LuDataFrameQueryParameters>,
  id: string,
  buffer: Buffer,
  length: number
) {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format: 'uint32', length});
}

/** Measures actual encode, submission, and completed execution without timestamp assumptions. */
async function executeBenchmarkGraph(
  device: Device,
  graph:
    | CompiledGPUCommandGraph<LuDataFrameQueryParameters>
    | CompiledLuDataFrameQuery<BenchmarkDerivedColumns>
    | CompiledLuDataFrameGroupedAggregation<{
        category: 'uint32';
        count: 'uint32';
        totalAdjustedFare: 'float32';
      }>,
  id: string,
  signal: AbortSignal | undefined
): Promise<number> {
  signal?.throwIfAborted();
  const commandEncoder = device.createCommandEncoder({id});
  const started = performance.now();
  let submitted = false;
  try {
    if ('table' in graph) {
      graph.encode(commandEncoder);
    } else {
      graph.encode(commandEncoder, {parameters: {}});
    }
    device.submit(commandEncoder.finish());
    submitted = true;
    await waitForBenchmarkGPU(device, signal);
    return performance.now() - started;
  } catch (error) {
    if (!submitted) commandEncoder.destroy();
    throw error;
  }
}

/** Waits for submitted GPU work using the portable luma.gl fence instead of private device state. */
async function waitForBenchmarkGPU(device: Device, signal: AbortSignal | undefined): Promise<void> {
  signal?.throwIfAborted();
  const fence = device.createFence();
  try {
    await fence.signaled;
    signal?.throwIfAborted();
  } finally {
    fence.destroy();
  }
}

/** Reads one uint32 scalar per preserved GPU output batch without touching source rows. */
async function readBenchmarkScalars(
  vector: GPUVector<'uint32'>,
  bytes: {value: number},
  signal: AbortSignal | undefined
): Promise<number[]> {
  const values: number[] = [];
  for (const data of vector.data) {
    values.push((await readBenchmarkUint32(data, 1, bytes, signal))[0]);
  }
  return values;
}

/** Reads only the already-bounded published output prefix from each preserved source batch. */
async function readBenchmarkPrefixes(
  vector: GPUVector<'uint32'>,
  counts: readonly number[],
  bytes: {value: number},
  signal: AbortSignal | undefined
): Promise<number[][]> {
  const values: number[][] = [];
  for (const [batchIndex, data] of vector.data.entries()) {
    values.push(await readBenchmarkUint32(data, counts[batchIndex], bytes, signal));
  }
  return values;
}

/** Counts and reads a caller-specified bounded unsigned output prefix. */
async function readBenchmarkUint32(
  data: GPUData,
  length: number,
  bytes: {value: number},
  signal: AbortSignal | undefined
): Promise<number[]> {
  signal?.throwIfAborted();
  if (data.format !== 'uint32') {
    throw new Error('The luDF benchmark expected uint32 GPU output');
  }
  if (length === 0) return [];
  const byteLength = length * UINT32_BYTE_LENGTH;
  const result = await data.buffer.readAsync(data.byteOffset, byteLength);
  bytes.value += byteLength;
  signal?.throwIfAborted();
  return Array.from(new Uint32Array(result.buffer, result.byteOffset, length));
}

/** Reads only fixed-cardinality grouped floating summaries for CPU-oracle verification. */
async function readBenchmarkFloat32(
  data: GPUData,
  length: number,
  bytes: {value: number},
  signal: AbortSignal | undefined
): Promise<number[]> {
  signal?.throwIfAborted();
  if (data.format !== 'float32') {
    throw new Error('The luDF benchmark expected float32 GPU output');
  }
  const byteLength = length * Float32Array.BYTES_PER_ELEMENT;
  const result = await data.buffer.readAsync(data.byteOffset, byteLength);
  bytes.value += byteLength;
  signal?.throwIfAborted();
  return Array.from(new Float32Array(result.buffer, result.byteOffset, length));
}

/** Compares integer result vectors without sorting or obscuring stable row identity. */
function compareNumberArrays(actual: readonly number[], expected: readonly number[]): boolean {
  return (
    actual.length === expected.length && actual.every((value, index) => value === expected[index])
  );
}

/** Compares independent source-batch result prefixes without flattening their original topology. */
function compareNestedNumberArrays(
  actual: readonly (readonly number[])[],
  expected: readonly (readonly number[])[]
): boolean {
  return (
    actual.length === expected.length &&
    actual.every((values, index) => compareNumberArrays(values, expected[index]))
  );
}

/** Accounts for the documented nondeterministic floating-point order of GPU grouped atomics. */
function approximatelyEqualBenchmark(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) <= Math.max(0.001, Math.abs(expected) * 0.00001);
}
