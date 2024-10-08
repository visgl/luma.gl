// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {nullAdapter} from '@luma.gl/test-utils';
import {luma} from '@luma.gl/core';

test('luma#attachDevice', async t => {
  const device = await luma.attachDevice(null, {adapters: [nullAdapter]});
  t.equal(device.type, 'null', 'info.vendor ok');
  t.equal(device.info.vendor, 'no one', 'info.vendor ok');
  t.equal(device.info.renderer, 'none', 'info.renderer ok');
  t.end();
});

test('luma#createDevice', async t => {
  const device = await luma.createDevice({type: 'null', adapters: [nullAdapter]});
  t.equal(device.type, 'null', 'info.vendor ok');
  t.equal(device.info.vendor, 'no one', 'info.vendor ok');
  t.equal(device.info.renderer, 'none', 'info.renderer ok');
  t.end();
});

test('luma#registerAdapters', async t => {
  luma.registerAdapters([nullAdapter]);
  const device = await luma.createDevice({type: 'null'});
  t.equal(device.type, 'null', 'info.vendor ok');
  t.equal(device.info.vendor, 'no one', 'info.vendor ok');
  t.equal(device.info.renderer, 'none', 'info.renderer ok');
  t.end();
});

test('luma#getSupportedAdapters', async t => {
  luma.registerAdapters([nullAdapter]);
  const types = luma.getSupportedAdapters();
  t.ok(types.includes('null'), 'null device is supported');
});

test('luma#getBestAvailableAdapterType', async t => {
  luma.registerAdapters([nullAdapter]);
  // Somewhat dummy test, as tests rely on test utils registering webgl and webgpu devices
  // But they might not be supported on all devices.
  const type = luma.getBestAvailableAdapterType();
  t.ok(typeof type === 'string', 'does not crash');
});

// To suppress @typescript-eslint/unbound-method
interface TestHTMLCanvasElement {
  getContext: (contextId: any, options?: unknown) => string;
  originalGetContext?: (contextId: any, options?: unknown) => unknown;
}

test('luma#enforceWebGL2', async t => {
  const prototype = HTMLCanvasElement.prototype as unknown as TestHTMLCanvasElement;

  // Setup mock getContext
  const originalGetContext = prototype.getContext;
  prototype.getContext = function (contextId: any, options?: unknown) {
    return `${contextId}-mock`;
  };
  // Revert mock test completes.
  t.teardown(() => {
    prototype.getContext = originalGetContext;
  });

  t.equal(prototype.getContext('webgl'), 'webgl-mock', 'mocked getContext webgl ok');
  t.equal(
    prototype.getContext('experimental-webgl'),
    'experimental-webgl-mock',
    'mocked getContext experimental-webgl ok'
  );
  t.equal(prototype.getContext('webgl2'), 'webgl2-mock', 'mocked getContext webgl2 ok');

  luma.enforceWebGL2();

  t.true(prototype.originalGetContext, 'originalGetContext ok');
  t.equal(prototype.getContext('webgl'), 'webgl2-mock', 'getContext enforce webgl2 ok');
  t.equal(
    prototype.getContext('experimental-webgl'),
    'webgl2-mock',
    'getContext enforce webgl2 ok'
  );
  t.equal(prototype.getContext('webgl2'), 'webgl2-mock', 'getContext webgl2 ok');

  luma.enforceWebGL2(false);

  t.false(prototype.originalGetContext, 'originalGetContext ok');
  t.equal(prototype.getContext('webgl'), 'webgl-mock', 'mocked getContext revert webgl ok');
  t.equal(
    prototype.getContext('experimental-webgl'),
    'experimental-webgl-mock',
    'mocked getContext revert experimental-webgl ok'
  );
  t.equal(prototype.getContext('webgl2'), 'webgl2-mock', 'mocked getContext webgl2 ok');

  t.end();
});
