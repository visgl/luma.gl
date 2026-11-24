// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPURigidBody, GPURigidBodyJoint, GPURigidBodyState} from '@luma.gl/graph/gpu-physics';

/** The base pivot is two meters above the workbench, with one-meter links along +X. */
export const ARM_PIVOT_HEIGHT = 2;
export const ARM_JOINT_NAMES = ['shoulder', 'elbow', 'wrist', 'tool'];
export const ARM_TORQUE = 150;
export const ARM_STIFFNESS = 2400;

/** An instrumented planar arm; the payload is a distinct rigid body fixed to the end. */
export function makeRobotArm(payload = 1, links = 4, stop = true) {
  const bodies: GPURigidBody[] = [
    {mass: 0, position: [0, 0, -0.15], shape: {type: 'box', halfExtents: [6, 3, 0.15]}},
    {mass: 0, position: [0, 0, 1], shape: {type: 'box', halfExtents: [0.22, 0.32, 1]}}
  ];
  const joints: GPURigidBodyJoint[] = [];
  for (let index = 0; index < links; index++) {
    bodies.push({
      mass: 1,
      position: [index + 0.5, 0, ARM_PIVOT_HEIGHT],
      shape: {type: 'box', halfExtents: [0.5, 0.12, 0.12]}
    });
    const base = {
      type: 'general' as const,
      id: ARM_JOINT_NAMES[index],
      first: index + 1,
      second: index + 2,
      firstFrame: {position: (index === 0 ? [0, 0, 1] : [0.5, 0, 0]) as [number, number, number]},
      secondFrame: {position: [-0.5, 0, 0] as [number, number, number]}
    };
    joints.push(
      {...base, axes: [0, 1, 2], minimum: 0, maximum: 0},
      {...base, angular: true, axes: [0, 2], minimum: 0, maximum: 0},
      {
        ...base,
        angular: true,
        axes: [1],
        drive: {
          positionTarget: 0,
          velocityTarget: 0,
          stiffness: ARM_STIFFNESS,
          damping: 70,
          maximumForce: ARM_TORQUE
        }
      }
    );
  }
  const loadIndex = bodies.length;
  bodies.push({
    mass: payload,
    position: [links, 0, ARM_PIVOT_HEIGHT],
    shape: {type: 'sphere', radius: 0.25}
  });
  joints.push({
    type: 'fixed',
    first: loadIndex - 1,
    second: loadIndex,
    firstFrame: {position: [0.5, 0, 0]}
  });
  if (stop)
    bodies.push({
      mass: 0,
      position: [links - 0.45, 0, 0.52],
      shape: {type: 'box', halfExtents: [0.6, 0.5, 0.52]}
    });
  return {bodies, joints};
}

/** Independent planar forward kinematics. Positive elbow angle lowers the tool. */
export function measureRobotArm(states: GPURigidBodyState[], links: number, angle: number) {
  const load = states[links + 2].position;
  const targetX = links === 1 ? Math.cos(angle) : 1 + (links - 1) * Math.cos(angle);
  const targetZ = ARM_PIVOT_HEIGHT - (links === 1 ? 1 : links - 1) * Math.sin(angle);
  const pitch = (index: number) => {
    const [x, y, z, w] = states[index].orientation;
    return Math.atan2(2 * (w * y - x * z), 1 - 2 * (y * y + z * z));
  };
  return {
    tipError: Math.hypot(load[0] - targetX, load[1], load[2] - targetZ),
    angle: links === 1 ? pitch(2) : pitch(3) - pitch(2)
  };
}
