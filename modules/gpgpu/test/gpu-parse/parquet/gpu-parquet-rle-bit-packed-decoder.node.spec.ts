// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUParquetRleBitPackedDecoder,
  getGPUParquetRleBitPackedShaderSource,
  parseParquetRleBitPackedRunPlan
} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import test from 'test/utils/vitest-tape';
import {WgslReflect} from 'wgsl_reflect';

test('parseParquetRleBitPackedRunPlan parses mixed runs and truncates the final group', testCase => {
  const encoded = Uint8Array.from([6, 5, 3, 0x88, 0xc6, 0xfa]);
  const plan = parseParquetRleBitPackedRunPlan(encoded, 3, 8);
  testCase.deepEqual(Array.from(plan.runDescriptors), [0, 3, 1, 0, 3, 5, 3, 1]);
  testCase.equal(plan.runCount, 2);
  testCase.equal(plan.valueCount, 8);
  testCase.equal(plan.bytesConsumed, 6);
  testCase.ok(Object.isFrozen(plan));
  testCase.throws(
    () => parseParquetRleBitPackedRunPlan(Uint8Array.from([6]), 3, 3),
    /payload is truncated/
  );
  testCase.throws(
    () => parseParquetRleBitPackedRunPlan(Uint8Array.from([0]), 3, 1),
    /zero run length/
  );
  testCase.throws(
    () => parseParquetRleBitPackedRunPlan(Uint8Array.from([]), 33, 0),
    /0 through 32/
  );
  testCase.end();
});

test('GPUParquetRleBitPackedDecoder emits bounded mixed-run WGSL', testCase => {
  const graph = new GPUCommandGraph(makeSupportDevice());
  const inputHandle = graph.importBuffer({id: 'input', byteLength: 8, usage: Buffer.STORAGE});
  const descriptorHandle = graph.importBuffer({
    id: 'descriptors',
    byteLength: 32,
    usage: Buffer.STORAGE
  });
  const outputHandle = graph.importBuffer({id: 'output', byteLength: 32, usage: Buffer.STORAGE});
  const decoder = new GPUParquetRleBitPackedDecoder({
    input: graph.createDataView(inputHandle, {format: 'uint32', length: 2}),
    runDescriptors: graph.createDataView(descriptorHandle, {format: 'uint32', length: 8}),
    output: graph.createDataView(outputHandle, {format: 'uint32', length: 8}),
    encodedByteLength: 6,
    valueCount: 8,
    runCount: 2,
    bitWidth: 3
  });
  const source = getGPUParquetRleBitPackedShaderSource(decoder, {x: 1, y: 1, z: 1});
  const reflection = new WgslReflect(source);
  testCase.deepEqual(
    reflection.entry.compute.map(entry => entry.name),
    ['main']
  );
  testCase.match(source, /while \(lowerRunIndex < upperRunIndex\)/);
  testCase.match(source, /readBitPackedValue/);
  testCase.match(source, /VALUE_MASK: u32 = 7u/);
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
