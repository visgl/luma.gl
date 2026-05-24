// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {makeArrowGPUVector, readArrowGPUVectorAsync} from '@luma.gl/arrow';
import {GPUTableComputation} from '@luma.gl/tables';
import type {ComputeShaderLayout, Device} from '@luma.gl/core';
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

test('GPUTableComputation binds inputVectors for storage compute', async t => {
  const device = await getWebGPUTestDevice();
  if (!device || isSoftwareBackedDevice(device)) {
    t.comment('Skipping GPUTableComputation storage test without hardware WebGPU');
    t.end();
    return;
  }

  const values = makeArrowGPUVector(device, arrow.makeVector(new Int32Array([2, 4, 6])), {
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

  const computedValues = await readArrowGPUVectorAsync(values);
  t.deepEqual(
    Array.from(computedValues.toArray() as Int32Array),
    [6, 12, 18],
    'dispatches with input vector storage bindings'
  );

  computation.destroy();
  values.destroy();
  t.end();
});

function isSoftwareBackedDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}
