// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUBVH,
  GPUCommandGraph,
  type CompiledGPUCommandGraph,
  type GraphDataView
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {getGPUBVHDispatchLayout} from '../../src/gpu-primitives/gpu-bvh';

test('GPUBVH plans multidimensional leaf-loading dispatches', t => {
  t.deepEqual(
    getGPUBVHDispatchLayout(2 ** 24 - 1, 65535),
    {x: 65535, y: 2, z: 1},
    'the largest standard-binding 2D tree does not exceed the per-dimension limit'
  );
  t.end();
});

test('GPUBVH builds deterministic 2D topology and bounds', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const fixture = createFixture(device, {
    dimension: 2,
    minima: Float32Array.from([0, 0, 3, 1, -2, 4]),
    maxima: Float32Array.from([1, 2, 5, 3, -1, 6]),
    leafCapacity: 4
  });
  encode(device, fixture.compiled);

  t.deepEqual(
    await readUint32(fixture.children, 14),
    [
      1, 2, 3, 4, 5, 6, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff,
      0xffffffff, 0xffffffff
    ]
  );
  t.deepEqual(await readUint32(fixture.leafIds, 4), [0, 1, 2, 0xffffffff]);
  t.deepEqual(await readFloat32(fixture.nodeMinima, 2), [-2, 0], 'root contains every valid leaf');
  t.deepEqual(await readFloat32(fixture.nodeMaxima, 2), [5, 6]);
  t.deepEqual(await readUint32(fixture.count, 1), [3]);
  t.deepEqual(await readUint32(fixture.overflow, 1), [0]);
  t.equal(fixture.bvh.topology, 'complete-binary');
  t.equal(fixture.bvh.updatePolicy, 'refit');
  t.deepEqual(fixture.bvh.stats, {
    dimension: 2,
    leafCapacity: 4,
    internalNodeCount: 3,
    nodeCount: 7,
    levelCount: 3,
    outputByteLength: 192
  });

  destroyFixture(fixture);
  t.end();
});

test('GPUBVH refits 3D bounds while preserving stable IDs and reports capacity overflow', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const fixture = createFixture(device, {
    dimension: 3,
    minima: Float32Array.from([0, 0, 0, 2, 2, 2, -1, 3, 1, 4, -2, 0, 100, 100, 100]),
    maxima: Float32Array.from([1, 1, 1, 3, 4, 5, 0, 5, 2, 6, 0, 7, 101, 101, 101]),
    sourceIds: Uint32Array.from([10, 20, 30, 40, 50]),
    leafCapacity: 4
  });
  encode(device, fixture.compiled);

  t.deepEqual(await readFloat32(fixture.nodeMinima, 3), [-1, -2, 0]);
  t.deepEqual(await readFloat32(fixture.nodeMaxima, 3), [6, 5, 7]);
  t.deepEqual(await readUint32(fixture.leafIds, 4), [10, 20, 30, 40]);
  t.deepEqual(await readUint32(fixture.count, 1), [5], 'count reports required leaf capacity');
  t.deepEqual(await readUint32(fixture.overflow, 1), [1], 'the fifth leaf is not written');

  fixture.minima.write(Float32Array.from([8, 8, 8, 2, 2, 2, -1, 3, 1, 4, -2, 0, 100, 100, 100]));
  fixture.maxima.write(Float32Array.from([9, 9, 9, 3, 4, 5, 0, 5, 2, 6, 0, 7, 101, 101, 101]));
  encode(device, fixture.compiled);
  t.deepEqual(await readFloat32(fixture.nodeMinima, 3), [-1, -2, 0]);
  t.deepEqual(await readFloat32(fixture.nodeMaxima, 3), [9, 9, 9], 'root refits updated leaves');
  t.deepEqual(await readUint32(fixture.leafIds, 4), [10, 20, 30, 40], 'identity is stable');
  t.ok(
    fixture.compiled.stats.nodeOrder.some(id => id === 'test-bvh-refit-depth-0'),
    'the graph exposes explicit bottom-up refit levels'
  );

  destroyFixture(fixture);
  t.end();
});

type Fixture = {
  bvh: GPUBVH;
  compiled: CompiledGPUCommandGraph<void>;
  minima: Buffer;
  maxima: Buffer;
  nodeMinima: Buffer;
  nodeMaxima: Buffer;
  children: Buffer;
  leafIds: Buffer;
  count: Buffer;
  overflow: Buffer;
  buffers: Buffer[];
};

function createFixture(
  device: Device,
  props: {
    dimension: 2 | 3;
    minima: Float32Array;
    maxima: Float32Array;
    sourceIds?: Uint32Array;
    leafCapacity: number;
  }
): Fixture {
  const format = props.dimension === 2 ? 'float32x2' : 'float32x3';
  const sourceLength = props.minima.length / props.dimension;
  const nodeCount = props.leafCapacity * 2 - 1;
  const minima = createInputBuffer(device, props.minima);
  const maxima = createInputBuffer(device, props.maxima);
  const sourceIds = props.sourceIds ? createInputBuffer(device, props.sourceIds) : undefined;
  const nodeMinima = createFloatOutputBuffer(device, nodeCount * props.dimension);
  const nodeMaxima = createFloatOutputBuffer(device, nodeCount * props.dimension);
  const children = createUintOutputBuffer(device, nodeCount * 2);
  const leafIds = createUintOutputBuffer(device, props.leafCapacity);
  const count = createUintOutputBuffer(device, 1);
  const overflow = createUintOutputBuffer(device, 1);
  const graph = new GPUCommandGraph(device, {id: 'bvh-test'});
  const bvh = new GPUBVH({
    id: 'test-bvh',
    minima: importView(graph, 'source-minima', minima, format, sourceLength),
    maxima: importView(graph, 'source-maxima', maxima, format, sourceLength),
    sourceIds: sourceIds
      ? importView(graph, 'source-ids', sourceIds, 'uint32', sourceLength)
      : undefined,
    leafCapacity: props.leafCapacity,
    nodeMinima: importView(graph, 'node-minima', nodeMinima, format, nodeCount),
    nodeMaxima: importView(graph, 'node-maxima', nodeMaxima, format, nodeCount),
    nodeChildren: importView(graph, 'node-children', children, 'uint32x2', nodeCount),
    leafIds: importView(graph, 'leaf-ids', leafIds, 'uint32', props.leafCapacity),
    count: importView(graph, 'count', count, 'uint32', 1),
    overflow: importView(graph, 'overflow', overflow, 'uint32', 1)
  });
  bvh.addToGraph(graph);
  return {
    bvh,
    compiled: graph.compile(),
    minima,
    maxima,
    nodeMinima,
    nodeMaxima,
    children,
    leafIds,
    count,
    overflow,
    buffers: [
      minima,
      maxima,
      ...(sourceIds ? [sourceIds] : []),
      nodeMinima,
      nodeMaxima,
      children,
      leafIds,
      count,
      overflow
    ]
  };
}

function createInputBuffer(device: Device, data: Float32Array | Uint32Array): Buffer {
  return device.createBuffer({data, usage: Buffer.STORAGE | Buffer.COPY_DST});
}

function createFloatOutputBuffer(device: Device, length: number): Buffer {
  return device.createBuffer({
    byteLength: Math.max(length, 1) * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function createUintOutputBuffer(device: Device, length: number): Buffer {
  return device.createBuffer({
    byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function importView<T extends 'float32x2' | 'float32x3' | 'uint32x2' | 'uint32'>(
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

async function readFloat32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
}

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}

function encode(device: Device, compiled: CompiledGPUCommandGraph<void>): void {
  const commandEncoder = device.createCommandEncoder({id: 'bvh-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
}

function destroyFixture(fixture: Fixture): void {
  fixture.compiled.destroy();
  for (const buffer of fixture.buffers) buffer.destroy();
}
