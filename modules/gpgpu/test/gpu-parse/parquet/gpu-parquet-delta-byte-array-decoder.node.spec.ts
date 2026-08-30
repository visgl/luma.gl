// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUParquetDeltaByteArrayDecoder,
  getGPUParquetDeltaByteArrayReconstructionShaderSource,
  parseParquetDeltaByteArrayPlan
} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import test from 'test/utils/vitest-tape';
import {vi} from 'vitest';
import {WgslReflect} from 'wgsl_reflect';

const PREFIX_LENGTHS = Uint8Array.from([
  128, 1, 4, 4, 0, 5, 3, 0, 0, 0, 37, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
]);
const SUFFIX_LENGTHS = Uint8Array.from([
  128, 1, 4, 4, 6, 3, 3, 0, 0, 0, 104, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
]);
const SUFFIX_DATA = new TextEncoder().encode('catrtoondog');
const ENCODED = Uint8Array.from([...PREFIX_LENGTHS, ...SUFFIX_LENGTHS, ...SUFFIX_DATA]);

test('parseParquetDeltaByteArrayPlan rebases the suffix length descriptors', testCase => {
  const plan = parseParquetDeltaByteArrayPlan(ENCODED);
  testCase.equal(plan.prefixLengthPlan.valueCount, 4);
  testCase.equal(plan.suffixLengthPlan.valueCount, 4);
  testCase.equal(plan.prefixLengthPlan.bytesConsumed, PREFIX_LENGTHS.length);
  testCase.equal(
    plan.suffixLengthPlan.bytesConsumed,
    PREFIX_LENGTHS.length + SUFFIX_LENGTHS.length
  );
  testCase.equal(plan.suffixLengthPlan.miniBlockDescriptors[2], PREFIX_LENGTHS.length + 10);
  testCase.equal(plan.suffixDataByteOffset, 44);
  testCase.equal(plan.suffixDataByteLength, SUFFIX_DATA.length);
  testCase.end();
});

test('GPUParquetDeltaByteArrayDecoder composes both decoders, scans, and reconstruction', testCase => {
  const plan = parseParquetDeltaByteArrayPlan(ENCODED);
  const graph = new GPUCommandGraph(makeSupportDevice());
  const addComputePass = vi.spyOn(graph, 'addComputePass');
  const inputHandle = graph.importBuffer({id: 'input', byteLength: 56, usage: Buffer.STORAGE});
  const prefixDescriptorHandle = graph.importBuffer({
    id: 'prefix-descriptors',
    byteLength: 20,
    usage: Buffer.STORAGE
  });
  const suffixDescriptorHandle = graph.importBuffer({
    id: 'suffix-descriptors',
    byteLength: 20,
    usage: Buffer.STORAGE
  });
  const prefixLengthHandle = graph.importBuffer({
    id: 'prefix-lengths',
    byteLength: 16,
    usage: Buffer.STORAGE
  });
  const suffixLengthHandle = graph.importBuffer({
    id: 'suffix-lengths',
    byteLength: 16,
    usage: Buffer.STORAGE
  });
  const valueOffsetHandle = graph.importBuffer({
    id: 'value-offsets',
    byteLength: 16,
    usage: Buffer.STORAGE
  });
  const outputHandle = graph.importBuffer({id: 'output', byteLength: 16, usage: Buffer.STORAGE});
  const decoder = new GPUParquetDeltaByteArrayDecoder({
    input: graph.createDataView(inputHandle, {format: 'uint32', length: 14}),
    prefixMiniBlockDescriptors: graph.createDataView(prefixDescriptorHandle, {
      format: 'uint32',
      length: 5
    }),
    suffixMiniBlockDescriptors: graph.createDataView(suffixDescriptorHandle, {
      format: 'uint32',
      length: 5
    }),
    prefixLengths: graph.createDataView(prefixLengthHandle, {format: 'uint32', length: 4}),
    suffixLengths: graph.createDataView(suffixLengthHandle, {format: 'uint32', length: 4}),
    valueOffsets: graph.createDataView(valueOffsetHandle, {format: 'uint32', length: 4}),
    output: graph.createDataView(outputHandle, {format: 'uint32', length: 4}),
    encodedByteLength: ENCODED.length,
    suffixDataByteOffset: plan.suffixDataByteOffset,
    suffixDataByteLength: plan.suffixDataByteLength,
    outputByteCapacity: 16,
    valueCount: 4,
    prefixDescriptorCount: 1,
    suffixDescriptorCount: 1,
    firstPrefixLength: 0,
    firstSuffixLength: 3
  });
  const valueLengthHandle = graph.importBuffer({
    id: 'test-value-lengths',
    byteLength: 16,
    usage: Buffer.STORAGE
  });
  const suffixOffsetHandle = graph.importBuffer({
    id: 'test-suffix-offsets',
    byteLength: 16,
    usage: Buffer.STORAGE
  });
  const source = getGPUParquetDeltaByteArrayReconstructionShaderSource(
    decoder,
    graph.createDataView(valueLengthHandle, {format: 'uint32', length: 4}),
    graph.createDataView(suffixOffsetHandle, {format: 'uint32', length: 4}),
    {x: 1, y: 1, z: 1}
  );
  testCase.deepEqual(
    new WgslReflect(source).entry.compute.map(entry => entry.name),
    ['main']
  );
  testCase.match(source, /position >= prefixLength/);
  testCase.match(source, /row -= 1u/);
  testCase.doesNotThrow(() => decoder.addToGraph(graph));
  testCase.ok(addComputePass.mock.calls.length >= 7);
  testCase.equal(
    addComputePass.mock.calls.at(-1)?.[0].id,
    'gpu-parquet-delta-byte-array-reconstruct'
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
