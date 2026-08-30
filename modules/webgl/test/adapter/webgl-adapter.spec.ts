// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';

it('WebGLAdapter imports from the ESM package entry without circular init errors', async () => {
  // Import the local entry file directly to avoid workspace alias resolution mixing src/dist modules.
  // This regression is about entry-module initialization, not package alias behavior.
  const webglModule = await import('../../src/index');

  expect(webglModule.webgl2Adapter.type, 'exports a WebGL adapter instance').toBe('webgl');
  expect(webglModule.WebGLDevice.name, 'exports the WebGL device class').toBe('WebGLDevice');
});
