// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import {assert, Buffer, type Device} from '@luma.gl/core';
import {GroupNode, ModelNode} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import type {GLTFAnimation} from './animations/animations';
import type {GLTFScenegraphs} from './create-scenegraph-from-gltf';
import type {GLTFCrowdModelResources} from './create-gltf-model';
import {createGLTFAnimationNodes} from './gltf-animation-nodes';
import {GLTFAnimator} from './gltf-animator';
import {
  type GLTFCrowdGPUAnimationLayout,
  getGLTFCrowdGPUAnimationFrames
} from './gltf-gpu-animation';
import {GLTFSkinController} from './gltf-skin';

/** Source pose and canonical GPU primitive to populate during one-time baking. */
type GLTFGPUAnimationBinding = {
  nodeIndex: number;
  modelNode: ModelNode;
  /** Ordinary scene traversal already applies the authored bind transform. */
  inverseBindWorldMatrix?: Matrix4;
};

/** Scene state that must remain on the CPU cannot depend on GPU-only animated transforms. */
export function canUseGLTFSceneGPUAnimation(
  gltf: GLTFPostprocessed,
  animations: readonly GLTFAnimation[]
): boolean {
  const parentIds = new Map<string, string[]>();
  const cpuNodeIds = new Set<string>();
  for (const node of gltf.nodes) {
    if (
      node.extensions?.['EXT_mesh_gpu_instancing'] ||
      node.scale?.some(value => value === 0) ||
      (node.matrix && new Matrix4(node.matrix).determinant() === 0)
    ) {
      return false;
    }
    if (node.camera || node.extensions?.['KHR_lights_punctual']) {
      cpuNodeIds.add(node.id);
    }
    for (const child of node.children || []) {
      const parents = parentIds.get(child.id) || [];
      parents.push(node.id);
      parentIds.set(child.id, parents);
    }
  }
  for (const nodeId of cpuNodeIds) {
    for (const parentId of parentIds.get(nodeId) || []) {
      cpuNodeIds.add(parentId);
    }
  }
  return !animations.some(animation =>
    animation.channels.some(
      channel =>
        channel.type === 'node' &&
        channel.path !== 'weights' &&
        channel.path !== 'visibility' &&
        cpuNodeIds.has(channel.targetNodeId)
    )
  );
}

/** Ordinary scene playback uploads frame addresses while shaders sample, blend, and skin. */
export class GLTFGPUAnimationController {
  private readonly bindings: readonly GLTFGPUAnimationBinding[];
  private readonly clipLayouts: ReadonlyMap<string, GLTFCrowdGPUAnimationLayout['clips'][number]>;

  constructor(
    device: Device,
    private readonly scenegraphs: GLTFScenegraphs,
    private readonly layout: GLTFCrowdGPUAnimationLayout
  ) {
    const worldMatrices = collectWorldMatrices(scenegraphs.scenes);
    this.bindings = scenegraphs.gltf.nodes.flatMap((sourceNode, nodeIndex) => {
      const node = scenegraphs.gltfNodeIndexToNodeMap.get(nodeIndex);
      const worldMatrix = node && worldMatrices.get(node);
      const mesh = node?.userData['gltfMesh'];
      if (!sourceNode.mesh || !worldMatrix || !(mesh instanceof GroupNode)) {
        return [];
      }
      return mesh.children.flatMap(child =>
        child instanceof ModelNode
          ? [
              {
                nodeIndex,
                modelNode: child,
                inverseBindWorldMatrix: new Matrix4(worldMatrix).invert()
              }
            ]
          : []
      );
    });
    this.clipLayouts = new Map(layout.clips.map(clip => [clip.name, clip]));
    bakeGLTFGPUAnimationFrames(device, scenegraphs, layout, this.bindings);
    const identity = new Matrix4();
    for (const {modelNode} of this.bindings) {
      const resources = getAnimationResources(modelNode);
      for (let columnIndex = 0; columnIndex < resources.transformBuffers.length; columnIndex++) {
        resources.transformColumns[columnIndex].set(
          identity.slice(columnIndex * 4, columnIndex * 4 + 4)
        );
        resources.transformBuffers[columnIndex].write(resources.transformColumns[columnIndex]);
      }
      modelNode.model.setInstanceCount(1);
    }
    this.update();
  }

  update(): void {
    const animations = this.scenegraphs.animator
      .getAnimations()
      .filter(animation => animation.action.shouldApply && animation.action.weight > 0);
    // Baked playback supports one selected clip and one optional crossfade action.
    assert(animations.length <= 2);
    const primary =
      animations.find(animation => animation.name === this.scenegraphs.animator.activeClip) ||
      animations[0];
    const primaryLayout = (primary && this.clipLayouts.get(primary.name)) || this.layout.clips[0];
    const frames = getGLTFCrowdGPUAnimationFrames(
      primaryLayout,
      primary?.action.time || 0,
      this.layout.sampleRate
    );
    const secondary = animations.find(animation => animation !== primary);
    const secondaryLayout = secondary && this.clipLayouts.get(secondary.name);
    const secondaryFrames =
      secondaryLayout && secondary
        ? getGLTFCrowdGPUAnimationFrames(
            secondaryLayout,
            secondary.action.time,
            this.layout.sampleRate
          )
        : [0, 0, 0];
    const totalWeight = (primary?.action.weight || 0) + (secondary?.action.weight || 0);
    const secondaryWeight =
      secondaryLayout && totalWeight > 0 ? secondary!.action.weight / totalWeight : 0;
    for (const {modelNode} of this.bindings) {
      const resources = getAnimationResources(modelNode);
      resources.animationParameters!.set([...frames, primary?.action.weight || 1]);
      resources.animationBlend!.set([...secondaryFrames, secondaryWeight]);
      resources.animationParameterBuffer!.write(resources.animationParameters!);
      resources.animationBlendBuffer!.write(resources.animationBlend!);
    }
  }
}

/** Shared CPU-only construction pass; no keyframes or joint palettes are evaluated per frame. */
export function bakeGLTFGPUAnimationFrames(
  device: Device,
  scenegraphs: GLTFScenegraphs,
  layout: GLTFCrowdGPUAnimationLayout,
  bindings: readonly GLTFGPUAnimationBinding[]
): void {
  const hierarchy = createGLTFAnimationNodes(scenegraphs, 'gltf-animation-baker');
  const skins = new GLTFSkinController({
    device,
    gltf: scenegraphs.gltf,
    scenes: hierarchy.scenes,
    gltfNodeIndexToNodeMap: hierarchy.nodesByIndex
  });
  const animator = new GLTFAnimator({
    animations: scenegraphs.animations.map(animation => ({
      name: animation.name,
      channels: animation.channels.filter(
        channel => channel.type === 'node' && channel.path !== 'visibility'
      )
    })),
    gltfNodeIdToNodeMap: hierarchy.nodesById,
    autoplay: false
  });
  animator.setUpdateHandler(() => skins.update());
  try {
    for (const clip of layout.clips) {
      // Clips with disjoint tracks must start from the same authored pose.
      for (const [nodeIndex, node] of hierarchy.nodesByIndex) {
        const sourceNode = scenegraphs.gltfNodeIndexToNodeMap.get(nodeIndex)!;
        node.setProps({
          position: Array.from(sourceNode.position),
          rotation: Array.from(sourceNode.rotation),
          scale: Array.from(sourceNode.scale),
          matrix: Array.from(sourceNode.matrix)
        });
        const weights = sourceNode.userData['morphWeights'];
        if (Array.isArray(weights)) {
          node.userData['morphWeights'] = [...weights];
        }
      }
      const animation = animator.selectClip(clip.name);
      animation.action.setLoop('once', 1);
      for (let clipFrame = 0; clipFrame < clip.frameCount; clipFrame++) {
        animation.action.setTime(Math.min(clipFrame / layout.sampleRate, clip.duration));
        animator.update(0);
        const worldMatrices = collectWorldMatrices(hierarchy.scenes);
        for (const binding of bindings) {
          const resources = getAnimationResources(binding.modelNode);
          const values = resources.animationFrameValues!;
          const frameStride = resources.animationFrameStride!;
          const frameOffset = (clip.frameOffset + clipFrame) * frameStride * 4;
          const node = hierarchy.nodesByIndex.get(binding.nodeIndex);
          const worldMatrix = node && worldMatrices.get(node);
          if (worldMatrix) {
            values.set(
              binding.inverseBindWorldMatrix
                ? new Matrix4(binding.inverseBindWorldMatrix).multiplyRight(worldMatrix)
                : worldMatrix,
              frameOffset
            );
          }
          const jointPalette = skins.getBinding(binding.nodeIndex)?.jointMatrices;
          if (jointPalette) {
            values.set(jointPalette, frameOffset + 16);
          }
          const weights = node?.userData['morphWeights'];
          if (Array.isArray(weights)) {
            for (let targetIndex = 0; targetIndex < resources.morphTargetCount; targetIndex++) {
              values[frameOffset + (4 + resources.animationJointCount * 4 + targetIndex) * 4] =
                Number(weights[targetIndex] || 0);
            }
          }
        }
      }
    }
    for (const {modelNode} of bindings) {
      const resources = getAnimationResources(modelNode);
      if (resources.animationFrames instanceof Buffer) {
        resources.animationFrames.write(resources.animationFrameValues!);
      } else {
        resources.animationFrames!.writeData(resources.animationFrameValues!, {
          width: resources.animationFrameStride!,
          height: layout.frameCount
        });
      }
    }
  } finally {
    skins.destroy();
    hierarchy.root.destroy();
  }
}

function getAnimationResources(modelNode: ModelNode): GLTFCrowdModelResources {
  return modelNode.userData['gltfAnimatedCrowd'] as GLTFCrowdModelResources;
}

function collectWorldMatrices(scenes: readonly GroupNode[]): Map<GroupNode, Matrix4> {
  const worldMatrices = new Map<GroupNode, Matrix4>();
  for (const scene of scenes) {
    scene.preorderTraversal((node, {worldMatrix}) => {
      if (node instanceof GroupNode) {
        worldMatrices.set(node, worldMatrix);
      }
    });
  }
  return worldMatrices;
}
