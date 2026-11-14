// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {ScenegraphSurfaces} from '@luma.gl/anari';
import {makeBakingScenegraph} from '../../../../examples/api/lightmap-baking/baking-scenegraph';
import {createLightmapAtlas, validateLightmapAtlas} from '@luma.gl/engine/lighting';
import {BAKING_SCENES, makeBakingScene} from '../../../../examples/api/lightmap-baking/scenes';

for (const scene of BAKING_SCENES) {
  if (scene.value === 'rooms') continue;
  test(`${scene.label} fits the public atlas without degenerate geometry`, () => {
    const geometry = makeBakingScene(scene.value as Exclude<typeof scene.value, 'rooms'>);
    const atlas = createLightmapAtlas([{id: scene.value, geometry}], {
      width: 2048,
      height: 1024,
      texelsPerUnit: 32
    });
    expect(validateLightmapAtlas(atlas)).toEqual([]);
    expect(atlas.charts.length).toBeGreaterThan(12);
    expect(atlas.occupancy).toBeLessThan(1);
    const adapter = new ScenegraphSurfaces();
    const surfaces = adapter.getSurfaces(makeBakingScenegraph(atlas.meshes[0].geometry));
    expect(surfaces.reduce((count, surface) => count + surface.geometry.vertexCount, 0)).toBe(
      geometry.vertexCount
    );
    const sourceColors = geometry.attributes.COLOR_0;
    const colors = new Set(
      Array.from({length: geometry.vertexCount}, (_, vertex) =>
        Array.from(
          sourceColors.value.slice(vertex * sourceColors.size!, (vertex + 1) * sourceColors.size!)
        ).join(',')
      )
    );
    expect(
      new Set(surfaces.map(surface => surface.material.uniforms?.baseColorFactor?.join(',')))
    ).toEqual(colors);
    expect(colors.size).toBeGreaterThan(1);
    adapter.destroy();

    for (const attribute of Object.values(geometry.attributes))
      expect(Array.from(attribute.value).every(Number.isFinite)).toBe(true);
  });
}
