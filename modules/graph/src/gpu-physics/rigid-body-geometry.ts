// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {makeCoplanarFeatures} from './rigid-body-contact-features';
import {packRigidBodyHeightField, type GPURigidBodyHeightField} from './rigid-body-height-field';
import type {RigidBodyMeshGeometry} from './rigid-body-mesh';
import type {GPURigidBodyCollider} from './rigid-body-properties';

/** Pack collider metadata and its contiguous GPU geometry uploads. */
export function packRigidBodyShapes(
  colliders: readonly GPURigidBodyCollider[],
  shareHeightFields = false,
  writableHeightFields?: ReadonlySet<number>,
  useTerrainAtlas = false
) {
  const geometry: number[] = [];
  const packedMeshes = new Map<RigidBodyMeshGeometry, {padding: number[]; policies: number[]}>();
  const sharedHeightFields = new Map<
    GPURigidBodyHeightField,
    {padding: number[]; policies: number[]; extent: number[]}
  >();
  const heightFields = new Map<number, number>();
  const atlasFields = new Map<number, ReturnType<typeof packRigidBodyHeightField>>();
  const writablePayloads = new Map<
    GPURigidBodyHeightField,
    ReturnType<typeof packRigidBodyHeightField>
  >();
  const shapes = colliders.map(({shape}, colliderIndex) => {
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
    else if (shape.type === 'height-field') {
      const writable = !shareHeightFields || writableHeightFields?.has(colliderIndex);
      const shared = writable ? undefined : sharedHeightFields.get(shape.field);
      if (shared) {
        padding.splice(0, padding.length, ...shared.padding);
        policies.splice(0, policies.length, ...shared.policies);
        dimensions = [...shared.extent, 3];
      } else {
        const packed = writablePayloads.get(shape.field) ?? packRigidBodyHeightField(shape.field);
        if (shareHeightFields && writable) writablePayloads.set(shape.field, packed);
        if (useTerrainAtlas && writable) {
          padding[1] = -shape.field.width;
          dimensions = [...packed.extent, 3];
          if (packed.nodeCount) atlasFields.set(colliderIndex, packed);
          return {dimensions, policies, padding};
        }
        const offset = geometry.length / 4;
        padding[0] = offset;
        // Negative vertex count distinguishes implicit height-field triangles in the mesh kernels.
        padding[1] = -shape.field.width;
        padding[3] = packed.triangleCount;
        policies[0] = offset + packed.nodeOffset;
        policies[1] = packed.nodeCount;
        dimensions = [...packed.extent, 3];
        for (const value of packed.data) geometry.push(value);
        if (writable) heightFields.set(colliderIndex, offset);
        else sharedHeightFields.set(shape.field, {padding, policies, extent: packed.extent});
      }
    } else {
      const mesh = shape.geometry;
      const shared = packedMeshes.get(mesh);
      if (shared) {
        padding.splice(0, padding.length, ...shared.padding);
        policies.splice(0, policies.length, ...shared.policies);
      } else {
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
        packedMeshes.set(mesh, {padding: [...padding], policies: [...policies]});
      }
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
  return {shapes, geometry, filters, heightFields, atlasFields};
}
