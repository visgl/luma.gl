// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, type QuerySet} from '@luma.gl/core';
import {
  type CompiledGPUCommandGraph,
  GPUCommandGraph,
  type GPUCommandGraphEncoding,
  type GraphDataView
} from '@luma.gl/experimental';
import {
  GPUIVFFlatIndex,
  GPUSimilaritySearch,
  importGPUEmbeddingTable
} from '@luma.gl/experimental/luvs';
import {GPUData, GPURecordBatch, GPUTable, type FixedSizeList} from '@luma.gl/tables';

export const LUVS_BENCHMARK_WARMUP_ITERATIONS = 1;
export const LUVS_BENCHMARK_MEASURED_ITERATIONS = 5;
const INDEX_TRAINING_ITERATIONS = 4;
const INVALID_SOURCE_ROW = 0xffff_ffff;
const FLOAT32_RANKING_TOLERANCE = 8 * 2 ** -23;

export type LuvsBenchmarkOptions = {
  datasetRowCount: number;
  dimensions: number;
  queryCount: number;
  resultCount: number;
  filterPercentage: number;
  listCount: number;
  probeCount: number;
};

type LuvsBenchmarkFixture = {
  dataset: Float32Array;
  queries: Float32Array;
  filter: Uint32Array;
};

type LuvsSearchOutput = {
  ids: Buffer;
  scores: Buffer;
  resultCounts: Buffer;
  candidateCounts: Buffer;
};

type LuvsCPUOutput = {
  ids: Uint32Array;
  scores: Float32Array;
  resultCounts: Uint32Array;
  candidateCounts: Uint32Array;
};

type LuvsIndexBuffers = {
  centroids: Buffer;
  labels: Buffer;
  listCounts: Buffer;
  listOffsets: Buffer;
  listSourceIds: Buffer;
  listRowIndices: Buffer;
  status: Buffer;
};

export type LuvsBenchmarkResult = {
  label: string;
  medianMilliseconds: number;
  encodeMilliseconds?: number;
  readbackMilliseconds?: number;
  rerankMilliseconds?: number;
  resultCount: number;
  candidateCount: number;
  recall?: number;
};

type LuvsGraphExecution = {
  milliseconds: number;
  encoding: GPUCommandGraphEncoding;
};

export type LuvsBenchmarkReport = {
  results: LuvsBenchmarkResult[];
  uploadMilliseconds: number;
  indexBuildMilliseconds: number;
  indexByteLength: number;
  options: LuvsBenchmarkOptions;
  timestampQueries: boolean;
  deviceLabel: string;
};

export async function runLuvsBenchmark(
  device: Device,
  options: LuvsBenchmarkOptions
): Promise<LuvsBenchmarkReport> {
  const fixture = makeLuvsBenchmarkFixture(options);
  const exactCPU = measureCPUEmbeddingSearch(fixture, options);
  const filteredOracle = runCPUEmbeddingSearch(fixture, options, fixture.filter);
  const ownedBuffers: Buffer[] = [];
  const ownedTables: GPUTable[] = [];
  const compiledGraphs: CompiledGPUCommandGraph[] = [];

  try {
    const uploadStartTime = performance.now();
    const dataset = createBenchmarkEmbeddingTable(
      device,
      ownedTables,
      fixture.dataset,
      options.datasetRowCount,
      options.dimensions,
      'dataset',
      2
    );
    const queries = createBenchmarkEmbeddingTable(
      device,
      ownedTables,
      fixture.queries,
      options.queryCount,
      options.dimensions,
      'queries',
      1
    );
    const filterBuffer = createLuvsInputBuffer(device, ownedBuffers, fixture.filter);
    await waitForLuvsCompletion(device);
    const uploadMilliseconds = performance.now() - uploadStartTime;

    const exactOutput = createLuvsSearchOutput(device, ownedBuffers, options);
    const filteredOutput = createLuvsSearchOutput(device, ownedBuffers, options);
    const approximateOutput = createLuvsSearchOutput(device, ownedBuffers, options);
    const indexBuffers = createLuvsIndexBuffers(device, ownedBuffers, options);

    const exactGraph = compileLuvsExactGraph(device, dataset, queries, exactOutput, options);
    compiledGraphs.push(exactGraph);
    const filteredGraph = compileLuvsExactGraph(
      device,
      dataset,
      queries,
      filteredOutput,
      options,
      filterBuffer
    );
    compiledGraphs.push(filteredGraph);
    const indexBuildGraph = compileLuvsIndexBuild(device, dataset, indexBuffers, options);
    compiledGraphs.push(indexBuildGraph);
    const approximateGraph = compileLuvsIndexSearch(
      device,
      dataset,
      queries,
      indexBuffers,
      approximateOutput,
      filterBuffer,
      options
    );
    compiledGraphs.push(approximateGraph);

    const exactGPU = await measureLuvsGraph(
      device,
      exactGraph,
      exactOutput,
      exactCPU.output,
      options,
      'WebGPU exact'
    );
    const filteredGPU = await measureLuvsGraph(
      device,
      filteredGraph,
      filteredOutput,
      filteredOracle,
      options,
      'WebGPU exact + selection'
    );

    await executeLuvsGraph(device, indexBuildGraph, 'luvs-index-warmup');
    const indexBuild = await executeLuvsGraph(device, indexBuildGraph, 'luvs-index-build');
    const approximateGPU = await measureLuvsGraph(
      device,
      approximateGraph,
      approximateOutput,
      filteredOracle,
      options,
      'WebGPU IVF-flat + selection',
      true
    );

    const indexByteLength = Object.values(indexBuffers).reduce(
      (byteLength, buffer) => byteLength + buffer.byteLength,
      0
    );
    return {
      results: [exactCPU.result, exactGPU, filteredGPU, approximateGPU],
      uploadMilliseconds,
      indexBuildMilliseconds: indexBuild.milliseconds,
      indexByteLength,
      options,
      timestampQueries: device.features.has('timestamp-query'),
      deviceLabel: device.info.renderer || device.info.vendor || device.info.gpu
    };
  } finally {
    for (const graph of compiledGraphs) graph.destroy();
    for (const table of ownedTables) table.destroy();
    for (const buffer of ownedBuffers) buffer.destroy();
  }
}

function makeLuvsBenchmarkFixture(options: LuvsBenchmarkOptions): LuvsBenchmarkFixture {
  const dataset = new Float32Array(options.datasetRowCount * options.dimensions);
  const queries = new Float32Array(options.queryCount * options.dimensions);
  const filter = new Uint32Array(options.datasetRowCount);
  let randomState = 0x4c55_5653;

  for (let elementIndex = 0; elementIndex < dataset.length; elementIndex++) {
    randomState = (Math.imul(randomState, 1_664_525) + 1_013_904_223) >>> 0;
    dataset[elementIndex] = randomState / 0x8000_0000 - 1;
  }
  for (let queryIndex = 0; queryIndex < options.queryCount; queryIndex++) {
    const sourceRow = Math.floor(
      ((queryIndex + 1) * options.datasetRowCount) / (options.queryCount + 1)
    );
    const sourceOffset = sourceRow * options.dimensions;
    const queryOffset = queryIndex * options.dimensions;
    for (let dimension = 0; dimension < options.dimensions; dimension++) {
      queries[queryOffset + dimension] = Math.fround(
        dataset[sourceOffset + dimension] + ((dimension % 7) - 3) * 0.0001
      );
    }
  }
  for (let rowIndex = 0; rowIndex < options.datasetRowCount; rowIndex++) {
    const selection = (Math.imul(rowIndex + 1, 2_654_435_761) >>> 0) % 100;
    filter[rowIndex] = Number(selection < options.filterPercentage);
  }

  return {dataset, queries, filter};
}

function measureCPUEmbeddingSearch(
  fixture: LuvsBenchmarkFixture,
  options: LuvsBenchmarkOptions
): {result: LuvsBenchmarkResult; output: LuvsCPUOutput} {
  for (let iteration = 0; iteration < LUVS_BENCHMARK_WARMUP_ITERATIONS; iteration++) {
    runCPUEmbeddingSearch(fixture, options);
  }

  const durations: number[] = [];
  let output = runCPUEmbeddingSearch(fixture, options);
  for (let iteration = 0; iteration < LUVS_BENCHMARK_MEASURED_ITERATIONS; iteration++) {
    const startTime = performance.now();
    output = runCPUEmbeddingSearch(fixture, options);
    durations.push(performance.now() - startTime);
  }

  return {
    result: {
      label: 'CPU exact',
      medianMilliseconds: getLuvsMedian(durations),
      resultCount: sumLuvsCounts(output.resultCounts),
      candidateCount: sumLuvsCounts(output.candidateCounts)
    },
    output
  };
}

function runCPUEmbeddingSearch(
  fixture: LuvsBenchmarkFixture,
  options: LuvsBenchmarkOptions,
  filter?: Uint32Array
): LuvsCPUOutput {
  const output: LuvsCPUOutput = {
    ids: new Uint32Array(options.queryCount * options.resultCount).fill(INVALID_SOURCE_ROW),
    scores: new Float32Array(options.queryCount * options.resultCount).fill(Infinity),
    resultCounts: new Uint32Array(options.queryCount),
    candidateCounts: new Uint32Array(options.queryCount)
  };

  for (let queryIndex = 0; queryIndex < options.queryCount; queryIndex++) {
    const resultOffset = queryIndex * options.resultCount;
    for (let rowIndex = 0; rowIndex < options.datasetRowCount; rowIndex++) {
      if (filter && filter[rowIndex] === 0) continue;
      output.candidateCounts[queryIndex]++;
      let score = 0;
      const queryOffset = queryIndex * options.dimensions;
      const rowOffset = rowIndex * options.dimensions;
      for (let dimension = 0; dimension < options.dimensions; dimension++) {
        const difference = Math.fround(
          fixture.queries[queryOffset + dimension] - fixture.dataset[rowOffset + dimension]
        );
        score = Math.fround(score + Math.fround(difference * difference));
      }

      let insertionIndex = Math.min(output.resultCounts[queryIndex], options.resultCount);
      while (insertionIndex > 0) {
        const precedingIndex = resultOffset + insertionIndex - 1;
        if (
          output.scores[precedingIndex] < score ||
          (output.scores[precedingIndex] === score && output.ids[precedingIndex] < rowIndex)
        ) {
          break;
        }
        if (insertionIndex < options.resultCount) {
          output.scores[resultOffset + insertionIndex] = output.scores[precedingIndex];
          output.ids[resultOffset + insertionIndex] = output.ids[precedingIndex];
        }
        insertionIndex--;
      }
      if (insertionIndex < options.resultCount) {
        output.ids[resultOffset + insertionIndex] = rowIndex;
        output.scores[resultOffset + insertionIndex] = score;
        output.resultCounts[queryIndex] = Math.min(
          output.resultCounts[queryIndex] + 1,
          options.resultCount
        );
      }
    }
  }

  return output;
}

function createBenchmarkEmbeddingTable(
  device: Device,
  ownedTables: GPUTable[],
  values: Float32Array,
  rowCount: number,
  dimensions: number,
  identifier: string,
  chunkCount: number
): GPUTable {
  const batches: GPURecordBatch[] = [];
  const format: FixedSizeList<'float32'> = `fixed-size-list<float32,${dimensions}>`;

  for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
    const sourceRowOffset = Math.floor((chunkIndex * rowCount) / chunkCount);
    const endRowOffset = Math.floor(((chunkIndex + 1) * rowCount) / chunkCount);
    const chunkValues = values.subarray(
      sourceRowOffset * dimensions,
      endRowOffset * dimensions
    );
    const buffer = device.createBuffer({
      id: `${identifier}-chunk-${chunkIndex}`,
      data: chunkValues,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    const embedding = new GPUData({
      buffer,
      format,
      length: endRowOffset - sourceRowOffset,
      ownsBuffer: true
    });
    batches.push(
      new GPURecordBatch({
        gpuData: {embedding},
        bufferLayout: [],
        sourceInfo: {
          sourceBatchIndex: chunkIndex,
          sourceRowIndexOffset: sourceRowOffset,
          sourceRowCount: endRowOffset - sourceRowOffset
        }
      })
    );
  }

  const table = new GPUTable({batches});
  ownedTables.push(table);
  return table;
}

function createLuvsInputBuffer(
  device: Device,
  ownedBuffers: Buffer[],
  data: Float32Array | Uint32Array
): Buffer {
  const buffer = device.createBuffer({data, usage: Buffer.STORAGE | Buffer.COPY_DST});
  ownedBuffers.push(buffer);
  return buffer;
}

function createLuvsStorageBuffer(
  device: Device,
  ownedBuffers: Buffer[],
  valueCount: number
): Buffer {
  const buffer = device.createBuffer({
    byteLength: Math.max(valueCount, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  ownedBuffers.push(buffer);
  return buffer;
}

function createLuvsSearchOutput(
  device: Device,
  ownedBuffers: Buffer[],
  options: LuvsBenchmarkOptions
): LuvsSearchOutput {
  const valueCount = options.queryCount * options.resultCount;
  return {
    ids: createLuvsStorageBuffer(device, ownedBuffers, valueCount),
    scores: createLuvsStorageBuffer(device, ownedBuffers, valueCount),
    resultCounts: createLuvsStorageBuffer(device, ownedBuffers, options.queryCount),
    candidateCounts: createLuvsStorageBuffer(device, ownedBuffers, options.queryCount)
  };
}

function createLuvsIndexBuffers(
  device: Device,
  ownedBuffers: Buffer[],
  options: LuvsBenchmarkOptions
): LuvsIndexBuffers {
  return {
    centroids: createLuvsStorageBuffer(
      device,
      ownedBuffers,
      options.listCount * options.dimensions
    ),
    labels: createLuvsStorageBuffer(device, ownedBuffers, options.datasetRowCount),
    listCounts: createLuvsStorageBuffer(device, ownedBuffers, options.listCount),
    listOffsets: createLuvsStorageBuffer(device, ownedBuffers, options.listCount + 1),
    listSourceIds: createLuvsStorageBuffer(device, ownedBuffers, options.datasetRowCount),
    listRowIndices: createLuvsStorageBuffer(device, ownedBuffers, options.datasetRowCount),
    status: createLuvsStorageBuffer(device, ownedBuffers, 3)
  };
}

function compileLuvsExactGraph(
  device: Device,
  dataset: GPUTable,
  queries: GPUTable,
  output: LuvsSearchOutput,
  options: LuvsBenchmarkOptions,
  filterBuffer?: Buffer
): CompiledGPUCommandGraph {
  const graph = new GPUCommandGraph(device, {
    id: filterBuffer ? 'docs-luvs-filtered' : 'docs-luvs-exact'
  });
  new GPUSimilaritySearch({
    id: filterBuffer ? 'filtered-search' : 'exact-search',
    dataset: importGPUEmbeddingTable(graph, dataset, {column: 'embedding', id: 'dataset'}),
    queries: importGPUEmbeddingTable(graph, queries, {column: 'embedding', id: 'queries'}),
    ...importLuvsSearchOutput(graph, output, options),
    k: options.resultCount,
    metric: 'squared-euclidean',
    ...(filterBuffer
      ? {
          filterMask: importLuvsView(
            graph,
            'selection-mask',
            filterBuffer,
            'uint32',
            options.datasetRowCount
          )
        }
      : {})
  }).addToGraph(graph);
  return graph.compile();
}

function compileLuvsIndexBuild(
  device: Device,
  dataset: GPUTable,
  buffers: LuvsIndexBuffers,
  options: LuvsBenchmarkOptions
): CompiledGPUCommandGraph {
  const graph = new GPUCommandGraph(device, {id: 'docs-luvs-index-build'});
  const index = createLuvsIndex(graph, dataset, buffers, options);
  index.addToGraph(graph);
  return graph.compile();
}

function compileLuvsIndexSearch(
  device: Device,
  dataset: GPUTable,
  queries: GPUTable,
  buffers: LuvsIndexBuffers,
  output: LuvsSearchOutput,
  filterBuffer: Buffer,
  options: LuvsBenchmarkOptions
): CompiledGPUCommandGraph {
  const graph = new GPUCommandGraph(device, {id: 'docs-luvs-index-search'});
  const index = createLuvsIndex(graph, dataset, buffers, options);
  index.addSearchToGraph(graph, {
    id: 'approximate-search',
    queries: importGPUEmbeddingTable(graph, queries, {column: 'embedding', id: 'queries'}),
    ...importLuvsSearchOutput(graph, output, options),
    k: options.resultCount,
    metric: 'squared-euclidean',
    probeCount: options.probeCount,
    filterMask: importLuvsView(
      graph,
      'selection-mask',
      filterBuffer,
      'uint32',
      options.datasetRowCount
    ),
    fallback: 'none'
  });
  return graph.compile();
}

function createLuvsIndex(
  graph: GPUCommandGraph,
  dataset: GPUTable,
  buffers: LuvsIndexBuffers,
  options: LuvsBenchmarkOptions
): GPUIVFFlatIndex {
  return new GPUIVFFlatIndex({
    id: 'docs-luvs-index',
    dataset: importGPUEmbeddingTable(graph, dataset, {column: 'embedding', id: 'dataset'}),
    listCount: options.listCount,
    centroids: importLuvsView(
      graph,
      'centroids',
      buffers.centroids,
      'float32',
      options.listCount * options.dimensions
    ),
    labels: importLuvsView(graph, 'labels', buffers.labels, 'uint32', options.datasetRowCount),
    listCounts: importLuvsView(
      graph,
      'list-counts',
      buffers.listCounts,
      'uint32',
      options.listCount
    ),
    listOffsets: importLuvsView(
      graph,
      'list-offsets',
      buffers.listOffsets,
      'uint32',
      options.listCount + 1
    ),
    listSourceIds: importLuvsView(
      graph,
      'list-source-ids',
      buffers.listSourceIds,
      'uint32',
      options.datasetRowCount
    ),
    listRowIndices: importLuvsView(
      graph,
      'list-row-indices',
      buffers.listRowIndices,
      'uint32',
      options.datasetRowCount
    ),
    status: importLuvsView(graph, 'index-status', buffers.status, 'uint32', 3),
    maxIterations: INDEX_TRAINING_ITERATIONS
  });
}

function importLuvsSearchOutput(
  graph: GPUCommandGraph,
  output: LuvsSearchOutput,
  options: LuvsBenchmarkOptions
): {
  outputIds: GraphDataView<'uint32'>;
  outputScores: GraphDataView<'float32'>;
  resultCounts: GraphDataView<'uint32'>;
  candidateCounts: GraphDataView<'uint32'>;
} {
  const valueCount = options.queryCount * options.resultCount;
  return {
    outputIds: importLuvsView(graph, 'output-ids', output.ids, 'uint32', valueCount),
    outputScores: importLuvsView(graph, 'output-scores', output.scores, 'float32', valueCount),
    resultCounts: importLuvsView(
      graph,
      'result-counts',
      output.resultCounts,
      'uint32',
      options.queryCount
    ),
    candidateCounts: importLuvsView(
      graph,
      'candidate-counts',
      output.candidateCounts,
      'uint32',
      options.queryCount
    )
  };
}

function importLuvsView<Format extends 'float32' | 'uint32'>(
  graph: GPUCommandGraph,
  identifier: string,
  buffer: Buffer,
  format: Format,
  length: number
): GraphDataView<Format> {
  const handle = graph.importBuffer(
    {id: identifier, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length});
}

async function measureLuvsGraph(
  device: Device,
  graph: CompiledGPUCommandGraph,
  output: LuvsSearchOutput,
  oracle: LuvsCPUOutput,
  options: LuvsBenchmarkOptions,
  label: string,
  approximate = false
): Promise<LuvsBenchmarkResult> {
  await executeLuvsGraph(device, graph, `${label}-validation`);
  const validationStartTime = performance.now();
  const actual = await readLuvsSearchOutput(output, options);
  const readbackMilliseconds = performance.now() - validationStartTime;
  const recall = validateLuvsOutput(actual, oracle, label, approximate);

  for (let iteration = 0; iteration < LUVS_BENCHMARK_WARMUP_ITERATIONS; iteration++) {
    await executeLuvsGraph(device, graph, `${label}-warmup-${iteration}`);
  }

  const measurements: LuvsGraphExecution[] = [];
  for (let iteration = 0; iteration < LUVS_BENCHMARK_MEASURED_ITERATIONS; iteration++) {
    measurements.push(await executeLuvsGraph(device, graph, `${label}-measurement-${iteration}`));
  }

  const rerankMilliseconds = await profileLuvsCandidatePasses(device, graph, label);
  return {
    label,
    medianMilliseconds: getLuvsMedian(measurements.map(result => result.milliseconds)),
    encodeMilliseconds: getLuvsMedian(
      measurements.map(result => result.encoding.stats.cpuEncodeTimeMilliseconds)
    ),
    readbackMilliseconds,
    resultCount: sumLuvsCounts(actual.resultCounts),
    candidateCount: sumLuvsCounts(actual.candidateCounts),
    ...(rerankMilliseconds === undefined ? {} : {rerankMilliseconds}),
    ...(approximate ? {recall} : {})
  };
}

async function executeLuvsGraph(
  device: Device,
  graph: CompiledGPUCommandGraph,
  identifier: string,
  querySet?: QuerySet
): Promise<LuvsGraphExecution> {
  const commandEncoder = device.createCommandEncoder({
    id: identifier,
    ...(querySet ? {timeProfilingQuerySet: querySet} : {})
  });
  let submitted = false;
  const startTime = performance.now();

  try {
    const encoding = graph.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    submitted = true;
    await waitForLuvsCompletion(device);
    return {milliseconds: performance.now() - startTime, encoding};
  } catch (error) {
    if (!submitted) commandEncoder.destroy();
    throw error;
  }
}

async function waitForLuvsCompletion(device: Device): Promise<void> {
  const fence = device.createFence();
  try {
    await fence.signaled;
  } finally {
    fence.destroy();
  }
}

async function profileLuvsCandidatePasses(
  device: Device,
  graph: CompiledGPUCommandGraph,
  identifier: string
): Promise<number | undefined> {
  if (!device.features.has('timestamp-query')) return undefined;
  const querySet = device.createQuerySet({
    id: `${identifier}-timestamps`,
    type: 'timestamp',
    count: Math.max(graph.stats.nodeOrder.length * 2, 2)
  });

  try {
    const execution = await executeLuvsGraph(device, graph, `${identifier}-profile`, querySet);
    if (!execution.encoding.canReadGPUTimings) return undefined;
    const report = await execution.encoding.readTimings();
    const candidatePasses = report.nodes.filter(node =>
      /candidate|distance|score|rerank|search|select/i.test(node.id)
    );
    const measuredPasses = candidatePasses.filter(node => node.gpuTimeMilliseconds !== undefined);
    if (measuredPasses.length === 0) return undefined;
    return measuredPasses.reduce((duration, node) => duration + (node.gpuTimeMilliseconds ?? 0), 0);
  } finally {
    querySet.destroy();
  }
}

async function readLuvsSearchOutput(
  output: LuvsSearchOutput,
  options: LuvsBenchmarkOptions
): Promise<LuvsCPUOutput> {
  const [ids, scores, resultCounts, candidateCounts] = await Promise.all([
    output.ids.readAsync(),
    output.scores.readAsync(),
    output.resultCounts.readAsync(),
    output.candidateCounts.readAsync()
  ]);
  const outputLength = options.queryCount * options.resultCount;
  return {
    ids: new Uint32Array(ids.buffer, ids.byteOffset, outputLength),
    scores: new Float32Array(scores.buffer, scores.byteOffset, outputLength),
    resultCounts: new Uint32Array(
      resultCounts.buffer,
      resultCounts.byteOffset,
      options.queryCount
    ),
    candidateCounts: new Uint32Array(
      candidateCounts.buffer,
      candidateCounts.byteOffset,
      options.queryCount
    )
  };
}

/** Validates independent top-K membership while accepting only Float32-equivalent rank swaps. */
export function validateLuvsOutput(
  actual: LuvsCPUOutput,
  oracle: LuvsCPUOutput,
  label: string,
  approximate: boolean
): number {
  let matchingResults = 0;
  let expectedResults = 0;
  const resultCapacity = actual.ids.length / actual.resultCounts.length;

  for (let queryIndex = 0; queryIndex < actual.resultCounts.length; queryIndex++) {
    const actualCount = actual.resultCounts[queryIndex];
    const expectedCount = oracle.resultCounts[queryIndex];
    if (actualCount > resultCapacity || (!approximate && actualCount !== expectedCount)) {
      throw new Error(`${label} returned an invalid result count for query ${queryIndex}.`);
    }
    if (!approximate && actual.candidateCounts[queryIndex] !== oracle.candidateCounts[queryIndex]) {
      throw new Error(`${label} returned an incorrect eligible-candidate count.`);
    }

    const resultOffset = queryIndex * resultCapacity;
    const expectedIds = new Map<number, number>();
    for (let resultIndex = 0; resultIndex < expectedCount; resultIndex++) {
      expectedIds.set(oracle.ids[resultOffset + resultIndex], resultIndex);
    }
    const actualIds = new Set<number>();
    expectedResults += expectedCount;
    for (let resultIndex = 0; resultIndex < actualCount; resultIndex++) {
      const actualIdentifier = actual.ids[resultOffset + resultIndex];
      if (expectedIds.has(actualIdentifier)) matchingResults++;
      if (!approximate) {
        const expectedPosition = expectedIds.get(actualIdentifier);
        if (expectedPosition === undefined || actualIds.has(actualIdentifier)) {
          throw new Error(`${label} returned a different nearest-neighbor set than the CPU oracle.`);
        }
        actualIds.add(actualIdentifier);
        const expectedRankingScore = oracle.scores[resultOffset + resultIndex];
        const expectedScore = oracle.scores[resultOffset + expectedPosition];
        const rankingTolerance =
          Math.max(1, Math.abs(expectedRankingScore), Math.abs(expectedScore)) *
          FLOAT32_RANKING_TOLERANCE;
        if (Math.abs(expectedRankingScore - expectedScore) > rankingTolerance) {
          throw new Error(`${label} returned a different nearest-neighbor order than the CPU oracle.`);
        }
        const actualScore = actual.scores[resultOffset + resultIndex];
        if (Math.abs(actualScore - expectedScore) > Math.max(0.0001, expectedScore * 0.0001)) {
          throw new Error(`${label} returned a score outside the Float32 accuracy tolerance.`);
        }
      }
    }
  }

  return expectedResults === 0 ? 1 : matchingResults / expectedResults;
}

function getLuvsMedian(values: number[]): number {
  const orderedValues = [...values].sort((first, second) => first - second);
  return orderedValues[Math.floor(orderedValues.length / 2)];
}

function sumLuvsCounts(values: Uint32Array): number {
  return values.reduce((total, value) => total + value, 0);
}
