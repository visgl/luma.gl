// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4, Quaternion} from '@math.gl/core';
import type {RigidBodyMeshGeometry} from './rigid-body-mesh';
import {getRigidBodyShapeProperties} from './rigid-body-shape-properties';

export type RigidBodyVector = readonly [number, number, number];
export type RigidBodyRotation = readonly [number, number, number, number];
export type GPURigidBodyShape =
  | {type: 'sphere'; radius: number}
  /** Local +Y normal; omitted tangent extents are unbounded. */
  | {type: 'plane'; sizeX?: number; sizeZ?: number; doubleSided?: boolean}
  | {type: 'box'; halfExtents: RigidBodyVector}
  | {type: 'capsule'; height: number; radiusBottom: number; radiusTop: number}
  | {type: 'cylinder'; height: number; radiusBottom: number; radiusTop: number}
  | {type: 'convex-hull'; geometry: RigidBodyMeshGeometry}
  | {type: 'triangle-mesh'; geometry: RigidBodyMeshGeometry};
export type GPURigidBodyMaterial = {
  restitution?: number;
  staticFriction?: number;
  dynamicFriction?: number;
  /** Legacy defaults retain minimum restitution and geometric-mean friction. */
  restitutionCombine?: 'average' | 'minimum' | 'maximum' | 'multiply';
  frictionCombine?: 'average' | 'minimum' | 'maximum' | 'multiply';
};
export type GPURigidBodyCollider = {
  shape: GPURigidBodyShape;
  /** Collider pose in the body's node frame, before its center-of-mass offset. */
  position?: RigidBodyVector;
  orientation?: RigidBodyRotation;
  material?: GPURigidBodyMaterial;
  /** Explicit collider indices excluded from collision, resolved before graph construction. */
  excludedColliders?: readonly number[];
};
/** Supply either one centered shape or an explicit compound collider list. */
export type GPURigidBody = (
  | {shape: GPURigidBodyShape; colliders?: never}
  | {shape?: never; colliders: readonly GPURigidBodyCollider[]}
) & {
  /** World-space node origin. GPU positions store the center of mass. */
  position: RigidBodyVector;
  orientation?: RigidBodyRotation;
  velocity?: RigidBodyVector;
  angularVelocity?: RigidBodyVector;
  /** Legacy mass=0 defaults to static. Explicit mode distinguishes infinite-mass dynamics. */
  mode?: 'static' | 'dynamic' | 'kinematic';
  mass?: number;
  centerOfMass?: RigidBodyVector;
  /** Zero denotes an infinite principal inertia, matching the glTF physics draft. */
  inertiaDiagonal?: RigidBodyVector;
  inertiaOrientation?: RigidBodyRotation;
  gravityFactor?: number;
  restitution?: number;
  friction?: number;
};

export function rotateRigidBodyVector(
  rotation: RigidBodyRotation,
  vector: RigidBodyVector
): [number, number, number] {
  const result = new Matrix4().fromQuaternion(rotation).transformAsVector(vector);
  return [result[0], result[1], result[2]];
}

export function normalizeRigidBodyRotation(
  rotation: RigidBodyRotation = [0, 0, 0, 1]
): [number, number, number, number] {
  const magnitude = Math.hypot(...rotation);
  if (!rotation.every(Number.isFinite) || magnitude === 0) throw new Error('Invalid body rotation');
  return [
    rotation[0] / magnitude,
    rotation[1] / magnitude,
    rotation[2] / magnitude,
    rotation[3] / magnitude
  ];
}

/** Compute a compound's uniform-density inertia and diagonalize its symmetric tensor. */
export function getCompoundBodyInertia(
  mass: number,
  colliders: readonly GPURigidBodyCollider[],
  center: RigidBodyVector
): {diagonal: [number, number, number]; orientation: [number, number, number, number]} {
  const properties = colliders.map(({shape}) => getRigidBodyShapeProperties(shape));
  const volumes = properties.map(property => property.volume);
  const total = volumes.reduce((sum, value) => sum + value, 0);
  const tensor = Array<number>(9).fill(0);
  for (const [index, collider] of colliders.entries()) {
    const colliderMass = total > 0 ? (mass * volumes[index]) / total : 0;
    const density = volumes[index] > 0 ? colliderMass / volumes[index] : 0;
    const rotation = new Matrix4().fromQuaternion(normalizeRigidBodyRotation(collider.orientation));
    const shapeCenter = rotateRigidBodyVector(
      normalizeRigidBodyRotation(collider.orientation),
      properties[index].center
    );
    const offset = (collider.position ?? [0, 0, 0]).map(
      (value, axis) => value + shapeCenter[axis] - center[axis]
    );
    for (let row = 0; row < 3; row++)
      for (let column = 0; column < 3; column++) {
        for (let first = 0; first < 3; first++)
          for (let second = 0; second < 3; second++)
            tensor[row * 3 + column] +=
              rotation[first * 4 + row] *
              properties[index].tensor[first * 3 + second] *
              density *
              rotation[second * 4 + column];
        tensor[row * 3 + column] +=
          colliderMass *
          ((row === column ? offset.reduce((sum, value) => sum + value ** 2, 0) : 0) -
            offset[row] * offset[column]);
      }
  }
  const axes = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  for (let iteration = 0; iteration < 24; iteration++) {
    let first = 0;
    let second = 1;
    for (const [row, column] of [
      [0, 2],
      [1, 2]
    ])
      if (Math.abs(tensor[row * 3 + column]) > Math.abs(tensor[first * 3 + second])) {
        first = row;
        second = column;
      }
    if (Math.abs(tensor[first * 3 + second]) <= 1e-12 * Math.max(...tensor.map(Math.abs))) break;
    const angle =
      0.5 *
      Math.atan2(
        2 * tensor[first * 3 + second],
        tensor[second * 3 + second] - tensor[first * 3 + first]
      );
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    for (let row = 0; row < 3; row++) {
      const left = tensor[row * 3 + first];
      const right = tensor[row * 3 + second];
      tensor[row * 3 + first] = cosine * left - sine * right;
      tensor[row * 3 + second] = sine * left + cosine * right;
      const firstAxis = axes[first * 3 + row];
      const secondAxis = axes[second * 3 + row];
      axes[first * 3 + row] = cosine * firstAxis - sine * secondAxis;
      axes[second * 3 + row] = sine * firstAxis + cosine * secondAxis;
    }
    for (let column = 0; column < 3; column++) {
      const upper = tensor[first * 3 + column];
      const lower = tensor[second * 3 + column];
      tensor[first * 3 + column] = cosine * upper - sine * lower;
      tensor[second * 3 + column] = sine * upper + cosine * lower;
    }
  }
  const rotation = new Quaternion().fromMatrix3(axes).normalize();
  return {
    diagonal: [tensor[0], tensor[4], tensor[8]],
    orientation: [rotation[0], rotation[1], rotation[2], rotation[3]]
  };
}
