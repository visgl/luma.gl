// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {GL} from '@luma.gl/constants';
import {getDeviceInfo} from '../../../src/adapter/device-helpers/webgl-device-info';

function createMockGL(options: {
  vendor: string;
  renderer: string;
  version?: string;
}): WebGL2RenderingContext {
  const {vendor, renderer, version = 'WebGL 2.0'} = options;

  return {
    getExtension: () => null,
    getParameter: (parameter: number) => {
      switch (parameter) {
        case GL.VENDOR:
          return vendor;
        case GL.RENDERER:
          return renderer;
        case GL.VERSION:
          return version;
        default:
          return null;
      }
    }
  } as WebGL2RenderingContext;
}

test('getDeviceInfo classifies Apple Silicon WebGL GPUs as integrated', t => {
  const gl = createMockGL({
    vendor: 'Apple',
    renderer: 'ANGLE Metal Renderer: Apple M4 Pro, Unspecified Version'
  });

  const info = getDeviceInfo(gl, {});
  t.equal(info.gpu, 'apple', 'identifies Apple GPU vendor');
  t.equal(info.gpuType, 'integrated', 'classifies Apple Silicon as integrated');
  t.end();
});

test('getDeviceInfo leaves ambiguous Apple WebGL GPUs as unknown type', t => {
  const gl = createMockGL({
    vendor: 'Apple',
    renderer: 'Apple'
  });

  const info = getDeviceInfo(gl, {});
  t.equal(info.gpu, 'apple', 'identifies Apple GPU vendor');
  t.equal(info.gpuType, 'unknown', 'does not default ambiguous Apple GPUs to discrete');
  t.end();
});
