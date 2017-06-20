import test from 'tape-catch';

import {GL} from 'luma.gl';
import {getParameter, getParameters, setParameters, withParameters, resetParameters} from 'luma.gl';
import {getKey} from '../../src/webgl-utils/constants-to-keys';

import {GL_PARAMETER_DEFAULTS as GL_PARAMETERS} from '../../src/webgl-utils/set-parameters';
import {ENUM_STYLE_SETTINGS_SET1} from './../webgl-utils/sample-enum-settings';
import {FUNCTION_STYLE_SETTINGS_SET1} from './sample-function-settings';

function stringifyTypedArray(v) {
  v = ArrayBuffer.isView(v) ? Array.apply([], v) : v;
  return JSON.stringify(v);
}

import {createTestContext} from '../setup';
const fixture = {
  gl: createTestContext(),
  gl2: createTestContext({webgl2: true, webgl1: false})
};

test('WebGL#state', t => {
  t.ok(getParameter, 'getParameter imported ok');
  t.ok(getParameters, 'getParameters imported ok');
  t.ok(setParameters, 'setParameters imported ok');
  t.ok(withParameters, 'withParameters imported ok');
  t.ok(resetParameters, 'resetParameters imported ok');
  t.ok(GL_PARAMETERS, 'TEST_EXPORTS ok');
  t.end();
});

test('WebGLState#getParameter', t => {
  const {gl} = fixture;

  resetParameters(gl);

  for (const setting in GL_PARAMETERS) {
    const value = getParameter(gl, setting);
    t.ok(value !== undefined,
      `${setting}: got a value ${stringifyTypedArray(value)}`);
  }
  t.end();
});

test('WebGLState#getParameter (WebGL2)', t => {
  const {gl2} = fixture;
  if (gl2) {

    resetParameters(gl2);

    for (const setting in GL_PARAMETERS) {
      const value = getParameter(gl2, setting);
      t.ok(value !== undefined,
        `${getKey(GL, setting)}: got a value ${stringifyTypedArray(value)}`);
    }
  }
  t.end();
});

test('WebGLState#setParameters (Mixing enum and function style keys)', t => {
  const {gl} = fixture;

  resetParameters(gl);

  setParameters(gl, FUNCTION_STYLE_SETTINGS_SET1);

  for (const key in ENUM_STYLE_SETTINGS_SET1) {
    const value = getParameter(gl, key);
    t.deepEqual(value, ENUM_STYLE_SETTINGS_SET1[key],
      `got expected value ${stringifyTypedArray(value)} for key: ${getKey(GL, key)}`);
  }
  t.end();
});

test('WebGLState#setParameters (Argument expansion for ***SeperateFunc setters))', t => {
  const {gl} = fixture;
  const parameters = {
    blendFunc: [GL.SRC_ALPHA, GL.ONE],
    stencilFunc: [GL.LEQUAL, 0.5, 0xBBBBBBBB],
    stencilOp: [GL.REPLACE, GL.INCR, GL.DECR]
  };
  const expectedValues = {
    // blendFunc
    [GL.BLEND_SRC_RGB]: GL.SRC_ALPHA,
    [GL.BLEND_DST_RGB]: GL.ONE,
    [GL.BLEND_SRC_ALPHA]: GL.SRC_ALPHA,
    [GL.BLEND_DST_ALPHA]: GL.ONE,
    // stencilFunc
    [GL.STENCIL_FUNC]: GL.LEQUAL,
    [GL.STENCIL_REF]: 0.5,
    [GL.STENCIL_VALUE_MASK]: 0xBBBBBBBB,
    [GL.STENCIL_BACK_FUNC]: GL.LEQUAL,
    [GL.STENCIL_BACK_REF]: 0.5,
    [GL.STENCIL_BACK_VALUE_MASK]: 0xBBBBBBBB,
    // stencilOp
    [GL.STENCIL_FAIL]: GL.REPLACE,
    [GL.STENCIL_PASS_DEPTH_FAIL]: GL.INCR,
    [GL.STENCIL_PASS_DEPTH_PASS]: GL.DECR,
    [GL.STENCIL_BACK_FAIL]: GL.REPLACE,
    [GL.STENCIL_BACK_PASS_DEPTH_FAIL]: GL.INCR,
    [GL.STENCIL_BACK_PASS_DEPTH_PASS]: GL.DECR
  };

  resetParameters(gl);

  setParameters(gl, parameters);

  for (const key in expectedValues) {
    const value = getParameter(gl, key);
    t.deepEqual(value, expectedValues[key],
      `got expected value ${stringifyTypedArray(value)} for key: ${getKey(GL, key)}`);
  }
  t.end();
});

test('WebGLState#withParameters', t => {
  const {gl} = fixture;

  resetParameters(gl);

  setParameters(gl, {
    clearColor: [0, 0, 0, 0],
    [GL.BLEND]: false
  });

  let clearColor = getParameter(gl, GL.COLOR_CLEAR_VALUE);
  let blendState = getParameter(gl, GL.BLEND);
  t.deepEqual(clearColor, [0, 0, 0, 0],
    `got expected value ${stringifyTypedArray(clearColor)}`);
  t.deepEqual(blendState, false,
    `got expected value ${stringifyTypedArray(blendState)}`);

  withParameters(gl, {
    clearColor: [0, 1, 0, 1],
    [GL.BLEND]: true
  }, () => {
    clearColor = getParameter(gl, GL.COLOR_CLEAR_VALUE);
    blendState = getParameter(gl, GL.BLEND);
    t.deepEqual(clearColor, [0, 1, 0, 1],
      `got expected value ${stringifyTypedArray(clearColor)}`);
    t.deepEqual(blendState, true,
      `got expected value ${stringifyTypedArray(blendState)}`);
  });

  clearColor = getParameter(gl, GL.COLOR_CLEAR_VALUE);
  blendState = getParameter(gl, GL.BLEND);
  t.deepEqual(clearColor, [0, 0, 0, 0],
    `got expected value ${stringifyTypedArray(clearColor)}`);
  t.deepEqual(blendState, false,
    `got expected value ${stringifyTypedArray(blendState)}`);

  t.end();
});
