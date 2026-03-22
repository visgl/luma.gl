import {expect, test} from 'vitest';
import { GL_PARAMETER_DEFAULTS, GL_PARAMETER_SETTERS } from '@luma.gl/webgl/context/parameters/webgl-parameter-tables';
import { luma } from '@luma.gl/core';
import { WebGLDevice, getGLParameters, setGLParameters, resetGLParameters, WebGLStateTracker } from '@luma.gl/webgl';
import { stringifyTypedArray } from './context-state.spec';
import { ENUM_STYLE_SETTINGS_SET1, ENUM_STYLE_SETTINGS_SET2 } from './data/sample-enum-settings';

// Settings test, don't reuse a context
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
const devicePromise = luma.createDevice({
  type: 'webgl',
  createCanvasContext: true
}) as Promise<WebGLDevice>;
test('WebGLStateTracker#imports', async () => {
  expect(typeof WebGLStateTracker === 'function', 'WebGLStateTracker imported OK').toBeTruthy();
});

// test.skip('WebGLStateTracker#trackContextState', async t => {
//   const {gl} = device;
//   t.doesNotThrow(
//     () => trackContextState(gl, {copyState: false}),
//     'trackContextState call succeeded'
//   );
//   t.end();
// });

test('WebGLStateTracker#push & pop', async () => {
  const device = await devicePromise;
  const {
    gl
  } = device;
  resetGLParameters(gl);
  let parameters = getGLParameters(gl);

  // Verify default values.
  for (const key in GL_PARAMETER_DEFAULTS) {
    const value = parameters[key];
    expect(value, `default: got expected value ${stringifyTypedArray(value)} for key: ${key}`).toEqual(GL_PARAMETER_DEFAULTS[key]);
  }
  device.pushState();

  // Set custom values and verify.
  setGLParameters(gl, ENUM_STYLE_SETTINGS_SET1);
  parameters = getGLParameters(gl);
  for (const key in ENUM_STYLE_SETTINGS_SET1) {
    const value = parameters[key];
    expect(value, `first set: got expected set value ${stringifyTypedArray(value)} for key: ${key}`).toEqual(ENUM_STYLE_SETTINGS_SET1[key]);
  }
  device.pushState();

  // Set custom values and verify
  setGLParameters(gl, ENUM_STYLE_SETTINGS_SET2);
  parameters = getGLParameters(gl);
  for (const [key, value] of Object.entries(ENUM_STYLE_SETTINGS_SET2)) {
    expect(value, `second set: got expected value ${stringifyTypedArray(value)} for key: ${key}`).toEqual(ENUM_STYLE_SETTINGS_SET2[key]);
  }

  // Pop and verify values restore to previous state
  device.popState();
  parameters = getGLParameters(gl);
  for (const key in ENUM_STYLE_SETTINGS_SET1) {
    const value = parameters[key];
    expect(value, `first pop: got expected value ${stringifyTypedArray(value)} for key: ${key}`).toEqual(ENUM_STYLE_SETTINGS_SET1[key]);
  }
  device.popState();
  parameters = getGLParameters(gl);
  for (const key in GL_PARAMETER_DEFAULTS) {
    const value = parameters[key];
    expect(value, `second pop: got expected value ${stringifyTypedArray(value)} for key: ${key}`).toEqual(GL_PARAMETER_DEFAULTS[key]);
  }
});
test('WebGLStateTracker#gl API', async () => {
  const device = await devicePromise;
  const {
    gl
  } = device;
  resetGLParameters(gl);
  let parameters = getGLParameters(gl);

  // Verify default values.
  for (const key in GL_PARAMETER_DEFAULTS) {
    const value = parameters[key];
    expect(value, `got expected value ${stringifyTypedArray(value)}`).toEqual(GL_PARAMETER_DEFAULTS[key]);
  }
  device.pushState();

  // TODO: test gl calls for compsite setters too (may be just call all gl calls).
  for (const key in ENUM_STYLE_SETTINGS_SET1) {
    const value = ENUM_STYLE_SETTINGS_SET1[key];
    const glSetter = GL_PARAMETER_SETTERS[key];
    // Skipping composite setters
    if (typeof glSetter !== 'string') {
      glSetter(gl, value, key);
    }
  }
  parameters = getGLParameters(gl);
  for (const key in ENUM_STYLE_SETTINGS_SET1) {
    // Skipping composite setters
    if (!isNaN(Number(GL_PARAMETER_SETTERS[key]))) {
      // @ts-expect-error
      const value = getGLParameters(gl, [key])[key];
      expect(value, `got expected value ${stringifyTypedArray(value)}`).toEqual(ENUM_STYLE_SETTINGS_SET1[key]);
    }
  }
  device.popState();
  parameters = getGLParameters(gl);
  for (const key in GL_PARAMETER_DEFAULTS) {
    const value = parameters[key];
    expect(value, `got expected value ${stringifyTypedArray(value)}`).toEqual(GL_PARAMETER_DEFAULTS[key]);
  }
});
test('WebGLStateTracker#intercept gl calls', async () => {
  const device = await devicePromise;
  const {
    gl
  } = device;
  resetGLParameters(gl);
  device.pushState();
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  expect(gl.getParameter(gl.ARRAY_BUFFER_BINDING), 'buffer is bound').toBe(buffer);
  gl.blendEquation(gl.FUNC_SUBTRACT);
  expect(getGLParameters(gl, gl.BLEND_EQUATION_RGB), 'direct gl call is tracked').toBe(gl.FUNC_SUBTRACT);
  gl.blendFunc(gl.ONE, gl.ONE);
  expect(getGLParameters(gl, gl.BLEND_SRC_RGB), 'direct gl call is tracked').toBe(gl.ONE);
  gl.stencilMask(8);
  expect(getGLParameters(gl, gl.STENCIL_WRITEMASK), 'direct gl call is tracked').toBe(8);
  gl.stencilFunc(gl.NEVER, 0, 1);
  expect(getGLParameters(gl, gl.STENCIL_FUNC), 'direct gl call is tracked').toBe(gl.NEVER);
  gl.stencilOp(gl.KEEP, gl.ZERO, gl.REPLACE);
  expect(getGLParameters(gl, gl.STENCIL_PASS_DEPTH_FAIL), 'direct gl call is tracked').toBe(gl.ZERO);
  device.popState();
  const parameters = getGLParameters(gl);

  // Verify default values.
  for (const key in GL_PARAMETER_DEFAULTS) {
    const value = parameters[key];
    expect(value, `got expected value ${stringifyTypedArray(value)}`).toEqual(GL_PARAMETER_DEFAULTS[key]);
  }
  gl.deleteBuffer(buffer);
});
test('WebGLStateTracker#not cached parameters', async () => {
  const device = await devicePromise;
  const {
    gl
  } = device;
  resetGLParameters(gl);
  expect(gl.getParameter(gl.TEXTURE_BINDING_2D), 'no bound texture').toBe(null);
  const tex = device.createTexture({
    width: 1,
    height: 1
  });
  tex._bind();
  expect(gl.getParameter(gl.TEXTURE_BINDING_2D), 'bound texture').toBe(tex.handle);
  gl.activeTexture(gl.TEXTURE1);
  expect(gl.getParameter(gl.TEXTURE_BINDING_2D), 'no binding for texture1').toBe(null);
  gl.activeTexture(gl.TEXTURE0);
  expect(gl.getParameter(gl.TEXTURE_BINDING_2D), 'bound texture at texture0').toBe(tex.handle);
  tex._unbind();
  expect(gl.getParameter(gl.TEXTURE_BINDING_2D), 'no binding for texture0').toBe(null);
  tex.destroy();
});
test('WebGLStateTracker#tracks metadata on gl.lumaState', async () => {
  const device = await devicePromise;
  const {
    gl
  } = device;
  const state = WebGLStateTracker.get(gl);
  expect(state, 'WebGLStateTracker.get returns a state tracker').toBeTruthy();
  expect((gl as {
    lumaState?: WebGLStateTracker;
  }).lumaState, 'tracker is stored on gl.lumaState').toBe(state);
  // @ts-expect-error
  expect((gl as {
    state?: unknown;
  }).state, 'legacy gl.state metadata slot is not used').toBe(undefined);
  expect(
  // @ts-expect-error
  typeof (gl.lumaState?.cache || null), 'lumaState has cache object').toBe('object');
});
