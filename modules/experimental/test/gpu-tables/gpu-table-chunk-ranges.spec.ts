// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, type ComputeShaderLayout} from '@luma.gl/core';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {GPUTableComputation} from '@luma.gl/experimental/gpu-tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

const TRIPLE_COMPUTE_SHADER = /* wgsl */ `\
@group(0) @binding(0) var<storage, read_write> values : array<i32>;

@compute @workgroup_size(1)
fn computeMain(@builtin(global_invocation_id) globalInvocationId : vec3<u32>) {
  values[globalInvocationId.x] = values[globalInvocationId.x] * 3;
}
`;

const TRIPLE_COMPUTE_SHADER_LAYOUT = {
  bindings: [{name: 'values', type: 'storage', group: 0, location: 0}]
} satisfies ComputeShaderLayout;

it('GPUTableComputation skips empty batches and dispatches the remaining batches', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    skip('WebGPU unavailable');
    return;
  }
  const batchValues = [new Int32Array([2, 4]), new Int32Array(0), new Int32Array([6])];
  // Empty batches still need a backing buffer, but WebGPU rejects zero-size storage bindings.
  const buffers = batchValues.map(values =>
    device.createBuffer({
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST,
      data: values.length > 0 ? values : new Int32Array(1)
    })
  );
  const values = new GPUVector({
    type: 'data',
    name: 'values',
    format: 'sint32',
    data: batchValues.map(
      (batch, batchIndex) =>
        new GPUData({buffer: buffers[batchIndex], format: 'sint32', length: batch.length})
    ),
    ownsData: false
  });
  const computation = new GPUTableComputation(device, {
    source: TRIPLE_COMPUTE_SHADER,
    shaderLayout: TRIPLE_COMPUTE_SHADER_LAYOUT,
    inputVectors: {values}
  });
  const dispatchedBatchIndices: number[] = [];

  const computePass = device.beginComputePass({});
  computation.dispatchBatches(computePass, batch => {
    dispatchedBatchIndices.push(batch.batchIndex);
    return batch.numRows;
  });
  computePass.end();
  device.submit();

  expect(
    await readInt32Values(buffers[0], 2),
    'dispatches the batch before the empty batch'
  ).toEqual([6, 12]);
  expect(
    await readInt32Values(buffers[2], 1),
    'dispatches the batch after the empty batch'
  ).toEqual([18]);
  expect(dispatchedBatchIndices, 'does not dispatch the empty batch').toEqual([0, 2]);
  expect(values.data.length, 'preserves the empty output chunk').toBe(3);

  computation.destroy();
  values.destroy();
  for (const buffer of buffers) {
    buffer.destroy();
  }
});

async function readInt32Values(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync(0, length * Int32Array.BYTES_PER_ELEMENT);
  return Array.from(new Int32Array(bytes.buffer, bytes.byteOffset, length));
}
