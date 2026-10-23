// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {GPURigidBody} from '@luma.gl/graph/gpu-physics';
export const DOCK: [number, number, number] = [-14, 7, 0];
export const CARGO_IDS = [1, 2, 3, 4, 5];
export function makeSalvageScene(): GPURigidBody[] {
  const bodies: GPURigidBody[] = [
    {
      position: [-11, 2, 0],
      mass: 2,
      shape: {type: 'sphere', radius: 0.65},
      inertiaDiagonal: [0, 0, 0],
      restitution: 0.25,
      friction: 0.2
    }
  ];
  for (const position of [
    [-7, 6, 0],
    [3, 7, 0],
    [12, -5, 0],
    [-6, -7, 0],
    [13, 7, 0]
  ] as const)
    bodies.push({
      position,
      mass: 1.5,
      shape: {type: 'box', halfExtents: [0.6, 0.6, 0.6]},
      inertiaDiagonal: [0, 0, 0.36],
      restitution: 0.35,
      friction: 0.2
    });
  for (let index = 0; index < 9; index++) {
    const angle = index * 2.39996;
    bodies.push({
      position: [Math.cos(angle) * (6 + index * 0.7), Math.sin(angle) * (3 + index * 0.5), 0],
      velocity: [Math.sin(angle) * 0.25, Math.cos(angle) * 0.25, 0],
      angularVelocity: [0, 0, 0.1 * (index % 2 ? 1 : -1)],
      mass: 4,
      shape:
        index % 2
          ? {type: 'box', halfExtents: [0.7 + index * 0.04, 0.9, 0.65]}
          : {type: 'sphere', radius: 0.9 + index * 0.04},
      inertiaDiagonal: [0, 0, 3],
      restitution: 0.45,
      friction: 0.2
    });
  }
  for (const [position, halfExtents] of [
    [
      [-20.5, 0, 0],
      [0.5, 13, 1]
    ],
    [
      [20.5, 0, 0],
      [0.5, 13, 1]
    ],
    [
      [0, -12.5, 0],
      [20, 0.5, 1]
    ],
    [
      [0, 12.5, 0],
      [20, 0.5, 1]
    ]
  ] as const)
    bodies.push({position, mass: 0, shape: {type: 'box', halfExtents}, restitution: 0.3});
  return bodies;
}
