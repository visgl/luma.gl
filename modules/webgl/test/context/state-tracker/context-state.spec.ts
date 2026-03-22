import {expect, test} from 'vitest';
import { getWebGLTestDevice } from '@luma.gl/test-utils';
import type { TypedArray } from '@math.gl/types';
import type { GLParameters } from '@luma.gl/constants';
import { GL } from '@luma.gl/constants';
import { getGLParameters, setGLParameters, resetGLParameters, withGLParameters } from '@luma.gl/webgl';
import { GL_PARAMETER_DEFAULTS as GL_PARAMETERS } from '@luma.gl/webgl/context/parameters/webgl-parameter-tables';
import { ENUM_STYLE_SETTINGS_SET1 } from './data/sample-enum-settings';
import { FUNCTION_STYLE_SETTINGS_SET1 } from './data/sample-function-settings';
function isTypedArray(v: unknown): TypedArray | null {
  return ArrayBuffer.isView(v) && !(v instanceof DataView) ? v as TypedArray : null;
}
export function stringifyTypedArray(v: unknown) {
  const typedArray = isTypedArray(v);
  v = typedArray ? Array.from(typedArray) : v;
  return JSON.stringify(v);
}
test('WebGL#state', async () => {
  expect(getGLParameters, 'getGLParameters imported ok').toBeTruthy();
  expect(setGLParameters, 'setGLParameters imported ok').toBeTruthy();
  expect(withGLParameters, 'withGLParameters imported ok').toBeTruthy();
  expect(resetGLParameters, 'resetGLParameters imported ok').toBeTruthy();
  expect(GL_PARAMETERS, 'TEST_EXPORTS ok').toBeTruthy();
});
test('WebGLState#getGLParameters (WebGL)', async () => {
  const webglDevice = await getWebGLTestDevice();
  resetGLParameters(webglDevice.gl);
  const parameters = getGLParameters(webglDevice.gl);
  for (const setting in GL_PARAMETERS) {
    const value = parameters[setting];
    expect(value !== undefined, `${webglDevice.getGLKey(setting)}: got a value ${stringifyTypedArray(value)}`).toBeTruthy();
  }
});

// TODO - restore asap
test('WebGLState#setGLParameters (Mixing enum and function style keys)', async () => {
  const webglDevice = await getWebGLTestDevice();
  resetGLParameters(webglDevice.gl);
  setGLParameters(webglDevice.gl, FUNCTION_STYLE_SETTINGS_SET1);
  const parameters = getGLParameters(webglDevice.gl);
  for (const key in ENUM_STYLE_SETTINGS_SET1) {
    const value = parameters[key];
    expect(value, `got expected value ${stringifyTypedArray(value)} for key: ${webglDevice.getGLKey(key)}`).toEqual(ENUM_STYLE_SETTINGS_SET1[key]);
  }
});

// TODO - restore asap
test('WebGLState#setGLParameters (Argument expansion for ***SeparateFunc setters))', async () => {
  const webglDevice = await getWebGLTestDevice();
  const expectedValues = {
    // blendFunc
    [GL.BLEND_SRC_RGB]: GL.SRC_ALPHA,
    [GL.BLEND_DST_RGB]: GL.ONE,
    [GL.BLEND_SRC_ALPHA]: GL.SRC_ALPHA,
    [GL.BLEND_DST_ALPHA]: GL.ONE,
    // stencilFunc
    [GL.STENCIL_FUNC]: GL.LEQUAL,
    [GL.STENCIL_REF]: 0.5,
    [GL.STENCIL_VALUE_MASK]: 0xbbbbbbbb,
    [GL.STENCIL_BACK_FUNC]: GL.LEQUAL,
    [GL.STENCIL_BACK_REF]: 0.5,
    [GL.STENCIL_BACK_VALUE_MASK]: 0xbbbbbbbb,
    // stencilOp
    [GL.STENCIL_FAIL]: GL.REPLACE,
    [GL.STENCIL_PASS_DEPTH_FAIL]: GL.INCR,
    [GL.STENCIL_PASS_DEPTH_PASS]: GL.DECR,
    [GL.STENCIL_BACK_FAIL]: GL.REPLACE,
    [GL.STENCIL_BACK_PASS_DEPTH_FAIL]: GL.INCR,
    [GL.STENCIL_BACK_PASS_DEPTH_PASS]: GL.DECR
  };
  resetGLParameters(webglDevice.gl);
  setGLParameters(webglDevice.gl, {
    blendFunc: [GL.SRC_ALPHA, GL.ONE],
    stencilFunc: [GL.LEQUAL, 0.5, 0xbbbbbbbb],
    stencilOp: [GL.REPLACE, GL.INCR, GL.DECR]
  });
  const actualParameters = getGLParameters(webglDevice.gl);
  for (const key in expectedValues) {
    const value = actualParameters[key];
    expect(value, `got expected value ${stringifyTypedArray(value)} for key: ${webglDevice.getGLKey(key)}`).toEqual(expectedValues[key]);
  }
});
test('WebGLState#withGLParameters', async () => {
  const webglDevice = await getWebGLTestDevice();
  const checkParameters = expected => {
    const parameters = getGLParameters(webglDevice.gl);
    for (const key in expected) {
      const value = parameters[key];
      expect(value, `got expected value ${stringifyTypedArray(value)}`).toEqual(expected[key]);
    }
  };
  resetGLParameters(webglDevice.gl);

  // Initialize parameters
  setGLParameters(webglDevice.gl, {
    clearColor: [0, 0, 0, 0],
    [GL.BLEND]: false
  });
  checkParameters({
    [GL.COLOR_CLEAR_VALUE]: [0, 0, 0, 0],
    [GL.BLEND]: false
  });
  withGLParameters(webglDevice.gl, {
    clearColor: [0, 1, 0, 1],
    [GL.BLEND]: true
  }, () => {
    // Parameters should be updated
    checkParameters({
      [GL.COLOR_CLEAR_VALUE]: [0, 1, 0, 1],
      [GL.BLEND]: true
    });
  });

  // Parameters should be restored
  checkParameters({
    [GL.COLOR_CLEAR_VALUE]: [0, 0, 0, 0],
    [GL.BLEND]: false
  });
  expect(() => withGLParameters(webglDevice.gl, {
    clearColor: [0, 1, 0, 1],
    [GL.BLEND]: true,
    nocatch: false
  }, () => {
    // Parameters should be updated
    checkParameters({
      [GL.COLOR_CLEAR_VALUE]: [0, 1, 0, 1],
      [GL.BLEND]: true
    });
    throw new Error();
  }), 'Operation throws error').toThrow();

  // Parameters should be restored
  checkParameters({
    [GL.COLOR_CLEAR_VALUE]: [0, 0, 0, 0],
    [GL.BLEND]: false
  });
});
test('WebGLState#withGLParameters: recursive', async () => {
  const webglDevice = await getWebGLTestDevice();
  resetGLParameters(webglDevice.gl);
  setGLParameters(webglDevice.gl, {
    clearColor: [0, 0, 0, 0],
    [GL.BLEND]: false,
    blendFunc: [GL.ONE_MINUS_SRC_ALPHA, GL.ZERO, GL.CONSTANT_ALPHA, GL.ZERO],
    blendEquation: GL.FUNC_ADD
  });
  let parameters = getGLParameters(webglDevice.gl);
  let clearColor = parameters[GL.COLOR_CLEAR_VALUE];
  let blendState = parameters[GL.BLEND];
  let blendFuncSrcRGB = parameters[GL.BLEND_SRC_RGB];
  let blendEquation = parameters[GL.BLEND_EQUATION_RGB];
  expect(clearColor, `got expected value ${stringifyTypedArray(clearColor)}`).toEqual([0, 0, 0, 0]);
  expect(blendState, `got expected value ${stringifyTypedArray(blendState)}`).toEqual(false);
  expect(blendFuncSrcRGB, `got expected value ${stringifyTypedArray(blendFuncSrcRGB)}`).toEqual(GL.ONE_MINUS_SRC_ALPHA);
  expect(blendEquation, `got expected value ${stringifyTypedArray(blendEquation)}`).toEqual(GL.FUNC_ADD);
  withGLParameters(webglDevice.gl, {
    clearColor: [0, 1, 0, 1],
    [GL.BLEND]: true
  }, () => {
    parameters = getGLParameters(webglDevice.gl);
    clearColor = parameters[GL.COLOR_CLEAR_VALUE];
    blendState = parameters[GL.BLEND];
    blendFuncSrcRGB = parameters[GL.BLEND_SRC_RGB];
    blendEquation = parameters[GL.BLEND_EQUATION_RGB];
    // Verify changed state
    expect(clearColor, `got expected value ${stringifyTypedArray(clearColor)}`).toEqual([0, 1, 0, 1]);
    expect(blendState, `got expected value ${stringifyTypedArray(blendState)}`).toEqual(true);
    // Verify un-changed state
    expect(blendFuncSrcRGB, `got expected un changed value ${stringifyTypedArray(blendFuncSrcRGB)}`).toEqual(GL.ONE_MINUS_SRC_ALPHA);
    expect(blendEquation, `got expected un changed value ${stringifyTypedArray(blendEquation)}`).toEqual(GL.FUNC_ADD);
    withGLParameters(webglDevice.gl, {
      blendFunc: [GL.ZERO, GL.ZERO, GL.CONSTANT_ALPHA, GL.ZERO],
      blendEquation: GL.FUNC_SUBTRACT
    }, () => {
      parameters = getGLParameters(webglDevice.gl);
      clearColor = parameters[GL.COLOR_CLEAR_VALUE];
      blendState = parameters[GL.BLEND];
      blendFuncSrcRGB = parameters[GL.BLEND_SRC_RGB];
      blendEquation = parameters[GL.BLEND_EQUATION_RGB];
      // Verify un-changed state
      expect(clearColor, `got expected value ${stringifyTypedArray(clearColor)}`).toEqual([0, 1, 0, 1]);
      expect(blendState, `got expected value ${stringifyTypedArray(blendState)}`).toEqual(true);
      // Verify changed state
      expect(blendFuncSrcRGB, `got expected changed value ${stringifyTypedArray(blendFuncSrcRGB)}`).toEqual(GL.ZERO);
      expect(blendEquation, `got expected changed value ${stringifyTypedArray(blendEquation)}`).toEqual(GL.FUNC_SUBTRACT);
    });
    parameters = getGLParameters(webglDevice.gl);
    blendFuncSrcRGB = parameters[GL.BLEND_SRC_RGB];
    blendEquation = parameters[GL.BLEND_EQUATION_RGB];
    expect(blendFuncSrcRGB, `got expected value ${stringifyTypedArray(blendFuncSrcRGB)}`).toEqual(GL.ONE_MINUS_SRC_ALPHA);
    expect(blendEquation, `got expected value ${stringifyTypedArray(blendEquation)}`).toEqual(GL.FUNC_ADD);
  });
  parameters = getGLParameters(webglDevice.gl);
  clearColor = parameters[GL.COLOR_CLEAR_VALUE];
  blendState = parameters[GL.BLEND];
  blendFuncSrcRGB = parameters[GL.BLEND_SRC_RGB];
  blendEquation = parameters[GL.BLEND_EQUATION_RGB];
  expect(clearColor, `got expected value ${stringifyTypedArray(clearColor)}`).toEqual([0, 0, 0, 0]);
  expect(blendState, `got expected value ${stringifyTypedArray(blendState)}`).toEqual(false);
  expect(blendFuncSrcRGB, `got expected initial value ${stringifyTypedArray(blendFuncSrcRGB)}`).toEqual(GL.ONE_MINUS_SRC_ALPHA);
  expect(blendEquation, `got expected initial value ${stringifyTypedArray(blendEquation)}`).toEqual(GL.FUNC_ADD);
});

// EXT_blend_minmax
test('WebGLState#BlendEquationMinMax', async () => {
  const webglDevice = await getWebGLTestDevice();

  // Verify if state set is scuccessful, we could be just returning the value from cache.

  const parametersArray: GLParameters[] = [{
    [GL.BLEND_EQUATION_RGB]: GL.MAX,
    [GL.BLEND_EQUATION_ALPHA]: GL.MIN
  }, {
    blendEquation: GL.MAX
  }];
  const expectedArray: GLParameters[] = [{
    [GL.BLEND_EQUATION_RGB]: GL.MAX,
    [GL.BLEND_EQUATION_ALPHA]: GL.MIN
  }, {
    [GL.BLEND_EQUATION_RGB]: GL.MAX,
    [GL.BLEND_EQUATION_ALPHA]: GL.MAX
  }];
  resetGLParameters(webglDevice.gl);

  // eslint-disable-next-line @typescript-eslint/no-for-in-array
  for (const index in parametersArray) {
    const parameters = parametersArray[index];
    const expected = expectedArray[index];
    setGLParameters(webglDevice.gl, parameters);
    const actualParameters = getGLParameters(webglDevice.gl);
    // eslint-disable-next-line @typescript-eslint/no-for-in-array
    for (const state in expected) {
      const value = actualParameters[state];
      expect(value, `WebGL : expected value, ${webglDevice.getGLKey(value)} received for ${webglDevice.getGLKey(state)}`).toBe(expected[state]);
    }
  }
});
test('WebGLState#bindFramebuffer', async () => {
  const webglDevice = await getWebGLTestDevice();
  const framebuffer = webglDevice.createFramebuffer({
    colorAttachments: ['rgba8unorm']
  });
  const framebufferTwo = webglDevice.createFramebuffer({
    colorAttachments: ['rgba8unorm']
  });
  const framebufferThree = webglDevice.createFramebuffer({
    colorAttachments: ['rgba8unorm']
  });
  let fbHandle;
  resetGLParameters(webglDevice.gl);
  setGLParameters(webglDevice.gl, {
    framebuffer: framebuffer.handle
  });
  fbHandle = getGLParameters(webglDevice.gl, [GL.DRAW_FRAMEBUFFER_BINDING])[GL.DRAW_FRAMEBUFFER_BINDING];
  // NOTE: DRAW_FRAMEBUFFER_BINDING and FRAMEBUFFER_BINDING are same enums
  expect(fbHandle, 'FRAMEBUFFER binding should set DRAW_FRAMEBUFFER_BINDING').toBe(framebuffer.handle);
  fbHandle = getGLParameters(webglDevice.gl, [GL.READ_FRAMEBUFFER_BINDING])[GL.READ_FRAMEBUFFER_BINDING];
  expect(fbHandle, 'FRAMEBUFFER binding should also set READ_FRAMEBUFFER_BINDING').toBe(framebuffer.handle);
  webglDevice.gl.bindFramebuffer(GL.DRAW_FRAMEBUFFER, framebufferTwo.handle);
  fbHandle = getGLParameters(webglDevice.gl, [GL.DRAW_FRAMEBUFFER_BINDING])[GL.DRAW_FRAMEBUFFER_BINDING];
  expect(fbHandle, 'DRAW_FRAMEBUFFER binding should set DRAW_FRAMEBUFFER_BINDING').toBe(framebufferTwo.handle);
  fbHandle = getGLParameters(webglDevice.gl, [GL.READ_FRAMEBUFFER_BINDING])[GL.READ_FRAMEBUFFER_BINDING];
  expect(fbHandle, 'DRAW_FRAMEBUFFER binding should NOT set READ_FRAMEBUFFER_BINDING').toBe(framebuffer.handle);
  webglDevice.gl.bindFramebuffer(GL.READ_FRAMEBUFFER, framebufferThree.handle);
  fbHandle = getGLParameters(webglDevice.gl, [GL.DRAW_FRAMEBUFFER_BINDING])[GL.DRAW_FRAMEBUFFER_BINDING];
  expect(fbHandle, 'READ_FRAMEBUFFER binding should NOT set DRAW_FRAMEBUFFER_BINDING').toBe(framebufferTwo.handle);
  fbHandle = getGLParameters(webglDevice.gl, [GL.READ_FRAMEBUFFER_BINDING])[GL.READ_FRAMEBUFFER_BINDING];
  expect(fbHandle, 'READ_FRAMEBUFFER binding should set READ_FRAMEBUFFER_BINDING').toBe(framebufferThree.handle);
});
test('WebGLState#withGLParameters framebuffer', async () => {
  const webglDevice = await getWebGLTestDevice();
  const framebufferOne = webglDevice.createFramebuffer({
    colorAttachments: ['rgba8unorm']
  });
  const framebufferTwo = webglDevice.createFramebuffer({
    colorAttachments: ['rgba8unorm']
  });
  resetGLParameters(webglDevice.gl);
  let fbHandle;
  fbHandle = getGLParameters(webglDevice.gl, GL.FRAMEBUFFER_BINDING);
  expect(fbHandle, 'Initial draw frambuffer binding should be null').toBe(null);
  withGLParameters(webglDevice.gl, {
    framebuffer: framebufferOne
  }, () => {
    fbHandle = getGLParameters(webglDevice.gl, GL.FRAMEBUFFER_BINDING);
    expect(fbHandle, 'withGLParameters should bind framebuffer').toEqual(framebufferOne.handle);
    withGLParameters(webglDevice.gl, {
      framebuffer: framebufferTwo
    }, () => {
      fbHandle = getGLParameters(webglDevice.gl, GL.FRAMEBUFFER_BINDING);
      expect(fbHandle, 'Inner withGLParameters should bind framebuffer').toEqual(framebufferTwo.handle);
    });
    fbHandle = getGLParameters(webglDevice.gl, GL.FRAMEBUFFER_BINDING);
    expect(fbHandle, 'Inner withGLParameters should restore draw framebuffer binding').toEqual(framebufferOne.handle);
  });
  fbHandle = getGLParameters(webglDevice.gl, GL.FRAMEBUFFER_BINDING);
  expect(fbHandle, 'withGLParameters should restore framebuffer bidning').toEqual(null);
});
test('WebGLState#withGLParameters empty parameters object', async () => {
  const webglDevice = await getWebGLTestDevice();
  resetGLParameters(webglDevice.gl);
  setGLParameters(webglDevice.gl, {
    clearColor: [0, 0, 0, 0],
    [GL.BLEND]: false
  });
  let clearColor = getGLParameters(webglDevice.gl, GL.COLOR_CLEAR_VALUE);
  let blendState = getGLParameters(webglDevice.gl, GL.BLEND);
  expect(clearColor, `got expected value ${stringifyTypedArray(clearColor)}`).toEqual([0, 0, 0, 0]);
  expect(blendState, `got expected value ${stringifyTypedArray(blendState)}`).toEqual(false);
  withGLParameters(webglDevice.gl, {}, () => {
    clearColor = getGLParameters(webglDevice.gl, GL.COLOR_CLEAR_VALUE);
    blendState = getGLParameters(webglDevice.gl, GL.BLEND);
    expect(clearColor, `got expected value ${stringifyTypedArray(clearColor)}`).toEqual([0, 0, 0, 0]);
    expect(blendState, `got expected value ${stringifyTypedArray(blendState)}`).toEqual(false);
  });
  clearColor = getGLParameters(webglDevice.gl, GL.COLOR_CLEAR_VALUE);
  blendState = getGLParameters(webglDevice.gl, GL.BLEND);
  expect(clearColor, `got expected value ${stringifyTypedArray(clearColor)}`).toEqual([0, 0, 0, 0]);
  expect(blendState, `got expected value ${stringifyTypedArray(blendState)}`).toEqual(false);
});
