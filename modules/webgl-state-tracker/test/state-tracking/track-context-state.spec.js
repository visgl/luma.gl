import test from 'tape-catch';
import {createTestContext} from 'test/setup';

import trackContextState, {
  pushContextState,
  popContextState,
  getParameter,
  setParameters,
  resetParameters
} from '@luma.gl/webgl-state-tracker';

import {
  GL_PARAMETER_DEFAULTS,
  GL_PARAMETER_SETTERS
} from '@luma.gl/webgl-state-tracker/unified-parameter-api/webgl-parameter-tables';

import {ENUM_STYLE_SETTINGS_SET1, ENUM_STYLE_SETTINGS_SET2} from '../data/sample-enum-settings';

// utils
function stringifyTypedArray(v) {
  v = ArrayBuffer.isView(v) ? Array.apply([], v) : v;
  return JSON.stringify(v);
}

// Settings test, don't reuse a context
const fixture = {
  gl: createTestContext({debug: true})
};

test('WebGLState#imports', t => {
  t.ok(typeof trackContextState === 'function', 'trackContextState imported OK');
  t.ok(typeof pushContextState === 'function', 'trackContextState imported OK');
  t.ok(typeof popContextState === 'function', 'trackContextState imported OK');
  t.end();
});

test('WebGLState#trackContextState', t => {
  const {gl} = fixture;
  t.doesNotThrow(
    () => trackContextState(gl, {copyState: false}),
    'trackContextState call succeeded'
  );
  t.end();
});

test('WebGLState#push & pop', t => {
  const {gl} = fixture;

  resetParameters(gl);

  // Verify default values.
  for (const key in GL_PARAMETER_DEFAULTS) {
    const value = getParameter(gl, key);
    t.deepEqual(
      value,
      GL_PARAMETER_DEFAULTS[key],
      `default: got expected value ${stringifyTypedArray(value)} for key: ${key}`
    );
  }

  pushContextState(gl);

  // Set custom values and verify.
  setParameters(gl, ENUM_STYLE_SETTINGS_SET1);
  for (const key in ENUM_STYLE_SETTINGS_SET1) {
    const value = getParameter(gl, key);
    t.deepEqual(
      value,
      ENUM_STYLE_SETTINGS_SET1[key],
      `first set: got expected set value ${stringifyTypedArray(value)} for key: ${key}`
    );
  }

  pushContextState(gl);

  // Set custom values and verify
  setParameters(gl, ENUM_STYLE_SETTINGS_SET2);
  for (const key in ENUM_STYLE_SETTINGS_SET2) {
    const value = getParameter(gl, key);
    t.deepEqual(
      value,
      ENUM_STYLE_SETTINGS_SET2[key],
      `second set: got expected value ${stringifyTypedArray(value)} for key: ${key}`
    );
  }

  // Pop and verify values restore to previous state
  popContextState(gl);

  for (const key in ENUM_STYLE_SETTINGS_SET1) {
    const value = getParameter(gl, key);
    t.deepEqual(
      value,
      ENUM_STYLE_SETTINGS_SET1[key],
      `first pop: got expected value ${stringifyTypedArray(value)} for key: ${key}`
    );
  }

  popContextState(gl);

  for (const key in GL_PARAMETER_DEFAULTS) {
    const value = getParameter(gl, key);
    t.deepEqual(
      value,
      GL_PARAMETER_DEFAULTS[key],
      `second pop: got expected value ${stringifyTypedArray(value)} for key: ${key}`
    );
  }

  t.end();
});

test('WebGLState#gl API', t => {
  const {gl} = fixture;

  resetParameters(gl);

  // Verify default values.
  for (const key in GL_PARAMETER_DEFAULTS) {
    const value = getParameter(gl, key);
    t.deepEqual(
      value,
      GL_PARAMETER_DEFAULTS[key],
      `got expected value ${stringifyTypedArray(value)}`
    );
  }

  pushContextState(gl);

  // TODO: test gl calls for compsite setters too (may be just call all gl calls).
  for (const key in ENUM_STYLE_SETTINGS_SET1) {
    const value = ENUM_STYLE_SETTINGS_SET1[key];
    const glSetter = GL_PARAMETER_SETTERS[key];
    // Skipping composite setters
    if (typeof glSetter !== 'string') {
      glSetter(gl, value, key);
    }
  }

  for (const key in ENUM_STYLE_SETTINGS_SET1) {
    // Skipping composite setters
    if (typeof GL_PARAMETER_SETTERS[key] !== 'string') {
      const value = getParameter(gl, key);
      t.deepEqual(
        value,
        ENUM_STYLE_SETTINGS_SET1[key],
        `got expected value ${stringifyTypedArray(value)}`
      );
    }
  }

  popContextState(gl);

  for (const key in GL_PARAMETER_DEFAULTS) {
    const value = getParameter(gl, key);
    t.deepEqual(
      value,
      GL_PARAMETER_DEFAULTS[key],
      `got expected value ${stringifyTypedArray(value)}`
    );
  }

  t.end();
});
