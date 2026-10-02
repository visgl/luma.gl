// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {afterEach, beforeAll, beforeEach, expect, it, vi} from 'vitest';
import {Buffer, luma} from '@luma.gl/core';
import {webgpuAdapter, type WebGPUDevice} from '@luma.gl/webgpu';

const ELEMENTS_PER_BINDING = 4;

const gpuDevices: GPUDevice[] = [];
const canvasContexts: GPUCanvasContext[] = [];
/** Each GPUAdapter can create only one device, so every test gets a fresh adapter. */
let testGPUAdapter: GPUAdapter | null = null;

beforeAll(() => {
  // A missing WebGPU implementation must fail these tests instead of skipping them.
  expect(navigator.gpu, 'navigator.gpu').toBeTruthy();
});

beforeEach(async context => {
  testGPUAdapter = await navigator.gpu.requestAdapter();
  // Headless Chromium can transiently return no adapter (for example while its GPU
  // connection is restored). That is an environment limitation, not attach() behavior.
  if (!testGPUAdapter) {
    context.skip();
  }
});

afterEach(() => {
  // Release canvases before their devices, as an application would.
  for (const canvasContext of canvasContexts.splice(0)) {
    canvasContext.unconfigure();
  }
  for (const gpuDevice of gpuDevices.splice(0)) {
    gpuDevice.destroy();
  }
});

function requestGPUAdapter(): GPUAdapter {
  const gpuAdapter = testGPUAdapter!;
  testGPUAdapter = null;
  return gpuAdapter;
}

function createCanvasContext(): {canvas: HTMLCanvasElement; canvasContext: GPUCanvasContext} {
  const canvas = document.createElement('canvas');
  const canvasContext = canvas.getContext('webgpu')!;
  canvasContexts.push(canvasContext);
  return {canvas, canvasContext};
}

async function requestMaxStorageBufferDevice(): Promise<GPUDevice> {
  const gpuAdapter = requestGPUAdapter();
  const gpuDevice = await gpuAdapter.requestDevice({
    requiredLimits: {
      maxStorageBuffersPerShaderStage: gpuAdapter.limits.maxStorageBuffersPerShaderStage
    }
  });
  gpuDevices.push(gpuDevice);
  return gpuDevice;
}

function getStorageBindingSource(bindingCount: number): string {
  const declarations: string[] = [];
  const writes: string[] = [];
  for (let bindingIndex = 0; bindingIndex < bindingCount; bindingIndex++) {
    declarations.push(
      `@group(0) @binding(${bindingIndex}) var<storage, read_write> data${bindingIndex}: array<u32>;`
    );
    writes.push(`  data${bindingIndex}[id.x] = ${bindingIndex}u * 7u + id.x + 1u;`);
  }
  return `\
${declarations.join('\n')}

@compute @workgroup_size(${ELEMENTS_PER_BINDING})
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
${writes.join('\n')}
}
`;
}

function getExpectedBindingData(bindingIndex: number): Uint32Array {
  const expectedData = new Uint32Array(ELEMENTS_PER_BINDING);
  for (let elementIndex = 0; elementIndex < ELEMENTS_PER_BINDING; elementIndex++) {
    expectedData[elementIndex] = bindingIndex * 7 + elementIndex + 1;
  }
  return expectedData;
}

function createStorageBindingPipeline(device: WebGPUDevice, bindingCount: number) {
  const shader = device.createShader({source: getStorageBindingSource(bindingCount)});
  const computePipeline = device.createComputePipeline({
    shader,
    shaderLayout: {
      bindings: Array.from({length: bindingCount}, (_, bindingIndex) => ({
        name: `data${bindingIndex}`,
        type: 'storage' as const,
        group: 0,
        location: bindingIndex
      }))
    }
  });
  return {shader, computePipeline};
}

async function waitForFrames(frameCount: number): Promise<void> {
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
    await new Promise(resolve => requestAnimationFrame(resolve));
  }
}

it('WebGPUAdapter#attach reports limits and features from the attached GPUDevice', async () => {
  const gpuAdapter = requestGPUAdapter();
  const adapterFeature = Array.from(gpuAdapter.features)[0] as GPUFeatureName | undefined;
  const gpuDevice = await gpuAdapter.requestDevice({
    requiredLimits: {
      maxStorageBuffersPerShaderStage: gpuAdapter.limits.maxStorageBuffersPerShaderStage
    },
    requiredFeatures: adapterFeature ? [adapterFeature] : []
  });
  gpuDevices.push(gpuDevice);

  const device = (await luma.attachDevice(gpuDevice, {
    adapters: [webgpuAdapter]
  })) as WebGPUDevice;

  expect(device.type).toBe('webgpu');
  expect(device.handle).toBe(gpuDevice);
  expect(device.limits.maxStorageBuffersPerShaderStage).toBe(
    gpuAdapter.limits.maxStorageBuffersPerShaderStage
  );
  if (adapterFeature) {
    expect(device.features.has(adapterFeature as any), adapterFeature).toBe(true);
  }
  expect(await webgpuAdapter.attach(device)).toBe(device);
  device.destroy();
});

it('WebGPUAdapter#attach reports GPUDevice limits instead of adapter limits', async () => {
  const gpuAdapter = requestGPUAdapter();
  const gpuDevice = await gpuAdapter.requestDevice();
  gpuDevices.push(gpuDevice);

  const device = await webgpuAdapter.attach(gpuDevice);
  expect(device.limits.maxStorageBuffersPerShaderStage).toBe(
    gpuDevice.limits.maxStorageBuffersPerShaderStage
  );
  expect(device.limits.maxBufferSize).toBe(gpuDevice.limits.maxBufferSize);
  device.destroy();
});

it('WebGPUAdapter#attach validates a compute pipeline using every storage binding', async () => {
  const gpuDevice = await requestMaxStorageBufferDevice();
  const bindingCount = gpuDevice.limits.maxStorageBuffersPerShaderStage;
  const device = await webgpuAdapter.attach(gpuDevice);

  gpuDevice.pushErrorScope('validation');
  const {shader, computePipeline} = createStorageBindingPipeline(device, bindingCount);
  const buffers = Array.from({length: bindingCount}, (_, bindingIndex) =>
    device.createBuffer({
      id: `storage-binding-${bindingIndex}`,
      byteLength: ELEMENTS_PER_BINDING * Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    })
  );
  computePipeline.setBindings(
    Object.fromEntries(buffers.map((buffer, bindingIndex) => [`data${bindingIndex}`, buffer]))
  );
  const computePass = device.beginComputePass({});
  computePass.setPipeline(computePipeline);
  computePass.dispatch(1);
  computePass.end();
  device.submit();
  await gpuDevice.queue.onSubmittedWorkDone();
  expect(await gpuDevice.popErrorScope()).toBeNull();

  for (let bindingIndex = 0; bindingIndex < bindingCount; bindingIndex++) {
    const bytes = await buffers[bindingIndex].readAsync();
    const actualData = new Uint32Array(bytes.buffer, bytes.byteOffset, ELEMENTS_PER_BINDING);
    expect(Array.from(actualData), `binding ${bindingIndex}`).toEqual(
      Array.from(getExpectedBindingData(bindingIndex))
    );
  }

  for (const buffer of buffers) {
    buffer.destroy();
  }
  computePipeline.destroy();
  shader.destroy();
  device.destroy();
});

it('WebGPUAdapter#attach error scopes catch pipelines above the storage binding limit', async () => {
  const gpuDevice = await requestMaxStorageBufferDevice();
  const bindingCount = gpuDevice.limits.maxStorageBuffersPerShaderStage + 1;
  const device = await webgpuAdapter.attach(gpuDevice, {onError: () => true});

  gpuDevice.pushErrorScope('validation');
  gpuDevice.createComputePipeline({
    layout: 'auto',
    compute: {
      module: gpuDevice.createShaderModule({code: getStorageBindingSource(bindingCount)}),
      entryPoint: 'main'
    }
  });
  await gpuDevice.queue.onSubmittedWorkDone();
  const error = await gpuDevice.popErrorScope();
  expect(error).toBeInstanceOf(GPUValidationError);

  device.destroy();
});

it('WebGPUAdapter#attach destroy() leaves an app-owned GPUDevice usable', async () => {
  const gpuDevice = await requestMaxStorageBufferDevice();
  const device = await webgpuAdapter.attach(gpuDevice);
  device.destroy();

  expect(await Promise.race([gpuDevice.lost, Promise.resolve(null)])).toBeNull();

  gpuDevice.pushErrorScope('validation');
  const expectedData = new Uint32Array([3, 1, 4, 1]);
  const storageBuffer = gpuDevice.createBuffer({
    size: expectedData.byteLength,
    usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
  });
  const readBuffer = gpuDevice.createBuffer({
    size: expectedData.byteLength,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
  });
  gpuDevice.queue.writeBuffer(storageBuffer, 0, expectedData);
  const commandEncoder = gpuDevice.createCommandEncoder();
  commandEncoder.copyBufferToBuffer(storageBuffer, 0, readBuffer, 0, expectedData.byteLength);
  gpuDevice.queue.submit([commandEncoder.finish()]);
  await gpuDevice.queue.onSubmittedWorkDone();
  expect(await gpuDevice.popErrorScope()).toBeNull();

  await readBuffer.mapAsync(GPUMapMode.READ);
  const actualData = new Uint32Array(readBuffer.getMappedRange().slice(0));
  readBuffer.unmap();
  expect(Array.from(actualData)).toEqual(Array.from(expectedData));

  storageBuffer.destroy();
  readBuffer.destroy();
});

it('WebGPUAdapter#attach destroy() unconfigures the canvas on an app-owned GPUDevice', async () => {
  const gpuDevice = await requestMaxStorageBufferDevice();
  const {canvas, canvasContext} = createCanvasContext();
  const device = await webgpuAdapter.attach(gpuDevice, {createCanvasContext: {canvas}});
  expect(canvasContext.getConfiguration()?.device, 'luma configured the canvas').toBe(gpuDevice);

  device.destroy();

  expect(canvasContext.getConfiguration(), 'canvas is unconfigured').toBeNull();
  expect(await Promise.race([gpuDevice.lost, Promise.resolve(null)])).toBeNull();
});

it('WebGPUAdapter#attach returns one wrapper per GPUDevice', async () => {
  const gpuDevice = await requestMaxStorageBufferDevice();
  const onError = vi.fn(() => true);
  const device = await webgpuAdapter.attach(gpuDevice, {onError});
  // A second wrapper would add a second listener and report each error twice.
  expect(await webgpuAdapter.attach(gpuDevice, {onError})).toBe(device);

  // MAP_READ and MAP_WRITE are mutually exclusive, so this is a validation error.
  gpuDevice.createBuffer({size: 4, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.MAP_WRITE});
  await gpuDevice.queue.onSubmittedWorkDone();
  await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
  await waitForFrames(2);
  expect(onError).toHaveBeenCalledTimes(1);
  device.destroy();
});

it('WebGPUAdapter#attach destroy() restores a canvas the application configured', async () => {
  const gpuDevice = await requestMaxStorageBufferDevice();
  const {canvas, canvasContext} = createCanvasContext();
  const format = navigator.gpu.getPreferredCanvasFormat();
  canvasContext.configure({device: gpuDevice, format, alphaMode: 'premultiplied'});

  const device = await webgpuAdapter.attach(gpuDevice, {
    createCanvasContext: {canvas, alphaMode: 'opaque'}
  });
  expect(canvasContext.getConfiguration()?.alphaMode).toBe('opaque');

  device.destroy();

  const configuration = canvasContext.getConfiguration();
  expect(configuration?.device).toBe(gpuDevice);
  expect(configuration?.format).toBe(format);
  expect(configuration?.alphaMode).toBe('premultiplied');
});

it('WebGPUAdapter#attach routes uncaptured errors to luma until destroyed', async () => {
  const gpuDevice = await requestMaxStorageBufferDevice();
  const onError = vi.fn(() => true);
  const device = await webgpuAdapter.attach(gpuDevice, {onError});

  // MAP_READ and MAP_WRITE are mutually exclusive, so this is a validation error.
  gpuDevice.createBuffer({size: 4, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.MAP_WRITE});
  await gpuDevice.queue.onSubmittedWorkDone();
  await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1));

  device.destroy();
  const appListener = vi.fn((event: Event) => event.preventDefault());
  gpuDevice.addEventListener('uncapturederror', appListener);
  gpuDevice.createBuffer({size: 4, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.MAP_WRITE});
  await gpuDevice.queue.onSubmittedWorkDone();
  await vi.waitFor(() => expect(appListener).toHaveBeenCalledTimes(1));
  await waitForFrames(2);
  expect(onError).toHaveBeenCalledTimes(1);
});

it('WebGPUAdapter#attach routes GPUDevice loss to luma', async () => {
  const gpuDevice = await requestMaxStorageBufferDevice();
  const device = await webgpuAdapter.attach(gpuDevice);

  gpuDevice.destroy();
  const lostInfo = await device.lost;
  expect(lostInfo.reason).toBe('destroyed');
  expect(device.isLost).toBe(true);
});

it.each([
  false,
  true
])('destroying an old wrapper preserves a reattached canvas (configured: %s)', async previouslyConfigured => {
  const gpuDevice = await requestMaxStorageBufferDevice();
  const {canvas, canvasContext} = createCanvasContext();
  if (previouslyConfigured) {
    canvasContext.configure({
      device: gpuDevice,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: 'premultiplied'
    });
  }
  const device = await webgpuAdapter.attach(gpuDevice, {
    createCanvasContext: {canvas, alphaMode: 'opaque'}
  });
  device.destroy();
  expect(device.canvasContext).toBeNull();

  const reattachedDevice = await webgpuAdapter.attach(gpuDevice, {
    createCanvasContext: {canvas, alphaMode: 'opaque'}
  });
  try {
    const configuration = canvasContext.getConfiguration();
    device.destroy();
    expect(canvasContext.getConfiguration()).toEqual(configuration);
    expect(canvasContext.getConfiguration()?.alphaMode).toBe('opaque');
    expect(await webgpuAdapter.attach(gpuDevice)).toBe(reattachedDevice);
    gpuDevice.pushErrorScope('validation');
    canvasContext.getCurrentTexture();
    expect(await gpuDevice.popErrorScope()).toBeNull();
  } finally {
    reattachedDevice.destroy();
  }
});
