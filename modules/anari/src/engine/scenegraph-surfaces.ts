// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {GroupNode, type ScenegraphNode, type ScenegraphTransformFrame} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {SceneMeshNode} from './scene-mesh-node';
import type {SceneSurface} from './scene-renderer';

type MutableSurface = Omit<SceneSurface, 'transforms' | 'nodes' | 'gpuTransforms'> & {
  transforms: Matrix4[];
  nodes: ScenegraphNode[];
  gpuTransforms?: Omit<NonNullable<SceneSurface['gpuTransforms']>, 'indices' | 'connections'> & {
    indices: number[];
    connections: SceneMeshNode['connection'][];
  };
};

/** Retains object identities, never resolving an authored string ID during a frame. */
export class ScenegraphSurfaces {
  private readonly identifiers = new Map<object, number>();
  private nextIdentifier = 1;
  private used = new Set<object>();
  private getIdentifier(object: object): number {
    this.used.add(object);
    let identifier = this.identifiers.get(object);
    if (identifier === undefined) {
      identifier = this.nextIdentifier++;
      this.identifiers.set(object, identifier);
    }
    return identifier;
  }

  getSurfaces(root: GroupNode): SceneSurface[] {
    this.used.clear();
    const surfaces = new Map<string, MutableSurface>();
    const seen = new Set<ScenegraphNode>();
    const pending: {
      node: ScenegraphNode;
      matrix: Matrix4;
      frame: ScenegraphTransformFrame | null;
      visible: boolean;
    }[] = [{node: root, matrix: new Matrix4(), frame: null, visible: true}];
    while (pending.length) {
      const current = pending.pop()!;
      const {node} = current;
      // Scenegraph traversal requires a tree, including hidden branches.
      assert(!seen.has(node));
      seen.add(node);
      const matrix = new Matrix4(current.matrix).multiplyRight(node.matrix);
      const frame =
        node instanceof GroupNode && node.transformSource
          ? node.transformSource.getFrame()
          : current.frame;
      const binding = frame?.bindings.get(node);
      const visible = current.visible && node.display && binding?.visible !== false;
      if (node instanceof GroupNode) {
        for (let index = node.children.length - 1; index >= 0; index--)
          pending.push({node: node.children[index], matrix, frame, visible});
      } else if (node instanceof SceneMeshNode && visible) {
        if (node.connection && !frame) continue;
        const usesGPU = Boolean(frame && (binding || node.connection));
        const key = [
          this.getIdentifier(node.geometry),
          this.getIdentifier(node.material),
          node.environment ? this.getIdentifier(node.environment) : 0,
          usesGPU ? this.getIdentifier(frame!.matrices) : 0
        ].join('-');
        let surface = surfaces.get(key);
        if (!surface) {
          surface = {
            id: key,
            geometry: node.geometry,
            material: node.material,
            transforms: [],
            nodes: [],
            environment: node.environment,
            ...(usesGPU
              ? {
                  gpuTransforms: {
                    matrices: frame!.matrices,
                    matrixCount: frame!.matrixCount,
                    revision: frame!.revision,
                    indices: [],
                    connections: []
                  }
                }
              : {})
          };
          surfaces.set(key, surface);
        }
        // These arrays belong to this adapter, not to the authored nodes or producer.
        surface.transforms.push(binding ? new Matrix4(binding.localMatrix) : matrix);
        surface.nodes.push(node);
        if (usesGPU) {
          const matrixIndex = node.connection?.first ?? binding!.matrixIndex;
          const secondIndex = node.connection?.second;
          // Both connection endpoints must refer to live matrices in this publication.
          assert(
            Number.isInteger(matrixIndex) && matrixIndex >= 0 && matrixIndex < frame!.matrixCount
          );
          assert(
            secondIndex === undefined ||
              (Number.isInteger(secondIndex) &&
                secondIndex >= 0 &&
                secondIndex < frame!.matrixCount)
          );
          surface.gpuTransforms!.indices.push(matrixIndex);
          surface.gpuTransforms!.connections.push(node.connection);
        }
      } else if (visible && !(node instanceof SceneMeshNode)) {
        // Other engine nodes (lights/attachments) are metadata, not PBR mesh descriptions.
        // ModelNode instances retain their own shader/material path and are deliberately unsupported.
        if ('model' in node)
          throw new Error(
            'SceneRenderer scene traversal requires SceneMeshNode for renderable leaves'
          );
      }
    }
    for (const object of this.identifiers.keys())
      if (!this.used.has(object)) this.identifiers.delete(object);
    return Array.from(surfaces.values());
  }

  destroy(): void {
    this.identifiers.clear();
    this.used.clear();
  }
}
