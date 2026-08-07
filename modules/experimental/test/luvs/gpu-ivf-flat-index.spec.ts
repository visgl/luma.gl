// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, GraphVectorView, type GraphDataView} from '@luma.gl/experimental';
import {GPUData, GPUVector, type FixedSizeList} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';
import {importGPUEmbeddingVector} from '../../src/luvs/embedding-matrix';
import {GPUIVFFlatIndex} from '../../src/luvs/gpu-ivf-flat-index';
import type {GraphEmbeddingMatrix} from '../../src/luvs/types';

const INVALID_SOURCE_ID = 0xffffffff;

test('GPUIVFFlatIndex builds stable lists and exactly reranks bounded approximate probes', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'luvs-ivf-flat'});
  const resources: Buffer[] = [];
  const dataset = makeEmbeddingView(graph, resources, 'dataset', [
    {
      values: Float32Array.from([0, 0, 1, 0, 0, 1]),
      sourceIds: Uint32Array.from([42, 7, 9])
    },
    {
      values: Float32Array.from([10, 10, 11, 10, 10, 11]),
      sourceIds: Uint32Array.from([100, 101, 102])
    }
  ]);
  const queries = makeEmbeddingView(graph, resources, 'queries', [
    {values: Float32Array.from([0, 0, 10, 10])}
  ]);
  const centroids = makeOutput(graph, resources, 'centroids', 'float32', 4);
  const labels = makeOutput(graph, resources, 'labels', 'uint32', dataset.rowCount);
  const listCounts = makeOutput(graph, resources, 'list-counts', 'uint32', 2);
  const listOffsets = makeOutput(graph, resources, 'list-offsets', 'uint32', 3);
  const listSourceIds = makeOutput(graph, resources, 'list-source-ids', 'uint32', dataset.rowCount);
  const listRowIndices = makeOutput(
    graph,
    resources,
    'list-row-indices',
    'uint32',
    dataset.rowCount
  );
  const status = makeOutput(graph, resources, 'training-status', 'uint32', 3);
  const index = new GPUIVFFlatIndex({
    id: 'ivf-stable',
    dataset,
    listCount: 2,
    centroids: centroids.view,
    labels: labels.view,
    listCounts: listCounts.view,
    listOffsets: listOffsets.view,
    listSourceIds: listSourceIds.view,
    listRowIndices: listRowIndices.view,
    status: status.view,
    maxIterations: 3
  });
  t.equal(index.isBuildRegistered, false, 'the constructor does not build or submit index work');
  index.addBuildToGraph(graph);
  t.equal(index.isBuildRegistered, true, 'index construction has an explicit graph lifecycle');

  const approximate = makeSearchOutputs(graph, resources, 'approximate', 2, 2);
  index.addSearchToGraph(graph, {
    id: 'approximate',
    queries,
    ...approximate.views,
    k: 2,
    probeCount: 1,
    tileSize: 2,
    fallback: 'none'
  });

  const firstFilter = makeInput(graph, resources, 'filter-first', Uint32Array.from([0, 0, 1]));
  const secondFilter = makeInput(graph, resources, 'filter-second', Uint32Array.from([1, 0, 0]));
  const filterMask = new GraphVectorView({
    id: 'chunked-filter',
    name: 'chunked-filter',
    format: 'uint32',
    length: dataset.rowCount,
    valueLength: dataset.rowCount,
    stride: 1,
    byteStride: Uint32Array.BYTES_PER_ELEMENT,
    rowByteLength: Uint32Array.BYTES_PER_ELEMENT,
    data: [firstFilter, secondFilter]
  });

  const expanded = makeSearchOutputs(graph, resources, 'expanded', 2, 2);
  index.addSearchToGraph(graph, {
    id: 'expanded',
    queries,
    ...expanded.views,
    k: 2,
    probeCount: 1,
    filterMask,
    tileSize: 2
  });

  const restricted = makeSearchOutputs(graph, resources, 'restricted', 2, 2);
  index.addSearchToGraph(graph, {
    id: 'restricted',
    queries,
    ...restricted.views,
    k: 2,
    probeCount: 1,
    filterMask,
    fallback: 'none',
    tileSize: 2
  });

  const zeroResults = makeSearchOutputs(graph, resources, 'zero-results', 2, 0);
  index.addSearchToGraph(graph, {
    id: 'zero-results',
    queries,
    ...zeroResults.views,
    k: 0,
    probeCount: 1,
    tileSize: 2
  });
  const zeroResultsWithoutCounts = makeSearchOutputs(
    graph,
    resources,
    'zero-results-without-counts',
    2,
    0
  );
  index.addSearchToGraph(graph, {
    id: 'zero-results-without-counts',
    queries,
    outputIds: zeroResultsWithoutCounts.views.outputIds,
    outputScores: zeroResultsWithoutCounts.views.outputScores,
    resultCounts: zeroResultsWithoutCounts.views.resultCounts,
    k: 0
  });

  const compiled = graph.compile();
  try {
    const encoder = device.createCommandEncoder({id: 'ivf-flat-encoder'});
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());

    t.deepEqual(
      await readUnsigned(listCounts.buffer, 2),
      [3, 3],
      'both inverted lists are counted'
    );
    t.deepEqual(
      await readUnsigned(listOffsets.buffer, 3),
      [0, 3, 6],
      'exclusive offsets include the trailing total'
    );
    t.deepEqual(
      await readUnsigned(listSourceIds.buffer, 6),
      [42, 7, 9, 100, 101, 102],
      'explicit source IDs remain stable in original source order'
    );
    t.deepEqual(
      await readUnsigned(listRowIndices.buffer, 6),
      [0, 1, 2, 3, 4, 5],
      'persistent logical row references remain parallel to stable inverted-list source IDs'
    );
    t.deepEqual(
      await readSearchOutputs(approximate, 2, 2),
      {
        ids: [42, 7, 100, 101],
        scores: [0, 1, 0, 1],
        resultCounts: [2, 2],
        candidateCounts: [3, 3]
      },
      'bounded exact reranking breaks equal-score ties by stable source ID'
    );
    t.deepEqual(
      await readSearchOutputs(expanded, 2, 2),
      {
        ids: [9, 100, 100, 9],
        scores: [1, 200, 0, 181],
        resultCounts: [2, 2],
        candidateCounts: [2, 2]
      },
      'restrictive chunked LuxFilter masks expand all lists when fewer than K candidates remain'
    );
    t.deepEqual(
      await readSearchOutputs(restricted, 2, 2),
      {
        ids: [9, INVALID_SOURCE_ID, 100, INVALID_SOURCE_ID],
        scores: [1, Number.POSITIVE_INFINITY, 0, Number.POSITIVE_INFINITY],
        resultCounts: [1, 1],
        candidateCounts: [1, 1]
      },
      'disabling fallback preserves approximate reduced probing and explicit result counts'
    );
    t.deepEqual(
      await readSearchOutputs(zeroResults, 2, 0),
      {ids: [], scores: [], resultCounts: [0, 0], candidateCounts: [3, 3]},
      'zero K never binds empty result arrays and still reports filtered eligible candidates'
    );
    t.deepEqual(
      await readUnsigned(zeroResultsWithoutCounts.resultCounts, 2),
      [0, 0],
      'zero K without candidate counts clears result counts without evaluating source rows'
    );

    const repeatEncoder = device.createCommandEncoder({id: 'ivf-flat-repeat'});
    compiled.encode(repeatEncoder, {parameters: undefined});
    device.submit(repeatEncoder.finish());
    t.deepEqual(
      await readUnsigned(listSourceIds.buffer, 6),
      [42, 7, 9, 100, 101, 102],
      'repeated graph encodings deterministically rebuild all stable source IDs'
    );
  } finally {
    compiled.destroy();
    for (const resource of resources) resource.destroy();
  }
  t.end();
});

test('GPUIVFFlatIndex preserves cosine, inner-product, zero-vector, and non-finite semantics', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'luvs-ivf-flat-metrics'});
  const resources: Buffer[] = [];
  const dataset = makeEmbeddingView(graph, resources, 'metric-dataset', [
    {
      values: Float32Array.from([
        0,
        0,
        3e38,
        0,
        0,
        1e20,
        Number.NaN,
        1,
        Number.POSITIVE_INFINITY,
        1,
        1,
        0,
        2,
        2
      ]),
      sourceIds: Uint32Array.from([12, 5, 7, 99, 100, 3, INVALID_SOURCE_ID])
    }
  ]);
  const queries = makeEmbeddingView(graph, resources, 'metric-queries', [
    {values: Float32Array.from([0, 0, 3e38, 0, Number.NaN, 0])}
  ]);
  const metricLabels = makeOutput(graph, resources, 'metric-labels', 'uint32', dataset.rowCount);
  const metricRowIndices = makeOutput(
    graph,
    resources,
    'metric-row-indices',
    'uint32',
    dataset.rowCount
  );
  const index = new GPUIVFFlatIndex({
    id: 'metric-index',
    dataset,
    listCount: 1,
    centroids: makeOutput(graph, resources, 'metric-centroids', 'float32', 2).view,
    labels: metricLabels.view,
    listCounts: makeOutput(graph, resources, 'metric-counts', 'uint32', 1).view,
    listOffsets: makeOutput(graph, resources, 'metric-offsets', 'uint32', 2).view,
    listSourceIds: makeOutput(graph, resources, 'metric-source-ids', 'uint32', dataset.rowCount)
      .view,
    listRowIndices: metricRowIndices.view,
    maxIterations: 2
  });
  const overlappingLabels = graph.createDataView(dataset.chunks[0].values.buffer, {
    format: 'uint32',
    length: dataset.rowCount
  });
  t.throws(
    () =>
      new GPUIVFFlatIndex({
        id: 'overlapping-index',
        dataset,
        listCount: 1,
        centroids: index.centroids,
        labels: overlappingLabels,
        listCounts: index.listCounts,
        listOffsets: index.listOffsets,
        listSourceIds: index.listSourceIds,
        listRowIndices: index.listRowIndices
      }),
    /must not overlap source embedding data/,
    'writable inverted-list assignments cannot overwrite embedding source rows'
  );
  index.addToGraph(graph);

  const cosine = makeSearchOutputs(graph, resources, 'cosine', 3, 3);
  index.addSearchToGraph(graph, {
    id: 'cosine',
    queries,
    ...cosine.views,
    k: 3,
    metric: 'cosine',
    tileSize: 2
  });
  const innerProduct = makeSearchOutputs(graph, resources, 'inner-product', 3, 3);
  index.addSearchToGraph(graph, {
    id: 'inner-product',
    queries,
    ...innerProduct.views,
    k: 3,
    metric: 'inner-product',
    tileSize: 2
  });
  const squaredOverflow = makeSearchOutputs(graph, resources, 'squared-overflow', 3, 4);
  index.addSearchToGraph(graph, {
    id: 'squared-overflow',
    queries,
    ...squaredOverflow.views,
    k: 4,
    metric: 'squared-euclidean',
    tileSize: 2
  });

  t.throws(
    () =>
      index.addSearchToGraph(graph, {
        id: 'aliased-result',
        queries,
        ...cosine.views,
        outputIds: index.listSourceIds,
        k: 1
      }),
    /must not alias source or index buffers/,
    'query results must not overwrite caller-owned inverted-list source IDs'
  );

  const compiled = graph.compile();
  try {
    const encoder = device.createCommandEncoder({id: 'ivf-flat-metric-encoder'});
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());

    const cosineOutput = await readSearchOutputs(cosine, 3, 3);
    t.equal(
      (await readUnsigned(metricLabels.buffer, dataset.rowCount)).at(-1),
      INVALID_SOURCE_ID,
      'the reserved invalid source ID never enters cluster labels or inverted-list candidate ranges'
    );
    t.deepEqual(
      (await readUnsigned(metricRowIndices.buffer, dataset.rowCount)).slice(0, 4),
      [0, 1, 2, 5],
      'sorted persistent row references exclude non-finite rows and reserved source IDs'
    );
    t.deepEqual(
      cosineOutput.ids,
      [12, 3, 5, 3, 5, 7, INVALID_SOURCE_ID, INVALID_SOURCE_ID, INVALID_SOURCE_ID],
      'zero vectors, large equal-direction vectors, and invalid queries preserve deterministic IDs'
    );
    t.deepEqual(cosineOutput.scores.slice(0, 3), [1, 0, 0], 'zero-vector cosine remains exact');
    t.ok(
      Math.abs(cosineOutput.scores[3] - 1) < 1e-6 && Math.abs(cosineOutput.scores[4] - 1) < 1e-6,
      'clamped normalized cosine handles near-maximum float32 inputs without overflowing norms'
    );
    t.deepEqual(
      cosineOutput.scores.slice(5),
      [0, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
      'invalid cosine results retain their metric-specific negative-infinity sentinel'
    );
    t.deepEqual(cosineOutput.resultCounts, [3, 3, 0], 'non-finite queries have no matches');
    t.deepEqual(cosineOutput.candidateCounts, [4, 4, 0], 'non-finite source rows remain excluded');

    const innerProductOutput = await readSearchOutputs(innerProduct, 3, 3);
    t.deepEqual(
      innerProductOutput.ids,
      [3, 5, 7, 5, 3, 7, INVALID_SOURCE_ID, INVALID_SOURCE_ID, INVALID_SOURCE_ID],
      'inner-product ties use stable IDs and positive overflow sorts before finite products'
    );
    t.equal(
      innerProductOutput.scores[3],
      Number.POSITIVE_INFINITY,
      'finite Float32 source values retain an overflowing inner-product score'
    );
    t.deepEqual(innerProductOutput.resultCounts, [3, 3, 0]);
    t.deepEqual(innerProductOutput.candidateCounts, [4, 4, 0]);

    const squaredOverflowOutput = await readSearchOutputs(squaredOverflow, 3, 4);
    t.deepEqual(
      squaredOverflowOutput.ids,
      [
        12,
        3,
        5,
        7,
        5,
        3,
        7,
        12,
        INVALID_SOURCE_ID,
        INVALID_SOURCE_ID,
        INVALID_SOURCE_ID,
        INVALID_SOURCE_ID
      ],
      'overflowing squared-distance ties still fill top-K in stable source-ID order'
    );
    t.deepEqual(
      squaredOverflowOutput.scores.slice(4, 8),
      [0, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
      'all finite source embeddings retain their representable or infinite distance scores'
    );
    t.deepEqual(squaredOverflowOutput.resultCounts, [4, 4, 0]);
    t.deepEqual(squaredOverflowOutput.candidateCounts, [4, 4, 0]);
  } finally {
    compiled.destroy();
    for (const resource of resources) resource.destroy();
  }
  t.end();
});

test('GPUIVFFlatIndex preserves indexed stable IDs across independently imported search graphs', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const resources: Buffer[] = [];
  const buildGraph = new GPUCommandGraph(device, {id: 'luvs-ivf-prebuilt-build'});
  const buildDataset = makeEmbeddingView(buildGraph, resources, 'prebuilt-dataset', [
    {
      values: Float32Array.from([0, 0, 1, 0]),
      sourceIds: Uint32Array.from([42, 7])
    },
    {
      values: Float32Array.from([10, 10, 11, 10]),
      sourceIds: Uint32Array.from([99, 3])
    }
  ]);
  const centroids = makeOutput(buildGraph, resources, 'prebuilt-centroids', 'float32', 4);
  const labels = makeOutput(buildGraph, resources, 'prebuilt-labels', 'uint32', 4);
  const listCounts = makeOutput(buildGraph, resources, 'prebuilt-list-counts', 'uint32', 2);
  const listOffsets = makeOutput(buildGraph, resources, 'prebuilt-list-offsets', 'uint32', 3);
  const listSourceIds = makeOutput(buildGraph, resources, 'prebuilt-list-source-ids', 'uint32', 4);
  const listRowIndices = makeOutput(
    buildGraph,
    resources,
    'prebuilt-list-row-indices',
    'uint32',
    4
  );
  const buildProps = {
    id: 'prebuilt-index',
    dataset: buildDataset,
    listCount: 2,
    centroids: centroids.view,
    labels: labels.view,
    listCounts: listCounts.view,
    listOffsets: listOffsets.view,
    listSourceIds: listSourceIds.view,
    listRowIndices: listRowIndices.view,
    maxIterations: 3
  };

  for (const dimensions of [0, -1, 1.5]) {
    t.throws(
      () =>
        new GPUIVFFlatIndex({
          ...buildProps,
          dataset: {...buildDataset, dimensions}
        }),
      /dimensions must be a positive uint32 integer/,
      `direct IVF descriptor rejects ${dimensions} embedding dimensions`
    );
  }
  for (const rowStride of [0, 1]) {
    t.throws(
      () =>
        new GPUIVFFlatIndex({
          ...buildProps,
          dataset: {
            ...buildDataset,
            chunks: [{...buildDataset.chunks[0], rowStride}, ...buildDataset.chunks.slice(1)]
          }
        }),
      /row stride must contain every embedding dimension/,
      `direct IVF descriptor rejects incomplete stride ${rowStride} without entering tile loops`
    );
  }
  t.throws(
    () => new GPUIVFFlatIndex({...buildProps, dataset: {...buildDataset, rowCount: -1}}),
    /row count must be a non-negative uint32 integer/,
    'negative direct IVF row counts fail synchronously before allocation'
  );

  const buildIndex = new GPUIVFFlatIndex(buildProps);
  buildIndex.addToGraph(buildGraph);
  const compiledBuild = buildGraph.compile();
  let compiledSearch: ReturnType<GPUCommandGraph['compile']> | undefined;
  try {
    const buildEncoder = device.createCommandEncoder({id: 'luvs-ivf-prebuilt-build-encoder'});
    compiledBuild.encode(buildEncoder, {parameters: undefined});
    device.submit(buildEncoder.finish());
    t.deepEqual(
      await readUnsigned(listSourceIds.buffer, 4),
      [42, 7, 99, 3],
      'the build persists explicit stable IDs separately from logical source positions'
    );

    const searchGraph = new GPUCommandGraph(device, {id: 'luvs-ivf-prebuilt-search'});
    const searchDataset = reimportEmbeddingViewWithoutSourceIds(
      searchGraph,
      buildDataset,
      'prebuilt-search-dataset'
    );
    const searchQueries = makeEmbeddingView(searchGraph, resources, 'prebuilt-queries', [
      {values: Float32Array.from([0, 0, 10, 10])}
    ]);
    const searchIndex = new GPUIVFFlatIndex({
      id: 'prebuilt-search-index',
      dataset: searchDataset,
      listCount: 2,
      centroids: importExistingOutput(searchGraph, 'prebuilt-search-centroids', centroids),
      labels: importExistingOutput(searchGraph, 'prebuilt-search-labels', labels),
      listCounts: importExistingOutput(searchGraph, 'prebuilt-search-list-counts', listCounts),
      listOffsets: importExistingOutput(searchGraph, 'prebuilt-search-list-offsets', listOffsets),
      listSourceIds: importExistingOutput(
        searchGraph,
        'prebuilt-search-list-source-ids',
        listSourceIds
      ),
      listRowIndices: importExistingOutput(
        searchGraph,
        'prebuilt-search-list-row-indices',
        listRowIndices
      )
    });
    const results = makeSearchOutputs(searchGraph, resources, 'prebuilt-search-results', 2, 2);

    t.throws(
      () =>
        searchIndex.addSearchToGraph(searchGraph, {
          id: 'invalid-prebuilt-query',
          queries: {
            ...searchQueries,
            chunks: [{...searchQueries.chunks[0], rowStride: 1}]
          },
          ...results.views,
          k: 2
        }),
      /row stride must contain every embedding dimension/,
      'manually constructed query descriptors fail before graph resources or nodes are created'
    );

    searchIndex.addSearchToGraph(searchGraph, {
      id: 'prebuilt-search-results',
      queries: searchQueries,
      ...results.views,
      k: 2,
      probeCount: 2,
      tileSize: 1
    });
    compiledSearch = searchGraph.compile();
    const searchEncoder = device.createCommandEncoder({id: 'luvs-ivf-prebuilt-search-encoder'});
    compiledSearch.encode(searchEncoder, {parameters: undefined});
    device.submit(searchEncoder.finish());
    t.deepEqual(
      await readSearchOutputs(results, 2, 2),
      {
        ids: [42, 7, 99, 3],
        scores: [0, 1, 0, 1],
        resultCounts: [2, 2],
        candidateCounts: [4, 4]
      },
      'reranking uses persisted inverted-list IDs even when search embedding chunks omit source IDs'
    );
  } finally {
    compiledSearch?.destroy();
    compiledBuild.destroy();
    for (const resource of resources) resource.destroy();
  }
  t.end();
});

test('GPUIVFFlatIndex initializes empty datasets and accepts zero-row query batches', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'luvs-ivf-flat-empty'});
  const resources: Buffer[] = [];
  const dataset = makeEmbeddingView(graph, resources, 'empty-dataset', [
    {values: new Float32Array(0)}
  ]);
  const queries = makeEmbeddingView(graph, resources, 'nonempty-query', [
    {values: Float32Array.from([2, 3])}
  ]);
  const emptyQueries = makeEmbeddingView(graph, resources, 'empty-query', []);
  const listCounts = makeOutput(graph, resources, 'empty-counts', 'uint32', 2);
  const listOffsets = makeOutput(graph, resources, 'empty-offsets', 'uint32', 3);
  const status = makeOutput(graph, resources, 'empty-status', 'uint32', 3);
  const index = new GPUIVFFlatIndex({
    id: 'empty-index',
    dataset,
    listCount: 2,
    centroids: makeOutput(graph, resources, 'empty-centroids', 'float32', 4).view,
    labels: makeOutput(graph, resources, 'empty-labels', 'uint32', 0).view,
    listCounts: listCounts.view,
    listOffsets: listOffsets.view,
    listSourceIds: makeOutput(graph, resources, 'empty-source-ids', 'uint32', 0).view,
    listRowIndices: makeOutput(graph, resources, 'empty-row-indices', 'uint32', 0).view,
    status: status.view,
    maxIterations: 2
  });
  index.addToGraph(graph);
  const results = makeSearchOutputs(graph, resources, 'empty-results', 1, 2);
  index.addSearchToGraph(graph, {id: 'empty-results', queries, ...results.views, k: 2});
  const noQueries = makeSearchOutputs(graph, resources, 'no-queries', 0, 2);
  index.addSearchToGraph(graph, {
    id: 'no-queries',
    queries: emptyQueries,
    ...noQueries.views,
    k: 2
  });

  const compiled = graph.compile();
  try {
    const encoder = device.createCommandEncoder({id: 'ivf-flat-empty-encoder'});
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    t.deepEqual(await readUnsigned(listCounts.buffer, 2), [0, 0], 'empty list counts are cleared');
    t.deepEqual(await readUnsigned(listOffsets.buffer, 3), [0, 0, 0], 'empty offsets include zero');
    t.deepEqual(await readUnsigned(status.buffer, 3), [0, 0, 1], 'empty training starts converged');
    t.deepEqual(
      await readSearchOutputs(results, 1, 2),
      {
        ids: [INVALID_SOURCE_ID, INVALID_SOURCE_ID],
        scores: [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
        resultCounts: [0],
        candidateCounts: [0]
      },
      'empty candidate populations preserve explicit sentinel scores and zero match counts'
    );
  } finally {
    compiled.destroy();
    for (const resource of resources) resource.destroy();
  }
  t.end();
});

test('GPUIVFFlatIndex shards query outputs under artificial binding and dispatch limits', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  await withReducedDeviceLimits(
    device,
    {maxStorageBufferBindingSize: 2048, maxComputeWorkgroupsPerDimension: 2},
    async () => {
      const graph = new GPUCommandGraph(device, {id: 'luvs-ivf-bounded-queries'});
      const resources: Buffer[] = [];
      const dataset = makeEmbeddingView(graph, resources, 'bounded-dataset', [
        {values: Float32Array.from([0, 0, 1, 0, 2, 0, 3, 0])}
      ]);
      const queryCount = 257;
      const queries = makeEmbeddingView(graph, resources, 'bounded-queries', [
        {
          values: Float32Array.from({length: queryCount * 2}, (_, index) =>
            index % 2 === 0 ? Math.floor(index / 2) % 4 : 0
          )
        }
      ]);
      const index = new GPUIVFFlatIndex({
        id: 'bounded-index',
        dataset,
        listCount: 1,
        centroids: makeOutput(graph, resources, 'bounded-centroids', 'float32', 2).view,
        labels: makeOutput(graph, resources, 'bounded-labels', 'uint32', 4).view,
        listCounts: makeOutput(graph, resources, 'bounded-counts', 'uint32', 1).view,
        listOffsets: makeOutput(graph, resources, 'bounded-offsets', 'uint32', 2).view,
        listSourceIds: makeOutput(graph, resources, 'bounded-source-ids', 'uint32', 4).view,
        listRowIndices: makeOutput(graph, resources, 'bounded-row-indices', 'uint32', 4).view,
        maxIterations: 2
      });
      index.addToGraph(graph);
      const results = makeSearchOutputs(graph, resources, 'bounded-results', queryCount, 4);
      index.addSearchToGraph(graph, {
        id: 'bounded-results',
        queries,
        ...results.views,
        k: 4
      });

      const compiled = graph.compile();
      try {
        t.ok(
          compiled.stats.nodeOrder.filter(identifier =>
            identifier.includes('bounded-results-query-')
          ).length >= 3,
          'query-major results are split across multiple independently bounded graph passes'
        );
        const encoder = device.createCommandEncoder({id: 'ivf-flat-bounded-query-encoder'});
        compiled.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        const actual = await readSearchOutputs(results, queryCount, 4);
        for (let queryIndex = 0; queryIndex < queryCount; queryIndex++) {
          const queryValue = queryIndex % 4;
          const expected = [0, 1, 2, 3].sort((first, second) => {
            const difference = (first - queryValue) ** 2 - (second - queryValue) ** 2;
            return difference || first - second;
          });
          t.deepEqual(
            actual.ids.slice(queryIndex * 4, queryIndex * 4 + 4),
            expected,
            `bounded query ${queryIndex} preserves deterministic exact global order`
          );
        }
        t.ok(
          actual.resultCounts.every(count => count === 4),
          'all 257 query result counts survive'
        );
        t.ok(
          actual.candidateCounts.every(count => count === 4),
          'all 257 query candidate counts survive'
        );
      } finally {
        compiled.destroy();
        for (const resource of resources) resource.destroy();
      }
    }
  );
  t.end();
});

type EmbeddingFixture = {values: Float32Array; sourceIds?: Uint32Array};

function makeEmbeddingView(
  graph: GPUCommandGraph,
  resources: Buffer[],
  id: string,
  chunks: EmbeddingFixture[]
): GraphEmbeddingMatrix {
  let sourceRowOffset = 0;
  const matrixChunks = chunks.map((chunk, chunkIndex) => {
    const valuesBuffer = graph.device.createBuffer({
      id: `${id}-values-${chunkIndex}`,
      data: chunk.values.length > 0 ? chunk.values : new Float32Array(1),
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    resources.push(valuesBuffer);
    const rowCount = chunk.values.length / 2;
    const values = new GPUVector<FixedSizeList<'float32', 2>>({
      type: 'buffer',
      name: `${id}-values-${chunkIndex}`,
      buffer: valuesBuffer,
      format: 'fixed-size-list<float32,2>',
      length: rowCount
    });
    let sourceRowIds: GPUVector<'uint32'> | undefined;
    if (chunk.sourceIds) {
      const sourceIdsBuffer = graph.device.createBuffer({
        id: `${id}-source-ids-${chunkIndex}`,
        data: chunk.sourceIds.length > 0 ? chunk.sourceIds : new Uint32Array(1),
        usage: Buffer.STORAGE | Buffer.COPY_DST
      });
      resources.push(sourceIdsBuffer);
      sourceRowIds = new GPUVector({
        type: 'buffer',
        name: `${id}-source-ids-${chunkIndex}`,
        buffer: sourceIdsBuffer,
        format: 'uint32',
        length: rowCount
      });
    }
    const imported = importGPUEmbeddingVector(graph, values, {
      id: `${id}-values-${chunkIndex}`,
      sourceRowOffset,
      ...(sourceRowIds ? {sourceRowIds} : {})
    });
    sourceRowOffset += rowCount;
    return imported.chunks[0];
  });
  return {dimensions: 2, rowCount: sourceRowOffset, chunks: matrixChunks};
}

function reimportEmbeddingViewWithoutSourceIds(
  graph: GPUCommandGraph,
  matrix: GraphEmbeddingMatrix,
  id: string
): GraphEmbeddingMatrix {
  const format: FixedSizeList<'float32'> = `fixed-size-list<float32,${matrix.dimensions}>`;
  const chunks = matrix.chunks.map(chunk => {
    const buffer = chunk.values.buffer.defaultBuffer;
    if (!(buffer instanceof Buffer)) {
      throw new Error('Prebuilt embedding fixtures require a caller-owned physical buffer');
    }
    return new GPUData<FixedSizeList<'float32'>>({
      buffer,
      format,
      length: chunk.rowCount,
      byteOffset: chunk.byteOffset,
      byteStride: chunk.rowStride * Float32Array.BYTES_PER_ELEMENT
    });
  });
  const vector = new GPUVector<FixedSizeList<'float32'>>({
    type: 'data',
    name: id,
    format,
    data: chunks
  });
  return importGPUEmbeddingVector(graph, vector, {
    id,
    sourceRowOffsets: matrix.chunks.map(chunk => chunk.sourceRowOffset)
  });
}

function importExistingOutput<Format extends 'float32' | 'uint32'>(
  graph: GPUCommandGraph,
  id: string,
  output: {view: GraphDataView<Format>; buffer: Buffer}
): GraphDataView<Format> {
  const handle = graph.importBuffer(
    {id, byteLength: output.buffer.byteLength, usage: output.buffer.usage},
    output.buffer
  );
  return graph.createDataView<Format>(handle, {
    format: output.view.format,
    length: output.view.length,
    byteOffset: output.view.byteOffset
  });
}

function makeInput(
  graph: GPUCommandGraph,
  resources: Buffer[],
  id: string,
  values: Uint32Array
): GraphDataView<'uint32'> {
  const buffer = graph.device.createBuffer({
    id,
    data: values,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  resources.push(buffer);
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format: 'uint32', length: values.length});
}

function makeOutput<T extends 'uint32' | 'float32'>(
  graph: GPUCommandGraph,
  resources: Buffer[],
  id: string,
  format: T,
  length: number
): {view: GraphDataView<T>; buffer: Buffer} {
  const buffer = graph.device.createBuffer({
    id,
    byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  resources.push(buffer);
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return {view: graph.createDataView(handle, {format, length}), buffer};
}

type IVFSearchFixture = {
  views: {
    outputIds: GraphDataView<'uint32'>;
    outputScores: GraphDataView<'float32'>;
    resultCounts: GraphDataView<'uint32'>;
    candidateCounts: GraphDataView<'uint32'>;
  };
  outputIds: Buffer;
  outputScores: Buffer;
  resultCounts: Buffer;
  candidateCounts: Buffer;
};

function makeSearchOutputs(
  graph: GPUCommandGraph,
  resources: Buffer[],
  id: string,
  queryCount: number,
  k: number
): IVFSearchFixture {
  const outputIds = makeOutput(graph, resources, `${id}-ids`, 'uint32', queryCount * k);
  const outputScores = makeOutput(graph, resources, `${id}-scores`, 'float32', queryCount * k);
  const resultCounts = makeOutput(graph, resources, `${id}-result-counts`, 'uint32', queryCount);
  const candidateCounts = makeOutput(
    graph,
    resources,
    `${id}-candidate-counts`,
    'uint32',
    queryCount
  );
  return {
    views: {
      outputIds: outputIds.view,
      outputScores: outputScores.view,
      resultCounts: resultCounts.view,
      candidateCounts: candidateCounts.view
    },
    outputIds: outputIds.buffer,
    outputScores: outputScores.buffer,
    resultCounts: resultCounts.buffer,
    candidateCounts: candidateCounts.buffer
  };
}

async function readSearchOutputs(fixture: IVFSearchFixture, queryCount: number, k: number) {
  return {
    ids: await readUnsigned(fixture.outputIds, queryCount * k),
    scores: await readFloating(fixture.outputScores, queryCount * k),
    resultCounts: await readUnsigned(fixture.resultCounts, queryCount),
    candidateCounts: await readUnsigned(fixture.candidateCounts, queryCount)
  };
}

async function readUnsigned(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}

async function readFloating(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
}

async function withReducedDeviceLimits<Result>(
  device: Device,
  overrides: Partial<
    Pick<Device['limits'], 'maxStorageBufferBindingSize' | 'maxComputeWorkgroupsPerDimension'>
  >,
  callback: () => Promise<Result>
): Promise<Result> {
  const originalDescriptor = Object.getOwnPropertyDescriptor(device, 'limits');
  const originalLimits = device.limits;
  Object.defineProperty(device, 'limits', {
    configurable: true,
    enumerable: originalDescriptor?.enumerable ?? true,
    writable: true,
    value: new Proxy(originalLimits, {
      get(target, property) {
        if (property === 'maxStorageBufferBindingSize' && overrides.maxStorageBufferBindingSize) {
          return overrides.maxStorageBufferBindingSize;
        }
        if (
          property === 'maxComputeWorkgroupsPerDimension' &&
          overrides.maxComputeWorkgroupsPerDimension
        ) {
          return overrides.maxComputeWorkgroupsPerDimension;
        }
        return Reflect.get(target, property, target);
      }
    })
  });
  try {
    return await callback();
  } finally {
    if (originalDescriptor) {
      Object.defineProperty(device, 'limits', originalDescriptor);
    } else {
      Object.defineProperty(device, 'limits', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: originalLimits
      });
    }
  }
}
