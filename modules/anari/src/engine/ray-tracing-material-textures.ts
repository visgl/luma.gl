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
  ['transmission', 'pbr_transmissionSampler', 'primitive.material.y *= sampled.r;'],
  [
    'specularColor',
    'pbr_specularColorSampler',
    'primitive.specular = vec4<f32>(primitive.specular.rgb * sampled.rgb, primitive.specular.w);'
  ],
  ['specularIntensity', 'pbr_specularIntensitySampler', 'primitive.specular.w *= sampled.a;'],
  ['clearcoat', 'pbr_clearcoatSampler', 'primitive.clearcoat.x *= sampled.r;'],
  ['clearcoatRoughness', 'pbr_clearcoatRoughnessSampler', 'primitive.clearcoat.y *= sampled.g;'],
  ['normal', 'pbr_normalSampler', '']
] as const;

/** Borrowed material maps; ownership remains with the scene adapter. */
export function getRayMaterialTextures(
  surfaces: readonly SceneSurface[],
  opacityOnly = false
): Texture[] {
  const textures: Texture[] = [];
  for (const surface of surfaces) {
    for (const [name, binding] of MATERIAL_MAPS) {
      if (
        (opacityOnly && name !== 'baseColor') ||
        surface.material.uniforms?.[`${name}MapEnabled`] === false
      )
        continue;
      const texture = surface.material.bindings?.[binding];
      if (texture instanceof Texture && !textures.includes(texture)) textures.push(texture);
    }
  }
  // Two sampled textures are already used by temporal history in the CORE profile.
  assert(textures.length <= 14);
  return textures;
}

/** Only shader-baked map selection and UV metadata require recompilation. */
export function getRayMaterialTextureRevision(surfaces: readonly SceneSurface[]): string {
  const textures = getRayMaterialTextures(surfaces);
  return JSON.stringify(
    surfaces.map(surface => [
      surface.id,
      surface.material.uniforms?.normalScale,
      MATERIAL_MAPS.map(([name, binding]) => [
        textures.findIndex(texture => texture === surface.material.bindings?.[binding]),
        surface.material.uniforms?.[`${name}MapEnabled`],
        surface.material.uniforms?.[`${name}UVSet`],
        surface.material.uniforms?.[`${name}UVTransform`]
      ])
    ])
  );
}

/** Explicit LOD sampling is valid inside divergent software traversal. */
export function getRayMaterialTextureShader(
  source: string,
  surfaces: readonly SceneSurface[],
  opacityOnly = false
): string {
  const textures = getRayMaterialTextures(surfaces, opacityOnly);
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
  const opacityMaterials: string[] = [];
  const normalMaterials: string[] = [];
  const materials = surfaces
    .map((surface, surfaceIndex) => {
      const uniforms = surface.material.uniforms;
      const statements = MATERIAL_MAPS.map(([name, binding, assignment]) => {
        const texture = surface.material.bindings?.[binding];
        if (
          !(texture instanceof Texture) ||
          !textures.includes(texture) ||
          (opacityOnly && name !== 'baseColor') ||
          uniforms?.[`${name}MapEnabled`] === false
        )
          return '';
        const transform = uniforms?.[`${name}UVTransform`] ?? [1, 0, 0, 0, 1, 0, 0, 0, 1];
        const matrix = Array.from(transform, value => `${Number(value).toFixed(9)}`).join(', ');
        const coordinates =
          uniforms?.[`${name}UVSet`] === 1 ? 'hit.secondaryCoordinates' : 'hit.coordinates';
        if (name === 'normal') {
          const scale = Number(uniforms?.normalScale ?? 1).toFixed(9);
          normalMaterials.push(`case ${surfaceIndex}u: {
            let transform = mat3x3<f32>(${matrix});
            let coordinates = (transform * vec3<f32>(${coordinates}, 1.0)).xy;
            let sampled = sampleMaterialTexture(${textures.indexOf(texture) + 1}u, coordinates);
            return applyNormalMap(hit, transform, ${uniforms?.normalUVSet === 1}, sampled.xyz, ${scale});
          }`);
          return '';
        }
        if (name === 'baseColor') {
          opacityMaterials.push(`case ${surfaceIndex}u: {
            let coordinates = (mat3x3<f32>(${matrix}) * vec3<f32>(${coordinates}, 1.0)).xy;
            opacity *= sampleMaterialTexture(${textures.indexOf(texture) + 1}u, coordinates).a;
          }`);
        }
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
    .replace('/* MATERIAL_SURFACE_CASES */', materials)
    .replace('/* MATERIAL_OPACITY_CASES */', opacityMaterials.join('\n'))
    .replace('/* MATERIAL_NORMAL_CASES */', normalMaterials.join('\n'));
}

/** Shared explicit texture layout for trace, picking and primary-hit channels. */
export function getRayMaterialTextureLayout(textures: readonly Texture[]) {
  return textures.flatMap((texture, index) => [
    {name: `materialTexture${index}`, type: 'texture' as const, group: 1, location: index * 2},
    {name: `materialSampler${index}`, type: 'sampler' as const, group: 1, location: index * 2 + 1}
  ]);
}

/** Bind borrowed textures by object identity, including same-label replacements. */
export function getRayMaterialTextureBindings(textures: readonly Texture[]) {
  return Object.fromEntries(
    textures.flatMap((texture, index) => [
      [`materialTexture${index}`, texture],
      [`materialSampler${index}`, texture.sampler]
    ])
  );
}
