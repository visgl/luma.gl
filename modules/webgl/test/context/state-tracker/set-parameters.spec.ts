// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {webglDevice} from '@luma.gl/test-utils';
import {stringifyTypedArray} from './context-state.spec';

import {setGLParameters, getGLParameters, resetGLParameters} from '@luma.gl/webgl';

import {GL} from '@luma.gl/constants';
import {GL_PARAMETER_DEFAULTS} from '@luma.gl/webgl/context/parameters/webgl-parameter-tables';
import {ENUM_STYLE_SETTINGS_SET1_PRIMITIVE} from './data/sample-enum-settings';

// Settings test, don't reuse a context
test('WebGL#set and get', t => {
  resetGLParameters(webglDevice.gl);

  let cullFace = getGLParameters(webglDevice.gl, [GL.CULL_FACE])[GL.CULL_FACE];
  t.deepEqual(cullFace, false, `got expected value ${stringifyTypedArray(cullFace)}`);

  setGLParameters(webglDevice.gl, {[GL.CULL_FACE]: true});
  cullFace = getGLParameters(webglDevice.gl, [GL.CULL_FACE])[GL.CULL_FACE];
  t.deepEqual(cullFace, true, `got expected value ${stringifyTypedArray(cullFace)}`);

  let clearValue = getGLParameters(webglDevice.gl, [GL.DEPTH_CLEAR_VALUE])[GL.DEPTH_CLEAR_VALUE];
  t.is(clearValue, 1, `got expected value ${stringifyTypedArray(clearValue)}`);

  setGLParameters(webglDevice.gl, {[GL.DEPTH_CLEAR_VALUE]: -1});
  clearValue = getGLParameters(webglDevice.gl, [GL.DEPTH_CLEAR_VALUE])[GL.DEPTH_CLEAR_VALUE];
  t.is(clearValue, -1, `got expected value ${stringifyTypedArray(clearValue)}`);

  t.end();
});

test('WebGL#composite setter', t => {
  const compositeStateKeys = [GL.STENCIL_FUNC, GL.STENCIL_REF, GL.STENCIL_VALUE_MASK];

  resetGLParameters(webglDevice.gl);

  // Verify default values.
  for (const key of compositeStateKeys) {
    const value = getGLParameters(webglDevice.gl, [key] as any[])[key];
    t.deepEqual(
      value,
      GL_PARAMETER_DEFAULTS[key],
      `got expected default value ${stringifyTypedArray(value)}`
    );
  }

  // Update only two states out of three.
  setGLParameters(webglDevice.gl, {
    [GL.STENCIL_FUNC]: GL.NEVER,
    [GL.STENCIL_REF]: 0.5
  });

  let value = getGLParameters(webglDevice.gl, [GL.STENCIL_FUNC])[GL.STENCIL_FUNC];
  t.deepEqual(value, GL.NEVER, `got expected updated value ${stringifyTypedArray(value)}`);
  value = getGLParameters(webglDevice.gl, [GL.STENCIL_REF])[GL.STENCIL_REF];
  t.deepEqual(value, 0.5, `got expected updated value ${stringifyTypedArray(value)}`);
  value = getGLParameters(webglDevice.gl, [GL.STENCIL_VALUE_MASK])[GL.STENCIL_VALUE_MASK];
  t.deepEqual(
    value,
    GL_PARAMETER_DEFAULTS[GL.STENCIL_VALUE_MASK],
    `got expected updated defuault value ${stringifyTypedArray(value)}`
  );

  t.end();
});

test('WebGLState#get all parameters', t => {
  resetGLParameters(webglDevice.gl);

  // Set custom values.
  setGLParameters(webglDevice.gl, ENUM_STYLE_SETTINGS_SET1_PRIMITIVE);
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    const value = getGLParameters(webglDevice.gl, [key] as any[])[key];
    t.deepEqual(
      value,
      ENUM_STYLE_SETTINGS_SET1_PRIMITIVE[key],
      `got expected value ${stringifyTypedArray(
        value
      )} after setGLParameters for ${webglDevice.getGLKey(key)}`
    );
  }

  const copy = getGLParameters(webglDevice.gl);
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    const value = copy[key];
    t.deepEqual(
      value,
      ENUM_STYLE_SETTINGS_SET1_PRIMITIVE[key],
      `got expected value ${stringifyTypedArray(
        value
      )} after getGLParameters for ${webglDevice.getGLKey(key)}`
    );
  }

  t.end();
});

test('WebGL#reset', t => {
  // Set custom values and verify.
  setGLParameters(webglDevice.gl, ENUM_STYLE_SETTINGS_SET1_PRIMITIVE);
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    const value = getGLParameters(webglDevice.gl, [key] as any[])[key];
    t.deepEqual(
      value,
      ENUM_STYLE_SETTINGS_SET1_PRIMITIVE[key],
      `got expected value ${stringifyTypedArray(
        value
      )} after setGLParameters for ${webglDevice.getGLKey(key)}`
    );
  }

  // reset
  resetGLParameters(webglDevice.gl);

  // Verify default values.
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    const value = getGLParameters(webglDevice.gl, [key] as any[])[key];
    t.deepEqual(
      value,
      GL_PARAMETER_DEFAULTS[key],
      `got expected value ${stringifyTypedArray(
        value
      )} after resetGLParameters for ${webglDevice.getGLKey(key)}`
    );
  }

  t.end();
});

test('WebGLState#setGLParameters framebuffer', t => {
  resetGLParameters(webglDevice.gl);

  let fbHandle = getGLParameters(webglDevice.gl, [GL.FRAMEBUFFER_BINDING])[GL.FRAMEBUFFER_BINDING];
  // t.equal(fbHandle, null, 'Initial frambuffer binding should be null');
  const framebuffer = webglDevice.createFramebuffer({colorAttachments: ['rgba8unorm']});

  setGLParameters(webglDevice.gl, {
    [GL.FRAMEBUFFER_BINDING]: framebuffer.handle
  });
  fbHandle = getGLParameters(webglDevice.gl, [GL.FRAMEBUFFER_BINDING])[GL.FRAMEBUFFER_BINDING];
  t.equal(fbHandle, framebuffer.handle, 'setGLParameters should set framebuffer binding');

  // verify setting null value
  setGLParameters(webglDevice.gl, {
    [GL.FRAMEBUFFER_BINDING]: null
  });
  fbHandle = getGLParameters(webglDevice.gl, [GL.FRAMEBUFFER_BINDING])[GL.FRAMEBUFFER_BINDING];
  t.equal(fbHandle, null, 'setGLParameters should set framebuffer binding');

  t.end();
});

test('WebGLState#setGLParameters read-framebuffer (WebGL2 only)', t => {
  // const webglDevice = createTestContext({webgl2: true, webgl1: false});
  resetGLParameters(webglDevice.gl);

  let fbHandle = getGLParameters(webglDevice.gl, [GL.READ_FRAMEBUFFER_BINDING])[
    GL.READ_FRAMEBUFFER_BINDING
  ];
  // t.equal(fbHandle, null, 'Initial read-frambuffer binding should be null');
  const framebuffer = webglDevice.createFramebuffer({colorAttachments: ['rgba8unorm']});

  setGLParameters(webglDevice.gl, {
    [GL.READ_FRAMEBUFFER_BINDING]: framebuffer.handle
  });

  fbHandle = getGLParameters(webglDevice.gl, [GL.READ_FRAMEBUFFER_BINDING])[
    GL.READ_FRAMEBUFFER_BINDING
  ];
  t.equal(fbHandle, framebuffer.handle, 'setGLParameters should set read-framebuffer binding');

  // verify setting null value
  setGLParameters(webglDevice.gl, {
    [GL.READ_FRAMEBUFFER_BINDING]: null
  });

  fbHandle = getGLParameters(webglDevice.gl, [GL.READ_FRAMEBUFFER_BINDING])[
    GL.READ_FRAMEBUFFER_BINDING
  ];
  t.equal(fbHandle, null, 'setGLParameters should set read-framebuffer binding');
  t.end();
});
