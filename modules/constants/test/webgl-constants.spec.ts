import {expect, test} from 'vitest';
import { getWebGLTestDevice } from '@luma.gl/test-utils';
import { GL } from '@luma.gl/constants';
test('@luma.gl/constants', () => {
  expect(typeof GL, '@luma.gl/constants is an object').toBe('object');
});
test('@luma.gl/constants#WebGL2RenderingContext comparison', async () => {
  const webglDevice = await getWebGLTestDevice();
  for (const device of [webglDevice]) {
    // @ts-ignore
    const gl = device.gl;
    let count = 0;
    for (const key in gl) {
      const value = gl[key];
      if (Number.isFinite(value) && key.toUpperCase() === key && GL[key] !== undefined) {
        // Avoid generating too much test log
        if (GL[key] !== value) {
          expect(GL[key], `GL.${key} is equal to gl.${key}`).toBe(value);
        }
        count++;
      }
    }
  }
});
