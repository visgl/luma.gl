// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {webglDevice} from '@luma.gl/test-utils';

import type {GLParameters} from '@luma.gl/constants';
import {GL} from '@luma.gl/constants';

import type {TypedArray} from '@luma.gl/core';
import {
  getGLParameters,
  setGLParameters,
  resetGLParameters,
  withGLParameters
} from '@luma.gl/webgl';

import {GL_PARAMETER_DEFAULTS as GL_PARAMETERS} from '@luma.gl/webgl/context/parameters/webgl-parameter-tables';
import {ENUM_STYLE_SETTINGS_SET1} from './data/sample-enum-settings';
import {FUNCTION_STYLE_SETTINGS_SET1} from './data/sample-function-settings';

function isTypedArray(v: unknown): TypedArray | null {
  return ArrayBuffer.isView(v) && !(v instanceof DataView) ? (v as TypedArray) : null;
}

export function stringifyTypedArray(v: unknown) {
  const typedArray = isTypedArray(v);
  v = typedArray ? Array.from(typedArray) : v;
  return JSON.stringify(v);
}

test('WebGL#state', t => {
  t.ok(getGLParameters, 'getGLParameters imported ok');
  t.ok(setGLParameters, 'setGLParameters imported ok');
  t.ok(withGLParameters, 'withGLParameters imported ok');
  t.ok(resetGLParameters, 'resetGLParameters imported ok');
  t.ok(GL_PARAMETERS, 'TEST_EXPORTS ok');
  t.end();
});

test('WebGLState#getGLParameters', t => {
  resetGLParameters(webglDevice);
  const parameters = getGLParameters(webglDevice);

  for (const setting in GL_PARAMETERS) {
    const value = parameters[setting];
    t.ok(value !== undefined, `${setting}: got a value ${stringifyTypedArray(value)}`);
  }
  t.end();
});

test('WebGLState#getGLParameters (WebGL2)', t => {
  if (webglDevice) {
    resetGLParameters(webglDevice);
    const parameters = getGLParameters(webglDevice);

    for (const setting in GL_PARAMETERS) {
      const value = parameters[setting];
      t.ok(
        value !== undefined,
        `${webglDevice.getGLKey(setting)}: got a value ${stringifyTypedArray(value)}`
      );
    }
  }
  t.end();
});

// TODO - restore asap
test.skip('WebGLState#setGLParameters (Mixing enum and function style keys)', t => {
  resetGLParameters(webglDevice);

  setGLParameters(webglDevice, FUNCTION_STYLE_SETTINGS_SET1);
  const parameters = getGLParameters(webglDevice);

  for (const key in ENUM_STYLE_SETTINGS_SET1) {
    const value = parameters[key];
    t.deepEqual(
      value,
      ENUM_STYLE_SETTINGS_SET1[key],
      `got expected value ${stringifyTypedArray(value)} for key: ${webglDevice.getGLKey(key)}`
    );
  }
  t.end();
});

// TODO - restore asap
test('WebGLState#setGLParameters (Argument expansion for ***SeperateFunc setters))', t => {
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

  resetGLParameters(webglDevice);

  setGLParameters(webglDevice, {
    blendFunc: [GL.SRC_ALPHA, GL.ONE],
    stencilFunc: [GL.LEQUAL, 0.5, 0xbbbbbbbb],
    stencilOp: [GL.REPLACE, GL.INCR, GL.DECR]
  });
  const actualParameters = getGLParameters(webglDevice);

  for (const key in expectedValues) {
    const value = actualParameters[key];
    t.deepEqual(
      value,
      expectedValues[key],
      `got expected value ${stringifyTypedArray(value)} for key: ${webglDevice.getGLKey(key)}`
    );
  }
  t.end();
});

test('WebGLState#withGLParameters', t => {
  const checkParameters = expected => {
    const parameters = getGLParameters(webglDevice);
    for (const key in expected) {
      const value = parameters[key];
      t.deepEqual(value, expected[key], `got expected value ${stringifyTypedArray(value)}`);
    }
  };

  resetGLParameters(webglDevice);

  // Initialize parameters
  setGLParameters(webglDevice, {
    clearColor: [0, 0, 0, 0],
    [GL.BLEND]: false
  });
  checkParameters({
    [GL.COLOR_CLEAR_VALUE]: [0, 0, 0, 0],
    [GL.BLEND]: false
  });

  withGLParameters(
    webglDevice,
    {
      clearColor: [0, 1, 0, 1],
      [GL.BLEND]: true
    },
    () => {
      // Parameters should be updated
      checkParameters({
        [GL.COLOR_CLEAR_VALUE]: [0, 1, 0, 1],
        [GL.BLEND]: true
      });
    }
  );

  // Parameters should be restored
  checkParameters({
    [GL.COLOR_CLEAR_VALUE]: [0, 0, 0, 0],
    [GL.BLEND]: false
  });

  t.throws(
    () =>
      withGLParameters(
        webglDevice,
        {
          clearColor: [0, 1, 0, 1],
          [GL.BLEND]: true,
          nocatch: false
        },
        () => {
          // Parameters should be updated
          checkParameters({
            [GL.COLOR_CLEAR_VALUE]: [0, 1, 0, 1],
            [GL.BLEND]: true
          });
          throw new Error();
        }
      ),
    'Operation throws error'
  );

  // Parameters should be restored
  checkParameters({
    [GL.COLOR_CLEAR_VALUE]: [0, 0, 0, 0],
    [GL.BLEND]: false
  });

  t.end();
});

test('WebGLState#withGLParameters: recursive', t => {
  resetGLParameters(webglDevice);

  setGLParameters(webglDevice, {
    clearColor: [0, 0, 0, 0],
    [GL.BLEND]: false,
    blendFunc: [GL.ONE_MINUS_SRC_ALPHA, GL.ZERO, GL.CONSTANT_ALPHA, GL.ZERO],
    blendEquation: GL.FUNC_ADD
  });

  let parameters = getGLParameters(webglDevice);
  let clearColor = parameters[GL.COLOR_CLEAR_VALUE];
  let blendState = parameters[GL.BLEND];
  let blendFuncSrcRGB = parameters[GL.BLEND_SRC_RGB];
  let blendEquation = parameters[GL.BLEND_EQUATION_RGB];
  t.deepEqual(clearColor, [0, 0, 0, 0], `got expected value ${stringifyTypedArray(clearColor)}`);
  t.deepEqual(blendState, false, `got expected value ${stringifyTypedArray(blendState)}`);
  t.deepEqual(
    blendFuncSrcRGB,
    GL.ONE_MINUS_SRC_ALPHA,
    `got expected value ${stringifyTypedArray(blendFuncSrcRGB)}`
  );
  t.deepEqual(
    blendEquation,
    GL.FUNC_ADD,
    `got expected value ${stringifyTypedArray(blendEquation)}`
  );
  withGLParameters(
    webglDevice,
    {
      clearColor: [0, 1, 0, 1],
      [GL.BLEND]: true
    },
    () => {
      parameters = getGLParameters(webglDevice);
      clearColor = parameters[GL.COLOR_CLEAR_VALUE];
      blendState = parameters[GL.BLEND];
      blendFuncSrcRGB = parameters[GL.BLEND_SRC_RGB];
      blendEquation = parameters[GL.BLEND_EQUATION_RGB];
      // Verify changed state
      t.deepEqual(
        clearColor,
        [0, 1, 0, 1],
        `got expected value ${stringifyTypedArray(clearColor)}`
      );
      t.deepEqual(blendState, true, `got expected value ${stringifyTypedArray(blendState)}`);
      // Verify un-changed state
      t.deepEqual(
        blendFuncSrcRGB,
        GL.ONE_MINUS_SRC_ALPHA,
        `got expected un changed value ${stringifyTypedArray(blendFuncSrcRGB)}`
      );
      t.deepEqual(
        blendEquation,
        GL.FUNC_ADD,
        `got expected un changed value ${stringifyTypedArray(blendEquation)}`
      );

      withGLParameters(
        webglDevice,
        {
          blendFunc: [GL.ZERO, GL.ZERO, GL.CONSTANT_ALPHA, GL.ZERO],
          blendEquation: GL.FUNC_SUBTRACT
        },
        () => {
          parameters = getGLParameters(webglDevice);
          clearColor = parameters[GL.COLOR_CLEAR_VALUE];
          blendState = parameters[GL.BLEND];
          blendFuncSrcRGB = parameters[GL.BLEND_SRC_RGB];
          blendEquation = parameters[GL.BLEND_EQUATION_RGB];
          // Verify un-changed state
          t.deepEqual(
            clearColor,
            [0, 1, 0, 1],
            `got expected value ${stringifyTypedArray(clearColor)}`
          );
          t.deepEqual(blendState, true, `got expected value ${stringifyTypedArray(blendState)}`);
          // Verify changed state
          t.deepEqual(
            blendFuncSrcRGB,
            GL.ZERO,
            `got expected changed value ${stringifyTypedArray(blendFuncSrcRGB)}`
          );
          t.deepEqual(
            blendEquation,
            GL.FUNC_SUBTRACT,
            `got expected changed value ${stringifyTypedArray(blendEquation)}`
          );
        }
      );
      parameters = getGLParameters(webglDevice);
      blendFuncSrcRGB = parameters[GL.BLEND_SRC_RGB];
      blendEquation = parameters[GL.BLEND_EQUATION_RGB];
      t.deepEqual(
        blendFuncSrcRGB,
        GL.ONE_MINUS_SRC_ALPHA,
        `got expected value ${stringifyTypedArray(blendFuncSrcRGB)}`
      );
      t.deepEqual(
        blendEquation,
        GL.FUNC_ADD,
        `got expected value ${stringifyTypedArray(blendEquation)}`
      );
    }
  );

  parameters = getGLParameters(webglDevice);
  clearColor = parameters[GL.COLOR_CLEAR_VALUE];
  blendState = parameters[GL.BLEND];
  blendFuncSrcRGB = parameters[GL.BLEND_SRC_RGB];
  blendEquation = parameters[GL.BLEND_EQUATION_RGB];
  t.deepEqual(clearColor, [0, 0, 0, 0], `got expected value ${stringifyTypedArray(clearColor)}`);
  t.deepEqual(blendState, false, `got expected value ${stringifyTypedArray(blendState)}`);
  t.deepEqual(
    blendFuncSrcRGB,
    GL.ONE_MINUS_SRC_ALPHA,
    `got expected initial value ${stringifyTypedArray(blendFuncSrcRGB)}`
  );
  t.deepEqual(
    blendEquation,
    GL.FUNC_ADD,
    `got expected initial value ${stringifyTypedArray(blendEquation)}`
  );

  t.end();
});

// EXT_blend_minmax
test('WebGLState#BlendEquationMinMax', t => {
  // Verify if state set is scuccessful, we could be just returning the value from cache.

  const parametersArray: GLParameters[] = [
    {
      [GL.BLEND_EQUATION_RGB]: GL.MAX,
      [GL.BLEND_EQUATION_ALPHA]: GL.MIN
    },
    {
      blendEquation: GL.MAX
    }
  ];
  const expectedArray: GLParameters[] = [
    {
      [GL.BLEND_EQUATION_RGB]: GL.MAX,
      [GL.BLEND_EQUATION_ALPHA]: GL.MIN
    },
    {
      [GL.BLEND_EQUATION_RGB]: GL.MAX,
      [GL.BLEND_EQUATION_ALPHA]: GL.MAX
    }
  ];

  if (webglDevice) {
    resetGLParameters(webglDevice);

    // eslint-disable-next-line @typescript-eslint/no-for-in-array
    for (const index in parametersArray) {
      const parameters = parametersArray[index];
      const expected = expectedArray[index];

      setGLParameters(webglDevice, parameters);

      const actualParameters = getGLParameters(webglDevice);
      // eslint-disable-next-line @typescript-eslint/no-for-in-array
      for (const state in expected) {
        const value = actualParameters[state];
        t.equal(
          value,
          expected[state],
          `WebGL : expected value, ${webglDevice.getGLKey(
            value
          )} received for ${webglDevice.getGLKey(state)}`
        );
      }
    }
  } else {
    t.comment('WebGL not available, skipping tests');
  }

  t.end();
});

test('WebGLState#bindFramebuffer (WebGL2)', t => {
  const framebuffer = webglDevice.createFramebuffer({colorAttachments: ['rgba8unorm']});
  const framebufferTwo = webglDevice.createFramebuffer({colorAttachments: ['rgba8unorm']});
  const framebufferThree = webglDevice.createFramebuffer({colorAttachments: ['rgba8unorm']});
  let fbHandle;

  resetGLParameters(webglDevice);

  setGLParameters(webglDevice, {
    framebuffer: framebuffer.handle
  });

  fbHandle = getGLParameters(webglDevice, [GL.DRAW_FRAMEBUFFER_BINDING])[
    GL.DRAW_FRAMEBUFFER_BINDING
  ];
  // NOTE: DRAW_FRAMEBUFFER_BINDING and FRAMEBUFFER_BINDING are same enums
  t.equal(fbHandle, framebuffer.handle, 'FRAMEBUFFER binding should set DRAW_FRAMEBUFFER_BINDING');

  fbHandle = getGLParameters(webglDevice, [GL.READ_FRAMEBUFFER_BINDING])[
    GL.READ_FRAMEBUFFER_BINDING
  ];
  t.equal(
    fbHandle,
    framebuffer.handle,
    'FRAMEBUFFER binding should also set READ_FRAMEBUFFER_BINDING'
  );

  webglDevice.gl.bindFramebuffer(GL.DRAW_FRAMEBUFFER, framebufferTwo.handle);

  fbHandle = getGLParameters(webglDevice, [GL.DRAW_FRAMEBUFFER_BINDING])[
    GL.DRAW_FRAMEBUFFER_BINDING
  ];
  t.equal(
    fbHandle,
    framebufferTwo.handle,
    'DRAW_FRAMEBUFFER binding should set DRAW_FRAMEBUFFER_BINDING'
  );

  fbHandle = getGLParameters(webglDevice, [GL.READ_FRAMEBUFFER_BINDING])[
    GL.READ_FRAMEBUFFER_BINDING
  ];
  t.equal(
    fbHandle,
    framebuffer.handle,
    'DRAW_FRAMEBUFFER binding should NOT set READ_FRAMEBUFFER_BINDING'
  );

  webglDevice.gl.bindFramebuffer(GL.READ_FRAMEBUFFER, framebufferThree.handle);
  fbHandle = getGLParameters(webglDevice, [GL.DRAW_FRAMEBUFFER_BINDING])[
    GL.DRAW_FRAMEBUFFER_BINDING
  ];
  t.equal(
    fbHandle,
    framebufferTwo.handle,
    'READ_FRAMEBUFFER binding should NOT set DRAW_FRAMEBUFFER_BINDING'
  );

  fbHandle = getGLParameters(webglDevice, [GL.READ_FRAMEBUFFER_BINDING])[
    GL.READ_FRAMEBUFFER_BINDING
  ];
  t.equal(
    fbHandle,
    framebufferThree.handle,
    'READ_FRAMEBUFFER binding should set READ_FRAMEBUFFER_BINDING'
  );
  t.end();
});

test('WebGLState#withGLParameters framebuffer', t => {
  const framebufferOne = webglDevice.createFramebuffer({colorAttachments: ['rgba8unorm']});

  const framebufferTwo = webglDevice.createFramebuffer({colorAttachments: ['rgba8unorm']});

  resetGLParameters(webglDevice);

  let fbHandle;
  fbHandle = getGLParameters(webglDevice, GL.FRAMEBUFFER_BINDING);
  t.equal(fbHandle, null, 'Initial draw frambuffer binding should be null');

  withGLParameters(webglDevice, {framebuffer: framebufferOne}, () => {
    fbHandle = getGLParameters(webglDevice, GL.FRAMEBUFFER_BINDING);
    t.deepEqual(fbHandle, framebufferOne.handle, 'withGLParameters should bind framebuffer');

    withGLParameters(webglDevice, {framebuffer: framebufferTwo}, () => {
      fbHandle = getGLParameters(webglDevice, GL.FRAMEBUFFER_BINDING);
      t.deepEqual(
        fbHandle,
        framebufferTwo.handle,
        'Inner withGLParameters should bind framebuffer'
      );
    });

    fbHandle = getGLParameters(webglDevice, GL.FRAMEBUFFER_BINDING);
    t.deepEqual(
      fbHandle,
      framebufferOne.handle,
      'Inner withGLParameters should restore draw framebuffer binding'
    );
  });
  fbHandle = getGLParameters(webglDevice, GL.FRAMEBUFFER_BINDING);
  t.deepEqual(fbHandle, null, 'withGLParameters should restore framebuffer bidning');

  t.end();
});

test('WebGLState#withGLParameters empty parameters object', t => {
  resetGLParameters(webglDevice);

  setGLParameters(webglDevice, {
    clearColor: [0, 0, 0, 0],
    [GL.BLEND]: false
  });

  let clearColor = getGLParameters(webglDevice, GL.COLOR_CLEAR_VALUE);
  let blendState = getGLParameters(webglDevice, GL.BLEND);
  t.deepEqual(clearColor, [0, 0, 0, 0], `got expected value ${stringifyTypedArray(clearColor)}`);
  t.deepEqual(blendState, false, `got expected value ${stringifyTypedArray(blendState)}`);

  withGLParameters(webglDevice, {}, () => {
    clearColor = getGLParameters(webglDevice, GL.COLOR_CLEAR_VALUE);
    blendState = getGLParameters(webglDevice, GL.BLEND);
    t.deepEqual(clearColor, [0, 0, 0, 0], `got expected value ${stringifyTypedArray(clearColor)}`);
    t.deepEqual(blendState, false, `got expected value ${stringifyTypedArray(blendState)}`);
  });

  clearColor = getGLParameters(webglDevice, GL.COLOR_CLEAR_VALUE);
  blendState = getGLParameters(webglDevice, GL.BLEND);
  t.deepEqual(clearColor, [0, 0, 0, 0], `got expected value ${stringifyTypedArray(clearColor)}`);
  t.deepEqual(blendState, false, `got expected value ${stringifyTypedArray(blendState)}`);

  t.end();
});
