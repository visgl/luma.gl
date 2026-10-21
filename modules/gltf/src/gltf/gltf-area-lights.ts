// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import {assert} from '@luma.gl/core';
import {GroupNode} from '@luma.gl/engine';
import {Matrix4, Vector3} from '@math.gl/core';
import type {AreaLight} from '@luma.gl/shadertools';

type AreaLightDefinition = {
  type: 'rect' | 'disk';
  color?: [number, number, number];
  intensity?: number;
  size?: number;
  rect?: {aspect?: number};
};

export type GLTFAreaLightControllerProps = {
  gltf: GLTFPostprocessed;
  scenes: readonly GroupNode[];
  gltfNodeIndexToNodeMap: ReadonlyMap<number, GroupNode>;
};

/** Resolves visible draft EXT_lights_area instances from the current scenegraph transforms. */
export class GLTFAreaLightController {
  private scenes: readonly GroupNode[];
  private readonly sourceNodes = new Map<GroupNode, GLTFPostprocessed['nodes'][number]>();
  private readonly definitions = new Map<GroupNode, AreaLightDefinition>();

  constructor({gltf, scenes, gltfNodeIndexToNodeMap}: GLTFAreaLightControllerProps) {
    this.scenes = scenes;
    const lights = gltf.extensions?.['EXT_lights_area']?.lights as
      | AreaLightDefinition[]
      | undefined;
    for (const [index, source] of gltf.nodes.entries()) {
      const node = gltfNodeIndexToNodeMap.get(index);
      if (!node) continue;
      this.sourceNodes.set(node, source);
      const lightIndex = source.extensions?.['EXT_lights_area']?.light;
      if (lightIndex === undefined) continue;
      const definition = lights?.[lightIndex];
      // Every node light reference must resolve to a supported shape and finite physical values.
      assert(definition && (definition.type === 'rect' || definition.type === 'disk'));
      assert(Number.isFinite(definition.size ?? 1) && (definition.size ?? 1) > 0);
      assert(Number.isFinite(definition.intensity ?? 1000) && (definition.intensity ?? 1000) > 0);
      assert(Number.isFinite(definition.rect?.aspect ?? 1) && (definition.rect?.aspect ?? 1) > 0);
      assert(
        (definition.color || [1, 1, 1]).every(
          component => Number.isFinite(component) && component >= 0
        )
      );
      this.definitions.set(node, definition);
    }
  }

  /** Recompute after animation. Scale controls size uniformly and does not change emitting rotation. */
  getLights(): AreaLight[] {
    const result: AreaLight[] = [];
    const visit = (node: GroupNode, parentMatrix: Matrix4, parentRotation: Matrix4): void => {
      if (!node.display) return;
      const worldMatrix = new Matrix4(parentMatrix).multiplyRight(node.matrix);
      const source = this.sourceNodes.get(node);
      const localRotation = source?.matrix
        ? getMatrixRotation(node.matrix)
        : node.rotation.length === 4
          ? new Matrix4().fromQuaternion(node.rotation)
          : new Matrix4().rotateXYZ(node.rotation);
      const worldRotation = new Matrix4(parentRotation).multiplyRight(localRotation);
      const definition = this.definitions.get(node);
      if (definition) {
        const scale = Math.max(...worldMatrix.getScale().map(Math.abs));
        const height = (definition.size ?? 1) * scale;
        const width = height * (definition.type === 'rect' ? (definition.rect?.aspect ?? 1) : 1);
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
    for (const scene of this.scenes) visit(scene, new Matrix4(), new Matrix4());
    return result;
  }

  destroy(): void {
    this.scenes = [];
    this.sourceNodes.clear();
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
  vertical.subtract(new Vector3(horizontal).scale(vertical.dot(horizontal)));
  assert(vertical.magnitude() > 1e-8);
  vertical.normalize();
  const forward = new Vector3(horizontal).cross(vertical).normalize();
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
