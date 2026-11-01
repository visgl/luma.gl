// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import {GroupNode, decomposePhysicsTransform, type ScenegraphNode} from '../../index';
import {scaleRigidBodyShape} from '@luma.gl/graph/gpu-physics';
import type {GPURigidBodyWorld} from '@luma.gl/graph/gpu-physics';

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
  private activeTargets?: Set<ScenegraphNode>;
  private readonly colliderFrames = new Map<number, number[]>();
  private readonly releasedModes = new Map<number, 'static' | 'dynamic' | 'kinematic'>();
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

  /** Resolve already-blended animation ownership. Animated ancestors own descendant body poses.
   * Paused actions should remain in this set; stopped actions should be removed. On release,
   * physics retains the last accepted pose and kinematic velocity rather than snapping to authoring.
   */
  setAnimatedNodes(nodes: ReadonlySet<ScenegraphNode>): void {
    const active = new Set<ScenegraphNode>();
    const visit = (node: ScenegraphNode, inherited: boolean) => {
      const animated = inherited || nodes.has(node);
      if (animated && this.targets.has(node)) active.add(node);
      if (node instanceof GroupNode) for (const child of node.children) visit(child, animated);
    };
    if (nodes.size) for (const root of this.roots) visit(root, false);
    for (const [node, body] of this.targets) {
      if (active.has(node)) {
        if (!this.releasedModes.has(body) || this.world.getBodyMode(body) !== 'kinematic')
          this.releasedModes.set(body, this.world.getBodyMode(body)!);
        if (this.world.getBodyMode(body) !== 'kinematic')
          this.world.setBodyParameters(body, {mode: 'kinematic'});
      } else if (this.releasedModes.has(body)) {
        this.world.setBodyParameters(body, {mode: this.releasedModes.get(body)!});
        this.releasedModes.delete(body);
      }
    }
    this.activeTargets = active;
  }

  captureOwnership(): {
    active: ScenegraphNode[];
    releasedModes: [number, 'static' | 'dynamic' | 'kinematic'][];
  } {
    return {active: [...(this.activeTargets ?? [])], releasedModes: [...this.releasedModes]};
  }

  restoreOwnership(state: ReturnType<ScenegraphPhysicsMotion['captureOwnership']>): void {
    if (
      state.active.some(node => !this.targets.has(node)) ||
      state.releasedModes.some(
        ([body, mode]) =>
          ![...this.targets.values()].includes(body) ||
          !['static', 'dynamic', 'kinematic'].includes(mode)
      )
    )
      throw new Error('Invalid animation ownership capture');
    this.activeTargets = new Set(state.active);
    this.releasedModes.clear();
    for (const [body, mode] of state.releasedModes) this.releasedModes.set(body, mode);
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
          shapeScale: this.world
            .getColliderShapeScale(collider.index)
            .map((value, index) => (value * scale[index]) / previous[index]),
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
      if (this.activeTargets && !this.activeTargets.has(node)) continue;
      if (this.activeTargets && this.world.getBodyMode(body) !== 'kinematic') {
        this.releasedModes.set(body, this.world.getBodyMode(body)!);
        this.world.setBodyParameters(body, {mode: 'kinematic'});
      }
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
      const frame = [...transform.position, ...transform.rotation];
      const previousFrame = this.colliderFrames.get(collider.index);
      if (
        !previousFrame ||
        frame.some((value, index) => Math.abs(value - previousFrame[index]) > 1e-7)
      ) {
        this.world.setColliderTransform(collider.index, transform.position, transform.rotation);
        this.colliderFrames.set(collider.index, frame);
      }
    }
    if (this.inverseBodyFrames.size !== (this.activeTargets?.size ?? this.targets.size))
      throw new Error('Detached physics motion target');
  }
}
