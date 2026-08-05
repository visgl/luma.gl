// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import * as experimentalModule from '@luma.gl/experimental';
import {
  LuGraph,
  LuGraphLabelPropagation,
  LuGraphTopology,
  type LuGraphAdjacency,
  type LuGraphLabelPropagationProps
} from '@luma.gl/experimental/lugraph';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import {afterEach, describe, expect, test, vi} from 'vitest';

type ScalarFormat = 'uint32' | 'float32';
type ScalarValues = Uint32Array | Float32Array;

type PropagationFixture = {
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

const propagationFixtures: PropagationFixture[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const fixture of propagationFixtures.splice(0)) {
    for (const vector of fixture.vectors) vector.destroy();
    for (const dynamicBuffer of fixture.dynamicBuffers) dynamicBuffer.destroy();
    for (const buffer of fixture.buffers) buffer.destroy();
    fixture.device.destroy();
  }
});

describe('LuGraphLabelPropagation public contract and ownership', () => {
  test('keeps community detection isolated in the optional luGraph entry point', () => {
    expect(typeof LuGraphLabelPropagation).toBe('function');
    expect('LuGraphLabelPropagation' in experimentalModule).toBe(false);
  });

  test('preserves graph topology and caller outputs without allocations, submission, or readback', () => {
    const fixture = createPropagationFixture();
    const props = createPropagationProps(fixture, {reverse: true, weighted: true, status: true});
    const createBufferSpy = vi.spyOn(fixture.device, 'createBuffer');
    const createCommandEncoderSpy = vi.spyOn(fixture.device, 'createCommandEncoder');
    const submitSpy = vi.spyOn(fixture.device, 'submit');
    const readbackSpies = fixture.buffers.map(buffer => vi.spyOn(buffer, 'readAsync'));

    const propagation = new LuGraphLabelPropagation({...props, id: 'borrowed-communities'});

    expect(propagation.id).toBe('borrowed-communities');
    expect(propagation.topology).toBe(props.topology);
    expect(propagation.output).toBe(props.output);
    expect(propagation.converged).toBe(props.converged);
    expect(propagation.iterations).toBe(32);
    expect(propagation.topology.graph.sourceVertices.data.map(chunk => chunk.length)).toEqual([
      2, 0, 3
    ]);
    expect(createBufferSpy).not.toHaveBeenCalled();
    expect(createCommandEncoderSpy).not.toHaveBeenCalled();
    expect(submitSpy).not.toHaveBeenCalled();
    for (const readbackSpy of readbackSpies) expect(readbackSpy).not.toHaveBeenCalled();
    expect(Reflect.has(propagation, 'destroy')).toBe(false);

    for (const vector of fixture.vectors) vector.destroy();
    expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);
  });

  test('requires reverse adjacency for directed weak-neighbor community votes', () => {
    const fixture = createPropagationFixture();
    const props = createPropagationProps(fixture, {reverse: false});

    expect(() => new LuGraphLabelPropagation(props)).toThrow(/directed|reverse/);
  });

  test('accepts directed reverse CSR without optional convergence status', () => {
    const fixture = createPropagationFixture();
    const props = createPropagationProps(fixture);
    const propagation = new LuGraphLabelPropagation(props);

    expect(propagation.id).toBe('lu-graph-label-propagation');
    expect(propagation.topology.graph.directed).toBe(true);
    expect(propagation.topology.reverse).toBeDefined();
    expect(propagation.converged).toBeUndefined();
  });

  test('accepts symmetric undirected forward adjacency without reverse CSR', () => {
    const fixture = createPropagationFixture();
    const props = createPropagationProps(fixture, {directed: false});
    const propagation = new LuGraphLabelPropagation(props);

    expect(propagation.topology.graph.directed).toBe(false);
    expect(propagation.topology.reverse).toBeUndefined();
  });

  test('accepts empty graph outputs and optional uint32 convergence status', () => {
    const fixture = createPropagationFixture();
    const props = createPropagationProps(fixture, {vertexCount: 0, status: true});
    const propagation = new LuGraphLabelPropagation(props);

    expect(propagation.output.length).toBe(0);
    expect(propagation.output.data).toHaveLength(1);
    expect(propagation.output.data[0].buffer.byteLength).toBeGreaterThanOrEqual(4);
    expect(propagation.converged?.length).toBe(1);
  });
});

describe('LuGraphLabelPropagation iteration and vector validation', () => {
  test.each([1, 32, 1024])('accepts a positive bounded iteration count: %i', iterations => {
    const fixture = createPropagationFixture();
    const props = createPropagationProps(fixture);

    expect(new LuGraphLabelPropagation({...props, iterations}).iterations).toBe(iterations);
  });

  test.each([
    0,
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    1025
  ])('rejects an invalid or excessive iteration count: %s', iterations => {
    const fixture = createPropagationFixture();
    const props = createPropagationProps(fixture);

    expect(() => new LuGraphLabelPropagation({...props, iterations})).toThrow(
      /iterations|positive|1024/
    );
  });

  test.each([5, 7])('requires exactly one output row per graph vertex: %i', length => {
    const fixture = createPropagationFixture();
    const props = createPropagationProps(fixture);
    const output = createVector(fixture, `component-length-${length}`, 'uint32', [
      new Uint32Array(length)
    ]);

    expect(() => new LuGraphLabelPropagation({...props, output})).toThrow(
      /output|vertexCount|length/
    );
  });

  test('requires uint32 component IDs instead of float32', () => {
    const fixture = createPropagationFixture();
    const props = createPropagationProps(fixture);
    const output = createVector(fixture, 'float-components', 'float32', [
      new Float32Array(props.topology.graph.vertexCount)
    ]) as unknown as GPUVector<'uint32'>;

    expect(() => new LuGraphLabelPropagation({...props, output})).toThrow(/output|uint32|packed/);
  });

  test.each([0, 2])('requires exactly one physical component-ID chunk: %i', chunkCount => {
    const fixture = createPropagationFixture();
    const props = createPropagationProps(fixture);
    const chunks = chunkCount === 0 ? [] : [new Uint32Array(3), new Uint32Array(3)];
    const output = createVector(fixture, 'partitioned-components', 'uint32', chunks);

    expect(() => new LuGraphLabelPropagation({...props, output})).toThrow(
      /output|one|single|chunk/
    );
  });

  test.each([
    ['misaligned byte offset', {byteOffset: 2}],
    ['padded byte stride', {byteStride: 8}],
    ['oversized row payload', {rowByteLength: 8}],
    ['multi-component scalar stride', {stride: 2}]
  ] as [string, VectorOptions][])('rejects unpacked component output: %s', (_name, options) => {
    const fixture = createPropagationFixture();
    const props = createPropagationProps(fixture);
    const output = createVector(
      fixture,
      'unpacked-components',
      'uint32',
      [new Uint32Array(props.topology.graph.vertexCount)],
      options
    );

    expect(() => new LuGraphLabelPropagation({...props, output})).toThrow(
      /output|packed|aligned|uint32/
    );
  });

  test.each([0, 2])('requires exactly one convergence status row: %i', length => {
    const fixture = createPropagationFixture();
    const props = createPropagationProps(fixture, {status: true});
    const converged = createVector(fixture, `convergence-length-${length}`, 'uint32', [
      new Uint32Array(length)
    ]);

    expect(() => new LuGraphLabelPropagation({...props, converged})).toThrow(
      /converged|one|row|scalar/
    );
  });

  test('requires packed uint32 convergence status with exactly one chunk', () => {
    const fixture = createPropagationFixture();
    const props = createPropagationProps(fixture, {status: true});
    const wrongFormat = createVector(fixture, 'float-convergence', 'float32', [
      new Float32Array(1)
    ]) as unknown as GPUVector<'uint32'>;
    const partitioned = createVector(fixture, 'partitioned-convergence', 'uint32', [
      new Uint32Array(1),
      new Uint32Array(0)
    ]);

    expect(() => new LuGraphLabelPropagation({...props, converged: wrongFormat})).toThrow(
      /converged|uint32|packed/
    );
    expect(() => new LuGraphLabelPropagation({...props, converged: partitioned})).toThrow(
      /converged|one|single|chunk/
    );
  });

  test('accepts uint32-aligned component and status ranges at non-256-byte offsets', () => {
    const fixture = createPropagationFixture();
    const props = createPropagationProps(fixture);
    const output = createVector(
      fixture,
      'offset-components',
      'uint32',
      [new Uint32Array(props.topology.graph.vertexCount)],
      {byteOffset: 4}
    );
    const converged = createVector(fixture, 'offset-convergence', 'uint32', [new Uint32Array(1)], {
      byteOffset: 4
    });

    const propagation = new LuGraphLabelPropagation({...props, output, converged});
    expect(propagation.output.data[0].byteOffset).toBe(4);
    expect(propagation.converged?.data[0].byteOffset).toBe(4);
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
  ])('rejects writable labels backed by existing physical allocation: %s', vectorName => {
    const fixture = createPropagationFixture();
    const props = createPropagationProps(fixture, {vertexCount: 1, reverse: true, weighted: true});
    const vector = getTopologyVector(props.topology, vectorName);
    const output = createVector(fixture, 'aliased-components', 'uint32', [new Uint32Array(1)], {
      buffer: vector.data[0].buffer
    });

    expect(() => new LuGraphLabelPropagation({...props, output})).toThrow(
      /output|distinct|physical|allocation/
    );
  });

  test('rejects convergence status aliasing component labels or topology allocations', () => {
    const fixture = createPropagationFixture();
    const props = createPropagationProps(fixture, {vertexCount: 1, status: true});
    const outputAlias = createVector(
      fixture,
      'aliased-output-status',
      'uint32',
      [new Uint32Array(1)],
      {
        buffer: props.output.data[0].buffer
      }
    );
    const topologyAlias = createVector(
      fixture,
      'aliased-topology-status',
      'uint32',
      [new Uint32Array(1)],
      {buffer: props.topology.invalidEdgeCount.data[0].buffer}
    );

    expect(() => new LuGraphLabelPropagation({...props, converged: outputAlias})).toThrow(
      /converged|distinct|physical|allocation/
    );
    expect(() => new LuGraphLabelPropagation({...props, converged: topologyAlias})).toThrow(
      /converged|distinct|physical|allocation/
    );
  });

  test('unwraps borrowed DynamicBuffer wrappers when checking physical component aliases', () => {
    const fixture = createPropagationFixture();
    const props = createPropagationProps(fixture);
    const concreteBuffer = props.topology.forward.offsets.data[0].buffer as Buffer;
    const dynamicBuffer = new DynamicBuffer(fixture.device, {
      id: 'borrowed-offset-wrapper',
      buffer: concreteBuffer,
      ownsBuffer: false
    });
    fixture.dynamicBuffers.push(dynamicBuffer);
    const output = createVector(
      fixture,
      'dynamic-aliased-components',
      'uint32',
      [new Uint32Array(props.topology.graph.vertexCount)],
      {buffer: dynamicBuffer}
    );

    expect(() => new LuGraphLabelPropagation({...props, output})).toThrow(
      /distinct|physical|allocation/
    );
    expect(concreteBuffer.destroyed).toBe(false);
  });
});

function createPropagationFixture(): PropagationFixture {
  const fixture = {device: new NullDevice({}), buffers: [], dynamicBuffers: [], vectors: []};
  propagationFixtures.push(fixture);
  return fixture;
}

function createPropagationProps(
  fixture: PropagationFixture,
  options: {
    vertexCount?: number;
    directed?: boolean;
    reverse?: boolean;
    weighted?: boolean;
    status?: boolean;
  } = {}
): LuGraphLabelPropagationProps {
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
  const output = createVector(fixture, 'componentIds', 'uint32', [new Uint32Array(vertexCount)]);
  const converged = options.status
    ? createVector(fixture, 'converged', 'uint32', [new Uint32Array(1)])
    : undefined;
  return {topology, output, converged};
}

function createAdjacency(
  fixture: PropagationFixture,
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
  fixture: PropagationFixture,
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
