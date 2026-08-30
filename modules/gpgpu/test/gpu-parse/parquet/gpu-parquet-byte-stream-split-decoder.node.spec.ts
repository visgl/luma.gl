// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUParquetByteStreamSplitDecoder,
  GPU_PARQUET_BYTE_STREAM_SPLIT_WORKGROUP_SIZE,
  getGPUParquetByteStreamSplitShaderSource,
  makeGPUParquetByteStreamSplitStats
} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import test from 'test/utils/vitest-tape';
import {WgslReflect} from 'wgsl_reflect';

test('makeGPUParquetByteStreamSplitStats publishes byte and dispatch bounds', testCase => {
  testCase.deepEqual(makeGPUParquetByteStreamSplitStats(257, 8), {
    valueCount: 257,
    byteWidth: 8,
    byteLength: 2056,
    wordCount: 514,
    workgroupCount: 3,
    workgroupSize: 256
  });
  testCase.deepEqual(makeGPUParquetByteStreamSplitStats(5, 3), {
    valueCount: 5,
    byteWidth: 3,
    byteLength: 15,
    wordCount: 4,
    workgroupCount: 1,
    workgroupSize: 256
  });
  testCase.deepEqual(makeGPUParquetByteStreamSplitStats(0, 8), {
    valueCount: 0,
    byteWidth: 8,
    byteLength: 0,
    wordCount: 0,
    workgroupCount: 0,
    workgroupSize: 256
  });
  testCase.ok(Object.isFrozen(makeGPUParquetByteStreamSplitStats(1, 4)));
  testCase.equal(GPU_PARQUET_BYTE_STREAM_SPLIT_WORKGROUP_SIZE, 256);
  testCase.throws(() => makeGPUParquetByteStreamSplitStats(-1, 4), /valueCount.*non-negative/);
  testCase.throws(() => makeGPUParquetByteStreamSplitStats(1, 0), /byteWidth.*positive/);
  testCase.throws(() => makeGPUParquetByteStreamSplitStats(0x40000000, 4), /byte length.*uint32/);
  testCase.end();
});

test('GPUParquetByteStreamSplitDecoder validates graph views and ownership', testCase => {
  const graph = new GPUCommandGraph(makeSupportDevice());
  const inputHandle = graph.importBuffer({
    id: 'input',
    byteLength: 64,
    usage: Buffer.STORAGE
  });
  const outputHandle = graph.importBuffer({
    id: 'output',
    byteLength: 128,
    usage: Buffer.STORAGE
  });
  const input = graph.createDataView(inputHandle, {format: 'uint32', length: 16});
  const output = graph.createDataView(outputHandle, {format: 'uint32', length: 16});
  const decoder = new GPUParquetByteStreamSplitDecoder({
    input,
    output,
    valueCount: 7,
    byteWidth: 8
  });
  testCase.doesNotThrow(() => decoder.addToGraph(graph));

  const shortInput = graph.createDataView(inputHandle, {format: 'uint32', length: 13});
  testCase.throws(
    () =>
      new GPUParquetByteStreamSplitDecoder({
        input: shortInput,
        output,
        valueCount: 7,
        byteWidth: 8
      }),
    /input is shorter/
  );
  const stridedOutput = graph.createDataView(outputHandle, {
    format: 'uint32',
    length: 16,
    byteStride: 8
  });
  testCase.throws(
    () =>
      new GPUParquetByteStreamSplitDecoder({
        input,
        output: stridedOutput,
        valueCount: 7,
        byteWidth: 8
      }),
    /must be packed/
  );
  const aliasedOutput = graph.createDataView(inputHandle, {format: 'uint32', length: 16});
  testCase.throws(
    () =>
      new GPUParquetByteStreamSplitDecoder({
        input,
        output: aliasedOutput,
        valueCount: 7,
        byteWidth: 8
      }),
    /separate buffers/
  );

  const otherGraph = new GPUCommandGraph(makeSupportDevice());
  const otherOutputHandle = otherGraph.importBuffer({
    id: 'other-output',
    byteLength: 64,
    usage: Buffer.STORAGE
  });
  const otherOutput = otherGraph.createDataView(otherOutputHandle, {
    format: 'uint32',
    length: 16
  });
  const crossGraphDecoder = new GPUParquetByteStreamSplitDecoder({
    input,
    output: otherOutput,
    valueCount: 7,
    byteWidth: 8
  });
  testCase.throws(() => crossGraphDecoder.addToGraph(graph), /different GPUCommandGraph/);
  testCase.end();
});

test('GPUParquetByteStreamSplitDecoder emits a byte-addressed bounded shader', testCase => {
  const graph = new GPUCommandGraph(makeSupportDevice());
  const inputHandle = graph.importBuffer({
    id: 'input',
    byteLength: 140,
    usage: Buffer.STORAGE
  });
  const outputHandle = graph.importBuffer({
    id: 'output',
    byteLength: 140,
    usage: Buffer.STORAGE
  });
  const input = graph.createDataView(inputHandle, {format: 'uint32', length: 35});
  const output = graph.createDataView(outputHandle, {format: 'uint32', length: 35});
  const decoder = new GPUParquetByteStreamSplitDecoder({
    input,
    output,
    valueCount: 17,
    byteWidth: 8
  });
  const source = getGPUParquetByteStreamSplitShaderSource(decoder, {x: 1, y: 1, z: 1});
  const reflection = new WgslReflect(source);

  testCase.deepEqual(
    reflection.entry.compute.map(entry => entry.name),
    ['main']
  );
  testCase.match(source, /encodedByteIndex = byteIndexWithinValue \* VALUE_COUNT \+ valueIndex/);
  testCase.match(source, /readEncodedByte\(encodedByteIndex\) << \(byteLane \* 8u\)/);
  testCase.match(source, /outputWordIndex >= WORD_COUNT/);
  testCase.match(source, /workgroupId\.z/);
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
