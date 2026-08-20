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
import {getGPUBVHDispatchLayout} from '../../src/gpu-core/gpu-bvh';

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
  t.equal(fixture.bvh.strategy, 'auto', 'small hierarchies select their strategy automatically');
  t.equal(fixture.bvh.resolvedStrategy, 'fused', 'small hierarchies use one workgroup');
  t.deepEqual(
    fixture.compiled.stats.nodeOrder,
    ['test-bvh-fused-refit'],
    'leaf loading and every parent level execute in one graph node'
  );
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
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  t.equal(
    device.limits.maxStorageBuffersPerShaderStage,
    8,
    'explicit stable IDs work within the default WebGPU CORE storage-buffer limit'
  );

  const fixture = createFixture(device, {
    dimension: 3,
    minima: Float32Array.from([0, 0, 0, 2, 2, 2, -1, 3, 1, 4, -2, 0, 100, 100, 100]),
    maxima: Float32Array.from([1, 1, 1, 3, 4, 5, 0, 5, 2, 6, 0, 7, 101, 101, 101]),
    sourceIds: Uint32Array.from([10, 0xffffffff, 30, 40, 50]),
    sourceIdsByteOffset: Uint32Array.BYTES_PER_ELEMENT,
    leafIdsByteOffset: Uint32Array.BYTES_PER_ELEMENT * 2,
    leafCapacity: 4
  });
  encode(device, fixture.compiled);

  t.deepEqual(await readFloat32(fixture.nodeMinima, 3), [-1, -2, 0]);
  t.deepEqual(await readFloat32(fixture.nodeMaxima, 3), [6, 5, 7]);
  t.deepEqual(
    await readUint32(fixture.leafIds, 6),
    [0, 0, 10, 0xffffffff, 30, 40],
    'source and destination offsets preserve surrounding storage and the maximum stable ID'
  );
  t.deepEqual(await readUint32(fixture.count, 1), [5], 'count reports required leaf capacity');
  t.deepEqual(await readUint32(fixture.overflow, 1), [1], 'the fifth leaf is not written');

  fixture.minima.write(Float32Array.from([8, 8, 8, 2, 2, 2, -1, 3, 1, 4, -2, 0, 100, 100, 100]));
  fixture.maxima.write(Float32Array.from([9, 9, 9, 3, 4, 5, 0, 5, 2, 6, 0, 7, 101, 101, 101]));
  encode(device, fixture.compiled);
  t.deepEqual(await readFloat32(fixture.nodeMinima, 3), [-1, -2, 0]);
  t.deepEqual(await readFloat32(fixture.nodeMaxima, 3), [9, 9, 9], 'root refits updated leaves');
  t.deepEqual(
    await readUint32(fixture.leafIds, 4, fixture.leafIdsByteOffset),
    [10, 0xffffffff, 30, 40],
    'identity is stable across repeated encoding'
  );
  t.equal(fixture.bvh.resolvedStrategy, 'fused', 'explicit source IDs preserve fused refits');
  t.deepEqual(fixture.compiled.stats.nodeOrder, [
    'test-bvh-fused-refit',
    'test-bvh-remap-source-ids'
  ]);

  destroyFixture(fixture);
  t.end();
});

test('GPUBVH fused and per-level strategies publish identical invalid and padded bounds', async t => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const bounds = {
    dimension: 3 as const,
    minima: Float32Array.from([0, 0, 0, 2, 2, 2, 6, 6, 6, Number.NaN, 0, 0, -1, 4, 0]),
    maxima: Float32Array.from([1, 1, 1, 1, 3, 3, 7, 7, 7, 2, 2, 2, 0, 5, 1]),
    sourceIds: Uint32Array.from([91, 71, 63, 47, 35]),
    leafCapacity: 8
  };
  const fused = createFixture(device, {...bounds, strategy: 'fused'});
  const perLevel = createFixture(device, {...bounds, strategy: 'level'});
  encode(device, fused.compiled);
  encode(device, perLevel.compiled);

  const nodeCount = bounds.leafCapacity * 2 - 1;
  t.equal(fused.bvh.resolvedStrategy, 'fused');
  t.equal(perLevel.bvh.resolvedStrategy, 'level');
  t.equal(
    fused.compiled.stats.nodeOrder.length,
    2,
    'fused construction adds only the CORE-compatible source-ID remapping node'
  );
  t.equal(
    perLevel.compiled.stats.nodeOrder.length,
    5,
    'per-level construction adds only the CORE-compatible source-ID remapping node'
  );
  t.ok(
    perLevel.compiled.stats.nodeOrder.indexOf('test-bvh-load-leaves') <
      perLevel.compiled.stats.nodeOrder.indexOf('test-bvh-remap-source-ids'),
    'the graph remaps explicit IDs only after their implicit leaf slots have been published'
  );
  t.deepEqual(
    await readFloat32(fused.nodeMinima, nodeCount * bounds.dimension),
    await readFloat32(perLevel.nodeMinima, nodeCount * bounds.dimension),
    'invalid and padded leaf minima reduce identically'
  );
  t.deepEqual(
    await readFloat32(fused.nodeMaxima, nodeCount * bounds.dimension),
    await readFloat32(perLevel.nodeMaxima, nodeCount * bounds.dimension),
    'invalid and padded leaf maxima reduce identically'
  );
  t.deepEqual(
    await readUint32(fused.children, nodeCount * 2),
    await readUint32(perLevel.children, nodeCount * 2),
    'both strategies publish the same complete-binary child topology'
  );
  t.deepEqual(
    await readUint32(fused.leafIds, bounds.leafCapacity),
    [91, 71, 63, 47, 35, 0xffffffff, 0xffffffff, 0xffffffff],
    'invalid bounds retain their explicit identities while padded leaves stay invalid'
  );
  t.deepEqual(
    await readUint32(fused.leafIds, bounds.leafCapacity),
    await readUint32(perLevel.leafIds, bounds.leafCapacity),
    'both strategies remap explicit source identities identically'
  );
  t.deepEqual(await readUint32(fused.count, 1), await readUint32(perLevel.count, 1));
  t.deepEqual(await readUint32(fused.overflow, 1), await readUint32(perLevel.overflow, 1));

  destroyFixture(fused);
  destroyFixture(perLevel);
  t.end();
});

test('GPUBVH fuses empty singleton roots and the maximum portable small hierarchy', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const empty = createFixture(device, {
    dimension: 3,
    minima: new Float32Array(),
    maxima: new Float32Array(),
    leafCapacity: 1
  });
  encode(device, empty.compiled);

  t.equal(empty.bvh.resolvedStrategy, 'fused');
  t.deepEqual(await readUint32(empty.children, 2), [0xffffffff, 0xffffffff]);
  t.deepEqual(await readUint32(empty.leafIds, 1), [0xffffffff]);
  t.deepEqual(await readUint32(empty.count, 1), [0]);
  t.deepEqual(await readUint32(empty.overflow, 1), [0]);

  const boundary = createFixture(device, {
    dimension: 2,
    minima: Float32Array.from([0, 0, -4, 7, 3, -2]),
    maxima: Float32Array.from([2, 2, -1, 9, 5, 4]),
    leafCapacity: 128
  });
  encode(device, boundary.compiled);

  t.equal(boundary.bvh.resolvedStrategy, 'fused');
  t.deepEqual(boundary.compiled.stats.nodeOrder, ['test-bvh-fused-refit']);
  t.deepEqual(await readFloat32(boundary.nodeMinima, 2), [-4, -2]);
  t.deepEqual(await readFloat32(boundary.nodeMaxima, 2), [5, 9]);
  t.deepEqual(await readUint32(boundary.count, 1), [3]);

  destroyFixture(empty);
  destroyFixture(boundary);
  t.end();
});

test('GPUBVH retains per-level construction when one workgroup cannot contain every leaf', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const fixture = createFixture(device, {
    dimension: 2,
    minima: Float32Array.from([0, 0, 4, -2, -3, 5]),
    maxima: Float32Array.from([1, 1, 6, 0, -1, 7]),
    leafCapacity: 256
  });
  encode(device, fixture.compiled);

  t.equal(fixture.bvh.strategy, 'auto');
  t.equal(
    fixture.bvh.resolvedStrategy,
    'level',
    'large hierarchies avoid cross-workgroup barriers'
  );
  t.equal(fixture.compiled.stats.nodeOrder.length, 9, 'one load and eight refit passes remain');
  t.equal(fixture.compiled.stats.nodeOrder[0], 'test-bvh-load-leaves');
  t.equal(fixture.compiled.stats.nodeOrder[8], 'test-bvh-refit-depth-0');
  t.deepEqual(await readFloat32(fixture.nodeMinima, 2), [-3, -2]);
  t.deepEqual(await readFloat32(fixture.nodeMaxima, 2), [6, 7]);
  t.deepEqual(await readUint32(fixture.count, 1), [3]);
  t.deepEqual(await readUint32(fixture.overflow, 1), [0]);

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
  leafIdsByteOffset: number;
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
    sourceIdsByteOffset?: number;
    leafIdsByteOffset?: number;
    leafCapacity: number;
    strategy?: 'auto' | 'fused' | 'level';
  }
): Fixture {
  const format = props.dimension === 2 ? 'float32x2' : 'float32x3';
  const sourceLength = props.minima.length / props.dimension;
  const nodeCount = props.leafCapacity * 2 - 1;
  const minima = createInputBuffer(
    device,
    props.minima.length > 0 ? props.minima : new Float32Array(props.dimension)
  );
  const maxima = createInputBuffer(
    device,
    props.maxima.length > 0 ? props.maxima : new Float32Array(props.dimension)
  );
  let sourceIds: Buffer | undefined;
  if (props.sourceIds) {
    const sourceIdOffset = (props.sourceIdsByteOffset ?? 0) / Uint32Array.BYTES_PER_ELEMENT;
    const sourceIdData = new Uint32Array(sourceIdOffset + props.sourceIds.length);
    sourceIdData.set(props.sourceIds, sourceIdOffset);
    sourceIds = createInputBuffer(device, sourceIdData);
  }
  const nodeMinima = createFloatOutputBuffer(device, nodeCount * props.dimension);
  const nodeMaxima = createFloatOutputBuffer(device, nodeCount * props.dimension);
  const children = createUintOutputBuffer(device, nodeCount * 2);
  const leafIdsByteOffset = props.leafIdsByteOffset ?? 0;
  const leafIds = createUintOutputBuffer(
    device,
    props.leafCapacity + leafIdsByteOffset / Uint32Array.BYTES_PER_ELEMENT
  );
  const count = createUintOutputBuffer(device, 1);
  const overflow = createUintOutputBuffer(device, 1);
  const graph = new GPUCommandGraph(device, {id: 'bvh-test'});
  const bvh = new GPUBVH({
    id: 'test-bvh',
    strategy: props.strategy,
    minima: importView(graph, 'source-minima', minima, format, sourceLength),
    maxima: importView(graph, 'source-maxima', maxima, format, sourceLength),
    sourceIds: sourceIds
      ? importView(
          graph,
          'source-ids',
          sourceIds,
          'uint32',
          sourceLength,
          props.sourceIdsByteOffset
        )
      : undefined,
    leafCapacity: props.leafCapacity,
    nodeMinima: importView(graph, 'node-minima', nodeMinima, format, nodeCount),
    nodeMaxima: importView(graph, 'node-maxima', nodeMaxima, format, nodeCount),
    nodeChildren: importView(graph, 'node-children', children, 'uint32x2', nodeCount),
    leafIds: importView(
      graph,
      'leaf-ids',
      leafIds,
      'uint32',
      props.leafCapacity,
      leafIdsByteOffset
    ),
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
    leafIdsByteOffset,
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
  length: number,
  byteOffset = 0
): GraphDataView<T> {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length, byteOffset});
}

async function readFloat32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
}

async function readUint32(buffer: Buffer, length: number, byteOffset = 0): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset + byteOffset, length));
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
