// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUSpherePlane, GPUSphereBodyState} from '@luma.gl/gpu-graph/gpu-physics';

export const BALL_RADIUS = 0.18;
export const POCKET_RADIUS = 0.39;
export const POCKETS: [number, number, number][] = [
  [-6, -3, BALL_RADIUS],
  [0, -3.13, BALL_RADIUS],
  [6, -3, BALL_RADIUS],
  [-6, 3, BALL_RADIUS],
  [0, 3.13, BALL_RADIUS],
  [6, 3, BALL_RADIUS]
];
export const TABLE_PLANES: GPUSpherePlane[] = [
  {
    halfExtents: [6, 3],
    restitution: 0,
    staticFriction: 0.25,
    dynamicFriction: 0.18,
    rollingResistance: 0.035,
    spinningResistance: 0.3
  },
  ...[-1, 1].flatMap((side): GPUSpherePlane[] => [
    ...[-1, 1].map(
      (half): GPUSpherePlane => ({
        normal: [0, -side, 0],
        center: [half * 3, side * 3, 0.2],
        halfExtents: [0.5, 2.6],
        restitution: 0.88,
        restitutionVelocityScale: 0.035,
        contactHeightRatio: 0.35,
        staticFriction: 0.22,
        dynamicFriction: 0.16,
        rollingResistance: 0
      })
    ),
    {
      normal: [-side, 0, 0],
      center: [side * 6, 0, 0.2],
      halfExtents: [0.5, 2.6],
      restitution: 0.88,
      restitutionVelocityScale: 0.035,
      contactHeightRatio: 0.35,
      staticFriction: 0.22,
      dynamicFriction: 0.16,
      rollingResistance: 0
    }
  ])
];

// Bevel the rail ends into the pocket mouths. The rectangular cloth and pocket
// triggers remain separate from these static jaw collision surfaces.
for (const horizontalSide of [-1, 1]) {
  for (const verticalSide of [-1, 1]) {
    for (const alongLongRail of [true, false]) {
      TABLE_PLANES.push({
        normal: alongLongRail
          ? [horizontalSide * 0.6, -verticalSide, 0]
          : [-horizontalSide, verticalSide * 0.6, 0],
        center: alongLongRail
          ? [horizontalSide * 5.725, verticalSide * 3.075, 0.2]
          : [horizontalSide * 6.075, verticalSide * 2.725, 0.2],
        halfExtents: [0.5, 0.146],
        restitution: 0.8,
        staticFriction: 0.22,
        dynamicFriction: 0.16,
        rollingResistance: 0,
        contactHeightRatio: 0.35,
        restitutionVelocityScale: 0.035
      });
    }
    TABLE_PLANES.push({
      normal: [-horizontalSide * 0.8, -verticalSide * 0.6, 0],
      center: [horizontalSide * 0.325, verticalSide * 3.1, 0.2],
      halfExtents: [0.5, 0.125],
      restitution: 0.8,
      staticFriction: 0.22,
      dynamicFriction: 0.16,
      rollingResistance: 0,
      contactHeightRatio: 0.35,
      restitutionVelocityScale: 0.035
    });
  }
}

export function makeRack(): Float32Array {
  const positions = new Float32Array(16 * 4);
  positions.set([-3, 0, BALL_RADIUS, BALL_RADIUS]);
  const order = [1, 9, 2, 10, 8, 3, 4, 11, 5, 12, 13, 6, 14, 7, 15];
  let cursor = 0;
  for (let row = 0; row < 5; row++) {
    for (let column = 0; column <= row; column++) {
      positions.set(
        [
          2 + row * Math.sqrt(3) * (BALL_RADIUS + 0.002),
          (column - row / 2) * (2 * BALL_RADIUS + 0.004),
          BALL_RADIUS,
          BALL_RADIUS
        ],
        order[cursor++] * 4
      );
    }
  }
  return positions;
}

/** Deterministic scratch recovery with clearance from every remaining ball. */
export function findCuePosition(
  states: readonly GPUSphereBodyState[]
): [number, number, number] | null {
  for (let column = 0; column < 8; column++) {
    for (let row = 0; row < 11; row++) {
      const point: [number, number, number] = [
        -3 - column * 0.3,
        (row % 2 ? 1 : -1) * Math.ceil(row / 2) * 0.42,
        BALL_RADIUS
      ];
      if (
        states.every(
          body =>
            body.index === 0 ||
            !body.enabled ||
            Math.hypot(body.position[0] - point[0], body.position[1] - point[1]) >
              body.radius + BALL_RADIUS + 0.02
        )
      )
        return point;
    }
  }
  return null;
}

export function isShotSettled(states: readonly GPUSphereBodyState[]): boolean {
  return states.every(
    body =>
      !body.enabled ||
      (Math.hypot(...body.velocity) < 0.035 && Math.hypot(...body.angularVelocity) < 0.15)
  );
}
