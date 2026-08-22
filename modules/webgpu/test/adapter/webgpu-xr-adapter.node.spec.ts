// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {afterEach, describe, expect, test, vi} from 'vitest';
import {Device, type DeviceProps} from '@luma.gl/core';
import {getWebGPURequestAdapterOptions, WebGPUAdapter} from '../../src/adapter/webgpu-adapter';

class TestWebGPUAdapter extends WebGPUAdapter {
  requestNativeAdapter(props: DeviceProps): Promise<GPUAdapter | null> {
    return this.requestGPUAdapter(getWebGPURequestAdapterOptions(props));
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('XR-compatible WebGPU adapter requests', () => {
  test('preserves ordinary adapter requests unless XR compatibility is enabled', () => {
    expect(Device.defaultProps.xrCompatible).toBe(false);
    expect(Device.defaultProps.powerPreference).toBe('default');
    expect(getWebGPURequestAdapterOptions({})).toEqual({featureLevel: 'core'});
    expect(getWebGPURequestAdapterOptions({xrCompatible: false})).toEqual({
      featureLevel: 'core'
    });
    expect(getWebGPURequestAdapterOptions({xrCompatible: true})).toEqual({
      featureLevel: 'core',
      xrCompatible: true
    });
    expect(
      getWebGPURequestAdapterOptions({
        featureLevel: 'compatibility',
        powerPreference: 'low-power',
        xrCompatible: true
      })
    ).toEqual({
      featureLevel: 'compatibility',
      powerPreference: 'low-power',
      xrCompatible: true
    });
  });

  test('forwards XR compatibility and obtains a fresh native adapter per request', async () => {
    let adapterIndex = 0;
    const requestAdapter = vi.fn(async () => ({adapterIndex: adapterIndex++}) as GPUAdapter);
    vi.stubGlobal('navigator', {gpu: {requestAdapter}});

    const adapter = new TestWebGPUAdapter();
    const standardAdapterRequest = adapter.requestNativeAdapter({});
    const repeatedStandardAdapterRequest = adapter.requestNativeAdapter({xrCompatible: false});
    const compatibleAdapterRequest = adapter.requestNativeAdapter({xrCompatible: true});
    const repeatedCompatibleAdapterRequest = adapter.requestNativeAdapter({xrCompatible: true});

    expect(repeatedStandardAdapterRequest).not.toBe(standardAdapterRequest);
    expect(repeatedCompatibleAdapterRequest).not.toBe(compatibleAdapterRequest);
    expect(requestAdapter).toHaveBeenCalledTimes(4);
    expect(requestAdapter).toHaveBeenNthCalledWith(1, {featureLevel: 'core'});
    expect(requestAdapter).toHaveBeenNthCalledWith(3, {
      featureLevel: 'core',
      xrCompatible: true
    });
    await expect(standardAdapterRequest).resolves.toMatchObject({adapterIndex: 0});
    await expect(repeatedStandardAdapterRequest).resolves.toMatchObject({adapterIndex: 1});
    await expect(compatibleAdapterRequest).resolves.toMatchObject({adapterIndex: 2});
    await expect(repeatedCompatibleAdapterRequest).resolves.toMatchObject({adapterIndex: 3});
  });
});
