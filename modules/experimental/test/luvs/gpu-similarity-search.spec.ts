// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {makeGPUTableFromArrowTable} from '@luma.gl/arrow';
import {Buffer, type Device, type ShaderLayout} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView, type GraphVectorView} from '@luma.gl/experimental';
import {GPUData, GPURecordBatch, GPUTable, GPUVector, type FixedSizeList} from '@luma.gl/tables';
import {getWebGPUTestDevice, NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';
import test, {type Test} from 'test/utils/vitest-tape';
import {importGPUEmbeddingTable, importGPUEmbeddingVector} from '../../src/luvs/embedding-matrix';
import {GPUSimilaritySearch} from '../../src/luvs/gpu-similarity-search';
import type {GPUEmbeddingMetric, GraphEmbeddingMatrix} from '../../src/luvs/types';

const INVALID_SOURCE_ROW_ID = 0xffff_ffff;

type EmbeddingChunkFixture = {
  rows: readonly (readonly number[])[];
  rowStride?: number;
  prefix?: readonly number[];
  sourceRowOffset?: number;
  sourceRowIds?: readonly number[];
  validity?: readonly number[];
};

type SimilaritySearchFixture = {
  dimensions: number;
  dataset: readonly EmbeddingChunkFixture[];
  queries: readonly EmbeddingChunkFixture[];
  k: number;
  metric?: GPUEmbeddingMetric;
  filterMask?: readonly number[];
  chunkedFilterMask?: readonly (readonly number[])[];
  queryFilterMask?: readonly number[];
  candidateIds?: readonly number[];
  excludeSelf?: boolean;
  tileSize?: number;
  candidateCounts?: boolean;
};

type CPUSourceEmbeddingRow = {
  values: number[];
  sourceRowId: number;
  sourceRowPosition: number;
  valid: boolean;
  chunkIndex: number;
  chunkRowIndex: number;
};

/** One caller-owned, row-oriented fixed-size-list column plus optional sibling metadata. */
type GPUEmbeddingVectorFixture = {
  vector: GPUVector<FixedSizeList<'float32'>>;
  sourceRowIds?: GPUVector<'uint32'>;
  validity?: GPUVector<'uint32'>;
  sourceRowOffsets: number[];
  rows: CPUSourceEmbeddingRow[];
};

type CPUSimilarityResult = {
  sourceRowIds: number[];
  scores: number[];
  resultCounts: number[];
  candidateCounts: number[];
};

type SearchExecution = {
  sourceRowIds: number[];
  scores: number[];
  resultCounts: number[];
  candidateCounts?: number[];
  nodeOrder: readonly string[];
  logicalTransientCount: number;
  physicalTransientCount: number;
  importedBuffersSurviveDestruction: boolean;
};

let fixtureSequence = 0;

test('GPUSimilaritySearch CPU oracle independently defines metrics, zero vectors, and tie ordering', t => {
  const fixture: SimilaritySearchFixture = {
    dimensions: 2,
    dataset: [
      {
        rows: [
          [1, 0],
          [-1, 0],
          [0, 0],
          [1, 0]
        ],
        sourceRowIds: [9, 4, 2, 3]
      }
    ],
    queries: [
      {
        rows: [
          [1, 0],
          [0, 0]
        ]
      }
    ],
    k: 4,
    candidateCounts: true
  };
  const dataset = getCPUFixtureRows(fixture.dataset, fixture.dimensions);
  const queries = getCPUFixtureRows(fixture.queries, fixture.dimensions);

  const euclidean = getIndependentCPUSimilarityResults(fixture, dataset, queries);
  t.deepEqual(
    euclidean.sourceRowIds.slice(0, 4),
    [3, 9, 2, 4],
    'distance ties use stable source IDs'
  );
  t.deepEqual(euclidean.scores.slice(0, 4), [0, 0, 1, 4], 'squared Euclidean distances are exact');

  const innerProduct = getIndependentCPUSimilarityResults(
    {...fixture, metric: 'inner-product'},
    dataset,
    queries
  );
  t.deepEqual(
    innerProduct.sourceRowIds.slice(0, 4),
    [3, 9, 2, 4],
    'inner products sort descending'
  );
  t.deepEqual(
    innerProduct.scores.slice(0, 4),
    [1, 1, 0, -1],
    'inner-product values are independent'
  );

  const cosine = getIndependentCPUSimilarityResults(
    {...fixture, metric: 'cosine'},
    dataset,
    queries
  );
  t.deepEqual(
    cosine.sourceRowIds.slice(4, 8),
    [2, 3, 4, 9],
    'zero-query cosine ties remain stable'
  );
  t.deepEqual(
    cosine.scores.slice(4, 8),
    [1, 0, 0, 0],
    'two zero vectors have unit cosine similarity'
  );
  t.deepEqual(cosine.candidateCounts, [4, 4], 'candidate counts remain independent from top-K');
  t.end();
});

test('GPUSimilaritySearch validates generic matrix shape and independent writable outputs', t => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const graph = new GPUCommandGraph(device, {id: 'similarity-node-validation'});
  const ownedVectors: GPUVector[] = [];
  const dataset = createEmbeddingVector(
    device,
    'validation-dataset',
    2,
    [{rows: [[1, 2]]}],
    ownedVectors
  );
  const queries = createEmbeddingVector(
    device,
    'validation-queries',
    2,
    [{rows: [[1, 2]]}],
    ownedVectors
  );
  const importedDataset = importEmbeddingFixture(graph, dataset, 'dataset');
  const importedQueries = importEmbeddingFixture(graph, queries, 'queries');
  const outputIds = createUint32View(graph, ownedVectors, 'output-ids', 1);
  const outputScores = createFloat32View(graph, ownedVectors, 'output-scores', 1);
  const resultCounts = createUint32View(graph, ownedVectors, 'result-counts', 1);
  const validProps = {
    dataset: importedDataset,
    queries: importedQueries,
    outputIds,
    outputScores,
    resultCounts,
    k: 1
  };

  t.doesNotThrow(
    () => new GPUSimilaritySearch(validProps),
    'accepts distinct caller-owned buffers'
  );
  t.throws(
    () => new GPUSimilaritySearch({...validProps, k: -1}),
    /result count/,
    'rejects negative result counts'
  );
  t.throws(
    () => new GPUSimilaritySearch({...validProps, tileSize: 0}),
    /tileSize/,
    'rejects nonpositive tile bounds'
  );
  t.throws(
    () =>
      new GPUSimilaritySearch({
        ...validProps,
        metric: 'euclidean' as GPUEmbeddingMetric
      }),
    /metric/,
    'rejects unsupported metrics'
  );
  t.throws(
    () => new GPUSimilaritySearch({...validProps, resultCounts: outputIds}),
    /must not overlap/,
    'rejects aliased writable result buffers'
  );
  const malformedStride = new GPUData<FixedSizeList<'float32', 2>>({
    buffer: dataset.vector.data[0].buffer,
    format: 'fixed-size-list<float32,2>',
    length: 1,
    byteStride: 2 * Float32Array.BYTES_PER_ELEMENT,
    rowByteLength: 2 * Float32Array.BYTES_PER_ELEMENT
  });
  Object.defineProperty(malformedStride, 'byteStride', {value: Float32Array.BYTES_PER_ELEMENT});
  const malformedVector = new GPUVector({
    type: 'data',
    name: 'malformed-embedding-stride',
    format: 'fixed-size-list<float32,2>',
    data: [malformedStride]
  });
  t.throws(
    () => importGPUEmbeddingVector(graph, malformedVector),
    /aligned, bounded fixed-size float32 rows/,
    'rejects physical row strides narrower than the embedding dimensions'
  );

  const mismatchedRows = new GPUVector({
    type: 'data',
    name: 'mismatched-embedding-rows',
    format: 'fixed-size-list<float32,2>',
    data: dataset.vector.data
  });
  Object.defineProperty(mismatchedRows, 'length', {value: 2});
  t.throws(
    () => importGPUEmbeddingVector(graph, mismatchedRows),
    /source chunk rows/,
    'rejects aggregate row counts that disagree with source topology'
  );
  t.throws(
    () =>
      importGPUEmbeddingVector(graph, dataset.vector, {
        id: 'invalid-source-offset',
        sourceRowOffset: INVALID_SOURCE_ROW_ID
      }),
    /aligned, bounded fixed-size float32 rows/,
    'reserves the maximum uint32 value for invalid result slots'
  );

  const boundedValues = new GPUVector<FixedSizeList<'float32', 2>>({
    type: 'buffer',
    name: 'bounded-embedding-values',
    buffer: device.createBuffer({
      data: Float32Array.from([1, 2, 90, 91]),
      usage: Buffer.STORAGE | Buffer.COPY_DST
    }),
    format: 'fixed-size-list<float32,2>',
    length: 1,
    byteOffset: 2 * Float32Array.BYTES_PER_ELEMENT,
    ownsBuffer: true
  });
  Object.defineProperty(boundedValues, 'length', {value: 2});
  Object.defineProperty(boundedValues.data[0], 'length', {value: 2});
  Object.defineProperty(boundedValues.data[0], 'valueLength', {value: 4});
  ownedVectors.push(boundedValues);
  t.throws(
    () => importGPUEmbeddingVector(graph, boundedValues),
    /declared GPUData byte range/,
    'never exposes unrelated bytes beyond the declared GPUData slice'
  );

  t.throws(
    () => importGPUEmbeddingVector(graph, dataset.vector, {dimensions: 3}),
    /fit within its fixed-size-list rows/,
    'rejects meaningful dimensions beyond the physical fixed-size-list cardinality'
  );
  t.throws(
    () => importGPUEmbeddingVector(graph, dataset.vector, {dimensions: 0}),
    /fit within its fixed-size-list rows/,
    'rejects zero meaningful embedding dimensions'
  );

  destroyOwnedVectors(ownedVectors);
  t.end();
});

test('importGPUEmbeddingTable borrows fixed-size-list batches and row-aligned table metadata', t => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const graph = new GPUCommandGraph(device, {id: 'embedding-table-node-validation'});
  const ownedVectors: GPUVector[] = [];
  const fixture = createEmbeddingVector(
    device,
    'table-source',
    3,
    [
      {
        rows: [
          [1, 2, 3],
          [4, 5, 6]
        ],
        rowStride: 5,
        prefix: [777],
        sourceRowOffset: 9,
        sourceRowIds: [90, 12]
      },
      {rows: [], sourceRowOffset: 11},
      {
        rows: [[7, 8, 9]],
        sourceRowOffset: 27,
        sourceRowIds: [44],
        validity: [0]
      }
    ],
    ownedVectors
  );
  const batches = fixture.vector.data.map(
    (data, batchIndex) =>
      new GPURecordBatch({
        gpuData: {
          embedding: data,
          stableId: fixture.sourceRowIds!.data[batchIndex],
          valid: fixture.validity!.data[batchIndex]
        },
        sourceInfo: {
          sourceBatchIndex: batchIndex,
          sourceRowIndexOffset: fixture.sourceRowOffsets[batchIndex],
          sourceRowCount: data.length
        }
      })
  );
  const table = new GPUTable({batches});
  const imported = importGPUEmbeddingTable(graph, table, {
    column: 'embedding',
    sourceRowIds: 'stableId',
    validity: 'valid',
    id: 'table-column'
  });

  t.equal(imported.dimensions, 3, 'embedding dimensions come from fixed-size-list schema metadata');
  t.equal(imported.rowCount, 3, 'logical row count is independent from flattened coordinate count');
  t.deepEqual(
    imported.chunks.map(chunk => chunk.rowCount),
    [2, 0, 1],
    'empty and uneven record-batch boundaries are preserved without packing'
  );
  t.deepEqual(
    imported.chunks.map(chunk => chunk.sourceRowOffset),
    [9, 11, 27],
    'existing record-batch source provenance becomes the implicit stable row positions'
  );
  t.equal(imported.chunks[0].rowStride, 5, 'padded physical row stride stays in float32 units');
  t.equal(
    imported.chunks[0].byteOffset,
    Float32Array.BYTES_PER_ELEMENT,
    'nonzero GPUData offsets are preserved'
  );
  t.equal(imported.chunks[0].values.length, 8, 'the final row does not require trailing padding');
  t.ok(
    imported.chunks.every(chunk => chunk.sourceRowIds),
    'stable IDs remain table-owned columns'
  );
  t.ok(
    imported.chunks.every(chunk => chunk.validity),
    'validity remains a table-owned column'
  );
  t.equal(table.gpuVectors.embedding.length, 3, 'the aggregate source column remains row-oriented');
  t.equal(table.gpuVectors.embedding.valueLength, 9, 'flattened value count remains separate');

  const singleBatch = importGPUEmbeddingTable(graph, batches[0], {
    column: 'embedding',
    dimensions: 2,
    sourceRowIds: 'stableId',
    validity: 'valid',
    id: 'single-batch'
  });
  t.equal(singleBatch.dimensions, 2, 'callers may explicitly ignore trailing fixed-list features');
  t.equal(singleBatch.chunks[0].rowStride, 5, 'physical row stride survives feature truncation');
  t.equal(singleBatch.chunks[0].values.length, 7, 'only meaningful coordinates enter the view');

  const sourceIdData = fixture.sourceRowIds!.data[0];
  Object.defineProperty(sourceIdData, 'nullBitmap', {value: Uint8Array.from([0b11])});
  t.doesNotThrow(
    () =>
      importGPUEmbeddingTable(graph, batches[0], {
        id: 'nullable-schema-all-valid',
        column: 'embedding',
        sourceRowIds: 'stableId'
      }),
    'nullable source-ID schemas are allowed when every actual row remains valid'
  );
  Object.defineProperty(sourceIdData, 'nullBitmap', {value: Uint8Array.from([0b01])});
  t.throws(
    () =>
      importGPUEmbeddingVector(graph, fixture.vector, {
        id: 'nullable-source-id-vector',
        sourceRowIds: fixture.sourceRowIds
      }),
    /source-row IDs must not contain null/,
    'vector imports reject actual null stable IDs without GPU readback'
  );
  t.throws(
    () =>
      importGPUEmbeddingTable(graph, table, {
        id: 'nullable-source-id-table',
        column: 'embedding',
        sourceRowIds: 'stableId'
      }),
    /source-row IDs must not contain null/,
    'table imports reject null stable IDs before treating physical zero as a real ID'
  );
  Object.defineProperty(sourceIdData, 'nullBitmap', {value: undefined});

  const embeddingData = fixture.vector.data[0];
  Object.defineProperty(embeddingData, 'nullBitmap', {value: Uint8Array.from([0b01])});
  t.throws(
    () => importGPUEmbeddingVector(graph, fixture.vector, {id: 'nullable-vector-without-mask'}),
    /null values require explicit GPU validity flags/,
    'nullable vector rows cannot silently enter search without a caller-owned GPU validity mask'
  );
  t.throws(
    () =>
      importGPUEmbeddingTable(graph, batches[0], {
        id: 'nullable-table-without-mask',
        column: 'embedding'
      }),
    /null values require explicit GPU validity flags/,
    'nullable table rows cannot silently enter search without a selected GPU validity column'
  );
  t.doesNotThrow(
    () =>
      importGPUEmbeddingVector(graph, fixture.vector, {
        id: 'nullable-vector-with-mask',
        validity: fixture.validity
      }),
    'an explicitly selected GPU validity vector permits intentional nullable-row filtering'
  );
  t.doesNotThrow(
    () =>
      importGPUEmbeddingTable(graph, batches[0], {
        id: 'nullable-table-with-mask',
        column: 'embedding',
        validity: 'valid'
      }),
    'an explicitly selected GPU validity column permits intentional nullable-row filtering'
  );
  Object.defineProperty(embeddingData, 'nullBitmap', {value: undefined});

  t.throws(
    () => importGPUEmbeddingTable(graph, table, {column: 'missing'}),
    /does not contain column/,
    'rejects missing embedding columns'
  );
  t.throws(
    () => importGPUEmbeddingTable(graph, table, {column: 'embedding', validity: 'missing'}),
    /row-aligned uint32 column/,
    'rejects absent explicitly requested validity columns'
  );
  t.throws(
    () => importGPUEmbeddingTable(graph, table, {column: 'embedding', dimensions: 4}),
    /fit within its fixed-size-list rows/,
    'rejects meaningful dimensions beyond the existing fixed-list cardinality'
  );

  const compiled = graph.compile();
  compiled.destroy();
  t.ok(
    ownedVectors.every(vector => vector.data.every(chunk => !chunk.buffer.destroyed)),
    'graph destruction never destroys buffers owned by existing table columns'
  );
  destroyOwnedVectors(ownedVectors);
  t.end();
});

test('importGPUEmbeddingTable retains schema dimensions for an empty caller-owned GPU table', t => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const graph = new GPUCommandGraph(device, {id: 'empty-embedding-table'});
  const table = new GPUTable({
    schema: {
      fields: [{name: 'embedding', format: 'fixed-size-list<float32,768>'}],
      metadata: new Map()
    }
  });
  const imported = importGPUEmbeddingTable(graph, table, {column: 'embedding'});
  t.equal(imported.dimensions, 768, 'schema metadata remains available without uploaded batches');
  t.equal(imported.rowCount, 0, 'empty table imports have no logical rows');
  t.deepEqual(imported.chunks, [], 'no placeholder GPU allocations are invented');
  t.end();
});

test('GPUSimilaritySearch consumes nullable Arrow fixed-size lists through ordinary GPU tables', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU(t);

  const embeddingType = new arrow.FixedSizeList(
    4,
    new arrow.Field('feature', new arrow.Float32(), true)
  );
  const firstBatch = new arrow.Table({
    embedding: arrow.vectorFromArray(
      [
        [0, 0, 0, null],
        [1, 0, 0, null]
      ],
      embeddingType
    ),
    sourceIds: arrow.vectorFromArray([42, 7], new arrow.Uint32())
  }).batches[0];
  const secondBatch = new arrow.Table({
    embedding: arrow.vectorFromArray([null, [0, 0, 1, null]], embeddingType),
    sourceIds: arrow.vectorFromArray([99, 3], new arrow.Uint32())
  }).batches[0];
  const querySource = new arrow.Table({
    embedding: arrow.vectorFromArray([[0, 0, 0, null]], embeddingType),
    sourceIds: arrow.vectorFromArray([500], new arrow.Uint32())
  });
  const shaderLayout: ShaderLayout = {
    attributes: [],
    bindings: [
      {name: 'embedding', type: 'read-only-storage', group: 0, location: 0},
      {name: 'sourceIds', type: 'read-only-storage', group: 0, location: 1}
    ]
  };
  const tableOptions = {
    shaderLayout,
    fixedSizeListColumns: ['embedding'],
    validityColumns: {embedding: {name: 'embeddingValidity', dimensions: 3}}
  };
  const datasetTable = makeGPUTableFromArrowTable(
    device,
    new arrow.Table([firstBatch, secondBatch]),
    tableOptions
  );
  const queryTable = makeGPUTableFromArrowTable(device, querySource, tableOptions);
  const graph = new GPUCommandGraph(device, {id: 'arrow-fixed-size-list-similarity'});
  const ownedVectors: GPUVector[] = [];
  t.throws(
    () =>
      importGPUEmbeddingTable(graph, datasetTable, {
        id: 'dataset-without-validity',
        column: 'embedding',
        dimensions: 3,
        sourceRowIds: 'sourceIds'
      }),
    /null values require explicit GPU validity flags/,
    'nullable Arrow parent rows and nullable padding cannot bypass explicit GPU validity'
  );
  const dataset = importGPUEmbeddingTable(graph, datasetTable, {
    id: 'dataset',
    column: 'embedding',
    dimensions: 3,
    sourceRowIds: 'sourceIds',
    validity: 'embeddingValidity'
  });
  const queries = importGPUEmbeddingTable(graph, queryTable, {
    id: 'queries',
    column: 'embedding',
    dimensions: 3,
    validity: 'embeddingValidity'
  });
  const outputIds = createUint32View(graph, ownedVectors, 'arrow-result-ids', 3);
  const outputScores = createFloat32View(graph, ownedVectors, 'arrow-result-scores', 3);
  const resultCounts = createUint32View(graph, ownedVectors, 'arrow-result-counts', 1);
  const candidateCounts = createUint32View(graph, ownedVectors, 'arrow-candidate-counts', 1);

  new GPUSimilaritySearch({
    id: 'arrow-fixed-size-list',
    dataset,
    queries,
    outputIds,
    outputScores,
    resultCounts,
    candidateCounts,
    k: 3
  }).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const encoder = device.createCommandEncoder({id: 'arrow-fixed-size-list-encoder'});
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());

    t.equal(datasetTable.gpuVectors.embedding.format, 'fixed-size-list<float32,4>');
    t.equal(datasetTable.gpuVectors.embedding.length, 4, 'embedding values remain table rows');
    t.equal(
      datasetTable.gpuVectors.embedding.valueLength,
      16,
      'physical coordinates remain values'
    );
    t.deepEqual(
      dataset.chunks.map(chunk => chunk.rowCount),
      [2, 2],
      'Arrow batches stay distinct'
    );
    t.equal(
      dataset.dimensions,
      3,
      'explicit dimensions ignore the nullable fourth padding feature'
    );
    t.equal(dataset.chunks[0].rowStride, 4, 'physical Arrow fixed-list cardinality stays intact');
    t.deepEqual(
      await readUint32View(ownedVectors, outputIds, 3),
      [42, 3, 7],
      'parent-null rows are removed while nullable padding and stable Arrow source IDs are honored'
    );
    t.deepEqual(await readFloat32View(ownedVectors, outputScores, 3), [0, 1, 1]);
    t.deepEqual(await readUint32View(ownedVectors, resultCounts, 1), [3]);
    t.deepEqual(await readUint32View(ownedVectors, candidateCounts, 1), [3]);

    compiled.destroy();
    t.ok(
      datasetTable.batches.every(batch =>
        Object.values(batch.gpuData).every(data => !data.buffer.destroyed)
      ),
      'graph destruction never takes ownership away from the ordinary GPU table'
    );
  } finally {
    compiled.destroy();
    destroyOwnedVectors(ownedVectors);
    datasetTable.destroy();
    queryTable.destroy();
  }
  t.end();
});

test('GPUSimilaritySearch searches 384-, 768-, and 1536-dimensional fixed-size GPU table rows', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU(t);

  for (const dimensions of [384, 768, 1536]) {
    const identifier = `high-dimensional-table-${dimensions}`;
    const format: FixedSizeList<'float32'> = `fixed-size-list<float32,${dimensions}>`;
    const physicalRowStride = dimensions + 1;
    const datasetValues = new Float32Array(1 + physicalRowStride + dimensions);
    datasetValues[0] = 777;
    datasetValues[1] = 1;
    datasetValues[1 + physicalRowStride + dimensions - 1] = 1;
    const queryValues = new Float32Array(dimensions);
    queryValues[dimensions - 1] = 1;
    const datasetData = new GPUData<FixedSizeList<'float32'>>({
      buffer: device.createBuffer({
        id: `${identifier}-dataset-values`,
        data: datasetValues,
        usage: Buffer.STORAGE | Buffer.COPY_DST
      }),
      format,
      length: 2,
      byteOffset: Float32Array.BYTES_PER_ELEMENT,
      byteStride: physicalRowStride * Float32Array.BYTES_PER_ELEMENT,
      ownsBuffer: true
    });
    const sourceIds = new GPUData<'uint32'>({
      buffer: device.createBuffer({
        id: `${identifier}-source-ids`,
        data: Uint32Array.from([80, 7]),
        usage: Buffer.STORAGE | Buffer.COPY_DST
      }),
      format: 'uint32',
      length: 2,
      ownsBuffer: true
    });
    const queryData = new GPUData<FixedSizeList<'float32'>>({
      buffer: device.createBuffer({
        id: `${identifier}-query-values`,
        data: queryValues,
        usage: Buffer.STORAGE | Buffer.COPY_DST
      }),
      format,
      length: 1,
      ownsBuffer: true
    });
    const datasetTable = new GPUTable({
      batches: [
        new GPURecordBatch({
          gpuData: {embedding: datasetData, sourceIds},
          sourceInfo: {sourceBatchIndex: 0, sourceRowIndexOffset: 5, sourceRowCount: 2}
        })
      ]
    });
    const queryTable = new GPUTable({
      batches: [new GPURecordBatch({gpuData: {embedding: queryData}})]
    });
    const graph = new GPUCommandGraph(device, {id: identifier});
    const ownedVectors: GPUVector[] = [];
    const dataset = importGPUEmbeddingTable(graph, datasetTable, {
      id: `${identifier}-dataset`,
      column: 'embedding',
      sourceRowIds: 'sourceIds'
    });
    const queries = importGPUEmbeddingTable(graph, queryTable, {
      id: `${identifier}-query`,
      column: 'embedding'
    });
    const outputIds = createUint32View(graph, ownedVectors, `${identifier}-result-ids`, 2);
    const outputScores = createFloat32View(graph, ownedVectors, `${identifier}-result-scores`, 2);
    const resultCounts = createUint32View(graph, ownedVectors, `${identifier}-result-counts`, 1);
    new GPUSimilaritySearch({
      id: `${identifier}-search`,
      dataset,
      queries,
      outputIds,
      outputScores,
      resultCounts,
      k: 2,
      tileSize: 1
    }).addToGraph(graph);
    const compiled = graph.compile();

    try {
      const encoder = device.createCommandEncoder({id: `${identifier}-encoder`});
      compiled.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      t.equal(dataset.dimensions, dimensions, `${dimensions} features derive from table schema`);
      t.equal(dataset.chunks[0].rowStride, dimensions + 1, 'physical row padding is retained');
      t.equal(dataset.chunks[0].byteOffset, 4, 'table chunk offsets survive graph import');
      t.equal(
        dataset.chunks[0].values.length,
        2 * dimensions + 1,
        'the final padded row needs only its meaningful payload'
      );
      t.equal(dataset.chunks[0].sourceRowOffset, 5, 'record-batch source provenance survives');
      t.deepEqual(
        await readUint32View(ownedVectors, outputIds, 2),
        [7, 80],
        `${dimensions}-dimensional rows search their original table-owned buffers`
      );
      t.deepEqual(await readFloat32View(ownedVectors, outputScores, 2), [0, 2]);
      t.deepEqual(await readUint32View(ownedVectors, resultCounts, 1), [2]);
    } finally {
      compiled.destroy();
      destroyOwnedVectors(ownedVectors);
      datasetTable.destroy();
      queryTable.destroy();
    }
  }
  t.end();
});

test('importGPUEmbeddingTable rejects sliced nullable Arrow source IDs across preserved batches', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU(t);

  const embeddingType = new arrow.FixedSizeList(
    2,
    new arrow.Field('feature', new arrow.Float32(), false)
  );
  const slicedSourceIds = arrow.vectorFromArray([900, 11, null], new arrow.Uint32()).slice(1, 3);
  const firstBatch = new arrow.Table({
    embedding: arrow.vectorFromArray(
      [
        [0, 0],
        [1, 0]
      ],
      embeddingType
    ),
    sourceIds: slicedSourceIds
  }).batches[0];
  const secondBatch = new arrow.Table({
    embedding: arrow.vectorFromArray([[2, 0]], embeddingType),
    sourceIds: arrow.vectorFromArray([22], new arrow.Uint32())
  }).batches[0];
  const table = makeGPUTableFromArrowTable(device, new arrow.Table([firstBatch, secondBatch]), {
    shaderLayout: {
      attributes: [],
      bindings: [
        {name: 'embedding', type: 'read-only-storage', group: 0, location: 0},
        {name: 'sourceIds', type: 'read-only-storage', group: 0, location: 1}
      ]
    },
    fixedSizeListColumns: ['embedding']
  });
  const graph = new GPUCommandGraph(device, {id: 'nullable-arrow-source-row-ids'});

  try {
    t.equal(table.batches.length, 2, 'the Arrow upload retains both source record batches');
    t.ok(
      table.batches[0].gpuData.sourceIds.nullBitmap,
      'nullable numeric IDs retain generic validity'
    );
    t.throws(
      () =>
        importGPUEmbeddingTable(graph, table, {
          column: 'embedding',
          sourceRowIds: 'sourceIds'
        }),
      /source-row IDs must not contain null/,
      'sliced null IDs never silently collide with a real stable ID of zero'
    );
  } finally {
    table.destroy();
  }
  t.end();
});

test('GPUSimilaritySearch matches independent CPU exact search for every metric', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU(t);

  const sharedFixture = {
    dimensions: 5,
    dataset: [
      {
        rows: [
          [1, 2, 3, 0, 0],
          [-1, 0, 2, 1, 0],
          [1, 2, 3, 0, 0]
        ],
        sourceRowIds: [30, 7, 4]
      },
      {
        rows: [
          [0, 0, 0, 0, 0],
          [2, -1, 0.5, 4, 1]
        ],
        sourceRowIds: [20, 13]
      }
    ],
    queries: [
      {
        rows: [
          [1, 2, 3, 0, 0],
          [-2, 1, 0, 0, 2],
          [0, 0, 0, 0, 0]
        ]
      }
    ],
    k: 4,
    candidateCounts: true
  } satisfies SimilaritySearchFixture;

  for (const metric of ['squared-euclidean', 'inner-product', 'cosine'] as const) {
    const fixture = {...sharedFixture, metric};
    const result = await runGPUSimilaritySearch(device, fixture);
    assertMatchesIndependentCPU(t, fixture, result, `${metric} batched exact search`);
  }

  t.end();
});

test('GPUSimilaritySearch preserves chunk boundaries, offsets, padding, validity, and global ties', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU(t);

  const fixture: SimilaritySearchFixture = {
    dimensions: 3,
    dataset: [
      {
        rows: [
          [2, 0, 0],
          [1, 0, 0]
        ],
        prefix: [111, 222],
        rowStride: 5,
        sourceRowIds: [19, 80]
      },
      {rows: [], rowStride: 3},
      {
        rows: [
          [1, 0, 0],
          [99, 99, 99],
          [0, 1, 0]
        ],
        rowStride: 4,
        prefix: [333],
        sourceRowIds: [4, 2, 11],
        validity: [1, 0, 1]
      }
    ],
    queries: [
      {rows: [[1, 0, 0]], rowStride: 4, prefix: [777]},
      {rows: [], rowStride: 3},
      {rows: [[0, 1, 0]], rowStride: 5, prefix: [888, 999]}
    ],
    k: 4,
    tileSize: 1,
    candidateCounts: true
  };
  const result = await runGPUSimilaritySearch(device, fixture);

  assertMatchesIndependentCPU(t, fixture, result, 'chunk-preserving globally merged top-K');
  t.deepEqual(result.sourceRowIds.slice(0, 2), [4, 80], 'cross-shard score ties sort by source ID');
  t.ok(
    result.nodeOrder.filter(identifier => identifier.includes('prepare-dataset-tile')).length === 5,
    'bounded tiles preserve every nonempty source row without materializing a distance matrix'
  );
  t.ok(result.importedBuffersSurviveDestruction, 'graph destruction preserves caller-owned chunks');
  t.end();
});

test('GPUSimilaritySearch defines zero-vector cosine and rejects invalid, NaN, and Infinity rows', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU(t);

  const fixture: SimilaritySearchFixture = {
    dimensions: 3,
    dataset: [
      {
        rows: [
          [0, 0, 0],
          [1, 0, 0],
          [Number.NaN, 1, 0],
          [Number.POSITIVE_INFINITY, 0, 1],
          [0, -2, 0]
        ],
        sourceRowIds: [10, 4, 3, 2, 7],
        validity: [1, 1, 1, 1, 1]
      }
    ],
    queries: [
      {
        rows: [
          [0, 0, 0],
          [1, 0, 0],
          [Number.NaN, 0, 0],
          [0, Number.NEGATIVE_INFINITY, 0],
          [0, 1, 0]
        ],
        validity: [1, 1, 1, 1, 0]
      }
    ],
    metric: 'cosine',
    k: 4,
    candidateCounts: true
  };
  const result = await runGPUSimilaritySearch(device, fixture);

  assertMatchesIndependentCPU(t, fixture, result, 'nonfinite-aware cosine semantics');
  t.equal(result.sourceRowIds[0], 10, 'two zero vectors are the best cosine match');
  t.equal(result.scores[0], 1, 'two zero vectors have unit cosine similarity');
  t.deepEqual(result.resultCounts, [3, 3, 0, 0, 0], 'invalid query rows produce no matches');
  t.deepEqual(result.candidateCounts, [3, 3, 0, 0, 0], 'invalid query rows report no candidates');
  t.end();
});

test('GPUSimilaritySearch retains infinite scores produced by finite Float32 embeddings', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU(t);

  const magnitude = Math.fround(3e38);
  const innerProduct = await runGPUSimilaritySearch(device, {
    dimensions: 1,
    dataset: [{rows: [[magnitude], [1], [-magnitude]], sourceRowIds: [9, 5, 2]}],
    queries: [{rows: [[magnitude]]}],
    metric: 'inner-product',
    k: 3,
    candidateCounts: true
  });

  t.deepEqual(
    innerProduct.sourceRowIds,
    [9, 5, 2],
    'positive and negative overflow remain ordered around finite inner products'
  );
  t.equal(innerProduct.scores[0], Number.POSITIVE_INFINITY, 'positive overflow remains a result');
  t.equal(innerProduct.scores[2], Number.NEGATIVE_INFINITY, 'negative overflow remains a result');
  t.deepEqual(innerProduct.resultCounts, [3], 'all finite embedding rows fill the top-K outputs');
  t.deepEqual(innerProduct.candidateCounts, [3], 'candidate and result populations stay aligned');

  const squaredDistance = await runGPUSimilaritySearch(device, {
    dimensions: 1,
    dataset: [{rows: [[magnitude], [0], [-magnitude]], sourceRowIds: [9, 5, 2]}],
    queries: [{rows: [[magnitude]]}],
    metric: 'squared-euclidean',
    k: 3,
    candidateCounts: true
  });

  t.deepEqual(
    squaredDistance.sourceRowIds,
    [9, 2, 5],
    'overflowed squared distances remain deterministic under stable source-ID ties'
  );
  t.deepEqual(
    squaredDistance.scores,
    [0, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
    'valid finite rows keep their overflowed Float32 distance values'
  );
  t.deepEqual(squaredDistance.resultCounts, [3], 'infinite distances still fill oversized top-K');

  const indeterminateInnerProduct = await runGPUSimilaritySearch(device, {
    dimensions: 2,
    dataset: [
      {
        rows: [
          [magnitude, magnitude],
          [magnitude, 0]
        ],
        sourceRowIds: [4, 7]
      }
    ],
    queries: [{rows: [[magnitude, -magnitude]]}],
    metric: 'inner-product',
    k: 2,
    candidateCounts: true
  });

  t.deepEqual(
    indeterminateInnerProduct.sourceRowIds,
    [7, INVALID_SOURCE_ROW_ID],
    'indeterminate infinity-minus-infinity scores remain excluded'
  );
  t.deepEqual(indeterminateInnerProduct.resultCounts, [1], 'only non-NaN scores become results');
  t.deepEqual(
    indeterminateInnerProduct.candidateCounts,
    [2],
    'candidate counts still describe finite eligible source rows'
  );
  t.end();
});

test('GPUSimilaritySearch preserves finite-magnitude cosine ordering without intermediate overflow', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU(t);

  for (const magnitude of [1e10, 1e20, 3e38, 1e-20]) {
    const fixture: SimilaritySearchFixture = {
      dimensions: 2,
      dataset: [
        {
          rows: [
            [magnitude, 0],
            [0, magnitude],
            [-magnitude, 0]
          ],
          sourceRowIds: [9, 2, 4]
        }
      ],
      queries: [{rows: [[magnitude, 0]]}],
      metric: 'cosine',
      k: 3,
      candidateCounts: true
    };
    const result = await runGPUSimilaritySearch(device, fixture);

    assertMatchesIndependentCPU(t, fixture, result, `finite ${magnitude}-magnitude cosine search`);
    t.deepEqual(
      result.sourceRowIds,
      [9, 2, 4],
      `${magnitude}-magnitude aligned, orthogonal, and opposite vectors remain ordered`
    );
    for (const [scoreIndex, expectedScore] of [1, 0, -1].entries()) {
      t.ok(
        Math.abs(result.scores[scoreIndex] - expectedScore) < 0.000001,
        `${magnitude}-magnitude cosine ${scoreIndex} stays within Float32 rounding tolerance`
      );
    }
  }
  t.end();
});

test('GPUSimilaritySearch applies packed source-aligned GPU masks at sparse source offsets', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU(t);

  const baseFixture = {
    dimensions: 2,
    dataset: [
      {
        rows: [
          [0, 0],
          [1, 0],
          [2, 0],
          [3, 0]
        ],
        sourceRowOffset: 5,
        sourceRowIds: [90, 40, 70, 20]
      }
    ],
    queries: [{rows: [[0.5, 0]]}],
    k: 5,
    candidateCounts: true
  } satisfies SimilaritySearchFixture;

  for (const filterMask of [
    [0, 0, 0, 0, 0, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 0, 1],
    [0, 0, 0, 0, 0, 1, 1, 1, 0]
  ]) {
    const fixture = {...baseFixture, filterMask};
    const result = await runGPUSimilaritySearch(device, fixture);
    assertMatchesIndependentCPU(
      t,
      fixture,
      result,
      `packed filter ${filterMask.slice(5).join('')}`
    );
  }

  t.end();
});

test('GPUSimilaritySearch accepts LuxFilter-compatible chunk-preserving selection masks', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU(t);

  const fixture: SimilaritySearchFixture = {
    dimensions: 2,
    dataset: [
      {
        rows: [
          [0, 0],
          [1, 0]
        ],
        sourceRowIds: [80, 7]
      },
      {rows: [], sourceRowIds: []},
      {
        rows: [
          [2, 0],
          [3, 0],
          [4, 0]
        ],
        sourceRowIds: [2, 50, 11]
      }
    ],
    queries: [
      {
        rows: [
          [2.1, 0],
          [0, 0]
        ]
      }
    ],
    chunkedFilterMask: [[0, 1], [], [1, 0, 1]],
    k: 4,
    tileSize: 2,
    candidateCounts: true
  };
  const result = await runGPUSimilaritySearch(device, fixture);

  assertMatchesIndependentCPU(t, fixture, result, 'LuxFilter-compatible chunked GPU masks');
  t.deepEqual(result.candidateCounts, [3, 3], 'sparse chunk masks expose exact eligible counts');
  t.end();
});

test('GPUSimilaritySearch combines query-specific GPU masks and stable candidate-ID allowlists', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU(t);

  const fixture: SimilaritySearchFixture = {
    dimensions: 2,
    dataset: [
      {
        rows: [
          [0, 0],
          [1, 0]
        ],
        sourceRowOffset: 2,
        sourceRowIds: [90, 20]
      },
      {
        rows: [
          [2, 0],
          [3, 0]
        ],
        sourceRowOffset: 4,
        sourceRowIds: [70, 10]
      }
    ],
    queries: [
      {
        rows: [
          [0, 0],
          [3, 0]
        ]
      }
    ],
    queryFilterMask: [0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1],
    candidateIds: [90, 70, 10],
    k: 4,
    tileSize: 1,
    candidateCounts: true
  };
  const result = await runGPUSimilaritySearch(device, fixture);

  assertMatchesIndependentCPU(t, fixture, result, 'per-query masks with stable-ID allowlists');
  t.deepEqual(
    result.candidateCounts,
    [2, 2],
    'candidate counts include every combined restriction'
  );
  t.end();
});

test('GPUSimilaritySearch indexes substantial stable candidate-ID allowlists on the GPU', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU(t);

  const rows = Array.from({length: 64}, (_, rowIndex) => [rowIndex, rowIndex % 5]);
  const sourceRowIds = rows.map((_, rowIndex) => 4000 + rowIndex * 17);
  const selectedIds = sourceRowIds.filter((_, rowIndex) => rowIndex % 3 === 0);
  const fixture: SimilaritySearchFixture = {
    dimensions: 2,
    dataset: [{rows, sourceRowIds}],
    queries: [
      {
        rows: [
          [20.25, 1],
          [61, 0]
        ]
      }
    ],
    candidateIds: [...selectedIds, selectedIds[2], selectedIds[6]],
    k: 6,
    tileSize: 7,
    candidateCounts: true
  };
  const result = await runGPUSimilaritySearch(device, fixture);

  assertMatchesIndependentCPU(t, fixture, result, 'hashed stable candidate-ID membership');
  t.ok(
    result.nodeOrder.some(nodeId => nodeId.includes('-candidate-index-build')),
    'substantial allowlists build bounded GPU membership instead of repeated linear scans'
  );
  t.deepEqual(
    result.candidateCounts,
    [selectedIds.length, selectedIds.length],
    'duplicate requested IDs do not duplicate eligible dataset rows'
  );
  t.end();
});

test('GPUSimilaritySearch excludes query source IDs without conflating row position and identity', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU(t);

  const fixture: SimilaritySearchFixture = {
    dimensions: 2,
    dataset: [
      {
        rows: [
          [0, 0],
          [1, 0]
        ],
        sourceRowIds: [40, 8]
      },
      {
        rows: [
          [2, 0],
          [3, 0]
        ],
        sourceRowIds: [20, 2]
      }
    ],
    queries: [
      {
        rows: [
          [1, 0],
          [3, 0]
        ],
        sourceRowIds: [8, 2]
      }
    ],
    k: 4,
    excludeSelf: true,
    candidateCounts: true,
    tileSize: 1
  };
  const result = await runGPUSimilaritySearch(device, fixture);

  assertMatchesIndependentCPU(t, fixture, result, 'explicit stable-ID self exclusion');
  t.deepEqual(result.candidateCounts, [3, 3], 'self-exclusion reduces eligible candidate counts');
  t.notOk(
    result.sourceRowIds.slice(0, 4).includes(8),
    'the first query excludes its own source ID'
  );
  t.notOk(
    result.sourceRowIds.slice(4, 8).includes(2),
    'the second query excludes its own source ID'
  );
  t.end();
});

test('GPUSimilaritySearch handles zero K, oversized K, empty datasets, and zero query rows', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU(t);

  const edgeFixtures: SimilaritySearchFixture[] = [
    {
      dimensions: 2,
      dataset: [
        {
          rows: [
            [1, 0],
            [2, 0]
          ]
        }
      ],
      queries: [
        {
          rows: [
            [0, 0],
            [3, 0]
          ]
        }
      ],
      k: 0,
      candidateCounts: true
    },
    {
      dimensions: 2,
      dataset: [
        {
          rows: [
            [1, 0],
            [2, 0]
          ]
        }
      ],
      queries: [{rows: [[0, 0]]}],
      k: 5,
      candidateCounts: true
    },
    {
      dimensions: 2,
      dataset: [{rows: []}, {rows: []}],
      queries: [
        {
          rows: [
            [0, 0],
            [1, 1]
          ]
        }
      ],
      k: 3,
      candidateCounts: true
    },
    {
      dimensions: 2,
      dataset: [{rows: [[1, 0]]}],
      queries: [{rows: []}],
      k: 3,
      candidateCounts: true
    }
  ];

  for (const [fixtureIndex, fixture] of edgeFixtures.entries()) {
    const result = await runGPUSimilaritySearch(device, fixture);
    assertMatchesIndependentCPU(t, fixture, result, `empty-result edge case ${fixtureIndex}`);
  }

  t.end();
});

test('GPUSimilaritySearch globally merges bounded shards with exact stable ordering', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU(t);

  const rows = Array.from({length: 41}, (_, rowIndex) => [
    ((rowIndex * 17) % 23) - 11,
    ((rowIndex * 13) % 19) - 9,
    rowIndex % 3
  ]);
  const sourceRowIds = Array.from({length: rows.length}, (_, rowIndex) => rows.length - rowIndex);
  const fixture: SimilaritySearchFixture = {
    dimensions: 3,
    dataset: [
      {rows: rows.slice(0, 8), sourceRowIds: sourceRowIds.slice(0, 8)},
      {rows: []},
      {rows: rows.slice(8, 27), rowStride: 5, sourceRowIds: sourceRowIds.slice(8, 27)},
      {rows: rows.slice(27), sourceRowIds: sourceRowIds.slice(27)}
    ],
    queries: [
      {
        rows: [
          [0, 0, 0],
          [4, -2, 1]
        ]
      },
      {
        rows: [
          [-7, 3, 2],
          [11, 8, 0]
        ]
      }
    ],
    k: 7,
    tileSize: 3,
    candidateCounts: true
  };
  const result = await runGPUSimilaritySearch(device, fixture);

  assertMatchesIndependentCPU(t, fixture, result, 'globally merged bounded shard selection');
  t.ok(
    result.nodeOrder.filter(identifier => identifier.includes('prepare-dataset-tile')).length >= 14,
    'small tile limits produce independent bounded candidate passes'
  );
  t.equal(result.candidateCounts?.[0], 41, 'global candidate counts include every source chunk');
  t.end();
});

test('GPUSimilaritySearch shards physical bindings while preserving padded rows and exact results', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU(t);

  const fixture: SimilaritySearchFixture = {
    dimensions: 3,
    dataset: [
      {
        rows: Array.from({length: 57}, (_, rowIndex) => [
          rowIndex % 13,
          (rowIndex * 3) % 17,
          rowIndex % 5
        ]),
        prefix: new Array(63).fill(-99),
        rowStride: 5
      }
    ],
    queries: [
      {
        rows: [
          [1, 2, 3],
          [8, 4, 1],
          [0, 0, 0]
        ]
      }
    ],
    k: 5,
    candidateCounts: true
  };

  const result = await withReducedDeviceLimits(device, {maxStorageBufferBindingSize: 512}, () =>
    runGPUSimilaritySearch(device, fixture)
  );
  assertMatchesIndependentCPU(t, fixture, result, 'storage-binding-aware physical sharding');
  t.ok(
    result.nodeOrder.filter(identifier => identifier.includes('prepare-dataset-tile')).length > 1,
    'artificially small storage bindings force exact multi-pass sharding'
  );
  t.end();
});

test('GPUSimilaritySearch uses bounded multidimensional dispatch for query batches', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU(t);

  const fixture: SimilaritySearchFixture = {
    dimensions: 2,
    dataset: [
      {
        rows: [
          [0, 0],
          [1, 0],
          [2, 0],
          [3, 0]
        ]
      }
    ],
    queries: [
      {
        rows: Array.from({length: 257}, (_, rowIndex) => [rowIndex % 4, 0])
      }
    ],
    k: 2,
    candidateCounts: true
  };
  const result = await withReducedDeviceLimits(device, {maxComputeWorkgroupsPerDimension: 2}, () =>
    runGPUSimilaritySearch(device, fixture)
  );

  assertMatchesIndependentCPU(t, fixture, result, 'bounded multidimensional query dispatch');
  t.equal(result.resultCounts.length, 257, 'every query survives the artificial dispatch limit');
  t.end();
});

test('GPUSimilaritySearch reuses compiled graphs for dynamic GPU selections and buffer overrides', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU(t);

  const identifier = `similarity-repeat-${fixtureSequence++}`;
  const graph = new GPUCommandGraph(device, {id: identifier});
  const ownedVectors: GPUVector[] = [];
  const dataset = createEmbeddingVector(
    device,
    `${identifier}-dataset`,
    2,
    [
      {
        rows: [
          [0, 0],
          [2, 0]
        ],
        sourceRowIds: [50, 3]
      }
    ],
    ownedVectors
  );
  const queries = createEmbeddingVector(
    device,
    `${identifier}-queries`,
    2,
    [{rows: [[0, 0]], sourceRowIds: [90]}],
    ownedVectors
  );
  const importedDataset = importEmbeddingFixture(graph, dataset, `${identifier}-dataset`);
  const importedQueries = importEmbeddingFixture(graph, queries, `${identifier}-queries`);
  const outputIds = createUint32View(graph, ownedVectors, `${identifier}-output-ids`, 2);
  const outputScores = createFloat32View(graph, ownedVectors, `${identifier}-output-scores`, 2);
  const resultCounts = createUint32View(graph, ownedVectors, `${identifier}-result-counts`, 1);
  const candidateCounts = createUint32View(
    graph,
    ownedVectors,
    `${identifier}-candidate-counts`,
    1
  );
  const filterMask = createUint32View(
    graph,
    ownedVectors,
    `${identifier}-filter-mask`,
    2,
    new Uint32Array([1, 0])
  );
  const search = new GPUSimilaritySearch({
    id: identifier,
    dataset: importedDataset,
    queries: importedQueries,
    outputIds,
    outputScores,
    resultCounts,
    candidateCounts,
    filterMask,
    k: 2
  });
  search.addToGraph(graph);
  const compiled = graph.compile();
  const replacementQuery = device.createBuffer({
    id: `${identifier}-replacement-query`,
    data: new Float32Array([2, 0]),
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });

  try {
    const firstEncoder = device.createCommandEncoder({id: `${identifier}-first-encoder`});
    compiled.encode(firstEncoder, {parameters: undefined});
    device.submit(firstEncoder.finish());
    t.deepEqual(
      await readUint32View(ownedVectors, outputIds, 2),
      [50, INVALID_SOURCE_ROW_ID],
      'the first graph encoding consumes the current source selection'
    );
    t.deepEqual(await readUint32View(ownedVectors, candidateCounts, 1), [1]);

    const selectionVector = ownedVectors.find(vector => vector.name === filterMask.buffer.id);
    selectionVector!.data[0].buffer.write(new Uint32Array([0, 1]));
    const secondEncoder = device.createCommandEncoder({id: `${identifier}-second-encoder`});
    compiled.encode(secondEncoder, {parameters: undefined});
    device.submit(secondEncoder.finish());
    t.deepEqual(
      await readUint32View(ownedVectors, outputIds, 2),
      [3, INVALID_SOURCE_ROW_ID],
      'dynamic GPU selection changes are observed without graph recompilation'
    );
    t.deepEqual(
      await readUint32View(ownedVectors, candidateCounts, 1),
      [1],
      'repeated graph encodings reset candidate counts instead of accumulating stale results'
    );

    selectionVector!.data[0].buffer.write(new Uint32Array([1, 1]));
    const thirdEncoder = device.createCommandEncoder({id: `${identifier}-third-encoder`});
    compiled.encode(thirdEncoder, {
      parameters: undefined,
      buffers: {[`${identifier}-queries-chunk-0-values`]: replacementQuery}
    });
    device.submit(thirdEncoder.finish());
    t.deepEqual(
      await readUint32View(ownedVectors, outputIds, 2),
      [3, 50],
      'encoded buffer overrides replace query values without recompilation'
    );
    t.deepEqual(await readUint32View(ownedVectors, resultCounts, 1), [2]);
    t.deepEqual(await readUint32View(ownedVectors, candidateCounts, 1), [2]);

    compiled.destroy();
    t.ok(
      ownedVectors.every(vector => vector.data.every(chunk => !chunk.buffer.destroyed)),
      'compiled graph destruction never claims original caller-owned buffers'
    );
    t.notOk(replacementQuery.destroyed, 'compiled graph destruction never claims override buffers');
  } finally {
    compiled.destroy();
    replacementQuery.destroy();
    destroyOwnedVectors(ownedVectors);
  }

  t.end();
});

function finishWithoutWebGPU(testContext: Test): void {
  testContext.comment('WebGPU is not available');
  testContext.end();
}

function getCPUFixtureRows(
  chunks: readonly EmbeddingChunkFixture[],
  dimensions: number
): CPUSourceEmbeddingRow[] {
  const rows: CPUSourceEmbeddingRow[] = [];
  let nextSourceRowOffset = 0;
  for (const [chunkIndex, chunk] of chunks.entries()) {
    const sourceRowOffset = chunk.sourceRowOffset ?? nextSourceRowOffset;
    for (const [chunkRowIndex, row] of chunk.rows.entries()) {
      rows.push({
        values: Array.from(Float32Array.from(row.slice(0, dimensions))),
        sourceRowId: chunk.sourceRowIds?.[chunkRowIndex] ?? sourceRowOffset + chunkRowIndex,
        sourceRowPosition: sourceRowOffset + chunkRowIndex,
        valid: chunk.validity?.[chunkRowIndex] !== 0,
        chunkIndex,
        chunkRowIndex
      });
    }
    nextSourceRowOffset = sourceRowOffset + chunk.rows.length;
  }
  return rows;
}

function getIndependentCPUSimilarityResults(
  fixture: SimilaritySearchFixture,
  dataset: readonly CPUSourceEmbeddingRow[],
  queries: readonly CPUSourceEmbeddingRow[]
): CPUSimilarityResult {
  const metric = fixture.metric ?? 'squared-euclidean';
  const sourceSpan = dataset.reduce(
    (maximum, candidate) => Math.max(maximum, candidate.sourceRowPosition + 1),
    0
  );
  const sourceRowIds: number[] = [];
  const scores: number[] = [];
  const resultCounts: number[] = [];
  const candidateCounts: number[] = [];
  const candidateIdSet = fixture.candidateIds ? new Set(fixture.candidateIds) : undefined;

  for (const [queryIndex, query] of queries.entries()) {
    const matches: {sourceRowId: number; score: number}[] = [];
    let eligibleCount = 0;
    const queryIsValid =
      query.valid &&
      query.sourceRowId !== INVALID_SOURCE_ROW_ID &&
      query.values.every(value => Number.isFinite(value));

    if (queryIsValid) {
      for (const candidate of dataset) {
        const sourceMaskSelected = fixture.filterMask
          ? fixture.filterMask[candidate.sourceRowPosition] !== 0
          : true;
        const chunkMaskSelected = fixture.chunkedFilterMask
          ? fixture.chunkedFilterMask[candidate.chunkIndex][candidate.chunkRowIndex] !== 0
          : true;
        const queryMaskSelected = fixture.queryFilterMask
          ? fixture.queryFilterMask[queryIndex * sourceSpan + candidate.sourceRowPosition] !== 0
          : true;
        const allowedCandidate = candidateIdSet ? candidateIdSet.has(candidate.sourceRowId) : true;
        if (
          !candidate.valid ||
          candidate.sourceRowId === INVALID_SOURCE_ROW_ID ||
          !candidate.values.every(value => Number.isFinite(value)) ||
          !sourceMaskSelected ||
          !chunkMaskSelected ||
          !queryMaskSelected ||
          !allowedCandidate ||
          (fixture.excludeSelf && candidate.sourceRowId === query.sourceRowId)
        ) {
          continue;
        }

        eligibleCount++;
        const score = calculateIndependentCPUScore(metric, query.values, candidate.values);
        if (Number.isFinite(score)) {
          matches.push({sourceRowId: candidate.sourceRowId, score});
        }
      }
    }

    matches.sort((first, second) => {
      const scoreOrder =
        metric === 'squared-euclidean' ? first.score - second.score : second.score - first.score;
      return scoreOrder || first.sourceRowId - second.sourceRowId;
    });
    const selected = matches.slice(0, fixture.k);
    resultCounts.push(selected.length);
    candidateCounts.push(eligibleCount);
    for (let resultIndex = 0; resultIndex < fixture.k; resultIndex++) {
      sourceRowIds.push(selected[resultIndex]?.sourceRowId ?? INVALID_SOURCE_ROW_ID);
      scores.push(
        selected[resultIndex]?.score ??
          (metric === 'squared-euclidean' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY)
      );
    }
  }

  return {sourceRowIds, scores, resultCounts, candidateCounts};
}

function calculateIndependentCPUScore(
  metric: GPUEmbeddingMetric,
  query: readonly number[],
  candidate: readonly number[]
): number {
  let dotProduct = 0;
  let queryNorm = 0;
  let candidateNorm = 0;
  let squaredDistance = 0;
  for (let dimensionIndex = 0; dimensionIndex < query.length; dimensionIndex++) {
    const queryValue = query[dimensionIndex];
    const candidateValue = candidate[dimensionIndex];
    const difference = queryValue - candidateValue;
    squaredDistance += difference * difference;
    dotProduct += queryValue * candidateValue;
    queryNorm += queryValue * queryValue;
    candidateNorm += candidateValue * candidateValue;
  }
  if (metric === 'squared-euclidean') return squaredDistance;
  if (metric === 'inner-product') return dotProduct;
  if (queryNorm === 0 && candidateNorm === 0) return 1;
  if (queryNorm === 0 || candidateNorm === 0) return 0;
  return dotProduct / Math.sqrt(queryNorm * candidateNorm);
}

function assertMatchesIndependentCPU(
  testContext: Test,
  fixture: SimilaritySearchFixture,
  result: SearchExecution,
  message: string
): void {
  const expected = getIndependentCPUSimilarityResults(
    fixture,
    getCPUFixtureRows(fixture.dataset, fixture.dimensions),
    getCPUFixtureRows(fixture.queries, fixture.dimensions)
  );
  testContext.deepEqual(result.sourceRowIds, expected.sourceRowIds, `${message}: source IDs`);
  testContext.deepEqual(result.resultCounts, expected.resultCounts, `${message}: result counts`);
  if (fixture.candidateCounts) {
    testContext.deepEqual(
      result.candidateCounts,
      expected.candidateCounts,
      `${message}: candidate counts`
    );
  }
  testContext.equal(result.scores.length, expected.scores.length, `${message}: score count`);
  for (const [scoreIndex, score] of result.scores.entries()) {
    const expectedScore = expected.scores[scoreIndex];
    const matches = Number.isFinite(expectedScore)
      ? Math.abs(score - expectedScore) <= 0.00005 * Math.max(1, Math.abs(expectedScore))
      : Object.is(score, expectedScore);
    testContext.ok(
      matches,
      `${message}: score ${scoreIndex} equals ${expectedScore} (got ${score})`
    );
  }
}

async function runGPUSimilaritySearch(
  device: Device,
  fixture: SimilaritySearchFixture
): Promise<SearchExecution> {
  const identifier = `similarity-fixture-${fixtureSequence++}`;
  const graph = new GPUCommandGraph(device, {id: identifier});
  const ownedVectors: GPUVector[] = [];
  const dataset = createEmbeddingVector(
    device,
    `${identifier}-dataset`,
    fixture.dimensions,
    fixture.dataset,
    ownedVectors
  );
  const queries = createEmbeddingVector(
    device,
    `${identifier}-queries`,
    fixture.dimensions,
    fixture.queries,
    ownedVectors
  );
  const importedDataset = importEmbeddingFixture(graph, dataset, `${identifier}-dataset`);
  const importedQueries = importEmbeddingFixture(graph, queries, `${identifier}-queries`);
  const outputLength = queries.vector.length * fixture.k;
  const outputIds = createUint32View(graph, ownedVectors, `${identifier}-output-ids`, outputLength);
  const outputScores = createFloat32View(
    graph,
    ownedVectors,
    `${identifier}-output-scores`,
    outputLength
  );
  const resultCounts = createUint32View(
    graph,
    ownedVectors,
    `${identifier}-result-counts`,
    queries.vector.length
  );
  const candidateCounts = fixture.candidateCounts
    ? createUint32View(graph, ownedVectors, `${identifier}-candidate-counts`, queries.vector.length)
    : undefined;
  const filterMask = fixture.filterMask
    ? createUint32View(
        graph,
        ownedVectors,
        `${identifier}-filter-mask`,
        fixture.filterMask.length,
        Uint32Array.from(fixture.filterMask)
      )
    : fixture.chunkedFilterMask
      ? createChunkedFilterMask(
          graph,
          ownedVectors,
          `${identifier}-filter-mask`,
          fixture.chunkedFilterMask
        )
      : undefined;
  const queryFilterMask = fixture.queryFilterMask
    ? createUint32View(
        graph,
        ownedVectors,
        `${identifier}-query-filter-mask`,
        fixture.queryFilterMask.length,
        Uint32Array.from(fixture.queryFilterMask)
      )
    : undefined;
  const candidateIds = fixture.candidateIds
    ? createUint32View(
        graph,
        ownedVectors,
        `${identifier}-candidate-ids`,
        fixture.candidateIds.length,
        Uint32Array.from(fixture.candidateIds)
      )
    : undefined;

  const search = new GPUSimilaritySearch({
    id: identifier,
    dataset: importedDataset,
    queries: importedQueries,
    outputIds,
    outputScores,
    resultCounts,
    ...(candidateCounts ? {candidateCounts} : {}),
    ...(filterMask ? {filterMask} : {}),
    ...(queryFilterMask ? {queryFilterMask} : {}),
    ...(candidateIds ? {candidateIds} : {}),
    ...(fixture.metric ? {metric: fixture.metric} : {}),
    ...(fixture.tileSize ? {tileSize: fixture.tileSize} : {}),
    excludeSelf: fixture.excludeSelf,
    k: fixture.k
  });
  search.addToGraph(graph);
  const compiled = graph.compile();
  let importedBuffersSurviveDestruction = false;

  try {
    const encoder = device.createCommandEncoder({id: `${identifier}-encoder`});
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());

    const [sourceRowIds, scores, actualResultCounts, actualCandidateCounts] = await Promise.all([
      readUint32View(ownedVectors, outputIds, outputLength),
      readFloat32View(ownedVectors, outputScores, outputLength),
      readUint32View(ownedVectors, resultCounts, queries.vector.length),
      candidateCounts
        ? readUint32View(ownedVectors, candidateCounts, queries.vector.length)
        : Promise.resolve(undefined)
    ]);
    const nodeOrder = compiled.stats.nodeOrder.slice();
    const logicalTransientCount = compiled.stats.logicalTransientBufferCount;
    const physicalTransientCount = compiled.stats.physicalTransientBufferCount;

    compiled.destroy();
    importedBuffersSurviveDestruction = ownedVectors.every(vector =>
      vector.data.every(chunk => !chunk.buffer.destroyed)
    );
    return {
      sourceRowIds,
      scores,
      resultCounts: actualResultCounts,
      ...(actualCandidateCounts ? {candidateCounts: actualCandidateCounts} : {}),
      nodeOrder,
      logicalTransientCount,
      physicalTransientCount,
      importedBuffersSurviveDestruction
    };
  } finally {
    compiled.destroy();
    destroyOwnedVectors(ownedVectors);
  }
}

function createEmbeddingVector(
  device: Device,
  identifier: string,
  dimensions: number,
  chunks: readonly EmbeddingChunkFixture[],
  ownedVectors: GPUVector[]
): GPUEmbeddingVectorFixture {
  const rows = getCPUFixtureRows(chunks, dimensions);
  const format: FixedSizeList<'float32'> = `fixed-size-list<float32,${dimensions}>`;
  const hasSourceRowIds = chunks.some(chunk => chunk.sourceRowIds !== undefined);
  const hasValidity = chunks.some(chunk => chunk.validity !== undefined);
  const valuesData: GPUData<FixedSizeList<'float32'>>[] = [];
  const sourceRowIdsData: GPUData<'uint32'>[] = [];
  const validityData: GPUData<'uint32'>[] = [];
  const sourceRowOffsets: number[] = [];
  let nextSourceRowOffset = 0;
  for (const [chunkIndex, chunk] of chunks.entries()) {
    const rowStride = chunk.rowStride ?? dimensions;
    const prefix = chunk.prefix ?? [];
    const sourceRowOffset = chunk.sourceRowOffset ?? nextSourceRowOffset;
    const flattenedValues = new Float32Array(prefix.length + chunk.rows.length * rowStride);
    flattenedValues.set(prefix, 0);
    for (const [rowIndex, row] of chunk.rows.entries()) {
      flattenedValues.set(row.slice(0, dimensions), prefix.length + rowIndex * rowStride);
      for (let paddingIndex = dimensions; paddingIndex < rowStride; paddingIndex++) {
        flattenedValues[prefix.length + rowIndex * rowStride + paddingIndex] = -12345;
      }
    }
    const storage = flattenedValues.length > 0 ? flattenedValues : new Float32Array(1);
    const byteOffset = prefix.length * Float32Array.BYTES_PER_ELEMENT;
    const valueBuffer = device.createBuffer({
      id: `${identifier}-${chunkIndex}-values`,
      data: storage,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
    });
    const valueData = new GPUData<FixedSizeList<'float32'>>({
      buffer: valueBuffer,
      format,
      length: chunk.rows.length,
      byteStride: rowStride * Float32Array.BYTES_PER_ELEMENT,
      rowByteLength: dimensions * Float32Array.BYTES_PER_ELEMENT,
      byteOffset,
      ownsBuffer: true
    });
    valuesData.push(valueData);
    sourceRowOffsets.push(sourceRowOffset);
    if (hasSourceRowIds) {
      const sourceIds =
        chunk.sourceRowIds ??
        Array.from({length: chunk.rows.length}, (_, rowIndex) => sourceRowOffset + rowIndex);
      sourceRowIdsData.push(
        createOwnedUint32Vector(
          device,
          ownedVectors,
          `${identifier}-${chunkIndex}-source-row-ids`,
          Uint32Array.from(sourceIds)
        ).data[0]
      );
    }
    if (hasValidity) {
      const validityFlags = chunk.validity ?? Array.from({length: chunk.rows.length}, () => 1);
      validityData.push(
        createOwnedUint32Vector(
          device,
          ownedVectors,
          `${identifier}-${chunkIndex}-validity`,
          Uint32Array.from(validityFlags)
        ).data[0]
      );
    }
    nextSourceRowOffset = sourceRowOffset + chunk.rows.length;
  }
  const vector = new GPUVector<FixedSizeList<'float32'>>({
    type: 'data',
    name: `${identifier}-values`,
    format,
    data: valuesData,
    ownsData: true
  });
  ownedVectors.push(vector);
  const sourceRowIds = hasSourceRowIds
    ? new GPUVector({
        type: 'data',
        name: `${identifier}-source-row-ids`,
        format: 'uint32',
        data: sourceRowIdsData
      })
    : undefined;
  const validity = hasValidity
    ? new GPUVector({
        type: 'data',
        name: `${identifier}-validity`,
        format: 'uint32',
        data: validityData
      })
    : undefined;
  return {
    vector,
    ...(sourceRowIds ? {sourceRowIds} : {}),
    ...(validity ? {validity} : {}),
    sourceRowOffsets,
    rows
  };
}

function importEmbeddingFixture(
  graph: GPUCommandGraph,
  fixture: GPUEmbeddingVectorFixture,
  identifier: string
): GraphEmbeddingMatrix {
  return importGPUEmbeddingVector(graph, fixture.vector, {
    id: identifier,
    sourceRowOffsets: fixture.sourceRowOffsets,
    ...(fixture.sourceRowIds ? {sourceRowIds: fixture.sourceRowIds} : {}),
    ...(fixture.validity ? {validity: fixture.validity} : {})
  });
}

function createOwnedUint32Vector(
  device: Device,
  ownedVectors: GPUVector[],
  identifier: string,
  values: Uint32Array
): GPUVector<'uint32'> {
  const buffer = device.createBuffer({
    id: identifier,
    data: values.length > 0 ? values : new Uint32Array(1),
    usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
  });
  const vector = new GPUVector({
    type: 'buffer',
    name: identifier,
    buffer,
    format: 'uint32',
    length: values.length,
    ownsBuffer: true
  });
  ownedVectors.push(vector);
  return vector;
}

function createUint32View(
  graph: GPUCommandGraph,
  ownedVectors: GPUVector[],
  identifier: string,
  length: number,
  values: Uint32Array = new Uint32Array(length)
): GraphDataView<'uint32'> {
  const vector = createOwnedUint32Vector(graph.device, ownedVectors, identifier, values);
  return graph.importGPUData(identifier, vector.data[0]);
}

function createFloat32View(
  graph: GPUCommandGraph,
  ownedVectors: GPUVector[],
  identifier: string,
  length: number
): GraphDataView<'float32'> {
  const buffer = graph.device.createBuffer({
    id: identifier,
    byteLength: Math.max(length, 1) * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  const vector = new GPUVector({
    type: 'buffer',
    name: identifier,
    buffer,
    format: 'float32',
    length,
    ownsBuffer: true
  });
  ownedVectors.push(vector);
  return graph.importGPUData(identifier, vector.data[0]);
}

function createChunkedFilterMask(
  graph: GPUCommandGraph,
  ownedVectors: GPUVector[],
  identifier: string,
  chunks: readonly (readonly number[])[]
): GraphVectorView<'uint32'> {
  const data = chunks.map((chunk, chunkIndex) => {
    const vector = createOwnedUint32Vector(
      graph.device,
      ownedVectors,
      `${identifier}-${chunkIndex}`,
      Uint32Array.from(chunk)
    );
    return vector.data[0];
  });
  const vector = new GPUVector({
    type: 'data',
    name: identifier,
    format: 'uint32',
    data,
    ownsData: false
  });
  ownedVectors.push(vector);
  return graph.importGPUVector(identifier, vector);
}

async function readUint32View(
  ownedVectors: readonly GPUVector[],
  view: GraphDataView<'uint32'>,
  length: number
): Promise<number[]> {
  if (length === 0) return [];
  const vector = ownedVectors.find(candidate => candidate.name === view.buffer.id);
  if (!vector) throw new Error(`Missing owned output vector ${view.buffer.id}`);
  const bytes = await vector.data[0].buffer.readAsync(
    view.byteOffset,
    length * Uint32Array.BYTES_PER_ELEMENT
  );
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}

async function readFloat32View(
  ownedVectors: readonly GPUVector[],
  view: GraphDataView<'float32'>,
  length: number
): Promise<number[]> {
  if (length === 0) return [];
  const vector = ownedVectors.find(candidate => candidate.name === view.buffer.id);
  if (!vector) throw new Error(`Missing owned output vector ${view.buffer.id}`);
  const bytes = await vector.data[0].buffer.readAsync(
    view.byteOffset,
    length * Float32Array.BYTES_PER_ELEMENT
  );
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
}

function destroyOwnedVectors(vectors: readonly GPUVector[]): void {
  for (const vector of vectors) vector.destroy();
}

async function withReducedDeviceLimits<Result>(
  device: Device,
  overrides: Partial<
    Pick<Device['limits'], 'maxStorageBufferBindingSize' | 'maxComputeWorkgroupsPerDimension'>
  >,
  callback: () => Promise<Result>
): Promise<Result> {
  const originalDescriptor = Object.getOwnPropertyDescriptor(device, 'limits');
  const originalLimits = device.limits;
  Object.defineProperty(device, 'limits', {
    configurable: true,
    enumerable: originalDescriptor?.enumerable ?? true,
    writable: true,
    value: new Proxy(originalLimits, {
      get(target, property) {
        if (property === 'maxStorageBufferBindingSize' && overrides.maxStorageBufferBindingSize) {
          return overrides.maxStorageBufferBindingSize;
        }
        if (
          property === 'maxComputeWorkgroupsPerDimension' &&
          overrides.maxComputeWorkgroupsPerDimension
        ) {
          return overrides.maxComputeWorkgroupsPerDimension;
        }
        return Reflect.get(target, property, target);
      }
    })
  });
  try {
    return await callback();
  } finally {
    if (originalDescriptor) {
      Object.defineProperty(device, 'limits', originalDescriptor);
    } else {
      Object.defineProperty(device, 'limits', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: originalLimits
      });
    }
  }
}
