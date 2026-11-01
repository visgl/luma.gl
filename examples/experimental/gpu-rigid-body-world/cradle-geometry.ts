// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {CubeGeometry, GroupNode, type Geometry} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {type GPURigidBody} from '@luma.gl/graph/gpu-physics';

import {PhysicsGeometryNode, makePhysicsScenegraph} from '@luma.gl/engine/physics';

/** Example convenience constructor; extraction lives in the reusable adapter. */
export class CradleGeometryNode extends PhysicsGeometryNode {
  constructor(id: string, geometry: Geometry, matrix: Matrix4, collision?: GPURigidBody | false) {
    super({
      id,
      geometry,
      matrix,
      collision,
      body: {mode: 'static', restitution: 0.25, friction: 0.5}
    });
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

/** Extract frame collisions from the shared authored scenegraph. */
export function makeCradleFrameBodies(frame: GroupNode): GPURigidBody[] {
  return makePhysicsScenegraph(frame).bodies;
}
