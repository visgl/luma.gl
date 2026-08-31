import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ParquetEncodedPageBatch} from '@loaders.gl/parquet';
import {ParquetJSWriter} from '@loaders.gl/parquet';
import {ParquetSourceLoader} from '@loaders.gl/parquet/parquet-source-loader';
import {planGPUParquetEncodedPageBatch} from '@luma.gl/gpgpu/gpu-parse';

it('loaders.gl alpha.4 V1 and V2 pages produce mixed GPU batch plans', async () => {
  expect(ParquetJSWriter.version, 'uses the requested loaders.gl release').toBe('5.0.0-alpha.4');

  for (const useDataPageV2 of [false, true]) {
    const batch = await makeEncodedPageBatch(useDataPageV2);
    const plan = planGPUParquetEncodedPageBatch(batch);
    expect(plan.gpuPageCount, `plans every V${useDataPageV2 ? 2 : 1} page`).toBe(4);
    expect(plan.cpuFallbackPageCount, 'does not silently fall back').toBe(0);
    expect(plan.pages[0].mode, 'first page is GPU-addressable').toBe('gpu');
    if (plan.pages[0].mode === 'gpu') {
      expect(plan.pages[0].physicalValueCount, 'counts non-null physical values').toBe(2);
      expect(plan.pages[0].definitionLevels?.valueCount, 'retains definition levels').toBe(2);
      expect(plan.pages[0].values.kind, 'plans fixed PLAIN values').toBe('plain-fixed');
    }
    const allNullPage = plan.pages[3];
    expect(allNullPage.mode, 'all-null pages remain valid GPU work').toBe('gpu');
    if (allNullPage.mode === 'gpu') {
      expect(allNullPage.physicalValueCount, 'all-null page has no physical values').toBe(0);
      expect(allNullPage.values.kind).toBe('plain-byte-array');
      expect(allNullPage.values.decodedByteLength).toBe(0);
    }
    expect(Boolean(plan.uploadData.byteLength % 4 === 0), 'batch upload is word aligned').toBe(
      true
    );
  }
});

it('GPU Parquet page planner makes thresholds and fallback boundaries explicit', async () => {
  const batch = await makeEncodedPageBatch(true);
  const thresholdPlan = planGPUParquetEncodedPageBatch(batch, {minimumGPUByteLength: 1024});
  expect(thresholdPlan.gpuPageCount).toBe(0);
  expect(thresholdPlan.cpuFallbackPageCount).toBe(4);
  expect(
    Boolean(
      thresholdPlan.pages.every(page =>
        page.mode === 'cpu-fallback' ? page.reason === 'below-gpu-threshold' : false
      )
    ),
    'every small page reports the threshold decision'
  ).toBe(true);

  const malformed = {
    ...batch,
    columns: [
      {
        ...batch.columns[0],
        pages: [
          {
            ...batch.columns[0].pages[0],
            values: {byteOffset: 999, byteLength: 4}
          },
          ...batch.columns[0].pages.slice(1)
        ]
      },
      ...batch.columns.slice(1)
    ]
  } satisfies ParquetEncodedPageBatch;
  expect(
    () => planGPUParquetEncodedPageBatch(malformed),
    'rejects invalid loaders.gl section ranges before upload'
  ).toThrow(/values section extends beyond the page body/);
});

it('GPU Parquet page planner rejects mismatched compressed fixed-width output', () => {
  const data = Uint8Array.from([3, 8, 1, 2, 3]);
  const batch = {
    shape: 'parquet-encoded-pages' as const,
    rowGroup: {
      index: 0,
      rowOffset: 0,
      rowCount: 1,
      uncompressedByteLength: 3,
      uncompressedSize: 3,
      compressedByteLength: data.byteLength,
      compressedSize: data.byteLength,
      columns: [],
      sortingColumns: []
    },
    projectedColumns: ['value'],
    filterColumns: [],
    columns: [
      {
        path: ['value'],
        physicalType: 'INT32',
        maxRepetitionLevel: 0,
        maxDefinitionLevel: 0,
        compression: 'SNAPPY',
        valueCount: 1,
        pages: [
          {
            type: 'data-v2' as const,
            pageOrdinal: 0,
            encoding: 'PLAIN',
            repetitionLevelEncoding: 'RLE',
            definitionLevelEncoding: 'RLE',
            compression: 'SNAPPY',
            compressionState: 'compressed' as const,
            valueCount: 1,
            nonNullValueCount: 1,
            data,
            values: {byteOffset: 0, byteLength: data.byteLength},
            compressedByteLength: data.byteLength,
            uncompressedByteLength: 3
          }
        ]
      }
    ]
  } satisfies ParquetEncodedPageBatch;

  expect(
    () => planGPUParquetEncodedPageBatch(batch),
    'cross-checks codec output metadata against the physical value layout'
  ).toThrow(/PLAIN INT32 payload has 3 decoded bytes; expected 4/);
});

it('GPU Parquet page planner caches variable dictionaries across data pages', () => {
  const dictionaryData = Uint8Array.from([1, 0, 0, 0, 97, 2, 0, 0, 0, 98, 98]);
  const makeDictionaryPage = () => ({
    type: 'dictionary' as const,
    pageOrdinal: -1,
    encoding: 'PLAIN',
    compression: 'UNCOMPRESSED',
    compressionState: 'decompressed' as const,
    valueCount: 2,
    nonNullValueCount: 2,
    data: dictionaryData,
    values: {byteOffset: 0, byteLength: dictionaryData.byteLength},
    compressedByteLength: dictionaryData.byteLength,
    uncompressedByteLength: dictionaryData.byteLength
  });
  const makeDataPage = (pageOrdinal: number, valueCount: number, packedIndices: number) => {
    const data = Uint8Array.from([1, 3, packedIndices]);
    return {
      type: 'data-v2' as const,
      pageOrdinal,
      encoding: 'RLE_DICTIONARY',
      repetitionLevelEncoding: 'RLE',
      definitionLevelEncoding: 'RLE',
      compression: 'UNCOMPRESSED',
      compressionState: 'decompressed' as const,
      valueCount,
      nonNullValueCount: valueCount,
      data,
      repetitionLevels: {byteOffset: 0, byteLength: 0},
      definitionLevels: {byteOffset: 0, byteLength: 0},
      values: {byteOffset: 0, byteLength: data.byteLength},
      compressedByteLength: data.byteLength,
      uncompressedByteLength: data.byteLength
    };
  };
  const batch = {
    shape: 'parquet-encoded-pages' as const,
    rowGroup: {
      index: 0,
      rowOffset: 0,
      rowCount: 3,
      uncompressedByteLength: 17,
      uncompressedSize: 17,
      compressedByteLength: 17,
      compressedSize: 17,
      columns: [],
      sortingColumns: []
    },
    projectedColumns: ['label'],
    filterColumns: [],
    columns: [
      {
        path: ['label'],
        physicalType: 'BYTE_ARRAY',
        maxRepetitionLevel: 0,
        maxDefinitionLevel: 0,
        compression: 'UNCOMPRESSED',
        valueCount: 3,
        dictionary: makeDictionaryPage(),
        pages: [makeDataPage(0, 2, 2), makeDataPage(1, 1, 1)]
      }
    ]
  } satisfies ParquetEncodedPageBatch;

  const plan = planGPUParquetEncodedPageBatch(batch);
  expect(plan.gpuPageCount).toBe(2);
  expect(plan.dictionaries[0]?.kind).toBe('byte-array');
  expect(
    Boolean(
      plan.pages.every(
        page =>
          page.mode === 'gpu' &&
          page.values.kind === 'dictionary-byte-array' &&
          page.values.dictionary === plan.dictionaries[0]
      )
    ),
    'both pages share one immutable dictionary plan'
  ).toBe(true);
  if (plan.pages[0].mode === 'gpu' && plan.pages[0].values.kind === 'dictionary-byte-array') {
    expect(plan.pages[0].values.decodedByteLength, 'plans exact gathered byte size').toBe(3);
  }
  if (plan.pages[1].mode === 'gpu' && plan.pages[1].values.kind === 'dictionary-byte-array') {
    expect(plan.pages[1].values.decodedByteLength, 'plans the second page independently').toBe(2);
  }
});

async function makeEncodedPageBatch(useDataPageV2: boolean): Promise<ParquetEncodedPageBatch> {
  const bytes = await ParquetJSWriter.encode(
    {
      shape: 'object-row-table',
      data: [
        {value: 1, label: 'alpha'},
        {value: 2, label: 'beta'},
        {value: 3, label: null}
      ]
    },
    {parquet: {dictionary: false, pageSize: 2, useDataPageV2}}
  );
  const source = ParquetSourceLoader.createDataSource(new Blob([bytes]), {});
  try {
    for await (const batch of source.readPages({preserveCompression: ['SNAPPY', 'LZ4_RAW']})) {
      return batch;
    }
  } finally {
    await source.close();
  }
  throw new Error('loaders.gl returned no encoded Parquet page batch');
}
