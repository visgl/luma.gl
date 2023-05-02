import {webgl1Device, webgl2Device} from '@luma.gl/test-utils';
import transpileShader from '@luma.gl/shadertools/lib/transpiler/transpile-shader';
import test from 'tape-promise/tape';

import {TRANSPILATION_TEST_CASES, COMPILATION_TEST_CASES} from './transpile-shader-cases';
import {minifyShader} from './minify-shader';

/* eslint-disable camelcase */

const VERTEX = true;
const FRAGMENT = false;

const fixture = {
  gl1: webgl1Device.gl,
  gl2: webgl2Device?.gl2
};

test('transpileShader#import', (t) => {
  t.ok(transpileShader, 'transpileShader import successful');
  t.end();
});

test('transpileShader', (t) => {
  let assembleResult;

  for (const tc of TRANSPILATION_TEST_CASES) {
    const {title, isVertex, GLSL_300, GLSL_100, GLSL_300_TRANSPILED} = tc;

    t.throws(
      () => transpileShader(GLSL_300, 400, isVertex),
      /version/,
      `${title} unknown glsl version`
    );

    assembleResult = transpileShader(GLSL_300, 100, isVertex);
    t.equal(assembleResult, GLSL_100, `3.00 => 1.00: ${title}`);

    assembleResult = transpileShader(GLSL_300, 300, isVertex);
    t.equal(assembleResult, GLSL_300_TRANSPILED, `3.00 => 3.00: ${title}`);

    assembleResult = transpileShader(GLSL_100, 100, isVertex);
    t.equal(assembleResult, GLSL_100, `1.00 => 1.00: ${title}`);

    assembleResult = transpileShader(GLSL_100, 300, isVertex);
    t.equal(assembleResult, GLSL_300_TRANSPILED, `1.00 => 3.00: ${title}`);

    // minified shaders
    assembleResult = minifyShader(transpileShader(minifyShader(GLSL_300), 100, isVertex));
    t.equal(assembleResult, minifyShader(GLSL_100), `minified 3.00 => 1.00: ${title}`);

    assembleResult = minifyShader(transpileShader(minifyShader(GLSL_300), 300, isVertex));
    t.equal(assembleResult, minifyShader(GLSL_300_TRANSPILED), `minified 3.00 => 3.00: ${title}`);

    assembleResult = minifyShader(transpileShader(minifyShader(GLSL_100), 100, isVertex));
    t.equal(assembleResult, minifyShader(GLSL_100), `minified 1.00 => 1.00: ${title}`);

    assembleResult = minifyShader(transpileShader(minifyShader(GLSL_100), 300, isVertex));
    t.equal(assembleResult, minifyShader(GLSL_300_TRANSPILED), `minified 1.00 => 3.00: ${title}`);
  }

  t.end();
});

test('transpileShader#compilation', (t) => {
  const {gl1, gl2} = fixture;

  for (const tc of COMPILATION_TEST_CASES) {
    const {title, VS_300_VALID, FS_300_VALID} = tc;

    const vs300_100 = transpileShader(VS_300_VALID, 100, VERTEX);
    const fs300_100 = transpileShader(FS_300_VALID, 100, FRAGMENT);

    const vs300_300 = transpileShader(VS_300_VALID, 300, VERTEX);
    const fs300_300 = transpileShader(FS_300_VALID, 300, FRAGMENT);

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
