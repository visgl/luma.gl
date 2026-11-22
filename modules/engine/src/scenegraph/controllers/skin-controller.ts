// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, Texture} from '@luma.gl/core';
import {Matrix4} from '@math.gl/core/matrix';
import {GroupNode} from '../group-node';
import type {ModelNode} from '../model-node';
import {updateSkinJointMatrices} from '../../animation/skin';

/** Resolved mesh, joint nodes, and owned GPU palette storage. */
export type SkinBinding = {
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

export type SkinControllerProps = {
  scenes: readonly GroupNode[];
  bindings: readonly SkinBinding[];
};

/** Updates resolved joint palettes independently of their source asset format. */
export class SkinController {
  readonly bindings: readonly SkinBinding[];

  /** Palettes owned by a GPU producer for the duration of their binding. */
  private readonly gpuDriven = new Set<SkinBinding>();

  private readonly scenes: readonly GroupNode[];

  constructor(props: SkinControllerProps) {
    this.scenes = props.scenes;
    this.bindings = props.bindings;
    this.update();
  }

  /** Re-evaluates every source skin after its animated node transforms have changed. */
  update(): void {
    if (this.gpuDriven.size === this.bindings.length) {
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
      if (this.gpuDriven.has(binding)) continue;
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

  /** Borrow a WebGPU storage palette and suspend CPU writes until the lease is released. */
  claimGPUPalette(binding: SkinBinding): () => void {
    if (!this.bindings.includes(binding) || !(binding.skinJointMatrices instanceof Buffer))
      throw new Error('GPU skinning requires an owned storage palette');
    if (this.gpuDriven.has(binding)) throw new Error('Skin palette already has a GPU producer');
    this.gpuDriven.add(binding);
    /** Only this lease can remove its claim, even if its disposer is called twice. */
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.gpuDriven.delete(binding);
    };
  }

  /** Finds the palette driven by a scenegraph node. */
  getBinding(node: GroupNode | undefined): SkinBinding | undefined {
    return this.bindings.find(binding => binding.node === node);
  }

  /** Releases GPU palette transports owned by this controller. */
  destroy(): void {
    for (const binding of this.bindings) {
      binding.skinJointMatrices?.destroy();
    }
  }
}

export function createSkinJointPaletteResource(
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
    throw new Error('Skin palette exceeds the device texture width limit');
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
