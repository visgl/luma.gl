// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {webgpuDevice, getTestDevices} from '@luma.gl/test-utils';
import {ComputePipeline, Buffer} from '@luma.gl/core';

const source = /* WGSL*/ `\
@group(0) @binding(0) var<storage, read_write> data: array<i32>;

@compute @workgroup_size(1) fn main(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  let i = id.x;
  data[i] = 2 * data[i];
}
`;

test('ComputePipeline construct/delete', async t => {
  await getTestDevices();
  const shader = webgpuDevice.createShader({source});
  const computePipeline = webgpuDevice.createComputePipeline({shader});
  t.ok(computePipeline instanceof ComputePipeline, 'ComputePipeline construction successful');
  computePipeline.destroy();
  t.ok(computePipeline instanceof ComputePipeline, 'ComputePipeline delete successful');
  computePipeline.destroy();
  t.ok(computePipeline instanceof ComputePipeline, 'ComputePipeline repeated delete successful');
  t.end();
});

test('ComputePipeline compute', async t => {
  await getTestDevices();
  const shader = webgpuDevice.createShader({source});
  const computePipeline = webgpuDevice.createComputePipeline({
    shader,
    shaderLayout: {
      bindings: [{name: 'data', type: 'storage', location: 0}]
    }
  });

  const workBuffer = webgpuDevice.createBuffer({
    id: 'work buffer',
    byteLength: 4,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });

  workBuffer.write(new Int32Array([2]));
  const inputData = new Int32Array(await workBuffer.readAsync());
  t.equal(inputData[0], 2, 'Input data is correct');

  computePipeline.setBindings({data: workBuffer});

  const computePass = webgpuDevice.beginComputePass({});
  computePass.setPipeline(computePipeline);
  computePass.dispatch(1);
  computePass.end();

  webgpuDevice.submit();

  const computedData = new Int32Array(await workBuffer.readAsync());
  t.equal(computedData[0], 4, 'Computed data is correct');

  t.end();
});
