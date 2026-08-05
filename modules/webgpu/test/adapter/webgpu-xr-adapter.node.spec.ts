// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, describe, expect, test, vi} from 'vitest';
import {Device, type DeviceProps} from '@luma.gl/core';
import {
  getWebGPUFeatureLevel,
  getWebGPURequestAdapterOptions,
  WebGPUAdapter
} from '../../src/adapter/webgpu-adapter';

class TestWebGPUAdapter extends WebGPUAdapter {
  getAdapterCacheKey(props: DeviceProps): string {
    return this.getGPUAdapterCacheKey(
      getWebGPUFeatureLevel(props),
      getWebGPURequestAdapterOptions(props)
    );
  }

  requestNativeAdapter(props: DeviceProps): Promise<GPUAdapter | null> {
    const requestAdapterOptions = getWebGPURequestAdapterOptions(props);

    return this.getGPUAdapterPromise(
      this.getGPUAdapterCacheKey(getWebGPUFeatureLevel(props), requestAdapterOptions),
      requestAdapterOptions
    );
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('XR-compatible WebGPU adapter requests', () => {
  test('preserves ordinary adapter requests unless XR compatibility is enabled', () => {
    expect(Device.defaultProps.xrCompatible).toBe(false);
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

  test('separates XR-compatible cache entries without changing ordinary cache keys', () => {
    const adapter = new TestWebGPUAdapter();
    const standardCacheKey = adapter.getAdapterCacheKey({});
    const compatibleCacheKey = adapter.getAdapterCacheKey({xrCompatible: true});

    expect(standardCacheKey).toBe('core:core:default');
    expect(adapter.getAdapterCacheKey({xrCompatible: false})).toBe(standardCacheKey);
    expect(compatibleCacheKey).toBe('core:core:default:xr-compatible');
    expect(compatibleCacheKey).not.toBe(standardCacheKey);
    expect(adapter.getAdapterCacheKey({xrCompatible: true, powerPreference: 'low-power'})).not.toBe(
      compatibleCacheKey
    );
    expect(
      adapter.getAdapterCacheKey({xrCompatible: true, featureLevel: 'compatibility'})
    ).not.toBe(compatibleCacheKey);
  });

  test('forwards XR compatibility to native requests and caches each adapter profile', async () => {
    const standardAdapter = {} as GPUAdapter;
    const compatibleAdapter = {} as GPUAdapter;
    const requestAdapter = vi.fn(async (options: GPURequestAdapterOptions) =>
      options.xrCompatible ? compatibleAdapter : standardAdapter
    );
    vi.stubGlobal('navigator', {gpu: {requestAdapter}});

    const adapter = new TestWebGPUAdapter();
    const standardAdapterRequest = adapter.requestNativeAdapter({});
    const repeatedStandardAdapterRequest = adapter.requestNativeAdapter({xrCompatible: false});
    const compatibleAdapterRequest = adapter.requestNativeAdapter({xrCompatible: true});
    const repeatedCompatibleAdapterRequest = adapter.requestNativeAdapter({xrCompatible: true});

    expect(repeatedStandardAdapterRequest).toBe(standardAdapterRequest);
    expect(repeatedCompatibleAdapterRequest).toBe(compatibleAdapterRequest);
    expect(compatibleAdapterRequest).not.toBe(standardAdapterRequest);
    expect(requestAdapter).toHaveBeenCalledTimes(2);
    expect(requestAdapter).toHaveBeenNthCalledWith(1, {featureLevel: 'core'});
    expect(requestAdapter).toHaveBeenNthCalledWith(2, {
      featureLevel: 'core',
      xrCompatible: true
    });
    await expect(standardAdapterRequest).resolves.toBe(standardAdapter);
    await expect(compatibleAdapterRequest).resolves.toBe(compatibleAdapter);
  });
});
