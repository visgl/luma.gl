// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPUArticulationTree,
  GPURigidBodyWorld,
  getBodyInertia,
  type GPUArticulationLink,
  type GPURigidBody,
  type GPURigidBodyJoint
} from '@luma.gl/graph/gpu-physics';

export const GRIPPER_PHASES = ['Open', 'Grip', 'Lift', 'Carry', 'Lower', 'Release'] as const;
export const DESTINATION_ANGLE = 1;
export const REACH = 1.4;
type Vector = [number, number, number];

/** Build both formulations from the same revolute axes, offsets, inertias and force drives. */
export function makeGripperTrial(reduced: boolean, friction = 0.9, publish = false) {
  const base: Vector = [0, 0, 0.98];
  const box: Vector = [0.19, 0.2, 0.24];
  const padRadius = 0.095;
  const bodies: GPURigidBody[] = [
    {
      position: [0, 0, -0.12],
      mass: 0,
      shape: {type: 'box', halfExtents: [3, 3, 0.12]},
      friction: 0.65 ** 2
    },
    {position: [0, 0, 0.4], mass: 0, shape: {type: 'sphere', radius: 0.055}}
  ];
  const joints: GPURigidBodyJoint[] = [];
  const links: GPUArticulationLink[] = [];
  const axes: number[] = [];
  function link(
    id: string,
    parent: number,
    parentAnchor: Vector,
    childAnchor: Vector,
    axisIndex: number,
    position: Vector,
    mass: number,
    shape: {type: 'sphere'; radius: number} | {type: 'box'; halfExtents: Vector}
  ) {
    const index = links.length;
    const axis: Vector = [0, 0, 0];
    axis[axisIndex] = 1;
    links.push({
      id,
      parent,
      parentAnchor,
      childAnchor,
      axis,
      mass,
      inertia: getBodyInertia(mass, shape)
    });
    axes.push(axisIndex);
    bodies.push({position, mass, shape, friction: friction ** 2, restitution: 0});
    const frame = {
      id,
      type: 'general' as const,
      first: parent + 2,
      second: index + 2,
      firstFrame: {position: parent === -1 ? ([0, 0, 0.58] as Vector) : parentAnchor},
      secondFrame: {position: childAnchor}
    };
    joints.push(
      {...frame, axes: [0, 1, 2], minimum: 0, maximum: 0},
      {
        ...frame,
        angular: true,
        axes: [0, 1, 2].filter(i => i !== axisIndex) as (0 | 1 | 2)[],
        minimum: 0,
        maximum: 0
      },
      {
        ...frame,
        angular: true,
        axes: [axisIndex as 0 | 1 | 2],
        drive: {
          positionTarget: 0,
          velocityTarget: 0,
          stiffness: 900,
          damping: 45,
          maximumForce: 100
        }
      }
    );
  }
  link('turret', -1, [0, 0, 0], [0, 0, 0], 2, base, 1, {type: 'sphere', radius: 0.085});
  link('boom', 0, [0, 0, 0], [-REACH / 2, 0, 0], 1, [REACH / 2, 0, base[2]], 1, {
    type: 'box',
    halfExtents: [REACH / 2, 0.055, 0.055]
  });
  for (const sign of [-1, 1]) {
    link(
      sign < 0 ? 'left' : 'right',
      1,
      [REACH / 2, sign * 0.41, 0],
      [0, 0, 0.74],
      0,
      [REACH, sign * 0.41, 0.24],
      0.3,
      {type: 'sphere', radius: padRadius}
    );
  }
  const position: Vector = [REACH, 0, box[2]];
  bodies.push({
    position,
    mass: 1,
    shape: {type: 'box', halfExtents: box},
    // Ordered combines collider friction using the geometric mean.
    friction: 1,
    restitution: 0
  });
  const world = reduced
    ? new GPUArticulationTree({
        base,
        links,
        publishMatrices: publish,
        payload: {
          mass: 1,
          position,
          halfExtents: box,
          pads: [
            {link: 'left', radius: padRadius},
            {link: 'right', radius: padRadius}
          ],
          friction,
          supportFriction: 0.65,
          supportHeight: 0
        }
      })
    : new GPURigidBodyWorld({
        bodies,
        joints,
        solver: 'ordered',
        iterations: 64,
        timeStep: 1 / 120,
        gravity: [0, 0, -9.81],
        publishPoses: publish
      });
  const phases = [
    [0, -0.024, 0],
    [0, -0.024, 0.36],
    [0, -0.38, 0.36],
    [DESTINATION_ANGLE, -0.38, 0.36],
    [DESTINATION_ANGLE, -0.024, 0.36],
    [DESTINATION_ANGLE, -0.024, 0]
  ];
  return {
    world,
    bodies,
    command(phase: number, step = 0) {
      const fraction = Math.min(1, step / 120);
      const blend = fraction * fraction * (3 - 2 * fraction);
      const [yaw, pitch, grip] = phases[phase].map(
        (goal, index) =>
          phases[Math.max(0, phase - 1)][index] +
          blend * (goal - phases[Math.max(0, phase - 1)][index])
      );
      const targets = [yaw, pitch, grip, -grip];
      links.forEach((joint, index) => {
        const angle = targets[index];
        const maximumTorque = index >= 2 ? 32 : 100;
        if (world instanceof GPUArticulationTree)
          world.setDrive(joint.id, {angle, stiffness: 900, damping: 45, maximumTorque});
        else world.setAngularActuator(joint.id, axes[index] as 0 | 1 | 2, {angle, maximumTorque});
      });
    },
    async positions() {
      const states = await world.readState();
      return states.slice(reduced ? 0 : 2).map(state => state.position);
    }
  };
}
