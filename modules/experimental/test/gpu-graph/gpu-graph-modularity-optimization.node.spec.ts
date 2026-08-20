// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';

import {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import * as experimentalModule from '@luma.gl/experimental';
import {
  GPUGraph,
  GPUGraphModularityOptimization,
  GPUGraphTopology,
  type GPUGraphAdjacency,
  type GPUGraphModularityOptimizationProps
} from '@luma.gl/experimental/gpu-graph';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import {afterEach, describe, expect, test, vi} from 'vitest';

type ScalarFormat = 'uint32' | 'float32';
type ScalarValues = Uint32Array | Float32Array;

type OptimizationFixture = {
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

const optimizationFixtures: OptimizationFixture[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const fixture of optimizationFixtures.splice(0)) {
    for (const vector of fixture.vectors) vector.destroy();
    for (const dynamicBuffer of fixture.dynamicBuffers) dynamicBuffer.destroy();
    for (const buffer of fixture.buffers) buffer.destroy();
    fixture.device.destroy();
  }
});

describe('GPUGraphModularityOptimization optional graph-analysis contract', () => {
  test('exports bounded modularity improvement only through the optional GPUGraph entry point', () => {
    expect(typeof GPUGraphModularityOptimization).toBe('function');
    expect('GPUGraphModularityOptimization' in experimentalModule).toBe(false);
  });

  test('documents deterministic computed-gain ties without promising bitwise weighted stability', () => {
    const source = readFileSync(
      new URL('../../src/gpu-graph/gpu-graph-modularity-optimization.ts', import.meta.url),
      'utf8'
    );
    const normalizedSource = source.replace(/^\s*\*\s?/gm, ' ').replace(/\s+/g, ' ');

    expect(normalizedSource).toContain(
      'Equal computed gains choose the lowest vertex identifier and then the lowest candidate community'
    );
    expect(normalizedSource).toContain(
      'Weighted float32 accumulation uses unordered atomic additions'
    );
    expect(normalizedSource).toContain(
      'low-order rounding, computed gains, threshold decisions, and'
    );
    expect(normalizedSource).toContain(
      'selected partitions can vary across GPU execution orders or adapters'
    );
    expect(normalizedSource).not.toMatch(/bitwise(?:\s+|-)deterministic/i);
  });

  test('borrows weighted topology, seed, and outputs without allocating or synchronizing', () => {
    const fixture = createOptimizationFixture();
    const props = createOptimizationProps(fixture, {weighted: true, seed: true, statuses: true});
    const createBuffer = vi.spyOn(fixture.device, 'createBuffer');
    const createEncoder = vi.spyOn(fixture.device, 'createCommandEncoder');
    const submit = vi.spyOn(fixture.device, 'submit');
    const readbacks = fixture.buffers.map(buffer => vi.spyOn(buffer, 'readAsync'));

    const operation = new GPUGraphModularityOptimization({
      ...props,
      id: 'borrowed-modularity-optimization',
      resolution: 0.5,
      iterations: 7,
      minimumGain: 0.125
    });

    expect(operation.id).toBe('borrowed-modularity-optimization');
    expect(operation.topology).toBe(props.topology);
    expect(operation.output).toBe(props.output);
    expect(operation.modularity).toBe(props.modularity);
    expect(operation.initialCommunities).toBe(props.initialCommunities);
    expect(operation.resolution).toBe(0.5);
    expect(operation.iterations).toBe(7);
    expect(operation.minimumGain).toBe(0.125);
    expect(operation.converged).toBe(props.converged);
    expect(operation.valid).toBe(props.valid);
    expect(operation.topology.graph.sourceVertices.data.map(chunk => chunk.length)).toEqual([
      2, 0, 2
    ]);
    expect(createBuffer).not.toHaveBeenCalled();
    expect(createEncoder).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
    for (const readback of readbacks) expect(readback).not.toHaveBeenCalled();
    expect(Reflect.has(operation, 'destroy')).toBe(false);

    for (const vector of fixture.vectors) vector.destroy();
    expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);
  });

  test('defaults to singleton initialization, unit resolution, 32 rounds, and zero gain floor', () => {
    const fixture = createOptimizationFixture();
    const operation = new GPUGraphModularityOptimization(createOptimizationProps(fixture));

    expect(operation.id).toBe('gpu-graph-modularity-optimization');
    expect(operation.initialCommunities).toBeUndefined();
    expect(operation.resolution).toBe(1);
    expect(operation.iterations).toBe(32);
    expect(operation.minimumGain).toBe(0);
    expect(operation.converged).toBeUndefined();
    expect(operation.valid).toBeUndefined();
  });

  test.each([0, 1, 32, 1024])('accepts a bounded local-moving budget: %s', iterations => {
    const fixture = createOptimizationFixture();
    expect(
      new GPUGraphModularityOptimization({...createOptimizationProps(fixture), iterations})
        .iterations
    ).toBe(iterations);
  });

  test.each([
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    1025
  ])('rejects an invalid local-moving budget: %s', iterations => {
    const fixture = createOptimizationFixture();
    expect(
      () => new GPUGraphModularityOptimization({...createOptimizationProps(fixture), iterations})
    ).toThrow(/iterations|1024|integer/);
  });

  test.each([0, 0.125, 1, 2])('accepts a finite nonnegative resolution: %s', resolution => {
    const fixture = createOptimizationFixture();
    expect(
      new GPUGraphModularityOptimization({...createOptimizationProps(fixture), resolution})
        .resolution
    ).toBe(resolution);
  });

  test.each([
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    1e100
  ])('rejects invalid modularity resolution: %s', resolution => {
    const fixture = createOptimizationFixture();
    expect(
      () => new GPUGraphModularityOptimization({...createOptimizationProps(fixture), resolution})
    ).toThrow(/resolution|finite|float32|negative/);
  });

  test.each([0, 0.001, 1, 2])('accepts a nonnegative strict minimum gain: %s', minimumGain => {
    const fixture = createOptimizationFixture();
    expect(
      new GPUGraphModularityOptimization({...createOptimizationProps(fixture), minimumGain})
        .minimumGain
    ).toBe(minimumGain);
  });

  test.each([
    -0.1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    1e100
  ])('rejects an invalid strict minimum gain: %s', minimumGain => {
    const fixture = createOptimizationFixture();
    expect(
      () => new GPUGraphModularityOptimization({...createOptimizationProps(fixture), minimumGain})
    ).toThrow(/minimumGain|finite|float32|negative/);
  });

  test('requires reverse adjacency for exact directed modularity moves', () => {
    const fixture = createOptimizationFixture();
    expect(
      () => new GPUGraphModularityOptimization(createOptimizationProps(fixture, {reverse: false}))
    ).toThrow(/directed|reverse/);
  });

  test('accepts weighted undirected optimization without reverse adjacency', () => {
    const fixture = createOptimizationFixture();
    const operation = new GPUGraphModularityOptimization(
      createOptimizationProps(fixture, {directed: false, weighted: true})
    );

    expect(operation.topology.reverse).toBeUndefined();
    expect(operation.topology.forward.edgeWeights).toBeDefined();
  });

  test('accepts empty caller-owned labels alongside independent scalar score and statuses', () => {
    const fixture = createOptimizationFixture();
    const operation = new GPUGraphModularityOptimization(
      createOptimizationProps(fixture, {vertexCount: 0, statuses: true, seed: true})
    );

    expect(operation.output.length).toBe(0);
    expect(operation.initialCommunities?.length).toBe(0);
    expect(operation.modularity.length).toBe(1);
    expect(operation.converged?.length).toBe(1);
    expect(operation.valid?.length).toBe(1);
  });
});

describe('GPUGraphModularityOptimization packed GPU vectors and physical ownership', () => {
  test.each([
    'output',
    'initialCommunities'
  ] as const)('requires one packed vertex-aligned uint32 chunk for %s', vectorName => {
    const fixture = createOptimizationFixture();
    const props = createOptimizationProps(fixture, {seed: true});
    const floating = createVector(fixture, 'floating-labels', 'float32', [
      new Float32Array(props.topology.graph.vertexCount)
    ]) as unknown as GPUVector<'uint32'>;
    const truncated = createVector(fixture, 'truncated-labels', 'uint32', [
      new Uint32Array(props.topology.graph.vertexCount - 1)
    ]);
    const partitioned = createVector(fixture, 'partitioned-labels', 'uint32', [
      new Uint32Array(2),
      new Uint32Array(2)
    ]);

    expect(() => new GPUGraphModularityOptimization({...props, [vectorName]: floating})).toThrow(
      new RegExp(`${vectorName}|uint32|packed`)
    );
    expect(() => new GPUGraphModularityOptimization({...props, [vectorName]: truncated})).toThrow(
      new RegExp(`${vectorName}|rows|length`)
    );
    expect(() => new GPUGraphModularityOptimization({...props, [vectorName]: partitioned})).toThrow(
      new RegExp(`${vectorName}|chunk|packed`)
    );
  });

  test.each([0, 2])('requires exactly one float32 modularity score row: %s', length => {
    const fixture = createOptimizationFixture();
    const props = createOptimizationProps(fixture);
    const modularity = createVector(fixture, 'invalid-score', 'float32', [
      new Float32Array(length)
    ]);

    expect(() => new GPUGraphModularityOptimization({...props, modularity})).toThrow(
      /modularity|float32|rows/
    );
  });

  test('rejects unsigned values masquerading as the floating-point modularity score', () => {
    const fixture = createOptimizationFixture();
    const props = createOptimizationProps(fixture);
    const modularity = createVector(fixture, 'unsigned-score', 'uint32', [
      new Uint32Array(1)
    ]) as unknown as GPUVector<'float32'>;

    expect(() => new GPUGraphModularityOptimization({...props, modularity})).toThrow(
      /modularity|float32|packed/
    );
  });

  test.each([
    'converged',
    'valid'
  ] as const)('requires exactly one packed optional uint32 %s scalar', scalarName => {
    const fixture = createOptimizationFixture();
    const props = createOptimizationProps(fixture, {statuses: true});
    const invalidScalar = createVector(fixture, `invalid-${scalarName}`, 'uint32', [
      new Uint32Array(2)
    ]);

    expect(
      () => new GPUGraphModularityOptimization({...props, [scalarName]: invalidScalar})
    ).toThrow(new RegExp(`${scalarName}|uint32|rows`));
  });

  test.each([
    ['misaligned byte offset', {byteOffset: 2}],
    ['padded byte stride', {byteStride: 8}],
    ['oversized row payload', {rowByteLength: 8}],
    ['multi-component scalar stride', {stride: 2}]
  ] as [
    string,
    VectorOptions
  ][])('rejects an unpacked modularity score: %s', (_name, vectorOptions) => {
    const fixture = createOptimizationFixture();
    const props = createOptimizationProps(fixture);
    const modularity = createVector(
      fixture,
      'unpacked-score',
      'float32',
      [new Float32Array(1)],
      vectorOptions
    );

    expect(() => new GPUGraphModularityOptimization({...props, modularity})).toThrow(
      /modularity|float32|packed|aligned/
    );
  });

  test('accepts legal four-byte slices for seeds, labels, scores, and scalar statuses', () => {
    const fixture = createOptimizationFixture();
    const operation = new GPUGraphModularityOptimization(
      createOptimizationProps(fixture, {seed: true, statuses: true, byteOffset: 4})
    );

    expect(operation.initialCommunities?.data[0].byteOffset).toBe(4);
    expect(operation.output.data[0].byteOffset).toBe(4);
    expect(operation.modularity.data[0].byteOffset).toBe(4);
    expect(operation.converged?.data[0].byteOffset).toBe(4);
    expect(operation.valid?.data[0].byteOffset).toBe(4);
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
    'initialCommunities'
  ])('rejects writable labels aliasing graph or seed allocation: %s', inputName => {
    const fixture = createOptimizationFixture();
    const props = createOptimizationProps(fixture, {vertexCount: 1, weighted: true, seed: true});
    const input = getOptimizationInput(props, inputName);
    const output = createVector(fixture, 'aliased-labels', 'uint32', [new Uint32Array(1)], {
      buffer: input.data[0].buffer
    });

    expect(() => new GPUGraphModularityOptimization({...props, output})).toThrow(
      /distinct|physical|allocation/
    );
  });

  test.each([
    ['modularity', 'output'],
    ['converged', 'output'],
    ['valid', 'output'],
    ['converged', 'modularity'],
    ['valid', 'modularity'],
    ['valid', 'converged']
  ] as const)('rejects writable %s sharing the physical %s allocation', (destination, source) => {
    const fixture = createOptimizationFixture();
    const props = createOptimizationProps(fixture, {vertexCount: 1, statuses: true});
    const format = destination === 'modularity' ? 'float32' : 'uint32';
    const values = format === 'float32' ? new Float32Array(1) : new Uint32Array(1);
    const aliased = createVector(fixture, `aliased-${destination}`, format, [values], {
      buffer: props[source]!.data[0].buffer
    });

    expect(() => new GPUGraphModularityOptimization({...props, [destination]: aliased})).toThrow(
      /distinct|physical|allocation/
    );
  });

  test('unwraps borrowed DynamicBuffer aliases without destroying caller-owned allocations', () => {
    const fixture = createOptimizationFixture();
    const props = createOptimizationProps(fixture);
    const concreteBuffer = props.topology.forward.offsets.data[0].buffer as Buffer;
    const wrapper = new DynamicBuffer(fixture.device, {
      id: 'borrowed-optimization-offsets',
      buffer: concreteBuffer,
      ownsBuffer: false
    });
    fixture.dynamicBuffers.push(wrapper);
    const output = createVector(fixture, 'wrapped-output', 'uint32', [new Uint32Array(4)], {
      buffer: wrapper
    });

    expect(() => new GPUGraphModularityOptimization({...props, output})).toThrow(
      /distinct|physical|allocation/
    );
    expect(concreteBuffer.destroyed).toBe(false);
  });
});

function createOptimizationFixture(): OptimizationFixture {
  const fixture = {device: new NullDevice({}), buffers: [], dynamicBuffers: [], vectors: []};
  optimizationFixtures.push(fixture);
  return fixture;
}

function createOptimizationProps(
  fixture: OptimizationFixture,
  options: {
    vertexCount?: number;
    directed?: boolean;
    reverse?: boolean;
    weighted?: boolean;
    statuses?: boolean;
    seed?: boolean;
    byteOffset?: number;
  } = {}
): GPUGraphModularityOptimizationProps {
  const vertexCount = options.vertexCount ?? 4;
  const sourceVertices = createVector(fixture, 'sourceVertices', 'uint32', [
    Uint32Array.from([0, 1]),
    new Uint32Array(0),
    Uint32Array.from([1, 2])
  ]);
  const targetVertices = createVector(fixture, 'targetVertices', 'uint32', [
    Uint32Array.from([1, 2]),
    new Uint32Array(0),
    Uint32Array.from([2, 3])
  ]);
  const edgeWeights = options.weighted
    ? createVector(fixture, 'edgeWeights', 'float32', [
        Float32Array.from([1, 2]),
        new Float32Array(0),
        Float32Array.from([3, 4])
      ])
    : undefined;
  const edgeIds = options.weighted
    ? createVector(fixture, 'edgeIds', 'uint32', [
        Uint32Array.from([10, 20]),
        new Uint32Array(0),
        Uint32Array.from([30, 40])
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
  const forward = createAdjacency(fixture, 'forward', vertexCount, 4, Boolean(edgeWeights));
  const reverse =
    directed && options.reverse !== false
      ? createAdjacency(fixture, 'reverse', vertexCount, 4, Boolean(edgeWeights))
      : undefined;
  const invalidEdgeCount = createVector(fixture, 'invalidEdgeCount', 'uint32', [
    new Uint32Array(1)
  ]);
  const topology = new GPUGraphTopology({graph, forward, reverse, invalidEdgeCount});
  const vectorOptions = {byteOffset: options.byteOffset};
  return {
    topology,
    output: createVector(
      fixture,
      'optimized-communities',
      'uint32',
      [new Uint32Array(vertexCount)],
      vectorOptions
    ),
    modularity: createVector(
      fixture,
      'optimized-modularity',
      'float32',
      [new Float32Array(1)],
      vectorOptions
    ),
    ...(options.seed
      ? {
          initialCommunities: createVector(
            fixture,
            'initial-communities',
            'uint32',
            [new Uint32Array(vertexCount)],
            vectorOptions
          )
        }
      : {}),
    ...(options.statuses
      ? {
          converged: createVector(
            fixture,
            'converged',
            'uint32',
            [new Uint32Array(1)],
            vectorOptions
          ),
          valid: createVector(fixture, 'valid', 'uint32', [new Uint32Array(1)], vectorOptions)
        }
      : {})
  };
}

function createAdjacency(
  fixture: OptimizationFixture,
  name: string,
  vertexCount: number,
  capacity: number,
  weighted: boolean
): GPUGraphAdjacency {
  return {
    offsets: createVector(fixture, `${name}-offsets`, 'uint32', [new Uint32Array(vertexCount + 1)]),
    neighbors: createVector(fixture, `${name}-neighbors`, 'uint32', [new Uint32Array(capacity)]),
    edgeIds: createVector(fixture, `${name}-edge-ids`, 'uint32', [new Uint32Array(capacity)]),
    ...(weighted
      ? {
          edgeWeights: createVector(fixture, `${name}-weights`, 'float32', [
            new Float32Array(capacity)
          ])
        }
      : {}),
    count: createVector(fixture, `${name}-count`, 'uint32', [new Uint32Array(1)]),
    overflow: createVector(fixture, `${name}-overflow`, 'uint32', [new Uint32Array(1)])
  };
}

function getOptimizationInput(props: GPUGraphModularityOptimizationProps, name: string): GPUVector {
  if (name === 'sourceVertices') return props.topology.graph.sourceVertices;
  if (name === 'targetVertices') return props.topology.graph.targetVertices;
  if (name === 'edgeWeights') return props.topology.graph.edgeWeights!;
  if (name === 'edgeIds') return props.topology.graph.edgeIds!;
  if (name === 'invalidEdgeCount') return props.topology.invalidEdgeCount;
  if (name === 'initialCommunities') return props.initialCommunities!;
  const [direction, vectorName] = name.split('.');
  const adjacency = direction === 'forward' ? props.topology.forward : props.topology.reverse!;
  return adjacency[vectorName as keyof GPUGraphAdjacency]!;
}

function createVector<Format extends ScalarFormat>(
  fixture: OptimizationFixture,
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
        id: `${name}-${chunkIndex}-${fixture.buffers.length}`,
        byteLength: byteOffset + Math.max(values.length, 1) * Math.max(byteStride, rowByteLength),
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
  const vector = new GPUVector<Format>({type: 'data', name, format, data, ownsData: false});
  fixture.vectors.push(vector);
  return vector;
}
