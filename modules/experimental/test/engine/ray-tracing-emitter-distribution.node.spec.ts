// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geometry} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {expect, it} from 'vitest';
import {makeEmitterDistribution} from '../../src/engine/ray-tracing-emitter-distribution';
import type {SceneSurface} from '../../src/engine/scene-renderer';

const geometry = new Geometry({
  topology: 'triangle-list',
  attributes: {POSITION: {size: 3, value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])}}
});
const surface: SceneSurface = {
  id: 'light',
  geometry,
  material: {id: 'emissive', uniforms: {emissiveFactor: [1, 1, 1]}},
  transforms: [new Matrix4(), new Matrix4().scale([2, 3, 1])]
};

it('preserves empty and uniform selection without reading geometry', () => {
  expect(makeEmitterDistribution([])).toEqual([]);
  expect(makeEmitterDistribution([3, 7])).toEqual([
    {probability: 0.5, cumulative: 0.5},
    {probability: 0.5, cumulative: 1}
  ]);
});

it('weights transformed world area and compensates the estimator by selection probability', () => {
  const distribution = makeEmitterDistribution([0, 1], {
    surfaces: [surface],
    emitterSelection: 'power'
  });
  expect(distribution[0].probability).toBeCloseTo(0.99 / 7 + 0.005, 6);
  expect(distribution[1].probability).toBeCloseTo((0.99 * 6) / 7 + 0.005, 6);
  const contributions = [0.5, 3];
  const expectation = distribution.reduce(
    (total, entry, index) => total + (entry.probability * contributions[index]) / entry.probability,
    0
  );
  expect(expectation).toBeCloseTo(3.5, 8);
  const variance = distribution.reduce(
    (total, entry, index) =>
      total + entry.probability * (contributions[index] / entry.probability - expectation) ** 2,
    0
  );
  expect(variance).toBeLessThan(0.01);
});

it('uses luminance and emission strength, with nonzero probability for dim emitters', () => {
  const distribution = makeEmitterDistribution([0, 1], {
    emitterSelection: 'power',
    surfaces: [
      {...surface, transforms: [new Matrix4()]},
      {
        ...surface,
        id: 'dim',
        transforms: [new Matrix4()],
        material: {id: 'dim', uniforms: {emissiveFactor: [1, 1, 1], emissiveStrength: 0}}
      }
    ]
  });
  expect(distribution[0].probability).toBeCloseTo(0.995, 6);
  expect(distribution[1].probability).toBeCloseTo(0.005, 6);
  expect(distribution[1].cumulative).toBe(1);
});

it('weights uniform-scale analytic spheres by area and falls back for degenerate meshes', () => {
  const distribution = makeEmitterDistribution([0, 1], {
    surfaces: [{...surface, transforms: [new Matrix4(), new Matrix4().scale(2)]}],
    primitives: {light: {type: 'sphere', radius: 1}},
    emitterSelection: 'power'
  });
  expect(distribution[0].probability).toBeCloseTo(0.99 / 5 + 0.005, 6);
  const degenerate = new Geometry({
    topology: 'triangle-list',
    attributes: {POSITION: {size: 3, value: new Float32Array(9)}}
  });
  expect(
    makeEmitterDistribution([0, 1], {
      surfaces: [{...surface, geometry: degenerate}],
      emitterSelection: 'power'
    })
  ).toEqual(makeEmitterDistribution([0, 1]));
});

it('keeps large float32 CDFs monotone and probabilities equal to uploaded intervals', () => {
  const distribution = makeEmitterDistribution(Array.from({length: 100000}, (_, index) => index));
  let previous = 0;
  for (const entry of distribution) {
    expect(entry.probability).toBeGreaterThan(0);
    expect(entry.probability).toBe(entry.cumulative - previous);
    expect(entry.cumulative).toBeLessThanOrEqual(1);
    previous = entry.cumulative;
  }
  expect(previous).toBe(1);
});
