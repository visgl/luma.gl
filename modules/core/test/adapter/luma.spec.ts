// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {nullAdapter} from '@luma.gl/test-utils';
import {luma} from '@luma.gl/core';

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
