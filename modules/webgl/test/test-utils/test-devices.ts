// luma.gl, MIT license

import {isBrowser} from '@probe.gl/env';
import type {Device, DeviceProps} from '@luma.gl/api';
import {WebGLDevice} from '@luma.gl/webgl';
import {createHeadlessContext} from './create-headless-context';

const CONTEXT_DEFAULTS: Partial<DeviceProps> = {
  width: 1,
  height: 1,
  debug: true
};

export function createTestDevice(props: DeviceProps = {}): WebGLDevice | null {
  try {
    const gl = !isBrowser() ? createHeadlessContext(props) : undefined;
    props = {...CONTEXT_DEFAULTS, ...props, gl, debug: true};
    // We dont use luma.createDevice since this tests current expect this context to be created synchronously
    return new WebGLDevice(props);
  } catch (error) {
    console.error(`Failed to created device '${props.id}': ${error instanceof Error ? error.message : error}`);
    return null;
  }
}

export const webgl1Device: WebGLDevice = createTestDevice({id: 'webgl1-test-device', webgl1: true, webgl2: false});
export const webgl2Device: WebGLDevice = createTestDevice({id: 'webgl2-test-device', webgl1: false, webgl2: true});
/** Only available after getTestDevices() has completed */

export const gl = webgl1Device.gl;
export const gl1 = webgl1Device.gl;
export const gl2: WebGL2RenderingContext = webgl2Device?.gl as WebGL2RenderingContext;

/** Synchronously get test devices (only WebGLDevices) */
export function getWebGLTestDevices(): WebGLDevice[] {
  return [webgl2Device, webgl1Device].filter(Boolean);
}

/** Includes WebGPU device if available */
export async function getTestDevices() : Promise<Device[]> {
  return [webgl2Device, webgl1Device].filter(Boolean);
}
