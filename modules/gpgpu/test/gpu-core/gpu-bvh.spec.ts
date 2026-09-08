import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUBVH,
  GPUCommandGraph,
  type CompiledGPUCommandGraph,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {getGPUBVHDispatchLayout} from '../../src/gpu-core/gpu-bvh';

it('GPUBVH plans multidimensional leaf-loading dispatches', () => {
  expect(
    getGPUBVHDispatchLayout(2 ** 24 - 1, 65535),
    'the largest standard-binding 2D tree does not exceed the per-dimension limit'
  ).toEqual({x: 65535, y: 2, z: 1});
});

it('GPUBVH builds deterministic 2D topology and bounds', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const fixture = createFixture(device, {
    dimension: 2,
    minima: Float32Array.from([0, 0, 3, 1, -2, 4]),
    maxima: Float32Array.from([1, 2, 5, 3, -1, 6]),
    leafCapacity: 4
  });
  encode(device, fixture.compiled);

  expect(await readUint32(fixture.children, 14)).toEqual([
    1, 2, 3, 4, 5, 6, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff,
    0xffffffff, 0xffffffff
  ]);
  expect(await readUint32(fixture.leafIds, 4)).toEqual([0, 1, 2, 0xffffffff]);
  expect(await readFloat32(fixture.nodeMinima, 2), 'root contains every valid leaf').toEqual([
    -2, 0
  ]);
  expect(await readFloat32(fixture.nodeMaxima, 2)).toEqual([5, 6]);
  expect(await readUint32(fixture.count, 1)).toEqual([3]);
  expect(await readUint32(fixture.overflow, 1)).toEqual([0]);
  expect(fixture.bvh.topology).toBe('complete-binary');
  expect(fixture.bvh.updatePolicy).toBe('refit');
  expect(fixture.bvh.strategy, 'small hierarchies select their strategy automatically').toBe(
    'auto'
  );
  expect(fixture.bvh.resolvedStrategy, 'small hierarchies use one workgroup').toBe('fused');
  expect(
    fixture.compiled.stats.nodeOrder,
    'leaf loading and every parent level execute in one graph node'
  ).toEqual(['test-bvh-fused-refit']);
  expect(fixture.bvh.stats).toEqual({
    dimension: 2,
    leafCapacity: 4,
    internalNodeCount: 3,
    nodeCount: 7,
    levelCount: 3,
    outputByteLength: 192
  });

  destroyFixture(fixture);
});

it('GPUBVH refits 3D bounds while preserving stable IDs and reports capacity overflow', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    return;
  }
  expect(
    device.limits.maxStorageBuffersPerShaderStage,
    'explicit stable IDs work within the default WebGPU CORE storage-buffer limit'
  ).toBe(8);

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

  expect(await readFloat32(fixture.nodeMinima, 3)).toEqual([-1, -2, 0]);
  expect(await readFloat32(fixture.nodeMaxima, 3)).toEqual([6, 5, 7]);
  expect(
    await readUint32(fixture.leafIds, 6),
    'source and destination offsets preserve surrounding storage and the maximum stable ID'
  ).toEqual([0, 0, 10, 0xffffffff, 30, 40]);
  expect(await readUint32(fixture.count, 1), 'count reports required leaf capacity').toEqual([5]);
  expect(await readUint32(fixture.overflow, 1), 'the fifth leaf is not written').toEqual([1]);

  fixture.minima.write(Float32Array.from([8, 8, 8, 2, 2, 2, -1, 3, 1, 4, -2, 0, 100, 100, 100]));
  fixture.maxima.write(Float32Array.from([9, 9, 9, 3, 4, 5, 0, 5, 2, 6, 0, 7, 101, 101, 101]));
  encode(device, fixture.compiled);
  expect(await readFloat32(fixture.nodeMinima, 3)).toEqual([-1, -2, 0]);
  expect(await readFloat32(fixture.nodeMaxima, 3), 'root refits updated leaves').toEqual([9, 9, 9]);
  expect(
    await readUint32(fixture.leafIds, 4, fixture.leafIdsByteOffset),
    'identity is stable across repeated encoding'
  ).toEqual([10, 0xffffffff, 30, 40]);
  expect(fixture.bvh.resolvedStrategy, 'explicit source IDs preserve fused refits').toBe('fused');
  expect(fixture.compiled.stats.nodeOrder).toEqual([
    'test-bvh-fused-refit',
    'test-bvh-remap-source-ids'
  ]);

  destroyFixture(fixture);
});

it('GPUBVH fused and per-level strategies publish identical invalid and padded bounds', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
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
  expect(fused.bvh.resolvedStrategy).toBe('fused');
  expect(perLevel.bvh.resolvedStrategy).toBe('level');
  expect(
    fused.compiled.stats.nodeOrder.length,
    'fused construction adds only the CORE-compatible source-ID remapping node'
  ).toBe(2);
  expect(
    perLevel.compiled.stats.nodeOrder.length,
    'per-level construction adds only the CORE-compatible source-ID remapping node'
  ).toBe(5);
  expect(
    Boolean(
      perLevel.compiled.stats.nodeOrder.indexOf('test-bvh-load-leaves') <
        perLevel.compiled.stats.nodeOrder.indexOf('test-bvh-remap-source-ids')
    ),
    'the graph remaps explicit IDs only after their implicit leaf slots have been published'
  ).toBe(true);
  expect(
    await readFloat32(fused.nodeMinima, nodeCount * bounds.dimension),
    'invalid and padded leaf minima reduce identically'
  ).toEqual(await readFloat32(perLevel.nodeMinima, nodeCount * bounds.dimension));
  expect(
    await readFloat32(fused.nodeMaxima, nodeCount * bounds.dimension),
    'invalid and padded leaf maxima reduce identically'
  ).toEqual(await readFloat32(perLevel.nodeMaxima, nodeCount * bounds.dimension));
  expect(
    await readUint32(fused.children, nodeCount * 2),
    'both strategies publish the same complete-binary child topology'
  ).toEqual(await readUint32(perLevel.children, nodeCount * 2));
  expect(
    await readUint32(fused.leafIds, bounds.leafCapacity),
    'invalid bounds retain their explicit identities while padded leaves stay invalid'
  ).toEqual([91, 71, 63, 47, 35, 0xffffffff, 0xffffffff, 0xffffffff]);
  expect(
    await readUint32(fused.leafIds, bounds.leafCapacity),
    'both strategies remap explicit source identities identically'
  ).toEqual(await readUint32(perLevel.leafIds, bounds.leafCapacity));
  expect(await readUint32(fused.count, 1)).toEqual(await readUint32(perLevel.count, 1));
  expect(await readUint32(fused.overflow, 1)).toEqual(await readUint32(perLevel.overflow, 1));

  destroyFixture(fused);
  destroyFixture(perLevel);
});

it('GPUBVH fuses empty singleton roots and the maximum portable small hierarchy', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const empty = createFixture(device, {
    dimension: 3,
    minima: new Float32Array(),
    maxima: new Float32Array(),
    leafCapacity: 1
  });
  encode(device, empty.compiled);

  expect(empty.bvh.resolvedStrategy).toBe('fused');
  expect(await readUint32(empty.children, 2)).toEqual([0xffffffff, 0xffffffff]);
  expect(await readUint32(empty.leafIds, 1)).toEqual([0xffffffff]);
  expect(await readUint32(empty.count, 1)).toEqual([0]);
  expect(await readUint32(empty.overflow, 1)).toEqual([0]);

  const boundary = createFixture(device, {
    dimension: 2,
    minima: Float32Array.from([0, 0, -4, 7, 3, -2]),
    maxima: Float32Array.from([2, 2, -1, 9, 5, 4]),
    leafCapacity: 128
  });
  encode(device, boundary.compiled);

  expect(boundary.bvh.resolvedStrategy).toBe('fused');
  expect(boundary.compiled.stats.nodeOrder).toEqual(['test-bvh-fused-refit']);
  expect(await readFloat32(boundary.nodeMinima, 2)).toEqual([-4, -2]);
  expect(await readFloat32(boundary.nodeMaxima, 2)).toEqual([5, 9]);
  expect(await readUint32(boundary.count, 1)).toEqual([3]);

  destroyFixture(empty);
  destroyFixture(boundary);
});

it('GPUBVH retains per-level construction when one workgroup cannot contain every leaf', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const fixture = createFixture(device, {
    dimension: 2,
    minima: Float32Array.from([0, 0, 4, -2, -3, 5]),
    maxima: Float32Array.from([1, 1, 6, 0, -1, 7]),
    leafCapacity: 256
  });
  encode(device, fixture.compiled);

  expect(fixture.bvh.strategy).toBe('auto');
  expect(fixture.bvh.resolvedStrategy, 'large hierarchies avoid cross-workgroup barriers').toBe(
    'level'
  );
  expect(fixture.compiled.stats.nodeOrder.length, 'one load and eight refit passes remain').toBe(9);
  expect(fixture.compiled.stats.nodeOrder[0]).toBe('test-bvh-load-leaves');
  expect(fixture.compiled.stats.nodeOrder[8]).toBe('test-bvh-refit-depth-0');
  expect(await readFloat32(fixture.nodeMinima, 2)).toEqual([-3, -2]);
  expect(await readFloat32(fixture.nodeMaxima, 2)).toEqual([6, 7]);
  expect(await readUint32(fixture.count, 1)).toEqual([3]);
  expect(await readUint32(fixture.overflow, 1)).toEqual([0]);

  destroyFixture(fixture);
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
