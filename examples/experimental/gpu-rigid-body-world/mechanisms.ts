// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPURigidBody, GPURigidBodyJoint} from '@luma.gl/graph/gpu-physics';

import type {GroupNode} from '@luma.gl/engine';
import {makeCradleFrame, makeCradleFrameBodies} from './cradle-geometry';

export function makeMechanism(
  scene: string
): {bodies: GPURigidBody[]; joints: GPURigidBodyJoint[]; frame?: GroupNode} | null {
  const anchor: GPURigidBody = {
    position: [0, 0, 4],
    mass: 0,
    shape: {type: 'box', halfExtents: [0.2, 0.2, 0.2]}
  };
  const floor: GPURigidBody = {
    position: [0, 0, -0.5],
    mass: 0,
    shape: {type: 'box', halfExtents: [8, 8, 0.5]}
  };
  if (scene === 'suspension')
    return {
      bodies: [
        floor,
        {...anchor, position: [0, 0, 4]},
        {position: [0, 0, 2], mass: 2, shape: {type: 'box', halfExtents: [0.8, 0.5, 0.25]}}
      ],
      joints: [
        {type: 'distance', first: 1, second: 2, distance: 1.5, spring: {stiffness: 80, damping: 6}}
      ]
    };
  if (scene === 'servo')
    return {
      bodies: [
        floor,
        {...anchor, position: [0, 0, 3]},
        {position: [0, 0, 3], shape: {type: 'box', halfExtents: [1.5, 0.2, 0.2]}}
      ],
      joints: [
        {
          type: 'hinge',
          first: 1,
          second: 2,
          limits: [-1.2, 1.2],
          motor: {position: 0.8, stiffness: 40, damping: 8, maximumForce: 15}
        }
      ]
    };
  if (scene === 'pendulum')
    return {
      bodies: [floor, anchor, {position: [1.5, 0, 2], shape: {type: 'sphere', radius: 0.4}}],
      joints: [{type: 'distance', first: 1, second: 2, distance: 2.5}]
    };
  if (scene === 'cradle') {
    const bodies: GPURigidBody[] = [floor];
    const joints: GPURigidBodyJoint[] = [];
    for (let index = 0; index < 5; index++) {
      const horizontal = (index - 2) * 0.81;
      const angle = index === 0 ? -0.65 : 0;
      const first = bodies.length;
      bodies.push(
        {
          ...anchor,
          position: [horizontal, 0, 4],
          shape: {type: 'box', halfExtents: [0.08, 0.08, 0.08]}
        },
        {
          position: [horizontal + 2.5 * Math.sin(angle), 0, 4 - 2.5 * Math.cos(angle)],
          mass: 1,
          shape: {type: 'sphere', radius: 0.4},
          restitution: 0.985,
          friction: 0.02
        }
      );
      joints.push({type: 'distance', first, second: first + 1, distance: 2.5});
    }
    const frame = makeCradleFrame();
    bodies.push(...makeCradleFrameBodies(frame));
    return {bodies, joints, frame};
  }
  if (scene === 'hinge')
    return {
      bodies: [
        floor,
        anchor,
        {position: [0, 0, 2.5], shape: {type: 'box', halfExtents: [0.2, 0.2, 1.5]}},
        {position: [1.8, 0, 0.5], shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]}}
      ],
      joints: [
        {
          type: 'hinge',
          first: 1,
          second: 2,
          firstFrame: {orientation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2]},
          secondFrame: {position: [0, 0, 1.5], orientation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2]},
          limits: [-1.1, 1.1],
          motor: {velocity: 0.6, maximumForce: 20}
        }
      ]
    };
  if (scene === 'slider')
    return {
      bodies: [
        floor,
        {position: [0, 0, 1], mass: 0, shape: {type: 'box', halfExtents: [0.15, 0.15, 0.15]}},
        {position: [0, 0, 1], shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]}},
        {position: [1.6, 0, 0.5], shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]}}
      ],
      joints: [
        {
          type: 'slider',
          first: 1,
          second: 2,
          firstFrame: {orientation: [0, Math.SQRT1_2, 0, Math.SQRT1_2]},
          secondFrame: {orientation: [0, Math.SQRT1_2, 0, Math.SQRT1_2]},
          limits: [-2, 2],
          motor: {velocity: 1, maximumForce: 30}
        }
      ]
    };
  return null;
}
