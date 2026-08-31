import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  CompiledGPUCommandGraph,
  DrawCommandBuffer,
  GPUCommandGraph,
  GPUScene,
  GPUSceneDrawGeneration,
  GPU_SCENE_INVALID_REFERENCE,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

const STORAGE_USAGE = Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC;
const BOUNDS = {minimum: [0, 0, 0], maximum: [1, 1, 1]} as const;

it('GPUSceneDrawGeneration publishes deterministic bounded commands and re-encodes visibility', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const scene = new GPUScene(device, {
    records: [
      {id: 10, bounds: BOUNDS, commandSlot: 2},
      {id: 11, bounds: BOUNDS, commandSlot: 0},
      {id: 12, bounds: BOUNDS, commandSlot: 2},
      {id: 13, bounds: BOUNDS, commandSlot: 5},
      {id: 14, bounds: BOUNDS, commandSlot: GPU_SCENE_INVALID_REFERENCE},
      {id: 15, bounds: BOUNDS, commandSlot: 1}
    ]
  });
  const visibilityBuffer = device.createBuffer({
    data: new Uint32Array([1, 1, 1, 1, 1, 0]),
    usage: STORAGE_USAGE
  });
  const commands = new DrawCommandBuffer(device, {
    type: 'draw',
    commands: [3, 4, 5, 6].map((vertexCount, index) => ({
      vertexCount,
      instanceCount: 99,
      firstVertex: (index + 1) * 10,
      firstInstance: 99
    }))
  });
  const graph = new GPUCommandGraph(device, {id: 'scene-draw-generation-test'});
  const sceneView = scene.importToGraph(graph);
  const commandView = commands.importToGraph(graph);
  const visibility = importUint32(graph, visibilityBuffer, 'visibility', 6);
  const required = makeScalar(device, graph, 'required');
  const published = makeScalar(device, graph, 'published');
  const overflow = makeScalar(device, graph, 'overflow');
  const generation = new GPUSceneDrawGeneration({
    scene: sceneView,
    visibility,
    commands: commandView,
    requiredCount: required.view,
    publishedCount: published.view,
    overflow: overflow.view
  });
  generation.addToGraph(graph);
  expect(generation.stats).toEqual({
    recordCount: 6,
    recordCapacity: 6,
    commandCapacity: 4,
    commandRecordByteLength: 16,
    transientByteLength: 40,
    outputByteLength: 76
  });

  const compiled = graph.compile();
  await encodeAndSubmit(device, compiled);
  expect(
    await readDrawWords(commands),
    'the lowest scene row owns collisions and static geometry fields remain unchanged'
  ).toEqual([3, 1, 10, 1, 4, 0, 20, 0, 5, 1, 30, 0, 6, 0, 40, 0]);
  expect(
    await readDiagnostics(required.buffer, published.buffer, overflow.buffer),
    'out-of-range and colliding requests report required, published, and overflow state'
  ).toEqual([4, 2, 1]);

  visibilityBuffer.write(new Uint32Array([0, 0, 1, 0, 1, 1]));
  await encodeAndSubmit(device, compiled);
  expect(
    await readDrawWords(commands),
    'parameter-only visibility changes clear and republish the same compiled graph'
  ).toEqual([3, 0, 10, 0, 4, 1, 20, 5, 5, 1, 30, 2, 6, 0, 40, 0]);
  expect(await readDiagnostics(required.buffer, published.buffer, overflow.buffer)).toEqual([
    2, 2, 0
  ]);

  compiled.destroy();
  scene.destroy();
  visibilityBuffer.destroy();
  commands.destroy();
  required.buffer.destroy();
  published.buffer.destroy();
  overflow.buffer.destroy();
});

it('GPUSceneDrawGeneration supports indexed commands, inactive rows, and validation', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const scene = new GPUScene(device, {
    records: [{id: 20, bounds: BOUNDS, commandSlot: 0}]
  });
  const commands = new DrawCommandBuffer(device, {
    type: 'draw-indexed',
    commands: [{indexCount: 36, instanceCount: 7, firstIndex: 2, baseVertex: -1, firstInstance: 9}]
  });
  const graph = new GPUCommandGraph(device, {id: 'indexed-scene-draw-generation-test'});
  const sceneView = scene.importToGraph(graph);
  const commandView = commands.importToGraph(graph);
  const required = makeScalar(device, graph, 'indexed-required');
  const published = makeScalar(device, graph, 'indexed-published');
  const overflow = makeScalar(device, graph, 'indexed-overflow');
  const generation = new GPUSceneDrawGeneration({
    scene: sceneView,
    commands: commandView,
    requiredCount: required.view,
    publishedCount: published.view,
    overflow: overflow.view
  });
  generation.addToGraph(graph);
  const compiled = graph.compile();

  await encodeAndSubmit(device, compiled);
  expect(
    await readDrawWords(commands),
    'indexed geometry fields and signed baseVertex bits survive publication'
  ).toEqual([36, 1, 2, 0xffffffff, 0]);
  expect(await readDiagnostics(required.buffer, published.buffer, overflow.buffer)).toEqual([
    1, 1, 0
  ]);

  scene.mutate({remove: [20]});
  await encodeAndSubmit(device, compiled);
  expect(
    await readDrawWords(commands),
    'inactive rows clear their prior command without CPU draw selection'
  ).toEqual([36, 0, 2, 0xffffffff, 0]);
  expect(await readDiagnostics(required.buffer, published.buffer, overflow.buffer)).toEqual([
    0, 0, 0
  ]);

  expect(
    () =>
      new GPUSceneDrawGeneration({
        scene: sceneView,
        commands: commandView,
        requiredCount: commandView.words,
        publishedCount: published.view,
        overflow: overflow.view
      }),
    'diagnostics cannot alias writable indirect commands'
  ).toThrow(/outputs cannot overlap/);

  compiled.destroy();
  scene.destroy();
  commands.destroy();
  required.buffer.destroy();
  published.buffer.destroy();
  overflow.buffer.destroy();
});

it('GPUSceneDrawGeneration discovers inserted records across the full scene capacity', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const scene = new GPUScene(device, {capacity: 2});
  const commands = new DrawCommandBuffer(device, {
    type: 'draw',
    commands: [3, 4].map(vertexCount => ({
      vertexCount,
      instanceCount: 0,
      firstVertex: 0,
      firstInstance: 0
    }))
  });
  const graph = new GPUCommandGraph(device, {id: 'growing-scene-draw-generation-test'});
  const required = makeScalar(device, graph, 'growing-required');
  const published = makeScalar(device, graph, 'growing-published');
  const overflow = makeScalar(device, graph, 'growing-overflow');
  const generation = new GPUSceneDrawGeneration({
    scene: scene.importToGraph(graph),
    commands: commands.importToGraph(graph),
    requiredCount: required.view,
    publishedCount: published.view,
    overflow: overflow.view
  });
  generation.addToGraph(graph);
  expect(generation.stats.recordCount, 'the imported active prefix starts empty').toBe(0);
  expect(generation.stats.recordCapacity, 'dispatch spans the reserved record capacity').toBe(2);

  const compiled = graph.compile();
  await encodeAndSubmit(device, compiled);
  expect(await readDiagnostics(required.buffer, published.buffer, overflow.buffer)).toEqual([
    0, 0, 0
  ]);

  scene.mutate({
    insert: [
      {id: 30, bounds: BOUNDS, commandSlot: 0},
      {id: 31, bounds: BOUNDS, commandSlot: 1}
    ]
  });
  await encodeAndSubmit(device, compiled);
  expect(await readDrawWords(commands)).toEqual([3, 1, 0, 0, 4, 1, 0, 1]);
  expect(await readDiagnostics(required.buffer, published.buffer, overflow.buffer)).toEqual([
    2, 2, 0
  ]);

  compiled.destroy();
  scene.destroy();
  commands.destroy();
  required.buffer.destroy();
  published.buffer.destroy();
  overflow.buffer.destroy();
});

it('GPUSceneDrawGeneration rejects devices without indirect-first-instance', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device || device.features.has('indirect-first-instance')) {
    return;
  }

  const scene = new GPUScene(device, {capacity: 1});
  const commands = new DrawCommandBuffer(device, {
    type: 'draw',
    commands: [{vertexCount: 3, instanceCount: 0, firstVertex: 0, firstInstance: 0}]
  });
  const graph = new GPUCommandGraph(device, {id: 'unsupported-scene-draw-generation-test'});
  const required = makeScalar(device, graph, 'unsupported-required');
  const published = makeScalar(device, graph, 'unsupported-published');
  const overflow = makeScalar(device, graph, 'unsupported-overflow');
  const generation = new GPUSceneDrawGeneration({
    scene: scene.importToGraph(graph),
    commands: commands.importToGraph(graph),
    requiredCount: required.view,
    publishedCount: published.view,
    overflow: overflow.view
  });

  expect(
    () => generation.addToGraph(graph),
    'nonzero first-instance publication requires the optional WebGPU feature'
  ).toThrow(/indirect-first-instance/);

  scene.destroy();
  commands.destroy();
  required.buffer.destroy();
  published.buffer.destroy();
  overflow.buffer.destroy();
});

function makeScalar(
  device: Device,
  graph: GPUCommandGraph,
  id: string
): {buffer: Buffer; view: GraphDataView<'uint32'>} {
  const buffer = device.createBuffer({byteLength: 4, usage: STORAGE_USAGE});
  return {buffer, view: importUint32(graph, buffer, id, 1)};
}

function importUint32(
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

async function encodeAndSubmit(device: Device, compiled: CompiledGPUCommandGraph): Promise<void> {
  const commandEncoder = device.createCommandEncoder();
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
}

async function readDrawWords(commands: DrawCommandBuffer): Promise<number[]> {
  const bytes = await commands.buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
}

async function readDiagnostics(
  required: Buffer,
  published: Buffer,
  overflow: Buffer
): Promise<number[]> {
  return Promise.all(
    [required, published, overflow].map(async buffer => {
      const bytes = await buffer.readAsync();
      return new Uint32Array(bytes.buffer, bytes.byteOffset, 1)[0]!;
    })
  );
}
