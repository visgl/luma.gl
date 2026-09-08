// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice, getWebGPUTestDevices} from '@luma.gl/test-utils';
import {
  luma,
  ComputePipeline,
  Buffer,
  PipelineFactory,
  _getDefaultBindGroupFactory,
  type Device
} from '@luma.gl/core';
import {webgpuAdapter, type WebGPUDevice} from '@luma.gl/webgpu';

const CPU_HOTSPOT_PROFILER_MODULE = 'cpu-hotspot-profiler';

const source = /* WGSL*/ `\
@group(2) @binding(0) var<storage, read_write> data: array<i32>;

@compute @workgroup_size(1) fn main(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  let i = id.x;
  data[i] = 2 * data[i];
}
`;

const sharedSource = /* WGSL */ `\
${source}

@vertex
fn firstVertex(@location(0) firstPosition: vec2f) -> @builtin(position) vec4f {
  return vec4f(firstPosition, 0.0, 1.0);
}

@vertex
fn secondVertex(@location(1) secondPosition: vec3f) -> @builtin(position) vec4f {
  return vec4f(secondPosition, 1.0);
}
`;

const unsupportedSource = /* WGSL */ `\
@group(0) @binding(0) var textures: binding_array<texture_2d<f32>>;
@compute @workgroup_size(1) fn main() {}
`;

it('ComputePipeline#construct/delete', async () => {
  const webgpuDevices = await getWebGPUTestDevices();

  for (const webgpuDevice of webgpuDevices) {
    const label = webgpuDevice.info.featureLevel;
    const shader = webgpuDevice.createShader({source: sharedSource});
    const computePipeline = webgpuDevice.createComputePipeline({shader});
    expect(
      Boolean(computePipeline instanceof ComputePipeline),
      `${label}: ComputePipeline construction successful`
    ).toBe(true);
    expect(
      computePipeline.shaderLayout.bindings,
      `${label}: raw compute pipeline uses the lightweight WGSL scanner`
    ).toEqual([{name: 'data', type: 'storage', group: 2, location: 0}]);
    computePipeline.destroy();
    expect(
      Boolean(computePipeline instanceof ComputePipeline),
      `${label}: ComputePipeline delete successful`
    ).toBe(true);
    computePipeline.destroy();
    expect(
      Boolean(computePipeline instanceof ComputePipeline),
      `${label}: ComputePipeline repeated delete successful`
    ).toBe(true);
  }
  void 0;
});

it('ComputePipeline requires a layout when lightweight WGSL scanning is unsafe', async () => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    void 0;
    void 0;
    return;
  }

  const shader = webgpuDevice.createShader({source: unsupportedSource});
  expect(
    () => webgpuDevice.createComputePipeline({shader}),
    'raw compute pipeline rejects WGSL that cannot be scanned safely'
  ).toThrow(/assertion failed/);

  shader.destroy();
  void 0;
});

it('ComputePipeline#compute', async () => {
  const webgpuDevices = await getWebGPUTestDevices();

  for (const webgpuDevice of webgpuDevices) {
    const label = webgpuDevice.info.featureLevel;
    const shader = webgpuDevice.createShader({source});
    const computePipeline = webgpuDevice.createComputePipeline({
      shader,
      shaderLayout: {
        bindings: [{name: 'data', type: 'storage', group: 2, location: 0}]
      }
    });

    const workBuffer = webgpuDevice.createBuffer({
      id: 'work buffer',
      byteLength: 4,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });

    workBuffer.write(new Int32Array([2]));
    const inputData = new Int32Array(await workBuffer.readAsync());
    expect(inputData[0], `${label}: Input data is correct`).toBe(2);

    computePipeline.setBindings({data: workBuffer});

    const computePass = webgpuDevice.beginComputePass({});
    computePass.setPipeline(computePipeline);
    computePass.dispatch(1);
    computePass.end();

    webgpuDevice.submit();

    const computedData = new Int32Array(await workBuffer.readAsync());
    expect(computedData[0], `${label}: Computed data is correct`).toBe(4);

    computePipeline.destroy();
    shader.destroy();
  }
  void 0;
});

it.skip('ComputePipeline bind-group creation respects WebGPU debug-scoped validation gating', async () => {
  const debugDevice = await getWebGPUTestDevice();
  const nonDebugDevice = await makeWebGPUComputeTestDevice(
    'webgpu-compute-test-device-nondebug',
    false
  );

  if (!debugDevice || !nonDebugDevice) {
    void 0;
    nonDebugDevice?.destroy();
    void 0;
    return;
  }

  await runComputePipeline(debugDevice);
  const debugProfiler = getProfiler(debugDevice);
  expect(
    Boolean((debugProfiler.errorScopePushCount || 0) > 0),
    'webgpu debug compute path records scoped validation for bind-group creation'
  ).toBe(true);

  await runComputePipeline(nonDebugDevice);
  const nonDebugProfiler = getProfiler(nonDebugDevice);
  expect(
    nonDebugProfiler.errorScopePushCount || 0,
    'webgpu non-debug compute path skips scoped validation for bind-group creation'
  ).toBe(0);
  expect(
    nonDebugProfiler.errorScopePopCount || 0,
    'webgpu non-debug compute path skips scoped validation pop calls'
  ).toBe(0);

  nonDebugDevice.destroy();
  void 0;
});

it('ComputePipeline bind-group cache only invalidates when binding identities change', async () => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    void 0;
    void 0;
    return;
  }

  const shader = webgpuDevice.createShader({source});
  const computePipeline = webgpuDevice.createComputePipeline({
    shader,
    shaderLayout: {
      bindings: [{name: 'data', type: 'storage', group: 2, location: 0}]
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
  const bindGroupFactory = _getDefaultBindGroupFactory(webgpuDevice);
  const firstBindGroup = bindGroupFactory.getBindGroups(
    computePipeline as any,
    (computePipeline as any)._getBindingsByGroupWebGPU(),
    (computePipeline as any)._getBindGroupCacheKeysWebGPU()
  )[2];

  computePipeline.setBindings({data: firstBuffer});
  const secondBindGroup = bindGroupFactory.getBindGroups(
    computePipeline as any,
    (computePipeline as any)._getBindingsByGroupWebGPU(),
    (computePipeline as any)._getBindGroupCacheKeysWebGPU()
  )[2];
  expect(
    secondBindGroup,
    'compute bind group is reused when binding object identities are unchanged'
  ).toBe(firstBindGroup);

  computePipeline.setBindings({data: secondBuffer});
  const thirdBindGroup = bindGroupFactory.getBindGroups(
    computePipeline as any,
    (computePipeline as any)._getBindingsByGroupWebGPU(),
    (computePipeline as any)._getBindGroupCacheKeysWebGPU()
  )[2];
  expect(
    thirdBindGroup,
    'compute bind group is rebuilt when a binding object identity changes'
  ).not.toBe(firstBindGroup);

  computePipeline.setBindings({data: secondBuffer});
  const fourthBindGroup = bindGroupFactory.getBindGroups(
    computePipeline as any,
    (computePipeline as any)._getBindingsByGroupWebGPU(),
    (computePipeline as any)._getBindGroupCacheKeysWebGPU()
  )[2];
  expect(
    fourthBindGroup,
    'compute bind group is reused again after the rebuilt group is cached'
  ).toBe(thirdBindGroup);

  secondBuffer.destroy();
  firstBuffer.destroy();
  computePipeline.destroy();
  shader.destroy();
  void 0;
});

it('ComputePipeline cache differentiates explicit shader layouts for identical WGSL source', async () => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    void 0;
    void 0;
    return;
  }

  const pipelineFactory = new PipelineFactory(webgpuDevice);
  const shader = webgpuDevice.createShader({source});

  const firstPipeline = pipelineFactory.createComputePipeline({
    shader,
    shaderLayout: {
      bindings: [{name: 'data', type: 'storage', group: 2, location: 0}]
    }
  });
  const secondPipeline = pipelineFactory.createComputePipeline({
    shader,
    shaderLayout: {
      bindings: [{name: 'alternateData', type: 'storage', group: 2, location: 0}]
    }
  });

  expect(
    firstPipeline,
    'compute pipeline cache does not alias different explicit shader layouts'
  ).not.toBe(secondPipeline);

  pipelineFactory.release(firstPipeline);
  pipelineFactory.release(secondPipeline);
  shader.destroy();
  void 0;
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
