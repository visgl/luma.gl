import {expect, test} from 'vitest';
import { getWebGLTestDevice } from '@luma.gl/test-utils';
import { stringifyTypedArray } from './context-state.spec';
import { setGLParameters, getGLParameters, resetGLParameters } from '@luma.gl/webgl';
import { RenderPass } from '@luma.gl/core';
import { GL } from '@luma.gl/constants';
import { GL_PARAMETER_DEFAULTS } from '@luma.gl/webgl/context/parameters/webgl-parameter-tables';
import { ENUM_STYLE_SETTINGS_SET1_PRIMITIVE } from './data/sample-enum-settings';

// Settings test, don't reuse a context
test('WebGL#set and get', async () => {
  const webglDevice = await getWebGLTestDevice();
  resetGLParameters(webglDevice.gl);
  let cullFace = getGLParameters(webglDevice.gl, [GL.CULL_FACE])[GL.CULL_FACE];
  expect(cullFace, `got expected value ${stringifyTypedArray(cullFace)}`).toEqual(false);
  setGLParameters(webglDevice.gl, {
    [GL.CULL_FACE]: true
  });
  cullFace = getGLParameters(webglDevice.gl, [GL.CULL_FACE])[GL.CULL_FACE];
  expect(cullFace, `got expected value ${stringifyTypedArray(cullFace)}`).toEqual(true);
  let clearValue = getGLParameters(webglDevice.gl, [GL.DEPTH_CLEAR_VALUE])[GL.DEPTH_CLEAR_VALUE];
  expect(clearValue, `got expected value ${stringifyTypedArray(clearValue)}`).toBe(1);
  setGLParameters(webglDevice.gl, {
    [GL.DEPTH_CLEAR_VALUE]: -1
  });
  clearValue = getGLParameters(webglDevice.gl, [GL.DEPTH_CLEAR_VALUE])[GL.DEPTH_CLEAR_VALUE];
  expect(clearValue, `got expected value ${stringifyTypedArray(clearValue)}`).toBe(-1);
});
test('WebGL#composite setter', async () => {
  const webglDevice = await getWebGLTestDevice();
  const compositeStateKeys = [GL.STENCIL_FUNC, GL.STENCIL_REF, GL.STENCIL_VALUE_MASK];
  resetGLParameters(webglDevice.gl);

  // Verify default values.
  for (const key of compositeStateKeys) {
    const value = getGLParameters(webglDevice.gl, [key] as any[])[key];
    expect(value, `got expected default value ${stringifyTypedArray(value)}`).toEqual(GL_PARAMETER_DEFAULTS[key]);
  }

  // Update only two states out of three.
  setGLParameters(webglDevice.gl, {
    [GL.STENCIL_FUNC]: GL.NEVER,
    [GL.STENCIL_REF]: 0.5
  });
  let value = getGLParameters(webglDevice.gl, [GL.STENCIL_FUNC])[GL.STENCIL_FUNC];
  expect(value, `got expected updated value ${stringifyTypedArray(value)}`).toEqual(GL.NEVER);
  value = getGLParameters(webglDevice.gl, [GL.STENCIL_REF])[GL.STENCIL_REF];
  expect(value, `got expected updated value ${stringifyTypedArray(value)}`).toEqual(0.5);
  value = getGLParameters(webglDevice.gl, [GL.STENCIL_VALUE_MASK])[GL.STENCIL_VALUE_MASK];
  expect(value, `got expected updated defuault value ${stringifyTypedArray(value)}`).toEqual(GL_PARAMETER_DEFAULTS[GL.STENCIL_VALUE_MASK]);
});
test('WebGL#setGLParameters per-face stencil state', async () => {
  const webglDevice = await getWebGLTestDevice();
  resetGLParameters(webglDevice.gl);
  setGLParameters(webglDevice.gl, {
    stencilFunc: [GL.GREATER, 1, 0x0f, GL.LESS, 2, 0xf0],
    stencilOp: [GL.KEEP, GL.REPLACE, GL.INCR, GL.DECR, GL.INVERT, GL.ZERO],
    stencilMask: [0x0f0f0f0f, 0x00ff00ff]
  });
  const stencilState = getGLParameters(webglDevice.gl, [GL.STENCIL_FUNC, GL.STENCIL_REF, GL.STENCIL_VALUE_MASK, GL.STENCIL_BACK_FUNC, GL.STENCIL_BACK_REF, GL.STENCIL_BACK_VALUE_MASK, GL.STENCIL_FAIL, GL.STENCIL_PASS_DEPTH_FAIL, GL.STENCIL_PASS_DEPTH_PASS, GL.STENCIL_BACK_FAIL, GL.STENCIL_BACK_PASS_DEPTH_FAIL, GL.STENCIL_BACK_PASS_DEPTH_PASS, GL.STENCIL_WRITEMASK, GL.STENCIL_BACK_WRITEMASK]);
  expect(stencilState[GL.STENCIL_FUNC], `got expected stencil func ${stringifyTypedArray(stencilState[GL.STENCIL_FUNC])}`).toEqual(GL.GREATER);
  expect(stencilState[GL.STENCIL_REF], `got expected stencil reference ${stringifyTypedArray(stencilState[GL.STENCIL_REF])}`).toEqual(1);
  expect(stencilState[GL.STENCIL_VALUE_MASK], `got expected stencil mask ${stringifyTypedArray(stencilState[GL.STENCIL_VALUE_MASK])}`).toEqual(0x0f);
  expect(stencilState[GL.STENCIL_BACK_FUNC], `got expected back stencil func ${stringifyTypedArray(stencilState[GL.STENCIL_BACK_FUNC])}`).toEqual(GL.LESS);
  expect(stencilState[GL.STENCIL_BACK_REF], `got expected back stencil reference ${stringifyTypedArray(stencilState[GL.STENCIL_BACK_REF])}`).toEqual(2);
  expect(stencilState[GL.STENCIL_BACK_VALUE_MASK], `got expected back stencil mask ${stringifyTypedArray(stencilState[GL.STENCIL_BACK_VALUE_MASK])}`).toEqual(0xf0);
  expect(stencilState[GL.STENCIL_FAIL], `got expected stencil fail op ${stringifyTypedArray(stencilState[GL.STENCIL_FAIL])}`).toEqual(GL.KEEP);
  expect(stencilState[GL.STENCIL_PASS_DEPTH_FAIL], `got expected stencil depth fail op ${stringifyTypedArray(stencilState[GL.STENCIL_PASS_DEPTH_FAIL])}`).toEqual(GL.REPLACE);
  expect(stencilState[GL.STENCIL_PASS_DEPTH_PASS], `got expected stencil depth pass op ${stringifyTypedArray(stencilState[GL.STENCIL_PASS_DEPTH_PASS])}`).toEqual(GL.INCR);
  expect(stencilState[GL.STENCIL_BACK_FAIL], `got expected back stencil fail op ${stringifyTypedArray(stencilState[GL.STENCIL_BACK_FAIL])}`).toEqual(GL.DECR);
  expect(stencilState[GL.STENCIL_BACK_PASS_DEPTH_FAIL], `got expected back stencil depth fail op ${stringifyTypedArray(stencilState[GL.STENCIL_BACK_PASS_DEPTH_FAIL])}`).toEqual(GL.INVERT);
  expect(stencilState[GL.STENCIL_BACK_PASS_DEPTH_PASS], `got expected back stencil depth pass op ${stringifyTypedArray(stencilState[GL.STENCIL_BACK_PASS_DEPTH_PASS])}`).toEqual(GL.ZERO);
  expect(stencilState[GL.STENCIL_WRITEMASK], `got expected stencil write mask ${stringifyTypedArray(stencilState[GL.STENCIL_WRITEMASK])}`).toEqual(0x0f0f0f0f);
  expect(stencilState[GL.STENCIL_BACK_WRITEMASK], `got expected back stencil write mask ${stringifyTypedArray(stencilState[GL.STENCIL_BACK_WRITEMASK])}`).toEqual(0x00ff00ff);
});
test('WebGLState#get all parameters', async () => {
  const webglDevice = await getWebGLTestDevice();
  resetGLParameters(webglDevice.gl);

  // Set custom values.
  setGLParameters(webglDevice.gl, ENUM_STYLE_SETTINGS_SET1_PRIMITIVE);
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    const value = getGLParameters(webglDevice.gl, [key] as any[])[key];
    expect(value, `got expected value ${stringifyTypedArray(value)} after setGLParameters for ${webglDevice.getGLKey(key)}`).toEqual(ENUM_STYLE_SETTINGS_SET1_PRIMITIVE[key]);
  }
  const copy = getGLParameters(webglDevice.gl);
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    const value = copy[key];
    expect(value, `got expected value ${stringifyTypedArray(value)} after getGLParameters for ${webglDevice.getGLKey(key)}`).toEqual(ENUM_STYLE_SETTINGS_SET1_PRIMITIVE[key]);
  }
});
test('WebGLRenderPass#setParameters stencil reference', async () => {
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
      parameters: {
        stencilReference: 5
      }
    });
    const stencilState = getGLParameters(webglDevice.gl, [GL.STENCIL_REF, GL.STENCIL_BACK_REF]);
    expect(stencilState[GL.STENCIL_REF], `got expected stencil reference ${stringifyTypedArray(stencilState[GL.STENCIL_REF])}`).toEqual(5);
    expect(stencilState[GL.STENCIL_BACK_REF], `got expected back stencil reference ${stringifyTypedArray(stencilState[GL.STENCIL_BACK_REF])}`).toEqual(5);
    expect(warnings, 'no warnings emitted for stencilReference').toEqual([]);
  } finally {
    // eslint-disable-next-line no-console
    console.warn = originalConsoleWarn;
    if (renderPass) {
      renderPass.end();
    }
  }
});
test('WebGL#reset', async () => {
  const webglDevice = await getWebGLTestDevice();

  // Set custom values and verify.
  setGLParameters(webglDevice.gl, ENUM_STYLE_SETTINGS_SET1_PRIMITIVE);
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    const value = getGLParameters(webglDevice.gl, [key] as any[])[key];
    expect(value, `got expected value ${stringifyTypedArray(value)} after setGLParameters for ${webglDevice.getGLKey(key)}`).toEqual(ENUM_STYLE_SETTINGS_SET1_PRIMITIVE[key]);
  }

  // reset
  resetGLParameters(webglDevice.gl);

  // Verify default values.
  for (const key in ENUM_STYLE_SETTINGS_SET1_PRIMITIVE) {
    const value = getGLParameters(webglDevice.gl, [key] as any[])[key];
    expect(value, `got expected value ${stringifyTypedArray(value)} after resetGLParameters for ${webglDevice.getGLKey(key)}`).toEqual(GL_PARAMETER_DEFAULTS[key]);
  }
});
test('WebGLState#setGLParameters framebuffer', async () => {
  const webglDevice = await getWebGLTestDevice();
  resetGLParameters(webglDevice.gl);
  let fbHandle = getGLParameters(webglDevice.gl, [GL.FRAMEBUFFER_BINDING])[GL.FRAMEBUFFER_BINDING];
  // t.equal(fbHandle, null, 'Initial frambuffer binding should be null');
  const framebuffer = webglDevice.createFramebuffer({
    colorAttachments: ['rgba8unorm']
  });
  setGLParameters(webglDevice.gl, {
    [GL.FRAMEBUFFER_BINDING]: framebuffer.handle
  });
  fbHandle = getGLParameters(webglDevice.gl, [GL.FRAMEBUFFER_BINDING])[GL.FRAMEBUFFER_BINDING];
  expect(fbHandle, 'setGLParameters should set framebuffer binding').toBe(framebuffer.handle);

  // verify setting null value
  setGLParameters(webglDevice.gl, {
    [GL.FRAMEBUFFER_BINDING]: null
  });
  fbHandle = getGLParameters(webglDevice.gl, [GL.FRAMEBUFFER_BINDING])[GL.FRAMEBUFFER_BINDING];
  expect(fbHandle, 'setGLParameters should set framebuffer binding').toBe(null);
});
test('WebGLState#setGLParameters read-framebuffer (WebGL2 only)', async () => {
  const webglDevice = await getWebGLTestDevice();
  resetGLParameters(webglDevice.gl);
  let fbHandle = getGLParameters(webglDevice.gl, [GL.READ_FRAMEBUFFER_BINDING])[GL.READ_FRAMEBUFFER_BINDING];
  // t.equal(fbHandle, null, 'Initial read-frambuffer binding should be null');
  const framebuffer = webglDevice.createFramebuffer({
    colorAttachments: ['rgba8unorm']
  });
  setGLParameters(webglDevice.gl, {
    [GL.READ_FRAMEBUFFER_BINDING]: framebuffer.handle
  });
  fbHandle = getGLParameters(webglDevice.gl, [GL.READ_FRAMEBUFFER_BINDING])[GL.READ_FRAMEBUFFER_BINDING];
  expect(fbHandle, 'setGLParameters should set read-framebuffer binding').toBe(framebuffer.handle);

  // verify setting null value
  setGLParameters(webglDevice.gl, {
    [GL.READ_FRAMEBUFFER_BINDING]: null
  });
  fbHandle = getGLParameters(webglDevice.gl, [GL.READ_FRAMEBUFFER_BINDING])[GL.READ_FRAMEBUFFER_BINDING];
  expect(fbHandle, 'setGLParameters should set read-framebuffer binding').toBe(null);
});
