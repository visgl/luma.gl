// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, type Device} from '@luma.gl/core';
import {
  DrawCommandBuffer,
  GPUCommandGraph,
  GPUScene,
  GPUSceneDrawGeneration,
  GPUSceneResourceGroups,
  type CompiledGPUCommandGraph,
  type GraphDataView
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

const STORAGE_USAGE = Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const BOUNDS = {minimum: [0, 0, 0], maximum: [1, 1, 1]} as const;

test('GPUSceneResourceGroups preserves binding order and classifies regrouped commands', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const scene = new GPUScene(device, {
    records: [
      {id: 10, bounds: BOUNDS, groupId: 2, geometryId: 20, commandSlot: 2},
      {id: 11, bounds: BOUNDS, groupId: 1, geometryId: 10, commandSlot: 0},
      {id: 12, bounds: BOUNDS, groupId: 2, geometryId: 20, commandSlot: 3},
      {id: 13, bounds: BOUNDS, groupId: 3, geometryId: 30, commandSlot: 4},
      {id: 14, bounds: BOUNDS, groupId: 9, geometryId: 90, commandSlot: 1}
    ]
  });
  const visibilityBuffer = device.createBuffer({
    data: Uint32Array.from([1, 1, 1, 1, 1]),
    usage: STORAGE_USAGE
  });
  const commands = new DrawCommandBuffer(device, {
    type: 'draw-indexed',
    commands: Array.from({length: 5}, (_, index) => ({
      indexCount: 12 + index,
      instanceCount: 0,
      firstIndex: index * 3
    }))
  });
  const graph = new GPUCommandGraph(device, {id: 'scene-resource-groups-test'});
  const sceneView = scene.importToGraph(graph);
  const commandView = commands.importToGraph(graph);
  const visibility = importView(graph, visibilityBuffer, 'visibility', 5);
  const required = makeOutput(device, graph, 'required', 1);
  const published = makeOutput(device, graph, 'published', 1);
  const drawOverflow = makeOutput(device, graph, 'draw-overflow', 1);
  new GPUSceneDrawGeneration({
    scene: sceneView,
    visibility,
    commands: commandView,
    requiredCount: required.view,
    publishedCount: published.view,
    overflow: drawOverflow.view
  }).addToGraph(graph);

  const counts = makeOutput(device, graph, 'group-counts', 3);
  const overflows = makeOutput(device, graph, 'group-overflows', 3);
  const overflow = makeOutput(device, graph, 'group-overflow', 1);
  const groups = new GPUSceneResourceGroups({
    scene: sceneView,
    commands: commandView,
    groups: [
      {id: 2, firstCommand: 2, commandCount: 2, geometryId: 20},
      {id: 1, firstCommand: 0, commandCount: 2, geometryId: 10},
      {id: 3, firstCommand: 4, commandCount: 0, geometryId: 30}
    ],
    counts: counts.view,
    overflows: overflows.view,
    overflow: overflow.view
  });
  t.deepEqual(groups.stats, {
    groupCount: 3,
    commandCapacity: 5,
    maximumGroupCommandCount: 2,
    outputByteLength: 28
  });
  groups.addToGraph(graph);
  const compiled = graph.compile();

  encode(device, compiled);
  t.deepEqual(
    await readUint32(counts.buffer, 3),
    [2, 1, 0],
    'renderer-authored group order is stable and empty groups remain present'
  );
  t.deepEqual(
    await readUint32(overflows.buffer, 3),
    [0, 0, 1],
    'an active command targeting a zero-capacity group is reported on that group'
  );
  t.deepEqual(await readUint32(overflow.buffer, 1), [1], 'unknown groups remain observable');

  scene.mutate({
    remove: [13],
    update: [
      {id: 10, groupId: 1, geometryId: 10, commandSlot: 1},
      {id: 12, geometryId: 99},
      {id: 14, groupId: 2, geometryId: 20, commandSlot: 2}
    ]
  });
  encode(device, compiled);
  t.deepEqual(
    await readUint32(counts.buffer, 3),
    [1, 2, 0],
    'changed group ownership reclassifies commands without rebuilding the compiled graph'
  );
  t.deepEqual(
    await readUint32(overflows.buffer, 3),
    [1, 0, 0],
    'geometry/resource mismatches are attributed to the owning group'
  );

  scene.mutate({update: [{id: 12, geometryId: 20}]});
  encode(device, compiled);
  t.deepEqual(await readUint32(counts.buffer, 3), [2, 2, 0]);
  t.deepEqual(await readUint32(overflows.buffer, 3), [0, 0, 0]);
  t.deepEqual(await readUint32(overflow.buffer, 1), [0], 'overflow clears after regrouping');

  visibilityBuffer.write(new Uint32Array(5));
  encode(device, compiled);
  t.deepEqual(await readUint32(counts.buffer, 3), [0, 0, 0], 'all groups clear when draws vanish');
  t.deepEqual(await readUint32(overflow.buffer, 1), [0]);

  compiled.destroy();
  scene.destroy();
  commands.destroy();
  visibilityBuffer.destroy();
  for (const output of [required, published, drawOverflow, counts, overflows, overflow]) {
    output.buffer.destroy();
  }
  t.end();
});

test('GPUSceneResourceGroups rejects ambiguous windows and aliased diagnostics', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const scene = new GPUScene(device, {
    records: [{id: 1, bounds: BOUNDS, groupId: 1, commandSlot: 0}]
  });
  const commands = new DrawCommandBuffer(device, {
    type: 'draw',
    commands: [{vertexCount: 3}, {vertexCount: 3}]
  });
  const graph = new GPUCommandGraph(device);
  const sceneView = scene.importToGraph(graph);
  const commandView = commands.importToGraph(graph);
  const counts = makeOutput(device, graph, 'validation-counts', 2);
  const overflows = makeOutput(device, graph, 'validation-overflows', 2);
  const overflow = makeOutput(device, graph, 'validation-overflow', 1);
  const shared = {
    scene: sceneView,
    commands: commandView,
    counts: counts.view,
    overflows: overflows.view,
    overflow: overflow.view
  };

  t.throws(
    () =>
      new GPUSceneResourceGroups({
        ...shared,
        groups: [
          {id: 1, firstCommand: 0, commandCount: 1},
          {id: 1, firstCommand: 1, commandCount: 1}
        ]
      }),
    /unique IDs/,
    'one resource identity cannot have ambiguous binding groups'
  );
  t.throws(
    () =>
      new GPUSceneResourceGroups({
        ...shared,
        groups: [
          {id: 1, firstCommand: 0, commandCount: 2},
          {id: 2, firstCommand: 1, commandCount: 1}
        ]
      }),
    /must not overlap/,
    'binding-group command windows must remain disjoint'
  );
  t.throws(
    () =>
      new GPUSceneResourceGroups({
        ...shared,
        groups: [{id: 1, firstCommand: 1, commandCount: 2}]
      }),
    /bounded slot windows/,
    'renderer-owned windows cannot exceed command capacity'
  );
  t.throws(
    () =>
      new GPUSceneResourceGroups({
        ...shared,
        groups: [{id: 1, firstCommand: 0, commandCount: 1}],
        overflow: counts.view
      }),
    /cannot overlap one another/,
    'global and per-group diagnostics cannot alias'
  );

  scene.destroy();
  commands.destroy();
  counts.buffer.destroy();
  overflows.buffer.destroy();
  overflow.buffer.destroy();
  t.end();
});

test('GPUSceneResourceGroups classifies records inserted after graph compilation', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const scene = new GPUScene(device, {capacity: 2});
  const commands = new DrawCommandBuffer(device, {
    type: 'draw',
    commands: [{vertexCount: 3}, {vertexCount: 6}]
  });
  const graph = new GPUCommandGraph(device, {id: 'growing-scene-resource-groups-test'});
  const sceneView = scene.importToGraph(graph);
  const commandView = commands.importToGraph(graph);
  const required = makeOutput(device, graph, 'growing-required', 1);
  const published = makeOutput(device, graph, 'growing-published', 1);
  const drawOverflow = makeOutput(device, graph, 'growing-draw-overflow', 1);
  new GPUSceneDrawGeneration({
    scene: sceneView,
    commands: commandView,
    requiredCount: required.view,
    publishedCount: published.view,
    overflow: drawOverflow.view
  }).addToGraph(graph);

  const counts = makeOutput(device, graph, 'growing-group-counts', 1);
  const overflows = makeOutput(device, graph, 'growing-group-overflows', 1);
  const overflow = makeOutput(device, graph, 'growing-group-overflow', 1);
  new GPUSceneResourceGroups({
    scene: sceneView,
    commands: commandView,
    groups: [{id: 7, firstCommand: 0, commandCount: 2, geometryId: 11}],
    counts: counts.view,
    overflows: overflows.view,
    overflow: overflow.view
  }).addToGraph(graph);

  const compiled = graph.compile();
  encode(device, compiled);
  t.deepEqual(await readUint32(counts.buffer, 1), [0]);

  scene.mutate({
    insert: [
      {id: 50, bounds: BOUNDS, groupId: 7, geometryId: 11, commandSlot: 0},
      {id: 51, bounds: BOUNDS, groupId: 7, geometryId: 11, commandSlot: 1}
    ]
  });
  encode(device, compiled);
  t.deepEqual(await readUint32(counts.buffer, 1), [2]);
  t.deepEqual(await readUint32(overflows.buffer, 1), [0]);
  t.deepEqual(await readUint32(overflow.buffer, 1), [0]);

  compiled.destroy();
  scene.destroy();
  commands.destroy();
  for (const output of [required, published, drawOverflow, counts, overflows, overflow]) {
    output.buffer.destroy();
  }
  t.end();
});

function makeOutput(
  device: Device,
  graph: GPUCommandGraph,
  id: string,
  length: number
): {buffer: Buffer; view: GraphDataView<'uint32'>} {
  const buffer = device.createBuffer({
    byteLength: length * UINT32_BYTE_LENGTH,
    usage: STORAGE_USAGE
  });
  return {buffer, view: importView(graph, buffer, id, length)};
}

function importView(
  graph: GPUCommandGraph,
  buffer: Buffer,
  id: string,
  length: number
): GraphDataView<'uint32'> {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format: 'uint32', length});
}

function encode(device: Device, compiled: CompiledGPUCommandGraph<void>): void {
  const commandEncoder = device.createCommandEncoder();
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
}

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}
