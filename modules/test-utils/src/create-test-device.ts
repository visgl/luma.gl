// luma.gl, MIT license

import type {Device, DeviceProps} from '@luma.gl/api';
import {luma} from '@luma.gl/api';
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
    console.error(`Failed to created device '${props.id}': ${(error as Error).message}`);
    return null;
  }
}

export const webgl1TestDevice: WebGLDevice = createTestDevice({id: 'webgl1-test-device', webgl1: true, webgl2: false})!;
export const webgl2TestDevice: WebGLDevice | null = createTestDevice({id: 'webgl2-test-device', webgl1: false, webgl2: true});
/** Only available after getTestDevices() has completed */
export let webgpuTestDevice: WebGPUDevice;

let webgpuCreated = false;

/** Synchronously get test devices (only WebGLDevices) */
export function getWebGLTestDevices(): WebGLDevice[] {
  const devices: WebGLDevice[] = [];
  if (webgl2TestDevice) {
    devices.push(webgl2TestDevice);
  }
  if (webgl1TestDevice) {
    devices.push(webgl1TestDevice);
  }
  return devices;
}

/** Includes WebGPU device if available */
export async function getTestDevices() : Promise<Device[]> {
  if (!webgpuCreated) {
    webgpuCreated = true;
    try {
      webgpuTestDevice = await luma.createDevice({id: 'webgpu-test-device', type: 'webgpu'}) as WebGPUDevice;
    } catch {
      // ignore (assume WebGPU was not available)
    }
  }

  const devices: Device[] = getWebGLTestDevices();
  if (webgpuTestDevice) {
    devices.unshift(webgpuTestDevice);
  }
  return devices;
}
