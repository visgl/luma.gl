// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import {GroupNode, ModelNode, updateSkinJointMatrices} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';

/** One glTF mesh node and the existing models driven by its source skin. */
export type GLTFSkinBinding = {
  /** Source glTF node that owns the skinned mesh. */
  nodeIndex: number;
  /** Source glTF skin selected for this mesh. */
  skinIndex: number;
  /** Animated scenegraph node that owns the skinned mesh. */
  node: GroupNode;
  /** Animated joint nodes in their source palette order. */
  joints: readonly GroupNode[];
  /** Optional authored inverse bind matrices. */
  inverseBindMatrices?: Float32Array;
  /** Reused, mesh-local joint palette supplied to the existing skin shader. */
  jointMatrices: Float32Array;
  /** Existing primitive models that share this skin binding. */
  models: readonly ModelNode[];
};

/** Inputs already produced by the canonical glTF scenegraph parser. */
export type GLTFSkinControllerProps = {
  gltf: GLTFPostprocessed;
  scenes: readonly GroupNode[];
  gltfNodeIndexToNodeMap: ReadonlyMap<number, GroupNode>;
};

/** Updates glTF-owned joint palettes once per animation frame using existing model shaders. */
export class GLTFSkinController {
  readonly bindings: readonly GLTFSkinBinding[];

  private readonly scenes: readonly GroupNode[];

  constructor(props: GLTFSkinControllerProps) {
    this.scenes = props.scenes;
    this.bindings = makeSkinBindings(props);
    this.update();
  }

  /** Re-evaluates every source skin after its animated node transforms have changed. */
  update(): void {
    if (this.bindings.length === 0) {
      return;
    }

    const worldMatrices = new Map<GroupNode, Matrix4>();
    for (const scene of this.scenes) {
      scene.preorderTraversal((node, {worldMatrix}) => {
        if (node instanceof GroupNode) {
          worldMatrices.set(node, new Matrix4(worldMatrix));
        }
      });
    }

    for (const binding of this.bindings) {
      updateSkinJointMatrices({
        joints: binding.joints,
        meshNode: binding.node,
        worldMatrices,
        inverseBindMatrices: binding.inverseBindMatrices,
        target: binding.jointMatrices
      });
      for (const modelNode of binding.models) {
        modelNode.model.shaderInputs.setProps({skin: {jointMatrices: binding.jointMatrices}});
      }
    }
  }

  /** Finds the binding for an authored glTF node index or generated scenegraph node. */
  getBinding(node: number | GroupNode): GLTFSkinBinding | undefined {
    return this.bindings.find(binding =>
      typeof node === 'number' ? binding.nodeIndex === node : binding.node === node
    );
  }
}

function makeSkinBindings(props: GLTFSkinControllerProps): GLTFSkinBinding[] {
  const {gltf, gltfNodeIndexToNodeMap} = props;
  const bindings: GLTFSkinBinding[] = [];
  const sourceSkins = gltf.skins || [];

  for (const [nodeIndex, sourceNode] of gltf.nodes.entries()) {
    const sourceNodeSkin = sourceNode.skin;
    if (sourceNodeSkin === undefined || !sourceNode.mesh) {
      continue;
    }

    const skinIndex = resolveGLTFSkinIndex(gltf, sourceNodeSkin);
    const sourceSkin = sourceSkins[skinIndex];
    const node = gltfNodeIndexToNodeMap.get(nodeIndex);
    if (!sourceSkin || !node) {
      continue;
    }

    const joints = sourceSkin.joints.flatMap(jointIndex => {
      const joint = gltfNodeIndexToNodeMap.get(jointIndex);
      return joint ? [joint] : [];
    });
    if (joints.length !== sourceSkin.joints.length) {
      continue;
    }

    const sourceMesh = sourceNode.mesh;
    const meshNode = node.children.find(
      child => child instanceof GroupNode && child.id === (sourceMesh.name || sourceMesh.id)
    );
    if (!(meshNode instanceof GroupNode)) {
      continue;
    }

    const models = meshNode.children.flatMap(child => (child instanceof ModelNode ? [child] : []));
    const inverseBindMatrices = sourceSkin.inverseBindMatrices?.value;
    bindings.push({
      nodeIndex,
      skinIndex,
      node,
      joints,
      ...(inverseBindMatrices instanceof Float32Array ? {inverseBindMatrices} : {}),
      jointMatrices: new Float32Array(joints.length * 16),
      models
    });
  }

  return bindings;
}

/** Resolves both numeric and loaders.gl-postprocessed source skin references. */
export function resolveGLTFSkinIndex(
  gltf: GLTFPostprocessed,
  sourceSkin: number | {id?: string; joints?: readonly number[]; inverseBindMatrices?: unknown}
): number {
  if (typeof sourceSkin === 'number') {
    return sourceSkin;
  }

  return (gltf.skins || []).findIndex(candidate => {
    if (candidate === sourceSkin || (sourceSkin.id && candidate.id === sourceSkin.id)) {
      return true;
    }
    if (
      candidate.joints.length !== sourceSkin.joints?.length ||
      !candidate.joints.every((joint, index) => joint === sourceSkin.joints?.[index])
    ) {
      return false;
    }

    if (typeof sourceSkin.inverseBindMatrices === 'number') {
      const accessor = gltf.accessors[sourceSkin.inverseBindMatrices];
      return !candidate.inverseBindMatrices || candidate.inverseBindMatrices === accessor;
    }
    return true;
  });
}
