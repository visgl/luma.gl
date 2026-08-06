// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUGridIndex,
  GPUGridIndexQuery,
  type GPUGridIndexBounds,
  type GPUGridIndexQueryKind,
  type GPUGridIndexSize
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

const POSITIONS_2D = Float32Array.from([
  0.25, 0.25, 0.75, 0.75, 1.25, 0.25, 0.25, 1.25, 1.25, 1.25, 1.75, 1.75
]);

test('GPUGridIndexQuery selects point cells and refreshes IDs and masks', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const fixture = createQueryFixture(device, {
    positions: POSITIONS_2D,
    format: 'float32x2',
    gridSize: [2, 2],
    bounds: [0, 0, 2, 2],
    kind: 'point',
    query: Float32Array.from([0.5, 0.5]),
    outputCapacity: 6,
    maskLength: 6
  });
  encode(device, fixture.compiled);
  t.deepEqual((await readQueryResult(fixture)).ids.sort(sortNumbers), [0, 1]);
  t.deepEqual(await readUint32(fixture.outputMask!, 6), [1, 1, 0, 0, 0, 0]);

  fixture.query.write(Float32Array.from([1, 0.5]));
  encode(device, fixture.compiled);
  t.deepEqual(
    await readQueryResult(fixture),
    {ids: [2], count: 1, overflow: 0},
    'an internal boundary selects the same upper cell used by index construction'
  );
  t.deepEqual(
    await readUint32(fixture.outputMask!, 6),
    [0, 0, 1, 0, 0, 0],
    'each encoding clears the previous source-aligned mask'
  );
  destroyFixture(fixture);
  t.end();
});

test('GPUGridIndexQuery returns conservative bounds and radius candidates', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const boundsFixture = createQueryFixture(device, {
    positions: POSITIONS_2D,
    format: 'float32x2',
    gridSize: [2, 2],
    bounds: [0, 0, 2, 2],
    kind: 'bounds',
    query: Float32Array.from([0, 0, 0.5, 0.5]),
    outputCapacity: 6
  });
  encode(device, boundsFixture.compiled);
  t.deepEqual(
    (await readQueryResult(boundsFixture)).ids.sort(sortNumbers),
    [0, 1],
    'bounds return the containing-cell candidates, including a documented false positive'
  );
  destroyFixture(boundsFixture);

  const radiusFixture = createQueryFixture(device, {
    positions: POSITIONS_2D,
    format: 'float32x2',
    gridSize: [2, 2],
    bounds: [0, 0, 2, 2],
    kind: 'radius',
    query: Float32Array.from([0.5, 0.5, 0.6]),
    outputCapacity: 6
  });
  encode(device, radiusFixture.compiled);
  t.deepEqual(
    (await readQueryResult(radiusFixture)).ids.sort(sortNumbers),
    [0, 1, 2, 3],
    'radius rejects a diagonally distant cell while preserving intersecting candidates'
  );
  destroyFixture(radiusFixture);
  t.end();
});

test('GPUGridIndexQuery reports query and source-index overflow independently', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const outputOverflow = createQueryFixture(device, {
    positions: POSITIONS_2D,
    format: 'float32x2',
    gridSize: [2, 2],
    bounds: [0, 0, 2, 2],
    kind: 'bounds',
    query: Float32Array.from([0, 0, 2, 2]),
    outputCapacity: 2
  });
  encode(device, outputOverflow.compiled);
  const outputResult = await readQueryResult(outputOverflow);
  t.equal(outputResult.count, 6, 'candidate count reports required output capacity');
  t.equal(outputResult.ids.length, 2, 'candidate storage remains bounded');
  t.equal(outputResult.overflow, 1, 'candidate truncation sets overflow');
  destroyFixture(outputOverflow);

  const indexOverflow = createQueryFixture(device, {
    positions: POSITIONS_2D,
    format: 'float32x2',
    gridSize: [2, 2],
    bounds: [0, 0, 2, 2],
    kind: 'point',
    query: Float32Array.from([1.5, 1.5]),
    indexCapacity: 4,
    outputCapacity: 6
  });
  encode(device, indexOverflow.compiled);
  t.deepEqual(
    await readQueryResult(indexOverflow),
    {ids: [], count: 0, overflow: 1},
    'an overflowed source index marks even an otherwise empty stored-prefix result incomplete'
  );
  destroyFixture(indexOverflow);
  t.end();
});

test('GPUGridIndexQuery selects 3D point cells', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const fixture = createQueryFixture(device, {
    positions: Float32Array.from([0.25, 0.25, 0.25, 1.25, 0.25, 0.25, 0.25, 0.25, 1.25]),
    format: 'float32x3',
    gridSize: [2, 1, 2],
    bounds: [0, 0, 0, 2, 1, 2],
    kind: 'point',
    query: Float32Array.from([0.5, 0.5, 1.5]),
    outputCapacity: 3
  });
  encode(device, fixture.compiled);
  t.deepEqual(await readQueryResult(fixture), {ids: [2], count: 1, overflow: 0});
  destroyFixture(fixture);
  t.end();
});

test('GPUGridIndexQuery handles extreme domains and exponential WGSL literals', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const pointFixture = createQueryFixture(device, {
    positions: Float32Array.from([0, 0.5]),
    format: 'float32x2',
    gridSize: [2, 1],
    bounds: [-3e38, 0, 3e38, 1],
    kind: 'point',
    query: Float32Array.from([0, 0.5]),
    outputCapacity: 1
  });
  encode(device, pointFixture.compiled);
  t.deepEqual(
    await readQueryResult(pointFixture),
    {ids: [0], count: 1, overflow: 0},
    'cross-zero normalization agrees with index construction'
  );
  destroyFixture(pointFixture);

  const radiusFixture = createQueryFixture(device, {
    positions: Float32Array.from([-2e38, 0.5, 2e38, 0.5]),
    format: 'float32x2',
    gridSize: [2, 1],
    bounds: [-3e38, 0, 3e38, 1],
    kind: 'radius',
    query: Float32Array.from([0, 0.5, 1e20]),
    outputCapacity: 2
  });
  encode(device, radiusFixture.compiled);
  t.deepEqual(
    (await readQueryResult(radiusFixture)).ids.sort(sortNumbers),
    [0, 1],
    'overflow-safe cell boundaries preserve both cells touching the query radius'
  );
  destroyFixture(radiusFixture);
  t.end();
});

test('GPUGridIndexQuery rejects overlapping inputs and writable results', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const buffer = device.createBuffer({byteLength: 256, usage: Buffer.STORAGE});
  const graph = new GPUCommandGraph(device);
  const handle = graph.importBuffer(
    {id: 'shared', byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  const view = <T extends 'float32' | 'uint32'>(format: T, length: number, byteOffset: number) =>
    graph.createDataView(handle, {format, length, byteOffset});
  const index = {
    gridSize: [1, 1] as const,
    bounds: [0, 0, 1, 1] as const,
    cellOffsets: view('uint32', 2, 0),
    objectIds: view('uint32', 2, 16),
    count: view('uint32', 1, 32),
    overflow: view('uint32', 1, 36)
  };
  const query = view('float32', 2, 40);
  const overflow = view('uint32', 1, 60);

  t.throws(
    () =>
      new GPUGridIndexQuery({
        index,
        kind: 'point',
        query,
        output: view('uint32', 2, 20),
        count: view('uint32', 1, 56),
        overflow
      }),
    /output and index objectIds must not overlap/,
    'query writes cannot alias live index reads'
  );
  t.throws(
    () =>
      new GPUGridIndexQuery({
        index,
        kind: 'point',
        query,
        output: view('uint32', 2, 64),
        count: view('uint32', 1, 68),
        overflow
      }),
    /count and output must not overlap/,
    'writable result views cannot race each other'
  );

  buffer.destroy();
  t.end();
});

type QueryFixture = {
  compiled: ReturnType<GPUCommandGraph['compile']>;
  query: Buffer;
  output: Buffer;
  outputCount: Buffer;
  outputOverflow: Buffer;
  outputMask?: Buffer;
  outputCapacity: number;
  buffers: Buffer[];
};

function createQueryFixture(
  device: Device,
  props: {
    positions: Float32Array;
    format: 'float32x2' | 'float32x3';
    gridSize: GPUGridIndexSize;
    bounds: GPUGridIndexBounds;
    kind: GPUGridIndexQueryKind;
    query: Float32Array;
    indexCapacity?: number;
    outputCapacity: number;
    maskLength?: number;
  }
): QueryFixture {
  const rowLength = props.format === 'float32x2' ? 2 : 3;
  const positionCount = props.positions.length / rowLength;
  const cellCount = props.gridSize.reduce((product, size) => product * size, 1);
  const indexCapacity = props.indexCapacity ?? positionCount;
  const positions = createInputBuffer(device, props.positions);
  const query = createInputBuffer(device, props.query);
  const cellOffsets = createOutputBuffer(device, cellCount + 1);
  const objectIds = createOutputBuffer(device, indexCapacity);
  const indexCount = createOutputBuffer(device, 1);
  const indexOverflow = createOutputBuffer(device, 1);
  const output = createOutputBuffer(device, props.outputCapacity);
  const outputCount = createOutputBuffer(device, 1);
  const outputOverflow = createOutputBuffer(device, 1);
  const outputMask =
    props.maskLength === undefined ? undefined : createOutputBuffer(device, props.maskLength);
  const graph = new GPUCommandGraph(device);
  const index = new GPUGridIndex({
    positions: importView(graph, 'positions', positions, props.format, positionCount) as never,
    gridSize: props.gridSize,
    bounds: props.bounds,
    cellOffsets: importView(graph, 'cell-offsets', cellOffsets, 'uint32', cellCount + 1),
    objectIds: importView(graph, 'object-ids', objectIds, 'uint32', indexCapacity),
    count: importView(graph, 'index-count', indexCount, 'uint32', 1),
    overflow: importView(graph, 'index-overflow', indexOverflow, 'uint32', 1)
  });
  index.addToGraph(graph);
  new GPUGridIndexQuery({
    index,
    kind: props.kind,
    query: importView(graph, 'query', query, 'float32', props.query.length),
    output: importView(graph, 'output', output, 'uint32', props.outputCapacity),
    count: importView(graph, 'output-count', outputCount, 'uint32', 1),
    overflow: importView(graph, 'output-overflow', outputOverflow, 'uint32', 1),
    outputMask: outputMask
      ? importView(graph, 'output-mask', outputMask, 'uint32', props.maskLength!)
      : undefined
  }).addToGraph(graph);
  return {
    compiled: graph.compile(),
    query,
    output,
    outputCount,
    outputOverflow,
    outputMask,
    outputCapacity: props.outputCapacity,
    buffers: [
      positions,
      query,
      cellOffsets,
      objectIds,
      indexCount,
      indexOverflow,
      output,
      outputCount,
      outputOverflow,
      ...(outputMask ? [outputMask] : [])
    ]
  };
}

async function readQueryResult(
  fixture: QueryFixture
): Promise<{ids: number[]; count: number; overflow: number}> {
  const count = (await readUint32(fixture.outputCount, 1))[0];
  return {
    ids: await readUint32(fixture.output, Math.min(count, fixture.outputCapacity)),
    count,
    overflow: (await readUint32(fixture.outputOverflow, 1))[0]
  };
}

function destroyFixture(fixture: QueryFixture): void {
  fixture.compiled.destroy();
  for (const buffer of fixture.buffers) buffer.destroy();
}

function encode(device: Device, compiled: ReturnType<GPUCommandGraph['compile']>): void {
  const commandEncoder = device.createCommandEncoder({id: 'grid-index-query-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
}

function createInputBuffer(device: Device, values: Float32Array): Buffer {
  return device.createBuffer({data: values, usage: Buffer.STORAGE | Buffer.COPY_DST});
}

function createOutputBuffer(device: Device, length: number): Buffer {
  return device.createBuffer({
    byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function importView<T extends 'float32x2' | 'float32x3' | 'float32' | 'uint32'>(
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

function sortNumbers(left: number, right: number): number {
  return left - right;
}
