// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {WGSLShaderAssembler, pbrMaterial, pbrScene, pbrShadow, skin} from '@luma.gl/shaders';
import {
  PBR_MODEL_WGSL_SHADER,
  createPBRMaterial,
  createPBRShadowModel
} from '@luma.gl/engine/lighting';
import {Geometry} from '@luma.gl/engine';
import {getNullTestDevice} from '@luma.gl/core/test-utils';

const platformInfo = {
  type: 'webgpu' as const,
  shaderLanguage: 'wgsl' as const,
  shaderLanguageVersion: 300,
  gpu: 'test',
  features: new Set<string>()
};

test('PBR shadow caster and receiver entry points reflect with skin, instancing and alpha maps', () => {
  for (const caster of [true, false]) {
    const shader = new WGSLShaderAssembler().assembleWGSLShader({
      platformInfo,
      source: PBR_MODEL_WGSL_SHADER,
      modules: [pbrMaterial, pbrScene, skin, ...(caster ? [] : [pbrShadow])],
      defines: {
        PBR_SHADOW_PASS: caster,
        PBR_RECEIVE_SHADOWS: !caster,
        HAS_NORMALS: true,
        HAS_TANGENTS: true,
        HAS_UV: true,
        HAS_UV_1: true,
        HAS_COLORS: true,
        HAS_RGBA_COLORS: true,
        HAS_SKIN: true,
        HAS_INSTANCING: true,
        HAS_BASECOLORMAP: true,
        ALPHA_CUTOFF: true,
        USE_LIGHTS: true
      }
    });
    expect(shader.shaderLayout?.attributes?.length).toBeGreaterThan(5);
    expect(shader.source).not.toContain('sceneWorldMatrices');
    expect(shader.source).toContain('pbr_discardMaskedFragment');
    if (!caster)
      expect(shader.shaderLayout?.bindings?.some(binding => binding.name === 'pbrShadow')).toBe(
        true
      );
  }
});

test('PBR shadow models borrow materials and default to depth-only pipelines', async () => {
  const device = await getNullTestDevice();
  const material = createPBRMaterial(device);
  const model = createPBRShadowModel(device, {
    material,
    geometry: new Geometry({attributes: {POSITION: {size: 3, value: new Float32Array(9)}}})
  });
  expect(model.props.colorAttachmentFormats).toEqual([]);
  expect(model.props.depthStencilAttachmentFormat).toBe('depth32float');
  model.destroy();
  material.setProps({pbrMaterial: {alphaCutoff: 0.3}});
  expect(material.shaderInputs.getUniformValues().pbrMaterial.alphaCutoff).toBe(0.3);
  material.destroy();
});
