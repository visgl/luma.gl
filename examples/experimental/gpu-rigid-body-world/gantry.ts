// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPUArticulationTree,
  GPURigidBodyWorld,
  getBodyInertia,
  type GPURigidBody,
  type GPURigidBodyJoint,
  type GPUArticulationLink
} from '@luma.gl/graph/gpu-physics';
import type {GPUCommandGraph} from '@luma.gl/graph/gpu-core';

type Vector = [number, number, number];
export const GANTRY_STEP = 1 / 120;
const forkSize: Vector = [0.095, 0.21, 0.045];
const carriageSize: Vector = [0.11, 0.09, 0.12];
const beamSize: Vector = [1.3, 0.15, 0.11];
const stations = [-1, 1] as const;
const stiffness = 6000;
export const GANTRY_WEIGHT = 4 * 9.81;
export const LIFT = 0.52;
export const TRAVEL = 0.85;
function box(position: Vector, size: Vector, mass: number): GPURigidBody {
  return {position, shape: {type: 'box', halfExtents: size}, mass, friction: 0.9, restitution: 0};
}

/** Both formulations use the same two servos per station and the same independent beam and stock. */
export function makeGantry(options: {
  parts: 64 | 256;
  ordered?: boolean;
  ballast?: number;
  publish?: boolean;
  reverse?: boolean;
  faceManifold?: boolean;
}) {
  const ballast = options.ballast ?? 0.35;
  const bodies: GPURigidBody[] = [
    {...box([0, -0.45, 0.47], beamSize, 4), centerOfMass: [ballast, 0, 0]},
    box([0, 0, -0.12], [3, 2, 0.12], 0)
  ];
  for (const y of [-0.45, 0.4])
    for (const x of [-0.55, 0.55]) bodies.push(box([x, y, 0.18], [0.12, 0.22, 0.18], 0));
  const stockStart = bodies.length;
  for (let i = 0; i < options.parts - 1; i++) {
    const columns = Math.ceil(Math.sqrt(options.parts / 2));
    const row = Math.floor(i / (2 * columns)),
      column = i % columns;
    const x = (i % (2 * columns) < columns ? -1 : 1) * (1.6 + ((column + 0.5) * 1.15) / columns);
    const y = -1.75 + ((row + 0.5) * 3.5) / Math.ceil((options.parts - 1) / (2 * columns));
    bodies.push(box([x, y, 0.055], [0.034, 0.055, 0.055], 0.12));
  }
  const armStart = bodies.length;
  const joints: GPURigidBodyJoint[] = [];
  const order = options.reverse ? [1, 0] : [0, 1];
  const roots = order.map(station => {
    const x = stations[station],
      prefix = x < 0 ? 'left' : 'right';
    const links: GPUArticulationLink[] = [
      {
        id: prefix + '-lift',
        parent: -1,
        parentAnchor: [0, 0, 0],
        childAnchor: [0, 0, 0],
        axis: [0, 0, 1],
        jointType: 'prismatic',
        mass: 1,
        inertia: getBodyInertia(1, {type: 'box', halfExtents: carriageSize})
      },
      {
        id: prefix + '-fork',
        parent: 0,
        parentAnchor: [0, 0.5, 0],
        childAnchor: [0, 0, 0],
        axis: [0, 1, 0],
        jointType: 'prismatic',
        mass: 0.5,
        inertia: getBodyInertia(0.5, {type: 'box', halfExtents: forkSize})
      }
    ];
    return {base: [x, -0.95, 0.29] as Vector, links};
  });
  const drives: number[] = [];
  if (options.ordered)
    for (const root of roots) {
      const start = bodies.length;
      bodies.push(box(root.base, carriageSize, 1), box([root.base[0], -0.45, 0.29], forkSize, 0.5));
      for (const [linkIndex, link] of root.links.entries()) {
        const axis = linkIndex === 0 ? 2 : 1;
        const joint = {
          type: 'general' as const,
          first: linkIndex === 0 ? 1 : start,
          second: start + linkIndex,
          firstFrame: {
            position:
              linkIndex === 0
                ? ([root.base[0], root.base[1], root.base[2] + 0.12] as Vector)
                : link.parentAnchor
          },
          secondFrame: {position: [0, 0, 0] as Vector}
        };
        joints.push(
          {...joint, axes: axis === 2 ? [0, 1] : [0, 2], minimum: 0, maximum: 0},
          {...joint, axes: [0, 1, 2], angular: true, minimum: 0, maximum: 0}
        );
        drives.push(joints.length);
        joints.push({
          ...joint,
          axes: [axis],
          drive: {positionTarget: 0, stiffness, damping: 155, maximumForce: 250}
        });
      }
    }
  const world = new GPURigidBodyWorld({
    bodies,
    joints,
    timeStep: GANTRY_STEP,
    gravity: [0, 0, -9.81],
    broadPhase: 'hierarchical-grid',
    maximumPairs: 2 ** Math.ceil(Math.log2(bodies.length * 3)),
    solver: options.ordered ? 'ordered' : 'parallel',
    iterations: options.ordered ? 64 : 8,
    publishPoses: options.publish
  });
  const tree = options.ordered
    ? undefined
    : GPUArticulationTree.fromRoots(roots, {
        timeStep: GANTRY_STEP,
        publishMatrices: options.publish
      });
  const colliders = roots.map(root => ({
    link: root.links[1].id,
    shape: {type: 'box' as const, halfExtents: forkSize},
    faceManifold: options.faceManifold ?? true
  }));
  return {
    world,
    tree,
    bodies,
    roots,
    armStart,
    stockStart,
    order,
    addToGraph(graph: GPUCommandGraph) {
      world.addToGraph(graph, tree ? {tree, colliders, friction: 0.9} : undefined);
    },
    command(height: number, travel: number, release = false) {
      roots.forEach((root, index) =>
        root.links.forEach((link, part) => {
          const target = part === 0 ? (release && order[index] === 0 ? 0 : height) : travel;
          if (tree)
            tree.setLinearDrive(link.id, {
              position: target,
              stiffness,
              damping: 155,
              maximumForce: 250
            });
          else {
            const jointIndex = drives[index * 2 + part];
            const joint = joints[jointIndex];
            if (joint.type === 'general')
              world.setJointParameters(jointIndex, {
                ...joint,
                drive: {...joint.drive, positionTarget: target}
              });
          }
        })
      );
    },
    async read(liftTarget?: number) {
      const [states, contacts, worldStatus] = await Promise.all([
        world.readState(),
        tree?.readSimulationDiagnostics(),
        world.readSimulationDiagnostics()
      ]);
      const loads = [0, 0];
      if (contacts)
        contacts.contactPairs?.forEach((pair, index) => {
          if (pair.body === 0)
            loads[order[pair.collider]] += contacts.contactImpulses![index][2] / GANTRY_STEP;
        });
      // In a stationary hold the vertical drive supports its own 1.5 kg assembly plus the beam.
      if (!tree && liftTarget !== undefined)
        roots.forEach((root, index) => {
          loads[order[index]] =
            stiffness * (liftTarget - (states[armStart + 2 * index].position[2] - root.base[2])) -
            1.5 * 9.81;
        });
      const beam = states[0];
      return {
        position: beam.position,
        rotation: beam.orientation,
        loads: tree || liftTarget !== undefined ? loads : null,
        rows: contacts?.activeContacts,
        reused: contacts?.reusedContacts,
        complete: worldStatus.complete && (contacts?.complete ?? true)
      };
    },
    destroy() {
      world.destroy();
      tree?.destroy();
    }
  };
}

export function gantryTargets(step: number) {
  const ramp = (start: number, duration: number) => {
    const t = Math.min(1, Math.max(0, (step - start) / duration));
    return t * t * (3 - 2 * t);
  };
  return {height: LIFT * (ramp(20, 100) - ramp(370, 100)), travel: TRAVEL * ramp(195, 140)};
}
