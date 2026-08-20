// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import * as experimentalModule from '@luma.gl/experimental';
import {
  GPUGraph,
  GPUGraphForceLayout,
  GPUGraphTopology,
  type GPUGraphAdjacency,
  type GPUGraphForceLayoutProps
} from '@luma.gl/experimental/gpu-graph';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import {afterEach, describe, expect, test, vi} from 'vitest';

type VectorFormat = 'uint32' | 'float32' | 'float32x2';
type VectorValues = Uint32Array | Float32Array;

type LayoutFixture = {
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
  usage?: number;
};

const layoutFixtures: LayoutFixture[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const fixture of layoutFixtures.splice(0)) {
    for (const vector of fixture.vectors) vector.destroy();
    for (const dynamicBuffer of fixture.dynamicBuffers) dynamicBuffer.destroy();
    for (const buffer of fixture.buffers) buffer.destroy();
    fixture.device.destroy();
  }
});

describe('GPUGraphForceLayout optional API and render-ready caller-owned buffers', () => {
  test('exports exact force-directed layout only through the optional GPU Graph subpath', () => {
    expect(typeof GPUGraphForceLayout).toBe('function');
    expect('GPUGraphForceLayout' in experimentalModule).toBe(false);
  });

  test('preserves topology, positions, velocities, controls, and all default physics', () => {
    const fixture = createLayoutFixture();
    const props = createLayoutProps(fixture, {weighted: true, pinned: true, reset: true});
    const createBufferSpy = vi.spyOn(fixture.device, 'createBuffer');
    const createCommandEncoderSpy = vi.spyOn(fixture.device, 'createCommandEncoder');
    const submitSpy = vi.spyOn(fixture.device, 'submit');
    const readbackSpies = fixture.buffers.map(buffer => vi.spyOn(buffer, 'readAsync'));

    const layout = new GPUGraphForceLayout({...props, id: 'borrowed-render-layout'});

    expect(layout.id).toBe('borrowed-render-layout');
    expect(layout.topology).toBe(props.topology);
    expect(layout.positions).toBe(props.positions);
    expect(layout.velocities).toBe(props.velocities);
    expect(layout.pinned).toBe(props.pinned);
    expect(layout.reset).toBe(props.reset);
    expect(layout.seed).toBe(0);
    expect(layout.iterationsPerFrame).toBe(4);
    expect(layout.repulsion).toBe(1);
    expect(layout.attraction).toBe(0.1);
    expect(layout.gravity).toBe(0.01);
    expect(layout.damping).toBe(0.9);
    expect(layout.maxVelocity).toBe(1);
    expect(layout.timeStep).toBe(1);
    expect(layout.topology.graph.sourceVertices.data.map(chunk => chunk.length)).toEqual([2, 0, 3]);
    expect(createBufferSpy).not.toHaveBeenCalled();
    expect(createCommandEncoderSpy).not.toHaveBeenCalled();
    expect(submitSpy).not.toHaveBeenCalled();
    for (const readbackSpy of readbackSpies) expect(readbackSpy).not.toHaveBeenCalled();
    expect(Reflect.has(layout, 'destroy')).toBe(false);

    for (const vector of fixture.vectors) vector.destroy();
    expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);
  });

  test('requires reverse directed adjacency and accepts undirected or weighted topology', () => {
    const fixture = createLayoutFixture();
    const directed = createLayoutProps(fixture, {reverse: false});
    const undirected = createLayoutProps(fixture, {directed: false, reverse: false});
    const weighted = createLayoutProps(fixture, {weighted: true});

    expect(() => new GPUGraphForceLayout(directed)).toThrow(/directed|reverse|adjacency/);
    expect(new GPUGraphForceLayout(undirected).topology.reverse).toBeUndefined();
    expect(new GPUGraphForceLayout(weighted).topology.graph.edgeWeights).toBeDefined();
  });

  test('accepts empty render vectors with a caller-owned optional reset scalar', () => {
    const fixture = createLayoutFixture();
    const props = createLayoutProps(fixture, {vertexCount: 0, reset: true});
    const layout = new GPUGraphForceLayout(props);

    expect(layout.positions.length).toBe(0);
    expect(layout.velocities.length).toBe(0);
    expect(layout.positions.data).toHaveLength(1);
    expect(layout.reset?.length).toBe(1);
  });
});

describe('GPUGraphForceLayout bounded deterministic simulation parameters', () => {
  test.each([
    0, 1, 0xffffffff
  ])('accepts an unsigned deterministic initialization seed: %i', seed => {
    const fixture = createLayoutFixture();
    expect(new GPUGraphForceLayout({...createLayoutProps(fixture), seed}).seed).toBe(seed);
  });

  test.each([
    -1,
    0.5,
    0x100000000,
    Number.NaN,
    Number.POSITIVE_INFINITY
  ])('rejects a seed outside the uint32 domain: %s', seed => {
    const fixture = createLayoutFixture();
    expect(() => new GPUGraphForceLayout({...createLayoutProps(fixture), seed})).toThrow(
      /seed|uint32/
    );
  });

  test.each([1, 4, 1024])('accepts a bounded iteration count per frame: %i', iterationsPerFrame => {
    const fixture = createLayoutFixture();
    expect(
      new GPUGraphForceLayout({...createLayoutProps(fixture), iterationsPerFrame})
        .iterationsPerFrame
    ).toBe(iterationsPerFrame);
  });

  test.each([
    0,
    -1,
    1.5,
    1025,
    Number.NaN,
    Number.POSITIVE_INFINITY
  ])('rejects invalid per-frame iterations: %s', iterationsPerFrame => {
    const fixture = createLayoutFixture();
    expect(
      () => new GPUGraphForceLayout({...createLayoutProps(fixture), iterationsPerFrame})
    ).toThrow(/iterationsPerFrame|iteration|1024/);
  });

  test.each([
    'repulsion',
    'attraction',
    'gravity'
  ] as const)('accepts zero or positive finite %s', parameter => {
    const fixture = createLayoutFixture();
    expect(
      new GPUGraphForceLayout({...createLayoutProps(fixture), [parameter]: 0})[parameter]
    ).toBe(0);
    expect(
      new GPUGraphForceLayout({...createLayoutProps(fixture), [parameter]: 2})[parameter]
    ).toBe(2);
  });

  test.each([
    ['repulsion', -1],
    ['attraction', Number.NaN],
    ['gravity', Number.POSITIVE_INFINITY],
    ['damping', -0.01],
    ['damping', 1.01],
    ['damping', Number.NaN],
    ['maxVelocity', 0],
    ['maxVelocity', -1],
    ['maxVelocity', Number.POSITIVE_INFINITY],
    ['timeStep', 0],
    ['timeStep', -0.5],
    ['timeStep', Number.NaN]
  ] as const)('rejects invalid %s = %s', (parameter, value) => {
    const fixture = createLayoutFixture();
    expect(
      () => new GPUGraphForceLayout({...createLayoutProps(fixture), [parameter]: value})
    ).toThrow(new RegExp(`${parameter}|finite|positive|between`));
  });

  test.each([0, 0.5, 1])('accepts damping factors in the closed unit interval: %s', damping => {
    const fixture = createLayoutFixture();
    expect(new GPUGraphForceLayout({...createLayoutProps(fixture), damping}).damping).toBe(damping);
  });
});

describe('GPUGraphForceLayout packed vectors and physical allocation safety', () => {
  test.each([
    'positions',
    'velocities'
  ] as const)('requires one float32x2 row for every vertex in %s', field => {
    const fixture = createLayoutFixture();
    const props = createLayoutProps(fixture);
    const output = createVector(fixture, `short-${field}`, 'float32x2', [new Float32Array(10)]);
    expect(() => new GPUGraphForceLayout({...props, [field]: output})).toThrow(
      new RegExp(`${field}|row|vertexCount`)
    );
  });

  test.each([
    'positions',
    'velocities'
  ] as const)('rejects scalar and partitioned %s buffers', field => {
    const fixture = createLayoutFixture();
    const props = createLayoutProps(fixture);
    const wrongFormat = createVector(fixture, `scalar-${field}`, 'float32', [new Float32Array(6)]);
    const partitioned = createVector(fixture, `partitioned-${field}`, 'float32x2', [
      new Float32Array(6),
      new Float32Array(6)
    ]);
    expect(() => new GPUGraphForceLayout({...props, [field]: wrongFormat})).toThrow(
      new RegExp(`${field}|float32x2|packed`)
    );
    expect(() => new GPUGraphForceLayout({...props, [field]: partitioned})).toThrow(
      new RegExp(`${field}|one|single|chunk`)
    );
  });

  test.each([
    ['misaligned byte offset', {byteOffset: 2}],
    ['padded byte stride', {byteStride: 12}],
    ['oversized row payload', {rowByteLength: 12}],
    ['incorrect scalar component count', {stride: 1}]
  ] as [string, VectorOptions][])('rejects unpacked render positions: %s', (_name, options) => {
    const fixture = createLayoutFixture();
    const props = createLayoutProps(fixture);
    const positions = createVector(
      fixture,
      'unpacked-positions',
      'float32x2',
      [new Float32Array(12)],
      options
    );
    expect(() => new GPUGraphForceLayout({...props, positions})).toThrow(
      /positions|packed|aligned|float32x2/
    );
  });

  test('accepts directly renderable float32x2 views at four-byte storage offsets', () => {
    const fixture = createLayoutFixture();
    const props = createLayoutProps(fixture);
    const positions = createVector(
      fixture,
      'offset-positions',
      'float32x2',
      [new Float32Array(12)],
      {
        byteOffset: 4
      }
    );
    const velocities = createVector(
      fixture,
      'offset-velocities',
      'float32x2',
      [new Float32Array(12)],
      {
        byteOffset: 4
      }
    );
    const layout = new GPUGraphForceLayout({...props, positions, velocities});
    expect(layout.positions.data[0].byteOffset).toBe(4);
    expect(layout.velocities.data[0].byteOffset).toBe(4);
  });

  test('requires render positions to support both STORAGE and VERTEX usages', () => {
    const fixture = createLayoutFixture();
    const props = createLayoutProps(fixture);
    const withoutVertex = createVector(
      fixture,
      'storage-only-positions',
      'float32x2',
      [new Float32Array(12)],
      {usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC}
    );
    const withoutStorage = createVector(
      fixture,
      'vertex-only-positions',
      'float32x2',
      [new Float32Array(12)],
      {usage: Buffer.VERTEX | Buffer.COPY_DST | Buffer.COPY_SRC}
    );
    expect(() => new GPUGraphForceLayout({...props, positions: withoutVertex})).toThrow(
      /positions|VERTEX|vertex|render/
    );
    expect(() => new GPUGraphForceLayout({...props, positions: withoutStorage})).toThrow(
      /positions|STORAGE|storage/
    );
  });

  test('requires writable velocities to support STORAGE usage', () => {
    const fixture = createLayoutFixture();
    const props = createLayoutProps(fixture);
    const velocities = createVector(
      fixture,
      'vertex-only-velocities',
      'float32x2',
      [new Float32Array(12)],
      {usage: Buffer.VERTEX | Buffer.COPY_DST | Buffer.COPY_SRC}
    );
    expect(() => new GPUGraphForceLayout({...props, velocities})).toThrow(
      /velocities|STORAGE|storage/
    );
  });

  test.each([5, 7])('requires a uint32 pinned flag per vertex: %i', length => {
    const fixture = createLayoutFixture();
    const props = createLayoutProps(fixture, {pinned: true});
    const pinned = createVector(fixture, 'incorrect-pinned-length', 'uint32', [
      new Uint32Array(length)
    ]);
    expect(() => new GPUGraphForceLayout({...props, pinned})).toThrow(/pinned|row|vertexCount/);
  });

  test('rejects non-uint32 and partitioned pinned masks', () => {
    const fixture = createLayoutFixture();
    const props = createLayoutProps(fixture, {pinned: true});
    const wrongFormat = createVector(fixture, 'float-pinned', 'float32', [new Float32Array(6)]);
    const partitioned = createVector(fixture, 'partitioned-pinned', 'uint32', [
      new Uint32Array(3),
      new Uint32Array(3)
    ]);
    expect(
      () => new GPUGraphForceLayout({...props, pinned: wrongFormat as GPUVector<'uint32'>})
    ).toThrow(/pinned|uint32|packed/);
    expect(() => new GPUGraphForceLayout({...props, pinned: partitioned})).toThrow(
      /pinned|one|single|chunk/
    );
  });

  test.each([0, 2])('requires exactly one uint32 reset scalar: %i', length => {
    const fixture = createLayoutFixture();
    const props = createLayoutProps(fixture, {reset: true});
    const reset = createVector(fixture, 'incorrect-reset-length', 'uint32', [
      new Uint32Array(length)
    ]);
    expect(() => new GPUGraphForceLayout({...props, reset})).toThrow(/reset|one|row|scalar/);
  });

  test('rejects float and partitioned deterministic reset controls', () => {
    const fixture = createLayoutFixture();
    const props = createLayoutProps(fixture, {reset: true});
    const wrongFormat = createVector(fixture, 'float-reset', 'float32', [new Float32Array(1)]);
    const partitioned = createVector(fixture, 'partitioned-reset', 'uint32', [
      new Uint32Array(1),
      new Uint32Array(0)
    ]);
    expect(
      () => new GPUGraphForceLayout({...props, reset: wrongFormat as GPUVector<'uint32'>})
    ).toThrow(/reset|uint32|packed/);
    expect(() => new GPUGraphForceLayout({...props, reset: partitioned})).toThrow(
      /reset|one|single|chunk/
    );
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
    'invalidEdgeCount'
  ])('rejects position output backed by existing graph allocation %s', vectorName => {
    const fixture = createLayoutFixture();
    const props = createLayoutProps(fixture, {vertexCount: 1, weighted: true});
    const vector = getTopologyVector(props.topology, vectorName);
    const positions = createVector(
      fixture,
      'aliased-positions',
      'float32x2',
      [new Float32Array(2)],
      {
        buffer: vector.data[0].buffer
      }
    );
    expect(() => new GPUGraphForceLayout({...props, positions})).toThrow(
      /distinct|physical|allocation/
    );
  });

  test.each([
    'velocities',
    'pinned',
    'reset'
  ] as const)('requires each mutable layout buffer and control allocation to be distinct: %s', field => {
    const fixture = createLayoutFixture();
    const props = createLayoutProps(fixture, {vertexCount: 1, pinned: true, reset: true});
    const format = field === 'velocities' ? 'float32x2' : 'uint32';
    const values = field === 'velocities' ? new Float32Array(2) : new Uint32Array(1);
    const alias = createVector(fixture, `aliased-${field}`, format, [values], {
      buffer: props.positions.data[0].buffer
    });
    expect(() => new GPUGraphForceLayout({...props, [field]: alias})).toThrow(
      /distinct|physical|allocation/
    );
  });

  test('unwraps borrowed DynamicBuffer views before comparing physical layout allocations', () => {
    const fixture = createLayoutFixture();
    const props = createLayoutProps(fixture, {vertexCount: 1});
    const concreteBuffer = props.topology.forward.offsets.data[0].buffer as Buffer;
    const dynamicBuffer = new DynamicBuffer(fixture.device, {
      id: 'borrowed-layout-wrapper',
      buffer: concreteBuffer,
      ownsBuffer: false
    });
    fixture.dynamicBuffers.push(dynamicBuffer);
    const positions = createVector(
      fixture,
      'dynamic-aliased-layout',
      'float32x2',
      [new Float32Array(2)],
      {buffer: dynamicBuffer}
    );

    expect(() => new GPUGraphForceLayout({...props, positions})).toThrow(
      /distinct|physical|allocation/
    );
    expect(concreteBuffer.destroyed).toBe(false);
  });
});

function createLayoutFixture(): LayoutFixture {
  const fixture = {device: new NullDevice({}), buffers: [], dynamicBuffers: [], vectors: []};
  layoutFixtures.push(fixture);
  return fixture;
}

function createLayoutProps(
  fixture: LayoutFixture,
  options: {
    vertexCount?: number;
    directed?: boolean;
    reverse?: boolean;
    weighted?: boolean;
    pinned?: boolean;
    reset?: boolean;
  } = {}
): GPUGraphForceLayoutProps {
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
    ? createVector(fixture, 'sourceWeights', 'float32', [
        Float32Array.from([0.5, 2]),
        new Float32Array(0),
        Float32Array.from([1, 4, 8])
      ])
    : undefined;
  const edgeIds = options.weighted
    ? createVector(fixture, 'sourceEdgeIds', 'uint32', [
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
  const reverse =
    (options.reverse ?? directed)
      ? createAdjacency(fixture, 'reverse', vertexCount, 5, options.weighted)
      : undefined;
  const invalidEdgeCount = createVector(fixture, 'invalidEdgeCount', 'uint32', [
    new Uint32Array(1)
  ]);
  const topology = new GPUGraphTopology({graph, forward, reverse, invalidEdgeCount});
  const positions = createVector(fixture, 'renderPositions', 'float32x2', [
    new Float32Array(vertexCount * 2)
  ]);
  const velocities = createVector(fixture, 'layoutVelocities', 'float32x2', [
    new Float32Array(vertexCount * 2)
  ]);
  const pinned = options.pinned
    ? createVector(fixture, 'pinnedVertices', 'uint32', [new Uint32Array(vertexCount)])
    : undefined;
  const reset = options.reset
    ? createVector(fixture, 'layoutReset', 'uint32', [new Uint32Array(1)])
    : undefined;
  return {topology, positions, velocities, pinned, reset};
}

function createAdjacency(
  fixture: LayoutFixture,
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

function getTopologyVector(topology: GPUGraphTopology, name: string): GPUVector {
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
  fixture: LayoutFixture,
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
        usage: options.usage ?? Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_DST | Buffer.COPY_SRC
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
