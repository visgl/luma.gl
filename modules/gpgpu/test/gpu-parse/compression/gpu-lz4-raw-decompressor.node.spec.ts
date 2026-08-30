// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPULZ4RawDecompressor,
  getGPULZ4RawShaderSource,
  parseLZ4RawDecompressionPlan
} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import test from 'test/utils/vitest-tape';
import {WgslReflect} from 'wgsl_reflect';

const COMPRESSED = Uint8Array.from([0x14, 65, 1, 0, 0x50, 66, 67, 68, 69, 70]);

test('parseLZ4RawDecompressionPlan describes literals and overlapping matches', testCase => {
  const plan = parseLZ4RawDecompressionPlan(COMPRESSED);
  testCase.deepEqual(Array.from(plan.descriptors), [0, 1, 1, 0, 1, 8, 0, 1, 9, 5, 5, 0]);
  testCase.equal(plan.descriptorCount, 3);
  testCase.equal(plan.compressedByteLength, 10);
  testCase.equal(plan.outputByteLength, 14);
  testCase.throws(
    () => parseLZ4RawDecompressionPlan(Uint8Array.from([0x10, 65, 0, 0])),
    /match offset.*outside/
  );
  testCase.throws(
    () => parseLZ4RawDecompressionPlan(Uint8Array.from([0xf0, 255])),
    /extended length is truncated/
  );
  testCase.end();
});

test('GPULZ4RawDecompressor emits recursive literal resolution WGSL', testCase => {
  const graph = new GPUCommandGraph(makeSupportDevice());
  const inputHandle = graph.importBuffer({id: 'input', byteLength: 12, usage: Buffer.STORAGE});
  const descriptorHandle = graph.importBuffer({
    id: 'descriptors',
    byteLength: 48,
    usage: Buffer.STORAGE
  });
  const outputHandle = graph.importBuffer({id: 'output', byteLength: 16, usage: Buffer.STORAGE});
  const decompressor = new GPULZ4RawDecompressor({
    input: graph.createDataView(inputHandle, {format: 'uint32', length: 3}),
    descriptors: graph.createDataView(descriptorHandle, {format: 'uint32', length: 12}),
    output: graph.createDataView(outputHandle, {format: 'uint32', length: 4}),
    compressedByteLength: 10,
    outputByteLength: 14,
    descriptorCount: 3
  });
  const source = getGPULZ4RawShaderSource(decompressor, {x: 1, y: 1, z: 1});
  testCase.deepEqual(
    new WgslReflect(source).entry.compute.map(entry => entry.name),
    ['main']
  );
  testCase.match(source, /relativeByteIndex % matchOffset/);
  testCase.match(source, /depth < DESCRIPTOR_COUNT/);
  testCase.doesNotThrow(() => decompressor.addToGraph(graph));
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
