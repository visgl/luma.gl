// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {type PlatformInfo, volumeRaymarch, WGSLShaderAssembler} from '@luma.gl/shadertools';

const WGSL_PLATFORM_INFO: PlatformInfo = {
  type: 'webgpu',
  gpu: 'test-gpu',
  shaderLanguage: 'wgsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

test('volumeRaymarch assembles collision-free WGSL helpers', testContext => {
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

  testContext.ok(shader.source.includes('fn volumeRaymarch_intersectBox'), 'box helper assembled');
  testContext.ok(shader.source.includes('fn volumeRaymarch_mixScalar'), 'scalar helper assembled');
  testContext.ok(
    shader.source.includes('fn volumeRaymarch_arrowDistance'),
    'arrow helper assembled'
  );
  testContext.equal(
    shader.source.match(/fn volumeRaymarch_intersectBox/g)?.length,
    1,
    'helper is included exactly once'
  );
  testContext.end();
});
