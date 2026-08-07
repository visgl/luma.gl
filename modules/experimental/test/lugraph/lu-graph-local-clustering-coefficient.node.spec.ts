// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import * as experimentalModule from '@luma.gl/experimental';
import {
  LuGraph,
  LuGraphLocalClusteringCoefficient,
  LuGraphTopology,
  type LuGraphAdjacency,
  type LuGraphLocalClusteringCoefficientProps
} from '@luma.gl/experimental/lugraph';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import {afterEach, describe, expect, test, vi} from 'vitest';
import {getLuGraphLocalClusteringCoefficientDispatchLayout} from '../../src/lugraph/lu-graph-local-clustering-coefficient-internals';

type ScalarFormat = 'uint32' | 'float32';
type ScalarValues = Uint32Array | Float32Array;

type ClusteringFixture = {
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

const clusteringFixtures: ClusteringFixture[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const fixture of clusteringFixtures.splice(0)) {
    for (const vector of fixture.vectors) vector.destroy();
    for (const dynamicBuffer of fixture.dynamicBuffers) dynamicBuffer.destroy();
    for (const buffer of fixture.buffers) buffer.destroy();
    fixture.device.destroy();
  }
});

describe('LuGraphLocalClusteringCoefficient public contract and ownership', () => {
  test('keeps Graphalytics clustering isolated in the optional luGraph entry point', () => {
    expect(typeof LuGraphLocalClusteringCoefficient).toBe('function');
    expect('LuGraphLocalClusteringCoefficient' in experimentalModule).toBe(false);
  });

  test('borrows topology and both outputs without allocation, submission, or source readback', () => {
    const fixture = createClusteringFixture();
    const props = createClusteringProps(fixture, {weighted: true, triangles: true});
    const createBufferSpy = vi.spyOn(fixture.device, 'createBuffer');
    const createCommandEncoderSpy = vi.spyOn(fixture.device, 'createCommandEncoder');
    const submitSpy = vi.spyOn(fixture.device, 'submit');
    const readbackSpies = fixture.buffers.map(buffer => vi.spyOn(buffer, 'readAsync'));

    const clustering = new LuGraphLocalClusteringCoefficient({...props, id: 'borrowed-triangles'});

    expect(clustering.id).toBe('borrowed-triangles');
    expect(clustering.topology).toBe(props.topology);
    expect(clustering.output).toBe(props.output);
    expect(clustering.triangles).toBe(props.triangles);
    expect(clustering.topology.graph.sourceVertices.data.map(chunk => chunk.length)).toEqual([
      2, 0, 3
    ]);
    expect(createBufferSpy).not.toHaveBeenCalled();
    expect(createCommandEncoderSpy).not.toHaveBeenCalled();
    expect(submitSpy).not.toHaveBeenCalled();
    for (const readbackSpy of readbackSpies) expect(readbackSpy).not.toHaveBeenCalled();
    expect(Reflect.has(clustering, 'destroy')).toBe(false);

    for (const vector of fixture.vectors) vector.destroy();
    expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);
  });

  test('requires reverse adjacency for exact directed weak-neighbor clustering', () => {
    const fixture = createClusteringFixture();
    const props = createClusteringProps(fixture, {reverse: false});

    expect(() => new LuGraphLocalClusteringCoefficient(props)).toThrow(/directed|reverse/);
  });

  test('accepts directed reverse CSR without optional triangle output', () => {
    const fixture = createClusteringFixture();
    const clustering = new LuGraphLocalClusteringCoefficient(createClusteringProps(fixture));

    expect(clustering.id).toBe('lu-graph-local-clustering-coefficient');
    expect(clustering.topology.graph.directed).toBe(true);
    expect(clustering.topology.reverse).toBeDefined();
    expect(clustering.triangles).toBeUndefined();
  });

  test('accepts symmetric undirected adjacency without reverse CSR', () => {
    const fixture = createClusteringFixture();
    const props = createClusteringProps(fixture, {directed: false, triangles: true});
    const clustering = new LuGraphLocalClusteringCoefficient(props);

    expect(clustering.topology.graph.directed).toBe(false);
    expect(clustering.topology.reverse).toBeUndefined();
    expect(clustering.triangles?.length).toBe(props.topology.graph.vertexCount);
  });

  test('accepts empty graph coefficient and optional triangle outputs', () => {
    const fixture = createClusteringFixture();
    const clustering = new LuGraphLocalClusteringCoefficient(
      createClusteringProps(fixture, {vertexCount: 0, triangles: true})
    );

    expect(clustering.output.length).toBe(0);
    expect(clustering.output.data).toHaveLength(1);
    expect(clustering.triangles?.length).toBe(0);
  });

  test('plans bounded three-dimensional clustering dispatch without truncating vertices', () => {
    expect(getLuGraphLocalClusteringCoefficientDispatchLayout(0, 2)).toEqual({x: 1, y: 1, z: 1});
    expect(getLuGraphLocalClusteringCoefficientDispatchLayout(512, 2)).toEqual({
      x: 2,
      y: 1,
      z: 1
    });
    expect(getLuGraphLocalClusteringCoefficientDispatchLayout(513, 2)).toEqual({
      x: 2,
      y: 2,
      z: 1
    });
    expect(getLuGraphLocalClusteringCoefficientDispatchLayout(1025, 2)).toEqual({
      x: 2,
      y: 2,
      z: 2
    });
    expect(() => getLuGraphLocalClusteringCoefficientDispatchLayout(2049, 2)).toThrow(
      /3D dispatch limit/
    );
  });
});

describe('LuGraphLocalClusteringCoefficient output validation', () => {
  test.each([5, 7])('requires exactly one coefficient row per vertex: %i', length => {
    const fixture = createClusteringFixture();
    const props = createClusteringProps(fixture);
    const output = createVector(fixture, 'coefficient-length', 'float32', [
      new Float32Array(length)
    ]);

    expect(() => new LuGraphLocalClusteringCoefficient({...props, output})).toThrow(
      /output|float32|rows/
    );
  });

  test('requires packed float32 coefficients instead of uint32', () => {
    const fixture = createClusteringFixture();
    const props = createClusteringProps(fixture);
    const output = createVector(fixture, 'integer-coefficients', 'uint32', [
      new Uint32Array(props.topology.graph.vertexCount)
    ]) as unknown as GPUVector<'float32'>;

    expect(() => new LuGraphLocalClusteringCoefficient({...props, output})).toThrow(
      /output|float32|packed/
    );
  });

  test.each([0, 2])('requires exactly one coefficient output chunk: %i', chunkCount => {
    const fixture = createClusteringFixture();
    const props = createClusteringProps(fixture);
    const chunks = chunkCount === 0 ? [] : [new Float32Array(3), new Float32Array(3)];
    const output = createVector(fixture, 'partitioned-coefficients', 'float32', chunks);

    expect(() => new LuGraphLocalClusteringCoefficient({...props, output})).toThrow(
      /output|one|chunk/
    );
  });

  test.each([
    ['misaligned byte offset', {byteOffset: 2}],
    ['padded byte stride', {byteStride: 8}],
    ['oversized row payload', {rowByteLength: 8}],
    ['multi-component scalar stride', {stride: 2}]
  ] as [string, VectorOptions][])('rejects unpacked coefficient output: %s', (_name, options) => {
    const fixture = createClusteringFixture();
    const props = createClusteringProps(fixture);
    const output = createVector(
      fixture,
      'unpacked-coefficients',
      'float32',
      [new Float32Array(props.topology.graph.vertexCount)],
      options
    );

    expect(() => new LuGraphLocalClusteringCoefficient({...props, output})).toThrow(
      /output|float32|packed|aligned/
    );
  });

  test.each([5, 7])('requires exactly one optional triangle count per vertex: %i', length => {
    const fixture = createClusteringFixture();
    const props = createClusteringProps(fixture);
    const triangles = createVector(fixture, 'triangle-length', 'uint32', [new Uint32Array(length)]);

    expect(() => new LuGraphLocalClusteringCoefficient({...props, triangles})).toThrow(
      /triangles|uint32|rows/
    );
  });

  test('requires packed uint32 triangle counts instead of float32', () => {
    const fixture = createClusteringFixture();
    const props = createClusteringProps(fixture);
    const triangles = createVector(fixture, 'floating-triangles', 'float32', [
      new Float32Array(props.topology.graph.vertexCount)
    ]) as unknown as GPUVector<'uint32'>;

    expect(() => new LuGraphLocalClusteringCoefficient({...props, triangles})).toThrow(
      /triangles|uint32|packed/
    );
  });

  test.each([0, 2])('requires exactly one triangle output chunk: %i', chunkCount => {
    const fixture = createClusteringFixture();
    const props = createClusteringProps(fixture);
    const chunks = chunkCount === 0 ? [] : [new Uint32Array(3), new Uint32Array(3)];
    const triangles = createVector(fixture, 'partitioned-triangles', 'uint32', chunks);

    expect(() => new LuGraphLocalClusteringCoefficient({...props, triangles})).toThrow(
      /triangles|one|chunk/
    );
  });

  test('accepts both packed outputs at non-256-byte aligned storage-view offsets', () => {
    const fixture = createClusteringFixture();
    const props = createClusteringProps(fixture);
    const output = createVector(
      fixture,
      'offset-coefficients',
      'float32',
      [new Float32Array(props.topology.graph.vertexCount)],
      {byteOffset: 4}
    );
    const triangles = createVector(
      fixture,
      'offset-triangles',
      'uint32',
      [new Uint32Array(props.topology.graph.vertexCount)],
      {byteOffset: 4}
    );

    const clustering = new LuGraphLocalClusteringCoefficient({...props, output, triangles});
    expect(clustering.output.data[0].byteOffset).toBe(4);
    expect(clustering.triangles?.data[0].byteOffset).toBe(4);
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
  ])('rejects coefficients aliasing an existing physical allocation: %s', vectorName => {
    const fixture = createClusteringFixture();
    const props = createClusteringProps(fixture, {vertexCount: 1, weighted: true});
    const vector = getTopologyVector(props.topology, vectorName);
    const output = createVector(fixture, 'aliased-coefficients', 'float32', [new Float32Array(1)], {
      buffer: vector.data[0].buffer
    });

    expect(() => new LuGraphLocalClusteringCoefficient({...props, output})).toThrow(
      /output|distinct|physical|allocation/
    );
  });

  test('rejects optional triangle output aliasing coefficients or topology allocations', () => {
    const fixture = createClusteringFixture();
    const props = createClusteringProps(fixture, {vertexCount: 1, triangles: true});
    const coefficientAlias = createVector(
      fixture,
      'coefficient-alias',
      'uint32',
      [new Uint32Array(1)],
      {buffer: props.output.data[0].buffer}
    );
    const topologyAlias = createVector(fixture, 'topology-alias', 'uint32', [new Uint32Array(1)], {
      buffer: props.topology.invalidEdgeCount.data[0].buffer
    });

    expect(
      () => new LuGraphLocalClusteringCoefficient({...props, triangles: coefficientAlias})
    ).toThrow(/triangles|distinct|physical|allocation/);
    expect(
      () => new LuGraphLocalClusteringCoefficient({...props, triangles: topologyAlias})
    ).toThrow(/triangles|distinct|physical|allocation/);
  });

  test('unwraps borrowed DynamicBuffer wrappers when checking physical output aliases', () => {
    const fixture = createClusteringFixture();
    const props = createClusteringProps(fixture);
    const concreteBuffer = props.topology.forward.offsets.data[0].buffer as Buffer;
    const dynamicBuffer = new DynamicBuffer(fixture.device, {
      id: 'borrowed-offset-wrapper',
      buffer: concreteBuffer,
      ownsBuffer: false
    });
    fixture.dynamicBuffers.push(dynamicBuffer);
    const output = createVector(
      fixture,
      'dynamic-aliased-coefficients',
      'float32',
      [new Float32Array(props.topology.graph.vertexCount)],
      {buffer: dynamicBuffer}
    );

    expect(() => new LuGraphLocalClusteringCoefficient({...props, output})).toThrow(
      /distinct|physical|allocation/
    );
    expect(concreteBuffer.destroyed).toBe(false);
  });
});

function createClusteringFixture(): ClusteringFixture {
  const fixture = {device: new NullDevice({}), buffers: [], dynamicBuffers: [], vectors: []};
  clusteringFixtures.push(fixture);
  return fixture;
}

function createClusteringProps(
  fixture: ClusteringFixture,
  options: {
    vertexCount?: number;
    directed?: boolean;
    reverse?: boolean;
    weighted?: boolean;
    triangles?: boolean;
  } = {}
): LuGraphLocalClusteringCoefficientProps {
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
  const graph = new LuGraph({
    vertexCount,
    sourceVertices,
    targetVertices,
    edgeWeights,
    edgeIds,
    directed: options.directed
  });
  const forward = createAdjacency(fixture, 'forward', vertexCount, 5, options.weighted);
  const reverse =
    (options.reverse ?? options.directed !== false)
      ? createAdjacency(fixture, 'reverse', vertexCount, 5, options.weighted)
      : undefined;
  const invalidEdgeCount = createVector(fixture, 'invalidEdgeCount', 'uint32', [
    new Uint32Array(1)
  ]);
  const topology = new LuGraphTopology({graph, forward, reverse, invalidEdgeCount});
  const output = createVector(fixture, 'local-clustering', 'float32', [
    new Float32Array(vertexCount)
  ]);
  const triangles = options.triangles
    ? createVector(fixture, 'triangle-counts', 'uint32', [new Uint32Array(vertexCount)])
    : undefined;
  return {topology, output, triangles};
}

function createAdjacency(
  fixture: ClusteringFixture,
  name: string,
  vertexCount: number,
  capacity: number,
  weighted = false
): LuGraphAdjacency {
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

function getTopologyVector(topology: LuGraphTopology, name: string): GPUVector {
  if (name === 'invalidEdgeCount') return topology.invalidEdgeCount;
  if (name === 'sourceVertices') return topology.graph.sourceVertices;
  if (name === 'targetVertices') return topology.graph.targetVertices;
  if (name === 'edgeWeights') return topology.graph.edgeWeights!;
  if (name === 'edgeIds') return topology.graph.edgeIds!;

  const [direction, vectorName] = name.split('.');
  const adjacency = direction === 'forward' ? topology.forward : topology.reverse!;
  return adjacency[vectorName as keyof LuGraphAdjacency]!;
}

function createVector<Format extends ScalarFormat>(
  fixture: ClusteringFixture,
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
