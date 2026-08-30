// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUParquetDictionaryDecoder,
  GPUParquetRleDictionaryDecoder,
  getGPUParquetDictionaryShaderSource,
  makeGPUParquetDictionaryDecoderStats
} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import test from 'test/utils/vitest-tape';
import {vi} from 'vitest';
import {WgslReflect} from 'wgsl_reflect';

test('GPUParquetDictionaryDecoder plans arbitrary-width gathers', testCase => {
  testCase.deepEqual(makeGPUParquetDictionaryDecoderStats(5, 3, 3), {
    valueCount: 5,
    dictionaryValueCount: 3,
    byteWidth: 3,
    dictionaryByteLength: 9,
    outputByteLength: 15,
    outputWordCount: 4,
    workgroupCount: 1
  });
  testCase.deepEqual(makeGPUParquetDictionaryDecoderStats(0, 0, 8), {
    valueCount: 0,
    dictionaryValueCount: 0,
    byteWidth: 8,
    dictionaryByteLength: 0,
    outputByteLength: 0,
    outputWordCount: 0,
    workgroupCount: 0
  });
  testCase.throws(() => makeGPUParquetDictionaryDecoderStats(1, 1, 0), /byteWidth.*positive/);
  testCase.end();
});

test('GPUParquetDictionaryDecoder validates and emits a byte gather shader', testCase => {
  const graph = new GPUCommandGraph(makeSupportDevice());
  const dictionaryHandle = graph.importBuffer({
    id: 'dictionary',
    byteLength: 12,
    usage: Buffer.STORAGE
  });
  const indicesHandle = graph.importBuffer({id: 'indices', byteLength: 16, usage: Buffer.STORAGE});
  const outputHandle = graph.importBuffer({id: 'output', byteLength: 12, usage: Buffer.STORAGE});
  const decoder = new GPUParquetDictionaryDecoder({
    dictionary: graph.createDataView(dictionaryHandle, {format: 'uint32', length: 3}),
    indices: graph.createDataView(indicesHandle, {format: 'uint32', length: 4}),
    output: graph.createDataView(outputHandle, {format: 'uint32', length: 3}),
    valueCount: 4,
    dictionaryValueCount: 3,
    byteWidth: 3
  });
  const source = getGPUParquetDictionaryShaderSource(decoder, {x: 1, y: 1, z: 1});
  testCase.deepEqual(
    new WgslReflect(source).entry.compute.map(entry => entry.name),
    ['main']
  );
  testCase.match(source, /dictionaryIndex < DICTIONARY_VALUE_COUNT/);
  testCase.match(source, /dictionaryIndex \* BYTE_WIDTH \+ byteIndexWithinValue/);
  testCase.doesNotThrow(() => decoder.addToGraph(graph));
  testCase.end();
});

test('GPUParquetRleDictionaryDecoder composes two graph nodes through transient indices', testCase => {
  const graph = new GPUCommandGraph(makeSupportDevice());
  const addComputePass = vi.spyOn(graph, 'addComputePass');
  const createTransientBuffer = vi.spyOn(graph, 'createTransientBuffer');
  const inputHandle = graph.importBuffer({id: 'input', byteLength: 8, usage: Buffer.STORAGE});
  const descriptorHandle = graph.importBuffer({
    id: 'descriptors',
    byteLength: 32,
    usage: Buffer.STORAGE
  });
  const dictionaryHandle = graph.importBuffer({
    id: 'dictionary',
    byteLength: 12,
    usage: Buffer.STORAGE
  });
  const outputHandle = graph.importBuffer({id: 'output', byteLength: 24, usage: Buffer.STORAGE});
  new GPUParquetRleDictionaryDecoder({
    input: graph.createDataView(inputHandle, {format: 'uint32', length: 2}),
    runDescriptors: graph.createDataView(descriptorHandle, {format: 'uint32', length: 8}),
    dictionary: graph.createDataView(dictionaryHandle, {format: 'uint32', length: 3}),
    output: graph.createDataView(outputHandle, {format: 'uint32', length: 6}),
    encodedByteLength: 5,
    valueCount: 8,
    runCount: 2,
    bitWidth: 2,
    dictionaryValueCount: 3,
    byteWidth: 3
  }).addToGraph(graph);
  testCase.equal(createTransientBuffer.mock.calls.length, 1);
  testCase.equal(addComputePass.mock.calls.length, 2);
  testCase.deepEqual(
    addComputePass.mock.calls.map(call => call[0].id),
    ['gpu-parquet-rle-dictionary-indices', 'gpu-parquet-rle-dictionary-gather']
  );
  testCase.end();
});

function makeSupportDevice(): Device {
  return {
    type: 'webgpu',
    isLost: false,
    features: new Set(),
    wgslLanguageFeatures: new Set(),
    info: {},
    limits: {
      maxBufferSize: 256 * 1024 * 1024,
      maxStorageBufferBindingSize: 128 * 1024 * 1024,
      maxComputeInvocationsPerWorkgroup: 256,
      maxComputeWorkgroupSizeX: 256,
      maxComputeWorkgroupSizeY: 256,
      maxComputeWorkgroupsPerDimension: 65_535
    }
  } as Device;
}
