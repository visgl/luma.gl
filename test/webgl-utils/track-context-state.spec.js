import {createTestContext} from '../setup';
import trackContextState, {pushContextState, popContextState}
  from '../../src/webgl-utils/track-context-state';
import {getParameter, setParameters, resetParameters} from '../../src/webgl-utils/parameter-access';
import test from 'tape-catch';
import {GL_PARAMETER_DEFAULTS, GL_PARAMETER_SETTERS} from '../../src/webgl-utils/parameter-access';
import {GL_PARAMETER_SETTINGS_ONE, GL_PARAMETER_SETTINGS_TWO} from './custom-parameter-settings';

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
  setParameters(gl, GL_PARAMETER_SETTINGS_ONE);
  for (const key in GL_PARAMETER_SETTINGS_ONE) {
    const value = getParameter(gl, key);
    t.deepEqual(value, GL_PARAMETER_SETTINGS_ONE[key],
      `first set: got expected set value ${stringifyTypedArray(value)} for key: ${key}`);
  }

  pushContextState(gl);

  // Set custom values and verify
  setParameters(gl, GL_PARAMETER_SETTINGS_TWO);
  for (const key in GL_PARAMETER_SETTINGS_TWO) {
    const value = getParameter(gl, key);
    t.deepEqual(value, GL_PARAMETER_SETTINGS_TWO[key],
      `second set: got expected value ${stringifyTypedArray(value)} for key: ${key}`);
  }

  // Pop and verify values restore to previous state
  popContextState(gl);

  for (const key in GL_PARAMETER_SETTINGS_ONE) {
    const value = getParameter(gl, key);
    t.deepEqual(value, GL_PARAMETER_SETTINGS_ONE[key],
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
  for (const key in GL_PARAMETER_SETTINGS_ONE) {
    const value = GL_PARAMETER_SETTINGS_ONE[key];
    const glSetter = GL_PARAMETER_SETTERS[key];
    // Skipping composite setters
    if (typeof glSetter !== 'string') {
      glSetter(gl, value, key);
    }
  }

  for (const key in GL_PARAMETER_SETTINGS_ONE) {
    // Skipping composite setters
    if (typeof GL_PARAMETER_SETTERS[key] !== 'string') {
      const value = getParameter(gl, key);
      t.deepEqual(value, GL_PARAMETER_SETTINGS_ONE[key],
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
