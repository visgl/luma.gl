import {webgl1Device, webgl2Device} from '@luma.gl/test-utils';
import {transpileGLSLShader} from '@luma.gl/shadertools/lib/shader-transpiler/transpile-glsl-shader';
import test from 'tape-promise/tape';

import {GL} from '@luma.gl/constants';
import {TRANSPILATION_TEST_CASES, COMPILATION_TEST_CASES} from './transpile-shader-cases';
import {minifyShader} from './minify-shader';

/* eslint-disable camelcase */

const fixture = {
  gl1: webgl1Device.gl,
  gl2: webgl2Device?.gl2
};

test('transpileGLSLShader#import', t => {
  t.ok(transpileGLSLShader, 'transpileGLSLShader import successful');
  t.end();
});

test('transpileGLSLShader', t => {
  let assembleResult;

  for (const tc of TRANSPILATION_TEST_CASES) {
    const {title, stage, GLSL_300, GLSL_100} = tc;

    t.throws(
      // @ts-ignore - deliberate unsupported GLSL version
      () => transpileGLSLShader(GLSL_300, 400, stage),
      `${title} unknown glsl version`
    );

    assembleResult = transpileGLSLShader(GLSL_300, 100, stage);
    t.equal(assembleResult, GLSL_100, `3.00 => 1.00: ${title}`);
  }
  t.end();
});

test('transpileGLSLShader#minifyShader interaction', t => {
  let assembleResult;

  for (const tc of TRANSPILATION_TEST_CASES) {
    const {title, stage, GLSL_300, GLSL_100} = tc;

    // minified shaders
    assembleResult = minifyShader(transpileGLSLShader(minifyShader(GLSL_300), 100, stage));
    t.equal(assembleResult, minifyShader(GLSL_100), `minified 3.00 => 1.00: ${title}`);
  }

  t.end();
});

test('transpileGLSLShader#compilation', t => {
  const {gl1, gl2} = fixture;

  for (const tc of COMPILATION_TEST_CASES) {
    const {title, VS_300_VALID, FS_300_VALID} = tc;

    const vs300_100 = transpileGLSLShader(VS_300_VALID, 100, 'vertex');
    const fs300_100 = transpileGLSLShader(FS_300_VALID, 100, 'fragment');

    const vs300_300 = transpileGLSLShader(VS_300_VALID, 300, 'vertex');
    const fs300_300 = transpileGLSLShader(FS_300_VALID, 300, 'fragment');

    // WebGL1 transpile to GLSL 100 and compile
    let {success, log, stage} = compileAndLink(gl1, vs300_100, fs300_100);
    t.ok(success, `Compile (WebGL 1): 3.00 => 1.00: ${title}`);
    if (!success) {
      t.comment(stage)
      t.comment(log);
    }

    // WebGL2 transpile to GLSL 300 and compile
    if (gl2) {
      ({success, log, stage} = compileAndLink(gl2, vs300_300, fs300_300));
      t.ok(success, `Compile (WebGL 2): 3.00 => 3.00: ${title}`);
      if (!success) {
        t.comment(stage);
        t.comment(log);
      }
    }
  }

  t.end();
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
