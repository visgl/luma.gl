// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {Geometry} from '@luma.gl/engine';
import {
  createLightmapAtlas,
  validateLightmapAtlas,
  getLightmapAtlasDebugData
} from '@luma.gl/engine/lighting';

function makeGeometry() {
  return new Geometry({
    topology: 'triangle-list',
    indices: new Uint16Array([0, 1, 2, 0, 2, 3]),
    attributes: {
      POSITION: {size: 3, value: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0])},
      NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1])},
      TEXCOORD_0: {size: 2, value: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1])},
      COLOR_0: {
        size: 4,
        normalized: true,
        value: new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255])
      }
    }
  });
}
const options = {width: 128, height: 64, texelsPerUnit: 8};

test('atlas packs multiple indexed meshes deterministically without mutating or borrowing attributes', () => {
  const source = makeGeometry();
  const inputs = [
    {id: 'first', geometry: source},
    {id: 'second', geometry: source}
  ];
  const atlas = createLightmapAtlas(inputs, options);
  expect(createLightmapAtlas(inputs, options)).toMatchObject({
    charts: atlas.charts,
    chartOwners: atlas.chartOwners
  });
  expect(validateLightmapAtlas(atlas)).toEqual([]);
  expect(atlas.charts.map(chart => chart.id)).toEqual([1, 2, 3, 4]);
  expect(atlas.meshes[0].geometry.indices).toBeUndefined();
  expect(atlas.meshes[0].geometry.vertexCount).toBe(6);
  expect(atlas.meshes[0].geometry.attributes.COLOR_0.value).toBeInstanceOf(Uint8Array);
  expect(atlas.meshes[0].geometry.attributes.COLOR_0.normalized).toBe(true);
  expect(Array.from(atlas.meshes[0].geometry.attributes.TEXCOORD_0.value)).toEqual([
    0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1
  ]);
  atlas.meshes[0].geometry.attributes.POSITION.value[0] = 9;
  expect(source.attributes.POSITION.value[0]).toBe(0);
  expect(atlas.meshes[1].geometry.attributes.POSITION.value[0]).toBe(0);
  expect(source.attributes.TEXCOORD_1).toBeUndefined();
  expect(source.indices?.value).toEqual(new Uint16Array([0, 1, 2, 0, 2, 3]));
  expect(atlas.occupancy).toBeGreaterThan(0);
  expect(atlas.occupancy).toBeLessThan(1);
});

test('world transforms control physical density while positions stay in object space', () => {
  const geometry = makeGeometry();
  const normal = createLightmapAtlas([{id: 'mesh', geometry}], options);
  const scaled = createLightmapAtlas(
    [{id: 'mesh', geometry, modelMatrix: new Matrix4().scale([2, 3, 1])}],
    options
  );
  expect(scaled.charts[0].worldArea).toBeCloseTo(normal.charts[0].worldArea * 6);
  expect(scaled.meshes[0].geometry.attributes.POSITION.value).toEqual(
    normal.meshes[0].geometry.attributes.POSITION.value
  );
  const coordinates = scaled.meshes[0].geometry.attributes.TEXCOORD_1.value;
  const distance = Math.hypot(
    (coordinates[2] - coordinates[0]) * options.width,
    (coordinates[3] - coordinates[1]) * options.height
  );
  expect(distance).toBeCloseTo(2 * options.texelsPerUnit, 4);
  expect(validateLightmapAtlas(scaled)).toEqual([]);
});

test('unindexed geometry and UV set zero work without overwriting source UVs', () => {
  const first = createLightmapAtlas([{id: 'mesh', geometry: makeGeometry()}], options);
  const second = createLightmapAtlas([{id: 'mesh', geometry: first.meshes[0].geometry}], {
    ...options,
    uvSet: 0
  });
  expect(second.uvSet).toBe(0);
  expect(validateLightmapAtlas(second)).toEqual([]);
  expect(second.meshes[0].geometry.attributes.TEXCOORD_1.value).toEqual(
    first.meshes[0].geometry.attributes.TEXCOORD_1.value
  );
});

test('invalid or unrepresentable preparation fails explicitly', () => {
  const geometry = makeGeometry();
  const inputs = [{id: 'mesh', geometry}];
  expect(() => createLightmapAtlas(inputs, {...options, width: 2})).toThrow();
  expect(() => createLightmapAtlas(inputs, {...options, texelsPerUnit: Infinity})).toThrow();
  expect(() => createLightmapAtlas(inputs, {...options, padding: -1})).toThrow();
  expect(() => createLightmapAtlas([...inputs, ...inputs], options)).toThrow();
  expect(() =>
    createLightmapAtlas([{...inputs[0], modelMatrix: new Matrix4().scale([0, 0, 0])}], options)
  ).toThrow();
  geometry.attributes.POSITION.value[0] = NaN;
  expect(() => createLightmapAtlas(inputs, options)).toThrow();
});

test('diagnostics detect overlapping allocations, ownership damage and invalid UVs', () => {
  const atlas = createLightmapAtlas([{id: 'mesh', geometry: makeGeometry()}], options);
  const debug = getLightmapAtlasDebugData(atlas);
  expect(debug.length).toBe(options.width * options.height * 4);
  expect(debug[3]).toBe(255);
  const chart = atlas.charts[0];
  atlas.chartOwners[chart.rectangle.y * atlas.width + chart.rectangle.x] = 0;
  expect(validateLightmapAtlas(atlas)).toContain('Chart 1 has inconsistent gutter ownership');
  atlas.charts[1].rectangle = {...chart.rectangle};
  expect(validateLightmapAtlas(atlas)).toContain('Chart 2 overlaps another chart');
  atlas.meshes[0].geometry.attributes.TEXCOORD_1.value[0] = NaN;
  expect(validateLightmapAtlas(atlas)).toContain('Chart 1 has UVs outside its padded rectangle');
});
