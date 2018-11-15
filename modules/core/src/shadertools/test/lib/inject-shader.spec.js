/* eslint-disable camelcase */
import injectShader, {combineInjects} from 'luma.gl/shadertools/src/lib/inject-shader';
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
  gl_Position = positions;
  vColor = vec4(1., 0., 0., 1.);
}
`;

const VS_GLSL_RESOLVED = `\
#version 300 es

in vec4 positions;
out vec4 vColor;

void f(out float a, in float b) {}

uniform float uNewUniform;

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
in vec4 vColor;

void f(out float a, in float b) {}

uniform bool uDiscard;

void main(void) {
  if (uDiscard} { discard } else {
  fragmentColor = vColor;
  }
}
`;

const INJECT = {
  'vs:#decl': 'uniform float uNewUniform;\n',
  'fs:#decl': 'uniform bool uDiscard;\n',
  'fs:#main-start': '  if (uDiscard} { discard } else {\n',
  'fs:#main-end': '  }\n'
};

const INJECT2 = {
  'vs:#decl': 'uniform float uNewUniform2;\n',
  'fs:#main-start': '  uNewUniform2 = uNewUniform + 1.;\n',
  'vs:#main-start': ' uNewUniform = uNewUniform2;\n'
};

const COMBINED_INJECT = {
  'vs:#decl': 'uniform float uNewUniform;\n\nuniform float uNewUniform2;\n',
  'fs:#decl': 'uniform bool uDiscard;\n',
  'fs:#main-start': '  if (uDiscard} { discard } else {\n\n  uNewUniform2 = uNewUniform + 1.;\n',
  'fs:#main-end': '  }\n',
  'vs:#main-start': ' uNewUniform = uNewUniform2;\n'
};

test('injectShader#import', t => {
  t.ok(injectShader !== undefined, 'injectShader import successful');
  t.end();
});

test('injectShader#injectShader', t => {
  let injectResult;

  injectResult = injectShader(VS_GLSL_TEMPLATE, 'vs', INJECT);
  t.equal(injectResult, VS_GLSL_RESOLVED, 'correctly injected');

  injectResult = injectShader(FS_GLSL_TEMPLATE, 'fs', INJECT);
  t.equal(injectResult, FS_GLSL_RESOLVED, 'correctly injected');

  t.end();
});

test('injectShader#assembleShaders', t => {
  const assembleResult = assembleShaders(fixture.gl, {
    vs: VS_GLSL_TEMPLATE,
    fs: FS_GLSL_TEMPLATE,
    inject: INJECT,
    prologue: false
  });
  t.equal(assembleResult.vs, VS_GLSL_RESOLVED, 'correctly injected');
  t.equal(assembleResult.fs, FS_GLSL_RESOLVED, 'correctly injected');

  t.end();
});

test('injectShader#combineInjects', t => {
  t.deepEqual(combineInjects([INJECT, INJECT2]), COMBINED_INJECT, 'injects correctly combined');
  t.end();
});
