// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getNullTestDevice} from '@luma.gl/core/test-utils';
import {Geometry} from '@luma.gl/engine';
import {
  createPBRMaterial,
  createPBRModel,
  getPBRGeometryDefines,
  PBR_MODEL_WGSL_SHADER
} from '@luma.gl/engine/lighting';
import {pbrMaterial, pbrScene, skin, WGSLShaderAssembler} from '@luma.gl/shaders';

const platformInfo = {
  type: 'webgpu' as const,
  shaderLanguage: 'wgsl' as const,
  shaderLanguageVersion: 300,
  gpu: 'test',
  features: new Set<string>()
};

test('standalone WGSL compiles skin, instancing and material features without scene bindings', () => {
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
      HAS_INSTANCING: true
    }
  ]) {
    const shader = new WGSLShaderAssembler().assembleWGSLShader({
      platformInfo,
      source: PBR_MODEL_WGSL_SHADER,
      modules: [pbrMaterial, pbrScene, skin],
      defines
    });
    expect(shader.shaderLayout?.attributes?.length).toBeGreaterThan(0);
    expect(shader.source).not.toMatch(
      /sceneWorldMatrices|instanceMetadata|instanceIdentifier|shadow_get/
    );
  }
});

test('standalone factory preserves semantic geometry, borrows materials and defaults to linear output', async () => {
  const device = await getNullTestDevice();
  const geometry = new Geometry({
    attributes: {POSITION: {size: 3, value: new Float32Array([-1, -1, 0, 1, -1, 0, 0, 1, 0])}}
  });
  const material = createPBRMaterial(device);
  const model = createPBRModel(device, {geometry, material});
  expect(Object.keys(geometry.attributes)).toEqual(['POSITION']);
  expect(model.material).toBe(material);
  expect(model.shaderInputs.getUniformValues().pbrScene).toMatchObject({
    toneMapMode: 0,
    outputEncoding: 0
  });
  expect(getPBRGeometryDefines(geometry).HAS_NORMALS).toBe(false);
  model.destroy();
  material.setProps({pbrMaterial: {metallicRoughnessValues: [0.5, 0.3]}});
  expect(material.shaderInputs.getUniformValues().pbrMaterial.metallicRoughnessValues).toEqual([
    0.5, 0.3
  ]);
  material.destroy();
});
