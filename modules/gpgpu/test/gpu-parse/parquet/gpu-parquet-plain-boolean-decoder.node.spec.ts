// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUParquetPlainBooleanDecoder,
  getGPUParquetPlainBooleanShaderSource
} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import test from 'test/utils/vitest-tape';
import {WgslReflect} from 'wgsl_reflect';

test('GPUParquetPlainBooleanDecoder emits LSB-first boolean unpacking WGSL', testCase => {
  const graph = new GPUCommandGraph(makeSupportDevice());
  const inputHandle = graph.importBuffer({id: 'input', byteLength: 8, usage: Buffer.STORAGE});
  const outputHandle = graph.importBuffer({id: 'output', byteLength: 160, usage: Buffer.STORAGE});
  const decoder = new GPUParquetPlainBooleanDecoder({
    input: graph.createDataView(inputHandle, {format: 'uint32', length: 2}),
    output: graph.createDataView(outputHandle, {format: 'uint32', length: 40}),
    valueCount: 40
  });
  const source = getGPUParquetPlainBooleanShaderSource(decoder, {x: 1, y: 1, z: 1});
  testCase.deepEqual(
    new WgslReflect(source).entry.compute.map(entry => entry.name),
    ['main']
  );
  testCase.match(source, /valueIndex \/ 32u/);
  testCase.match(source, /valueIndex & 31u/);
  testCase.doesNotThrow(() => decoder.addToGraph(graph));
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
