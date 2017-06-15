import {GL} from 'luma.gl';
import {getParameter, getParameters, setParameters, withParameters, resetParameters} from 'luma.gl';
import {GL_PARAMETER_DEFAULTS as GL_PARAMETERS} from '../../src/webgl-utils/parameter-access';
import {
  GL_PARAMETER_SETTINGS_TWO,
  GL_PARAMETER_SETTINGS_TWO_ENUM_FUNCTION
} from './../webgl-utils/custom-parameter-settings';

import test from 'tape-catch';

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
    for (const setting in GL_PARAMETERS) {
      const value = getParameter(gl2, setting);
      t.ok(value !== undefined,
        `${setting}: got a value ${stringifyTypedArray(value)}`);
    }
  }
  t.end();
});

test('WebGLState#setParameters', t => {
  const {gl} = fixture;

  setParameters(gl, GL_PARAMETER_SETTINGS_TWO_ENUM_FUNCTION);

  for (const key in GL_PARAMETER_SETTINGS_TWO) {
    const value = getParameter(gl, key);
    t.deepEqual(value, GL_PARAMETER_SETTINGS_TWO[key],
      `got expected value ${stringifyTypedArray(value)} for key: ${key}`);
  }
  t.end();
});

test('WebGLState#withParameters', t => {
  const {gl} = fixture;

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
