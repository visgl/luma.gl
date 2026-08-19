// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import * as experimentalModule from '@luma.gl/experimental';
import {
  GPUGraph,
  GPUGraphDegree,
  GPUGraphTopology,
  type GPUGraphAdjacency,
  type GPUGraphDegreeDirection,
  type GPUGraphDegreeProps
} from '@luma.gl/experimental/gpu-graph';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import {afterEach, describe, expect, test, vi} from 'vitest';

type ScalarFormat = 'uint32' | 'float32';
type ScalarValues = Uint32Array | Float32Array;

type DegreeFixture = {
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

const degreeFixtures: DegreeFixture[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const fixture of degreeFixtures.splice(0)) {
    for (const vector of fixture.vectors) vector.destroy();
    for (const dynamicBuffer of fixture.dynamicBuffers) dynamicBuffer.destroy();
    for (const buffer of fixture.buffers) buffer.destroy();
    fixture.device.destroy();
  }
});

describe('GPUGraphDegree optional API and caller ownership', () => {
  test('keeps degree metrics in the optional GPU Graph subpath', () => {
    expect(typeof GPUGraphDegree).toBe('function');
    expect('GPUGraphDegree' in experimentalModule).toBe(false);
  });

  test('preserves original graph, topology, and output without allocating or executing work', () => {
    const fixture = createDegreeFixture();
    const props = createDegreeProps(fixture, {reverse: true, weighted: true});
    const createBufferSpy = vi.spyOn(fixture.device, 'createBuffer');
    const createCommandEncoderSpy = vi.spyOn(fixture.device, 'createCommandEncoder');
    const submitSpy = vi.spyOn(fixture.device, 'submit');
    const readbackSpies = fixture.buffers.map(buffer => vi.spyOn(buffer, 'readAsync'));

    const degree = new GPUGraphDegree({...props, id: 'borrowed-degree'});

    expect(degree.id).toBe('borrowed-degree');
    expect(degree.topology).toBe(props.topology);
    expect(degree.output).toBe(props.output);
    expect(degree.direction).toBe('outgoing');
    expect(degree.topology.graph.sourceVertices.data.map(chunk => chunk.length)).toEqual([2, 0, 3]);
    expect(createBufferSpy).not.toHaveBeenCalled();
    expect(createCommandEncoderSpy).not.toHaveBeenCalled();
    expect(submitSpy).not.toHaveBeenCalled();
    for (const readbackSpy of readbackSpies) expect(readbackSpy).not.toHaveBeenCalled();
    expect(Reflect.has(degree, 'destroy')).toBe(false);

    for (const vector of fixture.vectors) vector.destroy();
    expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);
  });

  test('accepts an empty graph with one physically allocated zero-length degree chunk', () => {
    const fixture = createDegreeFixture();
    const props = createDegreeProps(fixture, {vertexCount: 0});
    const degree = new GPUGraphDegree(props);

    expect(degree.output.length).toBe(0);
    expect(degree.output.data).toHaveLength(1);
    expect(degree.output.data[0].buffer.byteLength).toBeGreaterThanOrEqual(4);
  });

  test('accepts packed uint32 output at a non-256-byte-aligned storage offset', () => {
    const fixture = createDegreeFixture();
    const props = createDegreeProps(fixture);
    const output = createVector(
      fixture,
      'offset-degree-output',
      'uint32',
      [new Uint32Array(props.topology.graph.vertexCount)],
      {byteOffset: 4}
    );

    expect(new GPUGraphDegree({...props, output}).output.data[0].byteOffset).toBe(4);
  });
});

describe('GPUGraphDegree direction and output validation', () => {
  test.each([
    'outgoing',
    'incoming'
  ] as const)('accepts a directed graph direction when reverse topology is available: %s', direction => {
    const fixture = createDegreeFixture();
    const props = createDegreeProps(fixture, {reverse: true});

    expect(new GPUGraphDegree({...props, direction}).direction).toBe(direction);
  });

  test.each([
    'outgoing',
    'incoming'
  ] as const)('uses symmetric forward topology for either undirected direction: %s', direction => {
    const fixture = createDegreeFixture();
    const props = createDegreeProps(fixture, {directed: false});

    expect(new GPUGraphDegree({...props, direction}).direction).toBe(direction);
  });

  test('requires transposed topology for incoming degree on a directed graph', () => {
    const fixture = createDegreeFixture();
    const props = createDegreeProps(fixture);

    expect(() => new GPUGraphDegree({...props, direction: 'incoming'})).toThrow(
      /incoming|reverse|directed/
    );
  });

  test.each([
    'both',
    'reverse',
    'outbound',
    ''
  ])('rejects unsupported degree direction: %s', invalidDirection => {
    const fixture = createDegreeFixture();
    const props = createDegreeProps(fixture, {reverse: true});
    const direction = invalidDirection as GPUGraphDegreeDirection;

    expect(() => new GPUGraphDegree({...props, direction})).toThrow(/direction|outgoing|incoming/);
  });

  test.each([5, 7])('requires exactly one degree row per graph vertex: %i rows', length => {
    const fixture = createDegreeFixture();
    const props = createDegreeProps(fixture);
    const output = createVector(fixture, `degree-length-${length}`, 'uint32', [
      new Uint32Array(length)
    ]);

    expect(() => new GPUGraphDegree({...props, output})).toThrow(/output|vertexCount|length/);
  });

  test('requires uint32 degree output instead of float32', () => {
    const fixture = createDegreeFixture();
    const props = createDegreeProps(fixture);
    const output = createVector(fixture, 'float-degree', 'float32', [
      new Float32Array(props.topology.graph.vertexCount)
    ]) as unknown as GPUVector<'uint32'>;

    expect(() => new GPUGraphDegree({...props, output})).toThrow(/output|uint32|packed/);
  });

  test.each([0, 2])('requires exactly one physical output chunk: %i chunks', chunkCount => {
    const fixture = createDegreeFixture();
    const props = createDegreeProps(fixture);
    const chunks = chunkCount === 0 ? [] : [new Uint32Array(3), new Uint32Array(3)];
    const output = createVector(fixture, 'partitioned-degree', 'uint32', chunks);

    expect(() => new GPUGraphDegree({...props, output})).toThrow(/output|one|single|chunk/);
  });

  test.each([
    ['misaligned byte offset', {byteOffset: 2}],
    ['padded byte stride', {byteStride: 8}],
    ['oversized row payload', {rowByteLength: 8}],
    ['multi-component scalar stride', {stride: 2}]
  ] as [string, VectorOptions][])('rejects an unpacked degree output: %s', (_name, options) => {
    const fixture = createDegreeFixture();
    const props = createDegreeProps(fixture);
    const output = createVector(
      fixture,
      'unpacked-degree',
      'uint32',
      [new Uint32Array(props.topology.graph.vertexCount)],
      options
    );

    expect(() => new GPUGraphDegree({...props, output})).toThrow(/output|packed|aligned|uint32/);
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
  ])('rejects degree output backed by an existing physical allocation: %s', vectorName => {
    const fixture = createDegreeFixture();
    const props = createDegreeProps(fixture, {vertexCount: 1, reverse: true, weighted: true});
    const vector = getTopologyVector(props.topology, vectorName);
    const buffer = vector.data[0].buffer;
    const output = createVector(fixture, 'aliased-degree-output', 'uint32', [new Uint32Array(1)], {
      buffer
    });

    expect(() => new GPUGraphDegree({...props, output})).toThrow(
      /output|distinct|physical|allocation/
    );
  });

  test('detects a topology buffer hidden behind a borrowed DynamicBuffer wrapper', () => {
    const fixture = createDegreeFixture();
    const props = createDegreeProps(fixture);
    const concreteBuffer = props.topology.forward.offsets.data[0].buffer as Buffer;
    const dynamicBuffer = new DynamicBuffer(fixture.device, {
      id: 'borrowed-offsets-wrapper',
      buffer: concreteBuffer,
      ownsBuffer: false
    });
    fixture.dynamicBuffers.push(dynamicBuffer);
    const output = createVector(
      fixture,
      'dynamic-aliased-degree',
      'uint32',
      [new Uint32Array(props.topology.graph.vertexCount)],
      {buffer: dynamicBuffer}
    );

    expect(() => new GPUGraphDegree({...props, output})).toThrow(/distinct|physical|allocation/);
    expect(concreteBuffer.destroyed).toBe(false);
  });
});

function createDegreeFixture(): DegreeFixture {
  const fixture = {device: new NullDevice({}), buffers: [], dynamicBuffers: [], vectors: []};
  degreeFixtures.push(fixture);
  return fixture;
}

function createDegreeProps(
  fixture: DegreeFixture,
  options: {vertexCount?: number; directed?: boolean; reverse?: boolean; weighted?: boolean} = {}
): GPUGraphDegreeProps {
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
  const output = createVector(fixture, 'degree', 'uint32', [new Uint32Array(vertexCount)]);
  return {topology, output};
}

function createAdjacency(
  fixture: DegreeFixture,
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

function createVector<Format extends ScalarFormat>(
  fixture: DegreeFixture,
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
