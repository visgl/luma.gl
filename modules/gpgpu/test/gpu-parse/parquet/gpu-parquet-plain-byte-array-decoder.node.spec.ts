// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUParquetPlainByteArrayDecoder,
  parseParquetPlainByteArrayPlan
} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {expect, it, vi} from 'vitest';

const ENCODED = Uint8Array.from([
  0, 0, 0, 0, 3, 0, 0, 0, 99, 97, 116, 1, 0, 0, 0, 100, 5, 0, 0, 0, 104, 111, 114, 115, 101
]);

it('parseParquetPlainByteArrayPlan exposes generic byte ranges', () => {
  const plan = parseParquetPlainByteArrayPlan(ENCODED, 4);
  expect(Array.from(plan.sourceOffsets)).toEqual([4, 8, 15, 20]);
  expect(Array.from(plan.valueLengths)).toEqual([0, 3, 1, 5]);
  expect(Array.from(plan.valueOffsets)).toEqual([0, 0, 3, 4]);
  expect(plan.bytesConsumed).toBe(ENCODED.length);
  expect(plan.outputByteLength).toBe(9);
  expect(() => parseParquetPlainByteArrayPlan(ENCODED.subarray(0, 23), 4)).toThrow(/truncated/);
});

it('GPUParquetPlainByteArrayDecoder delegates to GPUByteRangeGather', () => {
  const graph = new GPUCommandGraph(makeSupportDevice());
  const addComputePass = vi.spyOn(graph, 'addComputePass');
  const makeView = (id: string, length: number) => {
    const handle = graph.importBuffer({id, byteLength: length * 4, usage: Buffer.STORAGE});
    return graph.createDataView(handle, {format: 'uint32', length});
  };
  new GPUParquetPlainByteArrayDecoder({
    input: makeView('input', 7),
    sourceOffsets: makeView('sources', 4),
    valueLengths: makeView('lengths', 4),
    valueOffsets: makeView('offsets', 4),
    output: makeView('output', 3),
    encodedByteLength: ENCODED.length,
    outputByteLength: 9
  }).addToGraph(graph);
  expect(addComputePass.mock.calls[0][0].workload?.operation).toBe('GPUByteRangeGather');
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
