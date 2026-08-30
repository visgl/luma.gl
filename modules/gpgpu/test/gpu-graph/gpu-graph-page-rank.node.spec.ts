// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import * as experimentalModule from '@luma.gl/experimental';
import {
  GPUGraph,
  GPUGraphPageRank,
  GPUGraphTopology,
  type GPUGraphAdjacency,
  type GPUGraphPageRankProps
} from '@luma.gl/gpgpu/gpu-graph';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {NullDevice} from '@luma.gl/test-utils';
import {afterEach, describe, expect, test, vi} from 'vitest';

type ScalarFormat = 'uint32' | 'float32';
type ScalarValues = Uint32Array | Float32Array;

type PageRankFixture = {
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

const pageRankFixtures: PageRankFixture[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const fixture of pageRankFixtures.splice(0)) {
    for (const vector of fixture.vectors) vector.destroy();
    for (const dynamicBuffer of fixture.dynamicBuffers) dynamicBuffer.destroy();
    for (const buffer of fixture.buffers) buffer.destroy();
    fixture.device.destroy();
  }
});

describe('GPUGraphPageRank optional API and caller-owned resources', () => {
  test('exposes PageRank only through the experimental GPU Graph package subpath', () => {
    expect(typeof GPUGraphPageRank).toBe('function');
    expect('GPUGraphPageRank' in experimentalModule).toBe(false);
  });

  test('retains caller-owned topology and float outputs without allocating or executing GPU work', () => {
    const fixture = createPageRankFixture();
    const props = createPageRankProps(fixture, {weighted: true, residual: true});
    const createBufferSpy = vi.spyOn(fixture.device, 'createBuffer');
    const createCommandEncoderSpy = vi.spyOn(fixture.device, 'createCommandEncoder');
    const submitSpy = vi.spyOn(fixture.device, 'submit');
    const readbackSpies = fixture.buffers.map(buffer => vi.spyOn(buffer, 'readAsync'));

    const pageRank = new GPUGraphPageRank({...props, id: 'borrowed-page-rank'});

    expect(pageRank.id).toBe('borrowed-page-rank');
    expect(pageRank.topology).toBe(props.topology);
    expect(pageRank.output).toBe(props.output);
    expect(pageRank.residual).toBe(props.residual);
    expect(pageRank.damping).toBe(0.85);
    expect(pageRank.iterations).toBe(40);
    expect(pageRank.topology.graph.sourceVertices.data.map(chunk => chunk.length)).toEqual([
      2, 0, 3
    ]);
    expect(createBufferSpy).not.toHaveBeenCalled();
    expect(createCommandEncoderSpy).not.toHaveBeenCalled();
    expect(submitSpy).not.toHaveBeenCalled();
    for (const readbackSpy of readbackSpies) expect(readbackSpy).not.toHaveBeenCalled();
    expect(Reflect.has(pageRank, 'destroy')).toBe(false);

    for (const vector of fixture.vectors) vector.destroy();
    expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);
  });

  test('requires reverse CSR for directed graphs while allowing symmetric undirected topology', () => {
    const fixture = createPageRankFixture();
    const directed = createPageRankProps(fixture, {reverse: false});
    const undirected = createPageRankProps(fixture, {directed: false, reverse: false});

    expect(() => new GPUGraphPageRank(directed)).toThrow(/reverse|incoming|directed/);
    expect(new GPUGraphPageRank(undirected).topology.reverse).toBeUndefined();
  });

  test('accepts empty rank output with an optional float32 residual scalar', () => {
    const fixture = createPageRankFixture();
    const props = createPageRankProps(fixture, {vertexCount: 0, residual: true});
    const pageRank = new GPUGraphPageRank(props);

    expect(pageRank.output.length).toBe(0);
    expect(pageRank.output.data).toHaveLength(1);
    expect(pageRank.output.data[0].buffer.byteLength).toBeGreaterThanOrEqual(4);
    expect(pageRank.residual?.length).toBe(1);
  });
});

describe('GPUGraphPageRank bounded parameters and float32 vector validation', () => {
  test.each([
    0, 0.5, 0.85, 1
  ])('accepts a finite damping factor in the closed unit interval: %s', damping => {
    const fixture = createPageRankFixture();
    const props = createPageRankProps(fixture);

    expect(new GPUGraphPageRank({...props, damping}).damping).toBe(damping);
  });

  test.each([
    -0.001,
    1.001,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY
  ])('rejects an invalid damping factor: %s', damping => {
    const fixture = createPageRankFixture();
    const props = createPageRankProps(fixture);

    expect(() => new GPUGraphPageRank({...props, damping})).toThrow(/damping|finite|between/);
  });

  test.each([1, 40, 1024])('accepts a positive bounded iteration count: %i', iterations => {
    const fixture = createPageRankFixture();
    const props = createPageRankProps(fixture);

    expect(new GPUGraphPageRank({...props, iterations}).iterations).toBe(iterations);
  });

  test.each([
    0,
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    1025
  ])('rejects an invalid or excessive iteration count: %s', iterations => {
    const fixture = createPageRankFixture();
    const props = createPageRankProps(fixture);

    expect(() => new GPUGraphPageRank({...props, iterations})).toThrow(/iterations|positive|1024/);
  });

  test.each([5, 7])('requires exactly one float score per graph vertex: %i', length => {
    const fixture = createPageRankFixture();
    const props = createPageRankProps(fixture);
    const output = createVector(fixture, `score-length-${length}`, 'float32', [
      new Float32Array(length)
    ]);

    expect(() => new GPUGraphPageRank({...props, output})).toThrow(/output|vertexCount|length/);
  });

  test('requires float32 PageRank scores instead of uint32', () => {
    const fixture = createPageRankFixture();
    const props = createPageRankProps(fixture);
    const output = createVector(fixture, 'uint-page-rank', 'uint32', [
      new Uint32Array(props.topology.graph.vertexCount)
    ]) as unknown as GPUVector<'float32'>;

    expect(() => new GPUGraphPageRank({...props, output})).toThrow(/output|float32|packed/);
  });

  test.each([0, 2])('requires exactly one physical score chunk: %i', chunkCount => {
    const fixture = createPageRankFixture();
    const props = createPageRankProps(fixture);
    const chunks = chunkCount === 0 ? [] : [new Float32Array(3), new Float32Array(3)];
    const output = createVector(fixture, 'partitioned-scores', 'float32', chunks);

    expect(() => new GPUGraphPageRank({...props, output})).toThrow(/output|one|single|chunk/);
  });

  test.each([
    ['misaligned byte offset', {byteOffset: 2}],
    ['padded byte stride', {byteStride: 8}],
    ['oversized row payload', {rowByteLength: 8}],
    ['multi-component scalar stride', {stride: 2}]
  ] as [string, VectorOptions][])('rejects unpacked score output: %s', (_name, options) => {
    const fixture = createPageRankFixture();
    const props = createPageRankProps(fixture);
    const output = createVector(
      fixture,
      'unpacked-page-rank',
      'float32',
      [new Float32Array(props.topology.graph.vertexCount)],
      options
    );

    expect(() => new GPUGraphPageRank({...props, output})).toThrow(/output|packed|aligned|float32/);
  });

  test.each([0, 2])('requires exactly one final float32 residual row: %i', length => {
    const fixture = createPageRankFixture();
    const props = createPageRankProps(fixture, {residual: true});
    const residual = createVector(fixture, `residual-length-${length}`, 'float32', [
      new Float32Array(length)
    ]);

    expect(() => new GPUGraphPageRank({...props, residual})).toThrow(/residual|one|row|scalar/);
  });

  test('requires packed float32 residual data with exactly one chunk', () => {
    const fixture = createPageRankFixture();
    const props = createPageRankProps(fixture, {residual: true});
    const wrongFormat = createVector(fixture, 'uint-residual', 'uint32', [
      new Uint32Array(1)
    ]) as unknown as GPUVector<'float32'>;
    const partitioned = createVector(fixture, 'partitioned-residual', 'float32', [
      new Float32Array(1),
      new Float32Array(0)
    ]);

    expect(() => new GPUGraphPageRank({...props, residual: wrongFormat})).toThrow(
      /residual|float32|packed/
    );
    expect(() => new GPUGraphPageRank({...props, residual: partitioned})).toThrow(
      /residual|one|single|chunk/
    );
  });

  test('accepts float32 score and residual slices at non-256-byte-aligned offsets', () => {
    const fixture = createPageRankFixture();
    const props = createPageRankProps(fixture);
    const output = createVector(
      fixture,
      'offset-page-rank',
      'float32',
      [new Float32Array(props.topology.graph.vertexCount)],
      {byteOffset: 4}
    );
    const residual = createVector(fixture, 'offset-residual', 'float32', [new Float32Array(1)], {
      byteOffset: 4
    });

    const pageRank = new GPUGraphPageRank({...props, output, residual});
    expect(pageRank.output.data[0].byteOffset).toBe(4);
    expect(pageRank.residual?.data[0].byteOffset).toBe(4);
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
  ])('rejects score output backed by an existing physical allocation: %s', vectorName => {
    const fixture = createPageRankFixture();
    const props = createPageRankProps(fixture, {vertexCount: 1, weighted: true, residual: true});
    const vector = getTopologyVector(props.topology, vectorName);
    const output = createVector(fixture, 'aliased-page-rank', 'float32', [new Float32Array(1)], {
      buffer: vector.data[0].buffer
    });

    expect(() => new GPUGraphPageRank({...props, output})).toThrow(
      /output|distinct|physical|allocation/
    );
  });

  test('rejects residual status aliasing scores or topology status buffers', () => {
    const fixture = createPageRankFixture();
    const props = createPageRankProps(fixture, {vertexCount: 1, residual: true});
    const scoreAlias = createVector(
      fixture,
      'aliased-score-residual',
      'float32',
      [new Float32Array(1)],
      {buffer: props.output.data[0].buffer}
    );
    const topologyAlias = createVector(
      fixture,
      'aliased-status-residual',
      'float32',
      [new Float32Array(1)],
      {buffer: props.topology.invalidEdgeCount.data[0].buffer}
    );

    expect(() => new GPUGraphPageRank({...props, residual: scoreAlias})).toThrow(
      /residual|distinct|physical|allocation/
    );
    expect(() => new GPUGraphPageRank({...props, residual: topologyAlias})).toThrow(
      /residual|distinct|physical|allocation/
    );
  });

  test('unwraps borrowed DynamicBuffer views before checking physical score aliases', () => {
    const fixture = createPageRankFixture();
    const props = createPageRankProps(fixture);
    const concreteBuffer = props.topology.forward.offsets.data[0].buffer as Buffer;
    const dynamicBuffer = new DynamicBuffer(fixture.device, {
      id: 'borrowed-offset-wrapper',
      buffer: concreteBuffer,
      ownsBuffer: false
    });
    fixture.dynamicBuffers.push(dynamicBuffer);
    const output = createVector(
      fixture,
      'dynamic-aliased-page-rank',
      'float32',
      [new Float32Array(props.topology.graph.vertexCount)],
      {buffer: dynamicBuffer}
    );

    expect(() => new GPUGraphPageRank({...props, output})).toThrow(/distinct|physical|allocation/);
    expect(concreteBuffer.destroyed).toBe(false);
  });
});

function createPageRankFixture(): PageRankFixture {
  const fixture = {device: new NullDevice({}), buffers: [], dynamicBuffers: [], vectors: []};
  pageRankFixtures.push(fixture);
  return fixture;
}

function createPageRankProps(
  fixture: PageRankFixture,
  options: {
    vertexCount?: number;
    directed?: boolean;
    reverse?: boolean;
    weighted?: boolean;
    residual?: boolean;
  } = {}
): GPUGraphPageRankProps {
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
  const includeReverse = options.reverse ?? directed;
  const reverse = includeReverse
    ? createAdjacency(fixture, 'reverse', vertexCount, 5, options.weighted)
    : undefined;
  const invalidEdgeCount = createVector(fixture, 'invalidEdgeCount', 'uint32', [
    new Uint32Array(1)
  ]);
  const topology = new GPUGraphTopology({graph, forward, reverse, invalidEdgeCount});
  const output = createVector(fixture, 'pageRankScores', 'float32', [
    new Float32Array(vertexCount)
  ]);
  const residual = options.residual
    ? createVector(fixture, 'pageRankResidual', 'float32', [new Float32Array(1)])
    : undefined;
  return {topology, output, residual};
}

function createAdjacency(
  fixture: PageRankFixture,
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
  fixture: PageRankFixture,
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
