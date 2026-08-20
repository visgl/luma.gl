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
} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUDataFrame,
  and,
  column,
  literal,
  type CompiledGPUDataFrameGroupedAggregation,
  type CompiledGPUDataFrameJoin,
  type CompiledGPUDataFrameQuery,
  type CompiledGPUDataFrameSort,
  type GPUDataFrameQueryParameters
} from '@luma.gl/experimental/gpu-dataframe';
import {GPUVector, type GPUData} from '@luma.gl/gpgpu/gpu-data';
import * as arrow from 'apache-arrow';

const DEFAULT_ROW_COUNT = 65_536;
const MAXIMUM_ROW_COUNT = 1_048_576;
const DEFAULT_MEASUREMENT_ITERATIONS = 3;
const DEFAULT_WARMUP_ITERATIONS = 1;
const MAXIMUM_MEASUREMENT_ITERATIONS = 9;
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
  rows: BenchmarkSourceRows;
  batchRowCounts: readonly number[];
};

type BenchmarkSourceRows = {
  fares: Float32Array;
  categories: Uint32Array;
  fareValidity: Uint8Array;
  categoryValidity: Uint8Array;
  rowCount: number;
  sliceOffset: number;
};

type BenchmarkWorkloadName = 'filter' | 'groups' | 'sorting' | 'join';

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
  filter: CompiledGPUDataFrameQuery<BenchmarkDerivedColumns>;
  groups: CompiledGPUDataFrameGroupedAggregation<{
    category: 'uint32';
    count: 'uint32';
    totalAdjustedFare: 'float32';
  }>;
  sorting: CompiledGPUDataFrameSort<BenchmarkDerivedColumns>;
  join: CompiledGPUDataFrameJoin<BenchmarkDerivedColumns, BenchmarkRightColumns>;
  index: CompiledGPUCommandGraph<GPUDataFrameQueryParameters>;
};

/** Explicit timing phases recorded from real local Arrow, CPU, and fence-synchronized GPU work. */
export type GPUDataFrameBenchmarkTimings = {
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

/** Median fence-synchronized GPU and equivalent CPU measurements for one dataframe operation. */
export type GPUDataFrameBenchmarkWorkload = {
  cpuMilliseconds: number;
  gpuMilliseconds: number;
  cpuRowsPerSecond: number;
  gpuRowsPerSecond: number;
  speedup: number;
};

/** Repetition policy used to prevent a single cold submission from masquerading as throughput. */
export type GPUDataFrameBenchmarkMeasurement = {
  iterations: number;
  warmupIterations: number;
};

/** Small independently verified outputs; full Arrow columns are never read back from the GPU. */
export type GPUDataFrameBenchmarkSummaries = {
  filterCount: number;
  groupCounts: number[];
  topKRowIds: number[][];
  joinCounts: number[];
  joinLeftRowIds: number[][];
  joinRightRowIds: number[][];
};

/** Completed opt-in Arrow-to-GPU-Dataframe benchmark, measured on the caller's actual WebGPU device. */
export type GPUDataFrameBenchmarkResult = {
  rowCount: number;
  batchRowCounts: number[];
  timings: GPUDataFrameBenchmarkTimings;
  workloads: Record<BenchmarkWorkloadName, GPUDataFrameBenchmarkWorkload>;
  measurement: GPUDataFrameBenchmarkMeasurement;
  validation: {
    filter: boolean;
    groups: boolean;
    sorting: boolean;
    join: boolean;
  };
  summaries: GPUDataFrameBenchmarkSummaries;
  readbackBytes: number;
};

/** Runs real Arrow uploads and correctness-gated dataframe workloads only when explicitly invoked. */
export async function runGPUDataFrameBenchmark(
  device: Device,
  {
    rowCount = DEFAULT_ROW_COUNT,
    iterations = DEFAULT_MEASUREMENT_ITERATIONS,
    warmupIterations = DEFAULT_WARMUP_ITERATIONS,
    signal
  }: {
    rowCount?: number;
    iterations?: number;
    warmupIterations?: number;
    signal?: AbortSignal;
  } = {}
): Promise<GPUDataFrameBenchmarkResult> {
  if (device.type !== 'webgpu') {
    throw new Error('The luDF benchmark requires a WebGPU device');
  }
  if (!Number.isSafeInteger(rowCount) || rowCount < 2 || rowCount > MAXIMUM_ROW_COUNT) {
    throw new Error(`The luDF benchmark requires between 2 and ${MAXIMUM_ROW_COUNT} rows`);
  }
  if (
    !Number.isSafeInteger(iterations) ||
    iterations < 1 ||
    iterations > MAXIMUM_MEASUREMENT_ITERATIONS
  ) {
    throw new Error(
      `The luDF benchmark requires between 1 and ${MAXIMUM_MEASUREMENT_ITERATIONS} measured iterations`
    );
  }
  if (
    !Number.isSafeInteger(warmupIterations) ||
    warmupIterations < 0 ||
    warmupIterations > MAXIMUM_MEASUREMENT_ITERATIONS
  ) {
    throw new Error(
      `The luDF benchmark requires between 0 and ${MAXIMUM_MEASUREMENT_ITERATIONS} warmup iterations`
    );
  }
  signal?.throwIfAborted();

  const dataset = createBenchmarkDataset(rowCount);
  const reference = createGPUDataFrameBenchmarkReference(dataset.rows, dataset.batchRowCounts);
  const cpuSamples = measureBenchmarkCPUWorkloads(
    dataset.rows,
    dataset.batchRowCounts,
    iterations,
    warmupIterations,
    signal
  );
  const cpuMilliseconds = Object.values(cpuSamples).reduce(
    (sum, samples) => sum + getBenchmarkMedian(samples),
    0
  );

  const ownedBuffers: Buffer[] = [];
  let left: GPUDataFrame<BenchmarkColumns> | undefined;
  let right: GPUDataFrame<BenchmarkRightColumns> | undefined;
  let graphs: BenchmarkGraphs | undefined;
  try {
    const uploadStarted = performance.now();
    const leftUpload = makeGPUAnalyticsTableFromArrowTable(device, dataset.left);
    try {
      left = new GPUDataFrame({...leftUpload, ownership: 'owned'});
    } catch (error) {
      leftUpload.table.destroy();
      for (const validity of Object.values(leftUpload.validity)) validity?.destroy();
      throw error;
    }
    const rightUpload = makeGPUAnalyticsTableFromArrowTable(device, dataset.right);
    try {
      right = new GPUDataFrame({...rightUpload, ownership: 'owned'});
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
      'gpu-dataframe-benchmark-standalone-index',
      signal
    );
    const gpuSamples: Record<BenchmarkWorkloadName, number[]> = {
      filter: [],
      groups: [],
      sorting: [],
      join: []
    };
    for (const [name, graph] of [
      ['filter', graphs.filter],
      ['groups', graphs.groups],
      ['sorting', graphs.sorting],
      ['join', graphs.join]
    ] as const) {
      for (let iteration = 0; iteration < warmupIterations + iterations; iteration++) {
        const milliseconds = await executeBenchmarkGraph(
          device,
          graph,
          `gpu-dataframe-benchmark-${name}-${iteration}`,
          signal
        );
        if (iteration >= warmupIterations) gpuSamples[name].push(milliseconds);
      }
    }
    const executionMilliseconds = Object.values(gpuSamples).reduce(
      (sum, samples) => sum + getBenchmarkMedian(samples),
      0
    );

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
      const failedWorkloads = Object.entries({filter, groups, sorting, join})
        .filter(([, valid]) => !valid)
        .map(([name]) => name)
        .join(', ');
      throw new Error(
        `The luDF benchmark GPU outputs do not match the CPU reference: ${failedWorkloads}` +
          (!groups
            ? ` (GPU sums ${groupSums.join(', ')}; CPU sums ${reference.groupSums.join(', ')})`
            : '')
      );
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
      workloads: {
        filter: summarizeGPUDataFrameBenchmarkSamples(
          rowCount,
          cpuSamples.filter,
          gpuSamples.filter
        ),
        groups: summarizeGPUDataFrameBenchmarkSamples(
          rowCount,
          cpuSamples.groups,
          gpuSamples.groups
        ),
        sorting: summarizeGPUDataFrameBenchmarkSamples(
          rowCount,
          cpuSamples.sorting,
          gpuSamples.sorting
        ),
        join: summarizeGPUDataFrameBenchmarkSamples(rowCount, cpuSamples.join, gpuSamples.join)
      },
      measurement: {iterations, warmupIterations},
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
  const fares = new Float32Array(totalRows);
  const categories = new Uint32Array(totalRows);
  const tripIds = new Uint32Array(totalRows);
  const fareBitmap = new Uint8Array(Math.ceil(totalRows / 8));
  const categoryBitmap = new Uint8Array(Math.ceil(totalRows / 8));
  let fareNullCount = 0;
  let categoryNullCount = 0;

  for (let index = 0; index < totalRows; index++) {
    // Half-integer fares and the half-integer adjustment keep million-row sums exactly representable.
    fares[index] = Math.fround(((index * 37) % 121) - 30 + 0.5);
    if (index % 13 === 0) {
      fareNullCount++;
    } else {
      fareBitmap[index >> 3] |= 1 << (index & 7);
    }
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
  const fareVector = new arrow.Vector([
    arrow.makeData({
      type: new arrow.Float32(),
      length: totalRows,
      data: fares,
      nullBitmap: fareBitmap,
      nullCount: fareNullCount
    })
  ]);
  const tripIdVector = arrow.makeVector(tripIds);
  const fields = [
    new arrow.Field('fare', new arrow.Float32(), true, new Map([['unit', 'USD']])),
    new arrow.Field('category', dictionaryType, true),
    new arrow.Field('tripId', new arrow.Uint32(), false)
  ];
  const schema = new arrow.Schema<BenchmarkArrowColumns>(
    fields,
    new Map([['dataset', 'arrow-gpu-dataframe-taxi']])
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
    new Map([['dataset', 'arrow-gpu-dataframe-categories']])
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

  return {
    left: new arrow.Table(schema, batches),
    right: new arrow.Table(rightSchema, rightBatches),
    rows: {
      fares,
      categories,
      fareValidity: fareBitmap,
      categoryValidity: categoryBitmap,
      rowCount,
      sliceOffset: SLICE_OFFSET
    },
    batchRowCounts: [midpoint, 0, rowCount - midpoint]
  };
}

/** @internal Computes equivalent projected CPU work for every independent GPU workload. */
export function createGPUDataFrameBenchmarkReference(
  rows: BenchmarkSourceRows,
  batchRowCounts: readonly number[]
): BenchmarkReference {
  return {
    filterCounts: createBenchmarkFilterReference(rows, batchRowCounts),
    ...createBenchmarkGroupReference(rows),
    topKRowIds: createBenchmarkSortingReference(rows, batchRowCounts),
    ...createBenchmarkJoinReference(rows, batchRowCounts)
  };
}

/** Times equivalent CPU operations independently so fused JavaScript work cannot bias comparisons. */
function measureBenchmarkCPUWorkloads(
  rows: BenchmarkSourceRows,
  batchRowCounts: readonly number[],
  iterations: number,
  warmupIterations: number,
  signal: AbortSignal | undefined
): Record<BenchmarkWorkloadName, number[]> {
  const samples: Record<BenchmarkWorkloadName, number[]> = {
    filter: [],
    groups: [],
    sorting: [],
    join: []
  };
  const workloads = {
    filter: () => createBenchmarkFilterReference(rows, batchRowCounts),
    groups: () => createBenchmarkGroupReference(rows),
    sorting: () => createBenchmarkSortingReference(rows, batchRowCounts),
    join: () => createBenchmarkJoinReference(rows, batchRowCounts)
  };
  for (const name of ['filter', 'groups', 'sorting', 'join'] as const) {
    for (let iteration = 0; iteration < warmupIterations + iterations; iteration++) {
      signal?.throwIfAborted();
      const started = performance.now();
      workloads[name]();
      const milliseconds = performance.now() - started;
      if (iteration >= warmupIterations) samples[name].push(milliseconds);
    }
  }
  return samples;
}

/** Checks packed nullable Arrow bitmaps without allocating one JavaScript object per source row. */
function isBenchmarkRowSelected(rows: BenchmarkSourceRows, rowId: number): boolean {
  const sourceIndex = rowId + rows.sliceOffset;
  const mask = 1 << (sourceIndex & 7);
  return (
    (rows.fareValidity[sourceIndex >> 3] & mask) !== 0 &&
    (rows.categoryValidity[sourceIndex >> 3] & mask) !== 0 &&
    rows.fares[sourceIndex] > MINIMUM_FARE
  );
}

/** Materializes the same complete float32 projection present in every compiled GPU query. */
function createBenchmarkAdjustedFares(rows: BenchmarkSourceRows): Float32Array {
  const adjustedFares = new Float32Array(rows.rowCount);
  for (let rowId = 0; rowId < rows.rowCount; rowId++) {
    adjustedFares[rowId] = Math.fround(rows.fares[rowId + rows.sliceOffset] + DRIVER_TIP);
  }
  return adjustedFares;
}

function createBenchmarkFilterReference(
  rows: BenchmarkSourceRows,
  batchRowCounts: readonly number[]
): number[] {
  createBenchmarkAdjustedFares(rows);
  const counts = batchRowCounts.map(() => 0);
  const midpoint = batchRowCounts[0];
  for (let rowId = 0; rowId < rows.rowCount; rowId++) {
    if (isBenchmarkRowSelected(rows, rowId)) counts[rowId < midpoint ? 0 : 2]++;
  }
  return counts;
}

function createBenchmarkGroupReference(rows: BenchmarkSourceRows): {
  groupCounts: number[];
  groupSums: number[];
} {
  const adjustedFares = createBenchmarkAdjustedFares(rows);
  const groupCounts = CATEGORY_LABELS.map(() => 0);
  const groupSums = CATEGORY_LABELS.map(() => 0);
  for (let rowId = 0; rowId < rows.rowCount; rowId++) {
    if (!isBenchmarkRowSelected(rows, rowId)) continue;
    const sourceIndex = rowId + rows.sliceOffset;
    const category = rows.categories[sourceIndex];
    groupCounts[category]++;
    groupSums[category] += adjustedFares[rowId];
  }
  return {groupCounts, groupSums};
}

function createBenchmarkSortingReference(
  rows: BenchmarkSourceRows,
  batchRowCounts: readonly number[]
): number[][] {
  const adjustedFares = createBenchmarkAdjustedFares(rows);
  const midpoint = batchRowCounts[0];
  const selectedByBatch: number[][] = batchRowCounts.map(() => []);
  for (let rowId = 0; rowId < rows.rowCount; rowId++) {
    if (isBenchmarkRowSelected(rows, rowId)) {
      selectedByBatch[rowId < midpoint ? 0 : 2].push(rowId);
    }
  }
  return selectedByBatch.map(rowIds =>
    rowIds
      .sort((left, right) => adjustedFares[right] - adjustedFares[left] || left - right)
      .slice(0, TOP_K_LIMIT)
  );
}

function createBenchmarkJoinReference(
  rows: BenchmarkSourceRows,
  batchRowCounts: readonly number[]
): Pick<BenchmarkReference, 'joinRequiredCounts' | 'joinLeftRowIds' | 'joinRightRowIds'> {
  createBenchmarkAdjustedFares(rows);
  const joinRequiredCounts = batchRowCounts.map(() => 0);
  const joinLeftRowIds: number[][] = batchRowCounts.map(() => []);
  const joinRightRowIds: number[][] = batchRowCounts.map(() => []);
  const midpoint = batchRowCounts[0];
  for (let rowId = 0; rowId < rows.rowCount; rowId++) {
    if (!isBenchmarkRowSelected(rows, rowId)) continue;
    const batchIndex = rowId < midpoint ? 0 : 2;
    joinRequiredCounts[batchIndex]++;
    if (joinLeftRowIds[batchIndex].length < JOIN_CAPACITY) {
      joinLeftRowIds[batchIndex].push(rowId);
      joinRightRowIds[batchIndex].push(rows.categories[rowId + rows.sliceOffset]);
    }
  }
  return {joinRequiredCounts, joinLeftRowIds, joinRightRowIds};
}

/** Summarizes observed CPU/GPU samples without inventing a crossover or including setup phases. */
export function summarizeGPUDataFrameBenchmarkSamples(
  rowCount: number,
  cpuSamples: readonly number[],
  gpuSamples: readonly number[]
): GPUDataFrameBenchmarkWorkload {
  if (!Number.isSafeInteger(rowCount) || rowCount < 1) {
    throw new Error('Benchmark throughput requires a positive row count');
  }
  const cpuMilliseconds = getBenchmarkMedian(cpuSamples);
  const gpuMilliseconds = getBenchmarkMedian(gpuSamples);
  return {
    cpuMilliseconds,
    gpuMilliseconds,
    cpuRowsPerSecond: cpuMilliseconds > 0 ? (rowCount * 1000) / cpuMilliseconds : 0,
    gpuRowsPerSecond: gpuMilliseconds > 0 ? (rowCount * 1000) / gpuMilliseconds : 0,
    speedup: gpuMilliseconds > 0 ? cpuMilliseconds / gpuMilliseconds : 0
  };
}

function getBenchmarkMedian(samples: readonly number[]): number {
  if (samples.length === 0 || samples.some(sample => !Number.isFinite(sample) || sample < 0)) {
    throw new Error('Benchmark samples must contain finite nonnegative durations');
  }
  const sorted = [...samples].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[midpoint - 1] + sorted[midpoint]) / 2 : sorted[midpoint];
}

/** Compiles four reusable dataframe workloads plus one truthful, standalone equivalent index. */
function compileBenchmarkGraphs(
  device: Device,
  left: GPUDataFrame<BenchmarkColumns>,
  right: GPUDataFrame<BenchmarkRightColumns>,
  ownedBuffers: Buffer[]
): BenchmarkGraphs {
  const query = left
    .withColumn('adjustedFare', column('fare').add(literal(DRIVER_TIP)), {format: 'float32'})
    .filter(and(column('fare').greaterThan(literal(MINIMUM_FARE)), column('category').isValid()));

  const filter = query.compile(
    new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {id: 'gpu-dataframe-benchmark-filter'})
  );
  let groups: BenchmarkGraphs['groups'] | undefined;
  let sorting: BenchmarkGraphs['sorting'] | undefined;
  let join: BenchmarkGraphs['join'] | undefined;
  let index: BenchmarkGraphs['index'] | undefined;
  try {
    groups = query
      .groupBy('category')
      .aggregate({count: 'count', totalAdjustedFare: {sum: 'adjustedFare'}})
      .compile(new GPUCommandGraph(device, {id: 'gpu-dataframe-benchmark-groups'}));
    sorting = query
      .topK('adjustedFare', TOP_K_LIMIT)
      .compile(new GPUCommandGraph(device, {id: 'gpu-dataframe-benchmark-sorting'}));
    join = query
      .innerJoin(right, {leftOn: 'category', rightOn: 'category', capacity: JOIN_CAPACITY})
      .compile(new GPUCommandGraph(device, {id: 'gpu-dataframe-benchmark-join'}));
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
  right: GPUDataFrame<BenchmarkRightColumns>,
  ownedBuffers: Buffer[]
): CompiledGPUCommandGraph<GPUDataFrameQueryParameters> {
  const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
    id: 'gpu-dataframe-benchmark-equivalent-index'
  });
  const category = right.column('category');
  if (!(category instanceof GPUVector)) {
    throw new Error('The luDF benchmark right category must be a GPU vector');
  }
  const keys = graph.importGPUVector('gpu-dataframe-index-source', category);
  const keyBuffer = createBenchmarkIndexBuffer(
    device,
    'gpu-dataframe-index-keys',
    INDEX_CAPACITY,
    ownedBuffers
  );
  const valueBuffer = createBenchmarkIndexBuffer(
    device,
    'gpu-dataframe-index-values',
    INDEX_CAPACITY,
    ownedBuffers
  );
  const statisticsBuffer = createBenchmarkIndexBuffer(
    device,
    'gpu-dataframe-index-statistics',
    GPU_HASH_INDEX_STATISTICS_LENGTH,
    ownedBuffers
  );
  const tableKeys = importBenchmarkUint32(
    graph,
    'gpu-dataframe-index-table-keys',
    keyBuffer,
    INDEX_CAPACITY
  );
  const tableValues = importBenchmarkUint32(
    graph,
    'gpu-dataframe-index-table-values',
    valueBuffer,
    INDEX_CAPACITY
  );
  const statistics = importBenchmarkUint32(
    graph,
    'gpu-dataframe-index-build-statistics',
    statisticsBuffer,
    GPU_HASH_INDEX_STATISTICS_LENGTH
  );
  const firstValues = right.batches.map(batch => batch.sourceInfo?.sourceRowIndexOffset ?? 0);
  new GPUBatchHashIndex({
    id: 'gpu-dataframe-equivalent-right-index',
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
  graph: GPUCommandGraph<GPUDataFrameQueryParameters>,
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
    | CompiledGPUCommandGraph<GPUDataFrameQueryParameters>
    | CompiledGPUDataFrameQuery<BenchmarkDerivedColumns>
    | CompiledGPUDataFrameGroupedAggregation<{
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
