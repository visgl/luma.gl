// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {makeGPUVectorFromArrow} from '@luma.gl/arrow';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {GPUTableComputation} from '@luma.gl/experimental/gpu-tables';
import {Buffer, type ComputeShaderLayout, type Device} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

const COMPUTE_SHADER = /* wgsl */ `\
@group(0) @binding(0) var<storage, read_write> values : array<i32>;

@compute @workgroup_size(1)
fn computeMain(@builtin(global_invocation_id) globalInvocationId : vec3<u32>) {
  values[globalInvocationId.x] = values[globalInvocationId.x] * 3;
}
`;

const COMPUTE_SHADER_LAYOUT = {
  bindings: [{name: 'values', type: 'storage', group: 0, location: 0}]
} satisfies ComputeShaderLayout;

it('GPUTableComputation binds inputVectors for storage compute', async () => {
  const device = await getWebGPUTestDevice();
  if (!device || isSoftwareBackedDevice(device)) {
    void 0;
    void 0;
    return;
  }

  const values = makeGPUVectorFromArrow(device, arrow.makeVector(new Int32Array([2, 4, 6])), {
    name: 'values'
  });
  const computation = new GPUTableComputation(device, {
    source: COMPUTE_SHADER,
    shaderLayout: COMPUTE_SHADER_LAYOUT,
    inputVectors: {values}
  });

  const computePass = device.beginComputePass({});
  computation.dispatchBatches(computePass, batch => batch.numRows);
  computePass.end();
  device.submit();

  const computedValues = await readInt32GPUVector(values);
  expect(Array.from(computedValues), 'dispatches with input vector storage bindings').toEqual([
    6, 12, 18
  ]);

  computation.destroy();
  values.destroy();
  void 0;
});

function isSoftwareBackedDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}

async function readInt32GPUVector(vector: GPUVector): Promise<Int32Array> {
  const data = vector.data[0];
  const bytes = await data.buffer.readAsync(data.byteOffset, data.length * data.byteStride);
  return new Int32Array(bytes.buffer, bytes.byteOffset, vector.length);
}

it('GPUTableComputation binds aligned per-batch views and rejects unaligned ones', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    skip('WebGPU unavailable');
    return;
  }
  // WebGPU's default minStorageBufferOffsetAlignment is 256 bytes, or 64 int32 rows.
  const alignedRowOffset = device.limits.minStorageBufferOffsetAlignment / 4;
  const initialValues = Int32Array.from({length: alignedRowOffset * 2}, (_, index) => index);
  const buffer = device.createBuffer({
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST,
    data: initialValues
  });
  const makeValues = (rowOffsets: number[]) =>
    new GPUVector({
      type: 'data',
      name: 'values',
      format: 'sint32',
      data: rowOffsets.map(
        rowOffset => new GPUData({buffer, format: 'sint32', length: 2, byteOffset: rowOffset * 4})
      ),
      ownsData: false
    });

  const computation = new GPUTableComputation(device, {
    source: COMPUTE_SHADER,
    shaderLayout: COMPUTE_SHADER_LAYOUT,
    inputVectors: {values: makeValues([0, alignedRowOffset])}
  });
  const computePass = device.beginComputePass({});
  computation.dispatchBatches(computePass, batch => batch.numRows);
  computePass.end();
  device.submit();
  const bytes = await buffer.readAsync();
  const values = new Int32Array(bytes.buffer, bytes.byteOffset, initialValues.length);
  expect(
    [values[0], values[1], values[2], values[alignedRowOffset], values[alignedRowOffset + 1]],
    'each aligned batch view is bound at its own byte offset'
  ).toEqual([0, 3, 2, alignedRowOffset * 3, (alignedRowOffset + 1) * 3]);

  // A view that starts one row past the alignment cannot be bound at its own byte offset.
  const unalignedComputation = new GPUTableComputation(device, {
    source: COMPUTE_SHADER,
    shaderLayout: COMPUTE_SHADER_LAYOUT,
    inputVectors: {values: makeValues([0, alignedRowOffset + 1])}
  });
  const unalignedPass = device.beginComputePass({});
  expect(() => unalignedComputation.dispatchBatches(unalignedPass, 1)).toThrow();
  unalignedPass.end();

  computation.destroy();
  unalignedComputation.destroy();
  buffer.destroy();
});
