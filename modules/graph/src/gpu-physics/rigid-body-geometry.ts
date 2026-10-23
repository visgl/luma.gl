// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {makeCoplanarFeatures} from './rigid-body-contact-features';
import type {GPURigidBodyCollider} from './rigid-body-properties';

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
      const {features, internalEdges} = makeCoplanarFeatures(mesh);
      for (let index = 0; index < mesh.indices.length; index += 3)
        geometry.push(
          mesh.indices[index],
          mesh.indices[index + 1],
          mesh.indices[index + 2],
          features[index / 3] * 8 + internalEdges[index / 3]
        );
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
