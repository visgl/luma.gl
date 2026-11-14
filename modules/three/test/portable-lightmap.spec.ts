// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geometry} from '@luma.gl/engine';
import {createLightmapAtlas} from '@luma.gl/engine/lighting';
import {exportPortableLightmap} from '../../../examples/api/lightmap-baking/portable-bake';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {
  Mesh,
  MeshStandardMaterial,
  NoColorSpace,
  OrthographicCamera,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three';
import {expect, test} from 'vitest';

test('browser GLB export plays linear lightmaps in Three.js with a draft adapter', async () => {
  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: {size: 3, value: new Float32Array([-1, -1, 0, 1, -1, 0, 0, 1, 0])},
      NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])}
    }
  });
  const atlas = createLightmapAtlas([{id: 'receiver', geometry}], {
    width: 16,
    height: 16,
    texelsPerUnit: 3
  });
  const data = new Float32Array(16 * 16 * 4);
  for (let offset = 0; offset < data.length; offset += 4) data.set([4, 2, 0, 1], offset);
  const bytes = await exportPortableLightmap(atlas, {
    data,
    width: 16,
    height: 16,
    uvSet: 1,
    version: 1,
    encoding: 'linear-irradiance'
  });
  const loader = new GLTFLoader();
  loader.register(parser => ({
    name: 'KHR_lightmap',
    async extendMaterialParams(index, parameters) {
      const binding = parser.json.materials[index].extensions?.KHR_lightmap;
      if (!binding) return;
      await parser.assignTexture(parameters, 'lightMap', binding.lightmapTexture, NoColorSpace);
      parameters.lightMapIntensity = binding.intensity;
    }
  }));
  const {scene} = await loader.parseAsync(bytes, '');
  const mesh = scene.getObjectByProperty('isMesh', true) as Mesh<
    import('three').BufferGeometry,
    MeshStandardMaterial
  >;
  expect(mesh.material.lightMap?.channel).toBe(1);
  expect(mesh.material.lightMapIntensity).toBe(4);
  const renderer = new WebGLRenderer({antialias: false});
  const target = new WebGLRenderTarget(32, 32);
  try {
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 2;
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    const pixel = new Uint8Array(4);
    renderer.readRenderTargetPixels(target, 16, 16, 1, 1, pixel);
    expect(pixel[0]).toBeGreaterThan(pixel[1]);
    expect(pixel[1]).toBeGreaterThan(50);
    expect(pixel[2]).toBe(0);
    mesh.material.lightMapIntensity = 0;
    renderer.render(scene, camera);
    renderer.readRenderTargetPixels(target, 16, 16, 1, 1, pixel);
    expect(Array.from(pixel.slice(0, 3))).toEqual([0, 0, 0]);
  } finally {
    target.dispose();
    renderer.dispose();
    mesh.geometry.dispose();
    mesh.material.lightMap?.dispose();
    mesh.material.dispose();
  }
});
