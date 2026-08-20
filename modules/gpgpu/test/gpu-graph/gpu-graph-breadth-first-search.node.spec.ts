// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import * as experimentalModule from '@luma.gl/experimental';
import {
  GPUGraph,
  GPUGraphBreadthFirstSearch,
  GPUGraphTopology,
  type GPUGraphAdjacency,
  type GPUGraphBreadthFirstSearchDirection,
  type GPUGraphBreadthFirstSearchProps
} from '@luma.gl/gpgpu/gpu-graph';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {NullDevice} from '@luma.gl/test-utils';
import {afterEach, describe, expect, test, vi} from 'vitest';

type ScalarFormat = 'uint32' | 'float32';
type ScalarValues = Uint32Array | Float32Array;

type SearchFixture = {
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

const searchFixtures: SearchFixture[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const fixture of searchFixtures.splice(0)) {
    for (const vector of fixture.vectors) vector.destroy();
    for (const dynamicBuffer of fixture.dynamicBuffers) dynamicBuffer.destroy();
    for (const buffer of fixture.buffers) buffer.destroy();
    fixture.device.destroy();
  }
});

describe('GPUGraphBreadthFirstSearch public API and caller ownership', () => {
  test('publishes shortest-path traversal only through the optional GPU Graph subpath', () => {
    expect(typeof GPUGraphBreadthFirstSearch).toBe('function');
    expect('GPUGraphBreadthFirstSearch' in experimentalModule).toBe(false);
  });

  test('preserves topology, chunked seeds, outputs, and controls without executing GPU work', () => {
    const fixture = createSearchFixture();
    const props = createSearchProps(fixture, {
      reverse: true,
      weighted: true,
      mask: true,
      controls: true
    });
    const createBufferSpy = vi.spyOn(fixture.device, 'createBuffer');
    const createCommandEncoderSpy = vi.spyOn(fixture.device, 'createCommandEncoder');
    const submitSpy = vi.spyOn(fixture.device, 'submit');
    const readbackSpies = fixture.buffers.map(buffer => vi.spyOn(buffer, 'readAsync'));

    const search = new GPUGraphBreadthFirstSearch({...props, id: 'borrowed-search'});

    expect(search.id).toBe('borrowed-search');
    expect(search.topology).toBe(props.topology);
    expect(search.seeds).toBe(props.seeds);
    expect(search.seedCount).toBe(props.seedCount);
    expect(search.distances).toBe(props.distances);
    expect(search.predecessors).toBe(props.predecessors);
    expect(search.mask).toBe(props.mask);
    expect(search.activeDepth).toBe(props.activeDepth);
    expect(search.maxDepth).toBe(1);
    expect(search.direction).toBe('outgoing');
    expect(search.seeds.data.map(chunk => chunk.length)).toEqual([2, 0, 3]);
    expect(createBufferSpy).not.toHaveBeenCalled();
    expect(createCommandEncoderSpy).not.toHaveBeenCalled();
    expect(submitSpy).not.toHaveBeenCalled();
    for (const readbackSpy of readbackSpies) expect(readbackSpy).not.toHaveBeenCalled();
    expect(Reflect.has(search, 'destroy')).toBe(false);

    for (const vector of fixture.vectors) vector.destroy();
    expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);
  });

  test('accepts empty graphs, empty chunked seeds, and optional masks', () => {
    const fixture = createSearchFixture();
    const props = createSearchProps(fixture, {vertexCount: 0});
    const seeds = createVector(fixture, 'empty-seeds', 'uint32', []);
    const search = new GPUGraphBreadthFirstSearch({...props, seeds, maxDepth: 0});

    expect(search.seeds.data).toEqual([]);
    expect(search.distances.length).toBe(0);
    expect(search.predecessors.length).toBe(0);
    expect(search.mask).toBeUndefined();
    expect(search.maxDepth).toBe(0);
  });
});

describe('GPUGraphBreadthFirstSearch direction and depth contracts', () => {
  test.each([
    'outgoing',
    'incoming',
    'both'
  ] as const)('accepts a directed direction when reverse topology is available: %s', direction => {
    const fixture = createSearchFixture();
    const props = createSearchProps(fixture, {reverse: true});

    expect(new GPUGraphBreadthFirstSearch({...props, direction}).direction).toBe(direction);
  });

  test.each([
    'outgoing',
    'incoming',
    'both'
  ] as const)('accepts every undirected direction without redundant reverse topology: %s', direction => {
    const fixture = createSearchFixture();
    const props = createSearchProps(fixture, {directed: false});

    expect(new GPUGraphBreadthFirstSearch({...props, direction}).direction).toBe(direction);
  });

  test.each([
    'incoming',
    'both'
  ] as const)('requires reverse adjacency for directed %s traversal', direction => {
    const fixture = createSearchFixture();
    const props = createSearchProps(fixture);

    expect(() => new GPUGraphBreadthFirstSearch({...props, direction})).toThrow(
      /direction|incoming|both|reverse|directed/
    );
  });

  test.each([
    'reverse',
    'outbound',
    ''
  ])('rejects unsupported traversal direction: %s', invalidDirection => {
    const fixture = createSearchFixture();
    const props = createSearchProps(fixture, {reverse: true});
    const direction = invalidDirection as GPUGraphBreadthFirstSearchDirection;

    expect(() => new GPUGraphBreadthFirstSearch({...props, direction})).toThrow(/direction/);
  });

  test.each([0, 1, 1024])('accepts a bounded maximum traversal depth: %i', maxDepth => {
    const fixture = createSearchFixture();
    const props = createSearchProps(fixture);

    expect(new GPUGraphBreadthFirstSearch({...props, maxDepth}).maxDepth).toBe(maxDepth);
  });

  test.each([
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    1025
  ])('rejects an invalid or excessive traversal depth: %s', maxDepth => {
    const fixture = createSearchFixture();
    const props = createSearchProps(fixture);

    expect(() => new GPUGraphBreadthFirstSearch({...props, maxDepth})).toThrow(
      /maxDepth|depth|1024/
    );
  });
});

describe('GPUGraphBreadthFirstSearch vector and control validation', () => {
  test.each([
    'distances',
    'predecessors',
    'mask'
  ] as const)('requires a packed uint32 vertex output: %s', outputName => {
    const fixture = createSearchFixture();
    const props = createSearchProps(fixture, {mask: true});
    const wrongFormat = createVector(fixture, `${outputName}-float`, 'float32', [
      new Float32Array(props.topology.graph.vertexCount)
    ]) as unknown as GPUVector<'uint32'>;

    expect(() => new GPUGraphBreadthFirstSearch({...props, [outputName]: wrongFormat})).toThrow(
      new RegExp(`${outputName}|uint32|packed`)
    );
  });

  test.each([
    'distances',
    'predecessors',
    'mask'
  ] as const)('requires exactly one row per vertex for %s', outputName => {
    const fixture = createSearchFixture();
    const props = createSearchProps(fixture, {mask: true});
    const shortOutput = createVector(fixture, `${outputName}-short`, 'uint32', [
      new Uint32Array(props.topology.graph.vertexCount - 1)
    ]);

    expect(() => new GPUGraphBreadthFirstSearch({...props, [outputName]: shortOutput})).toThrow(
      new RegExp(`${outputName}|vertexCount|length`)
    );
  });

  test.each([
    'distances',
    'predecessors',
    'mask'
  ] as const)('requires exactly one physical output chunk for %s', outputName => {
    const fixture = createSearchFixture();
    const props = createSearchProps(fixture, {mask: true});
    const partitioned = createVector(fixture, `${outputName}-partitioned`, 'uint32', [
      new Uint32Array(3),
      new Uint32Array(3)
    ]);

    expect(() => new GPUGraphBreadthFirstSearch({...props, [outputName]: partitioned})).toThrow(
      new RegExp(`${outputName}|one|single|chunk`)
    );
  });

  test.each([
    ['misaligned byte offset', {byteOffset: 2}],
    ['padded byte stride', {byteStride: 8}],
    ['oversized row payload', {rowByteLength: 8}],
    ['multi-component scalar stride', {stride: 2}]
  ] as [string, VectorOptions][])('rejects unpacked predecessor output: %s', (_name, options) => {
    const fixture = createSearchFixture();
    const props = createSearchProps(fixture);
    const predecessors = createVector(
      fixture,
      'unpacked-predecessors',
      'uint32',
      [new Uint32Array(props.topology.graph.vertexCount)],
      options
    );

    expect(() => new GPUGraphBreadthFirstSearch({...props, predecessors})).toThrow(
      /predecessors|packed|aligned|uint32/
    );
  });

  test('requires packed uint32 seed chunks and validates intentionally empty chunks', () => {
    const fixture = createSearchFixture();
    const props = createSearchProps(fixture);
    const wrongFormat = createVector(fixture, 'float-seeds', 'float32', [
      Float32Array.from([0, 1])
    ]) as unknown as GPUVector<'uint32'>;

    expect(() => new GPUGraphBreadthFirstSearch({...props, seeds: wrongFormat})).toThrow(
      /seeds|uint32|packed/
    );
    Object.defineProperty(props.seeds.data[1], 'format', {value: 'float32'});
    expect(() => new GPUGraphBreadthFirstSearch(props)).toThrow(/seeds|uint32|packed|chunk/);
  });

  test.each([
    'seedCount',
    'activeDepth'
  ] as const)('requires one packed uint32 scalar for dynamic %s', controlName => {
    const fixture = createSearchFixture();
    const props = createSearchProps(fixture, {controls: true});

    for (const length of [0, 2]) {
      const control = createVector(fixture, `${controlName}-${length}`, 'uint32', [
        new Uint32Array(length)
      ]);
      expect(() => new GPUGraphBreadthFirstSearch({...props, [controlName]: control})).toThrow(
        new RegExp(`${controlName}|one|scalar|row`)
      );
    }

    const wrongFormat = createVector(fixture, `${controlName}-float`, 'float32', [
      new Float32Array(1)
    ]) as unknown as GPUVector<'uint32'>;
    expect(() => new GPUGraphBreadthFirstSearch({...props, [controlName]: wrongFormat})).toThrow(
      new RegExp(`${controlName}|uint32|packed`)
    );
  });

  test('accepts uint32-aligned seed, output, and scalar views at non-256-byte offsets', () => {
    const fixture = createSearchFixture();
    const props = createSearchProps(fixture);
    const seeds = createVector(fixture, 'offset-seeds', 'uint32', [Uint32Array.from([0, 1])], {
      byteOffset: 4
    });
    const distances = createVector(
      fixture,
      'offset-distances',
      'uint32',
      [new Uint32Array(props.topology.graph.vertexCount)],
      {byteOffset: 4}
    );
    const seedCount = createVector(fixture, 'offset-seed-count', 'uint32', [new Uint32Array(1)], {
      byteOffset: 4
    });

    const search = new GPUGraphBreadthFirstSearch({...props, seeds, distances, seedCount});
    expect(search.seeds.data[0].byteOffset).toBe(4);
    expect(search.distances.data[0].byteOffset).toBe(4);
    expect(search.seedCount?.data[0].byteOffset).toBe(4);
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
    'seeds',
    'seedCount',
    'activeDepth'
  ])('rejects writable distances backed by existing physical allocation: %s', vectorName => {
    const fixture = createSearchFixture();
    const props = createSearchProps(fixture, {
      vertexCount: 1,
      reverse: true,
      weighted: true,
      mask: true,
      controls: true
    });
    const vector = getSearchInputVector(props, vectorName);
    const distances = createVector(fixture, 'aliased-distances', 'uint32', [new Uint32Array(1)], {
      buffer: vector.data[0].buffer
    });

    expect(() => new GPUGraphBreadthFirstSearch({...props, distances})).toThrow(
      /distances|distinct|physical|allocation/
    );
  });

  test.each([
    ['predecessors', 'distances'],
    ['mask', 'distances'],
    ['mask', 'predecessors']
  ] as const)('rejects aliases between writable %s and %s outputs', (outputName, sourceName) => {
    const fixture = createSearchFixture();
    const props = createSearchProps(fixture, {mask: true});
    const sourceVector = props[sourceName]!;
    const output = createVector(
      fixture,
      `aliased-${outputName}`,
      'uint32',
      [new Uint32Array(props.topology.graph.vertexCount)],
      {buffer: sourceVector.data[0].buffer}
    );

    expect(() => new GPUGraphBreadthFirstSearch({...props, [outputName]: output})).toThrow(
      /distinct|physical|allocation/
    );
  });

  test('unwraps borrowed DynamicBuffer objects before checking physical output aliases', () => {
    const fixture = createSearchFixture();
    const props = createSearchProps(fixture);
    const concreteBuffer = props.topology.forward.offsets.data[0].buffer as Buffer;
    const dynamicBuffer = new DynamicBuffer(fixture.device, {
      id: 'borrowed-offset-wrapper',
      buffer: concreteBuffer,
      ownsBuffer: false
    });
    fixture.dynamicBuffers.push(dynamicBuffer);
    const distances = createVector(
      fixture,
      'dynamic-aliased-distances',
      'uint32',
      [new Uint32Array(props.topology.graph.vertexCount)],
      {buffer: dynamicBuffer}
    );

    expect(() => new GPUGraphBreadthFirstSearch({...props, distances})).toThrow(
      /distinct|physical|allocation/
    );
    expect(concreteBuffer.destroyed).toBe(false);
  });
});

function createSearchFixture(): SearchFixture {
  const fixture = {device: new NullDevice({}), buffers: [], dynamicBuffers: [], vectors: []};
  searchFixtures.push(fixture);
  return fixture;
}

function createSearchProps(
  fixture: SearchFixture,
  options: {
    vertexCount?: number;
    directed?: boolean;
    reverse?: boolean;
    weighted?: boolean;
    mask?: boolean;
    controls?: boolean;
  } = {}
): GPUGraphBreadthFirstSearchProps {
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
  const graph = new GPUGraph({
    vertexCount,
    sourceVertices,
    targetVertices,
    edgeWeights,
    edgeIds,
    directed: options.directed
  });
  const forward = createAdjacency(fixture, 'forward', vertexCount, 5, options.weighted);
  const reverse = options.reverse
    ? createAdjacency(fixture, 'reverse', vertexCount, 5, options.weighted)
    : undefined;
  const invalidEdgeCount = createVector(fixture, 'invalidEdgeCount', 'uint32', [
    new Uint32Array(1)
  ]);
  const topology = new GPUGraphTopology({graph, forward, reverse, invalidEdgeCount});
  const seeds = createVector(fixture, 'seeds', 'uint32', [
    Uint32Array.from([0, 3]),
    new Uint32Array(0),
    Uint32Array.from([2, 99, 4])
  ]);
  const distances = createVector(fixture, 'distances', 'uint32', [new Uint32Array(vertexCount)]);
  const predecessors = createVector(fixture, 'predecessors', 'uint32', [
    new Uint32Array(vertexCount)
  ]);
  const mask = options.mask
    ? createVector(fixture, 'mask', 'uint32', [new Uint32Array(vertexCount)])
    : undefined;
  const seedCount = options.controls
    ? createVector(fixture, 'seedCount', 'uint32', [new Uint32Array(1)])
    : undefined;
  const activeDepth = options.controls
    ? createVector(fixture, 'activeDepth', 'uint32', [new Uint32Array(1)])
    : undefined;
  return {topology, seeds, distances, predecessors, mask, seedCount, activeDepth};
}

function createAdjacency(
  fixture: SearchFixture,
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

function getSearchInputVector(props: GPUGraphBreadthFirstSearchProps, name: string): GPUVector {
  if (name === 'seeds') return props.seeds;
  if (name === 'seedCount') return props.seedCount!;
  if (name === 'activeDepth') return props.activeDepth!;
  if (name === 'invalidEdgeCount') return props.topology.invalidEdgeCount;
  if (name === 'sourceVertices') return props.topology.graph.sourceVertices;
  if (name === 'targetVertices') return props.topology.graph.targetVertices;
  if (name === 'edgeWeights') return props.topology.graph.edgeWeights!;
  if (name === 'edgeIds') return props.topology.graph.edgeIds!;

  const [direction, vectorName] = name.split('.');
  const adjacency = direction === 'forward' ? props.topology.forward : props.topology.reverse!;
  return adjacency[vectorName as keyof GPUGraphAdjacency]!;
}

function createVector<Format extends ScalarFormat>(
  fixture: SearchFixture,
  name: string,
  format: Format,
  chunks: readonly ScalarValues[],
  options: VectorOptions = {}
): GPUVector<Format> {
  const byteOffset = options.byteOffset ?? 0;
  const byteStride = options.byteStride ?? Uint32Array.BYTES_PER_ELEMENT;
  const rowByteLength = options.rowByteLength ?? Uint32Array.BYTES_PER_ELEMENT;
  const stride = options.stride ?? 1;
  const data = chunks.map((values, chunkIndex) => {
    const buffer =
      options.buffer ??
      fixture.device.createBuffer({
        id: `${name}-chunk-${chunkIndex}-${fixture.buffers.length}`,
        byteLength: byteOffset + Math.max(Math.max(values.length, 1) * byteStride, rowByteLength),
        usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
      });
    if (!options.buffer) fixture.buffers.push(buffer as Buffer);
    return new GPUData<Format>({
      buffer,
      format,
      length: values.length,
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
