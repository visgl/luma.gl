// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import * as experimentalModule from '@luma.gl/experimental';
import {
  LuGraph,
  LuGraphTopology,
  type LuGraphAdjacency,
  type LuGraphTopologyProps
} from '@luma.gl/experimental/lugraph';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import {afterEach, describe, expect, test, vi} from 'vitest';

type ScalarFormat = 'uint32' | 'float32' | 'sint32';
type ScalarValues = Uint32Array | Float32Array | Int32Array;

type TopologyFixture = {
  device: NullDevice;
  buffers: Buffer[];
  vectors: GPUVector[];
};

type VectorOptions = {
  buffer?: Buffer;
  byteOffset?: number;
  byteStride?: number;
  rowByteLength?: number;
};

const topologyFixtures: TopologyFixture[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const fixture of topologyFixtures.splice(0)) {
    for (const vector of fixture.vectors) vector.destroy();
    for (const buffer of fixture.buffers) buffer.destroy();
    fixture.device.destroy();
  }
});

describe('LuGraphTopology public boundary and ownership', () => {
  test('exposes the topology contributor only through the optional luGraph entry point', () => {
    expect(typeof LuGraphTopology).toBe('function');
    expect('LuGraphTopology' in experimentalModule).toBe(false);
  });

  test('preserves borrowed source and output vectors without allocating or executing work', () => {
    const fixture = createTopologyFixture();
    const props = createTopologyProps(fixture, {weighted: true, reverse: true});
    const createBufferSpy = vi.spyOn(fixture.device, 'createBuffer');
    const createCommandEncoderSpy = vi.spyOn(fixture.device, 'createCommandEncoder');
    const submitSpy = vi.spyOn(fixture.device, 'submit');
    const readbackSpies = fixture.buffers.map(buffer => vi.spyOn(buffer, 'readAsync'));

    const topology = new LuGraphTopology({...props, id: 'borrowed-topology'});

    expect(topology.id).toBe('borrowed-topology');
    expect(topology.graph).toBe(props.graph);
    expect(topology.forward).toBe(props.forward);
    expect(topology.reverse).toBe(props.reverse);
    expect(topology.invalidEdgeCount).toBe(props.invalidEdgeCount);
    expect(topology.graph.sourceVertices.data.map(chunk => chunk.length)).toEqual([2, 0, 3]);
    expect(topology.forward.edgeWeights).toBe(props.forward.edgeWeights);
    expect(topology.reverse?.edgeWeights).toBe(props.reverse?.edgeWeights);
    expect(createBufferSpy).not.toHaveBeenCalled();
    expect(createCommandEncoderSpy).not.toHaveBeenCalled();
    expect(submitSpy).not.toHaveBeenCalled();
    for (const readbackSpy of readbackSpies) expect(readbackSpy).not.toHaveBeenCalled();
    expect(Reflect.has(topology, 'destroy')).toBe(false);

    for (const vector of fixture.vectors) vector.destroy();
    expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);
  });

  test('accepts zero-capacity adjacency with one physically allocated empty output chunk', () => {
    const fixture = createTopologyFixture();
    const props = createTopologyProps(fixture, {capacity: 0});
    const topology = new LuGraphTopology(props);

    expect(topology.forward.neighbors.length).toBe(0);
    expect(topology.forward.neighbors.data).toHaveLength(1);
    expect(topology.forward.neighbors.data[0].buffer.byteLength).toBeGreaterThanOrEqual(4);
  });
});

describe('LuGraphTopology adjacency output validation', () => {
  test.each([0, 2])('requires exactly one row in every status vector: %i', statusLength => {
    const fixture = createTopologyFixture();
    const props = createTopologyProps(fixture);

    for (const statusName of ['count', 'overflow'] as const) {
      const status = createVector(fixture, `${statusName}-${statusLength}`, 'uint32', [
        new Uint32Array(statusLength)
      ]);
      expect(
        () => new LuGraphTopology({...props, forward: {...props.forward, [statusName]: status}})
      ).toThrow(new RegExp(`${statusName}|one|length`));
    }

    const invalidEdgeCount = createVector(fixture, 'invalid-length', 'uint32', [
      new Uint32Array(statusLength)
    ]);
    expect(() => new LuGraphTopology({...props, invalidEdgeCount})).toThrow(
      /invalidEdgeCount|one|length/
    );
  });

  test.each([0, 2])('requires exactly vertexCount + 1 CSR offsets: delta %i', delta => {
    const fixture = createTopologyFixture();
    const props = createTopologyProps(fixture);
    const offsets = createVector(fixture, `offsets-${delta}`, 'uint32', [
      new Uint32Array(props.graph.vertexCount + delta)
    ]);

    expect(() => new LuGraphTopology({...props, forward: {...props.forward, offsets}})).toThrow(
      /offsets|vertexCount/
    );
  });

  test.each([
    'offsets',
    'neighbors',
    'edgeIds',
    'count',
    'overflow'
  ] as const)('requires packed uint32 adjacency output: %s', outputName => {
    const fixture = createTopologyFixture();
    const props = createTopologyProps(fixture);
    const original = props.forward[outputName];
    const wrongFormat = createVector(fixture, `${outputName}-float`, 'float32', [
      new Float32Array(original.length)
    ]) as unknown as GPUVector<'uint32'>;

    expect(
      () => new LuGraphTopology({...props, forward: {...props.forward, [outputName]: wrongFormat}})
    ).toThrow(new RegExp(`${outputName}|uint32|packed|format`));
  });

  test('requires a uint32 invalid-edge status and float32 output weights', () => {
    const fixture = createTopologyFixture();
    const props = createTopologyProps(fixture, {weighted: true});
    const invalidEdgeCount = createVector(fixture, 'float-invalid-status', 'float32', [
      Float32Array.from([0])
    ]) as unknown as GPUVector<'uint32'>;
    const edgeWeights = createVector(fixture, 'uint-output-weights', 'uint32', [
      new Uint32Array(props.forward.neighbors.length)
    ]) as unknown as GPUVector<'float32'>;

    expect(() => new LuGraphTopology({...props, invalidEdgeCount})).toThrow(
      /invalidEdgeCount|uint32/
    );
    expect(() => new LuGraphTopology({...props, forward: {...props.forward, edgeWeights}})).toThrow(
      /edgeWeights|float32/
    );
  });

  test.each([
    ['misaligned byte offset', {byteOffset: 2}],
    ['padded byte stride', {byteStride: 8}],
    ['oversized row payload', {rowByteLength: 8}]
  ] as [string, VectorOptions][])('rejects an unpacked status output: %s', (_name, options) => {
    const fixture = createTopologyFixture();
    const props = createTopologyProps(fixture);
    const count = createVector(fixture, 'unpacked-status', 'uint32', [new Uint32Array(1)], options);

    expect(() => new LuGraphTopology({...props, forward: {...props.forward, count}})).toThrow(
      /count|packed|align/
    );
  });

  test.each([0, 2])('requires exactly one output GPUData chunk: %i chunks', chunkCount => {
    const fixture = createTopologyFixture();
    const props = createTopologyProps(fixture);
    const chunks = chunkCount === 0 ? [] : [new Uint32Array(2), new Uint32Array(3)];
    const neighbors = createVector(fixture, `neighbor-chunks-${chunkCount}`, 'uint32', chunks);

    expect(() => new LuGraphTopology({...props, forward: {...props.forward, neighbors}})).toThrow(
      /neighbors|single|chunk/
    );
  });

  test.each([4, 6])('requires stable edge-ID capacity to equal neighbor capacity: %i', capacity => {
    const fixture = createTopologyFixture();
    const props = createTopologyProps(fixture);
    const edgeIds = createVector(fixture, 'mismatched-edge-ids', 'uint32', [
      new Uint32Array(capacity)
    ]);

    expect(() => new LuGraphTopology({...props, forward: {...props.forward, edgeIds}})).toThrow(
      /edgeIds|capacity|neighbors/
    );
  });

  test('requires aligned source and adjacency edge-weight contracts and capacities', () => {
    const fixture = createTopologyFixture();
    const weighted = createTopologyProps(fixture, {weighted: true, reverse: true});
    const unweighted = createTopologyProps(fixture);
    const shortWeights = createVector(fixture, 'short-output-weights', 'float32', [
      new Float32Array(4)
    ]);

    expect(
      () =>
        new LuGraphTopology({
          ...weighted,
          forward: {...weighted.forward, edgeWeights: undefined}
        })
    ).toThrow(/edgeWeights|weight/);
    expect(
      () =>
        new LuGraphTopology({
          ...weighted,
          reverse: {...weighted.reverse!, edgeWeights: undefined}
        })
    ).toThrow(/reverse|edgeWeights|weight/);
    expect(
      () =>
        new LuGraphTopology({
          ...weighted,
          forward: {...weighted.forward, edgeWeights: shortWeights}
        })
    ).toThrow(/edgeWeights|capacity|neighbors/);
    expect(
      () =>
        new LuGraphTopology({
          ...unweighted,
          forward: {...unweighted.forward, edgeWeights: weighted.forward.edgeWeights}
        })
    ).toThrow(/edgeWeights|weight/);
  });

  test('rejects writable outputs backed by source allocations', () => {
    const fixture = createTopologyFixture();
    const props = createTopologyProps(fixture);
    const sourceBuffer = props.graph.sourceVertices.data[0].buffer as Buffer;
    const count = createVector(fixture, 'aliased-source-status', 'uint32', [new Uint32Array(1)], {
      buffer: sourceBuffer
    });

    expect(() => new LuGraphTopology({...props, forward: {...props.forward, count}})).toThrow(
      /distinct|allocation|alias|source/
    );
  });

  test('rejects distinct writable views even when their physical buffer ranges do not overlap', () => {
    const fixture = createTopologyFixture();
    const props = createTopologyProps(fixture, {reverse: true});
    const count = createVector(fixture, 'shared-count', 'uint32', [new Uint32Array(2)]);
    const sharedBuffer = count.data[0].buffer as Buffer;
    const firstStatus = createVector(fixture, 'first-status', 'uint32', [new Uint32Array(1)], {
      buffer: sharedBuffer,
      byteOffset: 0
    });
    const secondStatus = createVector(fixture, 'second-status', 'uint32', [new Uint32Array(1)], {
      buffer: sharedBuffer,
      byteOffset: 4
    });

    expect(
      () =>
        new LuGraphTopology({
          ...props,
          forward: {...props.forward, count: firstStatus},
          reverse: {...props.reverse!, count: secondStatus}
        })
    ).toThrow(/distinct|allocation|alias/);
  });

  test('rejects redundant reverse adjacency for undirected graphs', () => {
    const fixture = createTopologyFixture();
    const props = createTopologyProps(fixture, {directed: false, reverse: true});

    expect(() => new LuGraphTopology(props)).toThrow(/reverse|undirected|directed/);
  });

  test('rejects undirected source edge counts that could overflow uint32 adjacency offsets', () => {
    const fixture = createTopologyFixture();
    const props = createTopologyProps(fixture, {directed: false});
    props.graph.sourceVertices.length = 0x80000000;
    props.graph.targetVertices.length = 0x80000000;

    expect(() => new LuGraphTopology(props)).toThrow(/undirected|uint32|overflow/);
  });
});

function createTopologyFixture(): TopologyFixture {
  const fixture = {device: new NullDevice({}), buffers: [], vectors: []};
  topologyFixtures.push(fixture);
  return fixture;
}

function createTopologyProps(
  fixture: TopologyFixture,
  options: {weighted?: boolean; directed?: boolean; reverse?: boolean; capacity?: number} = {}
): LuGraphTopologyProps {
  const sourceVertices = createVector(fixture, 'sources', 'uint32', [
    Uint32Array.from([0, 2]),
    new Uint32Array(0),
    Uint32Array.from([2, 3, 4])
  ]);
  const targetVertices = createVector(fixture, 'targets', 'uint32', [
    Uint32Array.from([1, 4]),
    new Uint32Array(0),
    Uint32Array.from([3, 5, 1])
  ]);
  const edgeWeights = options.weighted
    ? createVector(fixture, 'source-weights', 'float32', [
        Float32Array.from([0.5, 2]),
        new Float32Array(0),
        Float32Array.from([1, 4, 8])
      ])
    : undefined;
  const graph = new LuGraph({
    vertexCount: 6,
    sourceVertices,
    targetVertices,
    edgeWeights,
    directed: options.directed
  });
  const capacity = options.capacity ?? graph.edgeCount;

  return {
    graph,
    forward: createAdjacency(fixture, 'forward', graph.vertexCount, capacity, options.weighted),
    reverse: options.reverse
      ? createAdjacency(fixture, 'reverse', graph.vertexCount, capacity, options.weighted)
      : undefined,
    invalidEdgeCount: createVector(fixture, 'invalid', 'uint32', [new Uint32Array(1)])
  };
}

function createAdjacency(
  fixture: TopologyFixture,
  name: string,
  vertexCount: number,
  capacity: number,
  weighted = false
): LuGraphAdjacency {
  return {
    offsets: createVector(fixture, `${name}-offsets`, 'uint32', [new Uint32Array(vertexCount + 1)]),
    neighbors: createVector(fixture, `${name}-neighbors`, 'uint32', [new Uint32Array(capacity)]),
    edgeIds: createVector(fixture, `${name}-edge-ids`, 'uint32', [new Uint32Array(capacity)]),
    edgeWeights: weighted
      ? createVector(fixture, `${name}-weights`, 'float32', [new Float32Array(capacity)])
      : undefined,
    count: createVector(fixture, `${name}-count`, 'uint32', [new Uint32Array(1)]),
    overflow: createVector(fixture, `${name}-overflow`, 'uint32', [new Uint32Array(1)])
  };
}

function createVector<Format extends ScalarFormat>(
  fixture: TopologyFixture,
  name: string,
  format: Format,
  chunks: readonly ScalarValues[],
  options: VectorOptions = {}
): GPUVector<Format> {
  const byteOffset = options.byteOffset ?? 0;
  const byteStride = options.byteStride ?? Uint32Array.BYTES_PER_ELEMENT;
  const rowByteLength = options.rowByteLength ?? Uint32Array.BYTES_PER_ELEMENT;
  const data = chunks.map((values, chunkIndex) => {
    const buffer =
      options.buffer ??
      fixture.device.createBuffer({
        id: `${name}-chunk-${chunkIndex}-${fixture.buffers.length}`,
        byteLength: byteOffset + Math.max(Math.max(values.length, 1) * byteStride, rowByteLength),
        usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
      });
    if (!options.buffer) fixture.buffers.push(buffer);
    return new GPUData<Format>({
      buffer,
      format,
      length: values.length,
      byteOffset,
      byteStride,
      rowByteLength,
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
    ownsData: false
  });
  fixture.vectors.push(vector);
  return vector;
}
