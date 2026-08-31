import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {makeGPUTableFromArrowTable} from '@luma.gl/arrow';
import {Buffer, type Device, type ShaderLayout} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPURecordBatch, GPUTable} from '@luma.gl/experimental/gpu-tables';
import {
  getViewBinding,
  getViewElementOffset,
  GPUCommandGraph,
  GPUHashIndex,
  type GraphDataView,
  type GraphVectorView
} from '@luma.gl/gpgpu/gpu-core';
import {GPUData, GPUVector, type FixedSizeList} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice, NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';
import {
  importGPUEmbeddingTable,
  importGPUEmbeddingVector
} from '../../src/gpu-vector-search/embedding-matrix';
import {GPUSimilaritySearch} from '../../src/gpu-vector-search/gpu-similarity-search';
import type {GPUEmbeddingMetric, GraphEmbeddingMatrix} from '../../src/gpu-vector-search/types';

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

it('GPUSimilaritySearch CPU oracle independently defines metrics, zero vectors, and tie ordering', () => {
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
  expect(euclidean.sourceRowIds.slice(0, 4), 'distance ties use stable source IDs').toEqual([
    3, 9, 2, 4
  ]);
  expect(euclidean.scores.slice(0, 4), 'squared Euclidean distances are exact').toEqual([
    0, 0, 1, 4
  ]);

  const innerProduct = getIndependentCPUSimilarityResults(
    {...fixture, metric: 'inner-product'},
    dataset,
    queries
  );
  expect(innerProduct.sourceRowIds.slice(0, 4), 'inner products sort descending').toEqual([
    3, 9, 2, 4
  ]);
  expect(innerProduct.scores.slice(0, 4), 'inner-product values are independent').toEqual([
    1, 1, 0, -1
  ]);

  const cosine = getIndependentCPUSimilarityResults(
    {...fixture, metric: 'cosine'},
    dataset,
    queries
  );
  expect(cosine.sourceRowIds.slice(4, 8), 'zero-query cosine ties remain stable').toEqual([
    2, 3, 4, 9
  ]);
  expect(cosine.scores.slice(4, 8), 'two zero vectors have unit cosine similarity').toEqual([
    1, 0, 0, 0
  ]);
  expect(cosine.candidateCounts, 'candidate counts remain independent from top-K').toEqual([4, 4]);
});

it('GPUSimilaritySearch validates generic matrix shape and independent writable outputs', () => {
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

  expect(
    () => new GPUSimilaritySearch(validProps),
    'accepts distinct caller-owned buffers'
  ).not.toThrow();
  expect(
    () => new GPUSimilaritySearch({...validProps, k: -1}),
    'rejects negative result counts'
  ).toThrow(/result count/);
  expect(
    () => new GPUSimilaritySearch({...validProps, tileSize: 0}),
    'rejects nonpositive tile bounds'
  ).toThrow(/tileSize/);
  expect(
    () =>
      new GPUSimilaritySearch({
        ...validProps,
        metric: 'euclidean' as GPUEmbeddingMetric
      }),
    'rejects unsupported metrics'
  ).toThrow(/metric/);
  expect(
    () => new GPUSimilaritySearch({...validProps, resultCounts: outputIds}),
    'rejects aliased writable result buffers'
  ).toThrow(/must not overlap/);
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
  expect(
    () => importGPUEmbeddingVector(graph, malformedVector),
    'rejects physical row strides narrower than the embedding dimensions'
  ).toThrow(/aligned, bounded fixed-size float32 rows/);

  const mismatchedRows = new GPUVector({
    type: 'data',
    name: 'mismatched-embedding-rows',
    format: 'fixed-size-list<float32,2>',
    data: dataset.vector.data
  });
  Object.defineProperty(mismatchedRows, 'length', {value: 2});
  expect(
    () => importGPUEmbeddingVector(graph, mismatchedRows),
    'rejects aggregate row counts that disagree with source topology'
  ).toThrow(/source chunk rows/);
  expect(
    () =>
      importGPUEmbeddingVector(graph, dataset.vector, {
        id: 'invalid-source-offset',
        sourceRowOffset: INVALID_SOURCE_ROW_ID
      }),
    'reserves the maximum uint32 value for invalid result slots'
  ).toThrow(/aligned, bounded fixed-size float32 rows/);

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
  expect(
    () => importGPUEmbeddingVector(graph, boundedValues),
    'never exposes unrelated bytes beyond the declared GPUData slice'
  ).toThrow(/declared GPUData byte range/);

  expect(
    () => importGPUEmbeddingVector(graph, dataset.vector, {dimensions: 3}),
    'rejects meaningful dimensions beyond the physical fixed-size-list cardinality'
  ).toThrow(/fit within its fixed-size-list rows/);
  expect(
    () => importGPUEmbeddingVector(graph, dataset.vector, {dimensions: 0}),
    'rejects zero meaningful embedding dimensions'
  ).toThrow(/fit within its fixed-size-list rows/);

  destroyOwnedVectors(ownedVectors);
});

it('importGPUEmbeddingTable borrows fixed-size-list batches and row-aligned table metadata', () => {
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

  expect(
    imported.dimensions,
    'embedding dimensions come from fixed-size-list schema metadata'
  ).toBe(3);
  expect(
    imported.rowCount,
    'logical row count is independent from flattened coordinate count'
  ).toBe(3);
  expect(
    imported.chunks.map(chunk => chunk.rowCount),
    'empty and uneven record-batch boundaries are preserved without packing'
  ).toEqual([2, 0, 1]);
  expect(
    imported.chunks.map(chunk => chunk.sourceRowOffset),
    'existing record-batch source provenance becomes the implicit stable row positions'
  ).toEqual([9, 11, 27]);
  expect(imported.chunks[0].rowStride, 'padded physical row stride stays in float32 units').toBe(5);
  expect(imported.chunks[0].byteOffset, 'nonzero GPUData offsets are preserved').toBe(
    Float32Array.BYTES_PER_ELEMENT
  );
  expect(imported.chunks[0].values.length, 'the final row does not require trailing padding').toBe(
    8
  );
  expect(
    Boolean(imported.chunks.every(chunk => chunk.sourceRowIds)),
    'stable IDs remain table-owned columns'
  ).toBe(true);
  expect(
    Boolean(imported.chunks.every(chunk => chunk.validity)),
    'validity remains a table-owned column'
  ).toBe(true);
  expect(
    table.gpuVectors.embedding.length,
    'the aggregate source column remains row-oriented'
  ).toBe(3);
  expect(table.gpuVectors.embedding.valueLength, 'flattened value count remains separate').toBe(9);

  const singleBatch = importGPUEmbeddingTable(graph, batches[0], {
    column: 'embedding',
    dimensions: 2,
    sourceRowIds: 'stableId',
    validity: 'valid',
    id: 'single-batch'
  });
  expect(singleBatch.dimensions, 'callers may explicitly ignore trailing fixed-list features').toBe(
    2
  );
  expect(singleBatch.chunks[0].rowStride, 'physical row stride survives feature truncation').toBe(
    5
  );
  expect(singleBatch.chunks[0].values.length, 'only meaningful coordinates enter the view').toBe(7);

  const sourceIdData = fixture.sourceRowIds!.data[0];
  Object.defineProperty(sourceIdData, 'nullBitmap', {value: Uint8Array.from([0b11])});
  expect(
    () =>
      importGPUEmbeddingTable(graph, batches[0], {
        id: 'nullable-schema-all-valid',
        column: 'embedding',
        sourceRowIds: 'stableId'
      }),
    'nullable source-ID schemas are allowed when every actual row remains valid'
  ).not.toThrow();
  Object.defineProperty(sourceIdData, 'nullBitmap', {value: Uint8Array.from([0b01])});
  expect(
    () =>
      importGPUEmbeddingVector(graph, fixture.vector, {
        id: 'nullable-source-id-vector',
        sourceRowIds: fixture.sourceRowIds
      }),
    'vector imports reject actual null stable IDs without GPU readback'
  ).toThrow(/source-row IDs must not contain null/);
  expect(
    () =>
      importGPUEmbeddingTable(graph, table, {
        id: 'nullable-source-id-table',
        column: 'embedding',
        sourceRowIds: 'stableId'
      }),
    'table imports reject null stable IDs before treating physical zero as a real ID'
  ).toThrow(/source-row IDs must not contain null/);
  Object.defineProperty(sourceIdData, 'nullBitmap', {value: undefined});

  const embeddingData = fixture.vector.data[0];
  Object.defineProperty(embeddingData, 'nullBitmap', {value: Uint8Array.from([0b01])});
  expect(
    () => importGPUEmbeddingVector(graph, fixture.vector, {id: 'nullable-vector-without-mask'}),
    'nullable vector rows cannot silently enter search without a caller-owned GPU validity mask'
  ).toThrow(/null values require explicit GPU validity flags/);
  expect(
    () =>
      importGPUEmbeddingTable(graph, batches[0], {
        id: 'nullable-table-without-mask',
        column: 'embedding'
      }),
    'nullable table rows cannot silently enter search without a selected GPU validity column'
  ).toThrow(/null values require explicit GPU validity flags/);
  expect(
    () =>
      importGPUEmbeddingVector(graph, fixture.vector, {
        id: 'nullable-vector-with-mask',
        validity: fixture.validity
      }),
    'an explicitly selected GPU validity vector permits intentional nullable-row filtering'
  ).not.toThrow();
  expect(
    () =>
      importGPUEmbeddingTable(graph, batches[0], {
        id: 'nullable-table-with-mask',
        column: 'embedding',
        validity: 'valid'
      }),
    'an explicitly selected GPU validity column permits intentional nullable-row filtering'
  ).not.toThrow();
  Object.defineProperty(embeddingData, 'nullBitmap', {value: undefined});

  expect(
    () => importGPUEmbeddingTable(graph, table, {column: 'missing'}),
    'rejects missing embedding columns'
  ).toThrow(/does not contain column/);
  expect(
    () => importGPUEmbeddingTable(graph, table, {column: 'embedding', validity: 'missing'}),
    'rejects absent explicitly requested validity columns'
  ).toThrow(/row-aligned uint32 column/);
  expect(
    () => importGPUEmbeddingTable(graph, table, {column: 'embedding', dimensions: 4}),
    'rejects meaningful dimensions beyond the existing fixed-list cardinality'
  ).toThrow(/fit within its fixed-size-list rows/);

  const compiled = graph.compile();
  compiled.destroy();
  expect(
    Boolean(ownedVectors.every(vector => vector.data.every(chunk => !chunk.buffer.destroyed))),
    'graph destruction never destroys buffers owned by existing table columns'
  ).toBe(true);
  destroyOwnedVectors(ownedVectors);
});

it('importGPUEmbeddingTable retains schema dimensions for an empty caller-owned GPU table', () => {
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
  expect(imported.dimensions, 'schema metadata remains available without uploaded batches').toBe(
    768
  );
  expect(imported.rowCount, 'empty table imports have no logical rows').toBe(0);
  expect(imported.chunks, 'no placeholder GPU allocations are invented').toEqual([]);
});

it('GPUSimilaritySearch consumes nullable Arrow fixed-size lists through ordinary GPU tables', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU();

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
  expect(
    () =>
      importGPUEmbeddingTable(graph, datasetTable, {
        id: 'dataset-without-validity',
        column: 'embedding',
        dimensions: 3,
        sourceRowIds: 'sourceIds'
      }),
    'nullable Arrow parent rows and nullable padding cannot bypass explicit GPU validity'
  ).toThrow(/null values require explicit GPU validity flags/);
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

    expect(datasetTable.gpuVectors.embedding.format).toBe('fixed-size-list<float32,4>');
    expect(datasetTable.gpuVectors.embedding.length, 'embedding values remain table rows').toBe(4);
    expect(
      datasetTable.gpuVectors.embedding.valueLength,
      'physical coordinates remain values'
    ).toBe(16);
    expect(
      dataset.chunks.map(chunk => chunk.rowCount),
      'Arrow batches stay distinct'
    ).toEqual([2, 2]);
    expect(
      dataset.dimensions,
      'explicit dimensions ignore the nullable fourth padding feature'
    ).toBe(3);
    expect(dataset.chunks[0].rowStride, 'physical Arrow fixed-list cardinality stays intact').toBe(
      4
    );
    expect(
      await readUint32View(ownedVectors, outputIds, 3),
      'parent-null rows are removed while nullable padding and stable Arrow source IDs are honored'
    ).toEqual([42, 3, 7]);
    expect(await readFloat32View(ownedVectors, outputScores, 3)).toEqual([0, 1, 1]);
    expect(await readUint32View(ownedVectors, resultCounts, 1)).toEqual([3]);
    expect(await readUint32View(ownedVectors, candidateCounts, 1)).toEqual([3]);

    compiled.destroy();
    expect(
      Boolean(
        datasetTable.batches.every(batch =>
          Object.values(batch.gpuData).every(data => !data.buffer.destroyed)
        )
      ),
      'graph destruction never takes ownership away from the ordinary GPU table'
    ).toBe(true);
  } finally {
    compiled.destroy();
    destroyOwnedVectors(ownedVectors);
    datasetTable.destroy();
    queryTable.destroy();
  }
});

it('GPUSimilaritySearch searches 384-, 768-, and 1536-dimensional fixed-size GPU table rows', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU();

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
      expect(dataset.dimensions, `${dimensions} features derive from table schema`).toBe(
        dimensions
      );
      expect(dataset.chunks[0].rowStride, 'physical row padding is retained').toBe(dimensions + 1);
      expect(dataset.chunks[0].byteOffset, 'table chunk offsets survive graph import').toBe(4);
      expect(
        dataset.chunks[0].values.length,
        'the final padded row needs only its meaningful payload'
      ).toBe(2 * dimensions + 1);
      expect(dataset.chunks[0].sourceRowOffset, 'record-batch source provenance survives').toBe(5);
      expect(
        await readUint32View(ownedVectors, outputIds, 2),
        `${dimensions}-dimensional rows search their original table-owned buffers`
      ).toEqual([7, 80]);
      expect(await readFloat32View(ownedVectors, outputScores, 2)).toEqual([0, 2]);
      expect(await readUint32View(ownedVectors, resultCounts, 1)).toEqual([2]);
    } finally {
      compiled.destroy();
      destroyOwnedVectors(ownedVectors);
      datasetTable.destroy();
      queryTable.destroy();
    }
  }
});

it('importGPUEmbeddingTable rejects sliced nullable Arrow source IDs across preserved batches', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU();

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
    expect(table.batches.length, 'the Arrow upload retains both source record batches').toBe(2);
    expect(
      Boolean(table.batches[0].gpuData.sourceIds.nullBitmap),
      'nullable numeric IDs retain generic validity'
    ).toBe(true);
    expect(
      () =>
        importGPUEmbeddingTable(graph, table, {
          column: 'embedding',
          sourceRowIds: 'sourceIds'
        }),
      'sliced null IDs never silently collide with a real stable ID of zero'
    ).toThrow(/source-row IDs must not contain null/);
  } finally {
    table.destroy();
  }
});

it('GPUSimilaritySearch matches independent CPU exact search for every metric', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU();

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
    assertMatchesIndependentCPU(fixture, result, `${metric} batched exact search`);
  }
});

it('GPUSimilaritySearch preserves chunk boundaries, offsets, padding, validity, and global ties', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU();

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

  assertMatchesIndependentCPU(fixture, result, 'chunk-preserving globally merged top-K');
  expect(result.sourceRowIds.slice(0, 2), 'cross-shard score ties sort by source ID').toEqual([
    4, 80
  ]);
  expect(
    Boolean(
      result.nodeOrder.filter(identifier => identifier.includes('prepare-dataset-tile')).length ===
        5
    ),
    'bounded tiles preserve every nonempty source row without materializing a distance matrix'
  ).toBe(true);
  expect(
    Boolean(result.importedBuffersSurviveDestruction),
    'graph destruction preserves caller-owned chunks'
  ).toBe(true);
});

it('GPUSimilaritySearch defines zero-vector cosine and rejects invalid, NaN, and Infinity rows', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU();

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

  assertMatchesIndependentCPU(fixture, result, 'nonfinite-aware cosine semantics');
  expect(result.sourceRowIds[0], 'two zero vectors are the best cosine match').toBe(10);
  expect(result.scores[0], 'two zero vectors have unit cosine similarity').toBe(1);
  expect(result.resultCounts, 'invalid query rows produce no matches').toEqual([3, 3, 0, 0, 0]);
  expect(result.candidateCounts, 'invalid query rows report no candidates').toEqual([
    3, 3, 0, 0, 0
  ]);
});

it('GPUSimilaritySearch retains infinite scores produced by finite Float32 embeddings', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU();

  const magnitude = Math.fround(3e38);
  const innerProduct = await runGPUSimilaritySearch(device, {
    dimensions: 1,
    dataset: [{rows: [[magnitude], [1], [-magnitude]], sourceRowIds: [9, 5, 2]}],
    queries: [{rows: [[magnitude]]}],
    metric: 'inner-product',
    k: 3,
    candidateCounts: true
  });

  expect(
    innerProduct.sourceRowIds,
    'positive and negative overflow remain ordered around finite inner products'
  ).toEqual([9, 5, 2]);
  expect(innerProduct.scores[0], 'positive overflow remains a result').toBe(
    Number.POSITIVE_INFINITY
  );
  expect(innerProduct.scores[2], 'negative overflow remains a result').toBe(
    Number.NEGATIVE_INFINITY
  );
  expect(innerProduct.resultCounts, 'all finite embedding rows fill the top-K outputs').toEqual([
    3
  ]);
  expect(innerProduct.candidateCounts, 'candidate and result populations stay aligned').toEqual([
    3
  ]);

  const squaredDistance = await runGPUSimilaritySearch(device, {
    dimensions: 1,
    dataset: [{rows: [[magnitude], [0], [-magnitude]], sourceRowIds: [9, 5, 2]}],
    queries: [{rows: [[magnitude]]}],
    metric: 'squared-euclidean',
    k: 3,
    candidateCounts: true
  });

  expect(
    squaredDistance.sourceRowIds,
    'overflowed squared distances remain deterministic under stable source-ID ties'
  ).toEqual([9, 2, 5]);
  expect(
    squaredDistance.scores,
    'valid finite rows keep their overflowed Float32 distance values'
  ).toEqual([0, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY]);
  expect(squaredDistance.resultCounts, 'infinite distances still fill oversized top-K').toEqual([
    3
  ]);

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

  expect(
    indeterminateInnerProduct.sourceRowIds,
    'indeterminate infinity-minus-infinity scores remain excluded'
  ).toEqual([7, INVALID_SOURCE_ROW_ID]);
  expect(indeterminateInnerProduct.resultCounts, 'only non-NaN scores become results').toEqual([1]);
  expect(
    indeterminateInnerProduct.candidateCounts,
    'candidate counts still describe finite eligible source rows'
  ).toEqual([2]);
});

it('GPUSimilaritySearch preserves finite-magnitude cosine ordering without intermediate overflow', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU();

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

    assertMatchesIndependentCPU(fixture, result, `finite ${magnitude}-magnitude cosine search`);
    expect(
      result.sourceRowIds,
      `${magnitude}-magnitude aligned, orthogonal, and opposite vectors remain ordered`
    ).toEqual([9, 2, 4]);
    for (const [scoreIndex, expectedScore] of [1, 0, -1].entries()) {
      expect(
        Boolean(Math.abs(result.scores[scoreIndex] - expectedScore) < 0.000001),
        `${magnitude}-magnitude cosine ${scoreIndex} stays within Float32 rounding tolerance`
      ).toBe(true);
    }
  }
});

it('GPUSimilaritySearch applies packed source-aligned GPU masks at sparse source offsets', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU();

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
    assertMatchesIndependentCPU(fixture, result, `packed filter ${filterMask.slice(5).join('')}`);
  }
});

it('GPUSimilaritySearch accepts LuxFilter-compatible chunk-preserving selection masks', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU();

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

  assertMatchesIndependentCPU(fixture, result, 'LuxFilter-compatible chunked GPU masks');
  expect(result.candidateCounts, 'sparse chunk masks expose exact eligible counts').toEqual([3, 3]);
});

it('GPUSimilaritySearch combines query-specific GPU masks and stable candidate-ID allowlists', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU();

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

  assertMatchesIndependentCPU(fixture, result, 'per-query masks with stable-ID allowlists');
  expect(result.candidateCounts, 'candidate counts include every combined restriction').toEqual([
    2, 2
  ]);
});

it('GPUSimilaritySearch indexes substantial stable candidate-ID allowlists on the GPU', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU();

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

  assertMatchesIndependentCPU(fixture, result, 'hashed stable candidate-ID membership');
  expect(
    Boolean(result.nodeOrder.some(nodeId => nodeId.includes('-candidate-index-build'))),
    'substantial allowlists build bounded GPU membership instead of repeated linear scans'
  ).toBe(true);
  expect(
    result.candidateCounts,
    'duplicate requested IDs do not duplicate eligible dataset rows'
  ).toEqual([selectedIds.length, selectedIds.length]);
});

it('GPUSimilaritySearch preserves every allowlisted ID when bounded GPU hash insertion overflows', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU();

  const sourceRowIds = Array.from({length: 24}, (_, rowIndex) => 7000 + rowIndex * 13);
  const fixture: SimilaritySearchFixture = {
    dimensions: 2,
    dataset: [{rows: sourceRowIds.map((_, rowIndex) => [rowIndex, rowIndex % 3]), sourceRowIds}],
    queries: [{rows: [[12, 0]]}],
    candidateIds: sourceRowIds,
    candidateCounts: true,
    k: 6
  };
  const originalAddToGraph = GPUHashIndex.prototype.addToGraph;
  GPUHashIndex.prototype.addToGraph = function <Parameters>(graph: GPUCommandGraph<Parameters>) {
    originalAddToGraph.call(this, graph);
    const index = this;
    const identifier = `${index.id}-simulate-candidate-overflow`;
    const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read_write> tableKeys: array<u32>;
@group(0) @binding(1) var<storage, read_write> statistics: array<u32>;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) globalInvocationId: vec3u) {
  let slot = globalInvocationId.x;
  if (slot < ${index.tableKeys.length}u) {
    tableKeys[${getViewElementOffset(index.tableKeys)}u + slot] = 0xffffffffu;
  }
  if (slot == 0u) {
    statistics[${getViewElementOffset(index.statistics)}u + 2u] = 1u;
  }
}`;
    graph.addComputePass({
      id: identifier,
      resources: [
        {buffer: index.tableKeys, usage: 'storage-read-write'},
        {buffer: index.statistics, usage: 'storage-read-write'}
      ],
      compile: ({device: graphDevice}) => {
        const computation = new Computation(graphDevice, {
          id: identifier,
          source,
          shaderLayout: {
            bindings: [
              {name: 'tableKeys', type: 'storage', group: 0, location: 0},
              {name: 'statistics', type: 'storage', group: 0, location: 1}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              tableKeys: getViewBinding(index.tableKeys, getBuffer),
              statistics: getViewBinding(index.statistics, getBuffer)
            });
            computation.dispatch(computePass, Math.ceil(index.tableKeys.length / 64), 1, 1);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  };

  try {
    const result = await runGPUSimilaritySearch(device, fixture);
    assertMatchesIndependentCPU(fixture, result, 'overflowed GPU candidate index fallback');
    expect(
      Boolean(result.nodeOrder.some(nodeId => nodeId.includes('-simulate-candidate-overflow'))),
      'the real GPU build reports overflow after every hash-table key is removed'
    ).toBe(true);
    expect(result.candidateCounts, 'no allowlisted row disappears').toEqual([sourceRowIds.length]);
  } finally {
    GPUHashIndex.prototype.addToGraph = originalAddToGraph;
  }
});

it('GPUSimilaritySearch excludes query source IDs without conflating row position and identity', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU();

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

  assertMatchesIndependentCPU(fixture, result, 'explicit stable-ID self exclusion');
  expect(result.candidateCounts, 'self-exclusion reduces eligible candidate counts').toEqual([
    3, 3
  ]);
  expect(
    Boolean(result.sourceRowIds.slice(0, 4).includes(8)),
    'the first query excludes its own source ID'
  ).toBe(false);
  expect(
    Boolean(result.sourceRowIds.slice(4, 8).includes(2)),
    'the second query excludes its own source ID'
  ).toBe(false);
});

it('GPUSimilaritySearch handles zero K, oversized K, empty datasets, and zero query rows', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU();

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
    assertMatchesIndependentCPU(fixture, result, `empty-result edge case ${fixtureIndex}`);
  }
});

it('GPUSimilaritySearch globally merges bounded shards with exact stable ordering', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU();

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

  assertMatchesIndependentCPU(fixture, result, 'globally merged bounded shard selection');
  expect(
    Boolean(
      result.nodeOrder.filter(identifier => identifier.includes('prepare-dataset-tile')).length >=
        14
    ),
    'small tile limits produce independent bounded candidate passes'
  ).toBe(true);
  expect(result.candidateCounts?.[0], 'global candidate counts include every source chunk').toBe(
    41
  );
});

it('GPUSimilaritySearch shards physical bindings while preserving padded rows and exact results', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU();

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
  assertMatchesIndependentCPU(fixture, result, 'storage-binding-aware physical sharding');
  expect(
    Boolean(
      result.nodeOrder.filter(identifier => identifier.includes('prepare-dataset-tile')).length > 1
    ),
    'artificially small storage bindings force exact multi-pass sharding'
  ).toBe(true);
});

it('GPUSimilaritySearch uses bounded multidimensional dispatch for query batches', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU();

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

  assertMatchesIndependentCPU(fixture, result, 'bounded multidimensional query dispatch');
  expect(result.resultCounts.length, 'every query survives the artificial dispatch limit').toBe(
    257
  );
});

it('GPUSimilaritySearch reuses compiled graphs for dynamic GPU selections and buffer overrides', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return finishWithoutWebGPU();

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
    expect(
      await readUint32View(ownedVectors, outputIds, 2),
      'the first graph encoding consumes the current source selection'
    ).toEqual([50, INVALID_SOURCE_ROW_ID]);
    expect(await readUint32View(ownedVectors, candidateCounts, 1)).toEqual([1]);

    const selectionVector = ownedVectors.find(vector => vector.name === filterMask.buffer.id);
    selectionVector!.data[0].buffer.write(new Uint32Array([0, 1]));
    const secondEncoder = device.createCommandEncoder({id: `${identifier}-second-encoder`});
    compiled.encode(secondEncoder, {parameters: undefined});
    device.submit(secondEncoder.finish());
    expect(
      await readUint32View(ownedVectors, outputIds, 2),
      'dynamic GPU selection changes are observed without graph recompilation'
    ).toEqual([3, INVALID_SOURCE_ROW_ID]);
    expect(
      await readUint32View(ownedVectors, candidateCounts, 1),
      'repeated graph encodings reset candidate counts instead of accumulating stale results'
    ).toEqual([1]);

    selectionVector!.data[0].buffer.write(new Uint32Array([1, 1]));
    const thirdEncoder = device.createCommandEncoder({id: `${identifier}-third-encoder`});
    compiled.encode(thirdEncoder, {
      parameters: undefined,
      buffers: {[`${identifier}-queries-chunk-0-values`]: replacementQuery}
    });
    device.submit(thirdEncoder.finish());
    expect(
      await readUint32View(ownedVectors, outputIds, 2),
      'encoded buffer overrides replace query values without recompilation'
    ).toEqual([3, 50]);
    expect(await readUint32View(ownedVectors, resultCounts, 1)).toEqual([2]);
    expect(await readUint32View(ownedVectors, candidateCounts, 1)).toEqual([2]);

    compiled.destroy();
    expect(
      Boolean(ownedVectors.every(vector => vector.data.every(chunk => !chunk.buffer.destroyed))),
      'compiled graph destruction never claims original caller-owned buffers'
    ).toBe(true);
    expect(
      Boolean(replacementQuery.destroyed),
      'compiled graph destruction never claims override buffers'
    ).toBe(false);
  } finally {
    compiled.destroy();
    replacementQuery.destroy();
    destroyOwnedVectors(ownedVectors);
  }
});

function finishWithoutWebGPU(): void {
  // Vitest considers a test that returns without assertions successful when WebGPU is unavailable.
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
  fixture: SimilaritySearchFixture,
  result: SearchExecution,
  message: string
): void {
  const expected = getIndependentCPUSimilarityResults(
    fixture,
    getCPUFixtureRows(fixture.dataset, fixture.dimensions),
    getCPUFixtureRows(fixture.queries, fixture.dimensions)
  );
  expect(result.sourceRowIds, `${message}: source IDs`).toEqual(expected.sourceRowIds);
  expect(result.resultCounts, `${message}: result counts`).toEqual(expected.resultCounts);
  if (fixture.candidateCounts) {
    expect(result.candidateCounts, `${message}: candidate counts`).toEqual(
      expected.candidateCounts
    );
  }
  expect(result.scores.length, `${message}: score count`).toBe(expected.scores.length);
  for (const [scoreIndex, score] of result.scores.entries()) {
    const expectedScore = expected.scores[scoreIndex];
    const matches = Number.isFinite(expectedScore)
      ? Math.abs(score - expectedScore) <= 0.00005 * Math.max(1, Math.abs(expectedScore))
      : Object.is(score, expectedScore);
    expect(matches, `${message}: score ${scoreIndex} equals ${expectedScore} (got ${score})`).toBe(
      true
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
