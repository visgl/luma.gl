// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geometry} from '@luma.gl/engine';
import {createLightmapAtlas, validateLightmapAtlas} from '@luma.gl/engine/lighting';
import {expect, test} from 'vitest';

test('packs a two-mesh surface beyond the old triangle-per-chart limit', () => {
  const positions: number[] = [];
  for (let row = 0; row < 24; row++) {
    for (let column = 0; column < 24; column++) {
      positions.push(
        column, row, 0, column + 1, row, 0, column + 1, row + 1, 0,
        column, row, 0, column + 1, row + 1, 0, column, row + 1, 0
      );
    }
  }
  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {POSITION: {size: 3, value: new Float32Array(positions)}}
  });
  const inputs = [{id: 'first', geometry}, {id: 'second', geometry}];
  const options = {width: 512, height: 512, texelsPerUnit: 4};
  expect(() => createLightmapAtlas(inputs, options)).toThrow();
  const atlas = createLightmapAtlas(inputs, {...options, mergeCoplanarPairs: true});
  expect(atlas.charts).toHaveLength(1152);
  expect(atlas.charts.every(chart => chart.vertexCount === 6 && chart.worldArea === 1)).toBe(true);
  expect(validateLightmapAtlas(atlas)).toEqual([]);
  const uv = atlas.meshes[0].geometry.attributes.TEXCOORD_1.value;
  expect(uv.slice(0, 2)).toEqual(uv.slice(6, 8));
  expect(uv.slice(4, 6)).toEqual(uv.slice(8, 10));
  expect(geometry.attributes.TEXCOORD_1).toBeUndefined();
});
