import {expect, test} from 'vitest';
import { createTestContext } from '@luma.gl/test-utils';
import GL from '@luma.gl/constants';
import { Framebuffer, getKey } from '@luma.gl/webgl';
import { setParameters, getParameters, resetParameters } from '@luma.gl/webgl';
import { GL_PARAMETER_DEFAULTS } from '@luma.gl/webgl/context/parameters/webgl-parameter-tables';
import { ENUM_STYLE_SETTINGS_SET1_PRIMITIVE } from './sample-enum-settings';

// Settings test, don't reuse a context
const fixture = {
  gl: createTestContext({
    debug: true
  }),
  gl2: createTestContext({
    debug: true,
    webgl2: true,
    webgl1: false
  })
};
function stringifyTypedArray(v) {
  v = ArrayBuffer.isView(v) ? Array.apply([], v) : v;
  return JSON.stringify(v);
}
test('WebGL#set and get', () => {
  const {
    gl
  } = fixture;
  resetParameters(gl);
  let value = getParameters(gl, [GL.CULL_FACE])[GL.CULL_FACE];
  expect(value, `got expected value ${stringifyTypedArray(value)}`).toEqual(false);
  setParameters(gl, {
    [GL.CULL_FACE]: true
  });
  value = getParameters(gl, [GL.CULL_FACE])[GL.CULL_FACE];
  expect(value, `got expected value ${stringifyTypedArray(value)}`).toEqual(true);
  value = getParameters(gl, [GL.DEPTH_CLEAR_VALUE])[GL.DEPTH_CLEAR_VALUE];
  expect(value, `got expected value ${stringifyTypedArray(value)}`).toBe(1);
  setParameters(gl, {
    [GL.DEPTH_CLEAR_VALUE]: -1
  });
  value = getParameters(gl, [GL.DEPTH_CLEAR_VALUE])[GL.DEPTH_CLEAR_VALUE];
  expect(value, `got expected value ${stringifyTypedArray(value)}`).toBe(-1);

  // @ts-expect-error
  expect(() => setParameters({}), 'throws with non WebGL context').toThrow();
});
test('WebGL#composite setter', () => {
  const {
    gl
  } = fixture;
  const compositeStateKeys = [GL.STENCIL_FUNC, GL.STENCIL_REF, GL.STENCIL_VALUE_MASK];
  resetParameters(gl);

  // Verify default values.
  for (const key of compositeStateKeys) {
    const value = getParameters(gl, [key])[key];
    expect(value, `got expected default value ${stringifyTypedArray(value)}`).toEqual(GL_PARAMETER_DEFAULTS[key]);
  }

  // Update only two states out of three.
  setParameters(gl, {
    [GL.STENCIL_FUNC]: GL.NEVER,
    [GL.STENCIL_REF]: 0.5
  });
  let value = getParameters(gl, [GL.STENCIL_FUNC])[GL.STENCIL_FUNC];
  expect(value, `got expected updated value ${stringifyTypedArray(value)}`).toEqual(GL.NEVER);
  value = getParameters(gl, [GL.STENCIL_REF])[GL.STENCIL_REF];
  expect(value, `got expected updated value ${stringifyTypedArray(value)}`).toEqual(0.5);
  value = getParameters(gl, [GL.STENCIL_VALUE_MASK])[GL.STENCIL_VALUE_MASK];
  expect(value, `got expected updated defuault value ${stringifyTypedArray(value)}`).toEqual(GL_PARAMETER_DEFAULTS[GL.STENCIL_VALUE_MASK]);
});
test('WebGLState#get all parameters', () => {
  const {
    gl
  } = fixture;
  resetParameters(gl);

  // Set custom values.
  setParameters(gl, ENUM_STYLE_SETTINGS_SET1_PRIMITIVE);
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    const value = getParameters(gl, [key])[key];
    expect(value, `got expected value ${stringifyTypedArray(value)} after setParameters for ${getKey(GL, key)}`).toEqual(ENUM_STYLE_SETTINGS_SET1_PRIMITIVE[key]);
  }
  const copy = getParameters(gl);
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    const value = copy[key];
    expect(value, `got expected value ${stringifyTypedArray(value)} after getParameters for ${getKey(GL, key)}`).toEqual(ENUM_STYLE_SETTINGS_SET1_PRIMITIVE[key]);
  }
});
test('WebGL#reset', () => {
  const {
    gl
  } = fixture;

  // Set custom values and verify.
  setParameters(gl, ENUM_STYLE_SETTINGS_SET1_PRIMITIVE);
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    const value = getParameters(gl, [key])[key];
    expect(value, `got expected value ${stringifyTypedArray(value)} after setParameters for ${getKey(GL, key)}`).toEqual(ENUM_STYLE_SETTINGS_SET1_PRIMITIVE[key]);
  }

  // reset
  resetParameters(gl);

  // Verify default values.
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    const value = getParameters(gl, [key])[key];
    expect(value, `got expected value ${stringifyTypedArray(value)} after resetParameters for ${getKey(GL, key)}`).toEqual(GL_PARAMETER_DEFAULTS[key]);
  }
});
test('WebGLState#setParameters framebuffer', () => {
  const {
    gl
  } = fixture;
  resetParameters(gl);
  let fbHandle = getParameters(gl, [gl.FRAMEBUFFER_BINDING])[gl.FRAMEBUFFER_BINDING];
  // t.equal(fbHandle, null, 'Initial frambuffer binding should be null');
  const framebuffer = new Framebuffer(gl);
  setParameters(gl, {
    [GL.FRAMEBUFFER_BINDING]: framebuffer.handle
  });
  fbHandle = getParameters(gl, [gl.FRAMEBUFFER_BINDING])[gl.FRAMEBUFFER_BINDING];
  expect(fbHandle, 'setParameters should set framebuffer binding').toBe(framebuffer.handle);

  // verify setting null value
  setParameters(gl, {
    [GL.FRAMEBUFFER_BINDING]: null
  });
  fbHandle = getParameters(gl, [gl.FRAMEBUFFER_BINDING])[gl.FRAMEBUFFER_BINDING];
  expect(fbHandle, 'setParameters should set framebuffer binding').toBe(null);
});
test('WebGLState#setParameters read-framebuffer (WebGL2 only)', () => {
  const {
    gl2
  } = fixture;
  // const gl2 = createTestContext({webgl2: true, webgl1: false});
  if (gl2) {
    resetParameters(gl2);

    // @ts-expect-error
    let fbHandle = getParameters(gl2, [gl2.READ_FRAMEBUFFER_BINDING])[gl2.READ_FRAMEBUFFER_BINDING];
    // t.equal(fbHandle, null, 'Initial read-frambuffer binding should be null');
    const framebuffer = new Framebuffer(gl2);
    setParameters(gl2, {
      [GL.READ_FRAMEBUFFER_BINDING]: framebuffer.handle
    });
    // @ts-expect-error
    fbHandle = getParameters(gl2, [gl2.READ_FRAMEBUFFER_BINDING])[gl2.READ_FRAMEBUFFER_BINDING];
    expect(fbHandle, 'setParameters should set read-framebuffer binding').toBe(framebuffer.handle);

    // verify setting null value
    setParameters(gl2, {
      [GL.READ_FRAMEBUFFER_BINDING]: null
    });
    // @ts-expect-error
    fbHandle = getParameters(gl2, [gl2.READ_FRAMEBUFFER_BINDING])[gl2.READ_FRAMEBUFFER_BINDING];
    expect(fbHandle, 'setParameters should set read-framebuffer binding').toBe(null);
  } else {}
});
