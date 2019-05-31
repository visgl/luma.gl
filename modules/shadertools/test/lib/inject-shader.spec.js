/* eslint-disable camelcase, no-console, no-undef */
import {createGLContext} from '@luma.gl/core';
import {assembleShaders} from '@luma.gl/shadertools';
import injectShader, {combineInjects} from '@luma.gl/shadertools/lib/inject-shader';
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

const VS_GLSL_RESOLVED_DECL = 'uniform float uNewUniform';

const VS_GLSL_RESOLVED_MAIN = `\
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

const FS_GLSL_RESOLVED_DECL = 'uniform bool uDiscard';

const FS_GLSL_RESOLVED_MAIN = `\
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

  injectResult = injectShader(VS_GLSL_TEMPLATE, 'vs', injectionData(INJECT));
  t.ok(
    fuzzySubstring(injectResult, VS_GLSL_RESOLVED_DECL),
    'declarations correctly injected in vertex shader'
  );
  t.ok(
    fuzzySubstring(injectResult, VS_GLSL_RESOLVED_MAIN),
    'main correctly injected in vertex shader'
  );

  injectResult = injectShader(FS_GLSL_TEMPLATE, 'fs', injectionData(INJECT));
  t.ok(
    fuzzySubstring(injectResult, FS_GLSL_RESOLVED_DECL),
    'declarations correctly injected in vertex shader'
  );
  t.ok(
    fuzzySubstring(injectResult, FS_GLSL_RESOLVED_MAIN),
    'main correctly injected in vertex shader'
  );

  t.end();
});

test('injectShader#assembleShaders', t => {
  const assembleResult = assembleShaders(fixture.gl, {
    vs: VS_GLSL_TEMPLATE,
    fs: FS_GLSL_TEMPLATE,
    inject: INJECT,
    prologue: false
  });
  t.ok(
    fuzzySubstring(assembleResult.vs, VS_GLSL_RESOLVED_DECL),
    'declarations correctly assembled in vertex shader'
  );
  t.ok(
    fuzzySubstring(assembleResult.vs, VS_GLSL_RESOLVED_MAIN),
    'main correctly assembled in vertex shader'
  );

  t.ok(
    fuzzySubstring(assembleResult.fs, FS_GLSL_RESOLVED_DECL),
    'declarations correctly assembled in vertex shader'
  );
  t.ok(
    fuzzySubstring(assembleResult.fs, FS_GLSL_RESOLVED_MAIN),
    'main correctly assembled in vertex shader'
  );

  t.end();
});

test('injectShader#combineInjects', t => {
  t.deepEqual(combineInjects([INJECT, INJECT2]), COMBINED_INJECT, 'injects correctly combined');
  t.end();
});

function injectionData(data) {
  const result = {};
  for (const key in data) {
    result[key] = [{injection: data[key], order: 0}];
  }
  return result;
}

function fuzzySubstring(string1, string2) {
  return string1.replace(/\s/g, '').indexOf(string2.replace(/\s/g, '')) > -1;
}
