// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import {Buffer, type Device, Texture} from '@luma.gl/core';
import {GroupNode, ModelNode, updateSkinJointMatrices} from '@luma.gl/engine';
import {SKIN_MAX_JOINTS} from '@luma.gl/shadertools';
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
  /** WebGPU storage buffer or WebGL float texture for a palette that exceeds uniform limits. */
  skinJointMatrices?: Buffer | Texture;
  /** Existing primitive models that share this skin binding. */
  models: readonly ModelNode[];
};

/** Inputs already produced by the canonical glTF scenegraph parser. */
export type GLTFSkinControllerProps = {
  device: Device;
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
      if (binding.skinJointMatrices) {
        if (binding.skinJointMatrices instanceof Buffer) {
          binding.skinJointMatrices.write(binding.jointMatrices);
        } else {
          binding.skinJointMatrices.writeData(binding.jointMatrices, {
            width: binding.joints.length * 4,
            height: 1
          });
        }
      }
      for (const modelNode of binding.models) {
        modelNode.model.shaderInputs.setProps({
          skin: binding.skinJointMatrices
            ? {jointMatrices: [], skinJointMatrices: binding.skinJointMatrices}
            : {jointMatrices: binding.jointMatrices}
        });
      }
    }
  }

  /** Finds the binding for an authored glTF node index or generated scenegraph node. */
  getBinding(node: number | GroupNode): GLTFSkinBinding | undefined {
    return this.bindings.find(binding =>
      typeof node === 'number' ? binding.nodeIndex === node : binding.node === node
    );
  }

  /** Releases GPU palette transports owned by this controller. */
  destroy(): void {
    for (const binding of this.bindings) {
      binding.skinJointMatrices?.destroy();
    }
  }
}

function makeSkinBindings(props: GLTFSkinControllerProps): GLTFSkinBinding[] {
  const {gltf, gltfNodeIndexToNodeMap} = props;
  const bindings: GLTFSkinBinding[] = [];
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

    const models = meshNode.children.flatMap(child => (child instanceof ModelNode ? [child] : []));
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
      nodeIndex,
      skinIndex,
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

function createSkinJointPaletteResource(
  device: Device,
  id: string,
  jointMatrices: Float32Array
): Buffer | Texture {
  if (device.type === 'webgpu') {
    return device.createBuffer({
      id: `${id}-skin-joint-matrices`,
      byteLength: jointMatrices.byteLength,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
  }

  const width = jointMatrices.length / 4;
  if (width > device.limits.maxTextureDimension2D) {
    throw new Error('glTF skin palette exceeds the device texture width limit');
  }
  return device.createTexture({
    id: `${id}-skin-joint-matrices`,
    format: 'rgba32float',
    width,
    height: 1,
    usage: Texture.SAMPLE | Texture.COPY_DST,
    sampler: {minFilter: 'nearest', magFilter: 'nearest', mipmapFilter: 'nearest'}
  });
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
