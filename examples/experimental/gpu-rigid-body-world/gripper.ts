// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPUArticulationTree,
  GPURigidBodyWorld,
  getBodyInertia,
  type GPUArticulationLink,
  type GPUArticulationCollider,
  type GPURigidBody,
  type GPURigidBodyJoint
} from '@luma.gl/graph/gpu-physics';

import type {GPUCommandGraph} from '@luma.gl/graph/gpu-core';

import {
  RING_PIECES,
  RING_RETRACTION,
  ringAngle,
  STACK_RELEASE_ANGLE,
  BIN_LIFT_ANGLE,
  FINGER_LENGTH,
  BIN_ANGLES,
  BIN_DESTINATION,
  makeBinWorkcell,
  type BinScenario
} from './bin-workcell';
export const GRIPPER_PHASES = ['Open', 'Grip', 'Lift', 'Carry', 'Lower', 'Release'] as const;
export const DESTINATION_ANGLE = 1;
export const REACH = 1.4;
type Vector = [number, number, number];

/** Build both formulations from the same revolute axes, offsets, inertias and force drives. */
export function makeGripperTrial(
  reduced: boolean,
  friction = 0.9,
  publish = false,
  options: {
    mass?: number;
    torque?: number;
    id?: string;
    bin?: BinScenario;
    carrySteps?: number;
  } = {}
) {
  const bin = options.bin;
  const armBodyCount = bin?.ring ? 7 : 6;
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
    shape: {type: 'sphere'; radius: number} | {type: 'box'; halfExtents: Vector},
    jointType: 'revolute' | 'prismatic' = 'revolute'
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
      jointType,
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
    const allAxes: (0 | 1 | 2)[] = [0, 1, 2];
    const perpendicular = allAxes.filter(axis => axis !== axisIndex);
    const rotates = jointType === 'revolute';
    joints.push(
      {...frame, axes: rotates ? allAxes : perpendicular, minimum: 0, maximum: 0},
      {
        ...frame,
        angular: true,
        axes: rotates ? perpendicular : allAxes,
        minimum: 0,
        maximum: 0
      },
      {
        ...frame,
        angular: rotates,
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
  let slideDriveIndex = -1;
  if (bin?.ring) {
    link(
      'slide',
      1,
      [REACH / 2, 0, 0],
      [0, 0, 0],
      0,
      [REACH, 0, base[2]],
      0.35,
      {type: 'box', halfExtents: [0.1, 0.46, 0.075]},
      'prismatic'
    );
    slideDriveIndex = joints.length - 1;
  }
  for (const sign of [-1, 1]) {
    link(
      sign < 0 ? 'left' : 'right',
      bin?.ring ? 2 : 1,
      [bin?.ring ? 0 : REACH / 2, sign * 0.41, 0],
      [0, 0, FINGER_LENGTH],
      0,
      [REACH, sign * 0.41, 0.24],
      0.3,
      {type: 'sphere', radius: padRadius}
    );
  }
  const position: Vector = [REACH, 0, box[2]];
  bodies.push({
    position,
    mass: options.mass ?? 1,
    shape: {type: 'box', halfExtents: box},
    // Ordered combines collider friction using the geometric mean.
    friction: 1,
    restitution: 0
  });
  const sourceAngle = bin?.ring ? ringAngle(0) : bin ? BIN_ANGLES[bin.target] : 0;
  const destination = bin ? BIN_DESTINATION : DESTINATION_ANGLE;
  if (bin) {
    if (sourceAngle === undefined) throw new RangeError('Invalid bin target');
    links[0].angle = sourceAngle;
    const rotation: [number, number, number, number] = [
      0,
      0,
      Math.sin(sourceAngle / 2),
      Math.cos(sourceAngle / 2)
    ];
    for (const body of bodies.slice(2, armBodyCount)) {
      const [x, y, z] = body.position;
      body.position = [
        x * Math.cos(sourceAngle) - y * Math.sin(sourceAngle),
        x * Math.sin(sourceAngle) + y * Math.cos(sourceAngle),
        z
      ];
      body.orientation = rotation;
    }
  }
  const workcell = bin ? makeBinWorkcell(bin, REACH, options.mass ?? 1) : undefined;
  if (workcell) {
    bodies[0] = workcell.bodies[0];
    bodies.splice(armBodyCount, 1, ...workcell.bodies.slice(1));
  }
  const pads = [
    {link: 'left', radius: padRadius},
    {link: 'right', radius: padRadius}
  ] as const;
  const colliders: GPUArticulationCollider[] = [
    ...pads.map(pad => ({link: pad.link, shape: {type: 'sphere' as const, radius: pad.radius}})),
    {
      link: 'boom',
      shape: {type: 'capsule', radiusTop: 0.065, radiusBottom: 0.065, height: 1.28},
      orientation: [0, 0, Math.SQRT1_2, Math.SQRT1_2]
    },
    {
      link: bin?.ring ? 'slide' : 'boom',
      position: [bin?.ring ? 0 : REACH / 2, 0, 0],
      shape: {type: 'box', halfExtents: [0.1, 0.46, 0.075]}
    }
  ];
  if ((bin?.parts || bin?.ring) && !reduced) {
    const {shape: unused, ...body} = bodies[3];
    bodies[3] = {
      ...body,
      inertiaDiagonal: links[1].inertia,
      centerOfMass: [0, 0, 0],
      colliders: colliders
        .slice(2)
        .filter(collider => collider.link === 'boom')
        .map(({shape, orientation, position}) => ({
          position,
          orientation,
          shape
        }))
    };
  }
  const binWorld =
    bin && reduced
      ? new GPURigidBodyWorld({
          id: 'bin-counterparts',
          bodies: [bodies[0], ...bodies.slice(armBodyCount)],
          gravity: [0, 0, -9.81],
          timeStep: 1 / 120,
          iterations: 8,
          ...(bin.parts
            ? {broadPhase: 'hierarchical-grid' as const, solver: 'parallel' as const}
            : {}),
          publishPoses: publish
        })
      : undefined;
  const world = reduced
    ? new GPUArticulationTree({
        base,
        id: options.id,
        links,
        publishMatrices: publish,
        payload: bin
          ? undefined
          : {
              mass: options.mass ?? 1,
              position,
              halfExtents: box,
              pads,
              friction,
              supportFriction: 0.65,
              supportHeight: 0
            }
      })
    : new GPURigidBodyWorld({
        bodies,
        ...(bin?.parts ? {broadPhase: 'hierarchical-grid' as const} : {}),
        joints,
        solver: 'ordered',
        iterations: 64,
        timeStep: 1 / 120,
        gravity: [0, 0, -9.81],
        publishPoses: publish
      });
  const liftAngle = bin ? BIN_LIFT_ANGLE : -0.38;
  const ringStages = ['Extend', 'Lower', 'Grip', 'Lift', 'Retract', 'Set down', 'Release', 'Clear'];
  const travelSteps = (phase: number) =>
    bin?.ring
      ? phase % ringStages.length === 0
        ? 144
        : 96
      : phase === 3
        ? (options.carrySteps ??
          (bin ? 4 * Math.ceil(40 * Math.abs(destination - sourceAngle)) : 120))
        : 120;
  const phaseNames =
    bin && !bin.drop && !bin.obstructed
      ? [...GRIPPER_PHASES, 'Regrip', 'Raise again']
      : [...GRIPPER_PHASES];
  if (bin?.drop) {
    phaseNames[4] = bin.parts ? 'Lower to stack' : 'Drop';
    phaseNames[5] = bin.parts ? 'Release' : 'Settle';
  }
  const phases = [
    [sourceAngle, -0.024, 0],
    [sourceAngle, -0.024, 0.36],
    [sourceAngle, liftAngle, 0.36],
    [destination, liftAngle, 0.36],
    [
      destination,
      bin?.drop ? (bin.parts ? STACK_RELEASE_ANGLE : liftAngle) : -0.024,
      bin?.drop && !bin.parts ? 0 : 0.36
    ],
    [destination, bin?.drop ? (bin.parts ? STACK_RELEASE_ANGLE : liftAngle) : -0.024, 0],
    [destination, -0.024, 0.36],
    [destination, liftAngle, 0.36]
  ];
  if (bin?.ring) {
    phaseNames.length = 0;
    phases.length = 0;
    for (const [index, piece] of RING_PIECES.entries()) {
      const yaw = ringAngle(index);
      const pickupPitch = Math.asin((base[2] - FINGER_LENGTH - piece.size[2]) / REACH);
      const placementPitch = Math.asin(
        (base[2] - FINGER_LENGTH - piece.size[2]) / (REACH - RING_RETRACTION)
      );
      for (const stage of ringStages)
        phaseNames.push(`${index + 1}/${RING_PIECES.length} · ${piece.name} · ${stage}`);
      phases.push(
        [yaw, liftAngle, 0, 0],
        [yaw, pickupPitch, 0, 0],
        [yaw, pickupPitch, 0.36, 0],
        [yaw, liftAngle, 0.36, 0],
        [yaw, liftAngle, 0.36, -RING_RETRACTION],
        [yaw, placementPitch, 0.36, -RING_RETRACTION],
        [yaw, placementPitch, 0, -RING_RETRACTION],
        [yaw, liftAngle, 0, -RING_RETRACTION]
      );
    }
  }
  return {
    world,
    bodies,
    binWorld,
    workcell,
    phaseNames,
    armBodyCount,
    travelSteps,
    targetIndex: (phase: number) =>
      bin?.ring ? Math.floor(phase / ringStages.length) : (bin?.target ?? 0),
    addToGraph<P>(graph: GPUCommandGraph<P>) {
      if (binWorld && world instanceof GPUArticulationTree)
        binWorld.addToGraph(graph, {
          tree: world,
          ...(bin?.parts || bin?.ring ? {colliders} : {pads}),
          friction: friction ** 2
        });
      else world.addToGraph(graph);
    },
    command(phase: number, step = 0) {
      const fraction = Math.min(1, step / travelSteps(phase));
      const blend = fraction * fraction * (3 - 2 * fraction);
      const [yaw, pitch, grip, slide] = phases[phase].map(
        (goal, index) =>
          phases[Math.max(0, phase - 1)][index] +
          blend * (goal - phases[Math.max(0, phase - 1)][index])
      );
      const targets = bin?.ring ? [yaw, pitch, slide, grip, -grip] : [yaw, pitch, grip, -grip];
      links.forEach((joint, index) => {
        if (joint.jointType === 'prismatic') {
          const drive = {position: slide, stiffness: 1000, damping: 60, maximumForce: 80};
          if (world instanceof GPUArticulationTree) world.setLinearDrive(joint.id, drive);
          else {
            const row = joints[slideDriveIndex];
            if (row.type === 'general')
              world.setJointParameters(slideDriveIndex, {
                ...row,
                drive: {
                  positionTarget: slide,
                  stiffness: drive.stiffness,
                  damping: drive.damping,
                  maximumForce: drive.maximumForce
                }
              });
          }
          return;
        }
        const angle = targets[index];
        const maximumTorque = index >= 2 ? (options.torque ?? 32) : 100;
        if (world instanceof GPUArticulationTree)
          world.setDrive(joint.id, {angle, stiffness: 900, damping: 45, maximumTorque});
        else world.setAngularActuator(joint.id, axes[index] as 0 | 1 | 2, {angle, maximumTorque});
      });
    },
    async positions() {
      const states = await world.readState();
      const external = binWorld ? (await binWorld.readState()).slice(1) : [];
      return [...states.slice(reduced ? 0 : 2), ...external].map(state => state.position);
    }
  };
}
