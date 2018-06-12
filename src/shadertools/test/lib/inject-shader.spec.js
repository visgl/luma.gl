/* eslint-disable camelcase */
import injectShader from 'luma.gl/shadertools/src/lib/inject-shader';
import {assembleShaders, createGLContext} from 'luma.gl';
import test from 'tape-catch';

const fixture = {
  gl: createGLContext()
};

const VS_GLSL_TEMPLATE = `\
#version 300 es

in vec4 positions;
out vec4 vColor;

void f(out float a, in float b) {}

void main(void) {
  // VS_MAIN
  gl_Position = positions;
  vColor = vec4(1., 0., 0., 1.);
}
`;

const VS_GLSL_RESOLVED = `\
#version 300 es

attribute vec4 positions;
varying vec4 vColor;

void f(out float a, in float b) {}

void main(void) {
  gl_Position = positions;
  vColor = vec4(1., 0., 0., 1.);
}
`;

const FS_GLSL_TEMPLATE = `\
#version 300 es

precision highp float;

out vec4 fragmentColor;
in vec4 vColor;

void f(out float a, in float b) {}

void main(void) {
  fragmentColor = vColor;
}
`;

const FS_GLSL_RESOLVED = `\
#version 300 es

precision highp float;

out vec4 fragmentColor;
varying vec4 vColor;

void f(out float a, in float b) {}

void main(void) {
  fragmentColor = vColor;
}
`;

const INJECT = {
  'vs-decl': 'uniform float uNewUniform',
  'fs-decl': 'uniform bool uDiscard;'
  'fs-main-start': 'if (uDiscard} { discard } else {',
  'fs-main-end': '}'
};

test('injectShader#import', t => {
  t.ok(injectShader !== undefined, 'injectShader import successful');
  t.end();
});

test('injectShader#injectShader', t => {
  let injectResult;

  injectResult = injectShader(VS_GLSL_TEMPLATE, 'VERTEX_SHADER', INJECT);
  t.equal(injectResult, VS_GLSL_RESOLVED, 'correctly injected');

  injectResult = injectShader(FS_GLSL_TEMPLATE, 'FRAGMENT_SHADER', INJECT);
  t.equal(injectResult, FS_GLSL_RESOLVED, 'correctly injected');

  t.end();
});

test('injectShader#assembleShaders', t => {
  const assembleResult = assembleShaders(fixture.gl, {
    vs: VS_GLSL_TEMPLATE,
    fs: FS_GLSL_TEMPLATE,
    inject: INJECT
  });
  t.equal(assembleResult.vs, VS_GLSL_RESOLVED, 'correctly injected');
  t.equal(assembleResult.fs, FS_GLSL_RESOLVED, 'correctly injected');

  t.end();
});
