// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {toneMapping} from '@luma.gl/effects';
import {
  getShaderModuleUniforms,
  GLSLShaderAssembler,
  WGSLShaderAssembler,
  type PlatformInfo
} from '@luma.gl/shadertools';
import {WgslReflect} from 'wgsl_reflect';

const WEBGL_PLATFORM_INFO: PlatformInfo = {
  type: 'webgl',
  gpu: 'test',
  shaderLanguage: 'glsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

const WEBGPU_PLATFORM_INFO: PlatformInfo = {
  type: 'webgpu',
  gpu: 'test',
  shaderLanguage: 'wgsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

const VERTEX_SHADER_GLSL = /* glsl */ `\
#version 300 es
in vec4 positions;

void main() {
  gl_Position = positions;
}
`;

const FRAGMENT_SHADER_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
out vec4 fragmentColor;

void main() {
  fragmentColor = toneMapping_filterColor_ext(vec4(4.0, 2.0, 1.0, 0.5), vec2(1.0), vec2(0.5));
}
`;

const FRAGMENT_SHADER_WGSL = /* wgsl */ `\
@fragment
fn fragmentMain() -> @location(0) vec4f {
  return toneMapping_filterColor_ext(vec4f(4.0, 2.0, 1.0, 0.5), vec2f(1.0), vec2f(0.5));
}
`;

it('toneMapping#defaults', () => {
  const defaultUniforms = getShaderModuleUniforms(toneMapping, {}, {});
  const overriddenUniforms = getShaderModuleUniforms(
    toneMapping,
    {exposure: 2.5, maximumLuminance: 1.6},
    {}
  );

  expect(defaultUniforms.exposure, 'exposure defaults to one').toBe(1);
  expect(defaultUniforms.maximumLuminance, 'standard displays retain existing output').toBe(1);
  expect(overriddenUniforms.exposure, 'exposure accepts caller configuration').toBe(2.5);
  expect(
    overriddenUniforms.maximumLuminance,
    'extended displays can preserve highlights above SDR white'
  ).toBe(1.6);
  expect(toneMapping.passes, 'runs as one fullscreen filter pass').toEqual([{filter: true}]);
  void 0;
});

it('toneMapping#cross-backend shader sources', () => {
  for (const shaderSource of [toneMapping.source, toneMapping.fs]) {
    expect(Boolean(shaderSource.includes('2.51')), 'includes the ACES numerator coefficient').toBe(
      true
    );
    expect(
      Boolean(shaderSource.includes('2.43')),
      'includes the ACES denominator coefficient'
    ).toBe(true);
    expect(
      Boolean(shaderSource.includes('toneMapping.exposure')),
      'applies configurable exposure'
    ).toBe(true);
    expect(
      Boolean(shaderSource.includes('toneMapping.maximumLuminance')),
      'preserves optional extended-range highlight output'
    ).toBe(true);
    expect(Boolean(shaderSource.includes('color.a')), 'preserves input alpha').toBe(true);
  }
  void 0;
});

it('toneMapping#WGSL assembly', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: WEBGPU_PLATFORM_INFO,
    source: FRAGMENT_SHADER_WGSL,
    modules: [toneMapping]
  });

  expect(
    Boolean(assembledShader.source.includes('fn toneMapping_filterColor_ext(')),
    'assembles the WGSL filter entrypoint'
  ).toBe(true);
  expect(
    Boolean(new WgslReflect(assembledShader.source)),
    'assembled WGSL parses successfully'
  ).toBe(true);
  void 0;
});

it('toneMapping#GLSL assembly', () => {
  const shaderAssembler = new GLSLShaderAssembler();
  const assembledShaders = shaderAssembler.assembleGLSLShaderPair({
    platformInfo: WEBGL_PLATFORM_INFO,
    vs: VERTEX_SHADER_GLSL,
    fs: FRAGMENT_SHADER_GLSL,
    modules: [toneMapping]
  });

  expect(
    Boolean(assembledShaders.fs.includes('vec4 toneMapping_filterColor_ext(')),
    'assembles the GLSL filter entrypoint'
  ).toBe(true);
  expect(
    Boolean(assembledShaders.fs.includes('layout(std140) uniform toneMappingUniforms')),
    'assembles the portable exposure uniform block'
  ).toBe(true);
  void 0;
});
