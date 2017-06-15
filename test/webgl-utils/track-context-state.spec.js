import {createTestContext} from '../setup';
import trackContextState, {pushContextState, popContextState}
  from '../../src/webgl-utils/track-context-state';
import {getParameter, setParameters, resetParameters} from '../../src/webgl-utils/parameter-access';
import test from 'tape-catch';
import {GL_PARAMETER_DEFAULTS, GL_PARAMETER_SETTERS} from '../../src/webgl-utils/parameter-access';
import {ENUM_STYLE_SETTINGS_SET1, ENUM_STYLE_SETTINGS_SET2} from './sample-enum-settings';

// Settings test, don't reuse a context
const fixture = {
  gl: createTestContext({debug: true})
};

function stringifyTypedArray(v) {
  v = ArrayBuffer.isView(v) ? Array.apply([], v) : v;
  return JSON.stringify(v);
}

test('WebGL#trackContextState', t => {
  const {gl} = fixture;

  t.ok(typeof trackContextState === 'function', 'trackContextState defined');

  t.doesNotThrow(
    () => trackContextState(gl, {copyState: false}),
    'trackContextState call succeeded'
  );

  t.ok(GL_PARAMETER_DEFAULTS, 'TEST_EXPORTS ok');

  t.end();
});

test('WebGLState#push & pop', t => {
  const {gl} = fixture;

  resetParameters(gl);

  // Verify default values.
  for (const key in GL_PARAMETER_DEFAULTS) {
    const value = getParameter(gl, key);
    t.deepEqual(value, GL_PARAMETER_DEFAULTS[key],
      `default: got expected value ${stringifyTypedArray(value)} for key: ${key}`);
  }

  pushContextState(gl);

  // Set custom values and verify.
  setParameters(gl, ENUM_STYLE_SETTINGS_SET1);
  for (const key in ENUM_STYLE_SETTINGS_SET1) {
    const value = getParameter(gl, key);
    t.deepEqual(value, ENUM_STYLE_SETTINGS_SET1[key],
      `first set: got expected set value ${stringifyTypedArray(value)} for key: ${key}`);
  }

  pushContextState(gl);

  // Set custom values and verify
  setParameters(gl, ENUM_STYLE_SETTINGS_SET2);
  for (const key in ENUM_STYLE_SETTINGS_SET2) {
    const value = getParameter(gl, key);
    t.deepEqual(value, ENUM_STYLE_SETTINGS_SET2[key],
      `second set: got expected value ${stringifyTypedArray(value)} for key: ${key}`);
  }

  // Pop and verify values restore to previous state
  popContextState(gl);

  for (const key in ENUM_STYLE_SETTINGS_SET1) {
    const value = getParameter(gl, key);
    t.deepEqual(value, ENUM_STYLE_SETTINGS_SET1[key],
      `first pop: got expected value ${stringifyTypedArray(value)} for key: ${key}`);
  }

  popContextState(gl);

  for (const key in GL_PARAMETER_DEFAULTS) {
    const value = getParameter(gl, key);
    t.deepEqual(value, GL_PARAMETER_DEFAULTS[key],
      `second pop: got expected value ${stringifyTypedArray(value)} for key: ${key}`);
  }

  t.end();
});

test('WebGLState#gl API', t => {
  const {gl} = fixture;

  resetParameters(gl);

  // Verify default values.
  for (const key in GL_PARAMETER_DEFAULTS) {
    const value = getParameter(gl, key);
    t.deepEqual(value, GL_PARAMETER_DEFAULTS[key],
      `got expected value ${stringifyTypedArray(value)}`);
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
      t.deepEqual(value, ENUM_STYLE_SETTINGS_SET1[key],
        `got expected value ${stringifyTypedArray(value)}`);
    }
  }

  popContextState(gl);

  for (const key in GL_PARAMETER_DEFAULTS) {
    const value = getParameter(gl, key);
    t.deepEqual(value, GL_PARAMETER_DEFAULTS[key],
      `got expected value ${stringifyTypedArray(value)}`);
  }

  t.end();
});
