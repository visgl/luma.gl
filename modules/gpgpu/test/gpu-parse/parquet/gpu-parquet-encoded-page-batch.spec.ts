import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ParquetEncodedPageBatch} from '@loaders.gl/parquet';
import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {
  addGPUParquetEncodedPageBatchToGraph,
  createGPUParquetEncodedPageBatchInputBuffer,
  planGPUParquetEncodedPageBatch,
  type GPUParquetDecodedPage
} from '@luma.gl/gpgpu/gpu-parse';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

it('loaders.gl encoded pages batch Snappy, levels, and values in one graph', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const expectedValues = new Uint8Array(new Float32Array([1, 2]).buffer);
  const byteStreamSplit = encodeByteStreamSplit(expectedValues, 2, 4);
  const snappyValues = Uint8Array.from([8, 28, ...byteStreamSplit]);
  const batch = makeBatch(Uint8Array.from([4, 1, ...snappyValues]));
  const plan = planGPUParquetEncodedPageBatch(batch);
  expect(plan.gpuPageCount).toBe(1);
  expect(plan.lzByteStreamSplitBatch?.pageIndices).toEqual([0]);
  expect(plan.lzByteStreamSplitBatch?.jobs.byteLength).toBe(8 * Uint32Array.BYTES_PER_ELEMENT);
  expect(plan.pages[0].mode).toBe('gpu');
  if (plan.pages[0].mode === 'gpu') {
    expect(plan.pages[0].compression?.codec).toBe('SNAPPY');
    expect(plan.pages[0].values.kind).toBe('byte-stream-split');
  }

  const inputBuffer = createGPUParquetEncodedPageBatchInputBuffer(device, plan);
  const graph = new GPUCommandGraph(device, {id: 'gpu-parquet-loader-batch-test'});
  const result = addGPUParquetEncodedPageBatchToGraph(graph, plan, inputBuffer);
  const page = result.pages[0] as GPUParquetDecodedPage;
  expect(page.mode).toBe('gpu');
  expect(page.values.layout).toBe('packed-bytes');

  const valueReadback = createReadbackBuffer(device, expectedValues.byteLength);
  const levelReadback = createReadbackBuffer(device, 8);
  addReadbackCopy(
    graph,
    page.values.layout === 'split-uint64' ? page.values.low : page.values.values,
    valueReadback,
    'values'
  );
  addReadbackCopy(graph, page.definitionLevels!, levelReadback, 'definition-levels');
  const compiled = graph.compile();
  expect(compiled.stats.nodeOrder).toContain('gpu-parquet-loader-batch-test-parquet-lz-byte-batch');
  expect(compiled.stats.nodeOrder).toContain(
    'gpu-parquet-loader-batch-test-parquet-byte-stream-split-batch'
  );
  expect(compiled.stats.nodeOrder).not.toContain('parquet-0-0-snappy');
  expect(compiled.stats.nodeOrder).not.toContain('parquet-0-0-byte-stream-split');

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-parquet-loader-batch-encoder'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const valueResult = await valueReadback.readAsync();
    const levelResult = await levelReadback.readAsync();
    expect(
      Array.from(new Uint8Array(valueResult.buffer, valueResult.byteOffset, expectedValues.length)),
      'decompresses and restores value-major bytes'
    ).toEqual(Array.from(expectedValues));
    expect(
      Array.from(new Uint32Array(levelResult.buffer, levelResult.byteOffset, 2)),
      'decodes V2 definition levels alongside values'
    ).toEqual([1, 1]);
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    valueReadback.destroy();
    levelReadback.destroy();
  }
});

it('compressed PLAIN page outputs remain available for graph readback', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const expectedValues = new Uint8Array(new Float32Array([1, 2]).buffer);
  const snappyValues = Uint8Array.from([8, 28, ...expectedValues]);
  const plan = planGPUParquetEncodedPageBatch(
    makeBatch(Uint8Array.from([4, 1, ...snappyValues]), 'PLAIN')
  );
  const inputBuffer = createGPUParquetEncodedPageBatchInputBuffer(device, plan);
  const graph = new GPUCommandGraph(device, {id: 'gpu-parquet-plain-readback-test'});
  const result = addGPUParquetEncodedPageBatchToGraph(graph, plan, inputBuffer);
  const page = result.pages[0] as GPUParquetDecodedPage;
  const readback = createReadbackBuffer(device, expectedValues.byteLength);
  addReadbackCopy(
    graph,
    page.values.layout === 'split-uint64' ? page.values.low : page.values.values,
    readback,
    'plain-values'
  );
  const compiled = graph.compile();

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-parquet-plain-encoder'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const resultData = await readback.readAsync();
    expect(
      Array.from(
        new Uint8Array(resultData.buffer, resultData.byteOffset, expectedValues.byteLength)
      ),
      'copies the decompressed PLAIN output directly'
    ).toEqual(Array.from(expectedValues));
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    readback.destroy();
  }
});

it('loaders.gl LZ4_RAW BYTE_STREAM_SPLIT values use the two-pass batch path', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const expectedValues = new Uint8Array(new Float32Array([3, 5]).buffer);
  const byteStreamSplit = encodeByteStreamSplit(expectedValues, 2, 4);
  const lz4Values = Uint8Array.from([0x80, ...byteStreamSplit]);
  const plan = planGPUParquetEncodedPageBatch(
    repeatOnlyPage(
      makeBatch(Uint8Array.from([4, 1, ...lz4Values]), 'BYTE_STREAM_SPLIT', 'LZ4_RAW'),
      2
    )
  );
  expect(plan.lzByteStreamSplitBatch?.pageIndices).toEqual([0, 1]);

  const inputBuffer = createGPUParquetEncodedPageBatchInputBuffer(device, plan);
  const graph = new GPUCommandGraph(device, {id: 'gpu-parquet-lz4-batch-test'});
  const result = addGPUParquetEncodedPageBatchToGraph(graph, plan, inputBuffer);
  const readbacks = result.pages.map((page, pageIndex) => {
    const decodedPage = page as GPUParquetDecodedPage;
    const readback = createReadbackBuffer(device, expectedValues.byteLength);
    addReadbackCopy(
      graph,
      decodedPage.values.layout === 'split-uint64'
        ? decodedPage.values.low
        : decodedPage.values.values,
      readback,
      `lz4-values-${pageIndex}`
    );
    return readback;
  });
  const compiled = graph.compile();
  expect(compiled.stats.nodeOrder.filter(nodeId => nodeId.endsWith('-lz-byte-batch'))).toHaveLength(
    1
  );
  expect(
    compiled.stats.nodeOrder.filter(nodeId => nodeId.endsWith('-byte-stream-split-batch'))
  ).toHaveLength(1);
  expect(compiled.stats.nodeOrder.some(nodeId => nodeId.includes('-lz4-raw'))).toBe(false);

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-parquet-lz4-batch-encoder'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const results = await Promise.all(readbacks.map(readback => readback.readAsync()));
    for (const resultData of results) {
      expect(
        Array.from(
          new Uint8Array(resultData.buffer, resultData.byteOffset, expectedValues.byteLength)
        )
      ).toEqual(Array.from(expectedValues));
    }
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    for (const readback of readbacks) readback.destroy();
  }
});

it('compressed BYTE_STREAM_SPLIT batching retains per-page decoding at storage limits', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const lz4RepeatedZeroes = Uint8Array.from([0x1f, 0, 1, 0, 255, 125]);
  const originalBatch = makeBatch(lz4RepeatedZeroes, 'BYTE_STREAM_SPLIT', 'LZ4_RAW');
  const originalColumn = originalBatch.columns[0];
  const originalPage = originalColumn.pages[0];
  const batch = repeatOnlyPage(
    {
      ...originalBatch,
      rowGroup: {...originalBatch.rowGroup, rowCount: 100, uncompressedByteLength: 400},
      columns: [
        {
          ...originalColumn,
          maxDefinitionLevel: 0,
          valueCount: 100,
          pages: [
            {
              ...originalPage,
              valueCount: 100,
              nonNullValueCount: 100,
              definitionLevels: {byteOffset: 0, byteLength: 0},
              values: {byteOffset: 0, byteLength: lz4RepeatedZeroes.byteLength},
              compressedByteLength: lz4RepeatedZeroes.byteLength,
              uncompressedByteLength: 400
            }
          ]
        }
      ]
    },
    2
  );
  const plan = planGPUParquetEncodedPageBatch(batch);
  expect(plan.lzByteStreamSplitBatch?.outputByteLength).toBe(800);
  expect(plan.uploadData.byteLength).toBeLessThanOrEqual(512);

  await withReducedStorageBindingLimit(device, 512, async () => {
    const inputBuffer = createGPUParquetEncodedPageBatchInputBuffer(device, plan);
    const graph = new GPUCommandGraph(device, {id: 'gpu-parquet-binding-limit-test'});
    addGPUParquetEncodedPageBatchToGraph(graph, plan, inputBuffer);
    const compiled = graph.compile();
    try {
      expect(compiled.stats.nodeOrder.some(nodeId => nodeId.endsWith('-lz-byte-batch'))).toBe(
        false
      );
      expect(compiled.stats.nodeOrder.filter(nodeId => nodeId.endsWith('-lz4-raw'))).toHaveLength(
        2
      );
    } finally {
      compiled.destroy();
      inputBuffer.destroy();
    }
  });
});

it('zero-value compressed BYTE_STREAM_SPLIT pages remain no-op GPU pages', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const batch = makeBatch(Uint8Array.from([0]));
  const column = batch.columns[0];
  const page = column.pages[0];
  const emptyBatch: ParquetEncodedPageBatch = {
    ...batch,
    rowGroup: {...batch.rowGroup, rowCount: 0, uncompressedByteLength: 0, uncompressedSize: 0},
    columns: [
      {
        ...column,
        maxDefinitionLevel: 0,
        valueCount: 0,
        pages: [
          {
            ...page,
            valueCount: 0,
            nonNullValueCount: 0,
            definitionLevels: {byteOffset: 0, byteLength: 0},
            values: {byteOffset: 0, byteLength: 1},
            compressedByteLength: 1,
            uncompressedByteLength: 0
          }
        ]
      }
    ]
  };
  const plan = planGPUParquetEncodedPageBatch(emptyBatch);
  expect(plan.lzByteStreamSplitBatch).toBeUndefined();

  const inputBuffer = createGPUParquetEncodedPageBatchInputBuffer(device, plan);
  const graph = new GPUCommandGraph(device, {id: 'gpu-parquet-empty-bss-test'});
  const result = addGPUParquetEncodedPageBatchToGraph(graph, plan, inputBuffer);
  expect(result.pages[0].mode).toBe('gpu');
  const compiled = graph.compile();
  try {
    expect(compiled.stats.nodeOrder.some(nodeId => nodeId.includes('byte-stream-split'))).toBe(
      false
    );
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
  }
});

it('loaders.gl encoded pages reuse one byte-array dictionary across GPU pages', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const plan = planGPUParquetEncodedPageBatch(makeDictionaryBatch());
  const inputBuffer = createGPUParquetEncodedPageBatchInputBuffer(device, plan);
  const graph = new GPUCommandGraph(device, {id: 'gpu-parquet-dictionary-batch-test'});
  const result = addGPUParquetEncodedPageBatchToGraph(graph, plan, inputBuffer);
  const firstPage = result.pages[0] as GPUParquetDecodedPage;
  const secondPage = result.pages[1] as GPUParquetDecodedPage;
  const firstReadback = createReadbackBuffer(device, 4);
  const secondReadback = createReadbackBuffer(device, 4);
  if (firstPage.values.layout === 'byte-array' && secondPage.values.layout === 'byte-array') {
    addReadbackCopy(graph, firstPage.values.values, firstReadback, 'first-dictionary-values');
    addReadbackCopy(graph, secondPage.values.values, secondReadback, 'second-dictionary-values');
  }
  const compiled = graph.compile();
  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-parquet-dictionary-encoder'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const firstResult = await firstReadback.readAsync();
    const secondResult = await secondReadback.readAsync();
    expect(
      new TextDecoder().decode(new Uint8Array(firstResult.buffer, firstResult.byteOffset, 3))
    ).toBe('abb');
    expect(
      new TextDecoder().decode(new Uint8Array(secondResult.buffer, secondResult.byteOffset, 2))
    ).toBe('bb');
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    firstReadback.destroy();
    secondReadback.destroy();
  }
});

it('loaders.gl RLE BOOLEAN values execute through the automatic GPU graph', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const plan = planGPUParquetEncodedPageBatch(
    makeSinglePageBatch(Uint8Array.from([4, 0, 0, 0, 8, 1, 8, 0]), 'BOOLEAN', 'RLE', 8)
  );
  const inputBuffer = createGPUParquetEncodedPageBatchInputBuffer(device, plan);
  const graph = new GPUCommandGraph(device, {id: 'gpu-parquet-rle-boolean-batch-test'});
  const result = addGPUParquetEncodedPageBatchToGraph(graph, plan, inputBuffer);
  const page = result.pages[0] as GPUParquetDecodedPage;
  const readback = createReadbackBuffer(device, 8 * Uint32Array.BYTES_PER_ELEMENT);
  if (page.values.layout === 'uint32') {
    addReadbackCopy(graph, page.values.values, readback, 'rle-boolean-values');
  }
  const compiled = graph.compile();

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-parquet-rle-boolean-encoder'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const resultData = await readback.readAsync();
    expect(Array.from(new Uint32Array(resultData.buffer, resultData.byteOffset, 8))).toEqual([
      1, 1, 1, 1, 0, 0, 0, 0
    ]);
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    readback.destroy();
  }
});

it('loaders.gl DELTA_BYTE_ARRAY values execute through the automatic GPU graph', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const encoded = Uint8Array.from([
    128, 1, 4, 4, 0, 5, 3, 0, 0, 0, 37, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128, 1, 4, 4, 6, 3, 3, 0,
    0, 0, 104, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 99, 97, 116, 114, 116, 111, 111, 110, 100, 111, 103
  ]);
  const plan = planGPUParquetEncodedPageBatch(
    makeSinglePageBatch(encoded, 'BYTE_ARRAY', 'DELTA_BYTE_ARRAY', 4),
    {getPageOutputByteLength: () => 16}
  );
  const inputBuffer = createGPUParquetEncodedPageBatchInputBuffer(device, plan);
  const graph = new GPUCommandGraph(device, {id: 'gpu-parquet-delta-byte-array-batch-test'});
  const result = addGPUParquetEncodedPageBatchToGraph(graph, plan, inputBuffer);
  const page = result.pages[0] as GPUParquetDecodedPage;
  const valuesReadback = createReadbackBuffer(device, 16);
  const lengthsReadback = createReadbackBuffer(device, 16);
  const offsetsReadback = createReadbackBuffer(device, 16);
  if (page.values.layout === 'byte-array') {
    addReadbackCopy(graph, page.values.values, valuesReadback, 'delta-byte-array-values');
    addReadbackCopy(graph, page.values.lengths, lengthsReadback, 'delta-byte-array-lengths');
    addReadbackCopy(graph, page.values.offsets, offsetsReadback, 'delta-byte-array-offsets');
  }
  const compiled = graph.compile();

  try {
    const commandEncoder = device.createCommandEncoder({
      id: 'gpu-parquet-delta-byte-array-encoder'
    });
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const [valueData, lengthData, offsetData] = await Promise.all([
      valuesReadback.readAsync(),
      lengthsReadback.readAsync(),
      offsetsReadback.readAsync()
    ]);
    expect(
      new TextDecoder().decode(new Uint8Array(valueData.buffer, valueData.byteOffset, 16))
    ).toBe('catcarcartoondog');
    expect(Array.from(new Uint32Array(lengthData.buffer, lengthData.byteOffset, 4))).toEqual([
      3, 3, 7, 3
    ]);
    expect(Array.from(new Uint32Array(offsetData.buffer, offsetData.byteOffset, 4))).toEqual([
      0, 3, 6, 13
    ]);
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    valuesReadback.destroy();
    lengthsReadback.destroy();
    offsetsReadback.destroy();
  }
});

it('loaders.gl empty DELTA_BYTE_ARRAY values produce an empty GPU graph result', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const plan = planGPUParquetEncodedPageBatch(
    makeSinglePageBatch(new Uint8Array(0), 'BYTE_ARRAY', 'DELTA_BYTE_ARRAY', 0)
  );
  const inputBuffer = createGPUParquetEncodedPageBatchInputBuffer(device, plan);
  const graph = new GPUCommandGraph(device, {id: 'gpu-parquet-empty-delta-byte-array-test'});
  const result = addGPUParquetEncodedPageBatchToGraph(graph, plan, inputBuffer);
  const page = result.pages[0] as GPUParquetDecodedPage;
  expect(page.values.layout).toBe('byte-array');
  if (page.values.layout === 'byte-array') {
    expect(page.values.valueCount).toBe(0);
    expect(page.values.byteLength).toBe(0);
    expect(page.values.values.length).toBe(0);
    expect(page.values.lengths.length).toBe(0);
    expect(page.values.offsets.length).toBe(0);
  }
  const compiled = graph.compile();

  try {
    const commandEncoder = device.createCommandEncoder({
      id: 'gpu-parquet-empty-delta-byte-array-encoder'
    });
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
  }
});

function makeBatch(
  data: Uint8Array,
  encoding: 'PLAIN' | 'BYTE_STREAM_SPLIT' = 'BYTE_STREAM_SPLIT',
  compression: 'SNAPPY' | 'LZ4_RAW' = 'SNAPPY'
): ParquetEncodedPageBatch {
  return {
    shape: 'parquet-encoded-pages',
    rowGroup: {
      index: 0,
      rowOffset: 0,
      rowCount: 2,
      uncompressedByteLength: 10,
      uncompressedSize: 10,
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
        physicalType: 'FLOAT',
        maxRepetitionLevel: 0,
        maxDefinitionLevel: 1,
        compression,
        valueCount: 2,
        pages: [
          {
            type: 'data-v2',
            pageOrdinal: 0,
            encoding,
            repetitionLevelEncoding: 'RLE',
            definitionLevelEncoding: 'RLE',
            compression,
            compressionState: 'compressed',
            valueCount: 2,
            nonNullValueCount: 2,
            data,
            repetitionLevels: {byteOffset: 0, byteLength: 0},
            definitionLevels: {byteOffset: 0, byteLength: 2},
            values: {byteOffset: 2, byteLength: data.byteLength - 2},
            compressedByteLength: data.byteLength,
            uncompressedByteLength: 10
          }
        ]
      }
    ]
  };
}

function repeatOnlyPage(
  batch: ParquetEncodedPageBatch,
  pageCount: number
): ParquetEncodedPageBatch {
  const column = batch.columns[0];
  const page = column.pages[0];
  return {
    ...batch,
    rowGroup: {
      ...batch.rowGroup,
      rowCount: batch.rowGroup.rowCount * pageCount
    },
    columns: [
      {
        ...column,
        valueCount: column.valueCount * pageCount,
        pages: Array.from({length: pageCount}, (_, pageIndex) => ({
          ...page,
          pageOrdinal: pageIndex
        }))
      }
    ]
  };
}

async function withReducedStorageBindingLimit<Result>(
  device: Device,
  maximumStorageBufferBindingSize: number,
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
        return property === 'maxStorageBufferBindingSize'
          ? maximumStorageBufferBindingSize
          : Reflect.get(target, property, target);
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

function makeDictionaryBatch(): ParquetEncodedPageBatch {
  const dictionaryData = Uint8Array.from([1, 0, 0, 0, 97, 2, 0, 0, 0, 98, 98]);
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
  return {
    shape: 'parquet-encoded-pages',
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
        dictionary: {
          type: 'dictionary',
          pageOrdinal: -1,
          encoding: 'PLAIN',
          compression: 'UNCOMPRESSED',
          compressionState: 'decompressed',
          valueCount: 2,
          nonNullValueCount: 2,
          data: dictionaryData,
          values: {byteOffset: 0, byteLength: dictionaryData.byteLength},
          compressedByteLength: dictionaryData.byteLength,
          uncompressedByteLength: dictionaryData.byteLength
        },
        pages: [makeDataPage(0, 2, 2), makeDataPage(1, 1, 1)]
      }
    ]
  };
}

function makeSinglePageBatch(
  data: Uint8Array,
  physicalType: string,
  encoding: string,
  valueCount: number
): ParquetEncodedPageBatch {
  return {
    shape: 'parquet-encoded-pages',
    rowGroup: {
      index: 0,
      rowOffset: 0,
      rowCount: valueCount,
      uncompressedByteLength: data.byteLength,
      uncompressedSize: data.byteLength,
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
        physicalType,
        maxRepetitionLevel: 0,
        maxDefinitionLevel: 0,
        compression: 'UNCOMPRESSED',
        valueCount,
        pages: [
          {
            type: 'data-v2',
            pageOrdinal: 0,
            encoding,
            repetitionLevelEncoding: 'RLE',
            definitionLevelEncoding: 'RLE',
            compression: 'UNCOMPRESSED',
            compressionState: 'decompressed',
            valueCount,
            nonNullValueCount: valueCount,
            data,
            repetitionLevels: {byteOffset: 0, byteLength: 0},
            definitionLevels: {byteOffset: 0, byteLength: 0},
            values: {byteOffset: 0, byteLength: data.byteLength},
            compressedByteLength: data.byteLength,
            uncompressedByteLength: data.byteLength
          }
        ]
      }
    ]
  };
}

function encodeByteStreamSplit(
  decoded: Uint8Array,
  valueCount: number,
  byteWidth: number
): Uint8Array {
  const encoded = new Uint8Array(decoded.length);
  for (let valueIndex = 0; valueIndex < valueCount; valueIndex++) {
    for (let byteIndex = 0; byteIndex < byteWidth; byteIndex++) {
      encoded[byteIndex * valueCount + valueIndex] = decoded[valueIndex * byteWidth + byteIndex];
    }
  }
  return encoded;
}

function createReadbackBuffer(device: Device, byteLength: number): Buffer {
  return device.createBuffer({
    byteLength,
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });
}

function addReadbackCopy(
  graph: GPUCommandGraph,
  source: GraphDataView<'uint32'>,
  destination: Buffer,
  id: string
): void {
  const destinationHandle = graph.importBuffer(
    {
      id: `${id}-readback`,
      byteLength: destination.byteLength,
      usage: destination.usage
    },
    destination
  );
  graph.addCopyPass({
    id: `${id}-copy`,
    resources: [
      {buffer: source, usage: 'copy-source'},
      {buffer: destinationHandle, usage: 'copy-destination'}
    ],
    compile: () => ({
      encode: ({commandEncoder, getBuffer}) =>
        commandEncoder.copyBufferToBuffer({
          sourceBuffer: getBuffer(source),
          sourceOffset: source.byteOffset,
          destinationBuffer: getBuffer(destinationHandle),
          destinationOffset: 0,
          size: destination.byteLength
        })
    })
  });
}
