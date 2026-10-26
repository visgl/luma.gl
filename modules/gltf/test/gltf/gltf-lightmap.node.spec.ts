// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {
  getGLTFLightmapInstances,
  resolveGLTFLightmapBinding,
  resolveGLTFLightmapTransform,
  validateGLTFNodeLightmaps
} from '../../src/gltf/gltf-lightmap';

describe('KHR_lightmap binding resolution', () => {
  test('replaces a complete binding only for the selected primitive', () => {
    const materialBinding = {lightmapTexture: {index: 0, texCoord: 1}, intensity: 12};
    const replacement = {primitive: 1, lightmapTexture: {index: 2}};
    const nodeExtension = {lightmaps: [replacement]};
    expect(resolveGLTFLightmapBinding({primitiveIndex: 0, materialBinding, nodeExtension})).toBe(
      materialBinding
    );
    const binding = resolveGLTFLightmapBinding({
      primitiveIndex: 1,
      materialBinding,
      nodeExtension
    })!;
    expect(binding).toBe(replacement);
    expect(resolveGLTFLightmapTransform(binding)).toMatchObject({
      textureIndex: 2,
      texCoord: 0,
      intensity: 1
    });
    expect(resolveGLTFLightmapBinding({primitiveIndex: 1})).toBeUndefined();
  });

  test('applies instance placement after the texture transform and respects UV override', () => {
    const result = resolveGLTFLightmapTransform(
      {
        lightmapTexture: {
          index: 0,
          texCoord: 0,
          extensions: {KHR_texture_transform: {offset: [0.25, 0], scale: [0.5, 0.5], texCoord: 1}}
        },
        intensity: 4
      },
      {offset: [0, 0.5], scale: [0.5, 0.5], intensity: 2}
    );
    expect(result.texCoord).toBe(1);
    expect(result.intensity).toBe(8);
    expect(result.transform.transform([1, 1, 1])).toEqual([0.375, 0.75, 1]);
  });

  test('rejects duplicate, empty and out-of-range node bindings', () => {
    const binding = {primitive: 0, lightmapTexture: {index: 0}};
    expect(() => validateGLTFNodeLightmaps({lightmaps: []}, 1)).toThrow();
    expect(() => validateGLTFNodeLightmaps({lightmaps: [binding, binding]}, 1)).toThrow();
    expect(() => validateGLTFNodeLightmaps({lightmaps: [{...binding, primitive: 1}]}, 1)).toThrow();
    expect(() => validateGLTFNodeLightmaps({lightmaps: [binding]}, 1)).not.toThrow();
  });

  test('does not let zero intensity mask invalid authored intensity', () => {
    expect(() =>
      resolveGLTFLightmapTransform({lightmapTexture: {index: 0}, intensity: -1}, {intensity: 0})
    ).toThrow();
    expect(() =>
      resolveGLTFLightmapTransform({lightmapTexture: {index: 0}}, {intensity: Infinity})
    ).toThrow();
  });
});

test('KHR_lightmap decodes instance atlas defaults and rejects invalid FLOAT attributes', () => {
  const instancing = {
    matrices: [new Matrix4(), new Matrix4()],
    attributes: {
      _LIGHTMAP_INTENSITY: {
        value: new Float32Array([1, 0.5]),
        size: 1,
        count: 2,
        normalized: false
      },
      _LIGHTMAP_OFFSET: {
        value: new Float32Array([0, 0, 0.5, 0]),
        size: 2,
        count: 2,
        normalized: false
      }
    }
  };
  expect(getGLTFLightmapInstances(instancing)).toEqual([
    {offset: [0, 0], scale: [1, 1], rotation: 0, intensity: 1},
    {offset: [0.5, 0], scale: [1, 1], rotation: 0, intensity: 0.5}
  ]);
  instancing.attributes._LIGHTMAP_INTENSITY.value[1] = -1;
  expect(() => getGLTFLightmapInstances(instancing)).toThrow();
  instancing.attributes._LIGHTMAP_INTENSITY.value[1] = 1;
  instancing.attributes._LIGHTMAP_OFFSET.normalized = true;
  expect(() => getGLTFLightmapInstances(instancing)).toThrow();
  instancing.attributes._LIGHTMAP_OFFSET.normalized = false;
  instancing.attributes._LIGHTMAP_OFFSET.value[0] = Infinity;
  expect(() => getGLTFLightmapInstances(instancing)).toThrow();
  expect(getGLTFLightmapInstances({matrices: [], attributes: {}})).toBeNull();
});
