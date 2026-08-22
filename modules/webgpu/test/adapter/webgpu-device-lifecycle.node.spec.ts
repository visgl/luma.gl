// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {DeviceCreationError, type DeviceProps} from '@luma.gl/core';
import {getWebGPUAdapterInfo, WebGPUAdapter} from '../../src/adapter/webgpu-adapter';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

class MockWebGPUAdapter extends WebGPUAdapter {
  readonly requests: GPURequestAdapterOptions[] = [];

  constructor(private readonly adapters: GPUAdapter[]) {
    super();
  }

  protected override async requestGPUAdapter(
    options: GPURequestAdapterOptions
  ): Promise<GPUAdapter | null> {
    this.requests.push(options);
    return this.adapters.shift() || null;
  }
}

function makeDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(resolver => {
    resolve = resolver;
  });
  return {promise, resolve};
}

function makeNativeDevice(lost: Promise<GPUDeviceLostInfo>) {
  const commandEncoder = {label: ''};
  return {
    device: {
      features: new Set(),
      limits: {},
      lost,
      queue: {},
      addEventListener: vi.fn(),
      createCommandEncoder: vi.fn(() => commandEncoder),
      destroy: vi.fn()
    } as unknown as GPUDevice,
    commandEncoder
  };
}

function makeNativeAdapter(device: GPUDevice, info: GPUAdapterInfo = {} as GPUAdapterInfo) {
  const requestDevice = vi.fn(async (_descriptor: GPUDeviceDescriptor) => device);
  return {
    adapter: {
      features: new Set(),
      limits: {},
      info,
      requestDevice
    } as unknown as GPUAdapter,
    requestDevice
  };
}

beforeEach(() => {
  vi.stubGlobal('navigator', {
    gpu: {
      getPreferredCanvasFormat: () => 'bgra8unorm',
      requestAdapter: vi.fn()
    }
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('WebGPU device creation lifecycle', () => {
  test('uses an empty descriptor for the safe core profile', async () => {
    const pendingLoss = makeDeferred<GPUDeviceLostInfo>();
    const nativeDevice = makeNativeDevice(pendingLoss.promise);
    const nativeAdapter = makeNativeAdapter(nativeDevice.device);
    const adapter = new MockWebGPUAdapter([nativeAdapter.adapter]);

    const device = await adapter.create({} as DeviceProps);

    expect(nativeAdapter.requestDevice).toHaveBeenCalledWith({});
    device.destroy();
  });

  test('rejects software adapters before requesting a device or initializing a canvas', async () => {
    const pendingLoss = makeDeferred<GPUDeviceLostInfo>();
    const nativeDevice = makeNativeDevice(pendingLoss.promise);
    const nativeAdapter = makeNativeAdapter(nativeDevice.device, {
      type: 'CPU',
      vendor: 'Software Adapter'
    } as GPUAdapterInfo);
    const adapter = new MockWebGPUAdapter([nativeAdapter.adapter]);

    await expect(
      adapter.create({
        failIfMajorPerformanceCaveat: true,
        createCanvasContext: {canvas: {} as HTMLCanvasElement}
      } as DeviceProps)
    ).rejects.toMatchObject<DeviceCreationError>({phase: 'adapter-selection'});

    expect(nativeAdapter.requestDevice).not.toHaveBeenCalled();
  });

  test('retries one immediately lost device with a fresh adapter', async () => {
    const firstDevice = makeNativeDevice(
      Promise.resolve({reason: 'unknown', message: 'Transient driver loss'} as GPUDeviceLostInfo)
    );
    const pendingLoss = makeDeferred<GPUDeviceLostInfo>();
    const secondDevice = makeNativeDevice(pendingLoss.promise);
    const firstAdapter = makeNativeAdapter(firstDevice.device);
    const secondAdapter = makeNativeAdapter(secondDevice.device);
    const adapter = new MockWebGPUAdapter([firstAdapter.adapter, secondAdapter.adapter]);

    const device = await adapter.create({} as DeviceProps);

    expect(adapter.requests).toHaveLength(2);
    expect(firstDevice.device.destroy).toHaveBeenCalledTimes(1);
    expect(firstAdapter.requestDevice).toHaveBeenCalledWith({});
    expect(secondAdapter.requestDevice).toHaveBeenCalledWith({});
    device.destroy();
  });

  test('cleans up native devices after wrapper and canvas initialization failures', async () => {
    const pendingWrapperLoss = makeDeferred<GPUDeviceLostInfo>();
    const wrapperDevice = makeNativeDevice(pendingWrapperLoss.promise);
    vi.mocked(wrapperDevice.device.createCommandEncoder).mockImplementation(() => {
      throw new Error('Command encoder construction failed');
    });
    const wrapperAdapter = makeNativeAdapter(wrapperDevice.device);

    await expect(
      new MockWebGPUAdapter([wrapperAdapter.adapter]).create({} as DeviceProps)
    ).rejects.toMatchObject<DeviceCreationError>({phase: 'wrapper-initialization'});
    expect(wrapperDevice.device.destroy).toHaveBeenCalledTimes(1);

    const pendingCanvasLoss = makeDeferred<GPUDeviceLostInfo>();
    const canvasDevice = makeNativeDevice(pendingCanvasLoss.promise);
    const canvasAdapter = makeNativeAdapter(canvasDevice.device);
    await expect(
      new MockWebGPUAdapter([canvasAdapter.adapter]).create({
        createCanvasContext: true
      } as DeviceProps)
    ).rejects.toMatchObject<DeviceCreationError>({phase: 'canvas-initialization'});
    expect(canvasDevice.device.destroy).toHaveBeenCalledTimes(1);
  });

  test('preserves native loss reasons', async () => {
    const unexpectedLoss = makeDeferred<GPUDeviceLostInfo>();
    const nativeDevice = makeNativeDevice(unexpectedLoss.promise);
    const nativeAdapter = makeNativeAdapter(nativeDevice.device);
    const device = await new MockWebGPUAdapter([nativeAdapter.adapter]).create({} as DeviceProps);
    unexpectedLoss.resolve({reason: 'unknown', message: 'Driver reset'} as GPUDeviceLostInfo);

    await expect(device.lost).resolves.toEqual({reason: 'unknown', message: 'Driver reset'});
  });

  test('tolerates missing and rejected adapter metadata', async () => {
    await expect(getWebGPUAdapterInfo({} as GPUAdapter)).resolves.toEqual({});

    const adapter = {} as GPUAdapter;
    Object.defineProperty(adapter, 'info', {
      get() {
        throw new Error('Metadata blocked');
      }
    });
    await expect(getWebGPUAdapterInfo(adapter)).resolves.toEqual({});
  });
});
