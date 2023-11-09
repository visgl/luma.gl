// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {webgl1Device, webgl2Device} from '@luma.gl/test-utils';
import {stringifyTypedArray} from './context-state.spec';

import {setGLParameters, getGLParameters, resetGLParameters} from '@luma.gl/webgl';

import {GL} from '@luma.gl/constants';
import {GL_PARAMETER_DEFAULTS} from '@luma.gl/webgl/context/parameters/webgl-parameter-tables';
import {ENUM_STYLE_SETTINGS_SET1_PRIMITIVE} from './data/sample-enum-settings';

// Settings test, don't reuse a context
test('WebGL#set and get', (t) => {
  resetGLParameters(webgl1Device);

  let cullFace = getGLParameters(webgl1Device, [GL.CULL_FACE])[GL.CULL_FACE];
  t.deepEqual(cullFace, false, `got expected value ${stringifyTypedArray(cullFace)}`);

  setGLParameters(webgl1Device, {[GL.CULL_FACE]: true});
  cullFace = getGLParameters(webgl1Device, [GL.CULL_FACE])[GL.CULL_FACE];
  t.deepEqual(cullFace, true, `got expected value ${stringifyTypedArray(cullFace)}`);

  let clearValue = getGLParameters(webgl1Device, [GL.DEPTH_CLEAR_VALUE])[GL.DEPTH_CLEAR_VALUE];
  t.is(clearValue, 1, `got expected value ${stringifyTypedArray(clearValue)}`);

  setGLParameters(webgl1Device, {[GL.DEPTH_CLEAR_VALUE]: -1});
  clearValue = getGLParameters(webgl1Device, [GL.DEPTH_CLEAR_VALUE])[GL.DEPTH_CLEAR_VALUE];
  t.is(clearValue, -1, `got expected value ${stringifyTypedArray(clearValue)}`);

  // @ts-expect-error
  t.throws(() => setGLParameters({}), 'throws with non WebGL context');

  t.end();
});

test('WebGL#composite setter', (t) => {
  const compositeStateKeys = [GL.STENCIL_FUNC, GL.STENCIL_REF, GL.STENCIL_VALUE_MASK];

  resetGLParameters(webgl1Device);

  // Verify default values.
  for (const key of compositeStateKeys) {
    // @ts-expect-error
    const value = getGLParameters(webgl1Device, [key])[key];
    t.deepEqual(
      value,
      GL_PARAMETER_DEFAULTS[key],
      `got expected default value ${stringifyTypedArray(value)}`
    );
  }

  // Update only two states out of three.
  setGLParameters(webgl1Device, {
    [GL.STENCIL_FUNC]: GL.NEVER,
    [GL.STENCIL_REF]: 0.5
  });

  let value = getGLParameters(webgl1Device, [GL.STENCIL_FUNC])[GL.STENCIL_FUNC];
  t.deepEqual(value, GL.NEVER, `got expected updated value ${stringifyTypedArray(value)}`);
  value = getGLParameters(webgl1Device, [GL.STENCIL_REF])[GL.STENCIL_REF];
  t.deepEqual(value, 0.5, `got expected updated value ${stringifyTypedArray(value)}`);
  value = getGLParameters(webgl1Device, [GL.STENCIL_VALUE_MASK])[GL.STENCIL_VALUE_MASK];
  t.deepEqual(
    value,
    GL_PARAMETER_DEFAULTS[GL.STENCIL_VALUE_MASK],
    `got expected updated defuault value ${stringifyTypedArray(value)}`
  );

  t.end();
});

test('WebGLState#get all parameters', (t) => {

  resetGLParameters(webgl1Device);

  // Set custom values.
  setGLParameters(webgl1Device, ENUM_STYLE_SETTINGS_SET1_PRIMITIVE);
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    // @ts-expect-error
    const value = getGLParameters(webgl1Device, [key])[key];
    t.deepEqual(
      value,
      ENUM_STYLE_SETTINGS_SET1_PRIMITIVE[key],
      `got expected value ${stringifyTypedArray(value)} after setGLParameters for ${webgl1Device.getGLKey(key)}`
    );
  }

  const copy = getGLParameters(webgl1Device);
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    const value = copy[key];
    t.deepEqual(
      value,
      ENUM_STYLE_SETTINGS_SET1_PRIMITIVE[key],
      `got expected value ${stringifyTypedArray(value)} after getGLParameters for ${webgl1Device.getGLKey(key)}`
    );
  }

  t.end();
});

test('WebGL#reset', (t) => {

  // Set custom values and verify.
  setGLParameters(webgl1Device, ENUM_STYLE_SETTINGS_SET1_PRIMITIVE);
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    // @ts-expect-error
    const value = getGLParameters(webgl1Device, [key])[key];
    t.deepEqual(
      value,
      ENUM_STYLE_SETTINGS_SET1_PRIMITIVE[key],
      `got expected value ${stringifyTypedArray(value)} after setGLParameters for ${webgl1Device.getGLKey(key)}`
    );
  }

  // reset
  resetGLParameters(webgl1Device);

  // Verify default values.
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    // @ts-expect-error
    const value = getGLParameters(webgl1Device, [key])[key];
    t.deepEqual(
      value,
      GL_PARAMETER_DEFAULTS[key],
      `got expected value ${stringifyTypedArray(value)} after resetGLParameters for ${webgl1Device.getGLKey(
        key
      )}`
    );
  }

  t.end();
});

test('WebGLState#setGLParameters framebuffer', (t) => {

  resetGLParameters(webgl1Device);

  let fbHandle = getGLParameters(webgl1Device, [GL.FRAMEBUFFER_BINDING])[GL.FRAMEBUFFER_BINDING];
  // t.equal(fbHandle, null, 'Initial frambuffer binding should be null');
  const framebuffer = webgl1Device.createFramebuffer({colorAttachments: ['rgba8unorm']});

  setGLParameters(webgl1Device, {
    [GL.FRAMEBUFFER_BINDING]: framebuffer.handle
  });
  fbHandle = getGLParameters(webgl1Device, [GL.FRAMEBUFFER_BINDING])[GL.FRAMEBUFFER_BINDING];
  t.equal(fbHandle, framebuffer.handle, 'setGLParameters should set framebuffer binding');

  // verify setting null value
  setGLParameters(webgl1Device, {
    [GL.FRAMEBUFFER_BINDING]: null
  });
  fbHandle = getGLParameters(webgl1Device, [GL.FRAMEBUFFER_BINDING])[GL.FRAMEBUFFER_BINDING];
  t.equal(fbHandle, null, 'setGLParameters should set framebuffer binding');

  t.end();
});

test('WebGLState#setGLParameters read-framebuffer (WebGL2 only)', (t) => {
  // const webgl2Device = createTestContext({webgl2: true, webgl1: false});
  if (webgl2Device) {
    resetGLParameters(webgl2Device);


    let fbHandle = getGLParameters(webgl2Device, [GL.READ_FRAMEBUFFER_BINDING])[GL.READ_FRAMEBUFFER_BINDING];
    // t.equal(fbHandle, null, 'Initial read-frambuffer binding should be null');
    const framebuffer = webgl2Device.createFramebuffer({colorAttachments: ['rgba8unorm']});

    setGLParameters(webgl2Device, {
      [GL.READ_FRAMEBUFFER_BINDING]: framebuffer.handle
    });

    fbHandle = getGLParameters(webgl2Device, [GL.READ_FRAMEBUFFER_BINDING])[GL.READ_FRAMEBUFFER_BINDING];
    t.equal(fbHandle, framebuffer.handle, 'setGLParameters should set read-framebuffer binding');

    // verify setting null value
    setGLParameters(webgl2Device, {
      [GL.READ_FRAMEBUFFER_BINDING]: null
    });

    fbHandle = getGLParameters(webgl2Device, [GL.READ_FRAMEBUFFER_BINDING])[GL.READ_FRAMEBUFFER_BINDING];
    t.equal(fbHandle, null, 'setGLParameters should set read-framebuffer binding');
  } else {
    t.comment('WebGL2 not available, skipping tests');
  }
  t.end();
});
