import {createGLContext, isWebGL2Context} from 'luma.gl';
import {getGLParameter, withGLState, TEST_EXPORTS} from '../../src/webgl/context-state';
import test from 'tape-catch';

const {GL_STATE} = TEST_EXPORTS;

function stringifyTypedArray(v) {
  v = ArrayBuffer.isView(v) ? Array.apply([], v) : v;
  return JSON.stringify(v);
}

const fixture = {
  gl: createGLContext()
};

test('WebGL#state', t => {
  t.ok(GL_STATE, 'TEST_EXPORTS ok');
  t.end();
});

test('WebGLState#settings', t => {
  const {gl} = fixture;
  for (const setting in GL_STATE) {
    if (!GL_STATE[setting].webgl2) {
      const value = getGLParameter(gl, setting);
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
        const value = getGLParameter(gl, setting);
        t.ok(value !== undefined,
          `${setting}: got a value ${stringifyTypedArray(value)}`);
      }
    }
  }
  t.end();
});

test('WebGLState#withGLState', t => {
  const {gl} = fixture;

  let value = getGLParameter(gl, 'clearColor');
  t.deepEqual(value, [0, 0, 0, 0],
    `got expected value ${stringifyTypedArray(value)}`);

  withGLState(gl, {
    clearColor: [0, 1, 0, 1]
  }, () => {
    value = getGLParameter(gl, 'clearColor');
    t.deepEqual(value, [0, 1, 0, 1],
      `got expected value ${stringifyTypedArray(value)}`);
  });

  value = getGLParameter(gl, 'clearColor');
  t.deepEqual(value, [0, 0, 0, 0],
    `got expected value ${stringifyTypedArray(value)}`);

  t.end();
});

