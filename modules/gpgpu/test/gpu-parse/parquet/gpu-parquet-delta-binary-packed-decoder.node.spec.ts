// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUParquetDeltaBinaryPackedDecoder,
  GPUParquetDeltaBinaryPackedUnpacker,
  getGPUParquetDeltaBinaryPackedShaderSource,
  parseParquetDeltaBinaryPackedPlan
} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {vi, expect, it} from 'vitest';
import {WgslReflect} from 'wgsl_reflect';

const ENCODED = Uint8Array.from([
  128, 1, 4, 5, 20, 1, 3, 255, 254, 253, 35, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
]);

it('parseParquetDeltaBinaryPackedPlan publishes INT32 mini-block descriptors', () => {
  const plan = parseParquetDeltaBinaryPackedPlan(ENCODED);
  expect({
    blockSize: plan.blockSize,
    miniBlockCount: plan.miniBlockCount,
    valuesPerMiniBlock: plan.valuesPerMiniBlock,
    valueCount: plan.valueCount,
    firstValue: plan.firstValue,
    descriptorCount: plan.descriptorCount,
    bytesConsumed: plan.bytesConsumed
  }).toEqual({
    blockSize: 128,
    miniBlockCount: 4,
    valuesPerMiniBlock: 32,
    valueCount: 5,
    firstValue: 10,
    descriptorCount: 1,
    bytesConsumed: 22
  });
  expect(Array.from(plan.miniBlockDescriptors)).toEqual([1, 4, 10, 3, 0xffffffff]);
  expect(plan.bytesConsumed, 'unused nonzero-width mini-blocks have no bodies').toBe(22);
  expect(() => parseParquetDeltaBinaryPackedPlan(Uint8Array.from([64, 1, 1, 0]))).toThrow(
    /positive multiple of 128/
  );
  expect(() => parseParquetDeltaBinaryPackedPlan(ENCODED.subarray(0, 12))).toThrow(/truncated/);
});

it('GPUParquetDeltaBinaryPackedUnpacker emits mini-block extraction WGSL', () => {
  const graph = new GPUCommandGraph(makeSupportDevice());
  const inputHandle = graph.importBuffer({id: 'input', byteLength: 24, usage: Buffer.STORAGE});
  const descriptorHandle = graph.importBuffer({
    id: 'descriptors',
    byteLength: 20,
    usage: Buffer.STORAGE
  });
  const outputHandle = graph.importBuffer({id: 'output', byteLength: 20, usage: Buffer.STORAGE});
  const unpacker = new GPUParquetDeltaBinaryPackedUnpacker({
    input: graph.createDataView(inputHandle, {format: 'uint32', length: 6}),
    miniBlockDescriptors: graph.createDataView(descriptorHandle, {format: 'uint32', length: 5}),
    outputDeltas: graph.createDataView(outputHandle, {format: 'uint32', length: 5}),
    encodedByteLength: 22,
    valueCount: 5,
    descriptorCount: 1,
    firstValue: 10
  });
  const source = getGPUParquetDeltaBinaryPackedShaderSource(unpacker, {x: 1, y: 1, z: 1});
  expect(new WgslReflect(source).entry.compute.map(entry => entry.name)).toEqual(['main']);
  expect(source).toMatch(/minimumDelta \+ adjustedDelta/);
  expect(source).toMatch(/outputDeltas\[OUTPUT_OFFSET\] = FIRST_VALUE/);
  expect(() => unpacker.addToGraph(graph)).not.toThrow();
});

it('GPUParquetDeltaBinaryPackedDecoder composes unpack and inclusive scan', () => {
  const graph = new GPUCommandGraph(makeSupportDevice());
  const addComputePass = vi.spyOn(graph, 'addComputePass');
  const inputHandle = graph.importBuffer({id: 'input', byteLength: 24, usage: Buffer.STORAGE});
  const descriptorHandle = graph.importBuffer({
    id: 'descriptors',
    byteLength: 20,
    usage: Buffer.STORAGE
  });
  const outputHandle = graph.importBuffer({id: 'output', byteLength: 20, usage: Buffer.STORAGE});
  new GPUParquetDeltaBinaryPackedDecoder({
    input: graph.createDataView(inputHandle, {format: 'uint32', length: 6}),
    miniBlockDescriptors: graph.createDataView(descriptorHandle, {format: 'uint32', length: 5}),
    output: graph.createDataView(outputHandle, {format: 'uint32', length: 5}),
    encodedByteLength: 22,
    valueCount: 5,
    descriptorCount: 1,
    firstValue: 10
  }).addToGraph(graph);
  expect(Boolean(addComputePass.mock.calls.length >= 2)).toBe(true);
  expect(addComputePass.mock.calls[0][0].id).toBe('gpu-parquet-delta-binary-packed-unpack');
  expect(addComputePass.mock.calls[1][0].id).toMatch(/gpu-parquet-delta-binary-packed-scan/);
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
