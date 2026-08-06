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
} from '@luma.gl/experimental';
import {GPUTraceScene} from '@luma.gl/experimental/lutrace';
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

async function readUint32(buffer: Buffer): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
}
