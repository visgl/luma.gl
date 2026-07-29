// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {toneMapping} from '@luma.gl/effects';
import {getShaderModuleUniforms, ShaderAssembler, type PlatformInfo} from '@luma.gl/shadertools';
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

test('toneMapping#defaults', testCase => {
  const defaultUniforms = getShaderModuleUniforms(toneMapping, {}, {});
  const overriddenUniforms = getShaderModuleUniforms(toneMapping, {exposure: 2.5}, {});

  testCase.equal(defaultUniforms.exposure, 1, 'exposure defaults to one');
  testCase.equal(overriddenUniforms.exposure, 2.5, 'exposure accepts caller configuration');
  testCase.deepEqual(toneMapping.passes, [{filter: true}], 'runs as one fullscreen filter pass');
  testCase.end();
});

test('toneMapping#cross-backend shader sources', testCase => {
  for (const shaderSource of [toneMapping.source, toneMapping.fs]) {
    testCase.ok(shaderSource.includes('2.51'), 'includes the ACES numerator coefficient');
    testCase.ok(shaderSource.includes('2.43'), 'includes the ACES denominator coefficient');
    testCase.ok(shaderSource.includes('toneMapping.exposure'), 'applies configurable exposure');
    testCase.ok(shaderSource.includes('color.a'), 'preserves input alpha');
  }
  testCase.end();
});

test('toneMapping#WGSL assembly', testCase => {
  const shaderAssembler = new ShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: WEBGPU_PLATFORM_INFO,
    source: FRAGMENT_SHADER_WGSL,
    modules: [toneMapping]
  });

  testCase.ok(
    assembledShader.source.includes('fn toneMapping_filterColor_ext('),
    'assembles the WGSL filter entrypoint'
  );
  testCase.ok(new WgslReflect(assembledShader.source), 'assembled WGSL parses successfully');
  testCase.end();
});

test('toneMapping#GLSL assembly', testCase => {
  const shaderAssembler = new ShaderAssembler();
  const assembledShaders = shaderAssembler.assembleGLSLShaderPair({
    platformInfo: WEBGL_PLATFORM_INFO,
    vs: VERTEX_SHADER_GLSL,
    fs: FRAGMENT_SHADER_GLSL,
    modules: [toneMapping]
  });

  testCase.ok(
    assembledShaders.fs.includes('vec4 toneMapping_filterColor_ext('),
    'assembles the GLSL filter entrypoint'
  );
  testCase.ok(
    assembledShaders.fs.includes('layout(std140) uniform toneMappingUniforms'),
    'assembles the portable exposure uniform block'
  );
  testCase.end();
});
