/* eslint-disable camelcase, no-console, no-undef */
import test from 'tape-promise/tape';
import {Device} from '@luma.gl/core';
import {webglDevice} from '@luma.gl/test-utils';
import {assembleShaders, glsl, PlatformInfo} from '@luma.gl/shadertools';
import {
  injectShader,
  combineInjects,
  DECLARATION_INJECT_MARKER
} from '@luma.gl/shadertools/lib/shader-assembly/shader-injections';

function getInfo(device: Device): PlatformInfo {
  return {
    type: device.info.type,
    gpu: device.info.gpu,
    shaderLanguage: device.info.shadingLanguage,
    shaderLanguageVersion: device.info.shadingLanguageVersion as 100 | 300,
    features: device.features
  };
}

const VS_GLSL_TEMPLATE = `\
#version 300 es

${DECLARATION_INJECT_MARKER}

in vec4 positions;
out vec4 vColor;

void f(out float a, in float b) {}

void main(void) {
  gl_Position = positions;
  vColor = vec4(1., 0., 0., 1.);
}
`;

const VS_GLSL_RESOLVED_DECL = 'uniform float uNewUniform';

const VS_GLSL_RESOLVED_MAIN = glsl`\
void main(void) {
  vNew = uNewUniform;
  gl_Position = positions;
  vColor = vec4(1., 0., 0., 1.);
  picking_setPickColor(color);
}
`;

const FS_GLSL_TEMPLATE = `\
#version 300 es

precision highp float;

${DECLARATION_INJECT_MARKER}

out vec4 fragmentColor;
in vec4 vColor;

void f(out float a, in float b) {}

void main(void) {
  fragmentColor = vColor;
}
`;

const FS_GLSL_RESOLVED_DECL = 'uniform bool uDiscard';

const FS_GLSL_RESOLVED_MAIN = glsl`\
void main(void) {
  if (uDiscard} { discard } else {
  fragmentColor = vColor;
  }
}
`;

const INJECT = {
  'vs:#decl': 'uniform float uNewUniform;\n',
  'vs:#main-start': 'vNew = uNewUniform;\n',
  'vs:#main-end': 'picking_setPickColor(color);\n',
  'fs:#decl': 'uniform bool uDiscard;\n',
  'fs:#main-start': '  if (uDiscard} { discard } else {\n',
  'fs:#main-end': '  }\n'
};

const INJECT1 = {
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

  injectResult = injectShader(VS_GLSL_TEMPLATE, 'vertex', injectionData(INJECT), true);
  t.ok(
    fuzzySubstring(injectResult, VS_GLSL_RESOLVED_DECL),
    'declarations correctly injected in vertex shader'
  );
  t.ok(
    fuzzySubstring(injectResult, VS_GLSL_RESOLVED_MAIN),
    'main correctly injected in vertex shader'
  );
  t.ok(/#endif\s*$/.test(injectResult), 'standard stubs injected');

  injectResult = injectShader(FS_GLSL_TEMPLATE, 'fragment', injectionData(INJECT), true);
  t.ok(
    fuzzySubstring(injectResult, FS_GLSL_RESOLVED_DECL),
    'declarations correctly injected in vertex shader'
  );
  t.ok(
    fuzzySubstring(injectResult, FS_GLSL_RESOLVED_MAIN),
    'main correctly injected in vertex shader'
  );
  t.ok(/#endif\s*$/.test(injectResult), 'standard stubs injected');

  t.end();
});

test('injectShader#assembleShaders', t => {
  const assembleResult = assembleShaders({
    platformInfo: getInfo(webglDevice),
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
  t.deepEqual(combineInjects([INJECT1, INJECT2]), COMBINED_INJECT, 'injects correctly combined');
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
