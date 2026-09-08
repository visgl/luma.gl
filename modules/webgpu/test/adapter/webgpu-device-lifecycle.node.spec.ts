// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {type DeviceProps} from '@luma.gl/core';
import {WebGPUAdapter} from '../../src/adapter/webgpu-adapter';

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

class FailingWebGPUAdapter extends WebGPUAdapter {
  constructor(private readonly failure: Error) {
    super();
  }

  protected override requestGPUAdapter(): Promise<GPUAdapter | null> {
    return Promise.reject(this.failure);
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

  test('normalizes unknown WebGPU loss reasons and preserves destroyed', async () => {
    const lossReasons = [
      {reason: 'unknown', expected: 'unknown'},
      {reason: 'destroyed', expected: 'destroyed'},
      {reason: 'legacy-reason', expected: 'unknown'}
    ] as const;

    for (const {reason, expected} of lossReasons) {
      const loss = makeDeferred<GPUDeviceLostInfo>();
      const nativeDevice = makeNativeDevice(loss.promise);
      const nativeAdapter = makeNativeAdapter(nativeDevice.device);
      const device = await new MockWebGPUAdapter([nativeAdapter.adapter]).create({} as DeviceProps);

      loss.resolve({reason, message: 'Native diagnostic'} as GPUDeviceLostInfo);
      await expect(device.lost).resolves.toEqual({
        reason: expected,
        message: 'Native diagnostic'
      });
    }
  });

  test('throws a standard error after an intentional or repeated immediate loss', async () => {
    const destroyedDevice = makeNativeDevice(
      Promise.resolve({reason: 'destroyed', message: 'Application destroyed'} as GPUDeviceLostInfo)
    );
    const destroyedAdapter = makeNativeAdapter(destroyedDevice.device);
    const destroyedCreation = new MockWebGPUAdapter([destroyedAdapter.adapter]).create(
      {} as DeviceProps
    );
    await expect(destroyedCreation).rejects.toMatchObject({
      message: 'Application destroyed',
      cause: {reason: 'destroyed'}
    });
    await expect(destroyedCreation).rejects.toBeInstanceOf(Error);

    const firstDevice = makeNativeDevice(
      Promise.resolve({reason: 'unknown', message: 'First loss'} as GPUDeviceLostInfo)
    );
    const secondDevice = makeNativeDevice(
      Promise.resolve({reason: 'unknown', message: 'Second loss'} as GPUDeviceLostInfo)
    );
    const adapter = new MockWebGPUAdapter([
      makeNativeAdapter(firstDevice.device).adapter,
      makeNativeAdapter(secondDevice.device).adapter
    ]);

    await expect(adapter.create({} as DeviceProps)).rejects.toMatchObject({
      message: 'Second loss',
      cause: {reason: 'unknown'}
    });
    expect(adapter.requests).toHaveLength(2);
  });

  test('preserves native adapter request failures in error.cause', async () => {
    const nativeError = new Error('Native adapter failure');

    await expect(
      new FailingWebGPUAdapter(nativeError).create({} as DeviceProps)
    ).rejects.toMatchObject({
      message: 'WebGPU adapter request failed',
      cause: nativeError
    });
  });

  test('preserves native device request failures in error.cause', async () => {
    const nativeError = new Error('Native device failure');
    const nativeAdapter = {
      features: new Set(),
      limits: {},
      info: {},
      requestDevice: vi.fn().mockRejectedValue(nativeError)
    } as unknown as GPUAdapter;

    await expect(
      new MockWebGPUAdapter([nativeAdapter]).create({} as DeviceProps)
    ).rejects.toMatchObject({
      message: 'WebGPU device request failed',
      cause: nativeError
    });
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
    ).rejects.toMatchObject({message: 'WebGPU wrapper initialization failed'});
    expect(wrapperDevice.device.destroy).toHaveBeenCalledTimes(1);

    const pendingCanvasLoss = makeDeferred<GPUDeviceLostInfo>();
    const canvasDevice = makeNativeDevice(pendingCanvasLoss.promise);
    const canvasAdapter = makeNativeAdapter(canvasDevice.device);
    await expect(
      new MockWebGPUAdapter([canvasAdapter.adapter]).create({
        createCanvasContext: true
      } as DeviceProps)
    ).rejects.toMatchObject({message: 'WebGPU canvas initialization failed'});
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
});
