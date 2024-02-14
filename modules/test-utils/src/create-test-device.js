// luma.gl, MIT license
// Copyright (c) vis.gl contributors
import { luma } from '@luma.gl/core';
import { WebGLDevice } from '@luma.gl/webgl';
const CONTEXT_DEFAULTS = {
    width: 1,
    height: 1,
    debug: true
};
/** Create a test WebGL context */
export function createTestContext(opts = {}) {
    const device = createTestDevice(opts);
    return device && device.gl;
}
/** Create a test WebGLDevice */
export function createTestDevice(props = {}) {
    try {
        props = { ...CONTEXT_DEFAULTS, ...props, debug: true };
        // We dont use luma.createDevice since this tests current expect this context to be created synchronously
        return new WebGLDevice(props);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Failed to created device '${props.id}': ${error.message}`);
        return null;
    }
}
/** A WebGL 1 Device intended for testing */
export const webgl1Device = createTestDevice({ id: 'webgl1-test-device', webgl1: true, webgl2: false });
/** A WebGL 2 Device intended for testing. Can be null */
export const webgl2Device = createTestDevice({ id: 'webgl2-test-device', webgl1: false, webgl2: true });
/** A WebGL 2 or WebGL 1 Device intended for testing. Best available. */
export const webglDevice = webgl2Device || webgl1Device;
/** Only available after getTestDevices() has completed */
export let webgpuDevice;
let webgpuCreated = false;
/** Synchronously get test devices (only WebGLDevices) */
export function getWebGLTestDevices() {
    const devices = [];
    if (webgl2Device) {
        devices.push(webgl2Device);
    }
    if (webgl1Device) {
        devices.push(webgl1Device);
    }
    return devices;
}
/** Includes WebGPU device if available */
export async function getTestDevices() {
    if (!webgpuCreated) {
        webgpuCreated = true;
        try {
            webgpuDevice = await luma.createDevice({ id: 'webgpu-test-device', type: 'webgpu' });
        }
        catch {
            // ignore (assume WebGPU was not available)
        }
    }
    const devices = getWebGLTestDevices();
    if (webgpuDevice) {
        devices.unshift(webgpuDevice);
    }
    return devices;
}
