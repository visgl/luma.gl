import {isWebGL2Context} from 'luma.gl';
import {getParameter, setParameter, withState, resetContext, TEST_EXPORTS}
  from '../../src/webgl/context-state';

import test from 'tape-catch';

const {GL_STATE} = TEST_EXPORTS;

function stringifyTypedArray(v) {
  v = ArrayBuffer.isView(v) ? Array.apply([], v) : v;
  return JSON.stringify(v);
}

import {fixture} from '../setup';

test('WebGL#state', t => {
  t.ok(GL_STATE, 'TEST_EXPORTS ok');
  t.end();
});

test('WebGLState#settings', t => {
  const {gl} = fixture;
  for (const setting in GL_STATE) {
    if (!GL_STATE[setting].webgl2) {
      const value = getParameter(gl, setting);
      t.ok(value !== undefined,
        `${setting}: got a value ${stringifyTypedArray(value)}`);
    }
  }
  t.end();
});

test('WebGLState#settings(WebGL2)', t => {
  const {gl} = fixture;
  if (isWebGL2Context(gl)) {
    for (const setting in GL_STATE) {
      if (GL_STATE[setting].webgl2) {
        const value = getParameter(gl, setting);
        t.ok(value !== undefined,
          `${setting}: got a value ${stringifyTypedArray(value)}`);
      }
    }
  }
  t.end();
});

test('WebGLState#withState', t => {
  const {gl} = fixture;

  let value = getParameter(gl, 'clearColor');
  t.deepEqual(value, [0, 0, 0, 0],
    `got expected value ${stringifyTypedArray(value)}`);

  withState(gl, {
    clearColor: [0, 1, 0, 1]
  }, () => {
    value = getParameter(gl, 'clearColor');
    t.deepEqual(value, [0, 1, 0, 1],
      `got expected value ${stringifyTypedArray(value)}`);
  });

  value = getParameter(gl, 'clearColor');
  t.deepEqual(value, [0, 0, 0, 0],
    `got expected value ${stringifyTypedArray(value)}`);

  t.end();
});

test('WebGLState#resetContext', t => {
  const {gl} = fixture;

  setParameter(gl, 'clearColor', [0, 1, 0, 1]);

  let value = getParameter(gl, 'clearColor');
  t.deepEqual(value, [0, 1, 0, 1],
    `got expected value ${stringifyTypedArray(value)}`);

  resetContext(gl);

  value = getParameter(gl, 'clearColor');
  t.deepEqual(value, [0, 0, 0, 0],
    `got expected value ${stringifyTypedArray(value)}`);

  t.end();
});
