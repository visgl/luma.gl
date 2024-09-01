// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, CanvasContextProps} from '@luma.gl/core';
import {luma, log} from '@luma.gl/core';
import {webgl2Adapter, WebGLDevice} from '@luma.gl/webgl';
import {webgpuAdapter, WebGPUDevice} from '@luma.gl/webgpu';
import {nullAdapter} from './null-device/null-adapter';
import {NullDevice} from './null-device/null-device';

const DEFAULT_CANVAS_CONTEXT_PROPS: CanvasContextProps = {
  width: 1,
  height: 1
};

/** A null device intended for testing - @note Only available after getTestDevices() has completed */
let nullDevicePromise: Promise<NullDevice>;
/** This WebGL Device can be used directly but will not have WebGL debugging initialized */
let webglDevicePromise: Promise<WebGLDevice>;
/** A WebGL 2 Device intended for testing - @note Only available after getTestDevices() has completed */
let webgpuDevicePromise: Promise<WebGPUDevice | null>;

/** Includes WebGPU device if available */
export async function getTestDevices(
  types: ('webgl' | 'webgpu' | 'unknown')[] = ['webgl', 'webgpu']
): Promise<Device[]> {
  return [await getNullTestDevice(), await getWebGLTestDevice(), await getWebGPUTestDevice()]
    .filter(Boolean)
    .filter(device => types.includes(device.type));
}

/** returns WebGPU device promise, if available */
export async function getWebGPUTestDevice(): Promise<WebGPUDevice | null> {
  if (!webgpuDevicePromise) {
    try {
      webgpuDevicePromise = luma.createDevice({
        id: 'webgpu-test-device',
        type: 'webgpu',
        adapters: [webgpuAdapter],
        createCanvasContext: DEFAULT_CANVAS_CONTEXT_PROPS,
        debug: true
      }) as Promise<WebGPUDevice>;
    } catch (error) {
      log.error(String(error))();
      webgpuDevicePromise = Promise.resolve(null);
    }
  }
  return webgpuDevicePromise;
}

/** returns WebGL device promise, if available */
export async function getWebGLTestDevice(): Promise<WebGLDevice> {
  if (!webglDevicePromise) {
    try {
      webglDevicePromise = luma.createDevice({
        id: 'webgl-test-device',
        type: 'webgl',
        adapters: [webgl2Adapter],
        createCanvasContext: DEFAULT_CANVAS_CONTEXT_PROPS,
        debug: true,
        debugWebGL: true
      }) as Promise<WebGLDevice>;
    } catch (error) {
      log.error(String(error))();
      webglDevicePromise = Promise.resolve(null);
    }
  }
  return webglDevicePromise;
}

/** returns null device promise, if available */
export async function getNullTestDevice(): Promise<NullDevice> {
  if (!nullDevicePromise) {
    try {
      nullDevicePromise = luma.createDevice({
        id: 'null-test-device',
        type: 'unknown',
        adapters: [nullAdapter],
        createCanvasContext: DEFAULT_CANVAS_CONTEXT_PROPS,
        debug: true,
        debugWebGL: true
      }) as Promise<NullDevice>;
    } catch (error) {
      log.error(String(error))();
      nullDevicePromise = Promise.resolve(null);
    }
  }
  return nullDevicePromise;
}
