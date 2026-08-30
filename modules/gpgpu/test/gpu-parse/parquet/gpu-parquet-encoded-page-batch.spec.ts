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
import test from 'test/utils/vitest-tape';

test('loaders.gl encoded pages batch Snappy, levels, and values in one graph', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const expectedValues = new Uint8Array(new Float32Array([1, 2]).buffer);
  const byteStreamSplit = encodeByteStreamSplit(expectedValues, 2, 4);
  const snappyValues = Uint8Array.from([8, 28, ...byteStreamSplit]);
  const batch = makeBatch(Uint8Array.from([4, 1, ...snappyValues]));
  const plan = planGPUParquetEncodedPageBatch(batch);
  testCase.equal(plan.gpuPageCount, 1);
  testCase.equal(plan.pages[0].mode, 'gpu');
  if (plan.pages[0].mode === 'gpu') {
    testCase.equal(plan.pages[0].compression?.codec, 'SNAPPY');
    testCase.equal(plan.pages[0].values.kind, 'byte-stream-split');
  }

  const inputBuffer = createGPUParquetEncodedPageBatchInputBuffer(device, plan);
  const graph = new GPUCommandGraph(device, {id: 'gpu-parquet-loader-batch-test'});
  const result = addGPUParquetEncodedPageBatchToGraph(graph, plan, inputBuffer);
  const page = result.pages[0] as GPUParquetDecodedPage;
  testCase.equal(page.mode, 'gpu');
  testCase.equal(page.values.layout, 'packed-bytes');

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

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-parquet-loader-batch-encoder'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const valueResult = await valueReadback.readAsync();
    const levelResult = await levelReadback.readAsync();
    testCase.deepEqual(
      Array.from(new Uint8Array(valueResult.buffer, valueResult.byteOffset, expectedValues.length)),
      Array.from(expectedValues),
      'decompresses and restores value-major bytes'
    );
    testCase.deepEqual(
      Array.from(new Uint32Array(levelResult.buffer, levelResult.byteOffset, 2)),
      [1, 1],
      'decodes V2 definition levels alongside values'
    );
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    valueReadback.destroy();
    levelReadback.destroy();
  }
  testCase.end();
});

test('loaders.gl encoded pages reuse one byte-array dictionary across GPU pages', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
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
    testCase.equal(
      new TextDecoder().decode(new Uint8Array(firstResult.buffer, firstResult.byteOffset, 3)),
      'abb'
    );
    testCase.equal(
      new TextDecoder().decode(new Uint8Array(secondResult.buffer, secondResult.byteOffset, 2)),
      'bb'
    );
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    firstReadback.destroy();
    secondReadback.destroy();
  }
  testCase.end();
});

function makeBatch(data: Uint8Array): ParquetEncodedPageBatch {
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
        compression: 'SNAPPY',
        valueCount: 2,
        pages: [
          {
            type: 'data-v2',
            pageOrdinal: 0,
            encoding: 'BYTE_STREAM_SPLIT',
            repetitionLevelEncoding: 'RLE',
            definitionLevelEncoding: 'RLE',
            compression: 'SNAPPY',
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
