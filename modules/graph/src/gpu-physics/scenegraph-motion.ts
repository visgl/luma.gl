// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import {GroupNode, decomposePhysicsTransform, type ScenegraphNode} from '@luma.gl/engine';
import {scaleRigidBodyShape} from './scale-shape';
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
  private readonly colliderScales = new Map<number, readonly number[]>();
  readonly inverseBodyFrames = new Map<number, Matrix4>();
  constructor(
    readonly world: GPURigidBodyWorld,
    readonly roots: readonly ScenegraphNode[],
    readonly targets: ReadonlyMap<ScenegraphNode, number>,
    readonly colliders: readonly ScenegraphPhysicsColliderTarget[] = []
  ) {
    // Initial geometry already includes the authored scale. Record it before animation begins.
    const matrices = this.collectWorldMatrices();
    for (const collider of colliders) {
      const matrix = matrices.get(collider.node);
      if (!matrix) throw new Error('Detached collider animation target');
      const local = new Matrix4(matrix);
      if (collider.localMatrix) local.multiplyRight(collider.localMatrix);
      this.colliderScales.set(collider.index, decomposePhysicsTransform(local).scale.map(Math.abs));
    }
  }

  private collectWorldMatrices(): Map<ScenegraphNode, Matrix4> {
    const matrices = new Map<ScenegraphNode, Matrix4>();
    const visit = (node: ScenegraphNode, parent: Matrix4) => {
      if (matrices.has(node)) throw new Error('Physics motion scene must be a tree');
      const matrix = new Matrix4(parent).multiplyRight(node.matrix);
      matrices.set(node, matrix);
      if (node instanceof GroupNode) for (const child of node.children) visit(child, matrix);
    };
    for (const root of this.roots) visit(root, new Matrix4());
    return matrices;
  }

  /** Call after sampling animation, before submitting the corresponding fixed physics step. */
  update(): void {
    const currentMatrices = this.collectWorldMatrices();
    const scaleChanges = this.colliders.flatMap(collider => {
      const matrix = currentMatrices.get(collider.node);
      if (!matrix) throw new Error('Detached collider animation target');
      const local = new Matrix4(matrix);
      if (collider.localMatrix) local.multiplyRight(collider.localMatrix);
      const scale = decomposePhysicsTransform(local).scale.map(Math.abs);
      const previous = this.colliderScales.get(collider.index)!;
      if (scale.every((value, index) => Math.abs(value - previous[index]) < 1e-7)) return [];
      return [
        {
          collider: collider.index,
          scale,
          shape: scaleRigidBodyShape(
            this.world.getColliderShape(collider.index),
            scale.map((value, index) => value / previous[index])
          )
        }
      ];
    });
    if (scaleChanges.length) {
      this.world.setColliderShapes(scaleChanges);
      for (const change of scaleChanges) this.colliderScales.set(change.collider, change.scale);
    }
    this.inverseBodyFrames.clear();
    for (const [node, body] of this.targets) {
      const matrix = currentMatrices.get(node);
      if (!matrix) throw new Error('Detached physics motion target');
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
    for (const collider of this.colliders) {
      const matrix = currentMatrices.get(collider.node);
      const bodyMatrix = currentMatrices.get(collider.body);
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
