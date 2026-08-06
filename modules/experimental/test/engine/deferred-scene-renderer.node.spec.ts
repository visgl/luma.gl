// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import {Geometry} from '@luma.gl/engine';
import {
  DeferredSceneRenderer,
  MAX_DEFERRED_POINT_LIGHTS,
  type SceneMaterial,
  type SceneRenderOptions,
  supportsDeferredScene
} from '@luma.gl/experimental';
import {pbrMaterial, pbrScene, WGSLShaderAssembler} from '@luma.gl/shadertools';
import {getNullTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {describe, expect, test} from 'vitest';
import {WgslReflect} from 'wgsl_reflect';
import {DEFERRED_SCENE_WGSL_SHADER} from '../../src/engine/deferred-scene-shaders';

const WEBGPU_PLATFORM = {
  type: 'webgpu' as const,
  shaderLanguage: 'wgsl' as const,
  shaderLanguageVersion: 300 as const,
  gpu: 'test',
  features: new Set<string>()
};

function makeOptions(material: SceneMaterial): SceneRenderOptions {
  return {
    id: 'deferred-scene',
    surfaces: [
      {
        id: 'surface',
        geometry: new Geometry({
          topology: 'triangle-list',
          attributes: {POSITION: {size: 3, value: new Float32Array(9)}}
        }),
        material,
        transforms: [new Matrix4()]
      }
    ],
    camera: {
      viewMatrix: new Matrix4(),
      projectionMatrix: new Matrix4(),
      position: [0, 0, 5]
    }
  };
}

describe('DeferredSceneRenderer', () => {
  test('rejects non-WebGPU devices', async () => {
    const device = await getNullTestDevice();
    expect(() => new DeferredSceneRenderer(device)).toThrow(/WebGPU/);
  });

  test('accepts opaque and masked metallic-roughness materials', () => {
    expect(supportsDeferredScene(makeOptions({id: 'opaque'}))).toBe(true);
    expect(
      supportsDeferredScene(
        makeOptions({
          id: 'masked',
          alphaMode: 'MASK',
          uniforms: {alphaCutoff: 0.3, metallicRoughnessValues: [0.8, 0.2]}
        })
      )
    ).toBe(true);
  });

  test.each([
    {id: 'blended', alphaMode: 'BLEND'} satisfies SceneMaterial,
    {id: 'transmissive', uniforms: {transmissionFactor: 0.4}} satisfies SceneMaterial,
    {id: 'volume', uniforms: {thicknessFactor: 0.4}} satisfies SceneMaterial,
    {id: 'clearcoat', uniforms: {clearcoatFactor: 0.4}} satisfies SceneMaterial,
    {id: 'sheen', uniforms: {sheenColorFactor: [0.1, 0, 0]}} satisfies SceneMaterial,
    {id: 'iridescence', uniforms: {iridescenceFactor: 0.4}} satisfies SceneMaterial,
    {id: 'anisotropy', uniforms: {anisotropyStrength: 0.4}} satisfies SceneMaterial,
    {id: 'ior', uniforms: {ior: 1.3}} satisfies SceneMaterial,
    {id: 'specular', uniforms: {specularIntensityFactor: 0.7}} satisfies SceneMaterial,
    {id: 'unlit', uniforms: {unlit: true}} satisfies SceneMaterial
  ])('uses forward rendering for unsupported $id materials', material => {
    expect(supportsDeferredScene(makeOptions(material))).toBe(false);
  });

  test('uses forward rendering for debug passes and environment illumination', () => {
    const options = makeOptions({id: 'physical'});
    expect(supportsDeferredScene({...options, renderMode: 'debugNormals'})).toBe(false);
    expect(
      supportsDeferredScene({
        ...options,
        environment: {
          diffuseTexture: {} as NonNullable<SceneRenderOptions['environment']>['diffuseTexture']
        }
      })
    ).toBe(false);
  });

  test('uses forward rendering for specular extension maps even with default factors', () => {
    const texture = {} as Texture;

    for (const material of [
      {id: 'specular-color-binding', bindings: {pbr_specularColorSampler: texture}},
      {id: 'specular-intensity-binding', bindings: {pbr_specularIntensitySampler: texture}},
      {id: 'specular-color-flag', uniforms: {specularColorMapEnabled: true}},
      {id: 'specular-intensity-flag', uniforms: {specularIntensityMapEnabled: true}}
    ] satisfies SceneMaterial[]) {
      expect(supportsDeferredScene(makeOptions(material)), material.id).toBe(false);
    }
  });

  test('preserves directional and spot light semantics through forward fallback', () => {
    const options = makeOptions({id: 'opaque'});

    expect(
      supportsDeferredScene({
        ...options,
        lights: [
          {type: 'ambient', intensity: 0.25},
          {type: 'directional', direction: [0, 0, -1]},
          {type: 'point', position: [0, 1, 0]}
        ]
      })
    ).toBe(true);

    expect(
      supportsDeferredScene({
        ...options,
        lights: [
          {type: 'directional', direction: [0, 0, -1]},
          {type: 'directional', direction: [1, 0, -1]}
        ]
      })
    ).toBe(false);

    expect(
      supportsDeferredScene({
        ...options,
        lights: [
          {
            type: 'spot',
            position: [0, 1, 0],
            direction: [0, -1, 0],
            innerConeAngle: 0.2,
            outerConeAngle: 0.4
          }
        ]
      })
    ).toBe(false);

    expect(
      supportsDeferredScene({
        ...options,
        lights: Array.from({length: MAX_DEFERRED_POINT_LIGHTS + 1}, (_, index) => ({
          type: 'point',
          position: [index, 0, 0]
        }))
      })
    ).toBe(false);
  });

  test('assembles canonical instanced PBR G-buffer shader interfaces', () => {
    const shader = new WGSLShaderAssembler().assembleWGSLShader({
      platformInfo: WEBGPU_PLATFORM,
      source: DEFERRED_SCENE_WGSL_SHADER,
      modules: [pbrMaterial, pbrScene],
      defines: {HAS_NORMALS: true, HAS_UV: true, HAS_COLORS: true, HAS_INSTANCING: true}
    });
    const reflection = new WgslReflect(shader.source);

    expect(reflection.entry.vertex.map(entry => entry.name)).toEqual(['vertexMain']);
    expect(reflection.entry.fragment.map(entry => entry.name)).toEqual(['fragmentMain']);
    expect(shader.source).toContain('outputs.baseColorMetallic');
    expect(shader.source).toContain('pbrMaterial.baseColorFactor * inputs.color');
    expect(shader.shaderLayout?.attributes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({name: 'positions', location: 0}),
        expect.objectContaining({name: 'instanceModelMatrixCol0', location: 8}),
        expect.objectContaining({name: 'instanceModelMatrixCol3', location: 11})
      ])
    );
  });
});
