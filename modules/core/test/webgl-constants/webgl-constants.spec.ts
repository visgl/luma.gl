// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

import {GL} from '@luma.gl/core/webgl-constants';

it('@luma.gl/core/webgl-constants', () => {
  expect(typeof GL, '@luma.gl/core/webgl-constants is an object').toBe('object');
});

it('@luma.gl/core/webgl-constants#WebGL2RenderingContext comparison', async () => {
  const webglDevice = await getWebGLTestDevice();

  for (const device of [webglDevice]) {
    // @ts-ignore
    const gl = device.gl;
    for (const key in gl) {
      const value = gl[key];
      if (Number.isFinite(value) && key.toUpperCase() === key && GL[key] !== undefined) {
        // Avoid generating too much test log
        if (GL[key] !== value) {
          expect(GL[key], `GL.${key} is equal to gl.${key}`).toBe(value);
        }
      }
    }
  }
});
