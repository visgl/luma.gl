// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {webgpuAdapter} from '@luma.gl/webgpu';

/** WebGPU spec default for `maxStorageBuffersPerShaderStage`. */
const DEFAULT_STORAGE_BUFFERS_PER_SHADER_STAGE = 8;
/** Above the default and below common adapter maximums (SwiftShader offers 10). */
const REQUESTED_STORAGE_BUFFERS_PER_SHADER_STAGE = DEFAULT_STORAGE_BUFFERS_PER_SHADER_STAGE + 1;

async function getAdapterStorageBuffersPerShaderStage(): Promise<number | null> {
  if (typeof navigator === 'undefined' || !navigator.gpu) {
    return null;
  }
  const gpuAdapter = await navigator.gpu.requestAdapter();
  return gpuAdapter?.limits.maxStorageBuffersPerShaderStage ?? null;
}

function getStorageBindingSource(bindingCount: number): string {
  const declarations: string[] = [];
  const writes: string[] = [];
  for (let bindingIndex = 0; bindingIndex < bindingCount; bindingIndex++) {
    declarations.push(
      `@group(0) @binding(${bindingIndex}) var<storage, read_write> data${bindingIndex}: array<u32>;`
    );
    writes.push(`  data${bindingIndex}[0] = ${bindingIndex}u;`);
  }
  return `\
${declarations.join('\n')}

@compute @workgroup_size(1)
fn main() {
${writes.join('\n')}
}
`;
}

async function getPipelineValidationError(
  gpuDevice: GPUDevice,
  bindingCount: number
): Promise<GPUError | null> {
  gpuDevice.pushErrorScope('validation');
  gpuDevice.createComputePipeline({
    layout: 'auto',
    compute: {
      module: gpuDevice.createShaderModule({code: getStorageBindingSource(bindingCount)}),
      entryPoint: 'main'
    }
  });
  return await gpuDevice.popErrorScope();
}

it('WebGPUDevice requiredLimits caps the device at the requested limit', async context => {
  const adapterStorageBuffers = await getAdapterStorageBuffersPerShaderStage();
  // The cap is only observable on an adapter that offers more than the requested value
  if (
    adapterStorageBuffers === null ||
    adapterStorageBuffers <= REQUESTED_STORAGE_BUFFERS_PER_SHADER_STAGE
  ) {
    context.skip();
  }

  const device = await webgpuAdapter.create({
    requiredLimits: {maxStorageBuffersPerShaderStage: REQUESTED_STORAGE_BUFFERS_PER_SHADER_STAGE}
  });
  try {
    expect(device.limits.maxStorageBuffersPerShaderStage).toBe(
      REQUESTED_STORAGE_BUFFERS_PER_SHADER_STAGE
    );
    expect(
      await getPipelineValidationError(device.handle, REQUESTED_STORAGE_BUFFERS_PER_SHADER_STAGE),
      'pipeline within the requested limit'
    ).toBeNull();
    expect(
      await getPipelineValidationError(
        device.handle,
        REQUESTED_STORAGE_BUFFERS_PER_SHADER_STAGE + 1
      ),
      'pipeline above the requested limit, although the adapter supports it'
    ).toBeInstanceOf(GPUValidationError);
  } finally {
    device.destroy();
  }
});

it('WebGPUDevice requiredLimits below the spec default yield the default', async context => {
  if ((await getAdapterStorageBuffersPerShaderStage()) === null) {
    context.skip();
  }

  const device = await webgpuAdapter.create({
    requiredLimits: {maxStorageBuffersPerShaderStage: 4}
  });
  try {
    expect(device.limits.maxStorageBuffersPerShaderStage).toBe(
      DEFAULT_STORAGE_BUFFERS_PER_SHADER_STAGE
    );
  } finally {
    device.destroy();
  }
});
