// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {CubeGeometry, GroupNode, ScenegraphNode, type Geometry} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {makeConvexHullGeometry, type GPURigidBody} from '@luma.gl/gpgpu/gpu-physics';

/** CPU-authored geometry is available before allocating physics or render resources. */
export class CradleGeometryNode extends ScenegraphNode {
  constructor(
    id: string,
    readonly geometry: Geometry,
    matrix: Matrix4,
    /** Optional world-space collision replacement; false disables collisions. */
    readonly collision?: GPURigidBody | false
  ) {
    super({id, matrix});
  }
}

export function makeCradleFrame(): GroupNode {
  const geometry = new CubeGeometry();
  return new GroupNode({
    id: 'cradle-frame',
    children: [
      new CradleGeometryNode(
        'left-leg',
        geometry,
        new Matrix4().translate([-4.2, 0, 1.95]).scale([0.3, 0.3, 1.95])
      ),
      new CradleGeometryNode(
        'right-leg',
        geometry,
        new Matrix4().translate([4.2, 0, 1.95]).scale([0.3, 0.3, 1.95])
      ),
      new CradleGeometryNode(
        'crossbar',
        geometry,
        new Matrix4().translate([0, 0, 4.2]).scale([4.5, 0.3, 0.3])
      )
    ]
  });
}

/** Derive static convex collision geometry from the same vertices and transforms used to draw. */
export function makeCradleFrameBodies(frame: GroupNode): GPURigidBody[] {
  const bodies: GPURigidBody[] = [];
  frame.traverse((node, {worldMatrix}) => {
    if (!(node instanceof CradleGeometryNode) || node.collision === false) return;
    if (node.collision) {
      bodies.push(node.collision);
      return;
    }
    const matrix = new Matrix4(worldMatrix).multiplyRight(node.matrix);
    const positions = node.geometry.attributes.POSITION.value;
    const vertices: number[] = [];
    for (let index = 0; index < positions.length; index += 3) {
      vertices.push(
        ...matrix.transformAsPoint([positions[index], positions[index + 1], positions[index + 2]])
      );
    }
    // Keep the inexpensive box narrow phase for axis-aligned authored cubes.
    const axisAligned = [1, 2, 4, 6, 8, 9].every(index => Math.abs(matrix[index]) < 1e-8);
    const minimum = [Infinity, Infinity, Infinity];
    const maximum = [-Infinity, -Infinity, -Infinity];
    for (let index = 0; index < vertices.length; index++) {
      minimum[index % 3] = Math.min(minimum[index % 3], vertices[index]);
      maximum[index % 3] = Math.max(maximum[index % 3], vertices[index]);
    }
    bodies.push(
      node.geometry instanceof CubeGeometry && axisAligned
        ? {
            mode: 'static',
            mass: 0,
            position: [
              (minimum[0] + maximum[0]) / 2,
              (minimum[1] + maximum[1]) / 2,
              (minimum[2] + maximum[2]) / 2
            ],
            shape: {
              type: 'box',
              halfExtents: [
                (maximum[0] - minimum[0]) / 2,
                (maximum[1] - minimum[1]) / 2,
                (maximum[2] - minimum[2]) / 2
              ]
            },
            restitution: 0.25,
            friction: 0.5
          }
        : {
            mode: 'static',
            mass: 0,
            position: [0, 0, 0],
            shape: {type: 'convex-hull', geometry: makeConvexHullGeometry(vertices)},
            restitution: 0.25,
            friction: 0.5
          }
    );
  });
  return bodies;
}
