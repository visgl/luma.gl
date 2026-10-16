// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getSphereClothReference, getSphereCushionRestitution} from '../../src/gpu-physics';

// Ideal uniform solid sphere: sliding contact effective inverse mass is 7/(2m).
// Unit fixture: length in metres, time in seconds. No empirical calibration implied.
test('cloth references distinguish draw, stun and follow with published units', () => {
  const material = {
    speed: 1.4,
    radius: 0.028575,
    gravity: 9.81,
    slidingFriction: 0.2,
    rollingResistance: 0.01,
    spinningResistance: 0.02,
    sidespin: 10
  };
  const draw = getSphereClothReference({...material, rollingAngularSpeed: -1.4 / material.radius});
  const stun = getSphereClothReference({...material, rollingAngularSpeed: 0});
  const follow = getSphereClothReference({...material, rollingAngularSpeed: 1.4 / material.radius});
  expect(draw.rollingSpeed).toBeCloseTo(0.6, 6);
  expect(stun.rollingSpeed).toBeCloseTo(1, 6);
  expect(follow.rollingSpeed).toBeCloseTo(1.4, 6);
  expect(stun.slidingTime).toBeCloseTo(1.4 / (3.5 * 0.2 * 9.81), 6);
  expect(follow.slidingTime).toBe(0);
  expect(stun.sidespinStopTime).toBeCloseTo((10 * 0.028575) / (0.02 * 9.81), 6);
  expect(stun.rollingDistance).toBeCloseTo(1 / (2 * 0.01 * 9.81), 6);
});

test('cushion reference keeps pace-dependent retained energy bounded', () => {
  for (const speed of [0, 0.1, 1, 5, 12]) {
    const restitution = getSphereCushionRestitution(0.88, 0.035, speed);
    expect(restitution).toBeGreaterThan(0);
    expect(restitution).toBeLessThanOrEqual(0.88);
    expect(restitution ** 2).toBeLessThanOrEqual(1);
  }
  expect(getSphereCushionRestitution(0.88, 0.035, 12)).toBeLessThan(
    getSphereCushionRestitution(0.88, 0.035, 1)
  );
});

test('zero motion with zero resistance returns zero, while non-decaying motion is infinite', () => {
  const material = {
    radius: 1,
    gravity: 0,
    slidingFriction: 0,
    rollingResistance: 0,
    spinningResistance: 0
  };
  expect(
    getSphereClothReference({...material, speed: 0, rollingAngularSpeed: 0, sidespin: 0})
  ).toEqual({slidingTime: 0, rollingSpeed: 0, rollingDistance: 0, sidespinStopTime: 0});
  expect(
    getSphereClothReference({...material, speed: 1, rollingAngularSpeed: 0, sidespin: 1})
  ).toEqual({
    slidingTime: Infinity,
    rollingSpeed: 1,
    rollingDistance: Infinity,
    sidespinStopTime: Infinity
  });
});
