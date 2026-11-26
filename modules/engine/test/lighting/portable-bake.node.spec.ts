// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {parse} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/scene/gltf';
import {Geometry} from '@luma.gl/engine';
import {postProcessGLTF} from '@luma.gl/engine/gltf';
import {createLightmapAtlas, type LightmapData} from '@luma.gl/engine/lighting';
import {expect, test} from 'vitest';
import {
  quantizePortableLightmap,
  writePortableLightmapGLB
} from '../../../../examples/api/lightmap-baking/portable-bake';

test('portable bake preserves atlas UVs and stores the linear HDR scale', async () => {
  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {POSITION: {size: 3, value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])}}
  });
  const atlas = createLightmapAtlas([{id: 'triangle', geometry}], {
    width: 16,
    height: 16,
    texelsPerUnit: 4
  });
  const bake: LightmapData = {
    width: 1,
    height: 1,
    uvSet: 1,
    version: 1,
    encoding: 'linear-irradiance',
    data: new Float32Array([4, 2, 0, 0])
  };
  const {pixels, intensity} = quantizePortableLightmap(bake);
  expect(Array.from(pixels)).toEqual([255, 128, 0, 255]);
  expect(intensity).toBe(4);
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf2sAAAAASUVORK5CYII=',
    'base64'
  );
  const glb = writePortableLightmapGLB(atlas, png, intensity);
  const gltf = postProcessGLTF(await parse(glb, GLTFLoader, {gltf: {loadImages: false}}));
  expect(gltf.extensionsUsed).toContain('KHR_lightmap');
  expect(gltf.materials[0].extensions.KHR_lightmap).toEqual({
    lightmapTexture: {index: 0, texCoord: 1},
    intensity: 4
  });
  expect(gltf.meshes[0].primitives[0].attributes.TEXCOORD_1.value).toEqual(
    atlas.meshes[0].geometry.attributes.TEXCOORD_1.value
  );
});
