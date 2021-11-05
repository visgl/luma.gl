import test from 'tape-promise/tape';
import GL from '@luma.gl/constants';
import {getParameters, setParameters, resetParameters, withParameters} from '@luma.gl/gltools';

import {getKey, Framebuffer} from '@luma.gl/webgl';

import {GL_PARAMETER_DEFAULTS as GL_PARAMETERS} from '@luma.gl/gltools/lib/state-tracker/webgl-parameter-tables';

import {ENUM_STYLE_SETTINGS_SET1} from '../data/sample-enum-settings';
import {FUNCTION_STYLE_SETTINGS_SET1} from '../data/sample-function-settings';

import {createTestContext} from '@luma.gl/test-utils';

function stringifyTypedArray(v) {
  v = ArrayBuffer.isView(v) ? Array.apply([], v) : v;
  return JSON.stringify(v);
}

const fixture = {
  gl: createTestContext(),
  gl2: createTestContext({webgl2: true, webgl1: false})
};

test('WebGL#state', (t) => {
  t.ok(getParameters, 'getParameters imported ok');
  t.ok(setParameters, 'setParameters imported ok');
  t.ok(withParameters, 'withParameters imported ok');
  t.ok(resetParameters, 'resetParameters imported ok');
  t.ok(GL_PARAMETERS, 'TEST_EXPORTS ok');
  t.end();
});

test('WebGLState#getParameters', (t) => {
  const {gl} = fixture;

  resetParameters(gl);
  const parameters = getParameters(gl);

  for (const setting in GL_PARAMETERS) {
    const value = parameters[setting];
    t.ok(value !== undefined, `${setting}: got a value ${stringifyTypedArray(value)}`);
  }
  t.end();
});

test('WebGLState#getParameters (WebGL2)', (t) => {
  const {gl2} = fixture;
  if (gl2) {
    resetParameters(gl2);
    const parameters = getParameters(gl2);

    for (const setting in GL_PARAMETERS) {
      const value = parameters[setting];
      t.ok(
        value !== undefined,
        `${getKey(GL, setting)}: got a value ${stringifyTypedArray(value)}`
      );
    }
  }
  t.end();
});

test('WebGLState#setParameters (Mixing enum and function style keys)', (t) => {
  const {gl} = fixture;

  resetParameters(gl);

  setParameters(gl, FUNCTION_STYLE_SETTINGS_SET1);
  const parameters = getParameters(gl);

  for (const key in ENUM_STYLE_SETTINGS_SET1) {
    const value = parameters[key];
    t.deepEqual(
      value,
      ENUM_STYLE_SETTINGS_SET1[key],
      `got expected value ${stringifyTypedArray(value)} for key: ${getKey(GL, key)}`
    );
  }
  t.end();
});

test('WebGLState#setParameters (Argument expansion for ***SeperateFunc setters))', (t) => {
  const {gl} = fixture;

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

  resetParameters(gl);

  setParameters(gl, {
    blendFunc: [GL.SRC_ALPHA, GL.ONE],
    stencilFunc: [GL.LEQUAL, 0.5, 0xbbbbbbbb],
    stencilOp: [GL.REPLACE, GL.INCR, GL.DECR]
  });
  const actualParameters = getParameters(gl);

  for (const key in expectedValues) {
    const value = actualParameters[key];
    t.deepEqual(
      value,
      expectedValues[key],
      `got expected value ${stringifyTypedArray(value)} for key: ${getKey(GL, key)}`
    );
  }
  t.end();
});

test('WebGLState#withParameters', (t) => {
  const {gl} = fixture;

  const checkParameters = (expected) => {
    const parameters = getParameters(gl);
    for (const key in expected) {
      const value = parameters[key];
      t.deepEqual(value, expected[key], `got expected value ${stringifyTypedArray(value)}`);
    }
  };

  resetParameters(gl);

  // Initialize parameters
  setParameters(gl, {
    clearColor: [0, 0, 0, 0],
    [GL.BLEND]: false
  });
  checkParameters({
    [GL.COLOR_CLEAR_VALUE]: [0, 0, 0, 0],
    [GL.BLEND]: false
  });

  withParameters(
    gl,
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
      withParameters(
        gl,
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

test('WebGLState#withParameters: recursive', (t) => {
  const {gl} = fixture;

  resetParameters(gl);

  setParameters(gl, {
    clearColor: [0, 0, 0, 0],
    [GL.BLEND]: false,
    blendFunc: [GL.ONE_MINUS_SRC_ALPHA, GL.ZERO, GL.CONSTANT_ALPHA, GL.ZERO],
    blendEquation: GL.FUNC_ADD
  });

  let parameters = getParameters(gl);
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
  withParameters(
    gl,
    {
      clearColor: [0, 1, 0, 1],
      [GL.BLEND]: true
    },
    () => {
      parameters = getParameters(gl);
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

      withParameters(
        gl,
        {
          blendFunc: [GL.ZERO, GL.ZERO, GL.CONSTANT_ALPHA, GL.ZERO],
          blendEquation: GL.FUNC_SUBTRACT
        },
        () => {
          parameters = getParameters(gl);
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
      parameters = getParameters(gl);
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

  parameters = getParameters(gl);
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
test('WebGLState#BlendEquationMinMax', (t) => {
  // TODO: For WebGL1 this test passing could be false positive.
  // Verify if state set is scuccessful, we could be just returning the value from cache.

  const {gl, gl2} = fixture;
  const contexts = {
    ['WebGL1 Context']: gl,
    ['WebGL2 Context']: gl2
  };
  const parametersArray = [
    {
      [GL.BLEND_EQUATION_RGB]: GL.MAX,
      [GL.BLEND_EQUATION_ALPHA]: GL.MIN
    },
    {
      blendEquation: GL.MAX
    }
  ];
  const expectedArray = [
    {
      [GL.BLEND_EQUATION_RGB]: GL.MAX,
      [GL.BLEND_EQUATION_ALPHA]: GL.MIN
    },
    {
      [GL.BLEND_EQUATION_RGB]: GL.MAX,
      [GL.BLEND_EQUATION_ALPHA]: GL.MAX
    }
  ];

  for (const contextName in contexts) {
    const context = contexts[contextName];
    if (context) {
      resetParameters(context);

      for (const index in parametersArray) {
        const parameters = parametersArray[index];
        const expected = expectedArray[index];

        setParameters(context, parameters);

        const actualParameters = getParameters(context);
        for (const state in expected) {
          const value = actualParameters[state];
          t.equal(
            value,
            expected[state],
            `${contextName} : expected value, ${getKey(GL, value)} received for ${getKey(
              GL,
              state
            )}`
          );
        }
      }
    } else {
      t.comment(`${contextName} not available, skipping tests`);
    }
  }
  t.end();
});

test('WebGLState#bindFramebuffer (WebGL1)', (t) => {
  const {gl} = fixture;
  const framebuffer = new Framebuffer(gl);
  let fbHandle;

  resetParameters(gl);

  fbHandle = getParameters(gl, gl.FRAMEBUFFER_BINDING);
  t.equal(fbHandle, null, 'Initial draw frambuffer binding should be null');

  setParameters(gl, {
    framebuffer
  });

  fbHandle = getParameters(gl, gl.FRAMEBUFFER_BINDING);
  t.equal(fbHandle, framebuffer.handle, 'setParameters should set framebuffer binding');

  t.end();
});

test('WebGLState#bindFramebuffer (WebGL2)', (t) => {
  const {gl2} = fixture;
  if (gl2) {
    const framebuffer = new Framebuffer(gl2);
    const framebufferTwo = new Framebuffer(gl2);
    const framebufferThree = new Framebuffer(gl2);
    let fbHandle;

    resetParameters(gl2);

    setParameters(gl2, {
      framebuffer: framebuffer.handle
    });

    // @ts-ignore
    fbHandle = getParameters(gl2, [gl2.DRAW_FRAMEBUFFER_BINDING])[gl2.DRAW_FRAMEBUFFER_BINDING];
    // NOTE: DRAW_FRAMEBUFFER_BINDING and FRAMEBUFFER_BINDING are same enums
    t.equal(
      fbHandle,
      framebuffer.handle,
      'FRAMEBUFFER binding should set DRAW_FRAMEBUFFER_BINDING'
    );

    // @ts-ignore
    fbHandle = getParameters(gl2, [gl2.READ_FRAMEBUFFER_BINDING])[gl2.READ_FRAMEBUFFER_BINDING];
    t.equal(
      fbHandle,
      framebuffer.handle,
      'FRAMEBUFFER binding should also set READ_FRAMEBUFFER_BINDING'
    );

    // @ts-ignore
    gl2.bindFramebuffer(gl2.DRAW_FRAMEBUFFER, framebufferTwo.handle);

    // @ts-ignore
    fbHandle = getParameters(gl2, [gl2.DRAW_FRAMEBUFFER_BINDING])[gl2.DRAW_FRAMEBUFFER_BINDING];
    t.equal(
      fbHandle,
      framebufferTwo.handle,
      'DRAW_FRAMEBUFFER binding should set DRAW_FRAMEBUFFER_BINDING'
    );

    // @ts-ignore
    fbHandle = getParameters(gl2, [gl2.READ_FRAMEBUFFER_BINDING])[gl2.READ_FRAMEBUFFER_BINDING];
    t.equal(
      fbHandle,
      framebuffer.handle,
      'DRAW_FRAMEBUFFER binding should NOT set READ_FRAMEBUFFER_BINDING'
    );

    // @ts-ignore
    gl2.bindFramebuffer(gl2.READ_FRAMEBUFFER, framebufferThree.handle);
    // @ts-ignore
    fbHandle = getParameters(gl2, [gl2.DRAW_FRAMEBUFFER_BINDING])[gl2.DRAW_FRAMEBUFFER_BINDING];
    t.equal(
      fbHandle,
      framebufferTwo.handle,
      'READ_FRAMEBUFFER binding should NOT set DRAW_FRAMEBUFFER_BINDING'
    );

    // @ts-ignore
    fbHandle = getParameters(gl2, [gl2.READ_FRAMEBUFFER_BINDING])[gl2.READ_FRAMEBUFFER_BINDING];
    t.equal(
      fbHandle,
      framebufferThree.handle,
      'READ_FRAMEBUFFER binding should set READ_FRAMEBUFFER_BINDING'
    );
  } else {
    t.comment('WebGL2 not available, skipping tests');
  }
  t.end();
});

test('WebGLState#withParameters framebuffer', (t) => {
  const {gl} = fixture;
  const framebufferOne = new Framebuffer(gl);
  const framebufferTwo = new Framebuffer(gl);

  resetParameters(gl);

  let fbHandle;
  fbHandle = getParameters(gl, gl.FRAMEBUFFER_BINDING);
  t.equal(fbHandle, null, 'Initial draw frambuffer binding should be null');

  withParameters(gl, {framebuffer: framebufferOne}, () => {
    fbHandle = getParameters(gl, gl.FRAMEBUFFER_BINDING);
    t.deepEqual(fbHandle, framebufferOne.handle, 'withParameters should bind framebuffer');

    withParameters(gl, {framebuffer: framebufferTwo}, () => {
      fbHandle = getParameters(gl, gl.FRAMEBUFFER_BINDING);
      t.deepEqual(fbHandle, framebufferTwo.handle, 'Inner withParameters should bind framebuffer');
    });

    fbHandle = getParameters(gl, gl.FRAMEBUFFER_BINDING);
    t.deepEqual(
      fbHandle,
      framebufferOne.handle,
      'Inner withParameters should restore draw framebuffer binding'
    );
  });
  fbHandle = getParameters(gl, gl.FRAMEBUFFER_BINDING);
  t.deepEqual(fbHandle, null, 'withParameters should restore framebuffer bidning');

  t.end();
});

test('WebGLState#withParameters empty parameters object', (t) => {
  const {gl} = fixture;

  resetParameters(gl);

  setParameters(gl, {
    clearColor: [0, 0, 0, 0],
    [GL.BLEND]: false
  });

  let clearColor = getParameters(gl, GL.COLOR_CLEAR_VALUE);
  let blendState = getParameters(gl, GL.BLEND);
  t.deepEqual(clearColor, [0, 0, 0, 0], `got expected value ${stringifyTypedArray(clearColor)}`);
  t.deepEqual(blendState, false, `got expected value ${stringifyTypedArray(blendState)}`);

  withParameters(gl, {}, () => {
    clearColor = getParameters(gl, GL.COLOR_CLEAR_VALUE);
    blendState = getParameters(gl, GL.BLEND);
    t.deepEqual(clearColor, [0, 0, 0, 0], `got expected value ${stringifyTypedArray(clearColor)}`);
    t.deepEqual(blendState, false, `got expected value ${stringifyTypedArray(blendState)}`);
  });

  clearColor = getParameters(gl, GL.COLOR_CLEAR_VALUE);
  blendState = getParameters(gl, GL.BLEND);
  t.deepEqual(clearColor, [0, 0, 0, 0], `got expected value ${stringifyTypedArray(clearColor)}`);
  t.deepEqual(blendState, false, `got expected value ${stringifyTypedArray(blendState)}`);

  t.end();
});
