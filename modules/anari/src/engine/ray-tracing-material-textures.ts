// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Texture} from '@luma.gl/core';
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
  ['clearcoat', 'pbr_clearcoatSampler', 'primitive.clearcoatOcclusion.x *= sampled.r;'],
  [
    'clearcoatRoughness',
    'pbr_clearcoatRoughnessSampler',
    'primitive.clearcoatOcclusion.y *= sampled.g;'
  ],
  ['occlusion', 'pbr_occlusionSampler', 'primitive.clearcoatOcclusion.w = sampled.r;'],
  [
    'sheenColor',
    'pbr_sheenColorSampler',
    'primitive.sheen = vec4<f32>(primitive.sheen.rgb * sampled.rgb, primitive.sheen.w);'
  ],
  ['sheenRoughness', 'pbr_sheenRoughnessSampler', 'primitive.sheen.w *= sampled.a;'],
  ['normal', 'pbr_normalSampler', ''],
  ['clearcoatNormal', 'pbr_clearcoatNormalSampler', ''],
  ['iridescence', 'pbr_iridescenceSampler', 'primitive.iridescence.x *= sampled.r;'],
  [
    'iridescenceThickness',
    'pbr_iridescenceThicknessSampler',
    'primitive.iridescence.w = mix(primitive.iridescence.z, primitive.iridescence.w, sampled.g);'
  ],
  [
    'anisotropy',
    'pbr_anisotropySampler',
    'primitive.anisotropy.z *= sampled.b; let orientation = sampled.rg * 2.0 - vec2<f32>(1.0); if (dot(orientation, orientation) > 0.000001) { primitive.anisotropy = vec4<f32>(orientation, primitive.anisotropy.zw); }'
  ]
] as const;

/** Borrowed material maps; ownership remains with the scene adapter. */
export function getRayMaterialTextures(
  surfaces: readonly SceneSurface[],
  opacityOnly = false
): Texture[] {
  const textures: Texture[] = [];
  for (const [name, binding] of MATERIAL_MAPS) {
    for (const surface of surfaces) {
      if (
        (opacityOnly && name !== 'baseColor') ||
        (name !== 'clearcoatNormal' &&
          name !== 'iridescenceThickness' &&
          surface.material.uniforms?.[`${name}MapEnabled`] === false)
      )
        continue;
      const texture = surface.material.bindings?.[binding];
      if (texture instanceof Texture && !textures.includes(texture)) {
        textures.push(texture);
        // Temporal history occupies two of the 16 guaranteed sampled texture bindings.
        if (textures.length === 14) return textures;
      }
    }
  }
  return textures;
}

/** Only shader-baked map selection and UV metadata require recompilation. */
export function getRayMaterialTextureRevision(surfaces: readonly SceneSurface[]): string {
  const textures = getRayMaterialTextures(surfaces);
  return JSON.stringify(
    surfaces.map(surface => [
      surface.id,
      surface.material.uniforms?.normalScale,
      (surface.material.uniforms?.anisotropyStrength ?? 0) > 0,
      MATERIAL_MAPS.map(([name, binding]) => [
        textures.findIndex(texture => texture === surface.material.bindings?.[binding]),
        name === 'clearcoatNormal' || name === 'iridescenceThickness'
          ? undefined
          : surface.material.uniforms?.[`${name}MapEnabled`],
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
    .map((texture, index) => {
      // Single-level textures cannot benefit from a footprint calculation.
      if (texture.mipLevels === 1) {
        return `case ${index + 1}u: {
          return textureSampleLevel(materialTexture${index}, materialSampler${index}, coordinates, 0.0);
        }`;
      }
      return `case ${index + 1}u: {
        let extent = footprint * vec2<f32>(textureDimensions(materialTexture${index}, 0));
        let level = clamp(log2(max(length(extent), 1.0)), 0.0,
          f32(textureNumLevels(materialTexture${index}) - 1u));
        return textureSampleLevel(materialTexture${index}, materialSampler${index}, coordinates, level);
      }`;
    })
    .join('\n');
  const opacityMaterials: string[] = [];
  const normalMaterials: string[] = [];
  const clearcoatNormalMaterials: string[] = [];
  const anisotropyMaterials: string[] = [];
  const materials = surfaces
    .map((surface, surfaceIndex) => {
      const uniforms = surface.material.uniforms;
      const statements = MATERIAL_MAPS.map(([name, binding, assignment]) => {
        const texture = surface.material.bindings?.[binding];
        if (
          !(texture instanceof Texture) ||
          !textures.includes(texture) ||
          (opacityOnly && name !== 'baseColor') ||
          (name !== 'clearcoatNormal' &&
            name !== 'iridescenceThickness' &&
            uniforms?.[`${name}MapEnabled`] === false)
        )
          return '';
        const transform = uniforms?.[`${name}UVTransform`] ?? [1, 0, 0, 0, 1, 0, 0, 0, 1];
        const matrix = Array.from(transform, value => `${Number(value).toFixed(9)}`).join(', ');
        const coordinates =
          uniforms?.[`${name}UVSet`] === 1 ? 'hit.secondaryCoordinates' : 'hit.coordinates';
        const footprint =
          texture.mipLevels > 1
            ? `getMaterialFootprint(hit, transform, ${uniforms?.[`${name}UVSet`] === 1})`
            : 'vec2<f32>(0.0)';
        if (name === 'normal' || name === 'clearcoatNormal') {
          const scale = name === 'normal' ? Number(uniforms?.normalScale ?? 1).toFixed(9) : '1.0';
          const cases = name === 'normal' ? normalMaterials : clearcoatNormalMaterials;
          cases.push(`case ${surfaceIndex}u: {
            let transform = mat3x3<f32>(${matrix});
            let coordinates = (transform * vec3<f32>(${coordinates}, 1.0)).xy;
            let sampled = sampleMaterialTexture(${textures.indexOf(texture) + 1}u, coordinates, ${footprint});
            return applyNormalMap(hit, transform, ${uniforms?.[`${name}UVSet`] === 1}, sampled.xyz, ${scale});
          }`);
          return '';
        }
        if (name === 'anisotropy') {
          anisotropyMaterials.push(`case ${surfaceIndex}u: {
            return getTriangleTangentFrame(hit, normal, mat3x3<f32>(${matrix}), ${uniforms?.anisotropyUVSet === 1});
          }`);
        }
        if (name === 'baseColor') {
          opacityMaterials.push(`case ${surfaceIndex}u: {
            let coordinates = (mat3x3<f32>(${matrix}) * vec3<f32>(${coordinates}, 1.0)).xy;
            opacity *= sampleMaterialTexture(${textures.indexOf(texture) + 1}u, coordinates, vec2<f32>(0.0)).a;
          }`);
        }
        return `{ let transform = mat3x3<f32>(${matrix});
        let coordinates = (transform * vec3<f32>(${coordinates}, 1.0)).xy;
        let sampled = sampleMaterialTexture(${textures.indexOf(texture) + 1}u, coordinates, ${footprint});
        ${assignment} }`;
      }).join('\n');
      return `case ${surfaceIndex}u: { ${statements} }`;
    })
    .join('\n');
  const hasAnisotropy =
    !opacityOnly &&
    surfaces.some(surface => (surface.material.uniforms?.anisotropyStrength ?? 0) > 0);
  return source
    .replace('/* MATERIAL_HAS_ANISOTROPY */ false', String(hasAnisotropy))
    .replace(
      '/* MATERIAL_PRIMARY_FOOTPRINT */',
      textures.some(texture => texture.mipLevels > 1)
        ? `
      let horizontal = makeCameraRayAtOffset(pixel, sampleOffset + vec2<f32>(1.0, 0.0));
      let vertical = makeCameraRayAtOffset(pixel, sampleOffset + vec2<f32>(0.0, 1.0));
      let position = ray.origin + ray.direction * hit.distance;
      let face = getFaceNormal(hit, ray);
      let horizontalOffset = horizontal.origin + horizontal.direction * hit.distance - position;
      let verticalOffset = vertical.origin + vertical.direction * hit.distance - position;
      hit.footprint = max(length(horizontalOffset), length(verticalOffset)) /
        max(abs(dot(face, ray.direction)), 0.05);`
        : ''
    )
    .replace('/* MATERIAL_TEXTURE_DECLARATIONS */', declarations)
    .replace('/* MATERIAL_TEXTURE_CASES */', cases)
    .replace('/* MATERIAL_SURFACE_CASES */', materials)
    .replace('/* MATERIAL_OPACITY_CASES */', opacityMaterials.join('\n'))
    .replace('/* MATERIAL_NORMAL_CASES */', normalMaterials.join('\n'))
    .replace('/* MATERIAL_CLEARCOAT_NORMAL_CASES */', clearcoatNormalMaterials.join('\n'))
    .replace('/* MATERIAL_ANISOTROPY_CASES */', anisotropyMaterials.join('\n'));
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
