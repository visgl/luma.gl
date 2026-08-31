// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {type PlatformInfo, volumeRaymarch, WGSLShaderAssembler} from '@luma.gl/shadertools';

const WGSL_PLATFORM_INFO: PlatformInfo = {
  type: 'webgpu',
  gpu: 'test-gpu',
  shaderLanguage: 'wgsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

it('volumeRaymarch assembles collision-free WGSL helpers', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const shader = shaderAssembler.assembleWGSLShader({
    platformInfo: WGSL_PLATFORM_INFO,
    source: /* wgsl */ `
@fragment fn fragmentMain() -> @location(0) vec4f {
  let hit = volumeRaymarch_intersectBox(vec3f(0.0, 0.0, 2.0), vec3f(0.0, 0.0, -1.0), vec3f(-1.0), vec3f(1.0));
  return volumeRaymarch_composite(vec4f(0.0), vec3f(hit.y - hit.x), 0.5);
}`,
    modules: [volumeRaymarch]
  });

  expect(
    Boolean(shader.source.includes('fn volumeRaymarch_intersectBox')),
    'box helper assembled'
  ).toBe(true);
  expect(
    Boolean(shader.source.includes('fn volumeRaymarch_mixScalar')),
    'scalar helper assembled'
  ).toBe(true);
  expect(
    Boolean(shader.source.includes('fn volumeRaymarch_arrowDistance')),
    'arrow helper assembled'
  ).toBe(true);
  expect(
    shader.source.match(/fn volumeRaymarch_intersectBox/g)?.length,
    'helper is included exactly once'
  ).toBe(1);
  void 0;
});
