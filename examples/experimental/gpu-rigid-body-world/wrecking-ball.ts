// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPURigidBody, GPURigidBodyJoint} from '@luma.gl/graph/gpu-physics';

export const WRECKING_BALL_BODY_INDEX = 2;
export const WRECKING_BALL_TIME_STEP = 1 / 60;
export const WRECKING_BALL_PHYSICS = {
  timeStep: WRECKING_BALL_TIME_STEP,
  iterations: 16,
  maximumPairs: 2048,
  linearDamping: 0.04,
  angularDamping: 0.08,
  maximumRecoverySpeed: 0.5
};

export const WRECKING_BALL_LEVELS = 8;
export const WRECKING_BALL_LENGTH = 10;
export const WRECKING_BALL_ANCHOR = [0, 0, 12] as const;
export const WRECKING_BALL_ANGLE = -0.95;

/** A square stepped pyramid, demolished by a free distance-constrained pendulum. */
export function makeWreckingBall(): {bodies: GPURigidBody[]; joints: GPURigidBodyJoint[]} {
  const bodies: GPURigidBody[] = [
    {position: [0, 0, -0.5], mass: 0, shape: {type: 'box', halfExtents: [18, 12, 0.5]}},
    {
      position: WRECKING_BALL_ANCHOR,
      mass: 0,
      shape: {type: 'box', halfExtents: [0.18, 0.18, 0.18]}
    },
    {
      position: [
        WRECKING_BALL_ANCHOR[0] + WRECKING_BALL_LENGTH * Math.sin(WRECKING_BALL_ANGLE),
        0,
        WRECKING_BALL_ANCHOR[2] - WRECKING_BALL_LENGTH * Math.cos(WRECKING_BALL_ANGLE)
      ],
      mass: 650,
      shape: {type: 'sphere', radius: 1.1},
      friction: 0.45,
      restitution: 0.05
    },
    ...[-5.5, 5.5].map<GPURigidBody>(horizontal => ({
      position: [0, horizontal, 6],
      mass: 0,
      shape: {type: 'box' as const, halfExtents: [0.2, 0.2, 6]}
    })),
    {position: [0, 0, 12.2], mass: 0, shape: {type: 'box', halfExtents: [0.25, 5.7, 0.25]}}
  ];
  for (let level = 0; level < WRECKING_BALL_LEVELS; level++) {
    const width = WRECKING_BALL_LEVELS - level;
    for (let row = 0; row < width; row++) {
      for (let column = 0; column < width; column++) {
        bodies.push({
          position: [
            (column - (width - 1) / 2) * 1.01,
            (row - (width - 1) / 2) * 1.01,
            level + 0.5
          ],
          mass: 1,
          shape: {type: 'box', halfExtents: [0.49, 0.49, 0.5]},
          friction: 0.65,
          restitution: 0
        });
      }
    }
  }
  return {
    bodies,
    joints: [{type: 'distance', first: 1, second: 2, distance: WRECKING_BALL_LENGTH}]
  };
}
