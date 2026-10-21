// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPURigidBody} from '@luma.gl/gpgpu/gpu-physics';

export const RIGID_BODY_SCENES = {
  stack: {
    title: 'Independent stacks',
    description:
      'Three five-box stacks share a static floor. Each stack can sleep independently. Push the first stack to test waking and friction; gray bodies are sleeping.'
  },
  mixed: {
    title: 'Mixed-shape field',
    description:
      '256 boxes and spheres with varied sizes land on one large floor. This exercises hierarchical discovery and sparse contact storage beyond the 128-body all-pairs reference limit. It is a moderate-density scene, not a dense-stack performance claim.'
  },
  impact: {
    title: 'Unequal-mass impact',
    description:
      'A unit-mass sphere strikes a stationary sphere of mass two without gravity or friction. At restitution one, the light sphere reverses direction. The colored bands expose rotation. Reset to replay.'
  },
  torque: {
    title: 'Off-center impact',
    description:
      'A sphere strikes a heavier box away from its center. Contact impulses transfer both linear momentum and angular momentum. Reset or push the box to explore rotation.'
  }
};
export type RigidBodyScene = keyof typeof RIGID_BODY_SCENES;

export function makeRigidBodyScene(scene: RigidBodyScene): GPURigidBody[] {
  if (scene === 'impact')
    return [
      {
        shape: {type: 'sphere', radius: 0.5},
        position: [-2, 0, 1],
        velocity: [3, 0, 0],
        mass: 1,
        restitution: 1,
        friction: 0
      },
      {
        shape: {type: 'sphere', radius: 0.5},
        position: [0, 0, 1],
        mass: 2,
        restitution: 1,
        friction: 0
      }
    ];
  const bodies: GPURigidBody[] = [
    {
      shape: {type: 'box', halfExtents: [14, 14, 0.5]},
      position: [0, 0, -0.5],
      mass: 0,
      restitution: 0,
      friction: 0.7
    }
  ];
  if (scene === 'torque') {
    bodies.push({
      shape: {type: 'box', halfExtents: [0.8, 0.45, 0.6]},
      position: [0, 0, 0.6],
      mass: 3
    });
    bodies.push({
      shape: {type: 'sphere', radius: 0.35},
      position: [-4, 0.3, 0.7],
      velocity: [6, 0, 0],
      restitution: 0.5
    });
  } else if (scene === 'mixed') {
    for (let index = 0; index < 256; index++) {
      const radius = 0.25 + (index % 4) * 0.05;
      bodies.push({
        shape:
          index % 2
            ? {type: 'sphere', radius}
            : {type: 'box', halfExtents: [radius, radius, radius]},
        position: [
          ((index % 16) - 7.5) * 1.4,
          (Math.floor(index / 16) - 7.5) * 1.4,
          1 + (index % 5) * 0.35
        ],
        restitution: 0.15,
        friction: 0.6
      });
    }
  } else {
    for (let tower = 0; tower < 3; tower++)
      for (let level = 0; level < 5; level++) {
        const angle = tower === 1 ? 0.25 : 0;
        bodies.push({
          shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]},
          position: [(tower - 1) * 2.5, 0, 0.5 + level * 1.01],
          orientation: [0, 0, Math.sin(angle / 2), Math.cos(angle / 2)],
          restitution: 0,
          friction: 0.7
        });
      }
  }
  return bodies;
}
