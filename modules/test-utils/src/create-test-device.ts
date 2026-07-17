// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, CanvasContextProps, DeviceProps} from '@luma.gl/core';
import {luma, log} from '@luma.gl/core';
import {webgl2Adapter, WebGLDevice} from '@luma.gl/webgl';
import {webgpuAdapter, WebGPUDevice} from '@luma.gl/webgpu';
import {nullAdapter} from './null-device/null-adapter';
import {NullDevice} from './null-device/null-device';

const DEFAULT_CANVAS_CONTEXT_PROPS: CanvasContextProps = {width: 1, height: 1};
const TEST_DEVICE_CACHE_KEY = '__lumaTestDeviceCache';

type TestDeviceCache = {
  /** A null device intended for testing - @note Only available after getTestDevices() has completed */
  nullDevicePromise: Promise<NullDevice> | null;
  /** This WebGL Device can be used directly but will not have WebGL debugging initialized */
  webglDevicePromise: Promise<WebGLDevice> | null;
  /** A shared offscreen WebGL device for presentation-context tests */
  presentationWebglDevicePromise: Promise<WebGLDevice | null> | null;
  /** WebGPU Devices intended for testing, keyed by featureLevel */
  webgpuDevicePromises: Partial<
    Record<NonNullable<DeviceProps['featureLevel']>, Promise<WebGPUDevice | null>>
  >;
};

declare global {
  interface Window {
    [TEST_DEVICE_CACHE_KEY]?: TestDeviceCache;
  }
}

const testDeviceCache = getOrCreateTestDeviceCache();

type LostAwareDevice = {
  isLost: boolean;
};

type TestDeviceType =
  | 'webgl'
  | 'webgpu'
  | 'webgpu-core'
  | 'webgpu-max'
  | 'webgpu-compatibility'
  | 'null'
  | 'unknown';

/**
 * Returns available test devices for the requested backend types.
 * @param types Backend types to create. `'webgpu'` preserves the legacy max-feature WebGPU test device.
 * @note Returned devices are shared cached fixtures and reject destroy() and detach().
 */
export async function getTestDevices(
  types: Readonly<TestDeviceType[]> = ['webgl', 'webgpu']
): Promise<Device[]> {
  const promises = types.map(type => getTestDevice(type));
  const devices = await Promise.all(promises);
  return devices.filter(device => device !== null);
}

/**
 * Returns a test device for one backend type, or `null` when that backend is unavailable.
 * @param type Backend type to create.
 */
export async function getTestDevice(type: TestDeviceType): Promise<Device | null> {
  switch (type) {
    case 'webgl':
      return getOrCreateWebGLTestDevicePromise();
    case 'webgpu':
      return getWebGPUTestDevice('max');
    case 'webgpu-core':
      return getWebGPUTestDevice('core');
    case 'webgpu-max':
      return getWebGPUTestDevice('max');
    case 'webgpu-compatibility':
      return getWebGPUTestDevice('compatibility');
    case 'null':
      return getOrCreateNullTestDevicePromise();
    case 'unknown':
      return null;
  }
}

/**
 * Returns a WebGPU test device for one feature level, or `null` when WebGPU is unavailable.
 * @param featureLevel WebGPU feature level to request. Defaults to `'max'` for existing tests.
 */
export async function getWebGPUTestDevice(
  featureLevel: NonNullable<DeviceProps['featureLevel']> = 'max'
): Promise<WebGPUDevice | null> {
  return _refreshLostCachedTestDevice(
    () => getOrCreateWebGPUTestDevicePromise(featureLevel),
    () => {
      delete testDeviceCache.webgpuDevicePromises[featureLevel];
    }
  );
}

/**
 * Returns available WebGPU test devices for the requested feature levels.
 * @param featureLevels WebGPU feature levels to request. Defaults to both `'core'` and `'max'`.
 */
export async function getWebGPUTestDevices(
  featureLevels: Readonly<NonNullable<DeviceProps['featureLevel']>[]> = ['core', 'max']
): Promise<WebGPUDevice[]> {
  const devices = await Promise.all(
    featureLevels.map(featureLevel => getWebGPUTestDevice(featureLevel))
  );

  return devices.filter((device): device is WebGPUDevice => device !== null);
}

/** Returns a shared cached WebGL device. The fixture rejects destroy() and detach(). */
export async function getWebGLTestDevice(): Promise<WebGLDevice> {
  return _refreshLostCachedTestDevice(getOrCreateWebGLTestDevicePromise, () => {
    testDeviceCache.webglDevicePromise = null;
  });
}

/** Returns a shared cached offscreen WebGL device for presentation-context tests. */
export async function getPresentationWebGLTestDevice(): Promise<WebGLDevice | null> {
  return getOrCreatePresentationWebGLTestDevicePromise();
}

/** Returns a shared cached NullDevice. The fixture rejects destroy() and detach(). */
export async function getNullTestDevice(): Promise<NullDevice> {
  return getOrCreateNullTestDevicePromise();
}

function getOrCreateWebGPUTestDevicePromise(
  featureLevel: NonNullable<DeviceProps['featureLevel']>
): Promise<WebGPUDevice | null> {
  testDeviceCache.webgpuDevicePromises[featureLevel] ||= makeWebGPUTestDevice(featureLevel);
  return testDeviceCache.webgpuDevicePromises[featureLevel];
}

function getOrCreateWebGLTestDevicePromise(): Promise<WebGLDevice> {
  testDeviceCache.webglDevicePromise ||= makeWebGLTestDevice();
  return testDeviceCache.webglDevicePromise;
}

function getOrCreatePresentationWebGLTestDevicePromise(): Promise<WebGLDevice | null> {
  testDeviceCache.presentationWebglDevicePromise ||= makePresentationWebGLTestDevice();
  return testDeviceCache.presentationWebglDevicePromise;
}

function getOrCreateNullTestDevicePromise(): Promise<NullDevice> {
  testDeviceCache.nullDevicePromise ||= makeNullTestDevice();
  return testDeviceCache.nullDevicePromise;
}

async function makeWebGPUTestDevice(
  featureLevel: NonNullable<DeviceProps['featureLevel']>
): Promise<WebGPUDevice | null> {
  const webgpuDeviceResolvers = withResolvers<WebGPUDevice | null>();
  try {
    const webgpuDevice = (await luma.createDevice({
      id: `webgpu-${featureLevel}-test-device`,
      type: 'webgpu',
      featureLevel,
      adapters: [webgpuAdapter],
      createCanvasContext: DEFAULT_CANVAS_CONTEXT_PROPS,
      debug: true
    })) as unknown as WebGPUDevice;
    protectCachedTestDevice(webgpuDevice);
    webgpuDevice.lost.finally(() => {
      if (testDeviceCache.webgpuDevicePromises[featureLevel] === webgpuDeviceResolvers.promise) {
        delete testDeviceCache.webgpuDevicePromises[featureLevel];
      }
    });
    webgpuDeviceResolvers.resolve(webgpuDevice);
  } catch (error) {
    log.error(String(error))();
    // @ts-ignore TODO
    webgpuDeviceResolvers.resolve(null);
  }
  return webgpuDeviceResolvers.promise;
}

/** returns WebGL device promise, if available */
async function makeWebGLTestDevice(): Promise<WebGLDevice> {
  const webglDeviceResolvers = withResolvers<WebGLDevice>();
  try {
    const webglDevice = (await luma.createDevice({
      id: 'webgl-test-device',
      type: 'webgl',
      adapters: [webgl2Adapter],
      createCanvasContext: DEFAULT_CANVAS_CONTEXT_PROPS,
      debug: true
    })) as unknown as WebGLDevice;
    protectCachedTestDevice(webglDevice);
    webglDevice.lost.finally(() => {
      if (testDeviceCache.webglDevicePromise === webglDeviceResolvers.promise) {
        testDeviceCache.webglDevicePromise = null;
      }
    });
    webglDeviceResolvers.resolve(webglDevice);
  } catch (error) {
    log.error(String(error))();
    // @ts-ignore TODO
    webglDeviceResolvers.resolve(null);
  }
  return webglDeviceResolvers.promise;
}

async function makePresentationWebGLTestDevice(): Promise<WebGLDevice | null> {
  if (typeof OffscreenCanvas === 'undefined') {
    return null;
  }

  const presentationWebGLDeviceResolvers = withResolvers<WebGLDevice | null>();
  try {
    const webglDevice = (await luma.createDevice({
      id: 'webgl-presentation-context-test-device',
      type: 'webgl',
      adapters: [webgl2Adapter],
      createCanvasContext: {canvas: new OffscreenCanvas(4, 4)},
      debug: true
    })) as unknown as WebGLDevice;
    protectCachedTestDevice(webglDevice);
    webglDevice.lost.finally(() => {
      if (
        testDeviceCache.presentationWebglDevicePromise === presentationWebGLDeviceResolvers.promise
      ) {
        testDeviceCache.presentationWebglDevicePromise = null;
      }
    });
    presentationWebGLDeviceResolvers.resolve(webglDevice);
  } catch (error) {
    log.error(String(error))();
    presentationWebGLDeviceResolvers.resolve(null);
  }
  return presentationWebGLDeviceResolvers.promise;
}

/** returns null device promise, if available */
async function makeNullTestDevice(): Promise<NullDevice> {
  const nullDeviceResolvers = withResolvers<NullDevice>();
  try {
    const nullDevice = (await luma.createDevice({
      id: 'null-test-device',
      type: 'null',
      adapters: [nullAdapter],
      createCanvasContext: DEFAULT_CANVAS_CONTEXT_PROPS,
      debug: true
    })) as unknown as NullDevice;
    protectCachedTestDevice(nullDevice);
    nullDeviceResolvers.resolve(nullDevice);
  } catch (error) {
    log.error(String(error))();
    // @ts-ignore TODO
    testDeviceCache.nullDevicePromise = Promise.resolve(null);
  }
  return nullDeviceResolvers.promise;
}

// HELPERS

export async function _refreshLostCachedTestDevice<DeviceT extends LostAwareDevice | null>(
  getOrCreateDevice: () => Promise<DeviceT>,
  clearCachedDevice: () => void
): Promise<DeviceT> {
  const device = await getOrCreateDevice();
  if (device?.isLost) {
    clearCachedDevice();
    return getOrCreateDevice();
  }
  return device;
}

/** Prevent individual tests from terminally invalidating shared cached fixtures. */
function protectCachedTestDevice<DeviceT extends Device>(device: DeviceT): DeviceT {
  Object.defineProperties(device, {
    destroy: {
      configurable: false,
      writable: false,
      value: () => {
        throw new Error('Cached test devices are shared and cannot be destroyed');
      }
    },
    detach: {
      configurable: false,
      writable: false,
      value: () => {
        throw new Error('Cached test devices are shared and cannot be detached');
      }
    }
  });
  return device;
}

function getOrCreateTestDeviceCache(): TestDeviceCache {
  const rootObject = globalThis as typeof globalThis & {
    [TEST_DEVICE_CACHE_KEY]?: TestDeviceCache;
  };

  rootObject[TEST_DEVICE_CACHE_KEY] ||= {
    nullDevicePromise: null,
    webglDevicePromise: null,
    presentationWebglDevicePromise: null,
    webgpuDevicePromises: {}
  };

  return rootObject[TEST_DEVICE_CACHE_KEY];
}

// TODO - replace with Promise.withResolvers once we upgrade TS baseline
function withResolvers<T>(): {
  promise: Promise<T>;
  resolve: (t: T) => void;
  reject: (error: Error) => void;
} {
  let resolve;
  let reject;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  // @ts-ignore Assigned in callback.
  return {promise, resolve, reject};
}
