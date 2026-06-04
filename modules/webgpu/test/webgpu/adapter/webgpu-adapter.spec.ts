// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  getRequiredWebGPUFeatures,
  getRequiredWebGPULimits,
  getWebGPUFeatureLevel,
  getWebGPURequestAdapterOptions
} from '../../../src/adapter/webgpu-adapter';

test('WebGPUAdapter imports from the ESM package entry without circular init errors', async t => {
  t.plan(2);

  // Import the local entry file directly to avoid workspace alias resolution mixing src/dist modules.
  // This regression is about entry-module initialization, not package alias behavior.
  const webgpuModule = await import('../../../src/index');

  t.equal(webgpuModule.webgpuAdapter.type, 'webgpu', 'exports a WebGPU adapter instance');
  t.equal(webgpuModule.WebGPUDevice.name, 'WebGPUDevice', 'exports the WebGPU device class');
});

test('getRequiredWebGPULimits reads non-enumerable supported limits directly', t => {
  const supportedLimits = {} as GPUSupportedLimits;
  Object.defineProperties(supportedLimits, {
    maxBufferSize: {value: 4096, enumerable: false},
    maxStorageBufferBindingSize: {value: 2048, enumerable: false}
  });

  const requiredLimits = getRequiredWebGPULimits(supportedLimits);

  t.deepEqual(Object.keys(supportedLimits), [], 'the test limits are not enumerable');
  t.equal(requiredLimits.maxBufferSize, 4096, 'buffer size is still requested');
  t.equal(
    requiredLimits.maxStorageBufferBindingSize,
    2048,
    'storage binding size is still requested'
  );
  t.end();
});

test('WebGPUAdapter feature level helpers map luma props to WebGPU requests', t => {
  t.equal(getWebGPUFeatureLevel({}), 'core', 'defaults to core');
  t.equal(getWebGPUFeatureLevel({featureLevel: 'max'}), 'max', 'explicit level is returned');

  t.deepEqual(
    getWebGPURequestAdapterOptions({powerPreference: 'default'}),
    {featureLevel: 'core'},
    'core requests core and omits default power preference'
  );
  t.deepEqual(
    getWebGPURequestAdapterOptions({powerPreference: 'low-power'}),
    {featureLevel: 'core', powerPreference: 'low-power'},
    'max requests a core adapter'
  );

  t.end();
});

test('WebGPUAdapter feature helpers keep core and max behavior separate', t => {
  const supportedFeatures = new Set(['texture-compression-bc']) as GPUSupportedFeatures;

  t.deepEqual(
    getRequiredWebGPUFeatures(supportedFeatures, 'core'),
    [],
    'core does not request optional features'
  );
  t.deepEqual(
    getRequiredWebGPUFeatures(supportedFeatures, 'max'),
    ['texture-compression-bc'],
    'max requests all adapter features'
  );

  t.end();
});
