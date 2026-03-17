// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

test('WebGLAdapter imports from the ESM package entry without circular init errors', async t => {
  t.plan(2);

  // Import the local entry file directly to avoid workspace alias resolution mixing src/dist modules.
  // This regression is about entry-module initialization, not package alias behavior.
  const webglModule = await import('../../src/index');

  t.equal(webglModule.webgl2Adapter.type, 'webgl', 'exports a WebGL adapter instance');
  t.equal(webglModule.WebGLDevice.name, 'WebGLDevice', 'exports the WebGL device class');
});
