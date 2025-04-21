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

/** A null device intended for testing - @note Only available after getTestDevices() has completed */
let nullDevicePromise = makeNullTestDevice();
/** This WebGL Device can be used directly but will not have WebGL debugging initialized */
const webglDevicePromise = makeWebGLTestDevice();
/** A WebGL 2 Device intended for testing - @note Only available after getTestDevices() has completed */
const webgpuDevicePromise = makeWebGPUTestDevice();

/** Includes WebGPU device if available */
export async function getTestDevices(
  types: Readonly<('webgl' | 'webgpu' | 'null' | 'unknown')[]> = ['webgl', 'webgpu']
): Promise<Device[]> {
  return await Promise.all(types.map(type => getTestDevice(type)));
}

export function getTestDevice(type: 'webgl' | 'webgpu' | 'null' | 'unknown'): Promise<Device> {
  switch (type) {
    case 'webgl':
      return webglDevicePromise;
    case 'webgpu':
      return webgpuDevicePromise;
    case 'null':
      return nullDevicePromise;
    case 'unknown':
      return null;
  }
}

/** returns WebGPU device promise, if available */
export function getWebGPUTestDevice(): Promise<WebGPUDevice | null> {
  return webgpuDevicePromise;
}

/** returns WebGL device promise, if available */
export async function getWebGLTestDevice(): Promise<WebGLDevice> {
  return webglDevicePromise;
}

/** returns null device promise, if available */
export async function getNullTestDevice(): Promise<NullDevice> {
  return nullDevicePromise;
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
      debug: true,
      debugWebGL: true
    })) as unknown as WebGLDevice;
    webglDeviceResolvers.resolve(webglDevice);
  } catch (error) {
    log.error(String(error))();
    // @ts-ignore TODO
    webglDeviceResolvers.resolve(null);
  }
  return webglDeviceResolvers.promise;
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
      debug: true,
      debugWebGL: true
    })) as unknown as NullDevice;
    nullDeviceResolvers.resolve(nullDevice);
  } catch (error) {
    log.error(String(error))();
    // @ts-ignore TODO
    nullDevicePromise = Promise.resolve(null);
  }
  return nullDeviceResolvers.promise;
}

// HELPERS

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
