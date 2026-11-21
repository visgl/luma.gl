// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {RigidBodyTerrainAtlas} from '../../src/gpu-physics/rigid-body-terrain-atlas';
import {
  getRigidBodyHeightFieldPageWords,
  packRigidBodyHeightField
} from '../../src/gpu-physics/rigid-body-height-field';

const grid = {width: 3, height: 3};
const otherGrid = {width: 17, height: 5};

/** Deterministic fixed-size binary data as consumed by the GPU. */
function makePage(height: number, dimensions = grid): Float32Array {
  return new Float32Array(
    packRigidBodyHeightField({
      ...dimensions,
      heights: new Float32Array(dimensions.width * dimensions.height).fill(height)
    }).data
  );
}

it('computes exact reservations for asymmetric and uneven grid splits', () => {
  for (const width of [2, 3, 9, 10, 17, 18, 32, 33, 34, 54]) {
    for (const height of [2, 3, 7, 18]) {
      const words = getRigidBodyHeightFieldPageWords(width, height);
      expect(packRigidBodyHeightField({width, height}).data.length).toBe(words);
      expect(words % 4).toBe(0);
    }
  }
});

it('shares identical payloads, rejects copy-on-write overflow atomically, and reuses the final release', () => {
  const atlas = new RigidBodyTerrainAtlas(
    [
      {...grid, pages: 1},
      {...otherGrid, pages: 1}
    ],
    [0, 1, 2].map(collider => ({collider, ...(collider === 2 ? otherGrid : grid)}))
  );
  const base = makePage(1);
  const changed = makePage(2);
  const initial = atlas.bind([
    {collider: 0, data: base},
    {collider: 1, data: makePage(1)},
    {collider: 2, data: makePage(1, otherGrid)}
  ]);
  expect(initial.uploads).toHaveLength(2);
  expect(initial.wordsByCollider.get(0)).toBe(initial.wordsByCollider.get(1));
  expect(initial.wordsByCollider.get(0)).not.toBe(initial.wordsByCollider.get(2));
  expect(atlas.getStats()).toMatchObject({residentSlots: 3, residentPages: 2});
  const snapshot = atlas.snapshot();
  expect(() => atlas.bind([{collider: 0, data: changed}])).toThrow('capacity exhausted');
  expect(atlas.snapshot()).toEqual(snapshot);
  const handoff = atlas.bind([
    {collider: 0, data: changed},
    {collider: 1, data: null}
  ]);
  expect(handoff.uploads).toHaveLength(1);
  expect(handoff.wordsByCollider.get(0)).toBe(initial.wordsByCollider.get(0));
  expect(atlas.bind([{collider: 1, data: changed}]).uploads).toHaveLength(0);
  atlas.restore(snapshot.leases, (_word, _words, pageIndex) => snapshot.payloads.get(pageIndex)!);
  expect(atlas.snapshot()).toEqual(snapshot);
  expect(atlas.bind([{collider: 1, data: makePage(1)}]).uploads).toHaveLength(0);
  expect(atlas.bind([{collider: 0, data: null}]).uploads).toHaveLength(0);
  expect(atlas.getStats()).toMatchObject({residentSlots: 2, residentPages: 2});
  atlas.bind([{collider: 1, data: null}]);
  expect(atlas.getStats()).toMatchObject({residentSlots: 1, residentPages: 1});
});

it('distinguishes validity, sampling orientation, and fractional heights using GPU bits', () => {
  const atlas = new RigidBodyTerrainAtlas(
    [{...grid, pages: 4}],
    Array.from({length: 5}, (_, collider) => ({collider, ...grid}))
  );
  const field = {...grid, heights: new Float32Array(9).fill(1)};
  const mask = new Uint8Array(9).fill(1);
  mask[0] = 0;
  const surfaces = [
    field,
    {...field, diagonal: '10-01' as const},
    {...field, validity: mask},
    {...field, heights: new Float32Array(9).fill(1 + 2 ** -20)},
    {...field, heights: new Float64Array(9).fill(1 + 2 ** -34)}
  ];
  const result = atlas.bind(
    surfaces.map((surface, collider) => ({
      collider,
      data: new Float32Array(packRigidBodyHeightField(surface).data)
    }))
  );
  expect(result.uploads).toHaveLength(4);
  expect(result.wordsByCollider.get(4)).toBe(result.wordsByCollider.get(0));
  expect(atlas.getStats().residentSlots).toBe(5);
});
