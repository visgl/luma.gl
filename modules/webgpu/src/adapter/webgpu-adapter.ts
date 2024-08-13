// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Adapter, DeviceProps, CanvasContext, log} from '@luma.gl/core';
import {WebGPUDevice} from './webgpu-device';

// / <reference types="@webgpu/types" />

export class WebGPUAdapter extends Adapter {
  /** type of device's created by this adapter */
  readonly type: WebGPUDevice['type'] = 'webgpu';

  constructor() {
    super();
    // @ts-ignore For backwards compatibility luma.registerDevices
    WebGPUDevice.adapter = this;
  }

  /** Check if WebGPU is available */
  isSupported(): boolean {
    return Boolean(typeof navigator !== 'undefined' && navigator.gpu);
  }

  async create(props: DeviceProps): Promise<WebGPUDevice> {
    if (!navigator.gpu) {
      throw new Error(
        'WebGPU not available. Open in Chrome Canary and turn on chrome://flags/#enable-unsafe-webgpu'
      );
    }
    log.groupCollapsed(1, 'WebGPUDevice created')();
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance'
      // forceSoftware: false
    });

    if (!adapter) {
      throw new Error('Failed to request WebGPU adapter');
    }

    const adapterInfo = await adapter.requestAdapterInfo();
    log.probe(2, 'Adapter available', adapterInfo)();

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

    log.probe(1, 'GPUDevice available')();

    if (typeof props.canvasContext?.canvas === 'string') {
      await CanvasContext.pageLoaded;
      log.probe(1, 'DOM is loaded')();
    }

    const device = new WebGPUDevice(props, gpuDevice, adapter, adapterInfo);

    log.probe(
      1,
      'Device created. For more info, set chrome://flags/#enable-webgpu-developer-features'
    )();
    log.table(1, device.info)();
    log.groupEnd(1)();
    return device;
  }

  async attach(handle: GPUDevice): Promise<WebGPUDevice> {
    throw new Error('WebGPUAdapter.attach() not implemented');
  }
}

export const webgpuAdapter = new WebGPUAdapter();
