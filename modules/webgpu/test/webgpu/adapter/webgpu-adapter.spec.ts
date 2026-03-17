// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

test('WebGPUAdapter imports from the ESM package entry without circular init errors', async t => {
  t.plan(2);

  const webgpuModule = await import('@luma.gl/webgpu');

  t.equal(webgpuModule.webgpuAdapter.type, 'webgpu', 'exports a WebGPU adapter instance');
  t.equal(webgpuModule.WebGPUDevice.name, 'WebGPUDevice', 'exports the WebGPU device class');
});
