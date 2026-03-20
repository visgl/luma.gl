// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {luma, ComputePipeline, Buffer, type Device} from '@luma.gl/core';
import {webgpuAdapter, type WebGPUDevice} from '@luma.gl/webgpu';

const CPU_HOTSPOT_PROFILER_MODULE = 'cpu-hotspot-profiler';

const source = /* WGSL*/ `\
@group(0) @binding(0) var<storage, read_write> data: array<i32>;

@compute @workgroup_size(1) fn main(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  let i = id.x;
  data[i] = 2 * data[i];
}
`;

test('ComputePipeline#construct/delete', async t => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (webgpuDevice) {
    const shader = webgpuDevice.createShader({source});
    const computePipeline = webgpuDevice.createComputePipeline({shader});
    t.ok(computePipeline instanceof ComputePipeline, 'ComputePipeline construction successful');
    computePipeline.destroy();
    t.ok(computePipeline instanceof ComputePipeline, 'ComputePipeline delete successful');
    computePipeline.destroy();
    t.ok(computePipeline instanceof ComputePipeline, 'ComputePipeline repeated delete successful');
  }
  t.end();
});

test('ComputePipeline#compute', async t => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (webgpuDevice) {
    const shader = webgpuDevice.createShader({source});
    const computePipeline = webgpuDevice.createComputePipeline({
      shader,
      shaderLayout: {
        bindings: [{name: 'data', type: 'storage', group: 0, location: 0}]
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

    computePipeline.destroy();
    shader.destroy();
  }
  t.end();
});

test('ComputePipeline bind-group creation respects WebGPU debug-scoped validation gating', async t => {
  const debugDevice = await getWebGPUTestDevice();
  const nonDebugDevice = await makeWebGPUComputeTestDevice(
    'webgpu-compute-test-device-nondebug',
    false
  );

  if (!debugDevice || !nonDebugDevice) {
    t.comment('WebGPU is not available');
    nonDebugDevice?.destroy();
    t.end();
    return;
  }

  await runComputePipeline(debugDevice);
  const debugProfiler = getProfiler(debugDevice);
  t.ok(
    (debugProfiler.errorScopePushCount || 0) > 0,
    'webgpu debug compute path records scoped validation for bind-group creation'
  );

  await runComputePipeline(nonDebugDevice);
  const nonDebugProfiler = getProfiler(nonDebugDevice);
  t.equal(
    nonDebugProfiler.errorScopePushCount || 0,
    0,
    'webgpu non-debug compute path skips scoped validation for bind-group creation'
  );
  t.equal(
    nonDebugProfiler.errorScopePopCount || 0,
    0,
    'webgpu non-debug compute path skips scoped validation pop calls'
  );

  nonDebugDevice.destroy();
  t.end();
});

test('ComputePipeline bind-group cache only invalidates when binding identities change', async t => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const shader = webgpuDevice.createShader({source});
  const computePipeline = webgpuDevice.createComputePipeline({
    shader,
    shaderLayout: {
      bindings: [{name: 'data', type: 'storage', group: 0, location: 0}]
    }
  });

  const firstBuffer = webgpuDevice.createBuffer({
    id: 'first-work-buffer',
    byteLength: 4,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  const secondBuffer = webgpuDevice.createBuffer({
    id: 'second-work-buffer',
    byteLength: 4,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });

  computePipeline.setBindings({data: firstBuffer});
  const firstBindGroup = (computePipeline as any)._getBindGroup();

  computePipeline.setBindings({data: firstBuffer});
  const secondBindGroup = (computePipeline as any)._getBindGroup();
  t.equal(
    secondBindGroup,
    firstBindGroup,
    'compute bind group is reused when binding object identities are unchanged'
  );

  computePipeline.setBindings({data: secondBuffer});
  t.equal(
    (computePipeline as any)._bindGroup,
    null,
    'compute bind group cache is cleared on change'
  );
  const thirdBindGroup = (computePipeline as any)._getBindGroup();
  t.notEqual(
    thirdBindGroup,
    firstBindGroup,
    'compute bind group is rebuilt when a binding object identity changes'
  );

  computePipeline.setBindings({data: secondBuffer});
  const fourthBindGroup = (computePipeline as any)._getBindGroup();
  t.equal(
    fourthBindGroup,
    thirdBindGroup,
    'compute bind group is reused again after the rebuilt group is cached'
  );

  secondBuffer.destroy();
  firstBuffer.destroy();
  computePipeline.destroy();
  shader.destroy();
  t.end();
});

async function runComputePipeline(device: WebGPUDevice): Promise<void> {
  resetProfiler(device);

  const shader = device.createShader({source});
  const computePipeline = device.createComputePipeline({
    shader,
    shaderLayout: {
      bindings: [{name: 'data', type: 'storage', group: 0, location: 0}]
    }
  });

  const workBuffer = device.createBuffer({
    id: 'work buffer',
    byteLength: 4,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });

  workBuffer.write(new Int32Array([2]));
  computePipeline.setBindings({data: workBuffer});

  const computePass = device.beginComputePass({});
  computePass.setPipeline(computePipeline);
  computePass.dispatch(1);
  computePass.end();

  device.submit();
  await workBuffer.readAsync();

  workBuffer.destroy();
  computePipeline.destroy();
  shader.destroy();
}

function getProfiler(device: Device): {
  enabled?: boolean;
  errorScopePushCount?: number;
  errorScopePopCount?: number;
} {
  device.userData[CPU_HOTSPOT_PROFILER_MODULE] ||= {};
  return device.userData[CPU_HOTSPOT_PROFILER_MODULE] as {
    enabled?: boolean;
    errorScopePushCount?: number;
    errorScopePopCount?: number;
  };
}

function resetProfiler(device: Device): void {
  const profiler = getProfiler(device);
  for (const key of Object.keys(profiler)) {
    delete profiler[key as keyof typeof profiler];
  }
  profiler.enabled = true;
}

async function makeWebGPUComputeTestDevice(
  id: string,
  debug: boolean
): Promise<WebGPUDevice | null> {
  try {
    return (await luma.createDevice({
      id,
      type: 'webgpu',
      adapters: [webgpuAdapter],
      createCanvasContext: {width: 1, height: 1},
      debug
    })) as WebGPUDevice;
  } catch {
    return null;
  }
}
