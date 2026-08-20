// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import * as experimentalModule from '@luma.gl/experimental';
import {
  GPUGraph,
  GPUGraphSingleSourceShortestPath,
  GPUGraphTopology,
  type GPUGraphAdjacency,
  type GPUGraphSingleSourceShortestPathDirection,
  type GPUGraphSingleSourceShortestPathProps
} from '@luma.gl/gpgpu/gpu-graph';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {NullDevice} from '@luma.gl/test-utils';
import {afterEach, describe, expect, test, vi} from 'vitest';
import {getGPUGraphSingleSourceShortestPathDispatchLayout} from '../../src/gpu-graph/gpu-graph-single-source-shortest-path-internals';

type ScalarFormat = 'uint32' | 'float32';
type ScalarValues = Uint32Array | Float32Array;

type ShortestPathFixture = {
  device: NullDevice;
  buffers: Buffer[];
  dynamicBuffers: DynamicBuffer[];
  vectors: GPUVector[];
};

type VectorOptions = {buffer?: Buffer | DynamicBuffer; byteOffset?: number; byteStride?: number};

const shortestPathFixtures: ShortestPathFixture[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const fixture of shortestPathFixtures.splice(0)) {
    for (const vector of fixture.vectors) vector.destroy();
    for (const dynamicBuffer of fixture.dynamicBuffers) dynamicBuffer.destroy();
    for (const buffer of fixture.buffers) buffer.destroy();
    fixture.device.destroy();
  }
});

describe('GPUGraphSingleSourceShortestPath public GPU-resident API', () => {
  test('exports weighted paths exclusively through the optional GPUGraph subpath', () => {
    expect(typeof GPUGraphSingleSourceShortestPath).toBe('function');
    expect('GPUGraphSingleSourceShortestPath' in experimentalModule).toBe(false);
  });

  test('preserves weighted topology and caller-owned outputs without submitting or reading', () => {
    const fixture = createShortestPathFixture();
    const props = createShortestPathProps(fixture, {weighted: true, statuses: true, reverse: true});
    const submit = vi.spyOn(fixture.device, 'submit');
    const search = new GPUGraphSingleSourceShortestPath(props);

    expect(search.id).toBe('gpu-graph-single-source-shortest-path');
    expect(search.topology).toBe(props.topology);
    expect(search.sourceVertex).toBe(props.sourceVertex);
    expect(search.distances).toBe(props.distances);
    expect(search.predecessors).toBe(props.predecessors);
    expect(search.converged).toBe(props.converged);
    expect(search.invalidWeightCount).toBe(props.invalidWeightCount);
    expect(search.direction).toBe('outgoing');
    expect(search.maxIterations).toBe(props.topology.graph.vertexCount - 1);
    expect(submit).not.toHaveBeenCalled();
  });

  test('caps the default relaxation count while allowing explicitly source-only results', () => {
    const fixture = createShortestPathFixture();
    const props = createShortestPathProps(fixture, {vertexCount: 2048});

    expect(new GPUGraphSingleSourceShortestPath(props).maxIterations).toBe(1024);
    expect(new GPUGraphSingleSourceShortestPath({...props, maxIterations: 0}).maxIterations).toBe(
      0
    );
  });

  test('accepts source zero and empty vertex-aligned destinations for an empty graph', () => {
    const fixture = createShortestPathFixture();
    const props = createShortestPathProps(fixture, {vertexCount: 0});
    const search = new GPUGraphSingleSourceShortestPath(props);

    expect(search.sourceVertex).toBe(0);
    expect(search.maxIterations).toBe(0);
    expect(search.distances.length).toBe(0);
  });

  test.each([
    -1,
    4,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY
  ])('rejects an invalid source vertex: %s', sourceVertex => {
    const fixture = createShortestPathFixture();
    const props = createShortestPathProps(fixture);

    expect(() => new GPUGraphSingleSourceShortestPath({...props, sourceVertex})).toThrow(
      /sourceVertex|vertex/
    );
  });

  test.each([
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    1025
  ])('rejects invalid compiled iteration counts: %s', maxIterations => {
    const fixture = createShortestPathFixture();
    const props = createShortestPathProps(fixture);

    expect(() => new GPUGraphSingleSourceShortestPath({...props, maxIterations})).toThrow(
      /maxIterations|1024/
    );
  });

  test.each([
    'incoming',
    'both'
  ] as const)('requires reverse CSR for directed %s traversal', direction => {
    const fixture = createShortestPathFixture();
    const props = createShortestPathProps(fixture);

    expect(() => new GPUGraphSingleSourceShortestPath({...props, direction})).toThrow(/reverse/);
    const reversible = createShortestPathProps(fixture, {reverse: true});
    expect(new GPUGraphSingleSourceShortestPath({...reversible, direction}).direction).toBe(
      direction
    );
  });

  test.each([
    'incoming',
    'both'
  ] as const)('reuses symmetric forward CSR for undirected %s traversal', direction => {
    const fixture = createShortestPathFixture();
    const props = createShortestPathProps(fixture, {directed: false});

    expect(new GPUGraphSingleSourceShortestPath({...props, direction}).direction).toBe(direction);
  });

  test.each(['reverse', '', 'OUTGOING'])('rejects unsupported direction: %s', invalidDirection => {
    const fixture = createShortestPathFixture();
    const props = createShortestPathProps(fixture, {reverse: true});
    const direction = invalidDirection as GPUGraphSingleSourceShortestPathDirection;

    expect(() => new GPUGraphSingleSourceShortestPath({...props, direction})).toThrow(/direction/);
  });
});

describe('GPUGraphSingleSourceShortestPath output validation and physical ownership', () => {
  test('requires exactly one packed float32 distance and uint32 predecessor row per vertex', () => {
    const fixture = createShortestPathFixture();
    const props = createShortestPathProps(fixture);
    const wrongDistances = createVector(fixture, 'wrong-distances', 'uint32', [
      new Uint32Array(4)
    ]) as unknown as GPUVector<'float32'>;
    const wrongPredecessors = createVector(fixture, 'wrong-predecessors', 'float32', [
      new Float32Array(4)
    ]) as unknown as GPUVector<'uint32'>;
    const shortDistances = createVector(fixture, 'short-distances', 'float32', [
      new Float32Array(3)
    ]);

    expect(
      () => new GPUGraphSingleSourceShortestPath({...props, distances: wrongDistances})
    ).toThrow(/distances|float32/);
    expect(
      () => new GPUGraphSingleSourceShortestPath({...props, predecessors: wrongPredecessors})
    ).toThrow(/predecessors|uint32/);
    expect(
      () => new GPUGraphSingleSourceShortestPath({...props, distances: shortDistances})
    ).toThrow(/distances|rows/);
  });

  test.each([
    'converged',
    'invalidWeightCount'
  ] as const)('requires exactly one packed uint32 %s status row', statusName => {
    const fixture = createShortestPathFixture();
    const props = createShortestPathProps(fixture, {statuses: true});
    const invalidStatus = createVector(fixture, `wrong-${statusName}`, 'uint32', [
      new Uint32Array(2)
    ]);

    expect(
      () => new GPUGraphSingleSourceShortestPath({...props, [statusName]: invalidStatus})
    ).toThrow(new RegExp(`${statusName}|rows`));
  });

  test('accepts legal non-256-aligned scalar views without copying caller-owned data', () => {
    const fixture = createShortestPathFixture();
    const props = createShortestPathProps(fixture, {statuses: true, byteOffset: 4});
    const search = new GPUGraphSingleSourceShortestPath(props);

    expect(search.distances.data[0].byteOffset).toBe(4);
    expect(search.predecessors.data[0].byteOffset).toBe(4);
    expect(search.converged?.data[0].byteOffset).toBe(4);
  });

  test.each([
    'sourceVertices',
    'forward.offsets',
    'forward.edgeWeights',
    'reverse.neighbors'
  ])('rejects distance aliases with existing graph allocations: %s', vectorName => {
    const fixture = createShortestPathFixture();
    const props = createShortestPathProps(fixture, {weighted: true, reverse: true});
    const source = getInputVector(props, vectorName);
    const distances = createVector(fixture, 'aliased-distances', 'float32', [new Float32Array(4)], {
      buffer: source.data[0].buffer
    });

    expect(() => new GPUGraphSingleSourceShortestPath({...props, distances})).toThrow(
      /distinct|physical|allocation/
    );
  });

  test('rejects aliases between caller-visible result and status allocations', () => {
    const fixture = createShortestPathFixture();
    const props = createShortestPathProps(fixture, {vertexCount: 1, statuses: true});
    const predecessors = createVector(
      fixture,
      'aliased-predecessors',
      'uint32',
      [new Uint32Array(1)],
      {buffer: props.distances.data[0].buffer}
    );

    expect(() => new GPUGraphSingleSourceShortestPath({...props, predecessors})).toThrow(
      /distinct|physical|allocation/
    );
  });

  test('unwraps DynamicBuffer wrappers before validating borrowed physical allocations', () => {
    const fixture = createShortestPathFixture();
    const props = createShortestPathProps(fixture);
    const concreteBuffer = props.topology.forward.offsets.data[0].buffer as Buffer;
    const wrapper = new DynamicBuffer(fixture.device, {
      id: 'borrowed-adjacency-wrapper',
      buffer: concreteBuffer,
      ownsBuffer: false
    });
    fixture.dynamicBuffers.push(wrapper);
    const distances = createVector(fixture, 'wrapped-distances', 'float32', [new Float32Array(4)], {
      buffer: wrapper
    });

    expect(() => new GPUGraphSingleSourceShortestPath({...props, distances})).toThrow(
      /distinct|physical|allocation/
    );
  });

  test('plans bounded three-dimensional weighted-path dispatch', () => {
    expect(getGPUGraphSingleSourceShortestPathDispatchLayout(0, 2)).toEqual({x: 1, y: 1, z: 1});
    expect(getGPUGraphSingleSourceShortestPathDispatchLayout(512, 2)).toEqual({x: 2, y: 1, z: 1});
    expect(getGPUGraphSingleSourceShortestPathDispatchLayout(513, 2)).toEqual({x: 2, y: 2, z: 1});
    expect(getGPUGraphSingleSourceShortestPathDispatchLayout(1025, 2)).toEqual({x: 2, y: 2, z: 2});
    expect(() => getGPUGraphSingleSourceShortestPathDispatchLayout(2049, 2)).toThrow(
      /3D dispatch limit/
    );
  });
});

function createShortestPathFixture(): ShortestPathFixture {
  const fixture = {device: new NullDevice({}), buffers: [], dynamicBuffers: [], vectors: []};
  shortestPathFixtures.push(fixture);
  return fixture;
}

function createShortestPathProps(
  fixture: ShortestPathFixture,
  options: {
    vertexCount?: number;
    directed?: boolean;
    reverse?: boolean;
    weighted?: boolean;
    statuses?: boolean;
    byteOffset?: number;
  } = {}
): GPUGraphSingleSourceShortestPathProps {
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
        Float32Array.from([1.5, 0]),
        new Float32Array(0),
        Float32Array.from([2, 4])
      ])
    : undefined;
  const graph = new GPUGraph({
    vertexCount,
    sourceVertices,
    targetVertices,
    edgeWeights,
    directed: options.directed
  });
  const forward = createAdjacency(fixture, 'forward', vertexCount, 4, Boolean(edgeWeights));
  const reverse = options.reverse
    ? createAdjacency(fixture, 'reverse', vertexCount, 4, Boolean(edgeWeights))
    : undefined;
  const invalidEdgeCount = createVector(fixture, 'invalidEdgeCount', 'uint32', [
    new Uint32Array(1)
  ]);
  const topology = new GPUGraphTopology({graph, forward, reverse, invalidEdgeCount});
  const vectorOptions = {byteOffset: options.byteOffset};
  return {
    topology,
    sourceVertex: 0,
    distances: createVector(
      fixture,
      'distances',
      'float32',
      [new Float32Array(vertexCount)],
      vectorOptions
    ),
    predecessors: createVector(
      fixture,
      'predecessors',
      'uint32',
      [new Uint32Array(vertexCount)],
      vectorOptions
    ),
    ...(options.statuses
      ? {
          converged: createVector(
            fixture,
            'converged',
            'uint32',
            [new Uint32Array(1)],
            vectorOptions
          ),
          invalidWeightCount: createVector(
            fixture,
            'invalidWeightCount',
            'uint32',
            [new Uint32Array(1)],
            vectorOptions
          )
        }
      : {})
  };
}

function createAdjacency(
  fixture: ShortestPathFixture,
  name: string,
  vertexCount: number,
  capacity: number,
  weighted: boolean
): GPUGraphAdjacency {
  return {
    offsets: createVector(fixture, `${name}-offsets`, 'uint32', [new Uint32Array(vertexCount + 1)]),
    neighbors: createVector(fixture, `${name}-neighbors`, 'uint32', [new Uint32Array(capacity)]),
    edgeIds: createVector(fixture, `${name}-edgeIds`, 'uint32', [new Uint32Array(capacity)]),
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

function getInputVector(props: GPUGraphSingleSourceShortestPathProps, name: string): GPUVector {
  if (name === 'sourceVertices') return props.topology.graph.sourceVertices;
  const [direction, vectorName] = name.split('.');
  const adjacency = direction === 'forward' ? props.topology.forward : props.topology.reverse!;
  return adjacency[vectorName as keyof GPUGraphAdjacency]!;
}

function createVector<Format extends ScalarFormat>(
  fixture: ShortestPathFixture,
  name: string,
  format: Format,
  chunks: readonly ScalarValues[],
  options: VectorOptions = {}
): GPUVector<Format> {
  const byteOffset = options.byteOffset ?? 0;
  const byteStride = options.byteStride ?? Uint32Array.BYTES_PER_ELEMENT;
  const data = chunks.map((values, chunkIndex) => {
    const buffer =
      options.buffer ??
      fixture.device.createBuffer({
        id: `${name}-${chunkIndex}-${fixture.buffers.length}`,
        byteLength: byteOffset + Math.max(values.length, 1) * byteStride,
        usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
      });
    if (!options.buffer) fixture.buffers.push(buffer as Buffer);
    return new GPUData<Format>({
      buffer,
      format,
      length: values.length,
      byteOffset,
      byteStride,
      ownsBuffer: false
    });
  });
  const vector = new GPUVector<Format>({type: 'data', name, format, data, ownsData: false});
  fixture.vectors.push(vector);
  return vector;
}
