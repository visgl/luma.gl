// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import {GroupNode, decomposePhysicsTransform, type ScenegraphNode} from '../../index';
import type {GPURigidBodyWorld} from '@luma.gl/graph/gpu-physics';
import type {GPURigidBodyBounds} from '@luma.gl/graph/gpu-physics';

export type ScenegraphPhysicsRenderBinding = {
  body: number;
  /** Mesh-to-body-node transform; multiply after the published GPU body matrix. */
  localMatrix: Matrix4;
  visible: boolean;
};

/** Authoring transforms feed GPU publication metadata; simulated poses never come back. */
export class ScenegraphPhysicsPublication {
  readonly bindings = new Map<ScenegraphNode, ScenegraphPhysicsRenderBinding>();
  private boundsKey = '';
  constructor(
    readonly world: GPURigidBodyWorld,
    readonly roots: readonly ScenegraphNode[],
    readonly bodies: ReadonlyMap<ScenegraphNode, number>
  ) {
    if (!world.poseMatrices || !world.poseBounds)
      throw new Error('Scene publication requires pose and bounds buffers');
    this.update();
  }

  get matrices() {
    return this.world.poseMatrices!;
  }
  get bounds() {
    return this.world.poseBounds!;
  }

  /** Include instance/deformation bounds supplied by the engine renderer. */
  update(): void {
    const bounds: [number[], number[]][] = Array.from({length: this.world.count}, () => [
      [Infinity, Infinity, Infinity],
      [-Infinity, -Infinity, -Infinity]
    ]);
    const bindings = new Map<ScenegraphNode, ScenegraphPhysicsRenderBinding>();
    const seen = new Set<ScenegraphNode>();
    const visit = (
      node: ScenegraphNode,
      parent: Matrix4,
      inheritedBody?: number,
      inheritedInverse?: Matrix4,
      visible = true
    ) => {
      if (seen.has(node)) throw new Error('Physics publication scene must be a tree');
      seen.add(node);
      const matrix = new Matrix4(parent).multiplyRight(node.matrix);
      const body = this.bodies.get(node) ?? inheritedBody;
      let inverse = inheritedInverse;
      if (this.bodies.has(node)) {
        const transform = decomposePhysicsTransform(matrix);
        inverse = new Matrix4()
          .translate(transform.position)
          .multiplyRight(new Matrix4().fromQuaternion(transform.rotation))
          .invert();
      }
      const displayed = visible && node.display;
      if (body !== undefined && inverse) {
        const localMatrix = new Matrix4(inverse).multiplyRight(matrix);
        if (!Number.isInteger(body) || body < 0 || body >= this.world.count)
          throw new Error('Invalid publication body');
        bindings.set(node, {body, localMatrix, visible: displayed});
        // Group bounds include descendants, which may belong to independent child bodies.
        const localBounds = node instanceof GroupNode ? null : node.getBounds();
        if (
          localBounds &&
          (localBounds.length !== 2 ||
            localBounds.some(vector => vector.length !== 3 || !vector.every(Number.isFinite)))
        )
          throw new Error('Invalid scene bounds');
        if (localBounds)
          for (let corner = 0; corner < 8; corner++) {
            const point = localMatrix.transformAsPoint([
              localBounds[corner & 1][0],
              localBounds[(corner >> 1) & 1][1],
              localBounds[(corner >> 2) & 1][2]
            ]);
            for (let axis = 0; axis < 3; axis++) {
              bounds[body][0][axis] = Math.min(bounds[body][0][axis], point[axis]);
              bounds[body][1][axis] = Math.max(bounds[body][1][axis], point[axis]);
            }
          }
      }
      if (node instanceof GroupNode)
        for (const child of node.children) visit(child, matrix, body, inverse, displayed);
    };
    for (const root of this.roots) visit(root, new Matrix4());

    const publicationBounds: GPURigidBodyBounds[] = bounds.map(([minimum, maximum]) =>
      Number.isFinite(minimum[0])
        ? [
            [minimum[0], minimum[1], minimum[2]],
            [maximum[0], maximum[1], maximum[2]]
          ]
        : [
            [0, 0, 0],
            [0, 0, 0]
          ]
    );
    const key = JSON.stringify(publicationBounds);
    if (key !== this.boundsKey) {
      this.world.setPublicationBounds(publicationBounds);
      this.boundsKey = key;
    }
    this.bindings.clear();
    for (const [node, binding] of bindings) this.bindings.set(node, binding);
  }
}
