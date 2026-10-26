// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {statSync, existsSync} from 'node:fs';
import {createReferenceCache} from '../../scripts/physics/matched/build-reference.mjs';
import {
  makeMatchedFixture,
  makeMatchedWorld,
  MATCHED_SCENES
} from '../../examples/experimental/physics-stress/matched-fixtures';
import {
  axesForQuaternion,
  boxPenetration,
  measureQuality,
  initialStates,
  assessQuality,
  summarize
} from '../../scripts/physics/matched/metrics.mjs';
import {
  validateOptions,
  referenceInput,
  checkInitialState,
  checkMassProperties,
  isHardwareAdapter
} from '../../scripts/physics/matched/run.mjs';

test('fixtures are deterministic, seeded, and shared without changing body order or dimensions', () => {
  for (const scene of Object.keys(MATCHED_SCENES) as (keyof typeof MATCHED_SCENES)[]) {
    const fixture = makeMatchedFixture(scene, 4);
    expect(makeMatchedFixture(scene, 4)).toEqual(fixture);
    const props = makeMatchedWorld(fixture, 1 / 240);
    expect(props.bodies.map(body => body.position)).toEqual(
      fixture.bodies.map(body => body.position)
    );
    expect(props.bodies.map(body => body.shape?.type)).toEqual(fixture.bodies.map(() => 'box'));
    expect(props.sleepAfter).toBe(0);
    expect(props.joints?.length).toBe(fixture.joints.length);
    const values = referenceInput(fixture, validateOptions({frames: 12, warmup: 2}), false)
      .split(' ')
      .map(Number);
    expect(values).toHaveLength(13 + fixture.bodies.length * 19 + fixture.joints.length * 3);
    expect(values.slice(13, 16)).toEqual(fixture.bodies[0].position);
  }
  expect(makeMatchedFixture('matchedMixed', 4, 1)).not.toEqual(
    makeMatchedFixture('matchedMixed', 4, 2)
  );
});
test('invalid and unsupported comparison inputs are rejected before launching engines', () => {
  expect(() => validateOptions({frames: 10, warmup: 10})).toThrow();
  expect(() => validateOptions({substeps: 0})).toThrow();
  expect(() => validateOptions({repeats: 1.5})).toThrow();
  expect(() => makeMatchedFixture('matchedChain', 65)).toThrow();
  expect(() => makeMatchedFixture('matchedPile', 0)).toThrow();
});
test('independent OBB metric handles rotated overlap, separation and containment', () => {
  const body = {halfExtents: [1, 1, 1]};
  const first = {position: [0, 0, 0], orientation: [0, 0, 0, 1]};
  expect(boxPenetration(body, first, body, {...first, position: [1.5, 0, 0]})).toBeCloseTo(0.5);
  expect(boxPenetration(body, first, body, {...first, position: [3, 0, 0]})).toBe(0);
  expect(boxPenetration(body, first, {halfExtents: [0.2, 0.2, 0.2]}, first)).toBeCloseTo(1.2);
  const rotation = [0, 0, Math.sin(Math.PI / 8), Math.cos(Math.PI / 8)];
  expect(axesForQuaternion(rotation)[0][0]).toBeCloseTo(Math.SQRT1_2);
  expect(
    boxPenetration(body, first, body, {position: [2.3, 0, 0], orientation: rotation})
  ).toBeCloseTo(1 + Math.SQRT2 - 2.3);
});
test('quality checks an analytic ballistic oracle rather than treating Box3D as ground truth', () => {
  const fixture = makeMatchedFixture('matchedBallistic', 1);
  const initial = initialStates(fixture);
  const states = structuredClone(initial);
  states[0].position = [1, 0, 10 + 2 - 9.81 / 2];
  states[0].velocity = [1, 0, 2 - 9.81];
  const quality = measureQuality(
    fixture,
    [
      {step: 0, states: initial},
      {step: 60, states}
    ],
    1 / 60
  );
  expect(quality.maximumBallisticError).toBeCloseTo(0);
  expect(quality.maximumEnergyGain).toBeCloseTo(0);
  expect(assessQuality(quality).passed).toBe(true);
  states[0].position[2] += 1;
  expect(assessQuality(measureQuality(fixture, [{step: 60, states}], 1 / 60)).failures).toContain(
    'maximumBallisticError'
  );
});
test('quality detects escaped fast bodies, joint drift, invalid state and adapter mismatches', () => {
  const fixture = makeMatchedFixture('matchedFast', 1),
    states = initialStates(fixture);
  states[2].position = [8, 0, 0];
  const quality = measureQuality(fixture, [{step: 1, states}], 1 / 60);
  expect(quality.escapedBodies).toBe(1);
  expect(assessQuality(quality).passed).toBe(false);
  expect(checkInitialState(fixture, [{step: 0, states}])).toBe(false);
  const chain = makeMatchedFixture('matchedChain', 2),
    chainStates = initialStates(chain);
  chainStates[2].position = [10, 0, 0];
  expect(
    measureQuality(chain, [{step: 1, states: chainStates}], 1 / 60).maximumJointError
  ).toBeGreaterThan(1);
  states[2].position[0] = NaN;
  expect(measureQuality(fixture, [{step: 1, states}], 1 / 60).valid).toBe(false);
  expect(assessQuality({valid: false}).passed).toBe(false);
});
test('timing summaries use nearest-rank percentiles and reject nonfinite samples', () => {
  expect(summarize([1, 2, 3, 4, 5])).toEqual({count: 5, median: 3, p95: 5, maximum: 5});
  expect(summarize([1, NaN])).toBeNull();
  expect(summarize([])).toBeNull();
});

test('matching audits mass and the inertia tensor rather than accepting equal poses alone', () => {
  const fixture = makeMatchedFixture('matchedFast', 1);
  const parameters = fixture.bodies.map(body => ({
    mass: body.mass,
    inertia: body.halfExtents.map(
      (_, axis) =>
        (body.mass / 3) *
        body.halfExtents.reduce((sum, extent, index) => sum + (index === axis ? 0 : extent ** 2), 0)
    )
  }));
  expect(checkMassProperties(fixture, parameters)).toBe(true);
  parameters[2].inertia[0] *= 2;
  expect(checkMassProperties(fixture, parameters)).toBe(false);
});

test('large stack fixtures keep every box over the supporting slab', () => {
  for (const count of [32, 512, 2048, 4096]) {
    const {bodies} = makeMatchedFixture('matchedStack', count);
    const slab = bodies[0];
    for (const body of bodies.slice(1)) {
      for (const axis of [0, 1])
        expect(
          Math.abs(body.position[axis] - slab.position[axis]) + body.halfExtents[axis]
        ).toBeLessThanOrEqual(slab.halfExtents[axis]);
    }
  }
});

test('hardware ratios require positively identified hardware on every replay', () => {
  expect(isHardwareAdapter({fallback: false, gpu: 'unknown', gpuType: 'unknown'})).toBe(false);
  expect(isHardwareAdapter({fallback: false, gpu: 'software', gpuType: 'discrete'})).toBe(false);
  expect(isHardwareAdapter({fallback: true, gpu: 'nvidia', gpuType: 'discrete'})).toBe(false);
  expect(isHardwareAdapter({gpu: 'apple', gpuType: 'integrated'})).toBe(false);
  expect(isHardwareAdapter({fallback: false, gpu: 'apple', gpuType: 'integrated'})).toBe(true);
  expect(isHardwareAdapter({fallback: false, gpu: 'nvidia', gpuType: 'discrete'})).toBe(true);
});

test('reference caches are private, unique and explicitly disposable', () => {
  const first = createReferenceCache();
  const second = createReferenceCache();
  try {
    expect(first.root).not.toBe(second.root);
    for (const directory of [first, second]) {
      const metadata = statSync(directory.root);
      expect(metadata.isDirectory()).toBe(true);
      if (process.platform !== 'win32') expect(metadata.mode & 0o077).toBe(0);
    }
  } finally {
    first.destroy();
    second.destroy();
  }
  expect(existsSync(first.root)).toBe(false);
  expect(existsSync(second.root)).toBe(false);
  expect(() => first.destroy()).not.toThrow();
});
