// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  GPUGridIndex,
  type GPUGridIndexBounds,
  type GPUGridIndexSize
} from '@luma.gl/gpgpu/gpu-core';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, it, vi} from 'vitest';
import {
  addGPUGridIndexToGraphWithDispatchLimit,
  getGPUGridIndexDispatchLayout,
  getGPUGridIndexInvocationIndexSource
} from '../../src/gpu-core/gpu-grid-index-internals';

it('GPUGridIndex plans bounded multidimensional direct dispatches', () => {
  const maximum = 65_535;
  const oneDimensionalRowCapacity = maximum * 256;

  expect(getGPUGridIndexDispatchLayout(0, maximum)).toEqual({x: 1, y: 1, z: 1});
  expect(getGPUGridIndexDispatchLayout(oneDimensionalRowCapacity, maximum)).toEqual({
    x: maximum,
    y: 1,
    z: 1
  });
  expect(getGPUGridIndexDispatchLayout(oneDimensionalRowCapacity + 1, maximum)).toEqual({
    x: maximum,
    y: 2,
    z: 1
  });
  expect(
    getGPUGridIndexDispatchLayout(4 * 256 + 1, 2),
    'a small synthetic limit exercises the third dispatch dimension'
  ).toEqual({x: 2, y: 2, z: 2});
  expect(() => getGPUGridIndexDispatchLayout(8 * 256 + 1, 2)).toThrow(
    /exceeding the 3D dispatch limit/
  );

  const source = getGPUGridIndexInvocationIndexSource({x: 3, y: 2, z: 2});
  expect(source).toMatch(/workgroupId\.z \* 2u \+ workgroupId\.y/);
  expect(source).toMatch(/\* 3u \+ workgroupId\.x/);
  expect(source, 'padded workgroups cannot wrap the uint32 invocation index').toMatch(
    /workgroupIndex >= 16777216u/
  );
  expect(
    Boolean(
      source.indexOf('workgroupIndex >= 16777216u') <
        source.indexOf('workgroupIndex * 256u + localInvocationIndex')
    ),
    'the uint32 guard executes before invocation-index multiplication'
  ).toBe(true);
});

it('GPUGridIndex executes a small three-dimensional dispatch layout', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const positionCount = 4 * 256 + 1;
  const positions = new Float32Array(positionCount * 2);
  positions.fill(0.5);
  const result = await runGridIndex(
    device,
    positions,
    'float32x2',
    [1, 1],
    [0, 0, 1, 1],
    positionCount,
    {
      maxComputeWorkgroupsPerDimension: 2
    }
  );

  expect(result.cellOffsets, 'every multidimensional invocation is counted').toEqual([
    0,
    positionCount
  ]);
  expect(result.count, 'the padded dispatch does not add phantom rows').toBe(positionCount);
  expect(result.overflow, 'the exact-capacity result does not overflow').toBe(0);
  expect(
    result.objectIds.sort((left, right) => left - right),
    'scatter visits every source row exactly once'
  ).toEqual(Array.from({length: positionCount}, (_, index) => index));
});

it('GPUGridIndex scans cell offsets through a multidimensional dispatch', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const cellCount = 4 * 256 + 1;
  const dispatchSpy = vi.spyOn(Computation.prototype, 'dispatch');
  let result: Awaited<ReturnType<typeof runGridIndex>>;
  let scanDispatch: Parameters<Computation['dispatch']> | undefined;
  try {
    result = await runGridIndex(
      device,
      Float32Array.from([0.5, 0.5, 512.5, 0.5, 1024.5, 0.5]),
      'float32x2',
      [cellCount, 1],
      [0, 0, cellCount, 1],
      3,
      {maxComputeWorkgroupsPerDimension: 2}
    );
    const scanDispatchIndex = dispatchSpy.mock.instances.findIndex(
      computation => (computation as Computation).id === 'gpu-grid-index-scan-level-0-scan'
    );
    scanDispatch = dispatchSpy.mock.calls[scanDispatchIndex];
  } finally {
    dispatchSpy.mockRestore();
  }
  const expectedOffsets = Array.from({length: cellCount + 1}, (_, index) => {
    if (index === 0) return 0;
    if (index <= 512) return 1;
    if (index <= 1024) return 2;
    return 3;
  });

  expect(
    result.cellOffsets,
    'the five-block cell-count scan and offset pass preserve every empty cell'
  ).toEqual(expectedOffsets);
  expect(
    scanDispatch?.slice(1),
    'the GridIndex synthetic device limit reaches its nested scan dispatch'
  ).toEqual([2, 2, 2]);
  expect(result.objectIds, 'widely separated cells retain their source rows').toEqual([0, 1, 2]);
  expect(result.count, 'the complete index count survives the multidimensional scan').toBe(3);
  expect(result.overflow, 'the exact-capacity index does not overflow').toBe(0);
});

it('GPUGridIndex builds bounded 2D cells with stable logical IDs', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const positions = Float32Array.from([0, 0, 1, 0, 0, 1, 2, 2, 2, 2, -1, 0, Number.NaN, 1]);
  const result = await runGridIndex(device, positions, 'float32x2', [2, 2], [0, 0, 2, 2], 5, {
    firstSourceIndex: 10
  });

  expect(result.cellOffsets, 'exclusive offsets delimit row-major cells').toEqual([0, 1, 2, 3, 5]);
  expect(result.count, 'only finite in-domain positions are indexed').toBe(5);
  expect(result.overflow, 'exact capacity does not overflow').toBe(0);
  expect(result.objectIds.slice(0, 3), 'single-entry cells preserve source IDs').toEqual([
    10, 11, 12
  ]);
  expect(
    result.objectIds.slice(3).sort((left, right) => left - right),
    'clustered cell contains both stable source IDs regardless of atomic order'
  ).toEqual([13, 14]);
  expect(result.updatePolicy, 'the initial update contract is explicit').toBe('rebuild');
});

it('GPUGridIndex normalizes bounds whose full span exceeds float32', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const result = await runGridIndex(
    device,
    Float32Array.from([0, 0]),
    'float32x2',
    [3, 1],
    [-3e38, 0, 3e38, 1],
    1
  );
  expect(result.cellOffsets, 'zero maps to the middle of extreme bounds').toEqual([0, 0, 1, 1]);
  expect(result.objectIds, 'the accepted point keeps its logical ID').toEqual([0]);
});

it('GPUGridIndex rejects overlapping scatter inputs and output', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const graph = new GPUCommandGraph(device);
  const sharedBuffer = device.createBuffer({
    byteLength: 32,
    usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
  });
  const sharedHandle = graph.importBuffer(
    {id: 'shared-grid-data', byteLength: sharedBuffer.byteLength, usage: sharedBuffer.usage},
    sharedBuffer
  );
  const positions = graph.createDataView(sharedHandle, {format: 'float32x2', length: 2});
  const overlappingObjectIds = graph.createDataView(sharedHandle, {
    format: 'uint32',
    length: 2,
    byteOffset: 8
  });
  const outputs = createIndexOutputs(device, 1, 2);
  const importedOutputs = importIndexOutputs(graph, outputs, 1, 2);

  expect(
    () =>
      new GPUGridIndex({
        positions,
        gridSize: [1, 1],
        bounds: [0, 0, 1, 1],
        ...importedOutputs,
        objectIds: overlappingObjectIds
      }),
    'position reads cannot alias object ID writes'
  ).toThrow(/positions and objectIds must not overlap/);

  const separatePositionsBuffer = createInputBuffer(device, Float32Array.from([0, 0, 1, 1]));
  const separatePositions = importView(
    graph,
    'separate-positions',
    separatePositionsBuffer,
    'float32x2',
    2
  );
  const sourceIds = graph.createDataView(sharedHandle, {
    format: 'uint32',
    length: 2,
    byteOffset: 4
  });
  expect(
    () =>
      new GPUGridIndex({
        positions: separatePositions,
        sourceIds,
        gridSize: [1, 1],
        bounds: [0, 0, 1, 1],
        ...importedOutputs,
        objectIds: overlappingObjectIds
      }),
    'source ID reads cannot alias object ID writes'
  ).toThrow(/sourceIds and objectIds must not overlap/);

  sharedBuffer.destroy();
  separatePositionsBuffer.destroy();
  for (const buffer of Object.values(outputs)) buffer.destroy();
});

it('GPUGridIndex reports capacity overflow without corrupting offsets', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const positions = Float32Array.from([0, 0, 1, 0, 0, 1, 2, 2, 2, 2]);
  const result = await runGridIndex(device, positions, 'float32x2', [2, 2], [0, 0, 2, 2], 4);
  expect(result.cellOffsets, 'offsets describe the untruncated index').toEqual([0, 1, 2, 3, 5]);
  expect(result.count, 'count reports required capacity').toBe(5);
  expect(result.overflow, 'overflow reports truncated object ID storage').toBe(1);
  expect(result.objectIds.slice(0, 3), 'complete cells remain addressable').toEqual([0, 1, 2]);
  expect(
    Boolean(result.objectIds[3] === 3 || result.objectIds[3] === 4),
    'bounded tail stores one valid ID'
  ).toBe(true);

  const zeroCapacity = await runGridIndex(
    device,
    Float32Array.from([0, 0]),
    'float32x2',
    [1, 1],
    [0, 0, 1, 1],
    0
  );
  expect(zeroCapacity.cellOffsets, 'zero capacity still publishes exact offsets').toEqual([0, 1]);
  expect(zeroCapacity.objectIds, 'zero capacity performs no object-ID writes').toEqual([]);
  expect(zeroCapacity.count, 'zero capacity reports the required row count').toBe(1);
  expect(zeroCapacity.overflow, 'zero capacity reports overflow for accepted input').toBe(1);
});

it('GPUGridIndex builds 3D cells and preserves explicit source IDs', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const result = await runGridIndex(
    device,
    Float32Array.from([0, 0, 0, 2, 0, 0, 0, 0, 2, 2, 1, 2, 3, 0, 0]),
    'float32x3',
    [2, 1, 2],
    [0, 0, 0, 2, 1, 2],
    4,
    {sourceIds: Uint32Array.from([90, 80, 70, 60, 50])}
  );
  expect(result.cellOffsets, 'layer-major 3D cells have exact offsets').toEqual([0, 1, 2, 3, 4]);
  expect(result.objectIds, 'explicit IDs replace generated row IDs').toEqual([90, 80, 70, 60]);
  expect(result.count, 'out-of-domain 3D positions are ignored').toBe(4);
  expect(result.overflow, 'accepted 3D positions fit capacity').toBe(0);
});

it('GPUGridIndex preserves vector chunks and rebuilds after input updates', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const chunks = [
    Float32Array.from([0, 0, 1, 0]),
    new Float32Array(0),
    Float32Array.from([0, 1, 2, 2])
  ];
  const buffers = chunks.map(chunk => createInputBuffer(device, chunk));
  const vector = new GPUVector({
    type: 'data',
    name: 'positions',
    format: 'float32x2',
    data: chunks.map(
      (chunk, chunkIndex) =>
        new GPUData({
          buffer: buffers[chunkIndex],
          format: 'float32x2',
          length: chunk.length / 2,
          ownsBuffer: false
        })
    ),
    ownsData: false
  });
  const outputs = createIndexOutputs(device, 4, 4);
  const graph = new GPUCommandGraph(device);
  const index = new GPUGridIndex({
    positions: graph.importGPUVector('positions', vector),
    gridSize: [2, 2],
    bounds: [0, 0, 2, 2],
    ...importIndexOutputs(graph, outputs, 4, 4)
  });
  index.addToGraph(graph);
  const compiled = graph.compile();

  encode(device, compiled);
  expect(await readUint32(outputs.cellOffsets, 5)).toEqual([0, 1, 2, 3, 4]);
  expect(
    compiled.stats.nodeOrder.filter(id => id.includes('-count-')),
    'empty chunks retain identity without adding count work'
  ).toEqual(['gpu-grid-index-count-0', 'gpu-grid-index-count-2']);

  buffers[2].write(Float32Array.from([0, 0, 0, 0]));
  encode(device, compiled);
  expect(
    await readUint32(outputs.cellOffsets, 5),
    'rewriting one source chunk causes the next encoding to rebuild the complete compact index'
  ).toEqual([0, 3, 4, 4, 4]);
  expect(
    compiled.stats.logicalTransientBufferCount,
    'build scratch is graph-owned and visible'
  ).toBe(3);

  compiled.destroy();
  vector.destroy();
  for (const buffer of [...buffers, ...Object.values(outputs)]) buffer.destroy();
});

type IndexOutputs = {
  cellOffsets: Buffer;
  objectIds: Buffer;
  count: Buffer;
  overflow: Buffer;
};

async function runGridIndex(
  device: Device,
  positionValues: Float32Array,
  format: 'float32x2' | 'float32x3',
  gridSize: GPUGridIndexSize,
  bounds: GPUGridIndexBounds,
  capacity: number,
  options: {
    firstSourceIndex?: number;
    sourceIds?: Uint32Array;
    maxComputeWorkgroupsPerDimension?: number;
  } = {}
): Promise<{
  cellOffsets: number[];
  objectIds: number[];
  count: number;
  overflow: number;
  updatePolicy: 'rebuild';
}> {
  const positions = createInputBuffer(device, positionValues);
  const sourceIds = options.sourceIds ? createInputBuffer(device, options.sourceIds) : undefined;
  const cellCount = gridSize.reduce((product, size) => product * size, 1);
  const outputs = createIndexOutputs(device, cellCount, capacity);
  const graph = new GPUCommandGraph(device);
  const positionView = importView(
    graph,
    'positions',
    positions,
    format,
    positionValues.length / (format === 'float32x2' ? 2 : 3)
  );
  const index = new GPUGridIndex({
    positions: positionView as never,
    sourceIds: sourceIds
      ? importView(graph, 'source-ids', sourceIds, 'uint32', options.sourceIds!.length)
      : undefined,
    firstSourceIndex: options.firstSourceIndex,
    gridSize,
    bounds,
    ...importIndexOutputs(graph, outputs, cellCount, capacity)
  });
  if (options.maxComputeWorkgroupsPerDimension === undefined) {
    index.addToGraph(graph);
  } else {
    addGPUGridIndexToGraphWithDispatchLimit(index, graph, options.maxComputeWorkgroupsPerDimension);
  }
  const compiled = graph.compile();
  encode(device, compiled);
  const result = {
    cellOffsets: await readUint32(outputs.cellOffsets, cellCount + 1),
    objectIds: await readUint32(outputs.objectIds, capacity),
    count: (await readUint32(outputs.count, 1))[0],
    overflow: (await readUint32(outputs.overflow, 1))[0],
    updatePolicy: index.updatePolicy
  };
  compiled.destroy();
  positions.destroy();
  sourceIds?.destroy();
  for (const buffer of Object.values(outputs)) buffer.destroy();
  return result;
}

function createIndexOutputs(device: Device, cellCount: number, capacity: number): IndexOutputs {
  return {
    cellOffsets: createOutputBuffer(device, cellCount + 1),
    objectIds: createOutputBuffer(device, capacity),
    count: createOutputBuffer(device, 1),
    overflow: createOutputBuffer(device, 1)
  };
}

function importIndexOutputs(
  graph: GPUCommandGraph,
  outputs: IndexOutputs,
  cellCount: number,
  capacity: number
) {
  return {
    cellOffsets: importView(graph, 'cell-offsets', outputs.cellOffsets, 'uint32', cellCount + 1),
    objectIds: importView(graph, 'object-ids', outputs.objectIds, 'uint32', capacity),
    count: importView(graph, 'count', outputs.count, 'uint32', 1),
    overflow: importView(graph, 'overflow', outputs.overflow, 'uint32', 1)
  };
}

function encode(device: Device, compiled: ReturnType<GPUCommandGraph['compile']>): void {
  const commandEncoder = device.createCommandEncoder({id: 'grid-index-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
}

function createInputBuffer(device: Device, values: Float32Array | Uint32Array): Buffer {
  return device.createBuffer({
    data: values.length > 0 ? values : new Uint32Array(1),
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
}

function createOutputBuffer(device: Device, length: number): Buffer {
  return device.createBuffer({
    byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function importView<T extends 'float32x2' | 'float32x3' | 'uint32'>(
  graph: GPUCommandGraph,
  id: string,
  buffer: Buffer,
  format: T,
  length: number
) {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length});
}

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}
