import {expect, it} from 'vitest';
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
import {WgslReflect} from 'wgsl_reflect';

const COMPRESSED = Uint8Array.from([0x14, 65, 1, 0, 0x50, 66, 67, 68, 69, 70]);

it('parseLZ4RawDecompressionPlan describes literals and overlapping matches', () => {
  const plan = parseLZ4RawDecompressionPlan(COMPRESSED);
  expect(Array.from(plan.descriptors)).toEqual([0, 1, 1, 0, 1, 8, 0, 1, 9, 5, 5, 0]);
  expect(plan.descriptorCount).toBe(3);
  expect(plan.compressedByteLength).toBe(10);
  expect(plan.outputByteLength).toBe(14);
  expect(() => parseLZ4RawDecompressionPlan(Uint8Array.from([0x10, 65, 0, 0]))).toThrow(
    /match offset.*outside/
  );
  expect(() => parseLZ4RawDecompressionPlan(Uint8Array.from([0xf0, 255]))).toThrow(
    /extended length is truncated/
  );
});

it('GPULZ4RawDecompressor emits recursive literal resolution WGSL', () => {
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
  expect(new WgslReflect(source).entry.compute.map(entry => entry.name)).toEqual(['main']);
  expect(source).toMatch(/relativeByteIndex % matchOffset/);
  expect(source).toMatch(/depth < DESCRIPTOR_COUNT/);
  expect(() => decompressor.addToGraph(graph)).not.toThrow();
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
