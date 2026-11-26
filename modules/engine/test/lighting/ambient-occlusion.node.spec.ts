// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  pbrAmbientOcclusion,
  pbrMaterial,
  pbrScene,
  pbrShadow,
  pbrContactShadow,
  WGSLShaderAssembler
} from '@luma.gl/shaders';
import {PBR_MODEL_WGSL_SHADER} from '@luma.gl/engine/lighting';

test('ambient visibility composes with contact and mapped shadows in one PBR shader', () => {
  const shader = new WGSLShaderAssembler().assembleWGSLShader({
    platformInfo: {
      type: 'webgpu',
      shaderLanguage: 'wgsl',
      shaderLanguageVersion: 300,
      gpu: 'test',
      features: new Set<string>()
    },
    source: PBR_MODEL_WGSL_SHADER,
    modules: [pbrScene, pbrMaterial, pbrShadow, pbrContactShadow, pbrAmbientOcclusion],
    defines: {
      HAS_NORMALS: true,
      USE_LIGHTS: true,
      PBR_RECEIVE_SHADOWS: true,
      PBR_RECEIVE_CONTACT_SHADOWS: true,
      PBR_RECEIVE_AMBIENT_OCCLUSION: true
    }
  });
  expect(
    shader.shaderLayout?.bindings?.some(binding => binding.name === 'ambientOcclusionTexture')
  ).toBe(true);
  expect(pbrAmbientOcclusion.getUniforms?.({enabled: false, strength: 0.5})).toEqual({
    enabled: 0,
    strength: 0.5
  });
});
