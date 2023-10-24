// luma.gl, MIT license
// Copyright (c) 2020 OpenJS Foundation
// Copyright (c) vis.gl contributors

import type {Device, DeviceProps} from '@luma.gl/core';
import {luma} from '@luma.gl/core';
import {WebGLDevice} from '@luma.gl/webgl';
import {WebGPUDevice} from '@luma.gl/webgpu';

const CONTEXT_DEFAULTS: Partial<DeviceProps> = {
  width: 1,
  height: 1,
  debug: true
};

/** Create a test WebGL context */
export function createTestContext(opts: Record<string, any> = {}): WebGLRenderingContext | null {
  const device = createTestDevice(opts);
  return device && device.gl;
}

/** Create a test WebGLDevice */
export function createTestDevice(props: DeviceProps = {}): WebGLDevice | null {
  try {
    props = {...CONTEXT_DEFAULTS, ...props, debug: true};
    // We dont use luma.createDevice since this tests current expect this context to be created synchronously
    return new WebGLDevice(props);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to created device '${props.id}': ${(error as Error).message}`);
    return null;
  }
}

/** A WebGL 1 Device intended for testing */
export const webgl1Device: WebGLDevice = createTestDevice({id: 'webgl1-test-device', webgl1: true, webgl2: false}) ;
/** A WebGL 2 Device intended for testing. Can be null */
export const webgl2Device: WebGLDevice = createTestDevice({id: 'webgl2-test-device', webgl1: false, webgl2: true}) ;
/** A WebGL 2 or WebGL 1 Device intended for testing. Best available. */
export const webglDevice: WebGLDevice = webgl2Device || webgl1Device;

/** Only available after getTestDevices() has completed */
export let webgpuDevice: WebGPUDevice;

let webgpuCreated = false;

/** Synchronously get test devices (only WebGLDevices) */
export function getWebGLTestDevices(): WebGLDevice[] {
  const devices: WebGLDevice[] = [];
  if (webgl2Device) {
    devices.push(webgl2Device);
  }
  if (webgl1Device) {
    devices.push(webgl1Device);
  }
  return devices;
}

/** Includes WebGPU device if available */
export async function getTestDevices() : Promise<Device[]> {
  if (!webgpuCreated) {
    webgpuCreated = true;
    try {
      webgpuDevice = await luma.createDevice({id: 'webgpu-test-device', type: 'webgpu'}) as WebGPUDevice;
    } catch {
      // ignore (assume WebGPU was not available)
    }
  }

  const devices: Device[] = getWebGLTestDevices();
  if (webgpuDevice) {
    devices.unshift(webgpuDevice);
  }
  return devices;
}
