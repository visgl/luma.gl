// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

test('WebGPUAdapter imports from the ESM package entry without circular init errors', async t => {
  t.plan(2);

  // Import the local entry file directly to avoid workspace alias resolution mixing src/dist modules.
  // This regression is about entry-module initialization, not package alias behavior.
  const webgpuModule = await import('../../../src/index');

  t.equal(webgpuModule.webgpuAdapter.type, 'webgpu', 'exports a WebGPU adapter instance');
  t.equal(webgpuModule.WebGPUDevice.name, 'WebGPUDevice', 'exports the WebGPU device class');
});
