// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {stringifyTypedArray} from './context-state.spec';

import {setGLParameters, getGLParameters, resetGLParameters} from '@luma.gl/webgl';

import {RenderPass} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';
import {GL_PARAMETER_DEFAULTS} from '@luma.gl/webgl/context/parameters/webgl-parameter-tables';
import {ENUM_STYLE_SETTINGS_SET1_PRIMITIVE} from './data/sample-enum-settings';

// Settings test, don't reuse a context
test('WebGL#set and get', async t => {
  const webglDevice = await getWebGLTestDevice();

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

test('WebGL#composite setter', async t => {
  const webglDevice = await getWebGLTestDevice();

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

test('WebGL#setGLParameters per-face stencil state', async t => {
  const webglDevice = await getWebGLTestDevice();

  resetGLParameters(webglDevice.gl);

  setGLParameters(webglDevice.gl, {
    stencilFunc: [GL.GREATER, 1, 0x0f, GL.LESS, 2, 0xf0],
    stencilOp: [GL.KEEP, GL.REPLACE, GL.INCR, GL.DECR, GL.INVERT, GL.ZERO],
    stencilMask: [0x0f0f0f0f, 0x00ff00ff]
  });

  const stencilState = getGLParameters(webglDevice.gl, [
    GL.STENCIL_FUNC,
    GL.STENCIL_REF,
    GL.STENCIL_VALUE_MASK,
    GL.STENCIL_BACK_FUNC,
    GL.STENCIL_BACK_REF,
    GL.STENCIL_BACK_VALUE_MASK,
    GL.STENCIL_FAIL,
    GL.STENCIL_PASS_DEPTH_FAIL,
    GL.STENCIL_PASS_DEPTH_PASS,
    GL.STENCIL_BACK_FAIL,
    GL.STENCIL_BACK_PASS_DEPTH_FAIL,
    GL.STENCIL_BACK_PASS_DEPTH_PASS,
    GL.STENCIL_WRITEMASK,
    GL.STENCIL_BACK_WRITEMASK
  ]);

  t.deepEqual(
    stencilState[GL.STENCIL_FUNC],
    GL.GREATER,
    `got expected stencil func ${stringifyTypedArray(stencilState[GL.STENCIL_FUNC])}`
  );
  t.deepEqual(
    stencilState[GL.STENCIL_REF],
    1,
    `got expected stencil reference ${stringifyTypedArray(stencilState[GL.STENCIL_REF])}`
  );
  t.deepEqual(
    stencilState[GL.STENCIL_VALUE_MASK],
    0x0f,
    `got expected stencil mask ${stringifyTypedArray(stencilState[GL.STENCIL_VALUE_MASK])}`
  );
  t.deepEqual(
    stencilState[GL.STENCIL_BACK_FUNC],
    GL.LESS,
    `got expected back stencil func ${stringifyTypedArray(stencilState[GL.STENCIL_BACK_FUNC])}`
  );
  t.deepEqual(
    stencilState[GL.STENCIL_BACK_REF],
    2,
    `got expected back stencil reference ${stringifyTypedArray(stencilState[GL.STENCIL_BACK_REF])}`
  );
  t.deepEqual(
    stencilState[GL.STENCIL_BACK_VALUE_MASK],
    0xf0,
    `got expected back stencil mask ${stringifyTypedArray(stencilState[GL.STENCIL_BACK_VALUE_MASK])}`
  );

  t.deepEqual(
    stencilState[GL.STENCIL_FAIL],
    GL.KEEP,
    `got expected stencil fail op ${stringifyTypedArray(stencilState[GL.STENCIL_FAIL])}`
  );
  t.deepEqual(
    stencilState[GL.STENCIL_PASS_DEPTH_FAIL],
    GL.REPLACE,
    `got expected stencil depth fail op ${stringifyTypedArray(
      stencilState[GL.STENCIL_PASS_DEPTH_FAIL]
    )}`
  );
  t.deepEqual(
    stencilState[GL.STENCIL_PASS_DEPTH_PASS],
    GL.INCR,
    `got expected stencil depth pass op ${stringifyTypedArray(
      stencilState[GL.STENCIL_PASS_DEPTH_PASS]
    )}`
  );
  t.deepEqual(
    stencilState[GL.STENCIL_BACK_FAIL],
    GL.DECR,
    `got expected back stencil fail op ${stringifyTypedArray(stencilState[GL.STENCIL_BACK_FAIL])}`
  );
  t.deepEqual(
    stencilState[GL.STENCIL_BACK_PASS_DEPTH_FAIL],
    GL.INVERT,
    `got expected back stencil depth fail op ${stringifyTypedArray(
      stencilState[GL.STENCIL_BACK_PASS_DEPTH_FAIL]
    )}`
  );
  t.deepEqual(
    stencilState[GL.STENCIL_BACK_PASS_DEPTH_PASS],
    GL.ZERO,
    `got expected back stencil depth pass op ${stringifyTypedArray(
      stencilState[GL.STENCIL_BACK_PASS_DEPTH_PASS]
    )}`
  );

  t.deepEqual(
    stencilState[GL.STENCIL_WRITEMASK],
    0x0f0f0f0f,
    `got expected stencil write mask ${stringifyTypedArray(stencilState[GL.STENCIL_WRITEMASK])}`
  );
  t.deepEqual(
    stencilState[GL.STENCIL_BACK_WRITEMASK],
    0x00ff00ff,
    `got expected back stencil write mask ${stringifyTypedArray(
      stencilState[GL.STENCIL_BACK_WRITEMASK]
    )}`
  );

  t.end();
});

test('WebGLState#get all parameters', async t => {
  const webglDevice = await getWebGLTestDevice();

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

test('WebGLRenderPass#setParameters stencil reference', async t => {
  const webglDevice = await getWebGLTestDevice();

  resetGLParameters(webglDevice.gl);

  // eslint-disable-next-line no-console
  const originalConsoleWarn = console.warn;
  const warnings: unknown[] = [];
  let renderPass: RenderPass | null = null;

  // eslint-disable-next-line no-console
  console.warn = (...args) => {
    warnings.push(args);
  };

  try {
    renderPass = webglDevice.beginRenderPass({
      parameters: {stencilReference: 5}
    });

    const stencilState = getGLParameters(webglDevice.gl, [GL.STENCIL_REF, GL.STENCIL_BACK_REF]);

    t.deepEqual(
      stencilState[GL.STENCIL_REF],
      5,
      `got expected stencil reference ${stringifyTypedArray(stencilState[GL.STENCIL_REF])}`
    );
    t.deepEqual(
      stencilState[GL.STENCIL_BACK_REF],
      5,
      `got expected back stencil reference ${stringifyTypedArray(stencilState[GL.STENCIL_BACK_REF])}`
    );
    t.deepEqual(warnings, [], 'no warnings emitted for stencilReference');
  } finally {
    // eslint-disable-next-line no-console
    console.warn = originalConsoleWarn;
    if (renderPass) {
      renderPass.end();
    }
  }

  t.end();
});

test('WebGL#reset', async t => {
  const webglDevice = await getWebGLTestDevice();

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

test('WebGLState#setGLParameters framebuffer', async t => {
  const webglDevice = await getWebGLTestDevice();

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

test('WebGLState#setGLParameters read-framebuffer (WebGL2 only)', async t => {
  const webglDevice = await getWebGLTestDevice();

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
