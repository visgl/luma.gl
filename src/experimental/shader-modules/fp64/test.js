// Copyright (c) 2016 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/* eslint-disable camelcase */
import test from 'tape-catch';

import {Buffer, createGLContext, Program} from '../../../webgl';
import {assembleShaders} from '../../shader-tools';
import {fp64ify} from './index';

// Special utility functions for df64 tests

function getRandomFloat64(upper = 256) {
  return Math.random() * Math.pow(2.0, (Math.random() - 0.5) * upper);
}

const TEST_LOOP = 20;

// Actual tests for different arithmetic functions

const TEST_CASES = {
  add_fp64: () => {
    const float0 = getRandomFloat64();
    const float1 = getRandomFloat64();
    const float_ref = float0 + float1;
    const float0_vec2 = fp64ify(float0);
    const float1_vec2 = fp64ify(float1);

    return {
      uniforms: {
        a: float0_vec2,
        b: float1_vec2
      },
      line: `(${float0_vec2}) + (${float1_vec2})`,
      result: float_ref
    };
  },

  sub_fp64: () => {
    const float0 = getRandomFloat64();
    const float1 = getRandomFloat64();
    const float_ref = float0 - float1;
    const float0_vec2 = fp64ify(float0);
    const float1_vec2 = fp64ify(float1);

    return {
      uniforms: {
        a: float0_vec2,
        b: float1_vec2
      },
      line: `(${float0_vec2}) - (${float1_vec2})`,
      result: float_ref
    };
  },

  mul_fp64: () => {
    const float0 = getRandomFloat64(128);
    const float1 = getRandomFloat64(128);
    const float_ref = float0 * float1;

    const float0_vec2 = fp64ify(float0);
    const float1_vec2 = fp64ify(float1);

    return {
      uniforms: {
        a: float0_vec2,
        b: float1_vec2
      },
      line: `(${float0_vec2}) * (${float1_vec2})`,
      result: float_ref
    };
  },

  div_fp64: () => {
    const float0 = getRandomFloat64(128);
    const float1 = getRandomFloat64(128);
    const float_ref = float0 / float1;

    const float0_vec2 = fp64ify(float0);
    const float1_vec2 = fp64ify(float1);

    return {
      uniforms: {
        a: float0_vec2,
        b: float1_vec2
      },
      line: `(${float0_vec2}) / (${float1_vec2})`,
      result: float_ref
    };
  },

  sqrt_fp64: () => {
    const float0 = getRandomFloat64(128);
    const float_ref = Math.sqrt(float0);

    const float0_vec2 = fp64ify(float0);

    return {
      uniforms: {
        a: float0_vec2
      },
      line: `sqrt(${float0_vec2})`,
      result: float_ref
    };
  },

  exp_fp64: () => {
    const float0 = getRandomFloat64(6);
    const float_ref = Math.exp(float0);

    const float0_vec2 = fp64ify(float0);

    return {
      uniforms: {
        a: float0_vec2
      },
      line: `exp(${float0_vec2})`,
      result: float_ref
    };
  },

  log_fp64: () => {
    const float0 = getRandomFloat64(24);
    const float_ref = Math.log(float0);

    const float0_vec2 = fp64ify(float0);

    return {
      uniforms: {
        a: float0_vec2
      },
      line: `log(${float0_vec2})`,
      result: float_ref
    };
  },

  sin_fp64: () => {
    const float0 = getRandomFloat64(3);
    const float_ref = Math.sin(float0);

    const float0_vec2 = fp64ify(float0);

    return {
      uniforms: {
        a: float0_vec2
      },
      line: `sin(${float0_vec2})`,
      result: float_ref
    };
  },

  cos_fp64: () => {
    const float0 = getRandomFloat64(3);
    const float_ref = Math.cos(float0);

    const float0_vec2 = fp64ify(float0);

    return {
      uniforms: {
        a: float0_vec2
      },
      line: `cos(${float0_vec2})`,
      result: float_ref
    };
  },

  tan_fp64: () => {
    const float0 = getRandomFloat64(3);
    const float_ref = Math.tan(float0);

    const float0_vec2 = fp64ify(float0);

    return {
      uniforms: {
        a: float0_vec2
      },
      line: `tan(${float0_vec2})`,
      result: float_ref
    };
  }
};

// Utilities

function initializeGL(canvas) {
  const gl = createGLContext();
  gl.viewport(0, 0, 16, 16);
  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (!gl.getExtension('OES_texture_float')) {
    // console.error('no floating point texture support!');
    throw new Error('no floating point texture support!');
  }

  return gl;
}

function initializeTexTarget(gl) {
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  framebuffer.width = 10;
  framebuffer.height = 10;

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

  gl.texImage2D(gl.TEXTURE_2D,
    0, gl.RGBA, framebuffer.width, framebuffer.height, 0, gl.RGBA, gl.FLOAT, null);

  const renderbuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER,
    gl.DEPTH_COMPONENT16, framebuffer.width, framebuffer.height);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
}

function getGPUOutput(gl) {
  const width = 16;
  const height = gl.canvas.height;
  const buf = new Float32Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, buf);
  return buf;
}

function checkError(t, result, reference) {
  const reference64 = reference[0] + reference[1];
  const result64 = result[0] + result[1];

  t.comment('------------------------');
  t.comment(`CPU output: (${reference[0]},${reference[1]}) = ${reference64}`);
  t.comment(`GPU output: (${result[0]},${result[1]},${result[2]},${result[3]}) = ${result64}`);
  t.comment(`error: "${Math.abs((reference64 - result64) / reference64)}"`);
}

function getProgram(gl, func, uniforms) {

  const functionUnderTest = `${func}${uniforms.b ? '(a, b)' : '(a)'}`;

  const vs = `
attribute vec3 positions;
uniform vec2 a;
uniform vec2 b;
varying vec4 vColor;
void main(void) {
  gl_Position = vec4(positions, 1.0);
  vec2 result = ${functionUnderTest};
  vColor = vec4(result.x, result.y, 0.0, 1.0);
}
`;

  const fs = `
#ifdef GL_ES
precision highp float;
#endif
varying vec4 vColor;
void main(void) {
  gl_FragColor = vColor;
}
`;

  return new Program(gl, assembleShaders(gl, {
    vs,
    fs,
    modules: ['fp64']
  }))
  .setBuffers({
    positions: new Buffer(gl).setData({
      data: new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]),
      size: 2
    })
  })
  .setUniforms({ONE: 1.0})
  .setUniforms(uniforms);
}

// Test cases

test('fp64', t => {
  // Initialize GL
  const gl = initializeGL();

  initializeTexTarget(gl);

  let testCount = 0;

  for (const testName in TEST_CASES) {

    const tc = TEST_CASES[testName];

    for (let idx0 = 0; idx0 < TEST_LOOP; idx0++) {
      t.comment('------------------------');
      t.comment(`Loop No. ${testCount++} - ${testName}`);

      // Note: Test case is a function that returns object with test data
      const testData = tc();

      const program = getProgram(gl, testName, testData.uniforms);
      program.use();
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      const cpuResult = testData.result;
      const gpuResult = getGPUOutput(gl);

      checkError(gpuResult, cpuResult);

      t.comment('------------------------');
    }
  }
  t.end();
});

