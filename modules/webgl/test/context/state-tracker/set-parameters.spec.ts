import test from 'tape-promise/tape';
import {webgl1Device, webgl2Device} from '@luma.gl/test-utils';
import {stringifyTypedArray} from './context-state.spec';

import {setParameters, getParameters, resetParameters} from '@luma.gl/webgl';

import GL from '@luma.gl/constants';
import {GL_PARAMETER_DEFAULTS} from '@luma.gl/webgl/context/parameters/webgl-parameter-tables';
import {ENUM_STYLE_SETTINGS_SET1_PRIMITIVE} from './data/sample-enum-settings';

// Settings test, don't reuse a context
test('WebGL#set and get', (t) => {
  resetParameters(webgl1Device);

  let cullFace = getParameters(webgl1Device, [GL.CULL_FACE])[GL.CULL_FACE];
  t.deepEqual(cullFace, false, `got expected value ${stringifyTypedArray(cullFace)}`);

  setParameters(webgl1Device, {[GL.CULL_FACE]: true});
  cullFace = getParameters(webgl1Device, [GL.CULL_FACE])[GL.CULL_FACE];
  t.deepEqual(cullFace, true, `got expected value ${stringifyTypedArray(cullFace)}`);

  let clearValue = getParameters(webgl1Device, [GL.DEPTH_CLEAR_VALUE])[GL.DEPTH_CLEAR_VALUE];
  t.is(clearValue, 1, `got expected value ${stringifyTypedArray(clearValue)}`);

  setParameters(webgl1Device, {[GL.DEPTH_CLEAR_VALUE]: -1});
  clearValue = getParameters(webgl1Device, [GL.DEPTH_CLEAR_VALUE])[GL.DEPTH_CLEAR_VALUE];
  t.is(clearValue, -1, `got expected value ${stringifyTypedArray(clearValue)}`);

  // @ts-expect-error
  t.throws(() => setParameters({}), 'throws with non WebGL context');

  t.end();
});

test('WebGL#composite setter', (t) => {
  const compositeStateKeys = [GL.STENCIL_FUNC, GL.STENCIL_REF, GL.STENCIL_VALUE_MASK];

  resetParameters(webgl1Device);

  // Verify default values.
  for (const key of compositeStateKeys) {
    // @ts-expect-error
    const value = getParameters(webgl1Device, [key])[key];
    t.deepEqual(
      value,
      GL_PARAMETER_DEFAULTS[key],
      `got expected default value ${stringifyTypedArray(value)}`
    );
  }

  // Update only two states out of three.
  setParameters(webgl1Device, {
    [GL.STENCIL_FUNC]: GL.NEVER,
    [GL.STENCIL_REF]: 0.5
  });

  let value = getParameters(webgl1Device, [GL.STENCIL_FUNC])[GL.STENCIL_FUNC];
  t.deepEqual(value, GL.NEVER, `got expected updated value ${stringifyTypedArray(value)}`);
  value = getParameters(webgl1Device, [GL.STENCIL_REF])[GL.STENCIL_REF];
  t.deepEqual(value, 0.5, `got expected updated value ${stringifyTypedArray(value)}`);
  value = getParameters(webgl1Device, [GL.STENCIL_VALUE_MASK])[GL.STENCIL_VALUE_MASK];
  t.deepEqual(
    value,
    GL_PARAMETER_DEFAULTS[GL.STENCIL_VALUE_MASK],
    `got expected updated defuault value ${stringifyTypedArray(value)}`
  );

  t.end();
});

test('WebGLState#get all parameters', (t) => {

  resetParameters(webgl1Device);

  // Set custom values.
  setParameters(webgl1Device, ENUM_STYLE_SETTINGS_SET1_PRIMITIVE);
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    // @ts-expect-error
    const value = getParameters(webgl1Device, [key])[key];
    t.deepEqual(
      value,
      ENUM_STYLE_SETTINGS_SET1_PRIMITIVE[key],
      `got expected value ${stringifyTypedArray(value)} after setParameters for ${webgl1Device.getGLKey(key)}`
    );
  }

  const copy = getParameters(webgl1Device);
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    const value = copy[key];
    t.deepEqual(
      value,
      ENUM_STYLE_SETTINGS_SET1_PRIMITIVE[key],
      `got expected value ${stringifyTypedArray(value)} after getParameters for ${webgl1Device.getGLKey(key)}`
    );
  }

  t.end();
});

test('WebGL#reset', (t) => {

  // Set custom values and verify.
  setParameters(webgl1Device, ENUM_STYLE_SETTINGS_SET1_PRIMITIVE);
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    // @ts-expect-error
    const value = getParameters(webgl1Device, [key])[key];
    t.deepEqual(
      value,
      ENUM_STYLE_SETTINGS_SET1_PRIMITIVE[key],
      `got expected value ${stringifyTypedArray(value)} after setParameters for ${webgl1Device.getGLKey(key)}`
    );
  }

  // reset
  resetParameters(webgl1Device);

  // Verify default values.
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    // @ts-expect-error
    const value = getParameters(webgl1Device, [key])[key];
    t.deepEqual(
      value,
      GL_PARAMETER_DEFAULTS[key],
      `got expected value ${stringifyTypedArray(value)} after resetParameters for ${webgl1Device.getGLKey(
        key
      )}`
    );
  }

  t.end();
});

test('WebGLState#setParameters framebuffer', (t) => {

  resetParameters(webgl1Device);

  let fbHandle = getParameters(webgl1Device, [GL.FRAMEBUFFER_BINDING])[GL.FRAMEBUFFER_BINDING];
  // t.equal(fbHandle, null, 'Initial frambuffer binding should be null');
  const framebuffer = webgl1Device.createFramebuffer({colorAttachments: ['rgba8unorm']});

  setParameters(webgl1Device, {
    [GL.FRAMEBUFFER_BINDING]: framebuffer.handle
  });
  fbHandle = getParameters(webgl1Device, [GL.FRAMEBUFFER_BINDING])[GL.FRAMEBUFFER_BINDING];
  t.equal(fbHandle, framebuffer.handle, 'setParameters should set framebuffer binding');

  // verify setting null value
  setParameters(webgl1Device, {
    [GL.FRAMEBUFFER_BINDING]: null
  });
  fbHandle = getParameters(webgl1Device, [GL.FRAMEBUFFER_BINDING])[GL.FRAMEBUFFER_BINDING];
  t.equal(fbHandle, null, 'setParameters should set framebuffer binding');

  t.end();
});

test('WebGLState#setParameters read-framebuffer (WebGL2 only)', (t) => {
  // const webgl2Device = createTestContext({webgl2: true, webgl1: false});
  if (webgl2Device) {
    resetParameters(webgl2Device);


    let fbHandle = getParameters(webgl2Device, [GL.READ_FRAMEBUFFER_BINDING])[GL.READ_FRAMEBUFFER_BINDING];
    // t.equal(fbHandle, null, 'Initial read-frambuffer binding should be null');
    const framebuffer = webgl2Device.createFramebuffer({colorAttachments: ['rgba8unorm']});

    setParameters(webgl2Device, {
      [GL.READ_FRAMEBUFFER_BINDING]: framebuffer.handle
    });

    fbHandle = getParameters(webgl2Device, [GL.READ_FRAMEBUFFER_BINDING])[GL.READ_FRAMEBUFFER_BINDING];
    t.equal(fbHandle, framebuffer.handle, 'setParameters should set read-framebuffer binding');

    // verify setting null value
    setParameters(webgl2Device, {
      [GL.READ_FRAMEBUFFER_BINDING]: null
    });

    fbHandle = getParameters(webgl2Device, [GL.READ_FRAMEBUFFER_BINDING])[GL.READ_FRAMEBUFFER_BINDING];
    t.equal(fbHandle, null, 'setParameters should set read-framebuffer binding');
  } else {
    t.comment('WebGL2 not available, skipping tests');
  }
  t.end();
});
