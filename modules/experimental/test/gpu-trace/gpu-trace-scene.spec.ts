// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {
  DrawCommandBuffer,
  GPUCommandGraph,
  GPUSceneDrawGeneration,
  GPUSceneResourceGroups,
  GPU_SCENE_INVALID_REFERENCE,
  GPU_SCENE_RECORD_BYTE_LENGTH,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUTraceAggregation,
  GPUTraceAnomalyScoring,
  GPUTraceComparison,
  GPUTraceCriticalPath,
  GPUTraceLaneIndexBuilder,
  GPUTraceMipmapBoundaries,
  GPUTracePixelMipmap,
  GPUTraceRangeMaximumIndexBuilder,
  GPUTraceScene,
  GPUTraceTemporalIndex,
  GPUTraceTemporalIndexBuilder,
  GPUTraceTimeBuckets
} from '@luma.gl/experimental/gpu-trace';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

const BUFFER_USAGE = Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC;

test('GPUTraceScene preserves canonical trace topology and projects stable generic scene rows', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const trace = new GPUTraceScene(device, {
    spans: makeSpans(),
    parents: Uint32Array.from([GPU_SCENE_INVALID_REFERENCE, 0, 1]),
    links: Uint32Array.from([0, 1, 7, 1, 0, 2, 8, 2, 1, 2, 9, 4]),
    partitions: [
      {firstSpan: 0, spanCount: 1, groupId: 4},
      {firstSpan: 1, spanCount: 0, groupId: 9},
      {firstSpan: 1, spanCount: 2, groupId: 5}
    ],
    processCount: 2,
    threadCount: 3,
    geometryId: 12
  });

  t.equal(trace.scene.recordCount, 3, 'every source span has one generic scene record');
  t.notOk(trace.scene.mutable, 'borrowed canonical records do not invent CPU mutation metadata');
  t.deepEqual(
    trace.partitions.map(({firstSpan, spanCount}) => ({firstSpan, spanCount})),
    [
      {firstSpan: 0, spanCount: 1},
      {firstSpan: 1, spanCount: 0},
      {firstSpan: 1, spanCount: 2}
    ],
    'empty and uneven source batches retain stable global row offsets'
  );
  t.deepEqual(await readUint32(trace.buffers.outgoingOffsets), [0, 2, 3, 3]);
  t.deepEqual(await readUint32(trace.buffers.outgoingNeighbors), [1, 2, 2]);
  t.deepEqual(await readUint32(trace.buffers.incomingOffsets), [0, 0, 1, 3]);
  t.deepEqual(await readUint32(trace.buffers.incomingNeighbors), [0, 0, 1]);

  const sceneBytes = await trace.scene.recordBuffer.readAsync();
  const sceneWords = new Uint32Array(
    sceneBytes.buffer,
    sceneBytes.byteOffset,
    sceneBytes.byteLength / 4
  );
  const sceneFloats = new Float32Array(
    sceneBytes.buffer,
    sceneBytes.byteOffset,
    sceneBytes.byteLength / 4
  );
  const recordWords = GPU_SCENE_RECORD_BYTE_LENGTH / Uint32Array.BYTES_PER_ELEMENT;
  t.deepEqual(
    [0, 1, 2].map(index => sceneWords[index * recordWords]),
    [101, 205, 309],
    'scene identity follows stable source IDs rather than row positions'
  );
  t.deepEqual(
    [sceneWords[3], sceneWords[4], sceneWords[recordWords + 3], sceneWords[recordWords + 4]],
    [12, 0, 12, 1],
    'geometry identity and command slots remain explicit renderer references'
  );
  t.deepEqual(
    [sceneFloats[8], sceneFloats[9], sceneFloats[12], sceneFloats[13]],
    [10, 2, 14, 3],
    'time and lane become generic axis-aligned scene bounds'
  );

  const graph = new GPUCommandGraph(device, {id: 'trace-scene-source-test'});
  const view = trace.importToGraph(graph);
  t.equal(view.startTimes.byteStride, 32, 'typed temporal views borrow canonical packed rows');
  t.equal(view.processIds.byteOffset, 16, 'process membership retains its source field offset');
  t.equal(view.threadIds.byteOffset, 20, 'thread membership retains its source field offset');
  t.equal(view.linkDestinations.byteStride, 16, 'dependencies preserve their packed record layout');
  t.equal(view.scene.objectIds.length, 3, 'scene and canonical views share global row identity');
  t.equal(trace.stats.partitionCount, 3);
  t.equal(trace.stats.linkCount, 3);
  t.equal(
    trace.stats.totalByteLength,
    trace.stats.canonicalByteLength + trace.stats.topologyByteLength + trace.stats.sceneByteLength,
    'allocation accounting exposes the full trace-to-scene projection cost'
  );

  const sourceBuffer = trace.buffers.spans;
  const sceneBuffer = trace.scene.recordBuffer;
  trace.destroy();
  trace.destroy();
  t.ok(sourceBuffer.destroyed, 'canonical allocations are released exactly once');
  t.ok(sceneBuffer.destroyed, 'projected generic scene allocations are released exactly once');
  t.end();
});

test('GPUTraceScene feeds shared visibility, indirect draws, and renderer resource groups', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const trace = new GPUTraceScene(device, {
    spans: makeSpans(),
    parents: Uint32Array.from([GPU_SCENE_INVALID_REFERENCE, 0, 1]),
    processCount: 2,
    threadCount: 3,
    geometryId: 12
  });
  const commands = new DrawCommandBuffer(device, {
    type: 'draw',
    commands: [{vertexCount: 6}, {vertexCount: 6}, {vertexCount: 6}]
  });
  const graph = new GPUCommandGraph(device, {id: 'trace-scene-shared-consumer-test'});
  const view = trace.importToGraph(graph);
  const commandView = commands.importToGraph(graph);
  const visibility = makeOutput(device, graph, 'trace-visibility', 3, [1, 0, 1]);
  const required = makeOutput(device, graph, 'trace-required', 1);
  const published = makeOutput(device, graph, 'trace-published', 1);
  const drawOverflow = makeOutput(device, graph, 'trace-draw-overflow', 1);
  new GPUSceneDrawGeneration({
    scene: view.scene,
    visibility: visibility.view,
    commands: commandView,
    requiredCount: required.view,
    publishedCount: published.view,
    overflow: drawOverflow.view
  }).addToGraph(graph);

  const counts = makeOutput(device, graph, 'trace-group-counts', 2);
  const overflows = makeOutput(device, graph, 'trace-group-overflows', 2);
  const overflow = makeOutput(device, graph, 'trace-global-overflow', 1);
  new GPUSceneResourceGroups({
    scene: view.scene,
    commands: commandView,
    groups: [
      {id: 4, firstCommand: 0, commandCount: 1, geometryId: 12},
      {id: 5, firstCommand: 1, commandCount: 2, geometryId: 12}
    ],
    counts: counts.view,
    overflows: overflows.view,
    overflow: overflow.view
  }).addToGraph(graph);

  const compiled = graph.compile();
  const encoder = device.createCommandEncoder();
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
  t.deepEqual(await readUint32(counts.buffer), [1, 1]);
  t.deepEqual(await readUint32(required.buffer), [2]);
  t.deepEqual(await readUint32(published.buffer), [2]);
  t.deepEqual(await readUint32(overflow.buffer), [0]);
  const commandWords = await readUint32(commands.buffer);
  t.deepEqual([commandWords[1], commandWords[5], commandWords[9]], [1, 0, 1]);
  t.deepEqual([commandWords[3], commandWords[11]], [0, 2]);

  compiled.destroy();
  commands.destroy();
  trace.destroy();
  for (const output of [
    visibility,
    required,
    published,
    drawOverflow,
    counts,
    overflows,
    overflow
  ]) {
    output.buffer.destroy();
  }
  t.end();
});

test('GPUTraceAggregation composes selection-aware counts and duration statistics', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const trace = new GPUTraceScene(device, {
    spans: makeSpans(),
    parents: Uint32Array.from([GPU_SCENE_INVALID_REFERENCE, 0, 1]),
    processCount: 2,
    threadCount: 3
  });
  const graph = new GPUCommandGraph(device, {id: 'trace-aggregation-test'});
  const source = trace.importToGraph(graph);
  const selection = makeOutput(device, graph, 'trace-aggregation-selection', 3, [1, 0, 1]);
  const processCounts = makeOutput(device, graph, 'trace-process-counts', 2);
  const groupDurationSums = makeFloatOutput(device, graph, 'trace-group-duration-sums', 6);
  const processDurationMeans = makeFloatOutput(device, graph, 'trace-process-duration-means', 2);

  new GPUTraceAggregation({
    id: 'trace-selected-process-counts',
    trace: source,
    dimension: 'process',
    metric: 'count',
    selection: selection.view,
    output: processCounts.view
  }).addToGraph(graph);
  new GPUTraceAggregation({
    id: 'trace-selected-group-duration-sums',
    trace: source,
    dimension: 'group',
    metric: 'duration-sum',
    selection: selection.view,
    output: groupDurationSums.view
  }).addToGraph(graph);
  new GPUTraceAggregation({
    id: 'trace-process-duration-means',
    trace: source,
    dimension: 'process',
    metric: 'duration-mean',
    output: processDurationMeans.view
  }).addToGraph(graph);

  const compiled = graph.compile();
  const encoder = device.createCommandEncoder();
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  t.deepEqual(await readUint32(processCounts.buffer), [1, 1], 'selection masks source rows');
  t.deepEqual(
    await readFloat32(groupDurationSums.buffer),
    [0, 0, 0, 0, 4, 8],
    'duration sums remain aligned with dense renderer-group identities'
  );
  t.deepEqual(
    await readFloat32(processDurationMeans.buffer),
    [3, 8],
    'duration means reuse canonical duration values without CPU expansion'
  );

  compiled.destroy();
  trace.destroy();
  selection.buffer.destroy();
  processCounts.buffer.destroy();
  groupDurationSums.buffer.destroy();
  processDurationMeans.buffer.destroy();
  t.end();
});

test('GPUTraceTemporalIndex publishes one stable guarded candidate selection', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'trace-temporal-index-test'});
  const minimumTimes = makeFloatOutput(
    device,
    graph,
    'temporal-minimum-times',
    5,
    [0, 4, 8, 12, 16]
  );
  const maximumTimes = makeFloatOutput(
    device,
    graph,
    'temporal-maximum-times',
    5,
    [3, 9, 10, 20, 18]
  );
  const groupIds = makeOutput(device, graph, 'temporal-group-ids', 5, [0, 1, 0, 2, 1]);
  const minimumLanes = makeOutput(device, graph, 'temporal-minimum-lanes', 5, [0, 4, 2, 8, 4]);
  const maximumLanes = makeOutput(device, graph, 'temporal-maximum-lanes', 5, [1, 5, 3, 9, 5]);
  const queryBuffer = device.createBuffer({byteLength: 6 * 4, usage: BUFFER_USAGE});
  const queryHandle = graph.importBuffer(
    {id: 'temporal-query', byteLength: queryBuffer.byteLength, usage: queryBuffer.usage},
    queryBuffer
  );
  const candidates = makeOutput(device, graph, 'temporal-candidates', 5);
  const candidateCount = makeOutput(device, graph, 'temporal-candidate-count', 1);

  const temporalIndex = new GPUTraceTemporalIndex({
    batches: {
      minimumTimes: minimumTimes.view,
      maximumTimes: maximumTimes.view,
      groupIds: groupIds.view,
      minimumLanes: minimumLanes.view,
      maximumLanes: maximumLanes.view
    },
    query: {
      timeWindow: graph.createDataView(queryHandle, {format: 'float32', length: 3}),
      enabledGroups: graph.createDataView(queryHandle, {
        format: 'uint32',
        length: 1,
        byteOffset: 3 * 4
      }),
      laneWindow: graph.createDataView(queryHandle, {
        format: 'uint32',
        length: 2,
        byteOffset: 4 * 4
      })
    },
    output: {
      candidates: candidates.view,
      candidateCount: candidateCount.view
    }
  });
  t.deepEqual(temporalIndex.stats, {batchCount: 5, levelCount: 1, maximumNodeCount: 5});
  temporalIndex.addToGraph(graph);
  const compiled = graph.compile();

  writeTemporalQuery(queryBuffer, [7, 13, 1], 0b11);
  let encoder = device.createCommandEncoder();
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
  t.deepEqual(
    (await readUint32(candidates.buffer)).slice(0, (await readUint32(candidateCount.buffer))[0]),
    [1, 2],
    'guard padding and enabled groups conservatively retain intersecting leaf batches'
  );
  writeTemporalQuery(queryBuffer, [7, 13, 0], 0b111);
  encoder = device.createCommandEncoder();
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
  t.deepEqual(
    (await readUint32(candidates.buffer)).slice(0, (await readUint32(candidateCount.buffer))[0]),
    [1, 2, 3],
    'changing the guarded query republishes the same stable output in source order'
  );

  compiled.destroy();
  for (const resource of [
    minimumTimes,
    maximumTimes,
    groupIds,
    minimumLanes,
    maximumLanes,
    candidates,
    candidateCount
  ]) {
    resource.buffer.destroy();
  }
  queryBuffer.destroy();
  t.end();
});

test('GPUTraceTemporalIndexBuilder rebuilds only dirty persistent partitions', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const batchWords = new Uint32Array(4 * 6);
  const batchFloats = new Float32Array(batchWords.buffer);
  const rows = [
    [0, 2, 1, 0, 1, 2],
    [2, 5, 3, 0, 2, 4],
    [10, 12, 2, 1, 5, 6],
    [12, 18, 6, 1, 4, 8]
  ] as const;
  rows.forEach((row, index) => {
    const wordOffset = index * 6;
    batchFloats.set(row.slice(0, 3), wordOffset);
    batchWords.set(row.slice(3), wordOffset + 3);
  });
  const hierarchyWords = new Uint32Array(2 * 8);
  hierarchyWords.set([0, 0, 0, 0, 0, 2, 0, 0], 0);
  hierarchyWords.set([0, 0, 0, 1, 2, 2, 0, 0], 8);

  const graph = new GPUCommandGraph(device, {id: 'trace-temporal-index-builder-test'});
  const batches = makeOutput(device, graph, 'builder-batches', batchWords.length, batchWords);
  const hierarchy = makeOutput(
    device,
    graph,
    'builder-hierarchy',
    hierarchyWords.length,
    hierarchyWords
  );
  const dirtyPartitions = makeOutput(device, graph, 'builder-dirty', 2, [1, 1]);
  const validationErrors = makeOutput(device, graph, 'builder-errors', 1, [0]);
  const builder = new GPUTraceTemporalIndexBuilder({
    batches: batches.view,
    batchCount: 4,
    batchLayout: {
      recordWordLength: 6,
      minimumTimeWordOffset: 0,
      maximumTimeWordOffset: 1,
      maximumDurationWordOffset: 2,
      groupWordOffset: 3,
      minimumLaneWordOffset: 4,
      maximumLaneWordOffset: 5
    },
    hierarchy: hierarchy.view,
    hierarchyLayout: {
      recordWordLength: 8,
      minimumTimeWordOffset: 0,
      maximumTimeWordOffset: 1,
      maximumDurationWordOffset: 2,
      groupWordOffset: 3,
      firstBatchWordOffset: 4,
      batchCountWordOffset: 5,
      minimumLaneWordOffset: 6,
      maximumLaneWordOffset: 7
    },
    levels: [{firstNodeIndex: 0, nodeCount: 2, maximumBatchCount: 2, averageTimeSpan: 6.5}],
    partitionBatchCount: 2,
    dirtyPartitions: dirtyPartitions.view,
    validationErrors: validationErrors.view
  });
  t.deepEqual(builder.stats, {
    batchCount: 4,
    nodeCount: 2,
    levelCount: 1,
    partitionCount: 2,
    maximumBatchCount: 2
  });
  builder.addToGraph(graph);
  const compiled = graph.compile();
  let encoder = device.createCommandEncoder();
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  let builtWords = await readUint32(hierarchy.buffer);
  let builtFloats = new Float32Array(Uint32Array.from(builtWords).buffer);
  t.deepEqual(Array.from(builtFloats.slice(0, 3)), [0, 5, 3]);
  t.deepEqual(builtWords.slice(6, 8), [1, 4]);
  t.deepEqual(Array.from(builtFloats.slice(8, 11)), [10, 18, 6]);
  t.deepEqual(builtWords.slice(14, 16), [4, 8]);
  t.deepEqual(await readUint32(dirtyPartitions.buffer), [0, 0], 'processed partitions clear');
  t.deepEqual(await readUint32(validationErrors.buffer), [0], 'valid topology reports no errors');

  const updatedRow = new Uint32Array(6);
  const updatedFloats = new Float32Array(updatedRow.buffer);
  updatedFloats.set([12, 24, 12]);
  updatedRow.set([1, 3, 10], 3);
  batches.buffer.write(updatedRow, 3 * 6 * Uint32Array.BYTES_PER_ELEMENT);
  dirtyPartitions.buffer.write(Uint32Array.from([0, 1]));
  encoder = device.createCommandEncoder();
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  builtWords = await readUint32(hierarchy.buffer);
  builtFloats = new Float32Array(Uint32Array.from(builtWords).buffer);
  t.deepEqual(Array.from(builtFloats.slice(0, 3)), [0, 5, 3], 'clean partition is preserved');
  t.deepEqual(Array.from(builtFloats.slice(8, 11)), [10, 24, 12], 'dirty summary updates');
  t.deepEqual(builtWords.slice(14, 16), [3, 10], 'dirty lane bounds update');

  compiled.destroy();
  for (const output of [batches, hierarchy, dirtyPartitions, validationErrors]) {
    output.buffer.destroy();
  }
  t.end();
});

test('GPUTraceMipmapBoundaries matches monotonic lower bounds across sorted segments', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'trace-mipmap-boundaries-test'});
  const denseStarts = Array.from({length: 128}, (_, index) => index);
  const sparseStarts = Array.from({length: 128}, (_, index) => 1000 + index * 7);
  const duplicateStarts = [3, 3, 3, 50, 90];
  const startValues = Float32Array.from([...denseStarts, ...sparseStarts, ...duplicateStarts]);
  const segmentOffsets = Uint32Array.from([0, 256, 256, 261]);
  const starts = makeFloatOutput(
    device,
    graph,
    'mipmap-boundary-starts',
    startValues.length,
    Array.from(startValues)
  );
  const segments = makeOutput(
    device,
    graph,
    'mipmap-boundary-segments',
    segmentOffsets.length,
    Array.from(segmentOffsets)
  );
  const domain = makeFloatOutput(device, graph, 'mipmap-boundary-domain', 2, [0, 20]);
  const pixelCount = makeOutput(device, graph, 'mipmap-boundary-pixel-count', 1, [64]);
  const output = makeOutput(
    device,
    graph,
    'mipmap-boundary-output',
    3 * 65,
    new Array(3 * 65).fill(0xffffffff)
  );
  const validationErrors = makeOutput(device, graph, 'mipmap-boundary-validation', 1, [0xffffffff]);
  const boundaries = new GPUTraceMipmapBoundaries({
    startTimes: starts.view,
    segmentOffsets: segments.view,
    query: {domain: domain.view, pixelCount: pixelCount.view},
    maximumPixelCount: 64,
    boundariesPerTile: 8,
    output: output.view,
    validationErrors: validationErrors.view
  });
  t.deepEqual(boundaries.stats, {
    segmentCount: 3,
    maximumPixelCount: 64,
    boundariesPerTile: 8,
    maximumSearchCount: 27
  });
  boundaries.addToGraph(graph);
  const compiled = graph.compile();

  const encode = (): void => {
    const encoder = device.createCommandEncoder();
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
  };
  encode();
  t.deepEqual(
    await readUint32(output.buffer),
    getMipmapBoundaryOracle(startValues, segmentOffsets, 0, 20, 64),
    'binary tile seeds and forward gallops match independent lower bounds'
  );
  t.deepEqual(await readUint32(validationErrors.buffer), [0]);

  domain.buffer.write(new Float32Array([3, 10]));
  pixelCount.buffer.write(new Uint32Array([12]));
  encode();
  const dynamicOutput = await readUint32(output.buffer);
  const dynamicExpected = getMipmapBoundaryOracle(startValues, segmentOffsets, 3, 10, 12);
  for (let segmentIndex = 0; segmentIndex < 3; segmentIndex++) {
    const outputOffset = segmentIndex * 65;
    t.deepEqual(
      dynamicOutput.slice(outputOffset, outputOffset + 13),
      dynamicExpected.slice(outputOffset, outputOffset + 13),
      `dynamic query preserves segment ${segmentIndex} lower bounds`
    );
  }

  domain.buffer.write(new Float32Array([0, 0]));
  encode();
  t.equal((await readUint32(validationErrors.buffer))[0] & 1, 1, 'invalid domains are reported');

  domain.buffer.write(new Float32Array([0, 20]));
  segments.buffer.write(new Uint32Array([0, 256, 255, 261]));
  encode();
  t.equal(
    (await readUint32(validationErrors.buffer))[0] & 2,
    2,
    'non-monotonic segment offsets are reported'
  );

  compiled.destroy();
  for (const resource of [starts, segments, domain, pixelCount, output, validationErrors]) {
    resource.buffer.destroy();
  }
  t.end();
});

test('GPUTraceLaneIndexBuilder preserves canonical IDs in lane/time order', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'trace-lane-index-builder-test'});
  const startValues = [5, -1, 2, 2, 7, 0, 4, 3];
  const durationValues = [2, 1, 2, 1, 2, 1, 1, 2];
  const laneValues = [1, 0, 1, 0, 2, 1, 0, 2];
  const sourceWords = new Uint32Array(startValues.length * 3);
  const sourceFloats = new Float32Array(sourceWords.buffer);
  for (let index = 0; index < startValues.length; index++) {
    sourceFloats[index * 3] = startValues[index];
    sourceFloats[index * 3 + 1] = durationValues[index];
    sourceWords[index * 3 + 2] = laneValues[index];
  }
  const sourceBuffer = device.createBuffer({data: sourceWords, usage: BUFFER_USAGE});
  const sourceHandle = graph.importBuffer(
    {id: 'lane-index-source', byteLength: sourceBuffer.byteLength, usage: sourceBuffer.usage},
    sourceBuffer
  );
  const sourceColumn = <Format extends 'float32' | 'uint32'>(
    format: Format,
    wordOffset: number
  ): GraphDataView<Format> =>
    graph.createDataView(sourceHandle, {
      format,
      length: startValues.length,
      byteOffset: wordOffset * 4,
      byteStride: 3 * 4
    });
  const sortedStarts = makeFloatOutput(device, graph, 'lane-index-starts', startValues.length);
  const sortedDurations = makeFloatOutput(
    device,
    graph,
    'lane-index-durations',
    startValues.length
  );
  const sortedSpanIds = makeOutput(device, graph, 'lane-index-span-ids', startValues.length);
  const laneOffsets = makeOutput(device, graph, 'lane-index-offsets', 4);
  const validationErrors = makeOutput(device, graph, 'lane-index-validation', 1, [0xffffffff]);
  const compactSpanIds = makeOutput(
    device,
    graph,
    'lane-index-compact-span-ids',
    startValues.length
  );
  const compactLaneOffsets = makeOutput(device, graph, 'lane-index-compact-offsets', 4);
  const compactValidationErrors = makeOutput(
    device,
    graph,
    'lane-index-compact-validation',
    1,
    [0xffffffff]
  );
  const builder = new GPUTraceLaneIndexBuilder({
    source: {
      startTimes: sourceColumn('float32', 0),
      durations: sourceColumn('float32', 1),
      laneIds: sourceColumn('uint32', 2)
    },
    laneCount: 3,
    output: {
      startTimes: sortedStarts.view,
      durations: sortedDurations.view,
      spanIds: sortedSpanIds.view,
      laneOffsets: laneOffsets.view,
      validationErrors: validationErrors.view
    }
  });
  t.deepEqual(builder.stats, {spanCount: 8, laneCount: 3, sortCount: 2});
  builder.addToGraph(graph);
  new GPUTraceLaneIndexBuilder({
    id: 'compact-lane-index',
    source: {
      startTimes: sourceColumn('float32', 0),
      durations: sourceColumn('float32', 1),
      laneIds: sourceColumn('uint32', 2)
    },
    laneCount: 3,
    output: {
      spanIds: compactSpanIds.view,
      laneOffsets: compactLaneOffsets.view,
      validationErrors: compactValidationErrors.view
    }
  }).addToGraph(graph);
  const compiled = graph.compile();
  const encode = (): void => {
    const encoder = device.createCommandEncoder();
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
  };

  encode();
  t.deepEqual(await readUint32(sortedSpanIds.buffer), [1, 3, 6, 5, 2, 0, 7, 4]);
  t.deepEqual(await readFloat32(sortedStarts.buffer), [-1, 2, 4, 0, 2, 5, 3, 7]);
  t.deepEqual(await readFloat32(sortedDurations.buffer), [1, 1, 1, 1, 2, 2, 2, 2]);
  t.deepEqual(await readUint32(laneOffsets.buffer), [0, 3, 6, 8]);
  t.deepEqual(await readUint32(validationErrors.buffer), [0]);
  t.deepEqual(await readUint32(compactSpanIds.buffer), [1, 3, 6, 5, 2, 0, 7, 4]);
  t.deepEqual(await readUint32(compactLaneOffsets.buffer), [0, 3, 6, 8]);
  t.deepEqual(await readUint32(compactValidationErrors.buffer), [0]);

  sourceWords[4 * 3 + 2] = 9;
  sourceFloats[4 * 3] = Number.NaN;
  sourceFloats[0 * 3 + 1] = -1;
  sourceBuffer.write(sourceWords);
  encode();
  t.equal(
    (await readUint32(validationErrors.buffer))[0],
    1 | 2 | 4,
    'invalid time, lane, and duration rows are reported together'
  );
  t.deepEqual(await readUint32(laneOffsets.buffer), [0, 3, 6, 7], 'invalid lanes are excluded');

  compiled.destroy();
  sourceBuffer.destroy();
  for (const output of [
    sortedStarts,
    sortedDurations,
    sortedSpanIds,
    laneOffsets,
    validationErrors,
    compactSpanIds,
    compactLaneOffsets,
    compactValidationErrors
  ]) {
    output.buffer.destroy();
  }
  t.end();
});

test('GPUTracePixelMipmap selects longest non-overlapping span per lane/pixel', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'trace-pixel-mipmap-test'});
  const starts = makeFloatOutput(
    device,
    graph,
    'pixel-mipmap-starts',
    9,
    [9, 1.1, 2.2, -5, 7, 1.3, 1, 3, 2]
  );
  const durations = makeFloatOutput(
    device,
    graph,
    'pixel-mipmap-durations',
    9,
    [4, 0.1, 3.5, 6, 1, 0.5, 0.5, 1, 0.1]
  );
  const spanIds = makeOutput(
    device,
    graph,
    'pixel-mipmap-span-ids',
    9,
    [14, 11, 23, 10, 22, 12, 20, 13, 21]
  );
  const rowOrder = makeOutput(
    device,
    graph,
    'pixel-mipmap-row-order',
    9,
    [3, 1, 5, 7, 0, 6, 8, 2, 4]
  );
  const laneOffsets = makeOutput(device, graph, 'pixel-mipmap-lane-offsets', 3, [0, 5, 9]);
  const maximumDurationTree = makeOutput(device, graph, 'pixel-mipmap-maximum-tree', 32);
  const maximumTreeValidation = makeOutput(
    device,
    graph,
    'pixel-mipmap-maximum-tree-validation',
    1,
    [0xffffffff]
  );
  const domain = makeFloatOutput(device, graph, 'pixel-mipmap-domain', 2, [0, 2]);
  const pixelCount = makeOutput(device, graph, 'pixel-mipmap-count', 1, [5]);
  const output = makeOutput(device, graph, 'pixel-mipmap-output', 10);
  const validationErrors = makeOutput(device, graph, 'pixel-mipmap-validation', 1, [0xffffffff]);
  const selectionMask = makeOutput(device, graph, 'pixel-mipmap-selection-mask', 1, [
    0x1ff & ~(1 << 2)
  ]);
  const filteredOutput = makeOutput(device, graph, 'pixel-mipmap-filtered-output', 10);
  const filteredValidationErrors = makeOutput(
    device,
    graph,
    'pixel-mipmap-filtered-validation',
    1,
    [0xffffffff]
  );
  const maximumTreeBuilder = new GPUTraceRangeMaximumIndexBuilder({
    durations: durations.view,
    spanIds: spanIds.view,
    rowOrder: rowOrder.view,
    laneOffsets: laneOffsets.view,
    leafCapacity: 8,
    output: maximumDurationTree.view,
    validationErrors: maximumTreeValidation.view
  });
  t.deepEqual(maximumTreeBuilder.stats, {
    spanCount: 9,
    laneCount: 2,
    leafCapacity: 8,
    treeStride: 16,
    treeWordCount: 32,
    levelCount: 4
  });
  maximumTreeBuilder.addToGraph(graph);
  const mipmap = new GPUTracePixelMipmap({
    index: {
      startTimes: starts.view,
      durations: durations.view,
      spanIds: spanIds.view,
      rowOrder: rowOrder.view,
      laneOffsets: laneOffsets.view,
      maximumDurationTree: maximumDurationTree.view,
      maximumDurationLeafCapacity: 8
    },
    query: {domain: domain.view, pixelCount: pixelCount.view},
    maximumPixelCount: 5,
    boundariesPerTile: 2,
    output: output.view,
    validationErrors: validationErrors.view
  });
  t.deepEqual(mipmap.stats, {
    laneCount: 2,
    sourceSpanCount: 9,
    orderedSpanCount: 9,
    maximumPixelCount: 5,
    maximumRepresentativeCount: 10,
    rangeMaximumAccelerated: true,
    maximumDurationLeafCapacity: 8
  });
  mipmap.addToGraph(graph);
  new GPUTracePixelMipmap({
    id: 'filtered-pixel-mipmap',
    index: {
      startTimes: starts.view,
      durations: durations.view,
      spanIds: spanIds.view,
      rowOrder: rowOrder.view,
      laneOffsets: laneOffsets.view
    },
    query: {domain: domain.view, pixelCount: pixelCount.view},
    maximumPixelCount: 5,
    selectionMask: selectionMask.view,
    output: filteredOutput.view,
    validationErrors: filteredValidationErrors.view
  }).addToGraph(graph);
  const compiled = graph.compile();
  const encode = (): void => {
    const encoder = device.createCommandEncoder();
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
  };

  encode();
  const tree = await readUint32(maximumDurationTree.buffer);
  t.equal(tree[1], 0, 'lane zero tree root selects its longest secondary-index row');
  t.equal(tree[17], 7, 'lane one tree root selects its longest secondary-index row');
  t.deepEqual(await readUint32(maximumTreeValidation.buffer), [0]);
  t.deepEqual(
    await readUint32(output.buffer),
    [10, 13, 0xffffffff, 0xffffffff, 14, 20, 23, 23, 22, 0xffffffff]
  );
  t.deepEqual(await readUint32(validationErrors.buffer), [0]);
  t.deepEqual(
    await readUint32(filteredOutput.buffer),
    [10, 13, 0xffffffff, 0xffffffff, 14, 20, 21, 0xffffffff, 22, 0xffffffff],
    'filtering happens before each pixel chooses its longest canonical span'
  );
  t.deepEqual(await readUint32(filteredValidationErrors.buffer), [0]);

  pixelCount.buffer.write(Uint32Array.of(2));
  encode();
  t.deepEqual(
    await readUint32(output.buffer),
    [10, 13, 0xffffffff, 0xffffffff, 0xffffffff, 20, 23, 0xffffffff, 0xffffffff, 0xffffffff],
    'inactive fixed-capacity cells are cleared when viewport width decreases'
  );

  compiled.destroy();
  for (const resource of [
    starts,
    durations,
    spanIds,
    rowOrder,
    laneOffsets,
    maximumDurationTree,
    maximumTreeValidation,
    domain,
    pixelCount,
    output,
    validationErrors
  ]) {
    resource.buffer.destroy();
  }
  t.end();
});

test('GPUTraceCriticalPath resolves, ranks, and masks canonical parent paths', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'trace-critical-path-test'});
  const parents = makeOutput(device, graph, 'critical-parents', 7, [
    GPU_SCENE_INVALID_REFERENCE,
    0,
    1,
    0,
    GPU_SCENE_INVALID_REFERENCE,
    4,
    5
  ]);
  const durations = makeFloatOutput(device, graph, 'critical-durations', 7, [2, 3, 5, 7, 1, 4, 5]);
  const pathDurations = makeFloatOutput(device, graph, 'critical-path-durations', 7);
  const slackDurations = makeFloatOutput(device, graph, 'critical-slack-durations', 7);
  const criticalPredecessors = makeOutput(device, graph, 'critical-predecessors', 7);
  const rootIndices = makeOutput(device, graph, 'critical-roots', 7);
  const hopCounts = makeOutput(device, graph, 'critical-hops', 7);
  const criticalMask = makeOutput(device, graph, 'critical-mask', 7);
  const summary = makeOutput(device, graph, 'critical-summary', 4);
  const criticalPath = new GPUTraceCriticalPath({
    parentIndices: parents.view,
    durations: durations.view,
    maximumRowsPerPass: 2,
    output: {
      pathDurations: pathDurations.view,
      slackDurations: slackDurations.view,
      criticalPredecessors: criticalPredecessors.view,
      rootIndices: rootIndices.view,
      hopCounts: hopCounts.view,
      criticalMask: criticalMask.view,
      summary: summary.view
    }
  });
  t.deepEqual(criticalPath.stats, {
    spanCount: 7,
    pointerJumpPassCount: 4,
    maximumCriticalPathLength: 7
  });
  criticalPath.addToGraph(graph);
  const compiled = graph.compile();
  const execution = compiled.createExecution({maximumInvocationCount: 2});
  let executionStepCount = 0;
  while (!execution.completed) {
    const stepEncoder = device.createCommandEncoder();
    execution.encodeNext(stepEncoder, {parameters: undefined});
    device.submit(stepEncoder.finish());
    executionStepCount++;
  }
  t.ok(executionStepCount > 1, 'critical analysis can advance through bounded graph steps');

  t.deepEqual(await readFloat32(pathDurations.buffer), [2, 5, 10, 9, 1, 5, 10]);
  t.deepEqual(await readFloat32(slackDurations.buffer), [8, 5, 0, 1, 9, 5, 0]);
  t.deepEqual(await readUint32(criticalPredecessors.buffer), [
    GPU_SCENE_INVALID_REFERENCE,
    0,
    1,
    0,
    GPU_SCENE_INVALID_REFERENCE,
    4,
    5
  ]);
  t.deepEqual(await readUint32(rootIndices.buffer), [0, 0, 0, 0, 4, 4, 4]);
  t.deepEqual(await readUint32(hopCounts.buffer), [0, 1, 2, 1, 0, 1, 2]);
  t.deepEqual(await readUint32(criticalMask.buffer), [1, 1, 1, 0, 0, 0, 0]);
  let summaryWords = await readUint32(summary.buffer);
  t.equal(new Float32Array(Uint32Array.from([summaryWords[0]]).buffer)[0], 10);
  t.deepEqual(summaryWords.slice(1), [2, 2, 0], 'ties choose the lowest stable endpoint');

  parents.buffer.write(Uint32Array.from([1, 0, 99, 0, GPU_SCENE_INVALID_REFERENCE, 4, 5]));
  let encoder = device.createCommandEncoder();
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
  summaryWords = await readUint32(summary.buffer);
  t.equal(summaryWords[1], 6, 'cyclic paths are excluded from endpoint selection');
  t.equal(summaryWords[3] & 1, 1, 'invalid parents are reported');
  t.equal(summaryWords[3] & 4, 4, 'cycles are reported');
  t.deepEqual(await readUint32(criticalMask.buffer), [0, 0, 0, 0, 1, 1, 1]);

  compiled.destroy();
  for (const resource of [
    parents,
    durations,
    pathDurations,
    slackDurations,
    criticalPredecessors,
    rootIndices,
    hopCounts,
    criticalMask,
    summary
  ]) {
    resource.buffer.destroy();
  }
  t.end();
});

test('GPUTraceComparison publishes aligned aggregate deltas and stable regressions', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'trace-comparison-test'});
  const currentCounts = makeOutput(device, graph, 'comparison-current-counts', 3, [120, 80, 10]);
  const currentDurationMeans = makeFloatOutput(
    device,
    graph,
    'comparison-current-durations',
    3,
    [12, 8, 4]
  );
  const currentErrorRates = makeFloatOutput(
    device,
    graph,
    'comparison-current-errors',
    3,
    [0.05, 0.4, 0]
  );
  const baselineCounts = makeOutput(device, graph, 'comparison-baseline-counts', 3, [100, 100, 10]);
  const baselineDurationMeans = makeFloatOutput(
    device,
    graph,
    'comparison-baseline-durations',
    3,
    [10, 10, 0]
  );
  const baselineErrorRates = makeFloatOutput(
    device,
    graph,
    'comparison-baseline-errors',
    3,
    [0.05, 0.1, 0]
  );
  const countDeltas = makeFloatOutput(device, graph, 'comparison-count-deltas', 3);
  const durationDeltas = makeFloatOutput(device, graph, 'comparison-duration-deltas', 3);
  const durationRatios = makeFloatOutput(device, graph, 'comparison-duration-ratios', 3);
  const errorRateDeltas = makeFloatOutput(device, graph, 'comparison-error-deltas', 3);
  const scores = makeFloatOutput(device, graph, 'comparison-scores', 3);
  const regressionMask = makeOutput(device, graph, 'comparison-mask', 3);
  const summary = makeOutput(device, graph, 'comparison-summary', 4);
  const comparison = new GPUTraceComparison({
    current: {
      counts: currentCounts.view,
      durationMeans: currentDurationMeans.view,
      errorRates: currentErrorRates.view
    },
    baseline: {
      counts: baselineCounts.view,
      durationMeans: baselineDurationMeans.view,
      errorRates: baselineErrorRates.view
    },
    durationWeight: 1,
    errorWeight: 2,
    threshold: 0.25,
    output: {
      countDeltas: countDeltas.view,
      durationDeltas: durationDeltas.view,
      durationRatios: durationRatios.view,
      errorRateDeltas: errorRateDeltas.view,
      scores: scores.view,
      regressionMask: regressionMask.view,
      summary: summary.view
    }
  });
  t.deepEqual(comparison.stats, {groupCount: 3});
  comparison.addToGraph(graph);
  const compiled = graph.compile();
  let encoder = device.createCommandEncoder();
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  t.deepEqual(await readFloat32(countDeltas.buffer), [20, -20, 0]);
  t.deepEqual(await readFloat32(durationDeltas.buffer), [2, -2, 4]);
  const actualRatios = await readFloat32(durationRatios.buffer);
  t.ok(Math.abs(actualRatios[0] - 1.2) < 0.0001);
  t.ok(Math.abs(actualRatios[1] - 0.8) < 0.0001);
  t.ok(
    Math.abs(actualRatios[2] - 4000) < 0.001,
    'zero baseline means use the explicit duration floor'
  );
  const actualErrorDeltas = await readFloat32(errorRateDeltas.buffer);
  t.ok(Math.abs(actualErrorDeltas[0]) < 0.0001);
  t.ok(Math.abs(actualErrorDeltas[1] - 0.3) < 0.0001);
  t.ok(Math.abs(actualErrorDeltas[2]) < 0.0001);
  t.deepEqual(await readUint32(regressionMask.buffer), [0, 1, 1]);
  let summaryWords = await readUint32(summary.buffer);
  t.equal(summaryWords[0], 2);
  t.equal(summaryWords[2], 2, 'largest stable group regression is selected');
  t.equal(summaryWords[3], 0);

  baselineErrorRates.buffer.write(new Float32Array([0.05, 2, 0]));
  encoder = device.createCommandEncoder();
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
  summaryWords = await readUint32(summary.buffer);
  t.equal(summaryWords[3] & 2, 2, 'invalid baseline summaries are reported');
  t.equal((await readUint32(regressionMask.buffer))[1], 0, 'invalid groups cannot regress');

  compiled.destroy();
  for (const resource of [
    currentCounts,
    currentDurationMeans,
    currentErrorRates,
    baselineCounts,
    baselineDurationMeans,
    baselineErrorRates,
    countDeltas,
    durationDeltas,
    durationRatios,
    errorRateDeltas,
    scores,
    regressionMask,
    summary
  ]) {
    resource.buffer.destroy();
  }
  t.end();
});

test('GPUTraceAnomalyScoring matches an explicit peer-policy CPU oracle', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'trace-anomaly-scoring-test'});
  const groups = makeOutput(device, graph, 'anomaly-groups', 6, [0, 0, 0, 1, 1, 1]);
  const durations = makeFloatOutput(
    device,
    graph,
    'anomaly-durations',
    6,
    [10, 14, 22, 100, 130, 70]
  );
  const errors = makeOutput(device, graph, 'anomaly-errors', 6, [0, 0, 1, 0, 1, 0]);
  const means = makeFloatOutput(device, graph, 'anomaly-means', 2, [12, 100]);
  const standardDeviations = makeFloatOutput(
    device,
    graph,
    'anomaly-standard-deviations',
    2,
    [2, 10]
  );
  const errorRates = makeFloatOutput(device, graph, 'anomaly-error-rates', 2, [0.1, 0.2]);
  const scores = makeFloatOutput(device, graph, 'anomaly-scores', 6);
  const anomalyMask = makeOutput(device, graph, 'anomaly-mask', 6);
  const summary = makeOutput(device, graph, 'anomaly-summary', 4);
  const scoring = new GPUTraceAnomalyScoring({
    groupIndices: groups.view,
    durations: durations.view,
    errorMask: errors.view,
    baselineDurationMeans: means.view,
    baselineDurationStandardDeviations: standardDeviations.view,
    baselineErrorRates: errorRates.view,
    durationWeight: 1,
    errorWeight: 2,
    threshold: 3,
    maximumRowsPerPass: 2,
    output: {scores: scores.view, anomalyMask: anomalyMask.view, summary: summary.view}
  });
  t.deepEqual(scoring.stats, {spanCount: 6, groupCount: 2, chunkCount: 1});
  scoring.addToGraph(graph);
  const compiled = graph.compile();
  const execution = compiled.createExecution({maximumInvocationCount: 2});
  let executionStepCount = 0;
  while (!execution.completed) {
    const stepEncoder = device.createCommandEncoder();
    execution.encodeNext(stepEncoder, {parameters: undefined});
    device.submit(stepEncoder.finish());
    executionStepCount++;
  }
  t.ok(executionStepCount > 1, 'anomaly scoring can advance through bounded graph steps');

  const expectedScores = [0.2, 1.2, 6.8, 0.4, 4.6, 0.4];
  const actualScores = await readFloat32(scores.buffer);
  t.ok(
    actualScores.every((score, index) => Math.abs(score - expectedScores[index]) < 0.0001),
    'scores match the duration-z plus error-delta CPU oracle'
  );
  t.deepEqual(await readUint32(anomalyMask.buffer), [0, 0, 1, 0, 1, 0]);
  let summaryWords = await readUint32(summary.buffer);
  t.equal(summaryWords[0], 2, 'summary counts thresholded anomalies');
  t.ok(
    Math.abs(new Float32Array(Uint32Array.from([summaryWords[1]]).buffer)[0] - 6.8) < 0.0001,
    'summary retains the maximum score'
  );
  t.deepEqual(summaryWords.slice(2), [2, 0], 'maximum index is stable and inputs validate');

  groups.buffer.write(Uint32Array.from([0, 0, 7, 1, 1, 1]));
  let encoder = device.createCommandEncoder();
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
  summaryWords = await readUint32(summary.buffer);
  t.equal(summaryWords[3] & 1, 1, 'out-of-range peer groups are reported');
  t.equal((await readUint32(anomalyMask.buffer))[2], 0, 'invalid rows cannot become anomalies');

  compiled.destroy();
  for (const resource of [
    groups,
    durations,
    errors,
    means,
    standardDeviations,
    errorRates,
    scores,
    anomalyMask,
    summary
  ]) {
    resource.buffer.destroy();
  }
  t.end();
});

test('GPUTraceTemporalIndex expands hierarchy nodes into one conservative selection', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'trace-temporal-hierarchy-test'});
  const leafMinimumTimes = makeFloatOutput(
    device,
    graph,
    'hierarchy-leaf-minimum-times',
    8,
    [0, 2, 4, 6, 8, 10, 12, 14]
  );
  const leafMaximumTimes = makeFloatOutput(
    device,
    graph,
    'hierarchy-leaf-maximum-times',
    8,
    [1, 3, 5, 7, 9, 11, 13, 15]
  );
  const leafGroupIds = makeOutput(
    device,
    graph,
    'hierarchy-leaf-group-ids',
    8,
    [0, 0, 0, 0, 1, 1, 1, 1]
  );
  const leafMinimumLanes = makeOutput(
    device,
    graph,
    'hierarchy-leaf-minimum-lanes',
    8,
    [0, 0, 2, 2, 4, 4, 6, 6]
  );
  const leafMaximumLanes = makeOutput(
    device,
    graph,
    'hierarchy-leaf-maximum-lanes',
    8,
    [1, 1, 3, 3, 5, 5, 7, 7]
  );
  const hierarchyMinimumTimes = makeFloatOutput(
    device,
    graph,
    'hierarchy-node-minimum-times',
    6,
    [0, 4, 8, 12, 0, 8]
  );
  const hierarchyMaximumTimes = makeFloatOutput(
    device,
    graph,
    'hierarchy-node-maximum-times',
    6,
    [3, 7, 11, 15, 7, 15]
  );
  const hierarchyGroupIds = makeOutput(
    device,
    graph,
    'hierarchy-node-group-ids',
    6,
    [0, 0, 1, 1, 0, 1]
  );
  const hierarchyFirstBatchIndices = makeOutput(
    device,
    graph,
    'hierarchy-node-first-batches',
    6,
    [0, 2, 4, 6, 0, 4]
  );
  const hierarchyBatchCounts = makeOutput(
    device,
    graph,
    'hierarchy-node-batch-counts',
    6,
    [2, 2, 2, 2, 4, 4]
  );
  const hierarchyMinimumLanes = makeOutput(
    device,
    graph,
    'hierarchy-node-minimum-lanes',
    6,
    [0, 2, 4, 6, 0, 4]
  );
  const hierarchyMaximumLanes = makeOutput(
    device,
    graph,
    'hierarchy-node-maximum-lanes',
    6,
    [1, 3, 5, 7, 3, 7]
  );
  const queryBuffer = device.createBuffer({byteLength: 7 * 4, usage: BUFFER_USAGE});
  const queryHandle = graph.importBuffer(
    {id: 'hierarchy-query', byteLength: queryBuffer.byteLength, usage: queryBuffer.usage},
    queryBuffer
  );
  const candidates = makeOutput(device, graph, 'hierarchy-candidates', 8);
  const candidateCount = makeOutput(device, graph, 'hierarchy-candidate-count', 1);

  const temporalIndex = new GPUTraceTemporalIndex({
    batches: {
      minimumTimes: leafMinimumTimes.view,
      maximumTimes: leafMaximumTimes.view,
      groupIds: leafGroupIds.view,
      minimumLanes: leafMinimumLanes.view,
      maximumLanes: leafMaximumLanes.view
    },
    hierarchy: {
      minimumTimes: hierarchyMinimumTimes.view,
      maximumTimes: hierarchyMaximumTimes.view,
      groupIds: hierarchyGroupIds.view,
      firstBatchIndices: hierarchyFirstBatchIndices.view,
      batchCounts: hierarchyBatchCounts.view,
      minimumLanes: hierarchyMinimumLanes.view,
      maximumLanes: hierarchyMaximumLanes.view,
      levels: [
        {firstNodeIndex: 0, nodeCount: 4, maximumBatchCount: 2, averageTimeSpan: 3},
        {firstNodeIndex: 4, nodeCount: 2, maximumBatchCount: 4, averageTimeSpan: 7}
      ]
    },
    query: {
      timeWindow: graph.createDataView(queryHandle, {format: 'float32', length: 3}),
      enabledGroups: graph.createDataView(queryHandle, {
        format: 'uint32',
        length: 1,
        byteOffset: 3 * 4
      }),
      laneWindow: graph.createDataView(queryHandle, {
        format: 'uint32',
        length: 2,
        byteOffset: 4 * 4
      }),
      level: graph.createDataView(queryHandle, {
        format: 'uint32',
        length: 1,
        byteOffset: 6 * 4
      })
    },
    output: {
      candidates: candidates.view,
      candidateCount: candidateCount.view
    }
  });
  t.deepEqual(temporalIndex.stats, {batchCount: 8, levelCount: 3, maximumNodeCount: 4});
  temporalIndex.addToGraph(graph);
  const compiled = graph.compile();

  writeTemporalQuery(queryBuffer, [4.5, 10.5, 0], 0b11, 0);
  let encoder = device.createCommandEncoder();
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
  t.deepEqual(
    (await readUint32(candidates.buffer)).slice(0, (await readUint32(candidateCount.buffer))[0]),
    [2, 3, 4, 5],
    'fine nodes expand into stable source-ordered leaf ranges'
  );
  writeTemporalQuery(queryBuffer, [4.5, 10.5, 0], 0b11, 0, [4, 5]);
  encoder = device.createCommandEncoder();
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
  t.deepEqual(
    (await readUint32(candidates.buffer)).slice(0, (await readUint32(candidateCount.buffer))[0]),
    [4, 5],
    'hierarchy nodes outside the vertical viewport are rejected'
  );
  writeTemporalQuery(queryBuffer, [4.5, 10.5, 0], 0b11, 1);
  encoder = device.createCommandEncoder();
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
  t.deepEqual(
    (await readUint32(candidates.buffer)).slice(0, (await readUint32(candidateCount.buffer))[0]),
    [0, 1, 2, 3, 4, 5, 6, 7],
    'coarse selection remains conservative and source ordered'
  );
  compiled.destroy();
  for (const resource of [
    leafMinimumTimes,
    leafMaximumTimes,
    leafGroupIds,
    leafMinimumLanes,
    leafMaximumLanes,
    hierarchyMinimumTimes,
    hierarchyMaximumTimes,
    hierarchyGroupIds,
    hierarchyFirstBatchIndices,
    hierarchyBatchCounts,
    hierarchyMinimumLanes,
    hierarchyMaximumLanes,
    candidates,
    candidateCount
  ]) {
    resource.buffer.destroy();
  }
  queryBuffer.destroy();
  t.end();
});

test('GPUTraceTimeBuckets clips selected intervals at trace-time boundaries', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const trace = new GPUTraceScene(device, {
    spans: makeSpans(),
    parents: Uint32Array.from([GPU_SCENE_INVALID_REFERENCE, 0, 1]),
    processCount: 2,
    threadCount: 3
  });
  const graph = new GPUCommandGraph(device, {id: 'trace-time-buckets-test'});
  const source = trace.importToGraph(graph);
  const selection = makeOutput(device, graph, 'trace-time-buckets-selection', 3, [1, 0, 1]);
  const counts = makeOutput(device, graph, 'trace-time-bucket-counts', 4);
  const durations = makeFloatOutput(device, graph, 'trace-time-bucket-durations', 4);
  const concurrency = makeFloatOutput(device, graph, 'trace-time-bucket-concurrency', 4);
  const utilization = makeFloatOutput(device, graph, 'trace-time-bucket-utilization', 4);
  const idleLaneTime = makeFloatOutput(device, graph, 'trace-time-bucket-idle-lane-time', 4);
  const domainBuffer = device.createBuffer({
    data: Float32Array.of(10, 30),
    usage: BUFFER_USAGE
  });
  const domainHandle = graph.importBuffer(
    {
      id: 'trace-time-bucket-domain',
      byteLength: domainBuffer.byteLength,
      usage: domainBuffer.usage
    },
    domainBuffer
  );
  const domain = graph.createDataView(domainHandle, {format: 'float32', length: 2});

  new GPUTraceTimeBuckets({
    trace: source,
    domain,
    selection: selection.view,
    countOutput: counts.view,
    durationOutput: durations.view,
    occupancy: {
      laneCount: 2,
      averageConcurrencyOutput: concurrency.view,
      laneUtilizationOutput: utilization.view,
      idleLaneTimeOutput: idleLaneTime.view
    }
  }).addToGraph(graph);

  const compiled = graph.compile();
  const encoder = device.createCommandEncoder();
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  t.deepEqual(
    await readUint32(counts.buffer),
    [1, 0, 1, 1],
    'each selected interval contributes to every intersected bucket'
  );
  t.deepEqual(
    await readFloat32(durations.buffer),
    [4, 0, 5, 3],
    'duration contributions are clipped exactly at bucket boundaries'
  );
  t.deepEqual(roundValues(await readFloat32(concurrency.buffer)), [0.8, 0, 1, 0.6]);
  t.deepEqual(roundValues(await readFloat32(utilization.buffer)), [0.4, 0, 0.5, 0.3]);
  t.deepEqual(await readFloat32(idleLaneTime.buffer), [6, 10, 5, 7]);

  domainBuffer.write(Float32Array.of(10, 20));
  const updatedEncoder = device.createCommandEncoder();
  compiled.encode(updatedEncoder, {parameters: undefined});
  device.submit(updatedEncoder.finish());
  t.deepEqual(await readUint32(counts.buffer), [1, 1, 0, 0], 'GPU domains update in place');
  t.deepEqual(await readFloat32(durations.buffer), [2.5, 1.5, 0, 0]);
  t.deepEqual(roundValues(await readFloat32(concurrency.buffer)), [1, 0.6, 0, 0]);
  t.deepEqual(roundValues(await readFloat32(utilization.buffer)), [0.5, 0.3, 0, 0]);
  t.deepEqual(await readFloat32(idleLaneTime.buffer), [2.5, 3.5, 5, 5]);

  const sharedGraph = new GPUCommandGraph(device, {id: 'trace-time-buckets-shared-output-test'});
  const sharedSource = trace.importToGraph(sharedGraph);
  const sharedOutputBuffer = device.createBuffer({byteLength: 68 * 4, usage: BUFFER_USAGE});
  const sharedOutputHandle = sharedGraph.importBuffer(
    {
      id: 'trace-time-bucket-shared-output',
      byteLength: sharedOutputBuffer.byteLength,
      usage: sharedOutputBuffer.usage
    },
    sharedOutputBuffer
  );
  new GPUTraceTimeBuckets({
    trace: sharedSource,
    domain: [10, 30],
    countOutput: sharedGraph.createDataView(sharedOutputHandle, {
      format: 'uint32',
      length: 4,
      byteOffset: 60 * Uint32Array.BYTES_PER_ELEMENT
    }),
    durationOutput: sharedGraph.createDataView(sharedOutputHandle, {
      format: 'float32',
      byteOffset: 64 * Uint32Array.BYTES_PER_ELEMENT,
      length: 4
    })
  }).addToGraph(sharedGraph);
  const sharedCompiled = sharedGraph.compile();
  const sharedEncoder = device.createCommandEncoder();
  sharedCompiled.encode(sharedEncoder, {parameters: undefined});
  device.submit(sharedEncoder.finish());
  const sharedBytes = await sharedOutputBuffer.readAsync();
  t.deepEqual(
    Array.from(
      new Uint32Array(
        sharedBytes.buffer,
        sharedBytes.byteOffset + 60 * Uint32Array.BYTES_PER_ELEMENT,
        4
      )
    ),
    [2, 0, 1, 1],
    'shared result buffers avoid writable storage binding aliasing across alignment pages'
  );
  t.deepEqual(
    Array.from(
      new Float32Array(
        sharedBytes.buffer,
        sharedBytes.byteOffset + 64 * Uint32Array.BYTES_PER_ELEMENT,
        4
      )
    ),
    [6, 0, 5, 3]
  );

  compiled.destroy();
  sharedCompiled.destroy();
  trace.destroy();
  selection.buffer.destroy();
  counts.buffer.destroy();
  durations.buffer.destroy();
  concurrency.buffer.destroy();
  utilization.buffer.destroy();
  idleLaneTime.buffer.destroy();
  domainBuffer.destroy();
  sharedOutputBuffer.destroy();
  t.end();
});

test('GPUTraceScene rejects ambiguous identity, ownership, topology, and source partitions', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const source = {
    spans: makeSpans(),
    parents: Uint32Array.from([GPU_SCENE_INVALID_REFERENCE, 0, 1]),
    processCount: 2,
    threadCount: 3
  };

  const duplicate = makeSpans();
  duplicate[14] = duplicate[6]!;
  t.throws(() => new GPUTraceScene(device, {...source, spans: duplicate}), /identity/);
  t.throws(
    () => new GPUTraceScene(device, {...source, parents: Uint32Array.from([4, 0, 1])}),
    /identity, or ownership/
  );
  t.throws(() => new GPUTraceScene(device, {...source, processCount: 1}), /identity, or ownership/);
  t.throws(
    () =>
      new GPUTraceScene(device, {
        ...source,
        links: Uint32Array.from([0, 4, 0, 0])
      }),
    /endpoints/
  );
  t.throws(
    () =>
      new GPUTraceScene(device, {
        ...source,
        partitions: [{firstSpan: 1, spanCount: 2}]
      }),
    /contiguous/
  );
  t.throws(
    () =>
      new GPUTraceScene(device, {
        ...source,
        outgoing: {offsets: Uint32Array.from([0, 1, 0, 0]), neighbors: new Uint32Array(0)}
      }),
    /monotonic/
  );
  t.throws(
    () =>
      new GPUTraceScene(device, {
        ...source,
        links: Uint32Array.from([0, 1, 0, 0]),
        outgoing: {
          offsets: Uint32Array.from([0, 1, 1, 1]),
          neighbors: Uint32Array.from([2])
        }
      }),
    /source edge order/,
    'precomputed adjacency cannot silently contradict canonical dependency links'
  );

  const empty = new GPUTraceScene(device, {
    spans: new Uint32Array(0),
    parents: new Uint32Array(0),
    processCount: 0,
    threadCount: 0,
    partitions: [{firstSpan: 0, spanCount: 0}]
  });
  const graph = new GPUCommandGraph(device);
  const emptyView = empty.importToGraph(graph);
  t.equal(emptyView.linkFlags.length, 0, 'empty dependencies still expose complete typed views');
  t.equal(emptyView.startTimes.length, 0, 'empty spans retain a valid minimal allocation');
  empty.destroy();
  t.end();
});

function makeSpans(): Uint32Array {
  const words = new Uint32Array(3 * 8);
  const floats = new Float32Array(words.buffer);
  const rows = [
    {start: 10, duration: 4, lane: 2, group: 4, process: 0, thread: 0, id: 101, flags: 1},
    {start: 12, duration: 2, lane: 3, group: 5, process: 0, thread: 1, id: 205, flags: 2},
    {start: 20, duration: 8, lane: 8, group: 5, process: 1, thread: 2, id: 309, flags: 4}
  ];
  rows.forEach((row, index) => {
    const word = index * 8;
    floats[word] = row.start;
    floats[word + 1] = row.duration;
    words.set([row.lane, row.group, row.process, row.thread, row.id, row.flags], word + 2);
  });
  return words;
}

function makeOutput(
  device: Device,
  graph: GPUCommandGraph,
  id: string,
  length: number,
  data?: readonly number[]
): {buffer: Buffer; view: GraphDataView<'uint32'>} {
  const buffer = data
    ? device.createBuffer({data: Uint32Array.from(data), usage: BUFFER_USAGE})
    : device.createBuffer({byteLength: length * 4, usage: BUFFER_USAGE});
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return {buffer, view: graph.createDataView(handle, {format: 'uint32', length})};
}

function makeFloatOutput(
  device: Device,
  graph: GPUCommandGraph,
  id: string,
  length: number,
  data?: readonly number[]
): {buffer: Buffer; view: GraphDataView<'float32'>} {
  const buffer = data
    ? device.createBuffer({data: Float32Array.from(data), usage: BUFFER_USAGE})
    : device.createBuffer({byteLength: length * 4, usage: BUFFER_USAGE});
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return {buffer, view: graph.createDataView(handle, {format: 'float32', length})};
}

function writeTemporalQuery(
  buffer: Buffer,
  window: readonly [number, number, number],
  enabledGroups: number,
  level?: number,
  laneWindow: readonly [number, number] = [0, 0xffffffff]
): void {
  const wordLength = level === undefined ? 6 : 7;
  const data = new ArrayBuffer(wordLength * Uint32Array.BYTES_PER_ELEMENT);
  new Float32Array(data).set(window);
  const words = new Uint32Array(data);
  words[3] = enabledGroups;
  words[4] = laneWindow[0];
  words[5] = laneWindow[1];
  if (level !== undefined) {
    words[6] = level;
  }
  buffer.write(data);
}

async function readUint32(buffer: Buffer): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
}

async function readFloat32(buffer: Buffer): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
}

function roundValues(values: number[]): number[] {
  return values.map(value => Number(value.toFixed(4)));
}

function getMipmapBoundaryOracle(
  startTimes: Float32Array,
  segmentOffsets: Uint32Array,
  firstBoundaryTime: number,
  timePerPixel: number,
  pixelCount: number
): number[] {
  const maximumPixelCount = 64;
  const result = new Array((segmentOffsets.length - 1) * (maximumPixelCount + 1)).fill(0xffffffff);
  for (let segmentIndex = 0; segmentIndex + 1 < segmentOffsets.length; segmentIndex++) {
    const segmentStart = segmentOffsets[segmentIndex];
    const segmentEnd = segmentOffsets[segmentIndex + 1];
    for (let boundaryIndex = 0; boundaryIndex <= pixelCount; boundaryIndex++) {
      const target = firstBoundaryTime + boundaryIndex * timePerPixel;
      let low = segmentStart;
      let high = segmentEnd;
      while (low < high) {
        const middle = low + Math.floor((high - low) / 2);
        if (startTimes[middle] < target) low = middle + 1;
        else high = middle;
      }
      result[segmentIndex * (maximumPixelCount + 1) + boundaryIndex] = low;
    }
  }
  return result;
}
