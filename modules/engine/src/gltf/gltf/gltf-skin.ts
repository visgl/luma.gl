// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFPostprocessed} from '../types/gltf-postprocessed-schema';
import {Buffer, type Device, Texture} from '@luma.gl/core';
import {
  GroupNode,
  ModelNode,
  type SkinBinding,
  type SkinControllerProps,
  createSkinJointPaletteResource
} from '@luma.gl/engine';
import {SKIN_MAX_JOINTS} from '@luma.gl/shaders';

/** Inputs already produced by the canonical glTF scenegraph parser. */
export type ParseGLTFSkinsProps = {
  device: Device;
  gltf: GLTFPostprocessed;
  scenes: readonly GroupNode[];
  gltfNodeIndexToNodeMap: ReadonlyMap<number, GroupNode>;
};

/** Resolve imported skins into the engine controller's mesh and joint bindings. */
export function parseGLTFSkins(props: ParseGLTFSkinsProps): SkinControllerProps {
  return {scenes: props.scenes, bindings: makeSkinBindings(props)};
}

function makeSkinBindings(props: ParseGLTFSkinsProps): SkinBinding[] {
  const {gltf, gltfNodeIndexToNodeMap} = props;
  const bindings: SkinBinding[] = [];
  const sourceSkins = gltf.skins || [];
  const reachableNodes = new Set<GroupNode>();
  for (const scene of props.scenes) {
    scene.preorderTraversal(node => {
      if (node instanceof GroupNode) {
        reachableNodes.add(node);
      }
    });
  }

  for (const [nodeIndex, sourceNode] of gltf.nodes.entries()) {
    const sourceNodeSkin = sourceNode.skin;
    if (sourceNodeSkin === undefined || !sourceNode.mesh) {
      continue;
    }

    const skinIndex = resolveGLTFSkinIndex(gltf, sourceNodeSkin);
    const sourceSkin = sourceSkins[skinIndex];
    const node = gltfNodeIndexToNodeMap.get(nodeIndex);
    if (!sourceSkin || !node || !reachableNodes.has(node)) {
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
    const ownedMesh = node.userData['gltfMesh'];
    const meshNode =
      ownedMesh instanceof GroupNode
        ? ownedMesh
        : node.children.find(
            child => child instanceof GroupNode && child.id === (sourceMesh.name || sourceMesh.id)
          );
    if (!(meshNode instanceof GroupNode)) {
      continue;
    }

    const models: ModelNode[] = [];
    meshNode.preorderTraversal(child => {
      if (child instanceof ModelNode) models.push(child);
    });
    const inverseBindMatrices = sourceSkin.inverseBindMatrices?.value;
    const jointMatrices = new Float32Array(joints.length * 16);
    const usesLargeSkinPalette =
      joints.length > SKIN_MAX_JOINTS &&
      models.some(modelNode => modelNode.userData['gltfLargeSkinPalette'] === true);
    let skinJointMatrices: Buffer | Texture | undefined;
    if (usesLargeSkinPalette) {
      skinJointMatrices = createSkinJointPaletteResource(props.device, node.id, jointMatrices);
    }
    bindings.push({
      node,
      joints,
      ...(inverseBindMatrices instanceof Float32Array ? {inverseBindMatrices} : {}),
      jointMatrices,
      ...(skinJointMatrices ? {skinJointMatrices} : {}),
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
