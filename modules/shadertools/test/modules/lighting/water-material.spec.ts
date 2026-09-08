// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
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

registerWaterMaterialTests(it);

it('shadertools#waterMaterial exposes typed defaults and stable uniform names', () => {
  const waterMaterialUniformTypecheck: Required<WaterMaterialUniforms> =
    waterMaterial.defaultUniforms;
  expect(Boolean(waterMaterialUniformTypecheck), 'waterMaterial default uniforms are typed').toBe(
    true
  );

  const uniforms = getShaderModuleUniforms(waterMaterial, {}, {});
  expect(Boolean(uniforms), 'default water uniforms resolve').toBe(true);
  expect(Object.keys(waterMaterial.uniformTypes), 'uniform type field order is stable').toEqual(
    EXPECTED_UNIFORM_NAMES
  );

  void 0;
});

it('shadertools#waterMaterial shader uniform blocks match uniformTypes order', () => {
  const fragmentValidationResult = getShaderModuleUniformLayoutValidationResult(
    waterMaterial,
    'fragment'
  );
  const wgslValidationResult = getShaderModuleUniformLayoutValidationResult(waterMaterial, 'wgsl');

  expect(Boolean(fragmentValidationResult?.matches), 'fragment validation result matches').toBe(
    true
  );
  expect(Boolean(wgslValidationResult?.matches), 'WGSL validation result matches').toBe(true);
  expect(
    getShaderModuleUniformBlockFields(waterMaterial, 'fragment'),
    'GLSL uniform block order matches uniformTypes'
  ).toEqual(EXPECTED_UNIFORM_NAMES);
  expect(
    getShaderModuleUniformBlockFields(waterMaterial, 'wgsl'),
    'WGSL uniform struct order matches uniformTypes'
  ).toEqual(EXPECTED_UNIFORM_NAMES);

  void 0;
});

it('shadertools#waterMaterial uniform layout is packable and keyed by the shader schema', () => {
  const shaderBlockLayout = makeShaderBlockLayout(waterMaterial.uniformTypes);

  expect(
    Boolean(shaderBlockLayout.byteLength > 0),
    'uniform buffer layout reports a packed size'
  ).toBe(true);
  expect(
    Object.keys(shaderBlockLayout.fields),
    'uniform buffer layout key order matches uniform definitions'
  ).toEqual(EXPECTED_UNIFORM_NAMES);
  expect(
    shaderBlockLayout.fields.mappingMode.size,
    'integer mapping mode is represented in the uniform layout'
  ).toBe(1);

  void 0;
});

it('shadertools#waterMaterial assembles with lighting helpers for GLSL and exposes WGSL source', () => {
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

  expect(
    Boolean(assembledShader.fs.includes('vec4 water_getColor(')),
    'assembled GLSL contains water shading helpers'
  ).toBe(true);
  expect(
    Boolean(assembledShader.fs.includes('lighting_getDirectionalLight(')),
    'assembled GLSL includes lighting dependency helpers'
  ).toBe(true);
  expect(
    Boolean(waterMaterial.source?.includes('fn water_getColor(')),
    'WGSL source exposes the water shading helper'
  ).toBe(true);

  void 0;
});

it('shadertools#waterMaterial forwards time changes deterministically', () => {
  const firstUniforms = getShaderModuleUniforms(waterMaterial, {time: 1.25}, {});
  const secondUniforms = getShaderModuleUniforms(waterMaterial, {time: 2.5}, {});

  expect(firstUniforms.time, 'first time sample is forwarded').toBe(1.25);
  expect(secondUniforms.time, 'second time sample is forwarded').toBe(2.5);
  expect(firstUniforms.time, 'time updates change the output uniforms').not.toBe(
    secondUniforms.time
  );
  expect(secondUniforms.waveADirection, 'time updates do not perturb unrelated defaults').toEqual(
    waterMaterial.defaultUniforms.waveADirection
  );

  void 0;
});
