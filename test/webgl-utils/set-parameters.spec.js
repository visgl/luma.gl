import test from 'tape-catch';
import {createTestContext} from '../setup';

import {ENUM_STYLE_SETTINGS_SET1_PRIMITIVE} from './data/sample-enum-settings';
import {GL_PARAMETER_DEFAULTS} from '../../src/webgl-utils/set-parameters';

import GL from '../../src/webgl-utils/constants';
import {getKey} from '../../src/webgl-utils/constants-to-keys';

import {setParameters, getParameter, getParameters, resetParameters}
  from '../../src/webgl-utils/set-parameters';

// Settings test, don't reuse a context
const fixture = {
  gl: createTestContext({debug: true, manageState: false})
};

function stringifyTypedArray(v) {
  v = ArrayBuffer.isView(v) ? Array.apply([], v) : v;
  return JSON.stringify(v);
}

test('WebGL#set and get', t => {
  const {gl} = fixture;
  const values = {
    [GL.CULL_FACE]: true
  };
  resetParameters(gl);

  let value = getParameter(gl, GL.CULL_FACE);
  t.deepEqual(value, false,
    `got expected value ${stringifyTypedArray(value)}`);
  setParameters(gl, values, {});
  value = getParameter(gl, GL.CULL_FACE);
  t.deepEqual(value, true,
    `got expected value ${stringifyTypedArray(value)}`);

  t.end();
});

/*
test('WebGL#composite setter', t => {
  const {gl} = fixture;
  const compositeStateKeys = [
    GL.STENCIL_FUNC,
    GL.STENCIL_REF,
    GL.STENCIL_VALUE_MASK
  ];
  const partialCompositeStateValues = {
    [GL.STENCIL_FUNC]: GL.NEVER,
    [GL.STENCIL_REF]: 0.5
  };

  resetParameters(gl);

  // Verify default values.
  for (const key of compositeStateKeys) {
    const value = getParameter(gl, key);
    t.deepEqual(value, GL_PARAMETER_DEFAULTS[key],
      `got expected default value ${stringifyTypedArray(value)}`);
  }

  // Update only two states out of three.
  setParameters(gl, partialCompositeStateValues, GL_PARAMETER_DEFAULTS);

  let value = getParameter(gl, GL.STENCIL_FUNC);
  t.deepEqual(value, partialCompositeStateValues[GL.STENCIL_FUNC],
    `got expected updated value ${stringifyTypedArray(value)}`);
  value = getParameter(gl, GL.STENCIL_REF);
  t.deepEqual(value, partialCompositeStateValues[GL.STENCIL_REF],
    `got expected updated value ${stringifyTypedArray(value)}`);
  value = getParameter(gl, GL.STENCIL_VALUE_MASK);
  t.deepEqual(value, GL_PARAMETER_DEFAULTS[GL.STENCIL_VALUE_MASK],
    `got expected updated defuault value ${stringifyTypedArray(value)}`);

  t.end();
});
*/

test('WebGLState#get all parameters', t => {
  const {gl} = fixture;

  resetParameters(gl);

  // Set custom values.
  setParameters(gl, ENUM_STYLE_SETTINGS_SET1_PRIMITIVE, {});
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    const value = getParameter(gl, key);
    t.deepEqual(value, ENUM_STYLE_SETTINGS_SET1_PRIMITIVE[key],
      `got expected value ${stringifyTypedArray(value)} after setParameters for ${getKey(GL, key)}`);
  }

  const copy = getParameters(gl);
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    const value = copy[key];
    t.deepEqual(value, ENUM_STYLE_SETTINGS_SET1_PRIMITIVE[key],
      `got expected value ${stringifyTypedArray(value)} after getParameters for ${getKey(GL, key)}`);
  }

  t.end();
});

test('WebGL#reset', t => {
  const {gl} = fixture;

  // Set custom values and verify.
  setParameters(gl, ENUM_STYLE_SETTINGS_SET1_PRIMITIVE);
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    const value = getParameter(gl, key);
    t.deepEqual(value, ENUM_STYLE_SETTINGS_SET1_PRIMITIVE[key],
      `got expected value ${stringifyTypedArray(value)} after setParameters for ${getKey(GL, key)}`);
  }

  // reset
  resetParameters(gl);

  // Verify default values.
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    const value = getParameter(gl, key);
    t.deepEqual(value, GL_PARAMETER_DEFAULTS[key],
      `got expected value ${stringifyTypedArray(value)} after resetParameters for ${getKey(GL, key)}`);
  }

  t.end();
});
