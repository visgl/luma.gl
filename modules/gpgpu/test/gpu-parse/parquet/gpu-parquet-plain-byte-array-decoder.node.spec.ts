// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUParquetPlainByteArrayDecoder,
  parseParquetPlainByteArrayPlan
} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import test from 'test/utils/vitest-tape';
import {vi} from 'vitest';

const ENCODED = Uint8Array.from([
  0, 0, 0, 0, 3, 0, 0, 0, 99, 97, 116, 1, 0, 0, 0, 100, 5, 0, 0, 0, 104, 111, 114, 115, 101
]);

test('parseParquetPlainByteArrayPlan exposes generic byte ranges', testCase => {
  const plan = parseParquetPlainByteArrayPlan(ENCODED, 4);
  testCase.deepEqual(Array.from(plan.sourceOffsets), [4, 8, 15, 20]);
  testCase.deepEqual(Array.from(plan.valueLengths), [0, 3, 1, 5]);
  testCase.deepEqual(Array.from(plan.valueOffsets), [0, 0, 3, 4]);
  testCase.equal(plan.bytesConsumed, ENCODED.length);
  testCase.equal(plan.outputByteLength, 9);
  testCase.throws(() => parseParquetPlainByteArrayPlan(ENCODED.subarray(0, 23), 4), /truncated/);
  testCase.end();
});

test('GPUParquetPlainByteArrayDecoder delegates to GPUByteRangeGather', testCase => {
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
  testCase.equal(addComputePass.mock.calls[0][0].workload?.operation, 'GPUByteRangeGather');
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
