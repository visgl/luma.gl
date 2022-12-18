import test from 'tape-promise/tape';
import {gl, gl2} from '../../test-utils/test-devices';
import {stringifyTypedArray} from './context-state.spec';

import {setParameters, getParameters, resetParameters} from '@luma.gl/webgl';

import GL from '@luma.gl/constants';
import {Framebuffer} from '@luma.gl/webgl-legacy';
import {getKey} from '@luma.gl/webgl-legacy';
import {GL_PARAMETER_DEFAULTS} from '@luma.gl/webgl/context/parameters/webgl-parameter-tables';
import {ENUM_STYLE_SETTINGS_SET1_PRIMITIVE} from './data/sample-enum-settings';

// Settings test, don't reuse a context
test('WebGL#set and get', (t) => {
  resetParameters(gl);

  let cullFace = getParameters(gl, [GL.CULL_FACE])[GL.CULL_FACE];
  t.deepEqual(cullFace, false, `got expected value ${stringifyTypedArray(cullFace)}`);

  setParameters(gl, {[GL.CULL_FACE]: true});
  cullFace = getParameters(gl, [GL.CULL_FACE])[GL.CULL_FACE];
  t.deepEqual(cullFace, true, `got expected value ${stringifyTypedArray(cullFace)}`);

  let clearValue = getParameters(gl, [GL.DEPTH_CLEAR_VALUE])[GL.DEPTH_CLEAR_VALUE];
  t.is(clearValue, 1, `got expected value ${stringifyTypedArray(clearValue)}`);

  setParameters(gl, {[GL.DEPTH_CLEAR_VALUE]: -1});
  clearValue = getParameters(gl, [GL.DEPTH_CLEAR_VALUE])[GL.DEPTH_CLEAR_VALUE];
  t.is(clearValue, -1, `got expected value ${stringifyTypedArray(clearValue)}`);

  // @ts-expect-error
  t.throws(() => setParameters({}), 'throws with non WebGL context');

  t.end();
});

test('WebGL#composite setter', (t) => {
  const compositeStateKeys = [GL.STENCIL_FUNC, GL.STENCIL_REF, GL.STENCIL_VALUE_MASK];

  resetParameters(gl);

  // Verify default values.
  for (const key of compositeStateKeys) {
    // @ts-expect-error
    const value = getParameters(gl, [key])[key];
    t.deepEqual(
      value,
      GL_PARAMETER_DEFAULTS[key],
      `got expected default value ${stringifyTypedArray(value)}`
    );
  }

  // Update only two states out of three.
  setParameters(gl, {
    [GL.STENCIL_FUNC]: GL.NEVER,
    [GL.STENCIL_REF]: 0.5
  });

  let value = getParameters(gl, [GL.STENCIL_FUNC])[GL.STENCIL_FUNC];
  t.deepEqual(value, GL.NEVER, `got expected updated value ${stringifyTypedArray(value)}`);
  value = getParameters(gl, [GL.STENCIL_REF])[GL.STENCIL_REF];
  t.deepEqual(value, 0.5, `got expected updated value ${stringifyTypedArray(value)}`);
  value = getParameters(gl, [GL.STENCIL_VALUE_MASK])[GL.STENCIL_VALUE_MASK];
  t.deepEqual(
    value,
    GL_PARAMETER_DEFAULTS[GL.STENCIL_VALUE_MASK],
    `got expected updated defuault value ${stringifyTypedArray(value)}`
  );

  t.end();
});

test('WebGLState#get all parameters', (t) => {

  resetParameters(gl);

  // Set custom values.
  setParameters(gl, ENUM_STYLE_SETTINGS_SET1_PRIMITIVE);
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    // @ts-expect-error
    const value = getParameters(gl, [key])[key];
    t.deepEqual(
      value,
      ENUM_STYLE_SETTINGS_SET1_PRIMITIVE[key],
      `got expected value ${stringifyTypedArray(value)} after setParameters for ${getKey(gl, key)}`
    );
  }

  const copy = getParameters(gl);
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    const value = copy[key];
    t.deepEqual(
      value,
      ENUM_STYLE_SETTINGS_SET1_PRIMITIVE[key],
      `got expected value ${stringifyTypedArray(value)} after getParameters for ${getKey(gl, key)}`
    );
  }

  t.end();
});

test('WebGL#reset', (t) => {

  // Set custom values and verify.
  setParameters(gl, ENUM_STYLE_SETTINGS_SET1_PRIMITIVE);
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    // @ts-expect-error
    const value = getParameters(gl, [key])[key];
    t.deepEqual(
      value,
      ENUM_STYLE_SETTINGS_SET1_PRIMITIVE[key],
      `got expected value ${stringifyTypedArray(value)} after setParameters for ${getKey(gl, key)}`
    );
  }

  // reset
  resetParameters(gl);

  // Verify default values.
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    // @ts-expect-error
    const value = getParameters(gl, [key])[key];
    t.deepEqual(
      value,
      GL_PARAMETER_DEFAULTS[key],
      `got expected value ${stringifyTypedArray(value)} after resetParameters for ${getKey(
        gl,
        key
      )}`
    );
  }

  t.end();
});

test('WebGLState#setParameters framebuffer', (t) => {

  resetParameters(gl);

  let fbHandle = getParameters(gl, [gl.FRAMEBUFFER_BINDING])[gl.FRAMEBUFFER_BINDING];
  // t.equal(fbHandle, null, 'Initial frambuffer binding should be null');
  const framebuffer = new Framebuffer(gl);

  setParameters(gl, {
    [GL.FRAMEBUFFER_BINDING]: framebuffer.handle
  });
  fbHandle = getParameters(gl, [gl.FRAMEBUFFER_BINDING])[gl.FRAMEBUFFER_BINDING];
  t.equal(fbHandle, framebuffer.handle, 'setParameters should set framebuffer binding');

  // verify setting null value
  setParameters(gl, {
    [GL.FRAMEBUFFER_BINDING]: null
  });
  fbHandle = getParameters(gl, [gl.FRAMEBUFFER_BINDING])[gl.FRAMEBUFFER_BINDING];
  t.equal(fbHandle, null, 'setParameters should set framebuffer binding');

  t.end();
});

test('WebGLState#setParameters read-framebuffer (WebGL2 only)', (t) => {
  // const gl2 = createTestContext({webgl2: true, webgl1: false});
  if (gl2) {
    resetParameters(gl2);


    let fbHandle = getParameters(gl2, [gl2.READ_FRAMEBUFFER_BINDING])[gl2.READ_FRAMEBUFFER_BINDING];
    // t.equal(fbHandle, null, 'Initial read-frambuffer binding should be null');
    const framebuffer = new Framebuffer(gl2);

    setParameters(gl2, {
      [GL.READ_FRAMEBUFFER_BINDING]: framebuffer.handle
    });

    fbHandle = getParameters(gl2, [gl2.READ_FRAMEBUFFER_BINDING])[gl2.READ_FRAMEBUFFER_BINDING];
    t.equal(fbHandle, framebuffer.handle, 'setParameters should set read-framebuffer binding');

    // verify setting null value
    setParameters(gl2, {
      [GL.READ_FRAMEBUFFER_BINDING]: null
    });

    fbHandle = getParameters(gl2, [gl2.READ_FRAMEBUFFER_BINDING])[gl2.READ_FRAMEBUFFER_BINDING];
    t.equal(fbHandle, null, 'setParameters should set read-framebuffer binding');
  } else {
    t.comment('WebGL2 not available, skipping tests');
  }
  t.end();
});
