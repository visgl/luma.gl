// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {createTestDevice} from '@luma.gl/test-utils';

import type {WebGLDevice} from '@luma.gl/webgl';

import {getGLParameters, setGLParameters, resetGLParameters, WEBGLTexture,WebGLStateTracker} from '@luma.gl/webgl';

import {
  GL_PARAMETER_DEFAULTS,
  GL_PARAMETER_SETTERS
} from '@luma.gl/webgl/context/parameters/webgl-parameter-tables';

import {stringifyTypedArray} from './context-state.spec';

import {ENUM_STYLE_SETTINGS_SET1, ENUM_STYLE_SETTINGS_SET2} from './data/sample-enum-settings';

// Settings test, don't reuse a context
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
const device = createTestDevice({debug: true}) as WebGLDevice;

test('WebGLStateTracker#imports', t => {
  t.ok(typeof WebGLStateTracker === 'function', 'WebGLStateTracker imported OK');
  t.end();
});

// test.skip('WebGLStateTracker#trackContextState', t => {
//   const {gl} = device;
//   t.doesNotThrow(
//     () => trackContextState(gl, {copyState: false}),
//     'trackContextState call succeeded'
//   );
//   t.end();
// });

test('WebGLStateTracker#push & pop', t => {
  const {gl} = device;

  resetGLParameters(gl);
  let parameters = getGLParameters(gl);

  // Verify default values.
  for (const key in GL_PARAMETER_DEFAULTS) {
    const value = parameters[key];
    t.deepEqual(
      value,
      GL_PARAMETER_DEFAULTS[key],
      `default: got expected value ${stringifyTypedArray(value)} for key: ${key}`
    );
  }

  device.pushState();

  // Set custom values and verify.
  setGLParameters(gl, ENUM_STYLE_SETTINGS_SET1);
  parameters = getGLParameters(gl);
  for (const key in ENUM_STYLE_SETTINGS_SET1) {
    const value = parameters[key];
    t.deepEqual(
      value,
      ENUM_STYLE_SETTINGS_SET1[key],
      `first set: got expected set value ${stringifyTypedArray(value)} for key: ${key}`
    );
  }

  device.pushState();

  // Set custom values and verify
  setGLParameters(gl, ENUM_STYLE_SETTINGS_SET2);
  parameters = getGLParameters(gl);
  for (const [key, value] of Object.entries(ENUM_STYLE_SETTINGS_SET2)) {
    t.deepEqual(
      value,
      ENUM_STYLE_SETTINGS_SET2[key],
      `second set: got expected value ${stringifyTypedArray(value)} for key: ${key}`
    );
  }

  // Pop and verify values restore to previous state
  device.popState();
  parameters = getGLParameters(gl);

  for (const key in ENUM_STYLE_SETTINGS_SET1) {
    const value = parameters[key];
    t.deepEqual(
      value,
      ENUM_STYLE_SETTINGS_SET1[key],
      `first pop: got expected value ${stringifyTypedArray(value)} for key: ${key}`
    );
  }

  device.popState();
  parameters = getGLParameters(gl);

  for (const key in GL_PARAMETER_DEFAULTS) {
    const value = parameters[key];
    t.deepEqual(
      value,
      GL_PARAMETER_DEFAULTS[key],
      `second pop: got expected value ${stringifyTypedArray(value)} for key: ${key}`
    );
  }

  t.end();
});

test('WebGLStateTracker#gl API', t => {
  const {gl} = device;

  resetGLParameters(gl);
  let parameters = getGLParameters(gl);

  // Verify default values.
  for (const key in GL_PARAMETER_DEFAULTS) {
    const value = parameters[key];
    t.deepEqual(
      value,
      GL_PARAMETER_DEFAULTS[key],
      `got expected value ${stringifyTypedArray(value)}`
    );
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
      t.deepEqual(
        value,
        ENUM_STYLE_SETTINGS_SET1[key],
        `got expected value ${stringifyTypedArray(value)}`
      );
    }
  }

  device.popState();
  parameters = getGLParameters(gl);
  for (const key in GL_PARAMETER_DEFAULTS) {
    const value = parameters[key];
    t.deepEqual(
      value,
      GL_PARAMETER_DEFAULTS[key],
      `got expected value ${stringifyTypedArray(value)}`
    );
  }

  t.end();
});

test('WebGLStateTracker#intercept gl calls', t => {
  const {gl} = device;

  resetGLParameters(gl);

  device.pushState();

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  t.is(gl.getParameter(gl.ARRAY_BUFFER_BINDING), buffer, 'buffer is bound');

  gl.blendEquation(gl.FUNC_SUBTRACT);
  t.is(getGLParameters(gl, gl.BLEND_EQUATION_RGB), gl.FUNC_SUBTRACT, 'direct gl call is tracked');

  gl.blendFunc(gl.ONE, gl.ONE);
  t.is(getGLParameters(gl, gl.BLEND_SRC_RGB), gl.ONE, 'direct gl call is tracked');

  gl.stencilMask(8);
  t.is(getGLParameters(gl, gl.STENCIL_WRITEMASK), 8, 'direct gl call is tracked');

  gl.stencilFunc(gl.NEVER, 0, 1);
  t.is(getGLParameters(gl, gl.STENCIL_FUNC), gl.NEVER, 'direct gl call is tracked');

  gl.stencilOp(gl.KEEP, gl.ZERO, gl.REPLACE);
  t.is(getGLParameters(gl, gl.STENCIL_PASS_DEPTH_FAIL), gl.ZERO, 'direct gl call is tracked');

  device.popState();
  const parameters = getGLParameters(gl);

  // Verify default values.
  for (const key in GL_PARAMETER_DEFAULTS) {
    const value = parameters[key];
    t.deepEqual(
      value,
      GL_PARAMETER_DEFAULTS[key],
      `got expected value ${stringifyTypedArray(value)}`
    );
  }

  gl.deleteBuffer(buffer);
  t.end();
});

test('WebGLStateTracker#not cached parameters', t => {
  const {gl} = device;

  resetGLParameters(gl);

  t.is(gl.getParameter(gl.TEXTURE_BINDING_2D), null, 'no bound texture');

  const tex = device.createTexture({}) as WEBGLTexture;
  tex.bind();
  t.is(gl.getParameter(gl.TEXTURE_BINDING_2D), tex.handle, 'bound texture');

  gl.activeTexture(gl.TEXTURE1);
  t.is(gl.getParameter(gl.TEXTURE_BINDING_2D), null, 'no binding for texture1');

  gl.activeTexture(gl.TEXTURE0);
  t.is(gl.getParameter(gl.TEXTURE_BINDING_2D), tex.handle, 'bound texture at texture0');

  tex.unbind();
  t.is(gl.getParameter(gl.TEXTURE_BINDING_2D), null, 'no binding for texture0');

  tex.destroy();
  t.end();
});
