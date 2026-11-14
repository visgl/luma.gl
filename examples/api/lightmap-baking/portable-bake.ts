// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {LightmapAtlas, LightmapData} from '@luma.gl/engine/lighting';
import {exportGLTF, type GLTFExportAccessor} from '../../gltf/gltf-exporter';

/** Encode linear irradiance into opaque linear RGBA8 with one shared intensity scale. */
export function quantizePortableLightmap(data: LightmapData) {
  let intensity = 0;
  for (let offset = 0; offset < data.data.length; offset += 4) {
    for (let channel = 0; channel < 3; channel++) {
      const value = data.data[offset + channel];
      if (!Number.isFinite(value) || value < 0) throw new Error('Invalid linear irradiance.');
      intensity = Math.max(intensity, value);
    }
  }
  intensity ||= 1;
  const pixels = new Uint8ClampedArray(data.data.length);
  for (let offset = 0; offset < pixels.length; offset += 4) {
    for (let channel = 0; channel < 3; channel++) {
      pixels[offset + channel] = Math.round((data.data[offset + channel] / intensity) * 255);
    }
    pixels[offset + 3] = 255;
  }
  return {pixels, intensity};
}

/** Serialize the example's static, world-space atlas meshes and a linear PNG as a GLB. */
export function writePortableLightmapGLB(
  atlas: LightmapAtlas,
  png: Uint8Array,
  intensity: number
): ArrayBuffer {
  return exportGLTF(
    {
      generator: 'luma.gl Lightmap Baking',
      nodes: atlas.meshes.map(({id}, mesh) => ({name: id, mesh})),
      meshes: atlas.meshes.map(({geometry}) => {
        const attributes: Record<string, GLTFExportAccessor> = {};
        for (const [name, {value, size}] of Object.entries(geometry.attributes)) {
          if (!(value instanceof Float32Array) || (size !== 2 && size !== 3 && size !== 4)) {
            throw new Error(`Unsupported bake attribute: ${name}`);
          }
          attributes[name] = {data: value, size};
        }
        return {primitives: [{attributes, material: 0}]};
      }),
      materials: [
        {
          pbrMetallicRoughness: {metallicFactor: 0, roughnessFactor: 1},
          extensions: {
            KHR_lightmap: {lightmapTexture: {index: 0, texCoord: atlas.uvSet}, intensity}
          }
        }
      ],
      textures: [{source: 0, sampler: 0}],
      samplers: [{magFilter: 9729, minFilter: 9729, wrapS: 33071, wrapT: 33071}],
      images: [{data: png, mimeType: 'image/png', name: 'Linear baked irradiance'}]
    },
    {binary: true}
  );
}

export async function exportPortableLightmap(atlas: LightmapAtlas, data: LightmapData) {
  if (data.width !== atlas.width || data.height !== atlas.height || data.uvSet !== atlas.uvSet) {
    throw new Error('The bake does not match the export atlas.');
  }
  const {pixels, intensity} = quantizePortableLightmap(data);
  const canvas = new OffscreenCanvas(data.width, data.height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('PNG encoding needs a 2D canvas.');
  context.putImageData(new ImageData(pixels, data.width, data.height), 0, 0);
  const image = await canvas.convertToBlob({type: 'image/png'});
  return writePortableLightmapGLB(atlas, new Uint8Array(await image.arrayBuffer()), intensity);
}
