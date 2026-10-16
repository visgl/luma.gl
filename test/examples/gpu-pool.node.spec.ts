// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getSphereTriggerBodies, type GPUSphereBodyState} from '../../modules/gpgpu/src/gpu-physics';
import {
  makeRack,
  findCuePosition,
  isShotSettled,
  BALL_RADIUS,
  POCKETS,
  POCKET_RADIUS
} from '../../examples/experimental/gpu-pool/table';

function makeStates(): GPUSphereBodyState[] {
  const rack = makeRack();
  return Array.from({length: 16}, (_, index) => ({
    index,
    position: [rack[index * 4], rack[index * 4 + 1], rack[index * 4 + 2]],
    radius: BALL_RADIUS,
    enabled: true,
    velocity: [0, 0, 0],
    angularVelocity: [0, 0, 0],
    orientation: [0, 0, 0, 1],
    inverseMass: 1,
    sleeping: true
  }));
}

it('pool rack has 16 non-overlapping balls and the eight ball in the center', () => {
  const states = makeStates();
  expect(states[8].position[1]).toBe(0);
  for (const first of states)
    for (const second of states) {
      if (first.index !== second.index)
        expect(
          Math.hypot(...first.position.map((value, axis) => value - second.position[axis]))
        ).toBeGreaterThan(2 * BALL_RADIUS);
    }
});

it('pool pockets ignore disabled balls and scratch recovery finds a clear position', () => {
  const states = makeStates();
  states[0].position = [...POCKETS[0]];
  expect(getSphereTriggerBodies(states, POCKETS[0], POCKET_RADIUS).map(body => body.index)).toEqual(
    [0]
  );
  states[0].enabled = false;
  expect(getSphereTriggerBodies(states, POCKETS[0], POCKET_RADIUS)).toEqual([]);
  states[1].position = [-3, 0, BALL_RADIUS];
  const point = findCuePosition(states)!;
  expect(point).not.toEqual(states[1].position);
  expect(
    states
      .filter(body => body.index !== 0)
      .every(
        body =>
          Math.hypot(body.position[0] - point[0], body.position[1] - point[1]) > 2 * BALL_RADIUS
      )
  ).toBe(true);
});

it('pool shot completion waits for both translation and rotation', () => {
  const states = makeStates();
  expect(isShotSettled(states)).toBe(true);
  states[2].velocity = [1, 0, 0];
  expect(isShotSettled(states)).toBe(false);
  states[2].velocity = [0, 0, 0];
  states[2].angularVelocity = [0, 0, 1];
  expect(isShotSettled(states)).toBe(false);
  states[2].enabled = false;
  expect(isShotSettled(states)).toBe(true);
});
