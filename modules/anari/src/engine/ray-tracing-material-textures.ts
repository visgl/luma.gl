// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Texture, assert} from '@luma.gl/core';
import type {SceneSurface} from './scene-renderer';

const MATERIAL_MAPS = [
  ['baseColor', 'pbr_baseColorSampler', 'primitive.baseColor *= sampled;'],
  [
    'emissive',
    'pbr_emissiveSampler',
    'primitive.emissive = vec4<f32>(primitive.emissive.rgb * sampled.rgb, primitive.emissive.w);'
  ],
  [
    'metallicRoughness',
    'pbr_metallicRoughnessSampler',
    'primitive.properties.x *= sampled.g; primitive.emissive.w *= sampled.b;'
  ],
  ['transmission', 'pbr_transmissionSampler', 'primitive.material.y *= sampled.r;']
] as const;

/** Borrowed material maps; ownership remains with the scene adapter. */
export function getRayMaterialTextures(surfaces: readonly SceneSurface[]): Texture[] {
  const textures: Texture[] = [];
  for (const surface of surfaces) {
    for (const [, binding] of MATERIAL_MAPS) {
      const texture = surface.material.bindings?.[binding];
      if (texture instanceof Texture && !textures.includes(texture)) textures.push(texture);
    }
  }
  // Two sampled textures are already used by temporal history in the CORE profile.
  assert(textures.length <= 14);
  return textures;
}

/** Include borrowed texture/sampler identities and shader-specialized UV metadata. */
export function getRayMaterialTextureRevision(surfaces: readonly SceneSurface[]): string {
  return JSON.stringify(
    surfaces.map(surface => [
      surface.id,
      surface.material.version,
      surface.material.uniforms,
      MATERIAL_MAPS.map(([, binding]) => {
        const texture = surface.material.bindings?.[binding];
        return texture instanceof Texture ? [texture.id, texture.sampler.id] : null;
      })
    ])
  );
}

/** Explicit LOD sampling is valid inside divergent software traversal. */
export function getRayMaterialTextureShader(
  source: string,
  surfaces: readonly SceneSurface[]
): string {
  const textures = getRayMaterialTextures(surfaces);
  const declarations = textures
    .map(
      (texture, index) => `
@group(1) @binding(${index * 2}) var materialTexture${index}: texture_2d<f32>;
@group(1) @binding(${index * 2 + 1}) var materialSampler${index}: sampler;
`
    )
    .join('');
  const cases = textures
    .map(
      (texture, index) => `
    case ${index + 1}u: { return textureSampleLevel(materialTexture${index}, materialSampler${index}, coordinates, 0.0); }
`
    )
    .join('');
  const materials = surfaces
    .map((surface, surfaceIndex) => {
      const uniforms = surface.material.uniforms;
      const statements = MATERIAL_MAPS.map(([name, binding, assignment]) => {
        const texture = surface.material.bindings?.[binding];
        if (!(texture instanceof Texture) || uniforms?.[`${name}MapEnabled`] === false) return '';
        const transform = uniforms?.[`${name}UVTransform`] ?? [1, 0, 0, 0, 1, 0, 0, 0, 1];
        const matrix = Array.from(transform, value => `${Number(value).toFixed(9)}`).join(', ');
        const coordinates =
          uniforms?.[`${name}UVSet`] === 1 ? 'hit.secondaryCoordinates' : 'hit.coordinates';
        return `{ let coordinates = (mat3x3<f32>(${matrix}) * vec3<f32>(${coordinates}, 1.0)).xy;
        let sampled = sampleMaterialTexture(${textures.indexOf(texture) + 1}u, coordinates);
        ${assignment} }`;
      }).join('\n');
      return `case ${surfaceIndex}u: { ${statements} }`;
    })
    .join('\n');
  return source
    .replace('/* MATERIAL_TEXTURE_DECLARATIONS */', declarations)
    .replace('/* MATERIAL_TEXTURE_CASES */', cases)
    .replace('/* MATERIAL_SURFACE_CASES */', materials);
}
