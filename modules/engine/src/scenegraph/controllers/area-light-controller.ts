// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {GroupNode} from '../group-node';
import {Matrix4, Vector3} from '@math.gl/core';
import type {AreaLight} from '@luma.gl/shaders';

export type AreaLightDefinition = {
  type: 'rect' | 'disk';
  color?: [number, number, number];
  intensity?: number;
  width?: number;
  height?: number;
};

export type AreaLightBinding = {
  node: GroupNode;
  definition: AreaLightDefinition;
  matrixAuthored?: boolean;
};
export type AreaLightControllerProps = {
  scenes: readonly GroupNode[];
  bindings: readonly AreaLightBinding[];
  /** Nodes using explicit matrices rather than separately authored TRS components. */
  matrixNodes?: readonly GroupNode[];
};

/** Resolves visible area-light instances from the current scenegraph transforms. */
export class AreaLightController {
  private scenes: readonly GroupNode[];
  private readonly matrixAuthoredNodes = new Set<GroupNode>();
  private readonly definitions = new Map<GroupNode, AreaLightDefinition>();

  constructor({scenes, bindings, matrixNodes = []}: AreaLightControllerProps) {
    this.scenes = scenes;
    for (const node of matrixNodes) this.matrixAuthoredNodes.add(node);
    for (const {node, definition, matrixAuthored} of bindings) {
      if (matrixAuthored) this.matrixAuthoredNodes.add(node);
      // Every node light reference must resolve to a supported shape and finite physical values.
      assert(definition && (definition.type === 'rect' || definition.type === 'disk'));
      assert(Number.isFinite(definition.height ?? 1) && (definition.height ?? 1) > 0);
      assert(Number.isFinite(definition.intensity ?? 1000) && (definition.intensity ?? 1000) > 0);
      assert(Number.isFinite(definition.width ?? 1) && (definition.width ?? 1) > 0);
      assert(
        (definition.color || [1, 1, 1]).every(
          component => Number.isFinite(component) && component >= 0
        )
      );
      this.definitions.set(node, definition);
    }
  }

  /** Recompute after animation. Scale controls size uniformly and does not change emitting rotation. */
  getLights(sceneIndex = 0): AreaLight[] {
    const scene = this.scenes[sceneIndex];
    if (!scene) return [];
    const result: AreaLight[] = [];
    const lightBranches = new Set<GroupNode>();
    const collectLightBranches = (node: GroupNode): boolean => {
      let containsLight = this.definitions.has(node);
      for (const child of node.children) {
        if (child instanceof GroupNode && collectLightBranches(child)) containsLight = true;
      }
      if (containsLight) lightBranches.add(node);
      return containsLight;
    };
    collectLightBranches(scene);
    const visit = (node: GroupNode, parentMatrix: Matrix4, parentRotation: Matrix4): void => {
      if (!node.display || !lightBranches.has(node)) return;
      const worldMatrix = new Matrix4(parentMatrix).multiplyRight(node.matrix);
      const localRotation = this.matrixAuthoredNodes.has(node)
        ? getMatrixRotation(node.matrix)
        : node.rotation.length === 4
          ? new Matrix4().fromQuaternion(node.rotation)
          : new Matrix4().rotateXYZ(node.rotation);
      const worldRotation = new Matrix4(parentRotation).multiplyRight(localRotation);
      const definition = this.definitions.get(node);
      if (definition) {
        const scale = Math.max(...worldMatrix.getScale().map(Math.abs));
        const height = (definition.height ?? 1) * scale;
        const width = definition.type === 'rect' ? (definition.width ?? 1) * scale : height;
        result.push({
          type: definition.type,
          position: [worldMatrix[12], worldMatrix[13], worldMatrix[14]],
          halfAxisX: [
            (worldRotation[0] * width) / 2,
            (worldRotation[1] * width) / 2,
            (worldRotation[2] * width) / 2
          ],
          halfAxisY: [
            (worldRotation[4] * height) / 2,
            (worldRotation[5] * height) / 2,
            (worldRotation[6] * height) / 2
          ],
          normal: [-worldRotation[8], -worldRotation[9], -worldRotation[10]],
          color: definition.color || [1, 1, 1],
          intensity: definition.intensity ?? 1000
        });
      }
      for (const child of node.children)
        if (child instanceof GroupNode) visit(child, worldMatrix, worldRotation);
    };
    visit(scene, new Matrix4(), new Matrix4());
    return result;
  }

  destroy(): void {
    this.scenes = [];
    this.matrixAuthoredNodes.clear();
    this.definitions.clear();
  }
}

/** Remove matrix scale and shear when recovering a rotation from a matrix-authored node. */
function getMatrixRotation(matrix: Matrix4): Matrix4 {
  const horizontal = new Vector3(matrix[0], matrix[1], matrix[2]);
  const vertical = new Vector3(matrix[4], matrix[5], matrix[6]);
  // Matrix-authored lights require a recoverable orientation.
  assert(horizontal.magnitude() > 0 && vertical.magnitude() > 0);
  horizontal.normalize();
  vertical.normalize();
  vertical.subtract(new Vector3(horizontal).scale(vertical.dot(horizontal)));
  assert(vertical.magnitude() > 1e-8);
  vertical.normalize();
  const forward = new Vector3(horizontal).cross(vertical).normalize();
  const authoredForward = new Vector3(matrix[8], matrix[9], matrix[10]);
  assert(authoredForward.magnitude() > 0);
  authoredForward.normalize();
  // Reflections must retain the authored emitting side after scale removal.
  assert(Math.abs(forward.dot(authoredForward)) > 1e-8);
  if (forward.dot(authoredForward) < 0) forward.negate();
  return new Matrix4([
    horizontal[0],
    horizontal[1],
    horizontal[2],
    0,
    vertical[0],
    vertical[1],
    vertical[2],
    0,
    forward[0],
    forward[1],
    forward[2],
    0,
    0,
    0,
    0,
    1
  ]);
}
