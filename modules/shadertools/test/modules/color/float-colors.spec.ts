// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  assembleGLSLShaderPair,
  floatColors,
  getShaderModuleUniforms,
  normalizeByteColor3,
  normalizeByteColor4,
  type PlatformInfo
} from '@luma.gl/shadertools';

const GLSL_PLATFORM_INFO: PlatformInfo = {
  type: 'webgl',
  gpu: 'test-gpu',
  shaderLanguage: 'glsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

test('floatColors#defaultUniforms', t => {
  t.deepEqual(floatColors.defaultUniforms, {useByteColors: true}, 'default floatColors uniforms');
  t.deepEqual(getShaderModuleUniforms(floatColors, {}, {}), {}, 'empty props return no overrides');
  t.end();
});

test('floatColors#cpuNormalizationHelpers', t => {
  t.deepEqual(
    normalizeByteColor3([255, 128, 64], true),
    [1, 128 / 255, 64 / 255],
    'byte colors normalize to floats'
  );
  t.deepEqual(
    normalizeByteColor3([4, 2, 1], false),
    [4, 2, 1],
    'float and HDR colors pass through'
  );
  t.deepEqual(
    normalizeByteColor4([255, 128, 64, 255], true),
    [1, 128 / 255, 64 / 255, 1],
    'byte rgba normalizes'
  );
  t.deepEqual(
    normalizeByteColor4([1, 0.5, 0.25], false),
    [1, 0.5, 0.25, 1],
    'float rgb adds opaque alpha'
  );
  t.end();
});

test('floatColors#assembledGLSLContract', t => {
  const assembledShader = assembleGLSLShaderPair({
    platformInfo: GLSL_PLATFORM_INFO,
    vs: `\
#version 300 es
in vec4 positions;
void main(void) {
  gl_Position = positions;
}
`,
    fs: `\
#version 300 es
precision highp float;
out vec4 fragmentColor;
void main(void) {
  fragmentColor = floatColors_premultiplyAlpha(floatColors_normalize(vec4(255.0, 0.0, 0.0, 255.0)));
}
`,
    modules: [floatColors]
  });

  t.ok(
    assembledShader.vs.includes('floatColorsUniforms'),
    'floatColors uniforms assembled into vertex shader'
  );
  t.ok(
    assembledShader.fs.includes('vec4 floatColors_premultiplyAlpha'),
    'floatColors helpers assembled into fragment shader'
  );
  t.end();
});
