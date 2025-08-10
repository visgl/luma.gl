// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// prettier-ignore
// / <reference types="@webgpu/types" />

import {Adapter, DeviceProps, log} from '@luma.gl/core';
import type {WebGPUDevice} from './webgpu-device';

export class WebGPUAdapter extends Adapter {
  /** type of device's created by this adapter */
  readonly type: WebGPUDevice['type'] = 'webgpu';

  isSupported(): boolean {
    // Check if WebGPU is available
    return Boolean(typeof navigator !== 'undefined' && navigator.gpu);
  }

  isDeviceHandle(handle: unknown): boolean {
    if (typeof GPUDevice !== 'undefined' && handle instanceof GPUDevice) {
      return true;
    }

    // TODO - WebGPU does not yet seem to have a stable in-browser API, so we "sniff" for members instead
    if ((handle as any)?.queue) {
      return true;
    }

    return false;
  }

  async create(props: DeviceProps): Promise<WebGPUDevice> {
    if (!navigator.gpu) {
      throw new Error('WebGPU not available. Recent Chrome browsers should work.');
    }

    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance'
      // forceSoftware: false
    });

    if (!adapter) {
      throw new Error('Failed to request WebGPU adapter');
    }

    //  Note: adapter.requestAdapterInfo() has been replaced with adapter.info. Fall back in case adapter.info is not available
    const adapterInfo =
      adapter.info ||
      // @ts-ignore
      (await adapter.requestAdapterInfo?.());
    // log.probe(2, 'Adapter available', adapterInfo)();

    const requiredFeatures: GPUFeatureName[] = [];
    const requiredLimits: Record<string, number> = {};

    if (props._requestMaxLimits) {
      // Require all features
      requiredFeatures.push(...(Array.from(adapter.features) as GPUFeatureName[]));

      // Require all limits
      // Filter out chrome specific keys (avoid crash)
      const limits = Object.keys(adapter.limits).filter(
        key => !['minSubgroupSize', 'maxSubgroupSize'].includes(key)
      );
      for (const key of limits) {
        const limit = key as keyof GPUSupportedLimits;
        const value = adapter.limits[limit];
        if (typeof value === 'number') {
          requiredLimits[limit] = value;
        }
      }
    }

    const gpuDevice = await adapter.requestDevice({
      requiredFeatures,
      requiredLimits
    });

    // log.probe(1, 'GPUDevice available')();

    const {WebGPUDevice} = await import('./webgpu-device');

    log.groupCollapsed(1, 'WebGPUDevice created')();
    try {
      const device = new WebGPUDevice(props, gpuDevice, adapter, adapterInfo);
      log.probe(
        1,
        'Device created. For more info, set chrome://flags/#enable-webgpu-developer-features'
      )();
      log.table(1, device.info)();
      return device;
    } finally {
      log.groupEnd(1)();
    }
  }

  async attach(handle: GPUDevice): Promise<WebGPUDevice> {
    throw new Error('WebGPUAdapter.attach() not implemented');
  }
}

export const webgpuAdapter = new WebGPUAdapter();
