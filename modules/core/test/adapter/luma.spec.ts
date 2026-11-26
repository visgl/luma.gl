// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {webgl2Adapter} from '@luma.gl/core/webgl';
import {nullAdapter} from '@luma.gl/core/test-utils';
import {luma, type Adapter} from '@luma.gl/core';

it('luma#attachDevice', async () => {
  const device = await luma.attachDevice(null, {adapters: [nullAdapter]});
  expect(device.type, 'info.vendor ok').toBe('null');
  expect(device.info.vendor, 'info.vendor ok').toBe('no one');
  expect(device.info.renderer, 'info.renderer ok').toBe('none');
  void 0;
});

it('luma#attachDevice forwards canvas context compatibility props', async () => {
  const device = await luma.attachDevice(null, {
    adapters: [nullAdapter],
    createCanvasContext: {pixelSizeSource: 'css-dpr'}
  });
  expect(device.getDefaultCanvasContext().props.pixelSizeSource, 'pixelSizeSource ok').toBe(
    'css-dpr'
  );
  void 0;
});

it('luma#createDevice', async () => {
  const device = await luma.createDevice({type: 'null', adapters: [nullAdapter]});
  expect(device.type, 'info.vendor ok').toBe('null');
  expect(device.info.vendor, 'info.vendor ok').toBe('no one');
  expect(device.info.renderer, 'info.renderer ok').toBe('none');
  void 0;
});

it.each([
  'best-available',
  'webgpu'
] as const)('luma#createDevice with %s when requestAdapter returns null', async type => {
  const requestAdapter = vi.fn().mockResolvedValue(null);
  vi.stubGlobal('navigator', {gpu: {requestAdapter}});
  const createWebGL = vi
    .spyOn(webgl2Adapter, 'create')
    .mockImplementation(props => nullAdapter.create(props));
  const supportsWebGL = vi.spyOn(webgl2Adapter, 'isSupported').mockReturnValue(true);
  try {
    const result = luma.createDevice({type, adapters: [webgpuAdapter, webgl2Adapter]});
    if (type === 'best-available') {
      const device = await result;
      expect(createWebGL).toHaveBeenCalledTimes(1);
      device.destroy();
    } else {
      await expect(result).rejects.toThrow('navigator.gpu.requestAdapter() returned null');
      expect(createWebGL).not.toHaveBeenCalled();
    }
    expect(requestAdapter).toHaveBeenCalledTimes(1);
  } finally {
    supportsWebGL.mockRestore();
    createWebGL.mockRestore();
    vi.unstubAllGlobals();
  }
});

it('luma#createDevice alerts browser users to debug failures', async () => {
  const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {});
  const adapter = {
    type: 'webgpu',
    pageLoaded: Promise.resolve(),
    create: async () => {
      throw new Error('WebGPU unavailable');
    }
  } as unknown as Adapter;

  try {
    await expect(
      luma.createDevice({
        type: 'webgpu',
        adapters: [adapter],
        debug: true,
        waitForPageLoad: false
      })
    ).rejects.toThrow('WebGPU unavailable');
    expect(alertSpy, 'the native error is shown').toHaveBeenCalledWith('WebGPU unavailable');
  } finally {
    alertSpy.mockRestore();
  }
});

it('luma#registerAdapters', async () => {
  luma.registerAdapters([nullAdapter]);
  const device = await luma.createDevice({type: 'null'});
  expect(device.type, 'info.vendor ok').toBe('null');
  expect(device.info.vendor, 'info.vendor ok').toBe('no one');
  expect(device.info.renderer, 'info.renderer ok').toBe('none');
  void 0;
});

it('luma#getSupportedAdapters', async () => {
  luma.registerAdapters([nullAdapter]);
  const types = luma.getSupportedAdapters();
  expect(Boolean(types.includes('null')), 'null device is supported').toBe(true);
});

it('luma#getBestAvailableAdapterType', async () => {
  luma.registerAdapters([nullAdapter]);
  // Somewhat dummy test, as tests rely on test utils registering webgl and webgpu devices
  // But they might not be supported on all devices.
  const type = luma.getBestAvailableAdapterType();
  expect(Boolean(typeof type === 'string'), 'does not crash').toBe(true);
});

// To suppress @typescript-eslint/unbound-method
interface TestHTMLCanvasElement {
  getContext: (contextId: any, options?: unknown) => string;
  originalGetContext?: (contextId: any, options?: unknown) => unknown;
}

it('luma#enforceWebGL2', async () => {
  const prototype = HTMLCanvasElement.prototype as unknown as TestHTMLCanvasElement;

  // Setup mock getContext
  const _originalGetContext = prototype.getContext;
  prototype.getContext = function (contextId: any, options?: unknown) {
    return `${contextId}-mock`;
  };
  // Revert mock test completes.
  void 0;

  expect(prototype.getContext('webgl'), 'mocked getContext webgl ok').toBe('webgl-mock');
  expect(
    prototype.getContext('experimental-webgl'),
    'mocked getContext experimental-webgl ok'
  ).toBe('experimental-webgl-mock');
  expect(prototype.getContext('webgl2'), 'mocked getContext webgl2 ok').toBe('webgl2-mock');

  luma.enforceWebGL2();

  expect(Boolean(prototype.originalGetContext), 'originalGetContext ok').toBe(true);
  expect(prototype.getContext('webgl'), 'getContext enforce webgl2 ok').toBe('webgl2-mock');
  expect(prototype.getContext('experimental-webgl'), 'getContext enforce webgl2 ok').toBe(
    'webgl2-mock'
  );
  expect(prototype.getContext('webgl2'), 'getContext webgl2 ok').toBe('webgl2-mock');

  luma.enforceWebGL2(false);

  expect(Boolean(prototype.originalGetContext), 'originalGetContext ok').toBe(false);
  expect(prototype.getContext('webgl'), 'mocked getContext revert webgl ok').toBe('webgl-mock');
  expect(
    prototype.getContext('experimental-webgl'),
    'mocked getContext revert experimental-webgl ok'
  ).toBe('experimental-webgl-mock');
  expect(prototype.getContext('webgl2'), 'mocked getContext webgl2 ok').toBe('webgl2-mock');

  void 0;
});
