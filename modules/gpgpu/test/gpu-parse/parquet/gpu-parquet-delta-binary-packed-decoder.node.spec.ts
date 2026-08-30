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
import test from 'test/utils/vitest-tape';
import {vi} from 'vitest';
import {WgslReflect} from 'wgsl_reflect';

const ENCODED = Uint8Array.from([
  128, 1, 4, 5, 20, 1, 3, 255, 254, 253, 35, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
]);

test('parseParquetDeltaBinaryPackedPlan publishes INT32 mini-block descriptors', testCase => {
  const plan = parseParquetDeltaBinaryPackedPlan(ENCODED);
  testCase.deepEqual(
    {
      blockSize: plan.blockSize,
      miniBlockCount: plan.miniBlockCount,
      valuesPerMiniBlock: plan.valuesPerMiniBlock,
      valueCount: plan.valueCount,
      firstValue: plan.firstValue,
      descriptorCount: plan.descriptorCount,
      bytesConsumed: plan.bytesConsumed
    },
    {
      blockSize: 128,
      miniBlockCount: 4,
      valuesPerMiniBlock: 32,
      valueCount: 5,
      firstValue: 10,
      descriptorCount: 1,
      bytesConsumed: 22
    }
  );
  testCase.deepEqual(Array.from(plan.miniBlockDescriptors), [1, 4, 10, 3, 0xffffffff]);
  testCase.equal(plan.bytesConsumed, 22, 'unused nonzero-width mini-blocks have no bodies');
  testCase.throws(
    () => parseParquetDeltaBinaryPackedPlan(Uint8Array.from([64, 1, 1, 0])),
    /positive multiple of 128/
  );
  testCase.throws(() => parseParquetDeltaBinaryPackedPlan(ENCODED.subarray(0, 12)), /truncated/);
  testCase.end();
});

test('GPUParquetDeltaBinaryPackedUnpacker emits mini-block extraction WGSL', testCase => {
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
  testCase.deepEqual(
    new WgslReflect(source).entry.compute.map(entry => entry.name),
    ['main']
  );
  testCase.match(source, /minimumDelta \+ adjustedDelta/);
  testCase.match(source, /outputDeltas\[OUTPUT_OFFSET\] = FIRST_VALUE/);
  testCase.doesNotThrow(() => unpacker.addToGraph(graph));
  testCase.end();
});

test('GPUParquetDeltaBinaryPackedDecoder composes unpack and inclusive scan', testCase => {
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
  testCase.ok(addComputePass.mock.calls.length >= 2);
  testCase.equal(addComputePass.mock.calls[0][0].id, 'gpu-parquet-delta-binary-packed-unpack');
  testCase.match(addComputePass.mock.calls[1][0].id, /gpu-parquet-delta-binary-packed-scan/);
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
