// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
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
    for (const attribute of Object.values(geometry.attributes))
      expect(Array.from(attribute.value).every(Number.isFinite)).toBe(true);
  });
}
