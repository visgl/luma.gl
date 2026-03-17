// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

test('WebGLAdapter imports from the ESM package entry without circular init errors', async t => {
  t.plan(2);

  const webglModule = await import('@luma.gl/webgl');

  t.equal(webglModule.webgl2Adapter.type, 'webgl', 'exports a WebGL adapter instance');
  t.equal(webglModule.WebGLDevice.name, 'WebGLDevice', 'exports the WebGL device class');
});
