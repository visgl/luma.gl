// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { luma, log } from '@luma.gl/core';
import { webgl2Adapter } from '@luma.gl/webgl';
import { webgpuAdapter } from '@luma.gl/webgpu';
import { nullAdapter } from './null-device/null-adapter';
const DEFAULT_CANVAS_CONTEXT_PROPS = { width: 1, height: 1 };
/** A null device intended for testing - @note Only available after getTestDevices() has completed */
let nullDevicePromise = makeNullTestDevice();
/** This WebGL Device can be used directly but will not have WebGL debugging initialized */
const webglDevicePromise = makeWebGLTestDevice();
/** A WebGL 2 Device intended for testing - @note Only available after getTestDevices() has completed */
const webgpuDevicePromise = makeWebGPUTestDevice();
/** Includes WebGPU device if available */
export async function getTestDevices(types = ['webgl', 'webgpu']) {
    const promises = types.map(type => getTestDevice(type));
    const devices = await Promise.all(promises);
    return devices.filter(device => device !== null);
}
export async function getTestDevice(type) {
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
export function getWebGPUTestDevice() {
    return webgpuDevicePromise;
}
/** returns WebGL device promise, if available */
export async function getWebGLTestDevice() {
    return webglDevicePromise;
}
/** returns null device promise, if available */
export async function getNullTestDevice() {
    return nullDevicePromise;
}
async function makeWebGPUTestDevice() {
    const webgpuDeviceResolvers = withResolvers();
    try {
        const webgpuDevice = (await luma.createDevice({
            id: 'webgpu-test-device',
            type: 'webgpu',
            adapters: [webgpuAdapter],
            createCanvasContext: DEFAULT_CANVAS_CONTEXT_PROPS,
            debug: true
        }));
        webgpuDeviceResolvers.resolve(webgpuDevice);
    }
    catch (error) {
        log.error(String(error))();
        // @ts-ignore TODO
        webgpuDeviceResolvers.resolve(null);
    }
    return webgpuDeviceResolvers.promise;
}
/** returns WebGL device promise, if available */
async function makeWebGLTestDevice() {
    const webglDeviceResolvers = withResolvers();
    try {
        const webglDevice = (await luma.createDevice({
            id: 'webgl-test-device',
            type: 'webgl',
            adapters: [webgl2Adapter],
            createCanvasContext: DEFAULT_CANVAS_CONTEXT_PROPS,
            debug: true
        }));
        webglDeviceResolvers.resolve(webglDevice);
    }
    catch (error) {
        log.error(String(error))();
        // @ts-ignore TODO
        webglDeviceResolvers.resolve(null);
    }
    return webglDeviceResolvers.promise;
}
/** returns null device promise, if available */
async function makeNullTestDevice() {
    const nullDeviceResolvers = withResolvers();
    try {
        const nullDevice = (await luma.createDevice({
            id: 'null-test-device',
            type: 'null',
            adapters: [nullAdapter],
            createCanvasContext: DEFAULT_CANVAS_CONTEXT_PROPS,
            debug: true
        }));
        nullDeviceResolvers.resolve(nullDevice);
    }
    catch (error) {
        log.error(String(error))();
        // @ts-ignore TODO
        nullDevicePromise = Promise.resolve(null);
    }
    return nullDeviceResolvers.promise;
}
// HELPERS
// TODO - replace with Promise.withResolvers once we upgrade TS baseline
function withResolvers() {
    let resolve;
    let reject;
    const promise = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    });
    // @ts-ignore Assigned in callback.
    return { promise, resolve, reject };
}
