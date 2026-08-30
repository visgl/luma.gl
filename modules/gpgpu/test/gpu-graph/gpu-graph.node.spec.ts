// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';

import {Buffer} from '@luma.gl/core';
import * as experimentalModule from '@luma.gl/experimental';
import * as gpuGraphModule from '@luma.gl/gpgpu/gpu-graph';
import {GPUGraph} from '@luma.gl/gpgpu/gpu-graph';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {GPURecordBatch, GPUTable} from '@luma.gl/experimental/gpu-tables';
import {NullDevice} from '@luma.gl/test-utils';
import {afterEach, describe, expect, test, vi} from 'vitest';

type GraphScalarFormat = 'uint32' | 'float32' | 'sint32';
type GraphScalarArray = Uint32Array | Float32Array | Int32Array;

type GraphFixture = {
  device: NullDevice;
  buffers: Buffer[];
  vectors: GPUVector[];
  tables: GPUTable[];
};

type GraphVectorOptions = {
  byteOffset?: number;
  byteStride?: number;
  rowByteLength?: number;
  stride?: number;
  vectorByteStride?: number;
  vectorRowByteLength?: number;
  vectorStride?: number;
  ownsBuffer?: boolean;
  ownsData?: boolean;
};

type GraphColumns = {
  sourceVertices: GPUVector<'uint32'>;
  targetVertices: GPUVector<'uint32'>;
  edgeWeights: GPUVector<'float32'>;
  edgeIds: GPUVector<'uint32'>;
};

const graphFixtures: GraphFixture[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const fixture of graphFixtures.splice(0)) {
    for (const table of fixture.tables) table.destroy();
    for (const vector of fixture.vectors) vector.destroy();
    for (const buffer of fixture.buffers) buffer.destroy();
    fixture.device.destroy();
  }
});

describe('@luma.gl/gpgpu/gpu-graph package boundary', () => {
  test('publishes an optional, side-effect-free conditional export without Apache Arrow', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
    ) as {
      name?: string;
      sideEffects?: boolean;
      exports?: Record<string, Record<string, string>>;
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
    };

    expect(packageJson.name).toBe('@luma.gl/gpgpu');
    expect(packageJson.sideEffects).toBe(false);
    expect(packageJson.exports?.['./gpu-graph']).toEqual({
      import: './dist/gpu-graph/index.js',
      require: './dist/gpu-graph/index.cjs',
      types: './dist/gpu-graph/index.d.ts'
    });
    for (const dependencies of [
      packageJson.dependencies,
      packageJson.peerDependencies,
      packageJson.optionalDependencies
    ]) {
      expect(dependencies?.['apache-arrow']).toBeUndefined();
    }
    for (const sourceFile of ['index.ts', 'gpu-graph.ts']) {
      const source = readFileSync(
        new URL(`../../src/gpu-graph/${sourceFile}`, import.meta.url),
        'utf8'
      );
      expect(source).not.toMatch(/['"]apache-arrow['"]/);
    }
  });

  test('keeps graph runtime exports isolated from the root experimental entry point', () => {
    expect(gpuGraphModule.GPUGraph).toBe(GPUGraph);
    expect('GPUGraph' in experimentalModule).toBe(false);
  });
});

describe('GPUGraph caller-owned graph representation', () => {
  test('retains exact edge chunks, buffers, stable identities, record batches, and source metadata', () => {
    const fixture = createGraphFixture();
    const columns = createGraphColumns(fixture);
    const edgeAttributes = createEdgeAttributeTable(fixture, columns);
    const nodeAttributes = createPropertyTable(fixture, 'nodeScore', 'float32', [
      new Float32Array(8)
    ]);
    const graph = new GPUGraph({
      vertexCount: 8,
      ...columns,
      nodeAttributes,
      edgeAttributes
    });

    expect(graph.vertexCount).toBe(8);
    expect(graph.edgeCount).toBe(5);
    expect(graph.directed).toBe(true);
    expect(graph.sourceVertices).toBe(columns.sourceVertices);
    expect(graph.targetVertices).toBe(columns.targetVertices);
    expect(graph.edgeWeights).toBe(columns.edgeWeights);
    expect(graph.edgeIds).toBe(columns.edgeIds);
    expect(graph.nodeAttributes).toBe(nodeAttributes);
    expect(graph.edgeAttributes).toBe(edgeAttributes);
    expect(graph.sourceEdgeBatches).toBe(edgeAttributes.batches);
    expect(graph.sourceEdgeBatches.map(batch => batch.numRows)).toEqual([2, 0, 3]);
    expect(graph.sourceVertices.data.map(chunk => chunk.length)).toEqual([2, 0, 3]);
    expect(graph.targetVertices.data.map(chunk => chunk.length)).toEqual([2, 0, 3]);
    expect(graph.edgeIds?.data.map(chunk => chunk.length)).toEqual([2, 0, 3]);
    expect(graph.edgeWeights?.data.map(chunk => chunk.length)).toEqual([2, 0, 3]);

    for (const [chunkIndex, sourceChunk] of columns.sourceVertices.data.entries()) {
      const sourceBatch = edgeAttributes.batches[chunkIndex];
      expect(graph.sourceVertices.data[chunkIndex]).toBe(sourceChunk);
      expect(graph.sourceVertices.data[chunkIndex].buffer).toBe(sourceChunk.buffer);
      expect(graph.sourceVertices.data[chunkIndex].readbackMetadata).toBe(
        sourceChunk.readbackMetadata
      );
      expect(graph.sourceEdgeBatches[chunkIndex]).toBe(sourceBatch);
      expect(graph.sourceEdgeBatches[chunkIndex].sourceInfo).toBe(sourceBatch.sourceInfo);
      expect(sourceBatch.gpuData.sourceVertices).toBe(sourceChunk);
      expect(sourceBatch.gpuData.targetVertices).toBe(columns.targetVertices.data[chunkIndex]);
      expect(sourceBatch.gpuData.edgeIds).toBe(columns.edgeIds.data[chunkIndex]);
    }

    expect(graph.sourceEdgeBatches.map(batch => batch.sourceInfo)).toEqual([
      {sourceBatchIndex: 0, sourceRowIndexOffset: 19, sourceRowCount: 2},
      {sourceBatchIndex: 1, sourceRowIndexOffset: 21, sourceRowCount: 0},
      {sourceBatchIndex: 2, sourceRowIndexOffset: 21, sourceRowCount: 3}
    ]);
  });

  test('retains explicit directedness without symmetrizing or changing edge identities', () => {
    const fixture = createGraphFixture();
    const {sourceVertices, targetVertices, edgeIds} = createGraphColumns(fixture);
    const graph = new GPUGraph({
      vertexCount: 8,
      sourceVertices,
      targetVertices,
      edgeIds,
      directed: false
    });

    expect(graph.directed).toBe(false);
    expect(graph.edgeCount).toBe(5);
    expect(graph.edgeIds).toBe(edgeIds);
    expect(graph.sourceVertices.data).toBe(sourceVertices.data);
    expect(graph.targetVertices.data).toBe(targetVertices.data);
  });

  test('preserves empty graphs, isolated vertices, and the maximum bounded vertex count', () => {
    const fixture = createGraphFixture();
    const sourceVertices = createGraphVector(fixture, 'emptySources', 'uint32', []);
    const targetVertices = createGraphVector(fixture, 'emptyTargets', 'uint32', []);
    const empty = new GPUGraph({vertexCount: 0, sourceVertices, targetVertices});
    const isolated = new GPUGraph({vertexCount: 9, sourceVertices, targetVertices});
    const maximum = new GPUGraph({vertexCount: 0xfffffffe, sourceVertices, targetVertices});

    expect(empty.vertexCount).toBe(0);
    expect(empty.edgeCount).toBe(0);
    expect(empty.sourceEdgeBatches).toEqual([]);
    expect(Object.isFrozen(empty.sourceEdgeBatches)).toBe(true);
    expect(isolated.vertexCount).toBe(9);
    expect(isolated.edgeCount).toBe(0);
    expect(isolated.sourceEdgeBatches).toBe(empty.sourceEdgeBatches);
    expect(maximum.vertexCount).toBe(0xfffffffe);
  });

  test('constructs metadata without allocations, GPU submission, writes, or readback', () => {
    const fixture = createGraphFixture();
    const columns = createGraphColumns(fixture);
    const edgeAttributes = createEdgeAttributeTable(fixture, columns);
    const createBufferSpy = vi.spyOn(fixture.device, 'createBuffer');
    const createCommandEncoderSpy = vi.spyOn(fixture.device, 'createCommandEncoder');
    const submitSpy = vi.spyOn(fixture.device, 'submit');
    const readbackSpies = fixture.buffers.map(buffer => vi.spyOn(buffer, 'readAsync'));
    const mappedReadbackSpies = fixture.buffers.map(buffer => vi.spyOn(buffer, 'mapAndReadAsync'));
    const writeSpies = fixture.buffers.map(buffer => vi.spyOn(buffer, 'write'));

    const graph = new GPUGraph({vertexCount: 8, ...columns, edgeAttributes});

    expect(graph.edgeCount).toBe(5);
    expect(createBufferSpy).not.toHaveBeenCalled();
    expect(createCommandEncoderSpy).not.toHaveBeenCalled();
    expect(submitSpy).not.toHaveBeenCalled();
    for (const spy of [...readbackSpies, ...mappedReadbackSpies, ...writeSpies]) {
      expect(spy).not.toHaveBeenCalled();
    }
  });

  test('leaves destruction and every borrowed GPU buffer under caller control', () => {
    const fixture = createGraphFixture();
    const sourceVertices = createGraphVector(
      fixture,
      'ownedSources',
      'uint32',
      [Uint32Array.from([0, 1])],
      {ownsBuffer: true, ownsData: true}
    );
    const targetVertices = createGraphVector(
      fixture,
      'ownedTargets',
      'uint32',
      [Uint32Array.from([1, 2])],
      {ownsBuffer: true, ownsData: true}
    );
    const sourceBuffer = sourceVertices.data[0].buffer;
    const targetBuffer = targetVertices.data[0].buffer;
    const graph = new GPUGraph({vertexCount: 3, sourceVertices, targetVertices});

    expect(Reflect.has(graph, 'destroy')).toBe(false);
    expect(sourceBuffer.destroyed).toBe(false);
    expect(targetBuffer.destroyed).toBe(false);

    sourceVertices.destroy();
    expect(sourceBuffer.destroyed).toBe(true);
    expect(targetBuffer.destroyed).toBe(false);

    targetVertices.destroy();
    expect(targetBuffer.destroyed).toBe(true);
  });
});

describe('GPUGraph bounded graph validation', () => {
  test.each([
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    0xffffffff,
    0x100000000
  ])('rejects an unrepresentable vertex count: %s', vertexCount => {
    const fixture = createGraphFixture();
    const sourceVertices = createGraphVector(fixture, 'sources', 'uint32', []);
    const targetVertices = createGraphVector(fixture, 'targets', 'uint32', []);

    expect(() => new GPUGraph({vertexCount, sourceVertices, targetVertices})).toThrow(
      /vertexCount.*uint32/
    );
  });

  test('rejects edge counts beyond uint32 without allocating a giant buffer', () => {
    const fixture = createGraphFixture();
    const sourceVertices = createGraphVector(fixture, 'sources', 'uint32', [Uint32Array.from([0])]);
    const targetVertices = createGraphVector(fixture, 'targets', 'uint32', [Uint32Array.from([1])]);
    sourceVertices.length = 0x100000000;
    sourceVertices.valueLength = 0x100000000;
    targetVertices.length = 0x100000000;
    targetVertices.valueLength = 0x100000000;

    expect(() => new GPUGraph({vertexCount: 2, sourceVertices, targetVertices})).toThrow(
      /edgeCount.*uint32/
    );
  });

  test('rejects non-uint32 source and target vertex formats', () => {
    const fixture = createGraphFixture();
    const sourceVertices = createGraphVector(fixture, 'sources', 'uint32', [Uint32Array.from([0])]);
    const targetVertices = createGraphVector(fixture, 'targets', 'uint32', [Uint32Array.from([1])]);
    const signedVertices = createGraphVector(fixture, 'signedVertices', 'sint32', [
      Int32Array.from([0])
    ]);

    expect(
      () =>
        new GPUGraph({
          vertexCount: 2,
          sourceVertices: asVertexVector(signedVertices),
          targetVertices
        })
    ).toThrow(/sourceVertices.*uint32/);
    expect(
      () =>
        new GPUGraph({
          vertexCount: 2,
          sourceVertices,
          targetVertices: asVertexVector(signedVertices)
        })
    ).toThrow(/targetVertices.*uint32/);
  });

  test('requires float32 edge weights and uint32 stable edge identifiers', () => {
    const fixture = createGraphFixture();
    const {sourceVertices, targetVertices, edgeWeights, edgeIds} = createGraphColumns(fixture);

    expect(
      () =>
        new GPUGraph({
          vertexCount: 8,
          sourceVertices,
          targetVertices,
          edgeWeights: asWeightVector(edgeIds)
        })
    ).toThrow(/edgeWeights.*float32/);
    expect(
      () =>
        new GPUGraph({
          vertexCount: 8,
          sourceVertices,
          targetVertices,
          edgeIds: asVertexVector(edgeWeights)
        })
    ).toThrow(/edgeIds.*uint32/);
  });

  test.each([
    ['misaligned chunk offsets', {byteOffset: 2}],
    ['padded chunk byte strides', {byteStride: 8}],
    ['oversized chunk rows', {rowByteLength: 8}],
    ['multi-component chunk strides', {stride: 2}],
    ['padded vector byte strides', {vectorByteStride: 8}],
    ['oversized vector rows', {vectorRowByteLength: 8}],
    ['multi-component vector strides', {vectorStride: 2}]
  ] as Array<
    [string, GraphVectorOptions]
  >)('rejects unpacked vertex layouts: %s', (_description, options) => {
    const fixture = createGraphFixture();
    const sourceVertices = createGraphVector(
      fixture,
      'invalidSources',
      'uint32',
      [Uint32Array.from([0, 1])],
      options
    );
    const targetVertices = createGraphVector(fixture, 'targets', 'uint32', [
      Uint32Array.from([1, 2])
    ]);

    expect(() => new GPUGraph({vertexCount: 3, sourceVertices, targetVertices})).toThrow(
      /sourceVertices.*packed/
    );
  });

  test('rejects a malformed format on an otherwise empty preserved edge chunk', () => {
    const fixture = createGraphFixture();
    const {sourceVertices, targetVertices} = createGraphColumns(fixture);
    Object.defineProperty(sourceVertices.data[1], 'format', {value: 'float32'});

    expect(() => new GPUGraph({vertexCount: 8, sourceVertices, targetVertices})).toThrow(
      /sourceVertices.*uint32.*chunks/
    );
  });

  test.each([
    ['a missing empty batch', [2, 3]],
    ['different per-batch boundaries', [1, 0, 4]],
    ['fewer total edge rows', [2, 0, 2]]
  ])('rejects target edge topology with %s', (_description, chunkLengths) => {
    const fixture = createGraphFixture();
    const {sourceVertices} = createGraphColumns(fixture);
    const targetVertices = createGraphVector(
      fixture,
      'mismatchedTargets',
      'uint32',
      chunkLengths.map(chunkLength => new Uint32Array(chunkLength))
    );

    expect(() => new GPUGraph({vertexCount: 8, sourceVertices, targetVertices})).toThrow(
      /targetVertices.*chunk topology/
    );
  });

  test('requires edge weights and stable IDs to preserve every source chunk boundary', () => {
    const fixture = createGraphFixture();
    const {sourceVertices, targetVertices} = createGraphColumns(fixture);
    const mismatchedWeights = createGraphVector(fixture, 'mismatchedWeights', 'float32', [
      new Float32Array(2),
      new Float32Array(3)
    ]);
    const mismatchedEdgeIds = createGraphVector(fixture, 'mismatchedIds', 'uint32', [
      new Uint32Array(1),
      new Uint32Array(0),
      new Uint32Array(4)
    ]);

    expect(
      () =>
        new GPUGraph({
          vertexCount: 8,
          sourceVertices,
          targetVertices,
          edgeWeights: mismatchedWeights
        })
    ).toThrow(/edgeWeights.*chunk topology/);
    expect(
      () =>
        new GPUGraph({vertexCount: 8, sourceVertices, targetVertices, edgeIds: mismatchedEdgeIds})
    ).toThrow(/edgeIds.*chunk topology/);
  });

  test('requires vertex and edge property tables to match their logical row counts', () => {
    const fixture = createGraphFixture();
    const {sourceVertices, targetVertices} = createGraphColumns(fixture);
    const shortNodeAttributes = createPropertyTable(fixture, 'nodeScore', 'float32', [
      new Float32Array(7)
    ]);
    const shortEdgeAttributes = createPropertyTable(fixture, 'edgeScore', 'float32', [
      new Float32Array(2),
      new Float32Array(0),
      new Float32Array(2)
    ]);

    expect(
      () =>
        new GPUGraph({
          vertexCount: 8,
          sourceVertices,
          targetVertices,
          nodeAttributes: shortNodeAttributes
        })
    ).toThrow(/nodeAttributes.*one row per vertex/);
    expect(
      () =>
        new GPUGraph({
          vertexCount: 8,
          sourceVertices,
          targetVertices,
          edgeAttributes: shortEdgeAttributes
        })
    ).toThrow(/edgeAttributes.*one row per edge/);
  });

  test.each([
    ['different batch counts', [2, 3]],
    ['different source-aligned batch lengths', [1, 0, 4]]
  ])('rejects edge property tables with %s', (_description, chunkLengths) => {
    const fixture = createGraphFixture();
    const {sourceVertices, targetVertices} = createGraphColumns(fixture);
    const edgeAttributes = createPropertyTable(
      fixture,
      'edgeScore',
      'float32',
      chunkLengths.map(chunkLength => new Float32Array(chunkLength))
    );

    expect(
      () => new GPUGraph({vertexCount: 8, sourceVertices, targetVertices, edgeAttributes})
    ).toThrow(/edgeAttributes.*batch topology/);
  });

  test('accepts arbitrary edge properties without requiring duplicate endpoint columns', () => {
    const fixture = createGraphFixture();
    const {sourceVertices, targetVertices} = createGraphColumns(fixture);
    const edgeAttributes = createPropertyTable(fixture, 'edgeScore', 'float32', [
      new Float32Array(2),
      new Float32Array(0),
      new Float32Array(3)
    ]);
    const graph = new GPUGraph({vertexCount: 8, sourceVertices, targetVertices, edgeAttributes});

    expect(graph.edgeAttributes).toBe(edgeAttributes);
    expect(graph.sourceEdgeBatches).toBe(edgeAttributes.batches);
  });

  test('rejects edge property endpoint columns backed by different source chunks', () => {
    const fixture = createGraphFixture();
    const original = createGraphColumns(fixture);
    const replacements = createGraphColumns(fixture);
    const edgeAttributes = createEdgeAttributeTable(fixture, {
      ...original,
      sourceVertices: replacements.sourceVertices
    });

    expect(() => new GPUGraph({vertexCount: 8, ...original, edgeAttributes})).toThrow(
      /edgeAttributes sourceVertices.*source edge data/
    );
  });

  test('accepts custom-named endpoint columns when they preserve original GPU data chunks', () => {
    const fixture = createGraphFixture();
    const original = createGraphColumns(fixture);
    const sourceVertices = renameGraphVector(fixture, original.sourceVertices, 'fromVertex');
    const targetVertices = renameGraphVector(fixture, original.targetVertices, 'toVertex');
    const edgeAttributes = createNamedEndpointTable(fixture, sourceVertices, targetVertices);
    const graph = new GPUGraph({vertexCount: 8, sourceVertices, targetVertices, edgeAttributes});

    expect(graph.sourceVertices.name).toBe('fromVertex');
    expect(graph.targetVertices.name).toBe('toVertex');
    expect(graph.edgeAttributes?.gpuVectors.fromVertex.data).toEqual(sourceVertices.data);
    expect(graph.edgeAttributes?.gpuVectors.toVertex.data).toEqual(targetVertices.data);
  });

  test.each([
    ['sourceVertices', 'fromVertex'],
    ['targetVertices', 'toVertex']
  ] as const)('rejects foreign GPU chunks under the actual custom %s vector name', (column, customName) => {
    const fixture = createGraphFixture();
    const original = createGraphColumns(fixture);
    const replacements = createGraphColumns(fixture);
    const sourceVertices = renameGraphVector(fixture, original.sourceVertices, 'fromVertex');
    const targetVertices = renameGraphVector(fixture, original.targetVertices, 'toVertex');
    const tableSources =
      column === 'sourceVertices'
        ? renameGraphVector(fixture, replacements.sourceVertices, sourceVertices.name)
        : sourceVertices;
    const tableTargets =
      column === 'targetVertices'
        ? renameGraphVector(fixture, replacements.targetVertices, targetVertices.name)
        : targetVertices;
    const edgeAttributes = createNamedEndpointTable(fixture, tableSources, tableTargets);

    expect(
      () => new GPUGraph({vertexCount: 8, sourceVertices, targetVertices, edgeAttributes})
    ).toThrow(new RegExp(`edgeAttributes ${customName}.*source edge data`));
  });
});

function createGraphFixture(): GraphFixture {
  const fixture = {device: new NullDevice({}), buffers: [], vectors: [], tables: []};
  graphFixtures.push(fixture);
  return fixture;
}

function createGraphColumns(fixture: GraphFixture): GraphColumns {
  return {
    sourceVertices: createGraphVector(fixture, 'sourceVertices', 'uint32', [
      Uint32Array.from([0, 2]),
      new Uint32Array(0),
      Uint32Array.from([2, 3, 6])
    ]),
    targetVertices: createGraphVector(fixture, 'targetVertices', 'uint32', [
      Uint32Array.from([1, 4]),
      new Uint32Array(0),
      Uint32Array.from([3, 5, 7])
    ]),
    edgeWeights: createGraphVector(fixture, 'edgeWeights', 'float32', [
      Float32Array.from([0.5, 2]),
      new Float32Array(0),
      Float32Array.from([1, 4, 8])
    ]),
    edgeIds: createGraphVector(fixture, 'edgeIds', 'uint32', [
      Uint32Array.from([10, 42]),
      new Uint32Array(0),
      Uint32Array.from([99, 101, 102])
    ])
  };
}

function createGraphVector<Format extends GraphScalarFormat>(
  fixture: GraphFixture,
  name: string,
  format: Format,
  chunks: readonly GraphScalarArray[],
  options: GraphVectorOptions = {}
): GPUVector<Format> {
  const byteOffset = options.byteOffset ?? 0;
  const byteStride = options.byteStride ?? Uint32Array.BYTES_PER_ELEMENT;
  const rowByteLength = options.rowByteLength ?? Uint32Array.BYTES_PER_ELEMENT;
  const data = chunks.map((values, chunkIndex) => {
    const byteLength =
      byteOffset +
      Math.max(values.byteLength, Math.max(values.length, 1) * byteStride, rowByteLength);
    const buffer = fixture.device.createBuffer({
      id: `${name}-chunk-${chunkIndex}-${fixture.buffers.length}`,
      byteLength,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
    });
    fixture.buffers.push(buffer);
    if (values.byteLength > 0) {
      buffer.write(values, byteOffset);
    }
    return new GPUData<Format>({
      buffer,
      format,
      length: values.length,
      byteOffset,
      byteStride,
      rowByteLength,
      stride: options.stride ?? 1,
      ownsBuffer: options.ownsBuffer ?? false,
      readbackMetadata: {columnName: name, sourceBatchIndex: chunkIndex}
    });
  });
  const vector = new GPUVector<Format>({
    type: 'data',
    name,
    format,
    data,
    byteStride: options.vectorByteStride ?? byteStride,
    rowByteLength: options.vectorRowByteLength ?? rowByteLength,
    stride: options.vectorStride ?? options.stride ?? 1,
    ownsData: options.ownsData ?? false
  });
  fixture.vectors.push(vector);
  return vector;
}

function createEdgeAttributeTable(fixture: GraphFixture, columns: GraphColumns): GPUTable {
  let sourceRowIndexOffset = 19;
  const batches = columns.sourceVertices.data.map((sourceVertices, sourceBatchIndex) => {
    const batch = new GPURecordBatch({
      gpuData: {
        sourceVertices,
        targetVertices: columns.targetVertices.data[sourceBatchIndex],
        edgeWeights: columns.edgeWeights.data[sourceBatchIndex],
        edgeIds: columns.edgeIds.data[sourceBatchIndex]
      },
      sourceInfo: {
        sourceBatchIndex,
        sourceRowIndexOffset,
        sourceRowCount: sourceVertices.length
      }
    });
    sourceRowIndexOffset += sourceVertices.length;
    return batch;
  });
  const table = new GPUTable({batches});
  fixture.tables.push(table);
  return table;
}

function renameGraphVector(
  fixture: GraphFixture,
  vector: GPUVector<'uint32'>,
  name: string
): GPUVector<'uint32'> {
  const renamed = new GPUVector<'uint32'>({
    type: 'data',
    name,
    format: 'uint32',
    data: vector.data,
    ownsData: false
  });
  fixture.vectors.push(renamed);
  return renamed;
}

function createNamedEndpointTable(
  fixture: GraphFixture,
  sourceVertices: GPUVector<'uint32'>,
  targetVertices: GPUVector<'uint32'>
): GPUTable {
  const batches = sourceVertices.data.map(
    (sourceChunk, chunkIndex) =>
      new GPURecordBatch({
        gpuData: {
          [sourceVertices.name]: sourceChunk,
          [targetVertices.name]: targetVertices.data[chunkIndex]
        }
      })
  );
  const table = new GPUTable({batches});
  fixture.tables.push(table);
  return table;
}

function createPropertyTable<Format extends GraphScalarFormat>(
  fixture: GraphFixture,
  name: string,
  format: Format,
  chunks: readonly GraphScalarArray[]
): GPUTable {
  const vector = createGraphVector(fixture, name, format, chunks);
  const batches = vector.data.map(data => new GPURecordBatch({gpuData: {[name]: data}}));
  const table = new GPUTable({batches});
  fixture.tables.push(table);
  return table;
}

function asVertexVector(vector: GPUVector): GPUVector<'uint32'> {
  return vector as GPUVector<'uint32'>;
}

function asWeightVector(vector: GPUVector): GPUVector<'float32'> {
  return vector as GPUVector<'float32'>;
}
