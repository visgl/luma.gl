// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  type CompiledGPUCommandGraph,
  GPUCommandGraph,
  GPUGridIndex,
  type GPUGridIndexBounds,
  type GPUGridIndexSize,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';
import {GPUPointSpatialQuery, type GPUPointSpatialQueryKind} from '../../src/geospatial';

it('GPUPointSpatialQuery scans bounds and radius predicates in 2D and 3D', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }
  const softwareBackedDevice = isSoftwareBackedDevice(device);
  if (softwareBackedDevice) {
    void 0;
  }

  const cases: QueryFixtureProps[] = [
    {
      id: 'unindexed-2d-bounds',
      positions: Float32Array.from([
        0,
        0,
        1,
        1,
        2,
        2,
        2.01,
        1,
        Number.NaN,
        1,
        Number.POSITIVE_INFINITY,
        0,
        -1,
        0
      ]),
      dimension: 2,
      kind: 'bounds',
      query: Float32Array.from([0, 0, 2, 2]),
      expectedIds: [0, 1, 2]
    },
    {
      id: 'unindexed-2d-radius',
      positions: Float32Array.from([0, 0, 3, 4, 4, 4, -3, -4, Number.NaN, 0, 3.0001, 4]),
      sourceIds: Uint32Array.from([10, 11, 12, 13, 14, 15]),
      dimension: 2,
      kind: 'radius',
      query: Float32Array.from([0, 0, 5]),
      expectedIds: [10, 11, 13]
    },
    {
      id: 'unindexed-3d-bounds',
      positions: Float32Array.from([
        0,
        0,
        0,
        1,
        2,
        3,
        2,
        3,
        4,
        1,
        1,
        4.01,
        0,
        Number.NEGATIVE_INFINITY,
        0
      ]),
      dimension: 3,
      kind: 'bounds',
      query: Float32Array.from([-1, -1, -1, 2, 3, 4]),
      expectedIds: [0, 1, 2]
    },
    {
      id: 'unindexed-3d-radius',
      positions: Float32Array.from([
        0,
        0,
        0,
        1,
        2,
        2,
        3,
        3,
        0,
        -1,
        -2,
        -2,
        0,
        Number.NaN,
        0,
        1.0001,
        2,
        2
      ]),
      dimension: 3,
      kind: 'radius',
      query: Float32Array.from([0, 0, 0, 3]),
      expectedIds: [0, 1, 3]
    }
  ].filter(testCase => !softwareBackedDevice || testCase.kind !== 'radius');

  for (const testCase of cases) {
    const fixture = createQueryFixture(device, testCase);
    encode(device, fixture.compiled);
    expect((await readResult(fixture)).ids.sort(sortNumbers), testCase.id).toEqual(
      testCase.expectedIds
    );
    destroyFixture(fixture);
  }

  void 0;
});

it('GPUPointSpatialQuery preserves exact radius boundaries and subnormals', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }
  if (isSoftwareBackedDevice(device)) {
    void 0;
    void 0;
    return;
  }

  const minimumSubnormal = 2 ** -149;
  const fixture = createQueryFixture(device, {
    id: 'unindexed-2d-radius-adversarial',
    positions: Float32Array.from([
      265,
      0,
      Math.fround(265 + 2 ** -15),
      0,
      -265,
      0,
      0,
      0,
      85,
      251,
      96,
      247,
      0,
      265,
      minimumSubnormal,
      0,
      2 * minimumSubnormal,
      0,
      265,
      minimumSubnormal
    ]),
    dimension: 2,
    kind: 'radius',
    query: Float32Array.from([0, 0, 265]),
    expectedIds: [0, 2, 3, 5, 6, 7, 8]
  });

  encode(device, fixture.compiled);
  expect(
    (await readResult(fixture)).ids.sort(sortNumbers),
    'one-ULP and multi-axis outside rows are rejected while exact boundaries remain inclusive'
  ).toEqual([0, 2, 3, 5, 6, 7, 8]);

  fixture.query.write(Float32Array.from([0, 0, minimumSubnormal]));
  encode(device, fixture.compiled);
  expect(
    (await readResult(fixture)).ids.sort(sortNumbers),
    'the same compiled graph preserves the minimum-subnormal inclusive boundary'
  ).toEqual([3, 7]);

  destroyFixture(fixture);
  void 0;
});

it('GPUPointSpatialQuery rejects outside radii at large coordinate offsets', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }
  if (isSoftwareBackedDevice(device)) {
    void 0;
    void 0;
    return;
  }

  const center = 10_000_000_000;
  const radius = 2048;
  const sharedProps = {
    positions: Float32Array.from([
      center,
      center,
      center + 1024,
      center,
      center + radius,
      center,
      center + 3072,
      center,
      center,
      center + 4096,
      center - radius,
      center,
      center + 1024,
      center + 1024
    ]),
    dimension: 2 as const,
    kind: 'radius' as const,
    query: Float32Array.from([center, center, radius]),
    gridSize: [4, 4] as const,
    indexBounds: [center - 8192, center - 8192, center + 8192, center + 8192] as const,
    expectedIds: [0, 1, 2, 5, 6]
  };
  const indexed = createQueryFixture(device, {
    id: 'indexed-large-offset-radius',
    ...sharedProps,
    indexed: true
  });
  const scanned = createQueryFixture(device, {
    id: 'scanned-large-offset-radius',
    ...sharedProps
  });

  encode(device, indexed.compiled);
  encode(device, scanned.compiled);
  const indexedIds = (await readResult(indexed)).ids.sort(sortNumbers);
  const scannedIds = (await readResult(scanned)).ids.sort(sortNumbers);
  expect(scannedIds, 'delta-relative scaling rejects offsets that dwarf the small radius').toEqual(
    sharedProps.expectedIds
  );
  expect(indexedIds, 'the grid broad phase preserves the exact result').toEqual(scannedIds);

  destroyFixture(indexed);
  destroyFixture(scanned);
  void 0;
});

it('GPUPointSpatialQuery keeps indexed row addressing separate from returned source IDs', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const sharedProps = {
    positions: Float32Array.from([
      0.25,
      0.25,
      0.75,
      0.75,
      1.25,
      0.5,
      2.5,
      2.5,
      3.5,
      3.5,
      Number.NaN,
      1,
      4,
      4
    ]),
    sourceIds: Uint32Array.from([1010, 1010, 3030, 4040, 5050, 6060, 7070]),
    dimension: 2 as const,
    kind: 'bounds' as const,
    query: Float32Array.from([0, 0, 1, 1]),
    gridSize: [4, 4] as const,
    indexBounds: [0, 0, 4, 4] as const
  };
  const indexed = createQueryFixture(device, {
    id: 'indexed-source-ids',
    ...sharedProps,
    indexed: true,
    expectedIds: [1010, 1010]
  });
  const scanned = createQueryFixture(device, {
    id: 'scanned-source-ids',
    ...sharedProps,
    expectedIds: [1010, 1010]
  });

  encode(device, indexed.compiled);
  encode(device, scanned.compiled);
  expect(
    (await readResult(indexed)).ids.sort(sortNumbers),
    'the indexed path dereferences row indices without deduplicating application IDs'
  ).toEqual([1010, 1010]);
  expect(
    (await readResult(scanned)).ids.sort(sortNumbers),
    'the scan path emits the same duplicate application IDs'
  ).toEqual([1010, 1010]);

  indexed.query.write(Float32Array.from([2, 2, 4, 4]));
  scanned.query.write(Float32Array.from([2, 2, 4, 4]));
  encode(device, indexed.compiled);
  encode(device, scanned.compiled);
  const indexedUpdated = await readResult(indexed);
  const scannedUpdated = await readResult(scanned);
  expect(
    indexedUpdated.ids.sort(sortNumbers),
    'an indexed query reads updated values on a later encoding without recompilation'
  ).toEqual([4040, 5050, 7070]);
  expect(
    scannedUpdated.ids.sort(sortNumbers),
    'indexed and unindexed results remain equivalent after mutation'
  ).toEqual([4040, 5050, 7070]);
  expect(indexedUpdated.count, 'the clamped result count is refreshed').toBe(3);
  expect(indexedUpdated.totalCount, 'the diagnostic total count is refreshed').toBe(3);
  expect(indexedUpdated.overflow, 'the rebuilt index and result both fit capacity').toBe(0);

  destroyFixture(indexed);
  destroyFixture(scanned);
  void 0;
});

it('GPUPointSpatialQuery preserves duplicate source IDs as distinct matching rows', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const sharedProps = {
    positions: Float32Array.from([0.25, 0.25, 0.75, 0.75, 1.25, 0.5, 2.5, 2.5]),
    sourceIds: Uint32Array.from([42, 42, 7, 42]),
    dimension: 2 as const,
    kind: 'bounds' as const,
    query: Float32Array.from([0, 0, 1, 1]),
    gridSize: [4, 4] as const,
    indexBounds: [0, 0, 4, 4] as const,
    expectedIds: [42, 42]
  };
  const indexed = createQueryFixture(device, {
    id: 'indexed-duplicate-source-ids',
    ...sharedProps,
    indexed: true
  });
  const scanned = createQueryFixture(device, {
    id: 'scanned-duplicate-source-ids',
    ...sharedProps
  });

  encode(device, indexed.compiled);
  encode(device, scanned.compiled);
  const indexedResult = await readResult(indexed);
  const scannedResult = await readResult(scanned);
  expect(
    indexedResult.ids.sort(sortNumbers),
    'the indexed path does not deduplicate equal application IDs from separate rows'
  ).toEqual([42, 42]);
  expect(
    scannedResult.ids.sort(sortNumbers),
    'the scan path preserves the same duplicate application IDs'
  ).toEqual([42, 42]);
  expect(indexedResult.count, 'both matching rows contribute to the clamped count').toBe(2);
  expect(indexedResult.totalCount, 'both matching rows contribute to totalCount').toBe(2);

  destroyFixture(indexed);
  destroyFixture(scanned);
  void 0;
});

it('GPUPointSpatialQuery applies even-odd polygon holes and includes ring boundaries', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }
  const fixture = createQueryFixture(device, {
    id: 'polygon-holes-and-boundaries',
    positions: Float32Array.from([
      1,
      1,
      3,
      3,
      0,
      3,
      2,
      3,
      6,
      6,
      7,
      1,
      2,
      2,
      0,
      6,
      Number.NaN,
      1,
      4.5,
      3
    ]),
    dimension: 2,
    kind: 'polygon',
    query: Float32Array.from([0, 0, 6, 6]),
    polygonPositions: Float32Array.from([
      0, 0, 6, 0, 6, 6, 0, 6, 0, 6, 2, 2, 4, 2, 4, 4, 2, 4, 2, 4
    ]),
    ringOffsets: Uint32Array.from([0, 5, 10]),
    expectedIds: [0, 2, 3, 4, 6, 7, 9]
  });

  encode(device, fixture.compiled);
  const result = await readResult(fixture);
  expect(
    result.ids.sort(sortNumbers),
    'shell points and outer/hole boundaries match while hole interiors and outside points do not'
  ).toEqual([0, 2, 3, 4, 6, 7, 9]);
  expect(result.overflow, '').toBe(0);

  destroyFixture(fixture);
  void 0;
});

it('GPUPointSpatialQuery writes source IDs during indexed polygon refinement', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    void 0;
    void 0;
    return;
  }
  expect(
    device.limits.maxStorageBuffersPerShaderStage,
    'the core device exercises the portable storage-binding limit'
  ).toBe(8);

  const fixture = createQueryFixture(device, {
    id: 'indexed-polygon-source-ids',
    positions: Float32Array.from([1, 1, 3, 3, 7, 7]),
    sourceIds: Uint32Array.from([101, 202, 303]),
    dimension: 2,
    kind: 'polygon',
    query: Float32Array.from([0, 0, 6, 6]),
    polygonPositions: Float32Array.from([0, 0, 6, 0, 6, 6, 0, 6]),
    ringOffsets: Uint32Array.from([0, 4]),
    indexed: true,
    gridSize: [2, 2],
    indexBounds: [0, 0, 8, 8],
    expectedIds: [101, 202]
  });

  encode(device, fixture.compiled);
  expect(
    (await readResult(fixture)).ids.sort(sortNumbers),
    'the refinement emits application source IDs directly'
  ).toEqual([101, 202]);

  destroyFixture(fixture);
  void 0;
});

it('GPUPointSpatialQuery handles empty inputs and zero-capacity output', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createQueryFixture(device, {
    id: 'empty-point-query',
    positions: new Float32Array(0),
    dimension: 2,
    kind: 'bounds',
    query: Float32Array.from([0, 0, 1, 1]),
    capacity: 0,
    expectedIds: []
  });
  encode(device, fixture.compiled);

  expect(await readResult(fixture), '').toEqual({
    ids: [],
    count: 0,
    overflow: 0,
    totalCount: 0
  });

  destroyFixture(fixture);
  void 0;
});

type QueryFixtureProps = {
  id: string;
  positions: Float32Array;
  sourceIds?: Uint32Array;
  dimension: 2 | 3;
  kind: GPUPointSpatialQueryKind;
  query: Float32Array;
  indexed?: boolean;
  gridSize?: GPUGridIndexSize;
  indexBounds?: GPUGridIndexBounds;
  polygonPositions?: Float32Array;
  ringOffsets?: Uint32Array;
  capacity?: number;
  expectedIds: number[];
};

type QueryFixture = {
  compiled: CompiledGPUCommandGraph<void>;
  query: Buffer;
  output: {
    ids: Buffer;
    count: Buffer;
    overflow: Buffer;
    totalCount: Buffer;
  };
  buffers: Buffer[];
};

function createQueryFixture(device: Device, props: QueryFixtureProps): QueryFixture {
  const length = props.positions.length / props.dimension;
  const capacity = props.capacity ?? length;
  const positionsBuffer = createInputBuffer(
    device,
    props.positions,
    props.dimension * Float32Array.BYTES_PER_ELEMENT
  );
  const queryBuffer = createInputBuffer(device, props.query);
  const sourceIdsBuffer = props.sourceIds ? createInputBuffer(device, props.sourceIds) : undefined;
  const output = {
    ids: createOutputBuffer(device, capacity),
    count: createOutputBuffer(device, 1),
    overflow: createOutputBuffer(device, 1),
    totalCount: createOutputBuffer(device, 1)
  };
  const graph = new GPUCommandGraph(device, {id: props.id});
  const positions =
    props.dimension === 2
      ? importView(graph, `${props.id}-positions`, positionsBuffer, 'float32x2', length)
      : importView(graph, `${props.id}-positions`, positionsBuffer, 'float32x3', length);
  const query = importView(graph, `${props.id}-query`, queryBuffer, 'float32', props.query.length);
  const sourceIds = sourceIdsBuffer
    ? importView(graph, `${props.id}-source-ids`, sourceIdsBuffer, 'uint32', length)
    : undefined;
  const buffers = [positionsBuffer, queryBuffer, ...(sourceIdsBuffer ? [sourceIdsBuffer] : [])];

  let index: ConstructorParameters<typeof GPUPointSpatialQuery>[0]['index'];
  if (props.indexed) {
    if (!props.gridSize || !props.indexBounds) {
      throw new Error('indexed test fixtures require gridSize and indexBounds');
    }
    const cellCount = props.gridSize.reduce((product, size) => product * size, 1);
    const cellOffsetsBuffer = createOutputBuffer(device, cellCount + 1);
    const rowIndicesBuffer = createOutputBuffer(device, length);
    const indexCountBuffer = createOutputBuffer(device, 1);
    const indexOverflowBuffer = createOutputBuffer(device, 1);
    const cellOffsets = importView(
      graph,
      `${props.id}-cell-offsets`,
      cellOffsetsBuffer,
      'uint32',
      cellCount + 1
    );
    const rowIndices = importView(
      graph,
      `${props.id}-row-indices`,
      rowIndicesBuffer,
      'uint32',
      length
    );
    const indexCount = importView(graph, `${props.id}-index-count`, indexCountBuffer, 'uint32', 1);
    const indexOverflow = importView(
      graph,
      `${props.id}-index-overflow`,
      indexOverflowBuffer,
      'uint32',
      1
    );
    new GPUGridIndex({
      id: `${props.id}-index`,
      positions,
      gridSize: props.gridSize,
      bounds: props.indexBounds,
      cellOffsets,
      objectIds: rowIndices,
      count: indexCount,
      overflow: indexOverflow
    }).addToGraph(graph);
    index = {
      gridSize: props.gridSize,
      bounds: props.indexBounds,
      cellOffsets,
      rowIndices,
      count: indexCount,
      overflow: indexOverflow
    };
    buffers.push(cellOffsetsBuffer, rowIndicesBuffer, indexCountBuffer, indexOverflowBuffer);
  }

  let polygon: ConstructorParameters<typeof GPUPointSpatialQuery>[0]['polygon'];
  if (props.polygonPositions && props.ringOffsets) {
    const polygonPositionsBuffer = createInputBuffer(device, props.polygonPositions);
    const ringOffsetsBuffer = createInputBuffer(device, props.ringOffsets);
    polygon = {
      positions: importView(
        graph,
        `${props.id}-polygon-positions`,
        polygonPositionsBuffer,
        'float32x2',
        props.polygonPositions.length / 2
      ),
      ringOffsets: importView(
        graph,
        `${props.id}-ring-offsets`,
        ringOffsetsBuffer,
        'uint32',
        props.ringOffsets.length
      )
    };
    buffers.push(polygonPositionsBuffer, ringOffsetsBuffer);
  }

  const ids = importView(graph, `${props.id}-ids`, output.ids, 'uint32', capacity);
  const count = importView(graph, `${props.id}-count`, output.count, 'uint32', 1);
  const overflow = importView(graph, `${props.id}-overflow`, output.overflow, 'uint32', 1);
  const totalCount = importView(graph, `${props.id}-total-count`, output.totalCount, 'uint32', 1);
  new GPUPointSpatialQuery({
    id: `${props.id}-query-contributor`,
    positions,
    sourceIds,
    index,
    kind: props.kind,
    query,
    polygon,
    output: {ids, count, overflow, totalCount}
  }).addToGraph(graph);

  buffers.push(output.ids, output.count, output.overflow, output.totalCount);
  return {compiled: graph.compile(), query: queryBuffer, output, buffers};
}

async function readResult(fixture: QueryFixture): Promise<{
  ids: number[];
  count: number;
  overflow: number;
  totalCount: number;
}> {
  const [count] = await readUint32(fixture.output.count, 1);
  const [overflow] = await readUint32(fixture.output.overflow, 1);
  const [totalCount] = await readUint32(fixture.output.totalCount, 1);
  return {
    ids: await readUint32(fixture.output.ids, count),
    count,
    overflow,
    totalCount
  };
}

function createInputBuffer(
  device: Device,
  values: Float32Array | Uint32Array,
  minimumByteLength = Uint32Array.BYTES_PER_ELEMENT
): Buffer {
  if (values.byteLength === 0) {
    return device.createBuffer({
      byteLength: minimumByteLength,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
  }
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
): GraphDataView<T> {
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

function encode(device: Device, compiled: CompiledGPUCommandGraph<void>): void {
  const commandEncoder = device.createCommandEncoder({id: 'gpu-point-spatial-query-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
}

function destroyFixture(fixture: QueryFixture): void {
  fixture.compiled.destroy();
  for (const buffer of fixture.buffers) buffer.destroy();
}

function sortNumbers(left: number, right: number): number {
  return left - right;
}

function isSoftwareBackedDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}
