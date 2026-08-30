// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {
  DrawCommandBuffer,
  GPUCommandGraph,
  GPUVirtualGeometrySelection,
  type CompiledGPUCommandGraph,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import type {GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('GPUVirtualGeometrySelection publishes a stable bounded indirect frontier', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const fixture = createFixture(device, 2);
  encode(device, fixture.compiled);
  testCase.deepEqual(
    await readUint32(fixture.output, 2),
    [101, 200],
    'stable node order retains the coarse second root before refined first-root children'
  );
  testCase.equal(
    await readDrawCount(fixture.drawCommands),
    2,
    'indirect count is capacity-clamped'
  );
  testCase.deepEqual(
    await readUint32(fixture.totalCount, 1),
    [3],
    'full frontier count is explicit'
  );
  testCase.deepEqual(await readUint32(fixture.overflow, 1), [1], 'truncation sets overflow');

  fixture.maximumScreenSpaceError.write(Float32Array.of(200));
  encode(device, fixture.compiled);
  testCase.deepEqual(
    await readUint32(fixture.output, 2),
    [100, 101],
    'a larger error tolerance selects both coarse roots'
  );
  testCase.equal(
    await readDrawCount(fixture.drawCommands),
    2,
    'the indirect slot resets each encode'
  );
  testCase.deepEqual(await readUint32(fixture.totalCount, 1), [2]);
  testCase.deepEqual(
    await readUint32(fixture.overflow, 1),
    [0],
    'overflow clears when capacity fits'
  );

  fixture.cameraPosition.write(Float32Array.of(8, 0, 30));
  fixture.maximumScreenSpaceError.write(Float32Array.of(100_000));
  encode(device, fixture.compiled);
  testCase.deepEqual(
    await readUint32(fixture.output, 2),
    [100, 300],
    'camera-inside selection refines conservatively despite a large threshold'
  );
  testCase.deepEqual(await readUint32(fixture.totalCount, 1), [3]);

  testCase.ok(
    fixture.compiled.stats.nodeOrder.includes('virtual-geometry-level-0') &&
      fixture.compiled.stats.nodeOrder.includes('virtual-geometry-level-1'),
    'the compiled graph exposes one ordered pass per breadth level'
  );
  testCase.ok(
    fixture.compiled.stats.nodeOrder.some(id =>
      id.startsWith('virtual-geometry-visibility-compact')
    ),
    'frontier publication reuses stable visibility compaction'
  );

  testCase.equal(
    await destroyFixture(fixture),
    2,
    'idempotent selector destruction leaves borrowed indirect-count storage alive'
  );
  testCase.end();
});

test('GPUVirtualGeometrySelection culls roots and deduplicates convergent activation', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const fixture = createFixture(device, 6);
  fixture.frustumPlanes.write(makeBoxFrustum(0, 100));
  encode(device, fixture.compiled);
  testCase.deepEqual(
    await readSelectedIds(fixture),
    [200, 201],
    'a rejected root activates no children while the visible root refines'
  );

  fixture.frustumPlanes.write(makeBoxFrustum(100, 100));
  fixture.maximumScreenSpaceError.write(Float32Array.of(0));
  fixture.children.write(Uint32Array.from([2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0]));
  encode(device, fixture.compiled);
  testCase.deepEqual(
    await readSelectedIds(fixture),
    [200, 201],
    'node-aligned activity prevents duplicate IDs across multiple roots'
  );
  testCase.deepEqual(await readUint32(fixture.overflow, 1), [0]);

  fixture.maximumScreenSpaceError.write(Float32Array.of(50));
  encode(device, fixture.compiled);
  testCase.deepEqual(
    await readSelectedIds(fixture),
    [101],
    'a coarse shared parent suppresses children requested by another refining parent'
  );

  testCase.equal(
    await destroyFixture(fixture),
    1,
    'destroying selector-owned storage does not destroy the draw command'
  );
  testCase.end();
});

type Fixture = {
  compiled: CompiledGPUCommandGraph<void>;
  selection: GPUVirtualGeometrySelection;
  drawCommands: DrawCommandBuffer;
  children: Buffer;
  frustumPlanes: Buffer;
  cameraPosition: Buffer;
  pixelProjectionScale: Buffer;
  maximumScreenSpaceError: Buffer;
  output: Buffer;
  totalCount: Buffer;
  overflow: Buffer;
  buffers: Buffer[];
};

function createFixture(device: Device, outputCapacity: number): Fixture {
  const sphereBounds = createInputBuffer(
    device,
    Float32Array.from([
      -6, 0, 10, 2, 8, 0, 30, 2, -8, 0, 10, 1, -4, 0, 10, 1, 6, 0, 30, 1, 10, 0, 30, 1
    ])
  );
  const geometricErrors = createInputBuffer(device, Float32Array.from([12, 4, 0, 0, 0, 0]));
  const children = createInputBuffer(
    device,
    Uint32Array.from([2, 2, 4, 2, 0, 0, 0, 0, 0, 0, 0, 0])
  );
  const clusterIds = createInputBuffer(device, Uint32Array.from([100, 101, 200, 201, 300, 301]));
  const frustumPlanes = createInputBuffer(device, makeBoxFrustum(100, 100));
  const cameraPosition = createInputBuffer(device, Float32Array.of(0, 0, 0));
  const pixelProjectionScale = createInputBuffer(device, Float32Array.of(100));
  const maximumScreenSpaceError = createInputBuffer(device, Float32Array.of(50));
  const output = createOutputBuffer(device, outputCapacity);
  const totalCount = createOutputBuffer(device, 1);
  const overflow = createOutputBuffer(device, 1);
  const drawCommands = new DrawCommandBuffer(device, {
    id: 'virtual-geometry-draw',
    type: 'draw',
    commands: [{vertexCount: 36, instanceCount: 99}]
  });

  const graph = new GPUCommandGraph(device, {id: 'virtual-geometry-test'});
  const selection = new GPUVirtualGeometrySelection({
    id: 'virtual-geometry',
    hierarchy: {
      sphereBounds: importView(graph, 'sphere-bounds', sphereBounds, 'float32x4', 6),
      geometricErrors: importView(graph, 'geometric-errors', geometricErrors, 'float32', 6),
      children: importView(graph, 'children', children, 'uint32x2', 6),
      clusterIds: importView(graph, 'cluster-ids', clusterIds, 'uint32', 6),
      levelOffsets: [0, 2, 6]
    },
    view: {
      frustumPlanes: importView(graph, 'frustum-planes', frustumPlanes, 'float32x4', 6),
      cameraPosition: importView(graph, 'camera-position', cameraPosition, 'float32x3', 1),
      pixelProjectionScale: importView(
        graph,
        'pixel-projection-scale',
        pixelProjectionScale,
        'float32',
        1
      ),
      maximumScreenSpaceError: importView(
        graph,
        'maximum-screen-space-error',
        maximumScreenSpaceError,
        'float32',
        1
      )
    },
    output: importView(graph, 'output', output, 'uint32', outputCapacity),
    count: graph.importGPUData('draw-count', drawCommands.getInstanceCountData(0)),
    totalCount: importView(graph, 'total-count', totalCount, 'uint32', 1),
    overflow: importView(graph, 'overflow', overflow, 'uint32', 1)
  });
  selection.addToGraph(graph);
  return {
    compiled: graph.compile(),
    selection,
    drawCommands,
    children,
    frustumPlanes,
    cameraPosition,
    pixelProjectionScale,
    maximumScreenSpaceError,
    output,
    totalCount,
    overflow,
    buffers: [
      sphereBounds,
      geometricErrors,
      children,
      clusterIds,
      frustumPlanes,
      cameraPosition,
      pixelProjectionScale,
      maximumScreenSpaceError,
      output,
      totalCount,
      overflow
    ]
  };
}

function makeBoxFrustum(maximumX: number, extent: number): Float32Array {
  return Float32Array.from([
    1,
    0,
    0,
    extent,
    -1,
    0,
    0,
    maximumX,
    0,
    1,
    0,
    extent,
    0,
    -1,
    0,
    extent,
    0,
    0,
    1,
    extent,
    0,
    0,
    -1,
    extent
  ]);
}

function createInputBuffer(device: Device, data: Float32Array | Uint32Array): Buffer {
  return device.createBuffer({data, usage: Buffer.STORAGE | Buffer.COPY_DST});
}

function createOutputBuffer(device: Device, length: number): Buffer {
  return device.createBuffer({
    byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function importView<T extends GPUVectorFormat>(
  graph: GPUCommandGraph,
  id: string,
  buffer: Buffer,
  format: T,
  length: number
): GraphDataView<T> {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length});
}

function encode(device: Device, compiled: CompiledGPUCommandGraph<void>): void {
  const commandEncoder = device.createCommandEncoder({id: 'virtual-geometry-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
}

async function readSelectedIds(fixture: Fixture): Promise<number[]> {
  const count = await readDrawCount(fixture.drawCommands);
  return readUint32(fixture.output, count);
}

async function readDrawCount(drawCommands: DrawCommandBuffer): Promise<number> {
  const bytes = await drawCommands.buffer.readAsync(
    drawCommands.getInstanceCountByteOffset(0),
    Uint32Array.BYTES_PER_ELEMENT
  );
  return new Uint32Array(bytes.buffer, bytes.byteOffset, 1)[0];
}

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync(0, Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT);
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}

async function destroyFixture(fixture: Fixture): Promise<number> {
  fixture.compiled.destroy();
  fixture.selection.destroy();
  fixture.selection.destroy();
  const borrowedCount = await readDrawCount(fixture.drawCommands);
  fixture.drawCommands.destroy();
  for (const buffer of fixture.buffers) buffer.destroy();
  return borrowedCount;
}
