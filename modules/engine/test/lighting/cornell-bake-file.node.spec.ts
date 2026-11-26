// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {LightmapData} from '@luma.gl/engine/lighting';
import {
  decodeCornellBake,
  encodeCornellBake,
  type CornellBakeRecipe
} from '../../../../examples/api/lightmap-baking/cornell-bake-file';

const recipe: CornellBakeRecipe = {
  assetHash: 'source-sha256',
  layoutVersion: 1,
  width: 2,
  height: 1,
  texelsPerUnit: 128,
  padding: 8,
  uvSet: 1,
  placements: ['node/6/primitive/0', 'node/7/primitive/0']
};

const irradiance: LightmapData = {
  version: 1,
  width: 2,
  height: 1,
  encoding: 'linear-irradiance',
  uvSet: 1,
  data: new Float32Array([3.25, 1.5, 0.125, 1, 0, 0, 0, 0])
};

test('Cornell bake preserves HDR and requires the exact source and ordered placements', () => {
  const file = encodeCornellBake(irradiance, recipe);
  expect(decodeCornellBake(file, recipe)).toEqual(irradiance);
  expect(() => decodeCornellBake(file, {...recipe, assetHash: 'different-source'})).toThrow(
    /different source asset/
  );
  expect(() =>
    decodeCornellBake(file, {...recipe, placements: [...recipe.placements].reverse()})
  ).toThrow(/atlas layout/);
  expect(() => decodeCornellBake(file, {...recipe, padding: 4})).toThrow(/atlas layout/);
  expect(() => decodeCornellBake(file.slice(0, -4), recipe)).toThrow();
  expect(() => encodeCornellBake({...irradiance, uvSet: 0}, recipe)).toThrow(/UV set/);
});
