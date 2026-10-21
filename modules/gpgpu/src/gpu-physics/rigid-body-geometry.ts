// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import type {GPURigidBody, GPURigidBodyCollider} from './rigid-body-properties';
import {normalizeRigidBodyRotation, rotateRigidBodyVector} from './rigid-body-properties';

export function packRigidBodyShapes(colliders: readonly GPURigidBodyCollider[]) {
  const geometry: number[] = [];
  const shapes = colliders.map(({shape}) => {
    const policies = [0, 0];
    const padding = [0, 0, 0, 0];
    let dimensions: number[];
    if (shape.type === 'sphere') dimensions = [shape.radius, 0, 0, 0];
    else if (shape.type === 'plane')
      dimensions = [(shape.sizeX ?? 0) / 2, (shape.sizeZ ?? 0) / 2, shape.doubleSided ? 1 : 0, 6];
    else if (shape.type === 'box') dimensions = [...shape.halfExtents, 1];
    else if (shape.type === 'capsule' || shape.type === 'cylinder')
      dimensions = [
        shape.radiusBottom,
        shape.radiusTop,
        shape.height,
        shape.type === 'capsule' ? 4 : 5
      ];
    else {
      const mesh = shape.geometry;
      padding[0] = geometry.length / 4;
      padding[1] = mesh.positions.length / 3;
      for (let index = 0; index < mesh.positions.length; index += 3)
        geometry.push(
          mesh.positions[index],
          mesh.positions[index + 1],
          mesh.positions[index + 2],
          0
        );
      padding[2] = geometry.length / 4;
      padding[3] = mesh.indices.length / 3;
      for (let index = 0; index < mesh.indices.length; index += 3)
        geometry.push(mesh.indices[index], mesh.indices[index + 1], mesh.indices[index + 2], 0);
      policies[0] = geometry.length / 4;
      policies[1] = mesh.nodes.length / 12;
      // Avoid a spread argument for large BVHs.
      for (const value of mesh.nodes) geometry.push(value);
      dimensions = [
        ...mesh.minimum.map((value, axis) =>
          Math.max(Math.abs(value), Math.abs(mesh.maximum[axis]))
        ),
        shape.type === 'convex-hull' ? 2 : 3
      ];
    }
    return {dimensions, policies, padding};
  });
  const filters = colliders.map(collider => {
    const excluded = [...new Set(collider.excludedColliders ?? [])].sort(
      (first, second) => first - second
    );
    const start = geometry.length;
    for (const index of excluded) geometry.push(index);
    // Subsequent geometry records retain their vec4 alignment.
    while (geometry.length % 4) geometry.push(0);
    return [start, excluded.length] as const;
  });
  return {shapes, geometry, filters};
}

/** Mesh/mesh narrow phase is not implemented. Prove fixed pairs can never meet instead. */
export function areFixedMeshesSeparated(
  first: GPURigidBodyCollider,
  firstBody: GPURigidBody,
  second: GPURigidBodyCollider,
  secondBody: GPURigidBody
): boolean {
  const bounds = (collider: GPURigidBodyCollider, body: GPURigidBody) => {
    const mode = body.mode ?? (body.mass === 0 ? 'static' : 'dynamic');
    if (
      mode === 'kinematic' ||
      (mode === 'dynamic' && (body.mass !== 0 || (body.gravityFactor ?? 1) !== 0)) ||
      (body.velocity ?? []).some(value => value !== 0)
    )
      return null;
    const shape = collider.shape;
    if (shape.type !== 'triangle-mesh') return null;
    const center = body.centerOfMass ?? [0, 0, 0];
    const rotation = normalizeRigidBodyRotation(body.orientation);
    const offset = collider.position ?? [0, 0, 0];
    const shapeRotation = new Matrix4().fromQuaternion(
      normalizeRigidBodyRotation(collider.orientation)
    );
    const minimum = [Infinity, Infinity, Infinity],
      maximum = [-Infinity, -Infinity, -Infinity];
    let radius = 0;
    for (let corner = 0; corner < 8; corner++) {
      const point = shapeRotation.transformAsPoint(
        [0, 1, 2].map(axis =>
          corner & (1 << axis) ? shape.geometry.maximum[axis] : shape.geometry.minimum[axis]
        )
      );
      const local: [number, number, number] = [
        point[0] + offset[0] - center[0],
        point[1] + offset[1] - center[1],
        point[2] + offset[2] - center[2]
      ];
      radius = Math.max(radius, Math.hypot(...local));
      const world = rotateRigidBodyVector(rotation, local);
      for (let axis = 0; axis < 3; axis++) {
        minimum[axis] = Math.min(minimum[axis], world[axis]);
        maximum[axis] = Math.max(maximum[axis], world[axis]);
      }
    }
    const translated = rotateRigidBodyVector(rotation, center);
    return {
      minimum: minimum.map(
        (value, axis) =>
          body.position[axis] + translated[axis] + (mode === 'static' ? value : -radius)
      ),
      maximum: maximum.map(
        (value, axis) =>
          body.position[axis] + translated[axis] + (mode === 'static' ? value : radius)
      )
    };
  };
  const firstBounds = bounds(first, firstBody),
    secondBounds = bounds(second, secondBody);
  return Boolean(
    firstBounds &&
      secondBounds &&
      firstBounds.minimum.some(
        (value, axis) =>
          value > secondBounds.maximum[axis] + 0.01 ||
          firstBounds.maximum[axis] < secondBounds.minimum[axis] - 0.01
      )
  );
}
