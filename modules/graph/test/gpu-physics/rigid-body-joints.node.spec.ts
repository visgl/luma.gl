// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {GPURigidBodyWorld, type GPURigidBodyJoint} from '../../src/gpu-physics';
const bodies = [0, 1].map(position => ({
  position: [position, 0, 0] as [number, number, number],
  shape: {type: 'sphere' as const, radius: 0.2}
}));
it('rejects invalid joint envelopes before GPU allocation', () => {
  const joint: GPURigidBodyJoint = {type: 'hinge', first: 0, second: 1};
  expect(() => new GPURigidBodyWorld({bodies, solver: 'parallel', joints: [joint]})).toThrow();
  expect(() => new GPURigidBodyWorld({bodies, joints: Array(65).fill(joint)})).toThrow();
  expect(() => new GPURigidBodyWorld({bodies, joints: [{...joint, second: 0}]})).toThrow();
  expect(() => new GPURigidBodyWorld({bodies, joints: [{...joint, limits: [-4, 4]}]})).toThrow();
  expect(
    () =>
      new GPURigidBodyWorld({bodies, joints: [{...joint, motor: {velocity: 1, maximumForce: -1}}]})
  ).toThrow();
  expect(
    () =>
      new GPURigidBodyWorld({
        bodies,
        joints: [{...joint, firstFrame: {position: [Infinity, 0, 0]}}]
      })
  ).toThrow();
});

it('accepts only static-anchored distance joints in parallel worlds', () => {
  const joint: GPURigidBodyJoint = {type: 'distance', first: 0, second: 1, distance: 1};
  expect(() => new GPURigidBodyWorld({bodies, solver: 'parallel', joints: [joint]})).toThrow();
  const anchoredBodies = [{...bodies[0], mass: 0}, bodies[1]];
  expect(
    () => new GPURigidBodyWorld({bodies: anchoredBodies, solver: 'parallel', joints: [joint]})
  ).not.toThrow();
  expect(
    () =>
      new GPURigidBodyWorld({
        bodies: anchoredBodies,
        solver: 'parallel',
        joints: [{...joint, type: 'fixed'}]
      })
  ).toThrow();
  expect(
    () =>
      new GPURigidBodyWorld({
        bodies: [{...bodies[0], mode: 'kinematic'}, bodies[1]],
        solver: 'parallel',
        joints: [joint]
      })
  ).toThrow();
});
