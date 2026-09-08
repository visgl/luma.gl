import {expect, it} from 'vitest';
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
import {WgslReflect} from 'wgsl_reflect';

it('makeGPUParquetByteStreamSplitStats publishes byte and dispatch bounds', () => {
  expect(makeGPUParquetByteStreamSplitStats(257, 8)).toEqual({
    valueCount: 257,
    byteWidth: 8,
    byteLength: 2056,
    wordCount: 514,
    workgroupCount: 3,
    workgroupSize: 256
  });
  expect(makeGPUParquetByteStreamSplitStats(5, 3)).toEqual({
    valueCount: 5,
    byteWidth: 3,
    byteLength: 15,
    wordCount: 4,
    workgroupCount: 1,
    workgroupSize: 256
  });
  expect(makeGPUParquetByteStreamSplitStats(0, 8)).toEqual({
    valueCount: 0,
    byteWidth: 8,
    byteLength: 0,
    wordCount: 0,
    workgroupCount: 0,
    workgroupSize: 256
  });
  expect(Boolean(Object.isFrozen(makeGPUParquetByteStreamSplitStats(1, 4)))).toBe(true);
  expect(GPU_PARQUET_BYTE_STREAM_SPLIT_WORKGROUP_SIZE).toBe(256);
  expect(() => makeGPUParquetByteStreamSplitStats(-1, 4)).toThrow(/valueCount.*non-negative/);
  expect(() => makeGPUParquetByteStreamSplitStats(1, 0)).toThrow(/byteWidth.*positive/);
  expect(() => makeGPUParquetByteStreamSplitStats(0x40000000, 4)).toThrow(/byte length.*uint32/);
});

it('GPUParquetByteStreamSplitDecoder validates graph views and ownership', () => {
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
  expect(() => decoder.addToGraph(graph)).not.toThrow();

  const shortInput = graph.createDataView(inputHandle, {format: 'uint32', length: 13});
  expect(
    () =>
      new GPUParquetByteStreamSplitDecoder({
        input: shortInput,
        output,
        valueCount: 7,
        byteWidth: 8
      })
  ).toThrow(/input is shorter/);
  const stridedOutput = graph.createDataView(outputHandle, {
    format: 'uint32',
    length: 16,
    byteStride: 8
  });
  expect(
    () =>
      new GPUParquetByteStreamSplitDecoder({
        input,
        output: stridedOutput,
        valueCount: 7,
        byteWidth: 8
      })
  ).toThrow(/must be packed/);
  const aliasedOutput = graph.createDataView(inputHandle, {format: 'uint32', length: 16});
  expect(
    () =>
      new GPUParquetByteStreamSplitDecoder({
        input,
        output: aliasedOutput,
        valueCount: 7,
        byteWidth: 8
      })
  ).toThrow(/separate buffers/);

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
  expect(() => crossGraphDecoder.addToGraph(graph)).toThrow(/different GPUCommandGraph/);
});

it('GPUParquetByteStreamSplitDecoder emits a byte-addressed bounded shader', () => {
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

  expect(reflection.entry.compute.map(entry => entry.name)).toEqual(['main']);
  expect(source).toMatch(/encodedByteIndex = byteIndexWithinValue \* VALUE_COUNT \+ valueIndex/);
  expect(source).toMatch(/readEncodedByte\(encodedByteIndex\) << \(byteLane \* 8u\)/);
  expect(source).toMatch(/outputWordIndex >= WORD_COUNT/);
  expect(source).toMatch(/workgroupId\.z/);
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
