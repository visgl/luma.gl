// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUParquetDeltaLengthByteArrayDecoder,
  parseParquetDeltaLengthByteArrayPlan
} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {vi} from 'vitest';
import {expect, it} from 'vitest';

const ENCODED_LENGTHS = Uint8Array.from([
  128, 1, 4, 3, 6, 3, 3, 0, 0, 0, 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
]);
const ENCODED = Uint8Array.from([...ENCODED_LENGTHS, 99, 97, 116, 100, 111, 103, 115, 101]);

it('parseParquetDeltaLengthByteArrayPlan locates the contiguous payload', () => {
  const plan = parseParquetDeltaLengthByteArrayPlan(ENCODED);
  expect(plan.lengthPlan.valueCount).toBe(3);
  expect(plan.lengthPlan.firstValue).toBe(3);
  expect(plan.payloadByteOffset).toBe(ENCODED_LENGTHS.length);
  expect(plan.payloadByteLength).toBe(8);
});

it('GPUParquetDeltaLengthByteArrayDecoder composes decode and exclusive scan', () => {
  const plan = parseParquetDeltaLengthByteArrayPlan(ENCODED);
  const graph = new GPUCommandGraph(makeSupportDevice());
  const addComputePass = vi.spyOn(graph, 'addComputePass');
  const inputHandle = graph.importBuffer({id: 'input', byteLength: 32, usage: Buffer.STORAGE});
  const descriptorHandle = graph.importBuffer({
    id: 'descriptors',
    byteLength: plan.lengthPlan.miniBlockDescriptors.byteLength,
    usage: Buffer.STORAGE
  });
  const lengthHandle = graph.importBuffer({id: 'lengths', byteLength: 12, usage: Buffer.STORAGE});
  const offsetHandle = graph.importBuffer({id: 'offsets', byteLength: 12, usage: Buffer.STORAGE});
  new GPUParquetDeltaLengthByteArrayDecoder({
    input: graph.createDataView(inputHandle, {format: 'uint32', length: 8}),
    miniBlockDescriptors: graph.createDataView(descriptorHandle, {
      format: 'uint32',
      length: plan.lengthPlan.miniBlockDescriptors.length
    }),
    lengths: graph.createDataView(lengthHandle, {format: 'uint32', length: 3}),
    offsets: graph.createDataView(offsetHandle, {format: 'uint32', length: 3}),
    encodedByteLength: plan.lengthPlan.bytesConsumed,
    valueCount: 3,
    descriptorCount: plan.lengthPlan.descriptorCount,
    firstValue: plan.lengthPlan.firstValue
  }).addToGraph(graph);
  expect(addComputePass.mock.calls.length >= 3).toBe(true);
  expect(addComputePass.mock.calls[0][0].id).toBe(
    'gpu-parquet-delta-length-byte-array-lengths-unpack'
  );
  expect(addComputePass.mock.calls.at(-1)?.[0].id ?? '').toMatch(/offsets/);
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
