// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import {GroupNode, decomposePhysicsTransform, type ScenegraphNode} from '@luma.gl/engine';
import type {GPURigidBodyWorld} from './gpu-rigid-body-world';

export type ScenegraphPhysicsColliderTarget = {
  node: ScenegraphNode;
  index: number;
  body: ScenegraphNode;
  /** Cooked collider frame relative to its scene node, before node scale. */
  localMatrix?: readonly number[];
};

/** Animation owns declared kinematic nodes; physics publishes their accepted poses for rendering. */
export class ScenegraphPhysicsMotion {
  readonly inverseBodyFrames = new Map<number, Matrix4>();
  constructor(
    readonly world: GPURigidBodyWorld,
    readonly roots: readonly ScenegraphNode[],
    readonly targets: ReadonlyMap<ScenegraphNode, number>,
    readonly colliders: readonly ScenegraphPhysicsColliderTarget[] = []
  ) {}

  /** Call after sampling animation, before submitting the corresponding fixed physics step. */
  update(): void {
    this.inverseBodyFrames.clear();
    const visited = new Set<ScenegraphNode>();
    const worlds = new Map<ScenegraphNode, Matrix4>();
    const visit = (node: ScenegraphNode, parent: Matrix4) => {
      if (visited.has(node)) throw new Error('Physics motion scene must be a tree');
      visited.add(node);
      const matrix = new Matrix4(parent).multiplyRight(node.matrix);
      worlds.set(node, matrix);
      const body = this.targets.get(node);
      if (body !== undefined) {
        const transform = decomposePhysicsTransform(matrix);
        this.world.setKinematicTarget(body, transform.position, transform.rotation);
        this.inverseBodyFrames.set(
          body,
          new Matrix4()
            .translate(transform.position)
            .multiplyRight(new Matrix4().fromQuaternion(transform.rotation))
            .invert()
        );
      }
      if (node instanceof GroupNode) for (const child of node.children) visit(child, matrix);
    };
    for (const root of this.roots) visit(root, new Matrix4());
    for (const collider of this.colliders) {
      const matrix = worlds.get(collider.node);
      const bodyMatrix = worlds.get(collider.body);
      if (!matrix || !bodyMatrix) throw new Error('Detached collider animation target');
      const body = decomposePhysicsTransform(bodyMatrix);
      const inverse = new Matrix4()
        .translate(body.position)
        .multiplyRight(new Matrix4().fromQuaternion(body.rotation))
        .invert();
      const colliderMatrix = inverse.multiplyRight(matrix);
      if (collider.localMatrix) colliderMatrix.multiplyRight(collider.localMatrix);
      const transform = decomposePhysicsTransform(colliderMatrix);
      this.world.setColliderTransform(collider.index, transform.position, transform.rotation);
    }
    if (this.inverseBodyFrames.size !== this.targets.size)
      throw new Error('Detached physics motion target');
  }
}
