// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {GroupNode} from '../group-node';
import {ScenegraphNode} from '../scenegraph-node';
import {Matrix4, Vector3, type NumericArray} from '@math.gl/core';

/** Camera-facing surface orientation and overlay behavior. */
export type BillboardOrientation = {
  scaleWithDistance?: boolean;
  viewDirection?: [number, number, number];
  up?: [number, number, number];
  rotationAxis?: 'all' | 'y';
  overlay?: boolean;
};

export type BillboardControllerProps = {
  scenes: readonly GroupNode[];
  bindings: readonly BillboardBinding[];
};

export type BillboardDrawEntry = {
  node: ScenegraphNode;
  /** Complete leaf transform, including its own matrix. */
  modelMatrix: Matrix4;
  /** Draw after ordinary geometry, with depth testing/writing disabled. */
  overlay: boolean;
};

export type BillboardBinding = {
  node: ScenegraphNode;
  definition: BillboardOrientation;
  /** Matrix-authored nodes need scale decomposition; TRS nodes retain signed scales. */
  matrixAuthored?: boolean;
};

/** Camera-facing traversal over resolved scenegraph bindings. */
export class BillboardController {
  private readonly scenes: readonly GroupNode[];
  private readonly bindings = new Map<ScenegraphNode, BillboardBinding>();
  private readonly cameraDepths = new Map<string, Map<ScenegraphNode, number>>();

  constructor(props: BillboardControllerProps) {
    this.scenes = props.scenes;
    for (const binding of props.bindings) {
      const {definition} = binding;
      const forward = new Vector3(definition.viewDirection || [0, 0, 1]);
      const up = new Vector3(definition.up || [0, 1, 0]);
      // The draft requires nonzero, nonparallel facing and up vectors.
      assert(forward.magnitude() > 0 && up.magnitude() > 0);
      assert(
        new Vector3(forward).normalize().cross(new Vector3(up).normalize()).magnitude() > 1e-6
      );
      this.bindings.set(binding.node, binding);
    }
  }

  /** Derive transforms after animation, without mutating source or runtime node matrices. */
  getDrawEntries(options: {
    viewMatrix: NumericArray;
    sceneIndex?: number;
    cameraId?: string;
  }): BillboardDrawEntry[] {
    const {sceneIndex = 0, cameraId = 'default'} = options;
    const scene = this.scenes[sceneIndex];
    assert(scene);
    const viewMatrix = new Matrix4(options.viewMatrix);
    const cameraMatrix = new Matrix4(viewMatrix).invert();
    const cameraPosition = new Vector3(cameraMatrix.getTranslation());
    const cameraRight = new Vector3(1, 0, 0).transformAsVector(cameraMatrix).normalize();
    const cameraUp = new Vector3(0, 1, 0).transformAsVector(cameraMatrix).normalize();
    let depths = this.cameraDepths.get(cameraId);
    if (!depths) {
      depths = new Map();
      this.cameraDepths.set(cameraId, depths);
    }
    const activeBillboards = new Set<ScenegraphNode>();
    const entries: (BillboardDrawEntry & {distance: number; depth: number})[] = [];
    const visit = (
      node: ScenegraphNode,
      parentMatrix: Matrix4,
      parentOverlay: boolean,
      overlayDistance = 0
    ): void => {
      if (!node.display) return;
      let modelMatrix = new Matrix4(parentMatrix).multiplyRight(node.matrix);
      const binding = this.bindings.get(node);
      const overlay = parentOverlay || Boolean(binding?.definition.overlay);
      if (binding?.definition.overlay) {
        overlayDistance = new Vector3(modelMatrix.getTranslation()).distance(cameraPosition);
      }
      if (binding) {
        activeBillboards.add(node);
        const position = new Vector3(modelMatrix.getTranslation());
        const forward = new Vector3(cameraPosition).subtract(position);
        if (forward.magnitude() < 1e-8)
          forward.copy([cameraMatrix[8], cameraMatrix[9], cameraMatrix[10]]);
        if (binding.definition.rotationAxis === 'y') {
          forward[1] = 0;
          if (forward.magnitude() < 1e-8) forward.copy([0, 0, 1]);
        }
        forward.normalize();
        let up =
          binding.definition.rotationAxis === 'y'
            ? new Vector3(0, 1, 0)
            : new Vector3(forward).cross(cameraRight);
        if (up.magnitude() < 1e-8)
          up = new Vector3(cameraUp).subtract(new Vector3(forward).scale(cameraUp.dot(forward)));
        up.normalize();
        const worldBasis = makeBasis(forward, up);
        const scale = binding.matrixAuthored
          ? new Vector3(node.matrix.getScale())
          : new Vector3(node.scale);
        if (binding.matrixAuthored && node.matrix.determinant() < 0) scale[0] = -scale[0];
        const localForward = new Vector3(binding.definition.viewDirection || [0, 0, 1]).multiply(
          scale
        );
        const localUp = new Vector3(binding.definition.up || [0, 1, 0]).multiply(scale);
        // A flattened scale can collapse axes or make them parallel; retain the authored basis.
        const hasScaledBasis =
          localForward.magnitude() > 1e-8 &&
          localUp.magnitude() > 1e-8 &&
          new Vector3(localForward)
            .normalize()
            .cross(new Vector3(localUp).normalize())
            .magnitude() > 1e-8;
        const localBasis = makeBasis(
          hasScaledBasis
            ? localForward
            : new Vector3(binding.definition.viewDirection || [0, 0, 1]),
          hasScaledBasis ? localUp : new Vector3(binding.definition.up || [0, 1, 0])
        );
        if (binding.definition.scaleWithDistance) {
          const depth = Math.abs(new Vector3(position).transformAsPoint(viewMatrix)[2]);
          if (!depths!.has(node) && depth > 1e-8) depths!.set(node, depth);
          const initialDepth = depths!.get(node);
          // Defer reference capture at the eye plane; crossing it must never invert winding.
          if (initialDepth !== undefined) scale.scale(depth / initialDepth);
        }
        modelMatrix = new Matrix4()
          .translate(position)
          .multiplyRight(worldBasis)
          .multiplyRight(localBasis.transpose())
          .scale(scale);
      }
      if (node instanceof GroupNode) {
        for (const child of node.children) visit(child, modelMatrix, overlay, overlayDistance);
      } else {
        entries.push({
          node,
          modelMatrix,
          overlay,
          distance: overlayDistance,
          depth: -new Vector3(modelMatrix.getTranslation()).transformAsPoint(viewMatrix)[2]
        });
      }
    };
    visit(scene, new Matrix4(), false);
    for (const node of depths.keys()) if (!activeBillboards.has(node)) depths.delete(node);
    // Stable sort preserves source order for ordinary geometry and equal-distance overlays.
    entries.sort(
      (first, second) =>
        Number(first.overlay) - Number(second.overlay) ||
        (first.overlay ? second.distance - first.distance || second.depth - first.depth : 0)
    );
    return entries;
  }

  /** Reset reference depths when replacing a camera or detaching/re-attaching a scene. */
  resetCamera(cameraId = 'default'): void {
    this.cameraDepths.delete(cameraId);
  }

  destroy(): void {
    this.bindings.clear();
    this.cameraDepths.clear();
  }
}

function makeBasis(forward: Vector3, up: Vector3): Matrix4 {
  forward = new Vector3(forward).normalize();
  const right = new Vector3(up).cross(forward).normalize();
  up = new Vector3(forward).cross(right).normalize();
  return new Matrix4([
    right[0],
    right[1],
    right[2],
    0,
    up[0],
    up[1],
    up[2],
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
