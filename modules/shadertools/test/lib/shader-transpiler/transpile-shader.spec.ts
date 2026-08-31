// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {transpileGLSLShader} from '@luma.gl/shadertools/lib/shader-transpiler/transpile-glsl-shader';
import {expect, it} from 'vitest';

import {GL} from '@luma.gl/webgl/constants';
import {TRANSPILATION_TEST_CASES, COMPILATION_TEST_CASES} from './transpile-shader-cases';
import {minifyShader} from './minify-shader';

/** Compare shader strings - TODO move to test/utils */
function compareStrings(string1: string, string2: string, message?: string): void {
  const lines1 = string1.split('\n');
  const lines2 = string2.split('\n');

  for (let i = 0; i < lines1.length; i++) {
    if (lines1[i] !== lines2[i]) {
      void 0;
      return;
    }
  }

  expect(string1, message).toBe(string2);
}

it('transpileGLSLShader#import', async () => {
  expect(Boolean(transpileGLSLShader), 'transpileGLSLShader import successful').toBe(true);
  void 0;
});

it('transpileGLSLShader', async () => {
  for (const tc of TRANSPILATION_TEST_CASES) {
    const {title, stage, GLSL_300} = tc;

    expect(
      transpileGLSLShader(GLSL_300, stage).startsWith('#version 300 es'),
      `${title} preserves version`
    ).toBe(true);
  }
  void 0;
});

it('transpileGLSLShader#minified shaders', async () => {
  let assembleResult;

  for (const tc of TRANSPILATION_TEST_CASES) {
    const {title, stage, GLSL_300, GLSL_300_TRANSPILED} = tc;

    // minified shaders
    assembleResult = minifyShader(transpileGLSLShader(minifyShader(GLSL_300), stage));
    compareStrings(
      assembleResult,
      minifyShader(GLSL_300_TRANSPILED),
      `minified 3.00 => 3.00: ${title}`
    );
  }

  void 0;
});

it('transpileGLSLShader#compilation', async () => {
  const webglDevice = await getWebGLTestDevice();

  for (const tc of COMPILATION_TEST_CASES) {
    const {title, VS_300_VALID, FS_300_VALID} = tc;

    const vs300_300 = transpileGLSLShader(VS_300_VALID, 'vertex');
    const fs300_300 = transpileGLSLShader(FS_300_VALID, 'fragment');

    // WebGL2 transpile to GLSL 300 and compile
    const {success} = compileAndLink(webglDevice.gl, vs300_300, fs300_300);
    expect(Boolean(success), `Compile (WebGL 2): 3.00 => 3.00: ${title}`).toBe(true);
    if (!success) {
      void 0;
      void 0;
    }
  }

  void 0;
});

// HELPER FUNCTIONS

function compileAndLink(
  gl,
  vertexSource,
  fragmentSource
): {success: boolean; log: string; stage: string} {
  let compileStatus;
  let log: string = '';
  let stage: string = '';

  const vShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vShader, vertexSource);
  gl.compileShader(vShader);

  compileStatus = gl.getShaderParameter(vShader, GL.COMPILE_STATUS);
  if (!compileStatus) {
    stage = 'vertex';
    log = gl.getShaderInfoLog(vShader);
  }

  const fShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fShader, fragmentSource);
  gl.compileShader(fShader);

  compileStatus = gl.getShaderParameter(fShader, GL.COMPILE_STATUS);
  if (!compileStatus) {
    stage = 'fragment';
    log = gl.getShaderInfoLog(fShader);
  }
  const program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);

  gl.linkProgram(program);

  const success = Boolean(gl.getProgramParameter(program, gl.LINK_STATUS));

  gl.deleteShader(vShader);
  gl.deleteShader(fShader);
  gl.deleteProgram(program);

  return {success, log, stage};
}
