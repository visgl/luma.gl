// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import * as experimentalModule from '@luma.gl/experimental';
import {
  GPUGraph,
  GPUGraphForceLayout,
  GPUGraphSpatialForceLayout,
  GPUGraphTopology,
  type GPUGraphAdjacency,
  type GPUGraphSpatialForceLayoutProps
} from '@luma.gl/gpgpu/gpu-graph';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {NullDevice} from '@luma.gl/test-utils';
import {afterEach, describe, expect, test, vi} from 'vitest';

type VectorFormat = 'uint32' | 'float32' | 'float32x2';
type VectorValues = Uint32Array | Float32Array;

type SpatialFixture = {
  device: NullDevice;
  buffers: Buffer[];
  dynamicBuffers: DynamicBuffer[];
  vectors: GPUVector[];
};

type VectorOptions = {
  buffer?: Buffer | DynamicBuffer;
  byteOffset?: number;
  byteStride?: number;
  rowByteLength?: number;
  stride?: number;
};

const spatialFixtures: SpatialFixture[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const fixture of spatialFixtures.splice(0)) {
    for (const vector of fixture.vectors) vector.destroy();
    for (const dynamicBuffer of fixture.dynamicBuffers) dynamicBuffer.destroy();
    for (const buffer of fixture.buffers) buffer.destroy();
    fixture.device.destroy();
  }
});

describe('GPUGraphSpatialForceLayout composition and caller-owned grid resources', () => {
  test('exposes spatial acceleration only through the optional GPU Graph package entry', () => {
    expect(typeof GPUGraphSpatialForceLayout).toBe('function');
    expect('GPUGraphSpatialForceLayout' in experimentalModule).toBe(false);
  });

  test('retains the exact base layout and every grid buffer without hidden GPU operations', () => {
    const fixture = createSpatialFixture();
    const props = createSpatialProps(fixture, {weighted: true, pinned: true, reset: true});
    const createBufferSpy = vi.spyOn(fixture.device, 'createBuffer');
    const createCommandEncoderSpy = vi.spyOn(fixture.device, 'createCommandEncoder');
    const submitSpy = vi.spyOn(fixture.device, 'submit');
    const readbackSpies = fixture.buffers.map(buffer => vi.spyOn(buffer, 'readAsync'));

    const spatial = new GPUGraphSpatialForceLayout({...props, id: 'borrowed-spatial-layout'});

    expect(spatial.id).toBe('borrowed-spatial-layout');
    expect(spatial.layout).toBe(props.layout);
    expect(spatial.gridSize).toBe(props.gridSize);
    expect(spatial.bounds).toBe(props.bounds);
    expect(spatial.cellCount).toBe(6);
    expect(spatial.theta).toBe(0.6);
    expect(spatial.nearCellRadius).toBe(1);
    expect(spatial.cellOffsets).toBe(props.cellOffsets);
    expect(spatial.vertexIds).toBe(props.vertexIds);
    expect(spatial.cellCenters).toBe(props.cellCenters);
    expect(spatial.count).toBe(props.count);
    expect(spatial.overflow).toBe(props.overflow);
    expect(spatial.layout.positions).toBe(props.layout.positions);
    expect(spatial.layout.topology.graph.sourceVertices.data.map(chunk => chunk.length)).toEqual([
      2, 0, 3
    ]);
    expect(createBufferSpy).not.toHaveBeenCalled();
    expect(createCommandEncoderSpy).not.toHaveBeenCalled();
    expect(submitSpy).not.toHaveBeenCalled();
    for (const readbackSpy of readbackSpies) expect(readbackSpy).not.toHaveBeenCalled();
    expect(Reflect.has(spatial, 'destroy')).toBe(false);

    for (const vector of fixture.vectors) vector.destroy();
    expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);
  });

  test('accepts empty graphs and zero-capacity caller-owned vertex-ID indexes', () => {
    const fixture = createSpatialFixture();
    const props = createSpatialProps(fixture, {vertexCount: 0, vertexCapacity: 0, reset: true});
    const spatial = new GPUGraphSpatialForceLayout(props);

    expect(spatial.layout.positions.length).toBe(0);
    expect(spatial.vertexIds.length).toBe(0);
    expect(spatial.cellOffsets.length).toBe(spatial.cellCount + 1);
    expect(spatial.cellCenters.length).toBe(spatial.cellCount);
    expect(spatial.layout.reset?.length).toBe(1);
  });
});

describe('GPUGraphSpatialForceLayout finite grid and honest approximation contracts', () => {
  test.each([
    0, 0.001, 0.6, 1, 100
  ])('accepts a nonnegative finite opening criterion: %s', theta => {
    const fixture = createSpatialFixture();
    expect(new GPUGraphSpatialForceLayout({...createSpatialProps(fixture), theta}).theta).toBe(
      theta
    );
  });

  test.each([
    -0.001,
    Number.NaN,
    Number.NEGATIVE_INFINITY,
    Number.POSITIVE_INFINITY
  ])('rejects an invalid far-cell opening criterion: %s', theta => {
    const fixture = createSpatialFixture();
    expect(() => new GPUGraphSpatialForceLayout({...createSpatialProps(fixture), theta})).toThrow(
      /theta|finite|negative/
    );
  });

  test.each([
    0, 1, 5, 0xffffffff
  ])('accepts an unsigned exact near-cell radius: %s', nearCellRadius => {
    const fixture = createSpatialFixture();
    expect(
      new GPUGraphSpatialForceLayout({...createSpatialProps(fixture), nearCellRadius})
        .nearCellRadius
    ).toBe(nearCellRadius);
  });

  test.each([
    -1,
    1.5,
    0x100000000,
    Number.NaN,
    Number.POSITIVE_INFINITY
  ])('rejects an invalid exact near-cell radius: %s', nearCellRadius => {
    const fixture = createSpatialFixture();
    expect(
      () => new GPUGraphSpatialForceLayout({...createSpatialProps(fixture), nearCellRadius})
    ).toThrow(/nearCellRadius|uint32|negative/);
  });

  test.each([
    ['empty x dimension', [0, 2]],
    ['negative y dimension', [2, -1]],
    ['fractional dimension', [1.5, 2]],
    ['non-finite dimension', [2, Number.POSITIVE_INFINITY]],
    ['missing dimension', [2]],
    ['unexpected z dimension', [2, 2, 2]],
    ['overflowing cell product', [65536, 65536]],
    ['overflowing trailing offset', [0xffffffff, 1]]
  ] as [
    string,
    number[]
  ][])('rejects invalid two-dimensional grid shape: %s', (_name, gridSize) => {
    const fixture = createSpatialFixture();
    expect(
      () =>
        new GPUGraphSpatialForceLayout({
          ...createSpatialProps(fixture),
          gridSize: gridSize as unknown as readonly [number, number]
        })
    ).toThrow(/gridSize|grid|dimension|cell|uint32/);
  });

  test.each([
    ['equal x endpoints', [0, -1, 0, 1]],
    ['equal y endpoints', [-1, 0, 1, 0]],
    ['reversed x endpoints', [1, -1, -1, 1]],
    ['reversed y endpoints', [-1, 1, 1, -1]],
    ['non-finite minimum', [Number.NaN, -1, 1, 1]],
    ['non-finite maximum', [-1, -1, Number.POSITIVE_INFINITY, 1]],
    ['missing axis bound', [-1, -1, 1]]
  ] as [string, number[]][])('rejects invalid strict index bounds: %s', (_name, bounds) => {
    const fixture = createSpatialFixture();
    expect(
      () =>
        new GPUGraphSpatialForceLayout({
          ...createSpatialProps(fixture),
          bounds: bounds as unknown as readonly [number, number, number, number]
        })
    ).toThrow(/bounds|finite|increasing|extent/);
  });
});

describe('GPUGraphSpatialForceLayout packed index outputs and physical allocation safety', () => {
  test.each([6, 8])('requires one exclusive offset per cell plus a trailing total: %i', length => {
    const fixture = createSpatialFixture();
    const props = createSpatialProps(fixture);
    const cellOffsets = createVector(fixture, 'incorrect-offsets', 'uint32', [
      new Uint32Array(length)
    ]);
    expect(() => new GPUGraphSpatialForceLayout({...props, cellOffsets})).toThrow(
      /cellOffsets|row|cell/
    );
  });

  test.each([5, 7])('requires one float32x2 center per row-major grid cell: %i', length => {
    const fixture = createSpatialFixture();
    const props = createSpatialProps(fixture);
    const cellCenters = createVector(fixture, 'incorrect-centers', 'float32x2', [
      new Float32Array(length * 2)
    ]);
    expect(() => new GPUGraphSpatialForceLayout({...props, cellCenters})).toThrow(
      /cellCenters|row|cell/
    );
  });

  test.each([
    'cellOffsets',
    'vertexIds',
    'count',
    'overflow'
  ] as const)('requires packed unsigned scalar index data in %s', name => {
    const fixture = createSpatialFixture();
    const props = createSpatialProps(fixture);
    const expectedLength = name === 'cellOffsets' ? 7 : name === 'vertexIds' ? 6 : 1;
    const wrongFormat = createVector(fixture, `float-${name}`, 'float32', [
      new Float32Array(expectedLength)
    ]);
    expect(() => new GPUGraphSpatialForceLayout({...props, [name]: wrongFormat})).toThrow(
      new RegExp(`${name}|uint32|packed`)
    );
  });

  test('requires float32x2 centers rather than uint32 or float32 scalars', () => {
    const fixture = createSpatialFixture();
    const props = createSpatialProps(fixture);
    const wrongFormat = createVector(fixture, 'scalar-centers', 'float32', [new Float32Array(6)]);
    expect(
      () =>
        new GPUGraphSpatialForceLayout({
          ...props,
          cellCenters: wrongFormat as GPUVector<'float32x2'>
        })
    ).toThrow(/cellCenters|float32x2|packed/);
  });

  test.each([
    'cellOffsets',
    'vertexIds',
    'cellCenters',
    'count',
    'overflow'
  ] as const)('rejects partitioned caller-owned %s output', name => {
    const fixture = createSpatialFixture();
    const props = createSpatialProps(fixture);
    const vector =
      name === 'cellCenters'
        ? createVector(fixture, `partitioned-${name}`, 'float32x2', [
            new Float32Array(12),
            new Float32Array(0)
          ])
        : createVector(fixture, `partitioned-${name}`, 'uint32', [
            new Uint32Array(name === 'cellOffsets' ? 7 : name === 'vertexIds' ? 6 : 1),
            new Uint32Array(0)
          ]);
    expect(() => new GPUGraphSpatialForceLayout({...props, [name]: vector})).toThrow(
      new RegExp(`${name}|one|single|chunk`)
    );
  });

  test.each([
    ['misaligned center offset', {byteOffset: 2}],
    ['padded center stride', {byteStride: 12}],
    ['oversized center payload', {rowByteLength: 12}],
    ['incorrect center component count', {stride: 1}]
  ] as [string, VectorOptions][])('rejects unpacked caller-owned centers: %s', (_name, options) => {
    const fixture = createSpatialFixture();
    const props = createSpatialProps(fixture);
    const cellCenters = createVector(
      fixture,
      'unpacked-centers',
      'float32x2',
      [new Float32Array(12)],
      options
    );
    expect(() => new GPUGraphSpatialForceLayout({...props, cellCenters})).toThrow(
      /cellCenters|packed|aligned|float32x2/
    );
  });

  test.each(['count', 'overflow'] as const)('requires exactly one uint32 %s status row', name => {
    const fixture = createSpatialFixture();
    const props = createSpatialProps(fixture);
    for (const length of [0, 2]) {
      const status = createVector(fixture, `incorrect-${name}-${length}`, 'uint32', [
        new Uint32Array(length)
      ]);
      expect(() => new GPUGraphSpatialForceLayout({...props, [name]: status})).toThrow(
        new RegExp(`${name}|one|row|scalar`)
      );
    }
  });

  test('accepts four-byte offsets for packed scalar and float32x2 index vectors', () => {
    const fixture = createSpatialFixture();
    const props = createSpatialProps(fixture);
    const cellOffsets = createVector(
      fixture,
      'offset-cell-offsets',
      'uint32',
      [new Uint32Array(7)],
      {byteOffset: 4}
    );
    const cellCenters = createVector(
      fixture,
      'offset-cell-centers',
      'float32x2',
      [new Float32Array(12)],
      {byteOffset: 4}
    );
    const count = createVector(fixture, 'offset-count', 'uint32', [new Uint32Array(1)], {
      byteOffset: 4
    });
    const spatial = new GPUGraphSpatialForceLayout({...props, cellOffsets, cellCenters, count});
    expect(spatial.cellOffsets.data[0].byteOffset).toBe(4);
    expect(spatial.cellCenters.data[0].byteOffset).toBe(4);
    expect(spatial.count.data[0].byteOffset).toBe(4);
  });

  test.each([
    'sourceVertices',
    'targetVertices',
    'edgeWeights',
    'edgeIds',
    'forward.offsets',
    'forward.neighbors',
    'forward.edgeIds',
    'forward.edgeWeights',
    'forward.count',
    'forward.overflow',
    'reverse.offsets',
    'reverse.neighbors',
    'reverse.edgeIds',
    'reverse.edgeWeights',
    'reverse.count',
    'reverse.overflow',
    'invalidEdgeCount',
    'positions',
    'velocities',
    'pinned',
    'reset'
  ])('rejects vertex IDs backed by an existing graph or layout allocation: %s', vectorName => {
    const fixture = createSpatialFixture();
    const props = createSpatialProps(fixture, {
      vertexCount: 1,
      weighted: true,
      pinned: true,
      reset: true,
      gridSize: [1, 1]
    });
    const existing = getExistingVector(props.layout, vectorName);
    const vertexIds = createVector(fixture, 'aliased-spatial-ids', 'uint32', [new Uint32Array(1)], {
      buffer: existing.data[0].buffer
    });
    expect(() => new GPUGraphSpatialForceLayout({...props, vertexIds})).toThrow(
      /distinct|physical|allocation/
    );
  });

  test.each([
    'vertexIds',
    'cellCenters',
    'count',
    'overflow'
  ] as const)('requires every writable grid destination to have its own physical allocation: %s', name => {
    const fixture = createSpatialFixture();
    const props = createSpatialProps(fixture, {vertexCount: 1, gridSize: [1, 1]});
    const format = name === 'cellCenters' ? 'float32x2' : 'uint32';
    const values = name === 'cellCenters' ? new Float32Array(2) : new Uint32Array(1);
    const alias = createVector(fixture, `aliased-${name}`, format, [values], {
      buffer: props.cellOffsets.data[0].buffer
    });
    expect(() => new GPUGraphSpatialForceLayout({...props, [name]: alias})).toThrow(
      /distinct|physical|allocation/
    );
  });

  test('unwraps borrowed DynamicBuffer aliases before accepting caller-owned grid outputs', () => {
    const fixture = createSpatialFixture();
    const props = createSpatialProps(fixture, {vertexCount: 1, gridSize: [1, 1]});
    const concreteBuffer = props.layout.positions.data[0].buffer as Buffer;
    const dynamicBuffer = new DynamicBuffer(fixture.device, {
      id: 'borrowed-spatial-wrapper',
      buffer: concreteBuffer,
      ownsBuffer: false
    });
    fixture.dynamicBuffers.push(dynamicBuffer);
    const vertexIds = createVector(fixture, 'dynamic-aliased-ids', 'uint32', [new Uint32Array(1)], {
      buffer: dynamicBuffer
    });
    expect(() => new GPUGraphSpatialForceLayout({...props, vertexIds})).toThrow(
      /distinct|physical|allocation/
    );
    expect(concreteBuffer.destroyed).toBe(false);
  });
});

function createSpatialFixture(): SpatialFixture {
  const fixture = {device: new NullDevice({}), buffers: [], dynamicBuffers: [], vectors: []};
  spatialFixtures.push(fixture);
  return fixture;
}

function createSpatialProps(
  fixture: SpatialFixture,
  options: {
    vertexCount?: number;
    directed?: boolean;
    weighted?: boolean;
    pinned?: boolean;
    reset?: boolean;
    gridSize?: readonly [number, number];
    vertexCapacity?: number;
  } = {}
): GPUGraphSpatialForceLayoutProps {
  const vertexCount = options.vertexCount ?? 6;
  const sourceVertices = createVector(fixture, 'sourceVertices', 'uint32', [
    Uint32Array.from([0, 2]),
    new Uint32Array(0),
    Uint32Array.from([2, 3, 4])
  ]);
  const targetVertices = createVector(fixture, 'targetVertices', 'uint32', [
    Uint32Array.from([1, 4]),
    new Uint32Array(0),
    Uint32Array.from([3, 5, 1])
  ]);
  const edgeWeights = options.weighted
    ? createVector(fixture, 'edgeWeights', 'float32', [
        Float32Array.from([0.5, 2]),
        new Float32Array(0),
        Float32Array.from([1, 4, 8])
      ])
    : undefined;
  const edgeIds = options.weighted
    ? createVector(fixture, 'edgeIds', 'uint32', [
        Uint32Array.from([10, 20]),
        new Uint32Array(0),
        Uint32Array.from([30, 40, 50])
      ])
    : undefined;
  const directed = options.directed ?? true;
  const graph = new GPUGraph({
    vertexCount,
    sourceVertices,
    targetVertices,
    edgeWeights,
    edgeIds,
    directed
  });
  const forward = createAdjacency(fixture, 'forward', vertexCount, 5, options.weighted);
  const reverse = directed
    ? createAdjacency(fixture, 'reverse', vertexCount, 5, options.weighted)
    : undefined;
  const topology = new GPUGraphTopology({
    graph,
    forward,
    reverse,
    invalidEdgeCount: createVector(fixture, 'invalidEdgeCount', 'uint32', [new Uint32Array(1)])
  });
  const positions = createVector(fixture, 'positions', 'float32x2', [
    new Float32Array(vertexCount * 2)
  ]);
  const velocities = createVector(fixture, 'velocities', 'float32x2', [
    new Float32Array(vertexCount * 2)
  ]);
  const pinned = options.pinned
    ? createVector(fixture, 'pinned', 'uint32', [new Uint32Array(vertexCount)])
    : undefined;
  const reset = options.reset
    ? createVector(fixture, 'reset', 'uint32', [new Uint32Array(1)])
    : undefined;
  const layout = new GPUGraphForceLayout({topology, positions, velocities, pinned, reset});
  const gridSize = options.gridSize ?? [3, 2];
  const cellCount = gridSize[0] * gridSize[1];
  return {
    layout,
    gridSize,
    bounds: [-2, -2, 2, 2],
    cellOffsets: createVector(fixture, 'cellOffsets', 'uint32', [new Uint32Array(cellCount + 1)]),
    vertexIds: createVector(fixture, 'vertexIds', 'uint32', [
      new Uint32Array(options.vertexCapacity ?? vertexCount)
    ]),
    cellCenters: createVector(fixture, 'cellCenters', 'float32x2', [
      new Float32Array(cellCount * 2)
    ]),
    count: createVector(fixture, 'count', 'uint32', [new Uint32Array(1)]),
    overflow: createVector(fixture, 'overflow', 'uint32', [new Uint32Array(1)])
  };
}

function createAdjacency(
  fixture: SpatialFixture,
  name: string,
  vertexCount: number,
  capacity: number,
  weighted = false
): GPUGraphAdjacency {
  return {
    offsets: createVector(fixture, `${name}-offsets`, 'uint32', [new Uint32Array(vertexCount + 1)]),
    neighbors: createVector(fixture, `${name}-neighbors`, 'uint32', [new Uint32Array(capacity)]),
    edgeIds: createVector(fixture, `${name}-edgeIds`, 'uint32', [new Uint32Array(capacity)]),
    edgeWeights: weighted
      ? createVector(fixture, `${name}-weights`, 'float32', [new Float32Array(capacity)])
      : undefined,
    count: createVector(fixture, `${name}-count`, 'uint32', [new Uint32Array(1)]),
    overflow: createVector(fixture, `${name}-overflow`, 'uint32', [new Uint32Array(1)])
  };
}

function getExistingVector(layout: GPUGraphForceLayout, name: string): GPUVector {
  if (name === 'positions') return layout.positions;
  if (name === 'velocities') return layout.velocities;
  if (name === 'pinned') return layout.pinned!;
  if (name === 'reset') return layout.reset!;
  const topology = layout.topology;
  if (name === 'invalidEdgeCount') return topology.invalidEdgeCount;
  if (name === 'sourceVertices') return topology.graph.sourceVertices;
  if (name === 'targetVertices') return topology.graph.targetVertices;
  if (name === 'edgeWeights') return topology.graph.edgeWeights!;
  if (name === 'edgeIds') return topology.graph.edgeIds!;
  const [direction, vectorName] = name.split('.');
  const adjacency = direction === 'forward' ? topology.forward : topology.reverse!;
  return adjacency[vectorName as keyof GPUGraphAdjacency]!;
}

function createVector<Format extends VectorFormat>(
  fixture: SpatialFixture,
  name: string,
  format: Format,
  chunks: readonly VectorValues[],
  options: VectorOptions = {}
): GPUVector<Format> {
  const components = format === 'float32x2' ? 2 : 1;
  const byteOffset = options.byteOffset ?? 0;
  const byteStride = options.byteStride ?? components * Uint32Array.BYTES_PER_ELEMENT;
  const rowByteLength = options.rowByteLength ?? components * Uint32Array.BYTES_PER_ELEMENT;
  const stride = options.stride ?? components;
  const data = chunks.map((values, chunkIndex) => {
    const length = values.length / components;
    const buffer =
      options.buffer ??
      fixture.device.createBuffer({
        id: `${name}-chunk-${chunkIndex}-${fixture.buffers.length}`,
        byteLength: byteOffset + Math.max(Math.max(length, 1) * byteStride, rowByteLength, 8),
        usage: Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_DST | Buffer.COPY_SRC
      });
    if (!options.buffer) fixture.buffers.push(buffer as Buffer);
    return new GPUData<Format>({
      buffer,
      format,
      length,
      byteOffset,
      byteStride,
      rowByteLength,
      stride,
      ownsBuffer: false
    });
  });
  const vector = new GPUVector<Format>({
    type: 'data',
    name,
    format,
    data,
    byteStride,
    rowByteLength,
    stride,
    ownsData: false
  });
  fixture.vectors.push(vector);
  return vector;
}
