// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import * as experimentalModule from '@luma.gl/experimental';
import {
  GPUGraph,
  GPUGraphCoreNumber,
  GPUGraphTopology,
  type GPUGraphAdjacency,
  type GPUGraphCoreNumberProps
} from '@luma.gl/experimental/gpu-graph';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import {afterEach, describe, expect, test, vi} from 'vitest';
import {getGPUGraphCoreNumberDispatchLayout} from '../../src/gpu-graph/gpu-graph-core-number-internals';

type ScalarFormat = 'uint32' | 'float32';
type ScalarValues = Uint32Array | Float32Array;

type CoreNumberFixture = {
  device: NullDevice;
  buffers: Buffer[];
  dynamicBuffers: DynamicBuffer[];
  vectors: GPUVector[];
};

type VectorOptions = {buffer?: Buffer | DynamicBuffer; byteOffset?: number; byteStride?: number};

const coreNumberFixtures: CoreNumberFixture[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const fixture of coreNumberFixtures.splice(0)) {
    for (const vector of fixture.vectors) vector.destroy();
    for (const dynamicBuffer of fixture.dynamicBuffers) dynamicBuffer.destroy();
    for (const buffer of fixture.buffers) buffer.destroy();
    fixture.device.destroy();
  }
});

describe('GPUGraphCoreNumber optional graph-analysis API', () => {
  test('exports GPU k-core decomposition only from the optional GPUGraph subpath', () => {
    expect(typeof GPUGraphCoreNumber).toBe('function');
    expect('GPUGraphCoreNumber' in experimentalModule).toBe(false);
  });

  test('preserves topology, distinct destinations, and status without executing GPU work', () => {
    const fixture = createCoreNumberFixture();
    const props = createCoreNumberProps(fixture, {weighted: true, statuses: true});
    const submit = vi.spyOn(fixture.device, 'submit');
    const operation = new GPUGraphCoreNumber(props);

    expect(operation.id).toBe('gpu-graph-core-number');
    expect(operation.topology).toBe(props.topology);
    expect(operation.output).toBe(props.output);
    expect(operation.converged).toBe(props.converged);
    expect(operation.degeneracy).toBe(props.degeneracy);
    expect(operation.iterations).toBe(32);
    expect(submit).not.toHaveBeenCalled();
  });

  test('does not require optional convergence or graph-degeneracy destinations', () => {
    const fixture = createCoreNumberFixture();
    const operation = new GPUGraphCoreNumber(createCoreNumberProps(fixture));

    expect(operation.converged).toBeUndefined();
    expect(operation.degeneracy).toBeUndefined();
  });

  test.each([0, 1, 32, 1024])('accepts a bounded refinement budget: %s', iterations => {
    const fixture = createCoreNumberFixture();
    const props = createCoreNumberProps(fixture);

    expect(new GPUGraphCoreNumber({...props, iterations}).iterations).toBe(iterations);
  });

  test.each([
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    1025
  ])('rejects invalid refinement budgets: %s', iterations => {
    const fixture = createCoreNumberFixture();
    const props = createCoreNumberProps(fixture);

    expect(() => new GPUGraphCoreNumber({...props, iterations})).toThrow(/iterations|1024/);
  });

  test('requires reverse CSR for the weak-simple projection of directed graphs', () => {
    const fixture = createCoreNumberFixture();
    const props = createCoreNumberProps(fixture, {reverse: false});

    expect(() => new GPUGraphCoreNumber(props)).toThrow(/directed|weak|reverse/);
  });

  test('reuses symmetric forward CSR for undirected graphs', () => {
    const fixture = createCoreNumberFixture();
    const props = createCoreNumberProps(fixture, {directed: false});

    expect(new GPUGraphCoreNumber(props).topology.reverse).toBeUndefined();
  });

  test('accepts empty output alongside independent optional scalar statuses', () => {
    const fixture = createCoreNumberFixture();
    const props = createCoreNumberProps(fixture, {vertexCount: 0, statuses: true});
    const operation = new GPUGraphCoreNumber(props);

    expect(operation.output.length).toBe(0);
    expect(operation.converged?.length).toBe(1);
    expect(operation.degeneracy?.length).toBe(1);
  });
});

describe('GPUGraphCoreNumber packed vectors and physical caller ownership', () => {
  test('rejects floating-point, truncated, and multichunk vertex destinations', () => {
    const fixture = createCoreNumberFixture();
    const props = createCoreNumberProps(fixture);
    const floatOutput = createVector(fixture, 'float-output', 'float32', [
      new Float32Array(4)
    ]) as unknown as GPUVector<'uint32'>;
    const shortOutput = createVector(fixture, 'short-output', 'uint32', [new Uint32Array(3)]);
    const chunkedOutput = createVector(fixture, 'chunked-output', 'uint32', [
      new Uint32Array(2),
      new Uint32Array(2)
    ]);

    expect(() => new GPUGraphCoreNumber({...props, output: floatOutput})).toThrow(/uint32|output/);
    expect(() => new GPUGraphCoreNumber({...props, output: shortOutput})).toThrow(/output|rows/);
    expect(() => new GPUGraphCoreNumber({...props, output: chunkedOutput})).toThrow(/chunk|output/);
  });

  test.each([
    'converged',
    'degeneracy'
  ] as const)('requires exactly one packed uint32 %s row', statusName => {
    const fixture = createCoreNumberFixture();
    const props = createCoreNumberProps(fixture, {statuses: true});
    const invalidStatus = createVector(fixture, `invalid-${statusName}`, 'uint32', [
      new Uint32Array(2)
    ]);

    expect(() => new GPUGraphCoreNumber({...props, [statusName]: invalidStatus})).toThrow(
      new RegExp(`${statusName}|rows`)
    );
  });

  test('preserves legal four-byte slices rather than requiring 256-byte logical offsets', () => {
    const fixture = createCoreNumberFixture();
    const props = createCoreNumberProps(fixture, {statuses: true, byteOffset: 4});
    const operation = new GPUGraphCoreNumber(props);

    expect(operation.output.data[0].byteOffset).toBe(4);
    expect(operation.converged?.data[0].byteOffset).toBe(4);
    expect(operation.degeneracy?.data[0].byteOffset).toBe(4);
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
  ])('rejects writable outputs backed by existing graph allocations: %s', inputName => {
    const fixture = createCoreNumberFixture();
    const props = createCoreNumberProps(fixture, {vertexCount: 1, weighted: true});
    const input = getCoreInputVector(props, inputName);
    const output = createVector(fixture, 'aliased-output', 'uint32', [new Uint32Array(1)], {
      buffer: input.data[0].buffer
    });

    expect(() => new GPUGraphCoreNumber({...props, output})).toThrow(
      /distinct|physical|allocation/
    );
  });

  test.each([
    ['converged', 'output'],
    ['degeneracy', 'output'],
    ['degeneracy', 'converged']
  ] as const)('rejects aliases between %s and %s outputs', (outputName, sourceName) => {
    const fixture = createCoreNumberFixture();
    const props = createCoreNumberProps(fixture, {vertexCount: 1, statuses: true});
    const sourceVector = props[sourceName]!;
    const output = createVector(fixture, `aliased-${outputName}`, 'uint32', [new Uint32Array(1)], {
      buffer: sourceVector.data[0].buffer
    });

    expect(() => new GPUGraphCoreNumber({...props, [outputName]: output})).toThrow(
      /distinct|physical|allocation/
    );
  });

  test('unwraps borrowed DynamicBuffer aliases before validating physical independence', () => {
    const fixture = createCoreNumberFixture();
    const props = createCoreNumberProps(fixture);
    const concreteBuffer = props.topology.forward.offsets.data[0].buffer as Buffer;
    const wrapper = new DynamicBuffer(fixture.device, {
      id: 'borrowed-core-offsets',
      buffer: concreteBuffer,
      ownsBuffer: false
    });
    fixture.dynamicBuffers.push(wrapper);
    const output = createVector(fixture, 'wrapped-core-output', 'uint32', [new Uint32Array(4)], {
      buffer: wrapper
    });

    expect(() => new GPUGraphCoreNumber({...props, output})).toThrow(
      /distinct|physical|allocation/
    );
    expect(concreteBuffer.destroyed).toBe(false);
  });

  test('plans bounded three-dimensional initialization and refinement dispatch', () => {
    expect(getGPUGraphCoreNumberDispatchLayout(0, 2)).toEqual({x: 1, y: 1, z: 1});
    expect(getGPUGraphCoreNumberDispatchLayout(512, 2)).toEqual({x: 2, y: 1, z: 1});
    expect(getGPUGraphCoreNumberDispatchLayout(513, 2)).toEqual({x: 2, y: 2, z: 1});
    expect(getGPUGraphCoreNumberDispatchLayout(1025, 2)).toEqual({x: 2, y: 2, z: 2});
    expect(() => getGPUGraphCoreNumberDispatchLayout(2049, 2)).toThrow(/3D dispatch limit/);
  });
});

function createCoreNumberFixture(): CoreNumberFixture {
  const fixture = {device: new NullDevice({}), buffers: [], dynamicBuffers: [], vectors: []};
  coreNumberFixtures.push(fixture);
  return fixture;
}

function createCoreNumberProps(
  fixture: CoreNumberFixture,
  options: {
    vertexCount?: number;
    directed?: boolean;
    reverse?: boolean;
    weighted?: boolean;
    statuses?: boolean;
    byteOffset?: number;
  } = {}
): GPUGraphCoreNumberProps {
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
      'coreNumbers',
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
          degeneracy: createVector(
            fixture,
            'degeneracy',
            'uint32',
            [new Uint32Array(1)],
            vectorOptions
          )
        }
      : {})
  };
}

function createAdjacency(
  fixture: CoreNumberFixture,
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

function getCoreInputVector(props: GPUGraphCoreNumberProps, name: string): GPUVector {
  if (name === 'sourceVertices') return props.topology.graph.sourceVertices;
  if (name === 'targetVertices') return props.topology.graph.targetVertices;
  if (name === 'edgeWeights') return props.topology.graph.edgeWeights!;
  if (name === 'edgeIds') return props.topology.graph.edgeIds!;
  if (name === 'invalidEdgeCount') return props.topology.invalidEdgeCount;
  const [direction, vectorName] = name.split('.');
  const adjacency = direction === 'forward' ? props.topology.forward : props.topology.reverse!;
  return adjacency[vectorName as keyof GPUGraphAdjacency]!;
}

function createVector<Format extends ScalarFormat>(
  fixture: CoreNumberFixture,
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
