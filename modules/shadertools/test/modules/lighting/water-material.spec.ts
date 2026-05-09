// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {makeShaderBlockLayout} from '@luma.gl/core';
import {
  assembleGLSLShaderPair,
  getShaderModuleUniformBlockFields,
  getShaderModuleUniformLayoutValidationResult,
  getShaderModuleUniforms,
  type PlatformInfo,
  waterMaterial,
  type WaterMaterialUniforms
} from '@luma.gl/shadertools';
import {registerWaterMaterialTests} from './water-material.spec.shared';

const EXPECTED_UNIFORM_NAMES = [
  'time',
  'baseColor',
  'opacity',
  'fresnelColor',
  'fresnelPower',
  'specularIntensity',
  'normalStrength',
  'mappingMode',
  'coordinateScale',
  'coordinateOffset',
  'waveADirection',
  'waveASpeed',
  'waveAFrequency',
  'waveAAmplitude',
  'waveBDirection',
  'waveBSpeed',
  'waveBFrequency',
  'waveBAmplitude'
] as const;

const GLSL_PLATFORM_INFO: PlatformInfo = {
  type: 'webgl',
  shaderLanguage: 'glsl',
  shaderLanguageVersion: 300,
  gpu: 'test',
  features: new Set()
};

registerWaterMaterialTests(test);

test('shadertools#waterMaterial exposes typed defaults and stable uniform names', testCase => {
  const waterMaterialUniformTypecheck: Required<WaterMaterialUniforms> =
    waterMaterial.defaultUniforms;
  testCase.ok(waterMaterialUniformTypecheck, 'waterMaterial default uniforms are typed');

  const uniforms = getShaderModuleUniforms(waterMaterial, {}, {});
  testCase.ok(uniforms, 'default water uniforms resolve');
  testCase.deepEqual(
    Object.keys(waterMaterial.uniformTypes),
    EXPECTED_UNIFORM_NAMES,
    'uniform type field order is stable'
  );

  testCase.end();
});

test('shadertools#waterMaterial shader uniform blocks match uniformTypes order', testCase => {
  const fragmentValidationResult = getShaderModuleUniformLayoutValidationResult(
    waterMaterial,
    'fragment'
  );
  const wgslValidationResult = getShaderModuleUniformLayoutValidationResult(waterMaterial, 'wgsl');

  testCase.ok(fragmentValidationResult?.matches, 'fragment validation result matches');
  testCase.ok(wgslValidationResult?.matches, 'WGSL validation result matches');
  testCase.deepEqual(
    getShaderModuleUniformBlockFields(waterMaterial, 'fragment'),
    EXPECTED_UNIFORM_NAMES,
    'GLSL uniform block order matches uniformTypes'
  );
  testCase.deepEqual(
    getShaderModuleUniformBlockFields(waterMaterial, 'wgsl'),
    EXPECTED_UNIFORM_NAMES,
    'WGSL uniform struct order matches uniformTypes'
  );

  testCase.end();
});

test('shadertools#waterMaterial uniform layout is packable and keyed by the shader schema', testCase => {
  const shaderBlockLayout = makeShaderBlockLayout(waterMaterial.uniformTypes);

  testCase.ok(shaderBlockLayout.byteLength > 0, 'uniform buffer layout reports a packed size');
  testCase.deepEqual(
    Object.keys(shaderBlockLayout.fields),
    EXPECTED_UNIFORM_NAMES,
    'uniform buffer layout key order matches uniform definitions'
  );
  testCase.equal(
    shaderBlockLayout.fields.mappingMode.size,
    1,
    'integer mapping mode is represented in the uniform layout'
  );

  testCase.end();
});

test('shadertools#waterMaterial assembles with lighting helpers for GLSL and exposes WGSL source', testCase => {
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
  fragmentColor = water_getColor(vec3(0.0, 0.0, 1.0), vec3(0.0), vec3(0.0, 0.0, 1.0), vec2(0.5));
}
`,
    modules: [waterMaterial]
  });

  testCase.ok(
    assembledShader.fs.includes('vec4 water_getColor('),
    'assembled GLSL contains water shading helpers'
  );
  testCase.ok(
    assembledShader.fs.includes('lighting_getDirectionalLight('),
    'assembled GLSL includes lighting dependency helpers'
  );
  testCase.ok(
    waterMaterial.source?.includes('fn water_getColor('),
    'WGSL source exposes the water shading helper'
  );

  testCase.end();
});

test('shadertools#waterMaterial forwards time changes deterministically', testCase => {
  const firstUniforms = getShaderModuleUniforms(waterMaterial, {time: 1.25}, {});
  const secondUniforms = getShaderModuleUniforms(waterMaterial, {time: 2.5}, {});

  testCase.equal(firstUniforms.time, 1.25, 'first time sample is forwarded');
  testCase.equal(secondUniforms.time, 2.5, 'second time sample is forwarded');
  testCase.notEqual(
    firstUniforms.time,
    secondUniforms.time,
    'time updates change the output uniforms'
  );
  testCase.deepEqual(
    secondUniforms.waveADirection,
    waterMaterial.defaultUniforms.waveADirection,
    'time updates do not perturb unrelated defaults'
  );

  testCase.end();
});
