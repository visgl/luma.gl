// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  GLSLShaderAssembler,
  WGSLShaderAssembler,
  unlitMaterial,
  type PlatformInfo
} from '@luma.gl/shaders';
import {WgslReflect} from 'wgsl_reflect';

const platformInfo: PlatformInfo = {
  type: 'webgl',
  gpu: 'test',
  shaderLanguage: 'glsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

it('unlitMaterial assembles in both GLSL stages without lighting resources', () => {
  const shader = new GLSLShaderAssembler().assembleGLSLShaderPair({
    platformInfo,
    modules: [unlitMaterial],
    vs: `#version 300 es
      out vec4 surfaceColor;
      void main() {
        surfaceColor = unlitMaterial_getColor(vec4(0.2, 0.4, 0.8, 0.5));
        gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
      }`,
    fs: `#version 300 es
      precision highp float;
      in vec4 surfaceColor;
      out vec4 fragmentColor;
      void main() { fragmentColor = unlitMaterial_getColor(surfaceColor); }`
  });
  for (const source of [shader.vs, shader.fs]) {
    expect(source).toContain('vec4 unlitMaterial_getColor');
    expect(source).toContain('vec3 lighting_getLightColor');
    expect(source).not.toMatch(
      /uniform\s|lightingUniforms|phongMaterialUniforms|gouraudMaterialUniforms/
    );
  }
  expect(shader.getUniforms({})).toEqual({});
});

it('unlitMaterial WGSL has no bindings, uniforms, or lighting dependencies', () => {
  const shader = new WGSLShaderAssembler().assembleWGSLShader({
    platformInfo: {...platformInfo, type: 'webgpu', shaderLanguage: 'wgsl'},
    modules: [unlitMaterial],
    source: `@vertex fn vertexMain() -> @builtin(position) vec4<f32> {
      return unlitMaterial_getColor(vec4<f32>(0.0, 0.0, 0.0, 1.0));
    }
    @fragment fn fragmentMain() -> @location(0) vec4<f32> {
      return vec4<f32>(lighting_getLightColor2(vec3<f32>(0.2), vec3<f32>(0.0), vec3<f32>(0.0), vec3<f32>(0.0)), 0.5);
    }`
  });
  const reflection = new WgslReflect(shader.source);
  expect(reflection.uniforms).toEqual([]);
  expect(reflection.textures).toEqual([]);
  expect(reflection.samplers).toEqual([]);
  expect(reflection.storage).toEqual([]);
  expect(unlitMaterial.dependencies).toEqual([]);
  expect(shader.source).not.toContain('lightingUniforms');
});
