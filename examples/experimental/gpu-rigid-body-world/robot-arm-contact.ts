// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPUArticulationTree,
  GPURigidBodyWorld,
  getBodyInertia,
  type GPUArticulationLink
} from '@luma.gl/graph/gpu-physics';
import {ARM_JOINT_NAMES, ARM_STIFFNESS, makeRobotArm} from './robot-arm';

/** Both backends use the same four-link mechanism, payload and frictionless work stop. */
export function makeArmContactTrial(reduced: boolean, publishMatrices = false) {
  const {bodies, joints} = makeRobotArm(3);
  const payload = bodies[6].shape;
  const stop = bodies[7].shape;
  if (payload?.type !== 'sphere' || stop?.type !== 'box') throw new Error('Invalid arm fixture');
  const links = bodies.slice(2, 7).map((body, index): GPUArticulationLink => {
    const joint = joints.find(candidate => candidate.second === index + 2)!;
    const shape = body.shape;
    if (shape?.type !== 'box' && shape?.type !== 'sphere') throw new Error('Invalid link');
    return {
      id: joint.id ?? 'payload',
      parent: joint.first - 2,
      parentAnchor: joint.firstFrame!.position!,
      childAnchor: joint.secondFrame?.position ?? [0, 0, 0],
      axis: joint.type === 'fixed' ? undefined : [0, 1, 0],
      mass: body.mass!,
      inertia: getBodyInertia(body.mass!, shape)
    };
  });
  const world = reduced
    ? new GPUArticulationTree({
        links,
        base: bodies[1].position,
        publishMatrices,
        contact: {
          link: 'payload',
          radius: payload.radius,
          center: bodies[7].position,
          halfExtents: stop.halfExtents
        }
      })
    : new GPURigidBodyWorld({
        bodies: bodies.map(body => ({...body, friction: 0, restitution: 0})),
        joints,
        solver: 'ordered',
        iterations: 64,
        timeStep: 1 / 120,
        gravity: [0, 0, -9.81],
        publishPoses: publishMatrices
      });
  return {
    world,
    bodies,
    seatHeight: bodies[7].position[2] + stop.halfExtents[2] + payload.radius,
    command(press: boolean) {
      for (const id of ARM_JOINT_NAMES) {
        const angle = id === 'elbow' ? (press ? 0.65 : -0.3) : 0;
        const maximumTorque = id === 'elbow' && press ? 25 : 300;
        if (world instanceof GPUArticulationTree)
          world.setDrive(id, {angle, maximumTorque, stiffness: ARM_STIFFNESS, damping: 70});
        else world.setAngularActuator(id, 1, {angle, maximumTorque});
      }
    },
    async payloadHeight() {
      return (await world.readState())[reduced ? 4 : 6].position[2];
    }
  };
}
