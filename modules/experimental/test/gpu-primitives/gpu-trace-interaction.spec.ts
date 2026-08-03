// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {
  DrawCommandBuffer,
  GPUCommandGraph,
  GPUTraceInteraction,
  GPUTraceScene,
  GPU_SCENE_INVALID_REFERENCE,
  type CompiledGPUCommandGraph,
  type GPUTraceInteractionProps,
  type GraphDataView
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

const STORAGE_USAGE = Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC;

type Uint32Fixture = {buffer: Buffer; view: GraphDataView<'uint32'>};
type Float32Fixture = {buffer: Buffer; view: GraphDataView<'float32'>};
type TraceInteractionFixture = {
  device: Device;
  graph: GPUCommandGraph;
  trace: GPUTraceScene;
  commands: DrawCommandBuffer;
  window: Float32Fixture;
  policy: Uint32Fixture;
  processStates: Uint32Fixture;
  threadStates: Uint32Fixture;
  selectedSpans: Uint32Fixture;
  selectedCount: Uint32Fixture;
  focusDepth: Uint32Fixture;
  threadHeights: Uint32Fixture;
  threadOffsets: Uint32Fixture;
  reachedSpans: Uint32Fixture;
  visibleMask: Uint32Fixture;
  visibleSpans: Uint32Fixture;
  visibleCount: Uint32Fixture;
  projectedAncestors: Uint32Fixture;
  requiredCount: Uint32Fixture;
  publishedCount: Uint32Fixture;
  drawOverflow: Uint32Fixture;
  props: GPUTraceInteractionProps;
};

test('GPUTraceInteraction reuses one graph for time, hierarchy, dependency, and scene draw policies', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const fixture = makeFixture(device);
  const interaction = new GPUTraceInteraction(fixture.props);
  interaction.addToGraph(fixture.graph);
  const compiled = fixture.graph.compile();

  t.deepEqual(interaction.stats, {
    spanCount: 5,
    sceneCapacity: 5,
    processCount: 2,
    threadCount: 4,
    threadsPerProcess: 2,
    lanesPerThread: 2,
    maxFocusDepth: 2
  });

  encode(device, compiled);
  await assertVisible(t, fixture, [0, 1, 2, 3, 4], 'expanded hierarchy exposes every trace span');
  t.deepEqual(await readUint32(fixture.threadHeights.buffer), [2, 2, 2, 2]);
  t.deepEqual(await readUint32(fixture.threadOffsets.buffer), [0, 2, 4, 6]);
  t.deepEqual(await readUint32(fixture.projectedAncestors.buffer), [0, 1, 2, 3, 4]);

  fixture.window.buffer.write(Float32Array.from([4.1, 12, 0]));
  encode(device, compiled);
  await assertVisible(t, fixture, [0, 2, 3], 'changing the time window needs no graph rebuild');

  fixture.processStates.buffer.write(Uint32Array.from([0, 1]));
  encode(device, compiled);
  await assertVisible(t, fixture, [0, 3], 'a collapsed process retains one representative lane');
  t.deepEqual(await readUint32(fixture.threadHeights.buffer), [1, 0, 2, 2]);
  t.deepEqual(await readUint32(fixture.threadOffsets.buffer), [0, 1, 1, 3]);
  t.deepEqual(
    await readUint32(fixture.projectedAncestors.buffer),
    [0, 0, 0, 3, 3],
    'hidden descendants retain their nearest visible canonical ancestor'
  );

  fixture.processStates.buffer.write(Uint32Array.from([1, 1]));
  fixture.window.buffer.write(Float32Array.from([0, 30, 0]));
  fixture.selectedSpans.buffer.write(Uint32Array.from([1]));
  fixture.selectedCount.buffer.write(Uint32Array.from([1]));
  fixture.focusDepth.buffer.write(Uint32Array.from([1]));
  fixture.policy.buffer.write(Uint32Array.from([0, 0, 1]));
  encode(device, compiled);
  await assertVisible(t, fixture, [0, 1, 3], 'bidirectional one-hop focus preserves stable rows');
  t.deepEqual(await readUint32(fixture.reachedSpans.buffer), [1, 1, 0, 1, 0]);
  t.deepEqual(await readUint32(fixture.projectedAncestors.buffer), [0, 1, 0, 3, 3]);

  fixture.focusDepth.buffer.write(Uint32Array.from([2]));
  encode(device, compiled);
  await assertVisible(t, fixture, [0, 1, 2, 3, 4], 'dynamic focus depth expands the same graph');

  fixture.window.buffer.write(Float32Array.from([0, 30, 3]));
  fixture.policy.buffer.write(Uint32Array.from([1, 0, 0]));
  encode(device, compiled);
  await assertVisible(t, fixture, [0, 2, 3], 'duration and required classification compose');

  fixture.policy.buffer.write(Uint32Array.from([0, 1, 0]));
  fixture.window.buffer.write(Float32Array.from([0, 30, 0]));
  encode(device, compiled);
  await assertVisible(t, fixture, [1, 4], 'excluded classification bits remove matching spans');

  fixture.threadStates.buffer.write(Uint32Array.from([0, 1, 1, 1]));
  fixture.policy.buffer.write(Uint32Array.from([0, 0, 0]));
  encode(device, compiled);
  await assertVisible(t, fixture, [0, 2, 3, 4], 'a collapsed thread retains its first lane');

  fixture.window.buffer.write(Float32Array.from([10, 0, 0]));
  encode(device, compiled);
  await assertVisible(t, fixture, [], 'an inverted time window clears every draw and count');

  t.ok(
    compiled.stats.nodeOrder.some(identifier => identifier === 'trace-interaction-policy'),
    'the compiled graph contains one explicit trace policy pass'
  );
  t.ok(
    compiled.stats.nodeOrder.some(identifier => identifier === 'trace-interaction-draws-publish'),
    'generic scene draw generation remains downstream of the trace policy'
  );

  compiled.destroy();
  destroyFixture(fixture);
  t.end();
});

test('GPUTraceInteraction validates topology, policy lengths, and nonaliasing output contracts', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const fixture = makeFixture(device);

  t.throws(
    () => new GPUTraceInteraction({...fixture.props, threadsPerProcess: 3}),
    /topology must be consistent/,
    'process/thread cardinality cannot silently misaddress ownership'
  );
  t.throws(
    () => new GPUTraceInteraction({...fixture.props, lanesPerThread: 0}),
    /topology must be consistent/,
    'collapsed-lane mapping requires a positive lane width'
  );
  t.throws(
    () => new GPUTraceInteraction({...fixture.props, policy: fixture.selectedCount.view}),
    /require three scalar values/,
    'classification and focus policy requires its complete fixed layout'
  );
  t.throws(
    () => new GPUTraceInteraction({...fixture.props, reachedSpans: fixture.threadHeights.view}),
    /source rows and scene capacity/,
    'dependency reachability must align with canonical source rows'
  );
  t.throws(
    () => new GPUTraceInteraction({...fixture.props, visibleSpans: fixture.visibleMask.view}),
    /outputs cannot overlap one another/,
    'stable compacted IDs cannot overwrite their source visibility mask'
  );
  t.throws(
    () =>
      new GPUTraceInteraction({...fixture.props, projectedAncestors: fixture.props.trace.parents}),
    /outputs cannot overlap source inputs/,
    'ancestry outputs cannot overwrite canonical parent storage'
  );
  t.throws(
    () => new GPUTraceInteraction({...fixture.props, maxFocusDepth: -1}),
    /nonnegative safe integer/,
    'compiled traversal depth is explicitly bounded'
  );

  destroyFixture(fixture);
  t.end();
});

function makeFixture(device: Device): TraceInteractionFixture {
  const words = new Uint32Array(5 * 8);
  const floats = new Float32Array(words.buffer);
  const rows = [
    {start: 0, duration: 10, lane: 0, group: 1, process: 0, thread: 0, id: 100, flags: 1},
    {start: 2, duration: 2, lane: 1, group: 1, process: 0, thread: 0, id: 101, flags: 2},
    {start: 5, duration: 3, lane: 2, group: 1, process: 0, thread: 1, id: 102, flags: 1},
    {start: 8, duration: 4, lane: 4, group: 2, process: 1, thread: 2, id: 103, flags: 1},
    {start: 20, duration: 5, lane: 6, group: 2, process: 1, thread: 3, id: 104, flags: 4}
  ];
  for (const [index, row] of rows.entries()) {
    const word = index * 8;
    floats[word] = row.start;
    floats[word + 1] = row.duration;
    words.set([row.lane, row.group, row.process, row.thread, row.id, row.flags], word + 2);
  }
  const trace = new GPUTraceScene(device, {
    spans: words,
    parents: Uint32Array.from([GPU_SCENE_INVALID_REFERENCE, 0, 0, 2, 3]),
    links: Uint32Array.from([0, 1, 0, 0, 1, 3, 0, 0, 3, 4, 0, 0, 2, 3, 0, 0]),
    processCount: 2,
    threadCount: 4,
    geometryId: 9
  });
  const commands = new DrawCommandBuffer(device, {
    type: 'draw',
    commands: Array.from({length: 5}, () => ({vertexCount: 6, instanceCount: 0}))
  });
  const graph = new GPUCommandGraph(device, {id: 'trace-interaction-test'});
  const source = trace.importToGraph(graph);
  const window = makeFloat32(device, graph, 'window', [0, 30, 0]);
  const policy = makeUint32(device, graph, 'policy', [0, 0, 0]);
  const processStates = makeUint32(device, graph, 'process-states', [1, 1]);
  const threadStates = makeUint32(device, graph, 'thread-states', [1, 1, 1, 1]);
  const selectedSpans = makeUint32(device, graph, 'selected-spans', [0]);
  const selectedCount = makeUint32(device, graph, 'selected-count', [0]);
  const focusDepth = makeUint32(device, graph, 'focus-depth', [1]);
  const threadHeights = makeUint32(device, graph, 'thread-heights', [0, 0, 0, 0]);
  const threadOffsets = makeUint32(device, graph, 'thread-offsets', [0, 0, 0, 0]);
  const reachedSpans = makeUint32(device, graph, 'reached-spans', [0, 0, 0, 0, 0]);
  const visibleMask = makeUint32(device, graph, 'visible-mask', [0, 0, 0, 0, 0]);
  const visibleSpans = makeUint32(device, graph, 'visible-spans', [0, 0, 0, 0, 0]);
  const visibleCount = makeUint32(device, graph, 'visible-count', [0]);
  const projectedAncestors = makeUint32(device, graph, 'projected-ancestors', [0, 0, 0, 0, 0]);
  const requiredCount = makeUint32(device, graph, 'required-count', [0]);
  const publishedCount = makeUint32(device, graph, 'published-count', [0]);
  const drawOverflow = makeUint32(device, graph, 'draw-overflow', [0]);
  const props: GPUTraceInteractionProps = {
    id: 'trace-interaction',
    trace: source,
    timeWindow: window.view,
    policy: policy.view,
    processStates: processStates.view,
    threadStates: threadStates.view,
    selectedSpans: selectedSpans.view,
    selectedCount: selectedCount.view,
    focusDepth: focusDepth.view,
    threadHeights: threadHeights.view,
    threadOffsets: threadOffsets.view,
    reachedSpans: reachedSpans.view,
    visibleMask: visibleMask.view,
    visibleSpans: visibleSpans.view,
    visibleCount: visibleCount.view,
    projectedAncestors: projectedAncestors.view,
    draw: {
      commands: commands.importToGraph(graph),
      requiredCount: requiredCount.view,
      publishedCount: publishedCount.view,
      overflow: drawOverflow.view
    },
    threadsPerProcess: 2,
    lanesPerThread: 2,
    maxFocusDepth: 2
  };
  return {
    device,
    graph,
    trace,
    commands,
    window,
    policy,
    processStates,
    threadStates,
    selectedSpans,
    selectedCount,
    focusDepth,
    threadHeights,
    threadOffsets,
    reachedSpans,
    visibleMask,
    visibleSpans,
    visibleCount,
    projectedAncestors,
    requiredCount,
    publishedCount,
    drawOverflow,
    props
  };
}

async function assertVisible(
  tapeTest: {deepEqual: (actual: unknown, expected: unknown, message?: string) => void},
  fixture: TraceInteractionFixture,
  expected: number[],
  message: string
): Promise<void> {
  const count = await readUint32(fixture.visibleCount.buffer);
  const compacted = await readUint32(fixture.visibleSpans.buffer);
  const mask = await readUint32(fixture.visibleMask.buffer);
  const commands = await readUint32(fixture.commands.buffer);
  tapeTest.deepEqual(count, [expected.length], `${message}: count`);
  tapeTest.deepEqual(compacted.slice(0, expected.length), expected, `${message}: stable IDs`);
  tapeTest.deepEqual(
    mask,
    Array.from({length: 5}, (_, index) => Number(expected.includes(index))),
    `${message}: source mask`
  );
  tapeTest.deepEqual(
    Array.from({length: 5}, (_, index) => commands[index * 4 + 1]),
    Array.from({length: 5}, (_, index) => Number(expected.includes(index))),
    `${message}: indirect draw activation`
  );
  tapeTest.deepEqual(await readUint32(fixture.publishedCount.buffer), [expected.length]);
  tapeTest.deepEqual(await readUint32(fixture.drawOverflow.buffer), [0]);
}

function makeUint32(
  device: Device,
  graph: GPUCommandGraph,
  identifier: string,
  values: readonly number[]
): Uint32Fixture {
  const buffer = device.createBuffer({data: Uint32Array.from(values), usage: STORAGE_USAGE});
  const handle = graph.importBuffer(
    {id: identifier, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return {buffer, view: graph.createDataView(handle, {format: 'uint32', length: values.length})};
}

function makeFloat32(
  device: Device,
  graph: GPUCommandGraph,
  identifier: string,
  values: readonly number[]
): Float32Fixture {
  const buffer = device.createBuffer({data: Float32Array.from(values), usage: STORAGE_USAGE});
  const handle = graph.importBuffer(
    {id: identifier, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return {buffer, view: graph.createDataView(handle, {format: 'float32', length: values.length})};
}

function encode(device: Device, compiled: CompiledGPUCommandGraph<void>): void {
  const encoder = device.createCommandEncoder();
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
}

async function readUint32(buffer: Buffer): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
}

function destroyFixture(fixture: TraceInteractionFixture): void {
  fixture.trace.destroy();
  fixture.commands.destroy();
  for (const output of [
    fixture.window,
    fixture.policy,
    fixture.processStates,
    fixture.threadStates,
    fixture.selectedSpans,
    fixture.selectedCount,
    fixture.focusDepth,
    fixture.threadHeights,
    fixture.threadOffsets,
    fixture.reachedSpans,
    fixture.visibleMask,
    fixture.visibleSpans,
    fixture.visibleCount,
    fixture.projectedAncestors,
    fixture.requiredCount,
    fixture.publishedCount,
    fixture.drawOverflow
  ]) {
    output.buffer.destroy();
  }
}
