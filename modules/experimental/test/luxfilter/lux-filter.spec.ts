// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GraphVectorView,
  type CompiledGPUCommandGraph,
  type GraphDataView
} from '@luma.gl/experimental';
import {LuxFilter} from '@luma.gl/experimental/luxfilter';
import {GPUData, GPUVector, type GPUVectorFormat} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('LuxFilter coordinates linked views across reusable GPU-resident selections', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const rowCount = 8;
  const graph = new GPUCommandGraph(device, {id: 'lux-filter-linked-dashboard'});
  const buffers = [
    createBuffer(device, 'longitude', Float32Array.from([-2, -1, 0, 1, 2, 3, 4, 5])),
    createBuffer(device, 'latitude', Float32Array.from([0, 1, 2, 3, 4, 5, 6, 7])),
    createBuffer(device, 'value', Float32Array.from([5, 15, 25, 35, 45, 55, 65, 75])),
    createBuffer(device, 'category', Uint32Array.from([0, 1, 0, 1, 0, 1, 0, 1])),
    createOutputBuffer(device, 'histogram', 4),
    createOutputBuffer(device, 'selected-histogram', 4),
    createOutputBuffer(device, 'groups', 2),
    createOutputBuffer(device, 'global-mask', rowCount),
    createOutputBuffer(device, 'render-mask', rowCount),
    createOutputBuffer(device, 'visible-source-ids', rowCount),
    createOutputBuffer(device, 'visible-count', 1)
  ];
  const [
    longitudeBuffer,
    latitudeBuffer,
    valueBuffer,
    categoryBuffer,
    histogramBuffer,
    selectedHistogramBuffer,
    groupBuffer,
    globalMaskBuffer,
    renderMaskBuffer,
    visibleSourceIdsBuffer,
    visibleCountBuffer
  ] = buffers;

  const longitude = importView(graph, 'longitude', longitudeBuffer, 'float32', rowCount);
  const latitude = importView(graph, 'latitude', latitudeBuffer, 'float32', rowCount);
  const value = importView(graph, 'value', valueBuffer, 'float32', rowCount);
  const category = importView(graph, 'category', categoryBuffer, 'uint32', rowCount);
  const histogram = importView(graph, 'histogram', histogramBuffer, 'uint32', 4);
  const selectedHistogram = importView(
    graph,
    'selected-histogram',
    selectedHistogramBuffer,
    'uint32',
    4
  );
  const groups = importView(graph, 'groups', groupBuffer, 'uint32', 2);
  const globalMask = importView(graph, 'global-mask', globalMaskBuffer, 'uint32', rowCount);
  const renderMask = importView(graph, 'render-mask', renderMaskBuffer, 'uint32', rowCount);
  const visibleSourceIds = importView(
    graph,
    'visible-source-ids',
    visibleSourceIdsBuffer,
    'uint32',
    rowCount
  );
  const visibleCount = importView(graph, 'visible-count', visibleCountBuffer, 'uint32', 1);

  const filter = new LuxFilter(graph, {
    id: 'linked-dashboard',
    dimensions: [
      {id: 'map', kind: 'bounds', x: longitude, y: latitude},
      {id: 'value', kind: 'range', input: value}
    ],
    views: [
      {
        id: 'distribution',
        kind: 'histogram',
        dimension: 'value',
        input: value,
        domain: [0, 80],
        output: histogram
      },
      {
        id: 'selected-distribution',
        kind: 'histogram',
        dimension: 'value',
        includeOwnSelection: true,
        input: value,
        domain: [0, 80],
        output: selectedHistogram
      },
      {id: 'categories', kind: 'group', keys: category, output: groups},
      {id: 'scatterplot', kind: 'visibility', output: visibleSourceIds, count: visibleCount},
      {id: 'render-mask', kind: 'mask', output: renderMask}
    ],
    outputMask: globalMask
  });

  t.equal(filter.mask, globalMask, 'the caller-owned global mask remains the public selection');
  t.throws(
    () => filter.getViewMask('distribution'),
    /after addToGraph/,
    'view masks are unavailable before graph nodes are registered'
  );

  filter.addToGraph(graph);
  t.equal(filter.getViewMask('render-mask'), renderMask, 'mask views expose their exact output');
  t.equal(
    filter.getViewMask('selected-distribution'),
    globalMask,
    'includeOwnSelection uses the complete composed selection'
  );
  t.notEqual(
    filter.getViewMask('distribution'),
    globalMask,
    'linked histograms exclude their own range from their effective mask'
  );

  const compiled = graph.compile();
  const initialNodeOrder = [...compiled.stats.nodeOrder];
  const outputs: DashboardOutputBuffers = {
    histogram: histogramBuffer,
    selectedHistogram: selectedHistogramBuffer,
    groups: groupBuffer,
    globalMask: globalMaskBuffer,
    renderMask: renderMaskBuffer,
    visibleSourceIds: visibleSourceIdsBuffer,
    visibleCount: visibleCountBuffer,
    rowCount
  };

  try {
    submitGraph(device, compiled, 'lux-filter-initial');
    t.deepEqual(
      await readDashboardOutputs(outputs),
      {
        histogram: [2, 2, 2, 2],
        selectedHistogram: [2, 2, 2, 2],
        groups: [4, 4],
        globalMask: [1, 1, 1, 1, 1, 1, 1, 1],
        renderMask: [1, 1, 1, 1, 1, 1, 1, 1],
        visibleSourceIds: [0, 1, 2, 3, 4, 5, 6, 7],
        visibleCount: 8
      },
      'inactive dimensions initially include every source row'
    );

    t.equal(
      filter.setBounds('map', [0, 2, 4, 6]),
      filter,
      'map brush updates preserve the controller for chaining'
    );
    submitGraph(device, compiled, 'lux-filter-map-brush');
    t.deepEqual(
      await readDashboardOutputs(outputs),
      {
        histogram: [0, 2, 2, 1],
        selectedHistogram: [0, 2, 2, 1],
        groups: [3, 2],
        globalMask: [0, 0, 1, 1, 1, 1, 1, 0],
        renderMask: [0, 0, 1, 1, 1, 1, 1, 0],
        visibleSourceIds: [2, 3, 4, 5, 6],
        visibleCount: 5
      },
      'a map brush updates histogram, groups, masks, and stable scatterplot indices'
    );

    t.equal(
      filter.setRange('value', [30, 55]),
      filter,
      'histogram brush updates preserve the controller for chaining'
    );
    submitGraph(device, compiled, 'lux-filter-map-and-range');
    t.deepEqual(
      await readDashboardOutputs(outputs),
      {
        histogram: [0, 2, 2, 1],
        selectedHistogram: [0, 1, 2, 0],
        groups: [1, 2],
        globalMask: [0, 0, 0, 1, 1, 1, 0, 0],
        renderMask: [0, 0, 0, 1, 1, 1, 0, 0],
        visibleSourceIds: [3, 4, 5],
        visibleCount: 3
      },
      'the histogram excludes its own brush while every other view sees both dimensions'
    );

    t.equal(filter.clear('value'), filter, 'clearing one dimension supports chaining');
    submitGraph(device, compiled, 'lux-filter-clear-range');
    t.deepEqual(
      await readDashboardOutputs(outputs),
      {
        histogram: [0, 2, 2, 1],
        selectedHistogram: [0, 2, 2, 1],
        groups: [3, 2],
        globalMask: [0, 0, 1, 1, 1, 1, 1, 0],
        renderMask: [0, 0, 1, 1, 1, 1, 1, 0],
        visibleSourceIds: [2, 3, 4, 5, 6],
        visibleCount: 5
      },
      'clearing the histogram restores the active map-only selection'
    );

    filter.setRange('value', [60, 75]);
    filter.clear('map');
    submitGraph(device, compiled, 'lux-filter-clear-map');
    t.deepEqual(
      await readDashboardOutputs(outputs),
      {
        histogram: [2, 2, 2, 2],
        selectedHistogram: [0, 0, 0, 2],
        groups: [1, 1],
        globalMask: [0, 0, 0, 0, 0, 0, 1, 1],
        renderMask: [0, 0, 0, 0, 0, 0, 1, 1],
        visibleSourceIds: [6, 7],
        visibleCount: 2
      },
      'clearing the map restores the full self-excluding distribution while retaining its range'
    );

    t.equal(filter.clearAll(), filter, 'clearing every dimension supports chaining');
    submitGraph(device, compiled, 'lux-filter-clear-all');
    t.deepEqual(
      await readDashboardOutputs(outputs),
      {
        histogram: [2, 2, 2, 2],
        selectedHistogram: [2, 2, 2, 2],
        groups: [4, 4],
        globalMask: [1, 1, 1, 1, 1, 1, 1, 1],
        renderMask: [1, 1, 1, 1, 1, 1, 1, 1],
        visibleSourceIds: [0, 1, 2, 3, 4, 5, 6, 7],
        visibleCount: 8
      },
      'clearAll restores every linked view without rebuilding its command graph'
    );
    t.deepEqual(
      compiled.stats.nodeOrder,
      initialNodeOrder,
      'every interaction reuses the original compiled node topology'
    );
    t.throws(() => graph.compile(), /already been compiled/, 'the graph was compiled only once');
  } finally {
    compiled.destroy();
    filter.destroy();
    for (const buffer of buffers) buffer.destroy();
  }

  t.end();
});

test('LuxFilter preserves chunked source topology and ignores empty source chunks', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const longitude = createVectorFixture(device, 'longitude', 'float32', [
    Float32Array.from([-1, 0, 1]),
    new Float32Array(0),
    Float32Array.from([2, 3])
  ]);
  const latitude = createVectorFixture(device, 'latitude', 'float32', [
    Float32Array.from([0, 1, 2]),
    new Float32Array(0),
    Float32Array.from([3, 4])
  ]);
  const value = createVectorFixture(device, 'value', 'float32', [
    Float32Array.from([5, 25, 45]),
    new Float32Array(0),
    Float32Array.from([65, 85])
  ]);
  const category = createVectorFixture(device, 'category', 'uint32', [
    Uint32Array.from([0, 1, 0]),
    new Uint32Array(0),
    Uint32Array.from([1, 0])
  ]);
  const globalMask = createVectorFixture(
    device,
    'global-mask',
    'uint32',
    [new Uint32Array(3), new Uint32Array(0), new Uint32Array(2)],
    true
  );
  const renderMask = createVectorFixture(
    device,
    'render-mask',
    'uint32',
    [new Uint32Array(3), new Uint32Array(0), new Uint32Array(2)],
    true
  );
  const visibleSourceIds = createVectorFixture(
    device,
    'visible-source-ids',
    'uint32',
    [new Uint32Array(3), new Uint32Array(0), new Uint32Array(2)],
    true
  );
  const histogramBuffer = createOutputBuffer(device, 'chunked-histogram', 5);
  const groupBuffer = createOutputBuffer(device, 'chunked-groups', 2);
  const visibleCountBuffer = createOutputBuffer(device, 'chunked-visible-count', 1);
  const graph = new GPUCommandGraph(device, {id: 'chunked-lux-filter'});
  const longitudeView = graph.importGPUVector('longitude', longitude.vector);
  const latitudeView = graph.importGPUVector('latitude', latitude.vector);
  const valueView = graph.importGPUVector('value', value.vector);
  const categoryView = graph.importGPUVector('category', category.vector);
  const globalMaskView = graph.importGPUVector('global-mask', globalMask.vector);
  const renderMaskView = graph.importGPUVector('render-mask', renderMask.vector);
  const visibleSourceIdsView = graph.importGPUVector('visible-source-ids', visibleSourceIds.vector);
  const histogramView = importView(graph, 'histogram', histogramBuffer, 'uint32', 5);
  const groupView = importView(graph, 'groups', groupBuffer, 'uint32', 2);
  const visibleCountView = importView(graph, 'visible-count', visibleCountBuffer, 'uint32', 1);

  const filter = new LuxFilter(graph, {
    id: 'chunked-dashboard',
    dimensions: [
      {id: 'map', kind: 'bounds', x: longitudeView, y: latitudeView},
      {id: 'value', kind: 'range', input: valueView}
    ],
    views: [
      {
        id: 'distribution',
        kind: 'histogram',
        dimension: 'value',
        input: valueView,
        domain: [0, 100],
        output: histogramView
      },
      {id: 'categories', kind: 'group', keys: categoryView, output: groupView},
      {
        id: 'scatterplot',
        kind: 'visibility',
        output: visibleSourceIdsView,
        count: visibleCountView
      },
      {id: 'render-mask', kind: 'mask', output: renderMaskView}
    ],
    outputMask: globalMaskView
  });

  const mapMask = filter.getDimensionMask('map');
  const valueMask = filter.getDimensionMask('value');
  t.ok(mapMask instanceof GraphVectorView, 'bounds selections retain their vector source kind');
  t.ok(valueMask instanceof GraphVectorView, 'range selections retain their vector source kind');
  if (!(mapMask instanceof GraphVectorView) || !(valueMask instanceof GraphVectorView)) {
    throw new Error('Expected chunked selection masks');
  }
  t.deepEqual(
    mapMask.data.map(chunk => chunk.length),
    [3, 0, 2],
    'the map predicate preserves the original empty middle chunk'
  );
  t.deepEqual(
    valueMask.data.map(chunk => chunk.length),
    [3, 0, 2],
    'the range predicate preserves every ordered source chunk'
  );

  filter.addToGraph(graph);
  const distributionMask = filter.getViewMask('distribution');
  t.ok(
    distributionMask instanceof GraphVectorView,
    'self-excluding histogram masks retain the original vector kind'
  );
  if (distributionMask instanceof GraphVectorView) {
    t.deepEqual(
      distributionMask.data.map(chunk => chunk.length),
      [3, 0, 2],
      'linked distributions preserve empty source chunks'
    );
  }

  const compiled = graph.compile();
  try {
    filter.setBounds('map', [0, 1, 2, 3]);
    filter.setRange('value', [40, 80]);
    submitGraph(device, compiled, 'chunked-lux-filter-selection');

    t.deepEqual(
      await readVectorFixture(globalMask),
      [[0, 0, 1], [], [1, 0]],
      'the global GPU mask follows the source-aligned chunk layout'
    );
    t.deepEqual(
      await readVectorFixture(renderMask),
      [[0, 0, 1], [], [1, 0]],
      'custom mask views retain chunk boundaries without repacking'
    );
    t.deepEqual(
      await readUint32(histogramBuffer, 5),
      [0, 1, 1, 1, 0],
      'a self-excluding histogram accumulates selected map rows across nonempty chunks'
    );
    t.deepEqual(
      await readUint32(groupBuffer, 2),
      [1, 1],
      'grouped counts consume the globally selected rows across source chunks'
    );
    const selectedCount = (await readUint32(visibleCountBuffer, 1))[0];
    t.equal(selectedCount, 2, 'stable cross-chunk compaction publishes the selected count');
    t.deepEqual(
      (await readVectorFixture(visibleSourceIds)).flat().slice(0, selectedCount),
      [2, 3],
      'cross-chunk visibility retains original, globally stable source indices'
    );
    t.notOk(
      compiled.stats.nodeOrder.includes('chunked-dashboard-map-chunk-1'),
      'empty map chunks do not produce predicate dispatches'
    );
    t.notOk(
      compiled.stats.nodeOrder.includes('chunked-dashboard-value-chunk-1'),
      'empty value chunks do not produce predicate dispatches'
    );

    filter.clearAll();
    submitGraph(device, compiled, 'chunked-lux-filter-clear');
    t.deepEqual(
      await readVectorFixture(globalMask),
      [[1, 1, 1], [], [1, 1]],
      'clearing all dimensions updates existing chunks without changing their topology'
    );
    t.deepEqual(
      await readVectorFixture(visibleSourceIds),
      [[0, 1, 2], [], [3, 4]],
      'all visible source indices are distributed into the original output chunks'
    );
  } finally {
    compiled.destroy();
    filter.destroy();
    for (const fixture of [
      longitude,
      latitude,
      value,
      category,
      globalMask,
      renderMask,
      visibleSourceIds
    ]) {
      destroyVectorFixture(fixture);
    }
    histogramBuffer.destroy();
    groupBuffer.destroy();
    visibleCountBuffer.destroy();
  }

  t.end();
});

test('LuxFilter excludes a single dimension from histogram and group distributions', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const rowCount = 5;
  const buffers = [
    createBuffer(device, 'value', Float32Array.from([0, 10, 20, 30, 40])),
    createBuffer(device, 'category', Uint32Array.from([0, 1, 0, 1, 0])),
    createOutputBuffer(device, 'distribution', 3),
    createOutputBuffer(device, 'selected-distribution', 3),
    createOutputBuffer(device, 'groups', 2),
    createOutputBuffer(device, 'selected-groups', 2),
    createOutputBuffer(device, 'all-rows-mask', rowCount)
  ];
  const [
    valueBuffer,
    categoryBuffer,
    distributionBuffer,
    selectedDistributionBuffer,
    groupBuffer,
    selectedGroupBuffer,
    allRowsMaskBuffer
  ] = buffers;
  const graph = new GPUCommandGraph(device, {id: 'single-dimension-lux-filter'});
  const value = importView(graph, 'value', valueBuffer, 'float32', rowCount);
  const category = importView(graph, 'category', categoryBuffer, 'uint32', rowCount);
  const distribution = importView(graph, 'distribution', distributionBuffer, 'uint32', 3);
  const selectedDistribution = importView(
    graph,
    'selected-distribution',
    selectedDistributionBuffer,
    'uint32',
    3
  );
  const groups = importView(graph, 'groups', groupBuffer, 'uint32', 2);
  const selectedGroups = importView(graph, 'selected-groups', selectedGroupBuffer, 'uint32', 2);
  const allRowsMask = importView(graph, 'all-rows-mask', allRowsMaskBuffer, 'uint32', rowCount);

  const filter = new LuxFilter(graph, {
    id: 'single-dimension-dashboard',
    dimensions: [{id: 'value', kind: 'range', input: value}],
    views: [
      {
        id: 'distribution',
        kind: 'histogram',
        dimension: 'value',
        input: value,
        edges: [0, 15, 30, 45],
        output: distribution
      },
      {
        id: 'selected-distribution',
        kind: 'histogram',
        dimension: 'value',
        includeOwnSelection: true,
        input: value,
        edges: [0, 15, 30, 45],
        output: selectedDistribution
      },
      {id: 'groups', kind: 'group', dimension: 'value', keys: category, output: groups},
      {
        id: 'selected-groups',
        kind: 'group',
        dimension: 'value',
        includeOwnSelection: true,
        keys: category,
        output: selectedGroups
      },
      {
        id: 'all-rows-mask',
        kind: 'mask',
        dimension: 'value',
        includeOwnSelection: false,
        output: allRowsMask
      }
    ]
  });
  filter.addToGraph(graph);
  t.equal(
    filter.getViewMask('distribution'),
    undefined,
    'a single self-excluding dimension leaves the histogram unmasked'
  );
  t.equal(
    filter.getViewMask('groups'),
    undefined,
    'a single self-excluding dimension leaves grouped counts unmasked'
  );
  t.equal(
    filter.getViewMask('all-rows-mask'),
    allRowsMask,
    'an explicitly self-excluding mask publishes an all-rows predicate'
  );

  const compiled = graph.compile();
  try {
    filter.setRange('value', [15, 30]);
    submitGraph(device, compiled, 'single-dimension-lux-filter-selection');

    t.deepEqual(
      await readUint32(distributionBuffer, 3),
      [2, 1, 2],
      'an irregular histogram excludes its only dimension and shows every available row'
    );
    t.deepEqual(
      await readUint32(selectedDistributionBuffer, 3),
      [0, 1, 1],
      'includeOwnSelection limits irregular histogram bins to the inclusive range'
    );
    t.deepEqual(
      await readUint32(groupBuffer, 2),
      [3, 2],
      'group distributions exclude their own dimension by default'
    );
    t.deepEqual(
      await readUint32(selectedGroupBuffer, 2),
      [1, 1],
      'group views can explicitly include their own range selection'
    );
    t.deepEqual(
      await readUint32(allRowsMaskBuffer, rowCount),
      [1, 1, 1, 1, 1],
      'an explicitly self-excluding mask creates a canonical all-rows GPU predicate'
    );
  } finally {
    compiled.destroy();
    filter.destroy();
    for (const buffer of buffers) buffer.destroy();
  }

  t.end();
});

test('LuxFilter computes grouped floating statistics and preserves custom visibility IDs', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const rowCount = 6;
  const buffers = [
    createBuffer(device, 'value', Float32Array.from([5, 15, 25, 35, 45, 55])),
    createBuffer(device, 'weight', Float32Array.from([1.5, 2, 3.5, 4, 5.5, 6])),
    createBuffer(device, 'category', Uint32Array.from([0, 1, 0, 1, 0, 1])),
    createBuffer(device, 'source-ids', Uint32Array.from([90, 70, 50, 30, 10, 5])),
    createOutputBuffer(device, 'group-sums', 2),
    createOutputBuffer(device, 'group-means', 2),
    createOutputBuffer(device, 'global-mask', rowCount),
    createOutputBuffer(device, 'visibility-mask', rowCount),
    createOutputBuffer(device, 'custom-visible-ids', rowCount),
    createOutputBuffer(device, 'custom-visible-count', 1),
    createOutputBuffer(device, 'offset-visible-ids', rowCount),
    createOutputBuffer(device, 'offset-visible-count', 1)
  ];
  const [
    valueBuffer,
    weightBuffer,
    categoryBuffer,
    sourceIdsBuffer,
    groupSumBuffer,
    groupMeanBuffer,
    globalMaskBuffer,
    visibilityMaskBuffer,
    customVisibleIdsBuffer,
    customVisibleCountBuffer,
    offsetVisibleIdsBuffer,
    offsetVisibleCountBuffer
  ] = buffers;
  const graph = new GPUCommandGraph(device, {id: 'lux-filter-weighted-visibility'});
  const value = importView(graph, 'value', valueBuffer, 'float32', rowCount);
  const weight = importView(graph, 'weight', weightBuffer, 'float32', rowCount);
  const category = importView(graph, 'category', categoryBuffer, 'uint32', rowCount);
  const sourceIds = importView(graph, 'source-ids', sourceIdsBuffer, 'uint32', rowCount);
  const groupSums = importView(graph, 'group-sums', groupSumBuffer, 'float32', 2);
  const groupMeans = importView(graph, 'group-means', groupMeanBuffer, 'float32', 2);
  const globalMask = importView(graph, 'global-mask', globalMaskBuffer, 'uint32', rowCount);
  const visibilityMask = importView(
    graph,
    'visibility-mask',
    visibilityMaskBuffer,
    'uint32',
    rowCount
  );
  const customVisibleIds = importView(
    graph,
    'custom-visible-ids',
    customVisibleIdsBuffer,
    'uint32',
    rowCount
  );
  const customVisibleCount = importView(
    graph,
    'custom-visible-count',
    customVisibleCountBuffer,
    'uint32',
    1
  );
  const offsetVisibleIds = importView(
    graph,
    'offset-visible-ids',
    offsetVisibleIdsBuffer,
    'uint32',
    rowCount
  );
  const offsetVisibleCount = importView(
    graph,
    'offset-visible-count',
    offsetVisibleCountBuffer,
    'uint32',
    1
  );

  const filter = new LuxFilter(graph, {
    id: 'weighted-dashboard',
    dimensions: [{id: 'value', kind: 'range', input: value}],
    views: [
      {
        id: 'weighted-sums',
        kind: 'group',
        keys: category,
        values: weight,
        output: groupSums,
        operation: 'sum'
      },
      {
        id: 'weighted-means',
        kind: 'group',
        keys: category,
        values: weight,
        output: groupMeans,
        operation: 'mean'
      },
      {
        id: 'custom-scatterplot',
        kind: 'visibility',
        sourceIds,
        output: customVisibleIds,
        count: customVisibleCount,
        outputMask: visibilityMask
      },
      {
        id: 'offset-scatterplot',
        kind: 'visibility',
        firstSourceIndex: 1000,
        output: offsetVisibleIds,
        count: offsetVisibleCount
      }
    ],
    outputMask: globalMask
  });
  filter.addToGraph(graph);
  t.equal(
    filter.getViewMask('custom-scatterplot'),
    globalMask,
    'custom-source visibility consumes the shared composed selection'
  );
  t.equal(
    filter.getViewMask('offset-scatterplot'),
    globalMask,
    'offset-generated visibility consumes the shared composed selection'
  );

  const compiled = graph.compile();
  try {
    filter.setRange('value', [15, 45]);
    submitGraph(device, compiled, 'lux-filter-weighted-selection');

    t.deepEqual(
      await readFloat32(groupSumBuffer, 2),
      [9, 6],
      'grouped floating-point sums include only rows selected on the GPU'
    );
    t.deepEqual(
      await readFloat32(groupMeanBuffer, 2),
      [4.5, 3],
      'grouped floating-point means reuse the same source-aligned selection'
    );
    t.deepEqual(
      await readUint32(globalMaskBuffer, rowCount),
      [0, 1, 1, 1, 1, 0],
      'the controller publishes its global source-aligned selection'
    );
    t.deepEqual(
      await readUint32(visibilityMaskBuffer, rowCount),
      [0, 1, 1, 1, 1, 0],
      'a visibility view publishes its own caller-owned output mask'
    );

    const customCount = (await readUint32(customVisibleCountBuffer, 1))[0];
    const offsetCount = (await readUint32(offsetVisibleCountBuffer, 1))[0];
    t.equal(customCount, 4, 'explicit source IDs publish their selected count');
    t.equal(offsetCount, 4, 'generated offset IDs publish the same selected count');
    t.deepEqual(
      (await readUint32(customVisibleIdsBuffer, rowCount)).slice(0, customCount),
      [70, 50, 30, 10],
      'explicit source IDs retain their stable input ordering during compaction'
    );
    t.deepEqual(
      (await readUint32(offsetVisibleIdsBuffer, rowCount)).slice(0, offsetCount),
      [1001, 1002, 1003, 1004],
      'generated visibility IDs honor a caller-provided first source offset'
    );

    filter.clearAll();
    submitGraph(device, compiled, 'lux-filter-weighted-clear');
    t.deepEqual(await readFloat32(groupSumBuffer, 2), [10.5, 12], 'clearing recomputes group sums');
    t.deepEqual(await readFloat32(groupMeanBuffer, 2), [3.5, 4], 'clearing recomputes group means');
    t.deepEqual(
      await readUint32(customVisibleIdsBuffer, rowCount),
      [90, 70, 50, 30, 10, 5],
      'clearing restores every original custom source ID'
    );
    t.deepEqual(
      await readUint32(offsetVisibleIdsBuffer, rowCount),
      [1000, 1001, 1002, 1003, 1004, 1005],
      'clearing restores the complete offset-generated source sequence'
    );
  } finally {
    compiled.destroy();
    filter.destroy();
    for (const buffer of buffers) buffer.destroy();
  }

  t.end();
});

test('LuxFilter rejects overflowing float32 endpoints without selecting infinite source rows', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const maximumFiniteFloat32 = Math.fround(3.4028234663852886e38);
  const rowCount = 7;
  const graph = new GPUCommandGraph(device, {id: 'lux-filter-float32-overflow'});
  const buffers = [
    createBuffer(
      device,
      'float32-values',
      Float32Array.from([
        Number.NEGATIVE_INFINITY,
        -maximumFiniteFloat32,
        -1,
        0,
        1,
        maximumFiniteFloat32,
        Number.POSITIVE_INFINITY
      ])
    ),
    createBuffer(device, 'float32-coordinates', Float32Array.from([0, 1, 2, 3, 4, 5, 6])),
    createOutputBuffer(device, 'float32-selection', rowCount)
  ];
  const [valueBuffer, coordinateBuffer, outputBuffer] = buffers;
  const values = importView(graph, 'float32-values', valueBuffer, 'float32', rowCount);
  const coordinates = importView(
    graph,
    'float32-coordinates',
    coordinateBuffer,
    'float32',
    rowCount
  );
  const output = importView(graph, 'float32-selection', outputBuffer, 'uint32', rowCount);
  const filter = new LuxFilter(graph, {
    id: 'float32-endpoints',
    dimensions: [
      {id: 'value', kind: 'range', input: values},
      {id: 'position', kind: 'bounds', x: values, y: coordinates}
    ],
    outputMask: output
  });
  filter.addToGraph(graph);

  const compiled = graph.compile();
  try {
    filter.setRange('value', [-maximumFiniteFloat32, maximumFiniteFloat32]);
    submitGraph(device, compiled, 'lux-filter-finite-range');
    t.deepEqual(
      await readUint32(outputBuffer, rowCount),
      [0, 1, 1, 1, 1, 1, 0],
      'the largest representable float32 endpoints select finite values without either infinity'
    );

    t.throws(
      () => filter.setRange('value', [Number.MAX_VALUE, Number.MAX_VALUE]),
      /input scalar format/,
      'positive float32 overflow cannot silently select positive-infinity source rows'
    );
    t.throws(
      () => filter.setRange('value', [-Number.MAX_VALUE, -Number.MAX_VALUE]),
      /input scalar format/,
      'negative float32 overflow cannot silently select negative-infinity source rows'
    );
    submitGraph(device, compiled, 'lux-filter-rejected-range');
    t.deepEqual(
      await readUint32(outputBuffer, rowCount),
      [0, 1, 1, 1, 1, 1, 0],
      'rejected range updates preserve the previous GPU-resident selection'
    );

    filter.clear('value');
    filter.setBounds('position', [-maximumFiniteFloat32, 1, maximumFiniteFloat32, 5]);
    submitGraph(device, compiled, 'lux-filter-finite-bounds');
    t.deepEqual(
      await readUint32(outputBuffer, rowCount),
      [0, 1, 1, 1, 1, 1, 0],
      'representable rectangular bounds exclude infinite horizontal source values'
    );

    t.throws(
      () => filter.setBounds('position', [-Number.MAX_VALUE, 1, maximumFiniteFloat32, 5]),
      /input scalar format/,
      'horizontal minimum endpoints cannot overflow float32'
    );
    t.throws(
      () => filter.setBounds('position', [-maximumFiniteFloat32, 1, Number.MAX_VALUE, 5]),
      /input scalar format/,
      'horizontal maximum endpoints cannot overflow float32'
    );
    t.throws(
      () =>
        filter.setBounds('position', [
          -maximumFiniteFloat32,
          -Number.MAX_VALUE,
          maximumFiniteFloat32,
          5
        ]),
      /input scalar format/,
      'vertical minimum endpoints cannot overflow float32'
    );
    t.throws(
      () =>
        filter.setBounds('position', [
          -maximumFiniteFloat32,
          1,
          maximumFiniteFloat32,
          Number.MAX_VALUE
        ]),
      /input scalar format/,
      'vertical maximum endpoints cannot overflow float32'
    );
    submitGraph(device, compiled, 'lux-filter-rejected-bounds');
    t.deepEqual(
      await readUint32(outputBuffer, rowCount),
      [0, 1, 1, 1, 1, 1, 0],
      'rejected rectangular bounds preserve the previous GPU-resident selection'
    );
  } finally {
    compiled.destroy();
    filter.destroy();
    for (const buffer of buffers) buffer.destroy();
  }

  t.end();
});

test('LuxFilter validates dimensions, linked views, interaction updates, and lifecycle', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'lux-filter-validation'});
  const inputHandle = graph.createTransientBuffer({
    id: 'validation-input',
    byteLength: 16,
    usage: Buffer.STORAGE
  });
  const outputHandle = graph.createTransientBuffer({
    id: 'validation-output',
    byteLength: 16,
    usage: Buffer.STORAGE
  });
  const values = graph.createDataView(inputHandle, {format: 'float32', length: 4});
  const shortValues = graph.createDataView(inputHandle, {format: 'float32', length: 2});
  const output = graph.createDataView(outputHandle, {format: 'uint32', length: 4});

  t.throws(
    () => new LuxFilter(graph, {id: 'missing-dimensions', dimensions: []}),
    /at least one selection dimension/,
    'controllers require at least one dimension'
  );
  t.throws(
    () =>
      new LuxFilter(graph, {
        id: 'duplicate-dimensions',
        dimensions: [
          {id: 'value', kind: 'range', input: values},
          {id: 'value', kind: 'range', input: values}
        ]
      }),
    /unique identifiers/,
    'dimension identifiers must be unique'
  );
  t.throws(
    () =>
      new LuxFilter(graph, {
        id: 'mismatched-bounds',
        dimensions: [{id: 'map', kind: 'bounds', x: values, y: shortValues}]
      }),
    /same chunk topology/,
    'map bounds require source-aligned coordinate rows'
  );
  t.throws(
    () =>
      new LuxFilter(graph, {
        id: 'duplicate-views',
        dimensions: [{id: 'value', kind: 'range', input: values}],
        views: [
          {id: 'selection', kind: 'mask', output},
          {id: 'selection', kind: 'mask', output}
        ]
      }),
    /unique identifiers/,
    'linked view identifiers must be unique'
  );
  t.throws(
    () =>
      new LuxFilter(graph, {
        id: 'unknown-view-dimension',
        dimensions: [{id: 'value', kind: 'range', input: values}],
        views: [{id: 'selection', kind: 'mask', dimension: 'missing', output}]
      }),
    /unknown dimension/,
    'linked views cannot refer to unregistered dimensions'
  );

  const filter = new LuxFilter(graph, {
    id: 'valid-controller',
    dimensions: [{id: 'value', kind: 'range', input: values}],
    views: [{id: 'selection', kind: 'mask', output}]
  });
  t.throws(
    () => filter.getDimensionMask('missing'),
    /does not contain selection dimension/,
    'unknown dimensions cannot expose a selection mask'
  );
  t.throws(
    () => filter.setRange('missing', [0, 1]),
    /does not contain selection dimension/,
    'unknown dimensions cannot be updated'
  );
  t.throws(
    () => filter.setBounds('value', [0, 0, 1, 1]),
    /does not support two-dimensional bounds/,
    'range dimensions reject bounds interactions'
  );
  t.throws(
    () => filter.setRange('value', [2, 1]),
    /ordered finite endpoints/,
    'descending ranges are rejected before any GPU update'
  );
  t.throws(
    () => filter.setRange('value', [0, Number.POSITIVE_INFINITY]),
    /ordered finite endpoints/,
    'non-finite range endpoints are rejected'
  );
  t.throws(
    () => filter.getViewMask('missing'),
    /does not contain view/,
    'unknown linked views are rejected'
  );
  t.throws(
    () => filter.getViewMask('selection'),
    /after addToGraph/,
    'registered views cannot expose masks before graph registration'
  );

  const otherGraph = new GPUCommandGraph(device, {id: 'other-lux-filter-graph'});
  t.throws(
    () => filter.addToGraph(otherGraph),
    /owning graph/,
    'controllers cannot add selection work to a different graph'
  );
  filter.addToGraph(graph);
  t.throws(
    () => filter.addToGraph(graph),
    /only be added.*once/,
    'the same controller cannot add duplicate command-graph nodes'
  );
  filter.destroy();
  t.doesNotThrow(() => filter.destroy(), 'controller destruction is idempotent');
  t.throws(
    () => filter.setRange('value', [0, 1]),
    /has been destroyed/,
    'destroyed controllers reject new interactions'
  );
  t.throws(
    () => filter.clearAll(),
    /has been destroyed/,
    'destroyed controllers reject bulk selection changes'
  );

  t.end();
});

type ScalarFormat = 'float32' | 'sint32' | 'uint32';
type ScalarArray = Float32Array | Int32Array | Uint32Array;

type VectorFixture<Format extends ScalarFormat = ScalarFormat> = {
  vector: GPUVector<Format>;
  buffers: Buffer[];
};

type DashboardOutputBuffers = {
  histogram: Buffer;
  selectedHistogram: Buffer;
  groups: Buffer;
  globalMask: Buffer;
  renderMask: Buffer;
  visibleSourceIds: Buffer;
  visibleCount: Buffer;
  rowCount: number;
};

function createBuffer(device: Device, id: string, values: ScalarArray, readable = false): Buffer {
  const data = values.length > 0 ? values : new Uint32Array(1);
  return device.createBuffer({
    id,
    data,
    usage: Buffer.STORAGE | Buffer.COPY_DST | (readable ? Buffer.COPY_SRC : 0)
  });
}

function createOutputBuffer(device: Device, id: string, length: number): Buffer {
  return createBuffer(device, id, new Uint32Array(length), true);
}

function createVectorFixture<Format extends ScalarFormat>(
  device: Device,
  name: string,
  format: Format,
  chunks: readonly ScalarArray[],
  readable = false
): VectorFixture<Format> {
  const buffers = chunks.map((chunk, chunkIndex) =>
    createBuffer(device, `${name}-chunk-${chunkIndex}`, chunk, readable)
  );
  return {
    buffers,
    vector: new GPUVector<Format>({
      type: 'data',
      name,
      format,
      data: buffers.map(
        (buffer, chunkIndex) =>
          new GPUData<Format>({
            buffer,
            format,
            length: chunks[chunkIndex].length,
            ownsBuffer: false
          })
      ),
      ownsData: false
    })
  };
}

function destroyVectorFixture(fixture: VectorFixture): void {
  fixture.vector.destroy();
  for (const buffer of fixture.buffers) buffer.destroy();
}

function importView<Format extends GPUVectorFormat>(
  graph: GPUCommandGraph,
  id: string,
  buffer: Buffer,
  format: Format,
  length: number
): GraphDataView<Format> {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length});
}

function submitGraph(device: Device, compiled: CompiledGPUCommandGraph, id: string): void {
  const encoder = device.createCommandEncoder({id});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
}

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  if (length === 0) return [];
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}

async function readFloat32(buffer: Buffer, length: number): Promise<number[]> {
  if (length === 0) return [];
  const bytes = await buffer.readAsync();
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
}

async function readVectorFixture(fixture: VectorFixture<'uint32'>): Promise<number[][]> {
  return Promise.all(
    fixture.buffers.map((buffer, chunkIndex) =>
      readUint32(buffer, fixture.vector.data[chunkIndex].length)
    )
  );
}

async function readDashboardOutputs(outputs: DashboardOutputBuffers): Promise<{
  histogram: number[];
  selectedHistogram: number[];
  groups: number[];
  globalMask: number[];
  renderMask: number[];
  visibleSourceIds: number[];
  visibleCount: number;
}> {
  const [histogram, selectedHistogram, groups, globalMask, renderMask, visibleSourceIds, count] =
    await Promise.all([
      readUint32(outputs.histogram, 4),
      readUint32(outputs.selectedHistogram, 4),
      readUint32(outputs.groups, 2),
      readUint32(outputs.globalMask, outputs.rowCount),
      readUint32(outputs.renderMask, outputs.rowCount),
      readUint32(outputs.visibleSourceIds, outputs.rowCount),
      readUint32(outputs.visibleCount, 1)
    ]);
  const visibleCount = count[0];
  return {
    histogram,
    selectedHistogram,
    groups,
    globalMask,
    renderMask,
    visibleSourceIds: visibleSourceIds.slice(0, visibleCount),
    visibleCount
  };
}
