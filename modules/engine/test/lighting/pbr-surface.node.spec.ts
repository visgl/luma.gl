// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getNullTestDevice} from '@luma.gl/core/test-utils';
import {Geometry} from '@luma.gl/engine';
import {
  createPBRMaterial,
  createPBRSurfaceModel,
  PBR_MODEL_WGSL_SHADER
} from '@luma.gl/engine/lighting';
import {pbrMaterial, pbrScene, pbrSurface, skin, WGSLShaderAssembler} from '@luma.gl/shaders';

const platformInfo = {
  type: 'webgpu' as const,
  shaderLanguage: 'wgsl' as const,
  shaderLanguageVersion: 300,
  gpu: 'test',
  features: new Set<string>()
};

test('surface WGSL reflects camera normals with skin, instancing, masks and mapped normals', () => {
  for (const defines of [
    {},
    {
      HAS_NORMALS: true,
      HAS_TANGENTS: true,
      HAS_UV: true,
      HAS_UV_1: true,
      HAS_COLORS: true,
      HAS_RGBA_COLORS: true,
      HAS_SKIN: true,
      HAS_INSTANCING: true,
      HAS_BASECOLORMAP: true,
      HAS_NORMALMAP: true,
      HAS_BUMPMAP: true,
      ALPHA_CUTOFF: true,
      DOUBLE_SIDED: true
    }
  ]) {
    const shader = new WGSLShaderAssembler().assembleWGSLShader({
      platformInfo,
      source: PBR_MODEL_WGSL_SHADER,
      modules: [pbrScene, pbrMaterial, pbrSurface, skin],
      defines: {...defines, PBR_SURFACE_PASS: true}
    });
    expect(shader.shaderLayout?.attributes?.length).toBeGreaterThan(0);
    expect(shader.shaderLayout?.bindings?.some(binding => binding.name === 'pbrSurface')).toBe(
      true
    );
    expect(shader.source).not.toContain('sceneWorldMatrices');
    expect(shader.source).toContain('frontFacing: bool');
  }
});

test('surface models borrow materials and default to portable depth and normal targets', async () => {
  const device = await getNullTestDevice();
  const material = createPBRMaterial(device);
  const model = createPBRSurfaceModel(device, {
    geometry: new Geometry({attributes: {POSITION: {size: 3, value: new Float32Array(9)}}}),
    material
  });
  expect(model.props.colorAttachmentFormats).toEqual(['rgba8unorm']);
  expect(model.props.depthStencilAttachmentFormat).toBe('depth32float');
  expect(model.shaderInputs.getUniformValues().pbrSurface).toMatchObject({useMaterialNormals: 0});
  model.destroy();
  material.setProps({pbrMaterial: {alphaCutoff: 0.3}});
  expect(material.shaderInputs.getUniformValues().pbrMaterial.alphaCutoff).toBe(0.3);
  material.destroy();
});
