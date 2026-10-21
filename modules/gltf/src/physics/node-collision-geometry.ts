// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import type {GLTFPhysicsDocument, ParseGLTFPhysicsOptions} from './physics-types';
import {readPhysicsRotation, readPhysicsVector} from './physics-transforms';

/** Snapshot a reference subtree in its root's local coordinates, including off-scene nodes. */
export function collectNodeCollisionGeometry(
  document: GLTFPhysicsDocument,
  rootIndex: number,
  resolveMesh: NonNullable<ParseGLTFPhysicsOptions['resolveNodeMeshGeometry']>
): {positions: number[]; indices: number[]} {
  const nodes = document.nodes ?? [];
  const positions: number[] = [],
    indices: number[] = [];
  const ancestors = new Set<number>();
  const visit = (nodeIndex: number, transform: Matrix4) => {
    if (
      !Number.isSafeInteger(nodeIndex) ||
      nodeIndex < 0 ||
      nodeIndex >= nodes.length ||
      ancestors.has(nodeIndex)
    )
      throw new Error('Invalid collision geometry subtree');
    ancestors.add(nodeIndex);
    const node = nodes[nodeIndex];
    const geometry = node.mesh === undefined ? undefined : resolveMesh(nodeIndex);
    if (node.mesh !== undefined && !geometry)
      throw new Error('Missing initial collision mesh snapshot');
    if (geometry) {
      if (geometry.positions.length % 3 || geometry.indices.length % 3)
        throw new Error('Invalid collision mesh snapshot');
      const vertexOffset = positions.length / 3;
      for (let index = 0; index < geometry.positions.length; index += 3) {
        const point = transform.transformAsPoint([
          geometry.positions[index],
          geometry.positions[index + 1],
          geometry.positions[index + 2]
        ]);
        positions.push(point[0], point[1], point[2]);
      }
      const reflected = transform.determinant() < 0;
      for (let index = 0; index < geometry.indices.length; index += 3) {
        const triangle = [
          geometry.indices[index],
          geometry.indices[index + 1],
          geometry.indices[index + 2]
        ];
        if (
          triangle.some(
            value =>
              !Number.isSafeInteger(value) || value < 0 || value >= geometry.positions.length / 3
          )
        )
          throw new Error('Invalid collision mesh index');
        if (reflected) [triangle[1], triangle[2]] = [triangle[2], triangle[1]];
        indices.push(...triangle.map(value => value + vertexOffset));
      }
    }
    for (const childIndex of node.children ?? []) {
      const child = nodes[childIndex];
      if (!child) throw new Error('Invalid collision geometry child');
      if (child.matrix && (child.translation || child.rotation || child.scale))
        throw new Error('Ambiguous collision geometry transform');
      const local = child.matrix
        ? new Matrix4(child.matrix)
        : new Matrix4()
            .translate(readPhysicsVector(child.translation, [0, 0, 0]))
            .multiplyRight(new Matrix4().fromQuaternion(readPhysicsRotation(child.rotation)))
            .scale(readPhysicsVector(child.scale, [1, 1, 1]));
      visit(childIndex, transform.clone().multiplyRight(local));
    }
    ancestors.delete(nodeIndex);
  };
  visit(rootIndex, new Matrix4());
  if (!positions.length) throw new Error('Empty collision geometry subtree');
  return {positions, indices};
}
