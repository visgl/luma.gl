// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import * as experimentalModule from '@luma.gl/experimental';
import {
  LuGraph,
  LuGraphModularity,
  type LuGraphModularityProps
} from '@luma.gl/experimental/lugraph';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import {afterEach, describe, expect, test, vi} from 'vitest';
import {getLuGraphModularityDispatchLayout} from '../../src/lugraph/lu-graph-modularity-internals';

type ScalarFormat = 'uint32' | 'float32';
type ScalarValues = Uint32Array | Float32Array;

type ModularityFixture = {
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

const modularityFixtures: ModularityFixture[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const fixture of modularityFixtures.splice(0)) {
    for (const vector of fixture.vectors) vector.destroy();
    for (const dynamicBuffer of fixture.dynamicBuffers) dynamicBuffer.destroy();
    for (const buffer of fixture.buffers) buffer.destroy();
    fixture.device.destroy();
  }
});

describe('LuGraphModularity public contract and borrowed ownership', () => {
  test('keeps weighted partition quality isolated in the optional luGraph entry point', () => {
    expect(typeof LuGraphModularity).toBe('function');
    expect('LuGraphModularity' in experimentalModule).toBe(false);
  });

  test('preserves original graph chunks and caller outputs without allocation or synchronization', () => {
    const fixture = createModularityFixture();
    const props = createModularityProps(fixture, {
      weighted: true,
      contributions: true,
      valid: true
    });
    const createBufferSpy = vi.spyOn(fixture.device, 'createBuffer');
    const createCommandEncoderSpy = vi.spyOn(fixture.device, 'createCommandEncoder');
    const submitSpy = vi.spyOn(fixture.device, 'submit');
    const readbackSpies = fixture.buffers.map(buffer => vi.spyOn(buffer, 'readAsync'));

    const modularity = new LuGraphModularity({...props, id: 'borrowed-partition', resolution: 0.5});

    expect(modularity.id).toBe('borrowed-partition');
    expect(modularity.graph).toBe(props.graph);
    expect(modularity.communities).toBe(props.communities);
    expect(modularity.output).toBe(props.output);
    expect(modularity.communityContributions).toBe(props.communityContributions);
    expect(modularity.valid).toBe(props.valid);
    expect(modularity.resolution).toBe(0.5);
    expect(modularity.graph.sourceVertices.data.map(chunk => chunk.length)).toEqual([2, 0, 3]);
    expect(createBufferSpy).not.toHaveBeenCalled();
    expect(createCommandEncoderSpy).not.toHaveBeenCalled();
    expect(submitSpy).not.toHaveBeenCalled();
    for (const readbackSpy of readbackSpies) expect(readbackSpy).not.toHaveBeenCalled();
    expect(Reflect.has(modularity, 'destroy')).toBe(false);

    for (const vector of fixture.vectors) vector.destroy();
    expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);
  });

  test('defaults to directed, unweighted, resolution-one scoring with optional outputs omitted', () => {
    const fixture = createModularityFixture();
    const modularity = new LuGraphModularity(createModularityProps(fixture));

    expect(modularity.id).toBe('lu-graph-modularity');
    expect(modularity.graph.directed).toBe(true);
    expect(modularity.graph.edgeWeights).toBeUndefined();
    expect(modularity.resolution).toBe(1);
    expect(modularity.communityContributions).toBeUndefined();
    expect(modularity.valid).toBeUndefined();
  });

  test('accepts weighted undirected graphs without a CSR topology or reverse adjacency', () => {
    const fixture = createModularityFixture();
    const modularity = new LuGraphModularity(
      createModularityProps(fixture, {directed: false, weighted: true})
    );

    expect(modularity.graph.directed).toBe(false);
    expect(modularity.graph.edgeWeights?.data.map(chunk => chunk.length)).toEqual([2, 0, 3]);
    expect(Reflect.has(modularity, 'topology')).toBe(false);
  });

  test('accepts empty vertex labels and contributions alongside scalar score and validity', () => {
    const fixture = createModularityFixture();
    const modularity = new LuGraphModularity(
      createModularityProps(fixture, {vertexCount: 0, contributions: true, valid: true})
    );

    expect(modularity.communities.length).toBe(0);
    expect(modularity.communityContributions?.length).toBe(0);
    expect(modularity.output.length).toBe(1);
    expect(modularity.valid?.length).toBe(1);
  });

  test.each([
    0,
    0.125,
    1,
    2,
    Math.fround(3.4028234663852886e38)
  ])('accepts a finite nonnegative resolution representable by float32: %s', resolution => {
    const fixture = createModularityFixture();
    const modularity = new LuGraphModularity({...createModularityProps(fixture), resolution});

    expect(modularity.resolution).toBe(resolution);
  });

  test.each([
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    1e100
  ])('rejects a negative, nonfinite, or float32-overflowing resolution: %s', resolution => {
    const fixture = createModularityFixture();

    expect(() => new LuGraphModularity({...createModularityProps(fixture), resolution})).toThrow(
      /resolution|finite|float32|negative/
    );
  });

  test('plans bounded three-dimensional vertex and edge dispatch without truncation', () => {
    expect(getLuGraphModularityDispatchLayout(0, 2)).toEqual({x: 1, y: 1, z: 1});
    expect(getLuGraphModularityDispatchLayout(512, 2)).toEqual({x: 2, y: 1, z: 1});
    expect(getLuGraphModularityDispatchLayout(513, 2)).toEqual({x: 2, y: 2, z: 1});
    expect(getLuGraphModularityDispatchLayout(1025, 2)).toEqual({x: 2, y: 2, z: 2});
    expect(() => getLuGraphModularityDispatchLayout(2049, 2)).toThrow(/3D dispatch limit/);
  });
});

describe('LuGraphModularity scalar/vector metadata and physical aliases', () => {
  test.each([5, 7])('requires exactly one community label for each graph vertex: %i', length => {
    const fixture = createModularityFixture();
    const props = createModularityProps(fixture);
    const communities = createVector(fixture, 'community-length', 'uint32', [
      new Uint32Array(length)
    ]);

    expect(() => new LuGraphModularity({...props, communities})).toThrow(/communities|uint32|rows/);
  });

  test('requires one packed uint32 community chunk rather than floating-point labels', () => {
    const fixture = createModularityFixture();
    const props = createModularityProps(fixture);
    const communities = createVector(fixture, 'floating-communities', 'float32', [
      new Float32Array(props.graph.vertexCount)
    ]) as unknown as GPUVector<'uint32'>;

    expect(() => new LuGraphModularity({...props, communities})).toThrow(
      /communities|uint32|packed/
    );
  });

  test.each([0, 2])('requires exactly one community-label chunk: %i', chunkCount => {
    const fixture = createModularityFixture();
    const props = createModularityProps(fixture);
    const chunks = chunkCount === 0 ? [] : [new Uint32Array(3), new Uint32Array(3)];
    const communities = createVector(fixture, 'partitioned-communities', 'uint32', chunks);

    expect(() => new LuGraphModularity({...props, communities})).toThrow(/communities|one|chunk/);
  });

  test.each([0, 2])('requires exactly one floating-point score scalar: %i', length => {
    const fixture = createModularityFixture();
    const props = createModularityProps(fixture);
    const output = createVector(fixture, 'score-length', 'float32', [new Float32Array(length)]);

    expect(() => new LuGraphModularity({...props, output})).toThrow(/output|float32|rows/);
  });

  test('rejects unsigned scores masquerading as modularity scalars', () => {
    const fixture = createModularityFixture();
    const props = createModularityProps(fixture);
    const output = createVector(fixture, 'unsigned-score', 'uint32', [
      new Uint32Array(1)
    ]) as unknown as GPUVector<'float32'>;

    expect(() => new LuGraphModularity({...props, output})).toThrow(/output|float32|packed/);
  });

  test.each([
    5, 7
  ])('requires one optional contribution per possible community label: %i', length => {
    const fixture = createModularityFixture();
    const props = createModularityProps(fixture);
    const communityContributions = createVector(fixture, 'contribution-length', 'float32', [
      new Float32Array(length)
    ]);

    expect(() => new LuGraphModularity({...props, communityContributions})).toThrow(
      /communityContributions|float32|rows/
    );
  });

  test('requires packed floating-point contributions instead of unsigned counts', () => {
    const fixture = createModularityFixture();
    const props = createModularityProps(fixture);
    const communityContributions = createVector(fixture, 'unsigned-contributions', 'uint32', [
      new Uint32Array(props.graph.vertexCount)
    ]) as unknown as GPUVector<'float32'>;

    expect(() => new LuGraphModularity({...props, communityContributions})).toThrow(
      /communityContributions|float32|packed/
    );
  });

  test.each([0, 2])('requires exactly one optional uint32 validity scalar: %i', length => {
    const fixture = createModularityFixture();
    const props = createModularityProps(fixture);
    const valid = createVector(fixture, 'validity-length', 'uint32', [new Uint32Array(length)]);

    expect(() => new LuGraphModularity({...props, valid})).toThrow(/valid|uint32|rows/);
  });

  test.each([
    ['misaligned byte offset', {byteOffset: 2}],
    ['padded byte stride', {byteStride: 8}],
    ['oversized row payload', {rowByteLength: 8}],
    ['multi-component scalar stride', {stride: 2}]
  ] as [string, VectorOptions][])('rejects unpacked scalar score: %s', (_name, options) => {
    const fixture = createModularityFixture();
    const props = createModularityProps(fixture);
    const output = createVector(
      fixture,
      'unpacked-score',
      'float32',
      [new Float32Array(1)],
      options
    );

    expect(() => new LuGraphModularity({...props, output})).toThrow(
      /output|float32|packed|aligned/
    );
  });

  test('accepts uint32-aligned labels and all outputs at non-256-byte binding offsets', () => {
    const fixture = createModularityFixture();
    const props = createModularityProps(fixture);
    const communities = createVector(
      fixture,
      'offset-communities',
      'uint32',
      [new Uint32Array(props.graph.vertexCount)],
      {byteOffset: 4}
    );
    const output = createVector(fixture, 'offset-score', 'float32', [new Float32Array(1)], {
      byteOffset: 4
    });
    const communityContributions = createVector(
      fixture,
      'offset-contributions',
      'float32',
      [new Float32Array(props.graph.vertexCount)],
      {byteOffset: 4}
    );
    const valid = createVector(fixture, 'offset-validity', 'uint32', [new Uint32Array(1)], {
      byteOffset: 4
    });

    const modularity = new LuGraphModularity({
      ...props,
      communities,
      output,
      communityContributions,
      valid
    });
    expect(modularity.communities.data[0].byteOffset).toBe(4);
    expect(modularity.output.data[0].byteOffset).toBe(4);
    expect(modularity.communityContributions?.data[0].byteOffset).toBe(4);
    expect(modularity.valid?.data[0].byteOffset).toBe(4);
  });

  test.each([
    'sourceVertices',
    'targetVertices',
    'edgeWeights',
    'edgeIds',
    'communities'
  ])('rejects writable scores aliasing existing physical input allocation: %s', inputName => {
    const fixture = createModularityFixture();
    const props = createModularityProps(fixture, {weighted: true, edgeIds: true});
    const input =
      inputName === 'communities'
        ? props.communities
        : props.graph[
            inputName as 'sourceVertices' | 'targetVertices' | 'edgeWeights' | 'edgeIds'
          ]!;
    const output = createVector(fixture, 'aliased-score', 'float32', [new Float32Array(1)], {
      buffer: input.data[0].buffer
    });

    expect(() => new LuGraphModularity({...props, output})).toThrow(
      /output|distinct|physical|allocation/
    );
  });

  test('rejects optional contributions and validity sharing any writable allocation', () => {
    const fixture = createModularityFixture();
    const props = createModularityProps(fixture, {
      vertexCount: 1,
      contributions: true,
      valid: true
    });
    const contributionAlias = createVector(
      fixture,
      'score-alias',
      'float32',
      [new Float32Array(1)],
      {
        buffer: props.output.data[0].buffer
      }
    );
    const validityAlias = createVector(
      fixture,
      'contribution-alias',
      'uint32',
      [new Uint32Array(1)],
      {
        buffer: props.communityContributions!.data[0].buffer
      }
    );

    expect(
      () => new LuGraphModularity({...props, communityContributions: contributionAlias})
    ).toThrow(/communityContributions|distinct|physical|allocation/);
    expect(() => new LuGraphModularity({...props, valid: validityAlias})).toThrow(
      /valid|distinct|physical|allocation/
    );
  });

  test('unwraps borrowed DynamicBuffer wrappers when checking physical output aliases', () => {
    const fixture = createModularityFixture();
    const props = createModularityProps(fixture);
    const concreteBuffer = props.graph.sourceVertices.data[0].buffer as Buffer;
    const dynamicBuffer = new DynamicBuffer(fixture.device, {
      id: 'borrowed-source-wrapper',
      buffer: concreteBuffer,
      ownsBuffer: false
    });
    fixture.dynamicBuffers.push(dynamicBuffer);
    const output = createVector(fixture, 'wrapped-score-alias', 'float32', [new Float32Array(1)], {
      buffer: dynamicBuffer
    });

    expect(() => new LuGraphModularity({...props, output})).toThrow(/distinct|physical|allocation/);
    expect(concreteBuffer.destroyed).toBe(false);
  });
});

function createModularityFixture(): ModularityFixture {
  const fixture = {device: new NullDevice({}), buffers: [], dynamicBuffers: [], vectors: []};
  modularityFixtures.push(fixture);
  return fixture;
}

function createModularityProps(
  fixture: ModularityFixture,
  options: {
    vertexCount?: number;
    directed?: boolean;
    weighted?: boolean;
    edgeIds?: boolean;
    contributions?: boolean;
    valid?: boolean;
  } = {}
): LuGraphModularityProps {
  const vertexCount = options.vertexCount ?? 6;
  const sourceVertices = createVector(fixture, 'sourceVertices', 'uint32', [
    Uint32Array.from([0, 1]),
    new Uint32Array(0),
    Uint32Array.from([2, 3, 4])
  ]);
  const targetVertices = createVector(fixture, 'targetVertices', 'uint32', [
    Uint32Array.from([1, 2]),
    new Uint32Array(0),
    Uint32Array.from([3, 4, 5])
  ]);
  const edgeWeights = options.weighted
    ? createVector(fixture, 'edgeWeights', 'float32', [
        Float32Array.from([0.5, 2]),
        new Float32Array(0),
        Float32Array.from([1, 4, 8])
      ])
    : undefined;
  const edgeIds = options.edgeIds
    ? createVector(fixture, 'edgeIds', 'uint32', [
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
  const communities = createVector(fixture, 'communities', 'uint32', [
    new Uint32Array(vertexCount)
  ]);
  const output = createVector(fixture, 'modularity-score', 'float32', [new Float32Array(1)]);
  const communityContributions = options.contributions
    ? createVector(fixture, 'community-contributions', 'float32', [new Float32Array(vertexCount)])
    : undefined;
  const valid = options.valid
    ? createVector(fixture, 'modularity-valid', 'uint32', [new Uint32Array(1)])
    : undefined;
  return {graph, communities, output, communityContributions, valid};
}

function createVector<Format extends ScalarFormat>(
  fixture: ModularityFixture,
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
