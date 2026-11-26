import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUGridAggregation,
  GPUGridBinning,
  GPUGridIndex,
  GPUGridIndexQuery,
  type GPUGridIndexBounds,
  type GPUGridIndexQueryKind,
  type GPUGridIndexSize
} from '@luma.gl/graph/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';

const POSITIONS_2D = Float32Array.from([
  0.25, 0.25, 0.75, 0.75, 1.25, 0.25, 0.25, 1.25, 1.25, 1.25, 1.75, 1.75
]);

it('GPUGridIndexQuery selects point cells and refreshes IDs and masks', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect((await readQueryResult(fixture)).ids.sort(sortNumbers)).toEqual([0, 1]);
  expect(await readUint32(fixture.outputMask!, 6)).toEqual([1, 1, 0, 0, 0, 0]);

  fixture.query.write(Float32Array.from([1, 0.5]));
  encode(device, fixture.compiled);
  expect(
    await readQueryResult(fixture),
    'an internal boundary selects the same upper cell used by index construction'
  ).toEqual({ids: [2], count: 1, overflow: 0});
  expect(
    await readUint32(fixture.outputMask!, 6),
    'each encoding clears the previous source-aligned mask'
  ).toEqual([0, 0, 1, 0, 0, 0]);
  destroyFixture(fixture);
});

it('GPUGridIndexQuery returns conservative bounds and radius candidates', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(
    (await readQueryResult(boundsFixture)).ids.sort(sortNumbers),
    'bounds return the containing-cell candidates, including a documented false positive'
  ).toEqual([0, 1]);
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
  expect(
    (await readQueryResult(radiusFixture)).ids.sort(sortNumbers),
    'radius rejects a diagonally distant cell while preserving intersecting candidates'
  ).toEqual([0, 1, 2, 3]);
  destroyFixture(radiusFixture);
});

it('GPUGridIndexQuery reports query and source-index overflow independently', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(outputResult.count, 'candidate count reports required output capacity').toBe(6);
  expect(outputResult.ids.length, 'candidate storage remains bounded').toBe(2);
  expect(outputResult.overflow, 'candidate truncation sets overflow').toBe(1);
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
  expect(
    await readQueryResult(indexOverflow),
    'an overflowed source index marks even an otherwise empty stored-prefix result incomplete'
  ).toEqual({ids: [], count: 0, overflow: 1});
  destroyFixture(indexOverflow);
});

it('GPUGridIndexQuery selects 3D point cells', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(await readQueryResult(fixture)).toEqual({ids: [2], count: 1, overflow: 0});
  destroyFixture(fixture);
});

it('GPUGridIndexQuery handles extreme domains and exponential WGSL literals', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(
    await readQueryResult(pointFixture),
    'cross-zero normalization agrees with index construction'
  ).toEqual({ids: [0], count: 1, overflow: 0});
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
  expect(
    (await readQueryResult(radiusFixture)).ids.sort(sortNumbers),
    'overflow-safe cell boundaries preserve both cells touching the query radius'
  ).toEqual([0, 1]);
  destroyFixture(radiusFixture);
});

it('GPUGridIndexQuery rejects overlapping inputs and writable results', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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

  expect(
    () =>
      new GPUGridIndexQuery({
        index,
        kind: 'point',
        query,
        output: view('uint32', 2, 20),
        count: view('uint32', 1, 56),
        overflow
      }),
    'query writes cannot alias live index reads'
  ).toThrow(/output and index objectIds must not overlap/);
  expect(
    () =>
      new GPUGridIndexQuery({
        index,
        kind: 'point',
        query,
        output: view('uint32', 2, 64),
        count: view('uint32', 1, 68),
        overflow
      }),
    'writable result views cannot race each other'
  ).toThrow(/count and output must not overlap/);

  buffer.destroy();
});

it('assigns cross-zero boundary points to the same cells in all grid operations', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const gridSize = [360, 1] as const;
  const bounds = [-180, 0, 180, 1] as const;
  const coordinates = [-180, -177.25, -177, 0, 180];
  const expectedCells = [0, 2, 3, 180, 359];
  const weights = Float32Array.from([1, 2, 4, 8, 16]);
  const fixture = createQueryFixture(device, {
    positions: Float32Array.from(coordinates.flatMap(coordinate => [coordinate, 0.5])),
    format: 'float32x2',
    gridSize,
    bounds,
    kind: 'point',
    query: Float32Array.from([-177, 0.5]),
    outputCapacity: coordinates.length,
    comparison: {gridSize, bounds, weights}
  });

  try {
    encode(device, fixture.compiled);
    const offsets = await readUint32(fixture.cellOffsets, 361);
    const expectedCounts = Array<number>(360).fill(0);
    const expectedSums = Array<number>(360).fill(0);
    for (const [index, cell] of expectedCells.entries()) {
      expectedCounts[cell] = 1;
      expectedSums[cell] = weights[index];
    }
    expect(offsets.slice(1).map((end, cell) => end - offsets[cell])).toEqual(expectedCounts);
    expect(await readUint32(fixture.binning!, 360)).toEqual(expectedCounts);
    const bytes = await fixture.aggregation!.readAsync();
    expect(Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 360))).toEqual(expectedSums);

    for (const [index, coordinate] of coordinates.entries()) {
      fixture.query.write(Float32Array.from([coordinate, 0.5]));
      encode(device, fixture.compiled);
      expect(await readQueryResult(fixture)).toEqual({ids: [index], count: 1, overflow: 0});
    }
  } finally {
    destroyFixture(fixture);
  }
});

type QueryFixture = {
  compiled: ReturnType<GPUCommandGraph['compile']>;
  query: Buffer;
  cellOffsets: Buffer;
  binning?: Buffer;
  aggregation?: Buffer;
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
    comparison?: {
      gridSize: readonly [number, number];
      bounds: readonly [number, number, number, number];
      weights: Float32Array;
    };
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
  const positionView =
    props.format === 'float32x2'
      ? importView(graph, 'positions', positions, 'float32x2', positionCount)
      : importView(graph, 'positions', positions, 'float32x3', positionCount);
  const index = new GPUGridIndex({
    positions: positionView,
    gridSize: props.gridSize,
    bounds: props.bounds,
    cellOffsets: importView(graph, 'cell-offsets', cellOffsets, 'uint32', cellCount + 1),
    objectIds: importView(graph, 'object-ids', objectIds, 'uint32', indexCapacity),
    count: importView(graph, 'index-count', indexCount, 'uint32', 1),
    overflow: importView(graph, 'index-overflow', indexOverflow, 'uint32', 1)
  });
  graph.add(index);
  graph.add(
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
    })
  );
  let binning: Buffer | undefined;
  let aggregation: Buffer | undefined;
  const comparisonBuffers: Buffer[] = [];
  if (props.comparison) {
    const {gridSize, bounds, weights} = props.comparison;
    binning = createOutputBuffer(device, cellCount);
    aggregation = createOutputBuffer(device, cellCount);
    const weightBuffer = createInputBuffer(device, weights);
    comparisonBuffers.push(binning, aggregation, weightBuffer);
    if (positionView.format !== 'float32x2') throw new Error('Expected 2D comparison positions');
    graph.add(
      new GPUGridBinning({
        positions: positionView,
        gridSize,
        bounds,
        output: importView(graph, 'binning', binning, 'uint32', cellCount)
      })
    );
    graph.add(
      new GPUGridAggregation({
        positions: positionView,
        gridSize,
        bounds,
        weights: importView(graph, 'weights', weightBuffer, 'float32', positionCount),
        output: importView(graph, 'aggregation', aggregation, 'float32', cellCount)
      })
    );
  }
  return {
    compiled: graph.compile(),
    cellOffsets,
    binning,
    aggregation,
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
      ...comparisonBuffers,
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
