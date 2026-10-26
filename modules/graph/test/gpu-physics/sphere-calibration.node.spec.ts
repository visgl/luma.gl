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

test('calibration recovers known coefficients with explicit analytic provenance', async () => {
  const {fitSphereCalibration} = await import('../../src/gpu-physics');
  const radius = 0.028575;
  const gravity = 9.81;
  const cloth = [-1, 0, 0.5, 1].map((spinRatio, index) => {
    const initialSpeed = 1 + index;
    const initialRollingAngularSpeed = (spinRatio * initialSpeed) / radius;
    const initialSidespin = 10 + index * 5;
    const reference = getSphereClothReference({
      speed: initialSpeed,
      rollingAngularSpeed: initialRollingAngularSpeed,
      sidespin: initialSidespin,
      radius,
      gravity,
      slidingFriction: 0.2,
      rollingResistance: 0.01,
      spinningResistance: 0.02
    });
    return {
      initialSpeed,
      initialRollingAngularSpeed,
      initialSidespin,
      ...reference,
      sidespinStopTime: reference.sidespinStopTime
    };
  });
  const dataset = {
    radius,
    gravity,
    cloth,
    provenance: {
      source: 'Uniform solid sphere Coulomb equations; synthetic SI fixtures',
      kind: 'analytic' as const
    },
    cushions: [0.2, 1, 3, 8].map(normalSpeed => ({
      normalSpeed,
      reboundSpeed: normalSpeed * getSphereCushionRestitution(0.88, 0.035, normalSpeed)
    }))
  };
  const fit = fitSphereCalibration(dataset);
  expect(fit.provenance.kind).toBe('analytic');
  expect(fit.slidingFriction).toBeCloseTo(0.2, 10);
  expect(fit.rollingResistance).toBeCloseTo(0.01, 10);
  expect(fit.spinningResistance).toBeCloseTo(0.02, 10);
  expect(fit.restitution).toBeCloseTo(0.88, 10);
  expect(fit.restitutionVelocityScale).toBeCloseTo(0.035, 10);
  expect(Math.max(...fit.residuals)).toBeLessThan(1e-10);
  expect(() =>
    fitSphereCalibration({...dataset, provenance: {...dataset.provenance, source: ''}})
  ).toThrow();
  expect(() =>
    fitSphereCalibration({...dataset, cushions: [dataset.cushions[0], dataset.cushions[0]]})
  ).toThrow(/Unidentifiable/);
});

test('committed SI fixture preserves its source and rejects unphysical calibration data', async () => {
  const {readFileSync} = await import('node:fs');
  const {fitSphereCalibration} = await import('../../src/gpu-physics');
  const dataset = JSON.parse(
    readFileSync(
      new URL('../../../../test/fixtures/gpu-physics/cloth-cushion-si.json', import.meta.url),
      'utf8'
    )
  );
  const result = fitSphereCalibration(dataset);
  expect(result.provenance).toEqual(dataset.provenance);
  const incomplete = JSON.parse(JSON.stringify(dataset));
  delete incomplete.cloth[0].initialRollingAngularSpeed;
  expect(() => fitSphereCalibration(incomplete)).toThrow();
  const overflowing = {...dataset, gravity: 1e200};
  expect(() => fitSphereCalibration(overflowing)).toThrow();
  expect(() =>
    fitSphereCalibration({...dataset, provenance: {...dataset.provenance, kind: 'measured-data'}})
  ).toThrow();
  expect(() =>
    fitSphereCalibration({
      ...dataset,
      cloth: dataset.cloth.map((observation: object) => ({...observation, rollingSpeed: -1}))
    })
  ).toThrow();
  expect(result.slidingFriction).toBeCloseTo(0.2, 10);
  expect(result.residuals.every(value => value < 1e-10)).toBe(true);
  expect(() =>
    fitSphereCalibration({
      ...dataset,
      cushions: [{normalSpeed: 1, reboundSpeed: 2}, ...dataset.cushions]
    })
  ).toThrow();
  expect(() =>
    fitSphereCalibration({
      ...dataset,
      cloth: dataset.cloth.map((observation: object) => ({...observation, slidingTime: 0}))
    })
  ).toThrow(/Unidentifiable/);
});
