// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {shadow, type ShadowProps} from '@luma.gl/shaders';
import {ShadowMapRenderer, SHADOW_QUALITY_SETTINGS} from '@luma.gl/engine/lighting';
import {ShadowMapRenderer as compatibleRenderer} from '../../../anari/src/shadows/shadow-map-renderer';
import {shadow as compatibleShadow} from '../../../anari/src/shadows/shadow';
import {SHADOW_QUALITY_SETTINGS as compatibleQuality} from '../../../anari/src/shadows/shadow-quality';

it('shadow compatibility exports preserve canonical implementation identity', () => {
  expect(compatibleRenderer).toBe(ShadowMapRenderer);
  expect(compatibleShadow).toBe(shadow);
  expect(compatibleQuality).toBe(SHADOW_QUALITY_SETTINGS);
  expect(Object.isFrozen(SHADOW_QUALITY_SETTINGS)).toBe(true);
  expect(Object.isFrozen(SHADOW_QUALITY_SETTINGS.balanced)).toBe(true);
});

for (const backend of ['webgl', 'webgpu']) {
  it(`shadow shader props select sampler bindings on ${backend} without GPU resource dependencies`, () => {
    const texture = {device: {type: backend}};
    const comparisonSampler = {};
    const properties: ShadowProps = {
      quality: 'low',
      cascadeCount: 3,
      cascadeSplits: [1, 2, 3, 3],
      blockerSampleCount: 8,
      filterSampleCount: 12,
      directionalLights: [],
      spotLights: [],
      pointLights: [],
      directionalViewProjectionMatrices: [new Matrix4()],
      spotViewProjectionMatrices: [new Matrix4()],
      pointViewProjectionMatrices: [new Matrix4()],
      directionalShadowTexture: texture,
      spotShadowTexture: texture,
      pointShadowTexture: texture,
      comparisonSampler,
      nonFilteringSampler: {}
    };
    const uniforms = shadow.getUniforms(properties);
    expect(uniforms.directionalLightCount).toBe(0);
    expect(uniforms.directionalLights).toHaveLength(1);
    expect(uniforms.spotLights).toHaveLength(4);
    expect(uniforms.pointLights).toHaveLength(4);
    expect(uniforms.directionalLights?.[0].strength).toBe(0);
    expect(uniforms.directionalShadowTexture).toBe(texture);
    expect(uniforms.shadowComparisonSampler).toBe(
      backend === 'webgpu' ? comparisonSampler : undefined
    );
    expect(shadow.getUniforms({})).toEqual({});
  });
}
