// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, CanvasContextProps} from '@luma.gl/core';
import {luma, log} from '@luma.gl/core';
import {webgl2Adapter, WebGLDevice} from '@luma.gl/webgl';
import {webgpuAdapter, WebGPUDevice} from '@luma.gl/webgpu';

const DEFAULT_CANVAS_CONTEXT_PROPS: CanvasContextProps = {
  width: 1,
  height: 1
};

/** Create a test WebGLDevice */
export function createTestDevice(): WebGLDevice | null {
  try {
    // TODO - We do not use luma.createDevice since createTestDevice currently expect WebGL context to be created synchronously
    return new WebGLDevice({canvasContext: DEFAULT_CANVAS_CONTEXT_PROPS, debugWebGL: true});
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to created device: ${(error as Error).message}`);
    debugger; // eslint-disable-line no-debugger
    return null;
  }
}

/** This WebGL Device can be used directly but will not have WebGL debugging initialized */
export const webglDevice = createTestDevice();

/** A WebGL 2 Device intended for testing - @note Only available after getTestDevices() has completed */
export let webglDeviceAsync: WebGLDevice;

/** A WebGL 2 Device intended for testing - @note Only available after getTestDevices() has completed */
export let webgpuDevice: WebGPUDevice;

let devicesCreated = false;

/** Includes WebGPU device if available */
export async function getTestDevices(type?: 'webgl' | 'webgpu'): Promise<Device[]> {
  if (!devicesCreated) {
    devicesCreated = true;
    try {
      webgpuDevice = (await luma.createDevice({
        id: 'webgpu-test-device',
        type: 'webgpu',
        adapters: [webgpuAdapter],
        canvasContext: DEFAULT_CANVAS_CONTEXT_PROPS
      })) as WebGPUDevice;
    } catch (error) {
      log.error(String(error))();
    }
    try {
      webglDeviceAsync = (await luma.createDevice({
        id: 'webgl-test-device',
        type: 'webgl',
        adapters: [webgl2Adapter],
        canvasContext: DEFAULT_CANVAS_CONTEXT_PROPS,
        debugWebGL: true
      })) as WebGLDevice;
    } catch (error) {
      log.error(String(error))();
    }
  }

  return [webglDeviceAsync, webgpuDevice]
    .filter(Boolean)
    .filter(device => !type || type === device.type);
}
