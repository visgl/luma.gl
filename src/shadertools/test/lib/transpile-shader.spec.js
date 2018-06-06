/* eslint-disable camelcase */
import transpileShader from 'luma.gl/shadertools/src/lib/transpile-shader';
import test from 'tape-catch';

const VS_GLSL_300 = `\
#version 300 es

in vec4 positions;
out vec4 vColor;

void f(out float a, in float b) {}

void main(void) {
  gl_Position = positions;
  vColor = vec4(1., 0., 0., 1.);
}
`;

const VS_GLSL_100 = `\
#version 300 es

attribute vec4 positions;
varying vec4 vColor;

void f(out float a, in float b) {}

void main(void) {
  gl_Position = positions;
  vColor = vec4(1., 0., 0., 1.);
}
`;

const FS_GLSL_300 = `\
#version 300 es

precision highp float;

out vec4 fragmentColor;
in vec4 vColor;

void f(out float a, in float b) {}

void main(void) {
  fragmentColor = vColor;
}
`;

const FS_GLSL_100 = `\
#version 300 es

precision highp float;

out vec4 fragmentColor;
varying vec4 vColor;

void f(out float a, in float b) {}

void main(void) {
  fragmentColor = vColor;
}
`;

test('transpileShader#import', t => {
  t.ok(transpileShader !== undefined, 'transpileShader import successful');
  t.end();
});

test('transpileShader#versions', t => {
  let assembleResult;

  assembleResult = transpileShader(VS_GLSL_300, 100, true);
  t.equal(assembleResult, VS_GLSL_100, 'correctly transpiled');

  assembleResult = transpileShader(FS_GLSL_300, 100, false);
  t.equal(assembleResult, FS_GLSL_100, 'correctly transpiled');

  assembleResult = transpileShader(VS_GLSL_100, 300, true);
  t.equal(assembleResult, VS_GLSL_300, 'correctly transpiled');

  assembleResult = transpileShader(FS_GLSL_100, 300, false);
  t.equal(assembleResult, FS_GLSL_300, 'correctly transpiled');

  t.end();
});
