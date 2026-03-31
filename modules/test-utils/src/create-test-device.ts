// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, CanvasContextProps} from '@luma.gl/core';
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
  /** A WebGL 2 Device intended for testing - @note Only available after getTestDevices() has completed */
  webgpuDevicePromise: Promise<WebGPUDevice | null> | null;
};

declare global {
  interface Window {
    [TEST_DEVICE_CACHE_KEY]?: TestDeviceCache;
  }
}

const testDeviceCache = getOrCreateTestDeviceCache();

/** Includes WebGPU device if available */
export async function getTestDevices(
  types: Readonly<('webgl' | 'webgpu' | 'null' | 'unknown')[]> = ['webgl', 'webgpu']
): Promise<Device[]> {
  const promises = types.map(type => getTestDevice(type));
  const devices = await Promise.all(promises);
  return devices.filter(device => device !== null);
}

export async function getTestDevice(
  type: 'webgl' | 'webgpu' | 'null' | 'unknown'
): Promise<Device | null> {
  switch (type) {
    case 'webgl':
      return getOrCreateWebGLTestDevicePromise();
    case 'webgpu':
      return getWebGPUTestDevice();
    case 'null':
      return getOrCreateNullTestDevicePromise();
    case 'unknown':
      return null;
  }
}

/** returns WebGPU device promise, if available */
export async function getWebGPUTestDevice(): Promise<WebGPUDevice | null> {
  const webgpuDevice = await getOrCreateWebGPUTestDevicePromise();
  if (webgpuDevice?.isLost) {
    if (testDeviceCache.webgpuDevicePromise) {
      testDeviceCache.webgpuDevicePromise = null;
    }
    return getOrCreateWebGPUTestDevicePromise();
  }
  return webgpuDevice;
}

/** returns WebGL device promise, if available */
export async function getWebGLTestDevice(): Promise<WebGLDevice> {
  const webglDevice = await getOrCreateWebGLTestDevicePromise();
  if (webglDevice?.isLost) {
    if (testDeviceCache.webglDevicePromise) {
      testDeviceCache.webglDevicePromise = null;
    }
    return getOrCreateWebGLTestDevicePromise();
  }
  return webglDevice;
}

/** returns an offscreen WebGL device promise for presentation-context tests, if available */
export async function getPresentationWebGLTestDevice(): Promise<WebGLDevice | null> {
  return getOrCreatePresentationWebGLTestDevicePromise();
}

/** returns null device promise, if available */
export async function getNullTestDevice(): Promise<NullDevice> {
  return getOrCreateNullTestDevicePromise();
}

function getOrCreateWebGPUTestDevicePromise(): Promise<WebGPUDevice | null> {
  testDeviceCache.webgpuDevicePromise ||= makeWebGPUTestDevice();
  return testDeviceCache.webgpuDevicePromise;
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

async function makeWebGPUTestDevice(): Promise<WebGPUDevice | null> {
  const webgpuDeviceResolvers = withResolvers<WebGPUDevice | null>();
  try {
    const webgpuDevice = (await luma.createDevice({
      id: 'webgpu-test-device',
      type: 'webgpu',
      adapters: [webgpuAdapter],
      createCanvasContext: DEFAULT_CANVAS_CONTEXT_PROPS,
      debug: true
    })) as unknown as WebGPUDevice;
    webgpuDevice.lost.finally(() => {
      if (testDeviceCache.webgpuDevicePromise === webgpuDeviceResolvers.promise) {
        testDeviceCache.webgpuDevicePromise = null;
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
    nullDeviceResolvers.resolve(nullDevice);
  } catch (error) {
    log.error(String(error))();
    // @ts-ignore TODO
    testDeviceCache.nullDevicePromise = Promise.resolve(null);
  }
  return nullDeviceResolvers.promise;
}

// HELPERS

function getOrCreateTestDeviceCache(): TestDeviceCache {
  const rootObject = globalThis as typeof globalThis & {
    [TEST_DEVICE_CACHE_KEY]?: TestDeviceCache;
  };

  rootObject[TEST_DEVICE_CACHE_KEY] ||= {
    nullDevicePromise: null,
    webglDevicePromise: null,
    presentationWebglDevicePromise: null,
    webgpuDevicePromise: null
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
