import {webgl1Device, webgl2Device} from '@luma.gl/test-utils';
import {transpileGLSLShader} from '@luma.gl/shadertools/lib/shader-transpiler/transpile-glsl-shader';
import test from 'tape-promise/tape';

import {TRANSPILATION_TEST_CASES, COMPILATION_TEST_CASES} from './transpile-shader-cases';
import {minifyShader} from './minify-shader';

/* eslint-disable camelcase */

const fixture = {
  gl1: webgl1Device.gl,
  gl2: webgl2Device?.gl2
};

test('transpileGLSLShader#import', (t) => {
  t.ok(transpileGLSLShader, 'transpileGLSLShader import successful');
  t.end();
});

test('transpileGLSLShader', (t) => {
  let assembleResult;

  for (const tc of TRANSPILATION_TEST_CASES) {
    const {title, stage, GLSL_300, GLSL_100, GLSL_300_TRANSPILED} = tc;

    t.throws(
      () => transpileGLSLShader(GLSL_300, 400, stage),
      /version/,
      `${title} unknown glsl version`
    );

    assembleResult = transpileGLSLShader(GLSL_300, 100, stage);
    t.equal(assembleResult, GLSL_100, `3.00 => 1.00: ${title}`);

    assembleResult = transpileGLSLShader(GLSL_300, 300, stage);
    t.equal(assembleResult, GLSL_300_TRANSPILED, `3.00 => 3.00: ${title}`);

    assembleResult = transpileGLSLShader(GLSL_100, 100, stage);
    t.equal(assembleResult, GLSL_100, `1.00 => 1.00: ${title}`);

    assembleResult = transpileGLSLShader(GLSL_100, 300, stage);
    t.equal(assembleResult, GLSL_300_TRANSPILED, `1.00 => 3.00: ${title}`);

    // minified shaders
    assembleResult = minifyShader(transpileGLSLShader(minifyShader(GLSL_300), 100, stage));
    t.equal(assembleResult, minifyShader(GLSL_100), `minified 3.00 => 1.00: ${title}`);

    assembleResult = minifyShader(transpileGLSLShader(minifyShader(GLSL_300), 300, stage));
    t.equal(assembleResult, minifyShader(GLSL_300_TRANSPILED), `minified 3.00 => 3.00: ${title}`);

    assembleResult = minifyShader(transpileGLSLShader(minifyShader(GLSL_100), 100, stage));
    t.equal(assembleResult, minifyShader(GLSL_100), `minified 1.00 => 1.00: ${title}`);

    assembleResult = minifyShader(transpileGLSLShader(minifyShader(GLSL_100), 300, stage));
    t.equal(assembleResult, minifyShader(GLSL_300_TRANSPILED), `minified 1.00 => 3.00: ${title}`);
  }

  t.end();
});

test('transpileGLSLShader#compilation', (t) => {
  const {gl1, gl2} = fixture;

  for (const tc of COMPILATION_TEST_CASES) {
    const {title, VS_300_VALID, FS_300_VALID} = tc;

    const vs300_100 = transpileGLSLShader(VS_300_VALID, 100, 'vertex');
    const fs300_100 = transpileGLSLShader(FS_300_VALID, 100, 'fragment');

    const vs300_300 = transpileGLSLShader(VS_300_VALID, 300, 'vertex');
    const fs300_300 = transpileGLSLShader(FS_300_VALID, 300, 'fragment');

    // WebGL1 transpile to GLSL 100 and compile
    let status = compileAndLink(gl1, vs300_100, fs300_100);
    t.ok(status, `Compile: 3.00 => 1.00: ${title}`);

    // WebGL2 transpile to GLSL 300 and compile
    if (gl2) {
      status = compileAndLink(gl2, vs300_300, fs300_300);
      t.ok(status, `Compile: 3.00 => 3.00: ${title}`);
    }
  }

  t.end();
});

// HELPER FUNCTIONS

function compileAndLink(gl, vertexSource, fragmentSource) {
  const vShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vShader, vertexSource);
  gl.compileShader(vShader);

  const fShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fShader, fragmentSource);
  gl.compileShader(fShader);

  const program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);

  gl.linkProgram(program);

  const status = Boolean(gl.getProgramParameter(program, gl.LINK_STATUS));

  gl.deleteShader(vShader);
  gl.deleteShader(fShader);
  gl.deleteProgram(program);

  return status;
}
