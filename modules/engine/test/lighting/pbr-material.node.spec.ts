// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getNullTestDevice} from '@luma.gl/core/test-utils';
import {DynamicTexture} from '@luma.gl/core/dynamic';
import {
  createPBRMaterial,
  createPBRMaterialFactory,
  getPBRMaterialMapUniforms
} from '@luma.gl/engine/lighting';

test('PBR materials share a factory, keep independent uniforms and borrow textures', async () => {
  const device = await getNullTestDevice();
  const texture = device.createTexture({width: 1, height: 1});
  const factory = createPBRMaterialFactory(device);
  const first = createPBRMaterial(device, {
    factory,
    uniforms: {baseColorFactor: [1, 0, 0, 1]},
    bindings: {pbr_baseColorSampler: texture, pbr_specularEnvSampler: texture}
  });
  const second = createPBRMaterial(device, {factory, uniforms: {baseColorFactor: [0, 1, 0, 1]}});
  expect(first.factory).toBe(second.factory);
  expect(first.getResourceBindings()).toEqual({pbr_baseColorSampler: texture});
  expect(first.shaderInputs.getUniformValues().pbrMaterial).toMatchObject({
    baseColorMapEnabled: true,
    baseColorFactor: [1, 0, 0, 1]
  });
  expect(second.shaderInputs.getUniformValues().pbrMaterial).toMatchObject({
    baseColorMapEnabled: false,
    baseColorFactor: [0, 1, 0, 1]
  });
  first.destroy();
  second.setProps({pbrMaterial: {metallicRoughnessValues: [0.8, 0.2]}});
  expect(second.shaderInputs.getUniformValues().pbrMaterial.metallicRoughnessValues).toEqual([
    0.8, 0.2
  ]);
  second.destroy();
  expect(texture.destroyed).toBe(false);
  texture.destroy();
});

test('PBR materials resolve deferred texture replacement without owning the source', async () => {
  const device = await getNullTestDevice();
  const texture = new DynamicTexture(device, {width: 1, height: 1});
  const material = createPBRMaterial(device, {bindings: {pbr_baseColorSampler: texture}});
  expect(getPBRMaterialMapUniforms(material.getResourceBindings()).baseColorMapEnabled).toBe(true);
  await texture.ready;
  expect(material.getBindings().pbr_baseColorSampler).toBe(texture.texture);
  const firstTexture = texture.texture;
  texture.resize({width: 2, height: 2});
  expect(material.getBindings().pbr_baseColorSampler).toBe(texture.texture);
  expect(texture.texture).not.toBe(firstTexture);
  material.destroy();
  expect(texture.destroyed).toBe(false);
  texture.destroy();
});
