// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {getRequiredWebGPULimits} from '../../../src/adapter/webgpu-adapter';

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
