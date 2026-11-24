// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type CommandEncoder, type Device} from '@luma.gl/core';
import {Matrix4} from '@math.gl/core/matrix';
import {Computation} from '../../compute/computation';
import type {SkinBinding, SkinController} from '../../scenegraph/controllers/skin-controller';
import type {ScenegraphPhysicsPublication} from './scenegraph-publication';

/** Writes the same mesh-local matrices consumed by the standard skin shader. */
const PALETTE_SOURCE = /* wgsl */ `
@group(0) @binding(0) var<storage, read> bodyPoses: array<mat4x4<f32>>;
@group(0) @binding(1) var<storage, read> bodyIndices: array<u32>;
@group(0) @binding(2) var<storage, read> paletteTransforms: array<mat4x4<f32>>;
@group(0) @binding(3) var<storage, read_write> jointPalette: array<mat4x4<f32>>;

@compute @workgroup_size(32)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let joint = invocation.x;
  if (joint >= arrayLength(&bodyIndices)) { return; }
  jointPalette[joint] = paletteTransforms[0] * bodyPoses[bodyIndices[joint]]
    * paletteTransforms[joint + 1];
}
`;

/** Connects a physics publication to an existing WebGPU skin palette. */
export class ScenegraphRagdoll {
  /** One body index for each skin joint, in original palette order. */
  private readonly indices: Buffer;
  /** Inverse mesh transform followed by body-local joint and inverse bind transforms. */
  private readonly transforms: Buffer;
  /** Borrowed storage palette owned by the SkinController. */
  private readonly palette: Buffer;
  /** Compute pipeline used exclusively to transfer solved poses to this skin. */
  private readonly computation: Computation;
  /** Identifies the publication revision from which the joint mappings were built. */
  private publication?: ScenegraphPhysicsPublication;
  /** Releases exclusive GPU write access to the palette. */
  private releasePalette?: () => void;

  /** Use an existing skin and its WebGPU storage palette. The caller owns its physics session. */
  constructor(
    device: Device,
    private readonly skins: SkinController,
    private readonly binding: SkinBinding
  ) {
    if (
      device.type !== 'webgpu' ||
      !(binding.skinJointMatrices instanceof Buffer) ||
      !binding.joints.length ||
      !skins.bindings.includes(binding)
    ) {
      throw new Error('ScenegraphRagdoll requires a WebGPU storage skin palette');
    }
    this.palette = binding.skinJointMatrices;
    this.computation = new Computation(device, {id: 'ragdoll-palette', source: PALETTE_SOURCE});
    this.indices = device.createBuffer({
      id: 'ragdoll-body-indices',
      byteLength: binding.joints.length * 4,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    this.transforms = device.createBuffer({
      id: 'ragdoll-palette-transforms',
      byteLength: (binding.joints.length + 1) * 64,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
  }

  /** Encode after physics and before drawing. Supply the full mesh matrix in the publication's origin-relative frame. */
  encode(
    encoder: CommandEncoder,
    publication: ScenegraphPhysicsPublication,
    meshWorldMatrix: Matrix4
  ): void {
    if (publication !== this.publication) this.bindPublication(publication);
    /** Only the authored mesh frame is uploaded each frame. The solved transforms stay on the GPU. */
    const inverseMesh = new Float32Array(meshWorldMatrix.clone().invert());
    this.transforms.write(inverseMesh);
    this.computation.predraw(encoder);
    /** Schedule palette generation after physics pose publication in the same command buffer. */
    const pass = encoder.beginComputePass({id: 'ragdoll-skinning'});
    this.computation.dispatch(pass, Math.ceil(this.binding.joints.length / 32));
    pass.end();
  }

  /** Return palette control to the scenegraph animator before sampling a fresh animation pose. */
  reset(): void {
    this.releasePalette?.();
    this.releasePalette = undefined;
    this.publication = undefined;
  }

  /** Release compute resources. Destroy the ragdoll before its shared skin controller. */
  destroy(): void {
    this.reset();
    this.computation.destroy();
    this.indices.destroy();
    this.transforms.destroy();
  }

  /** Resolve joints through the same scenegraph publication used by rigid rendering. */
  private bindPublication(publication: ScenegraphPhysicsPublication): void {
    /** Authoring resolves each joint to its closest ancestor body and body-local frame. */
    const indices = new Uint32Array(this.binding.joints.length);
    /** Fold each inverse bind matrix into its body-local joint frame once per handoff. */
    const transforms = new Float32Array(this.binding.joints.length * 16);
    for (const [index, joint] of this.binding.joints.entries()) {
      /** Bones and rigid joint attachment nodes remain distinct scenegraph objects. */
      const target = publication.bindings.get(joint);
      if (!target) throw new Error(`No published rigid body for skin joint ${joint.id}`);
      indices[index] = target.body;
      /** The publication's transform retains authored scale and mesh-to-body offsets. */
      const transform = target.localMatrix.clone();
      if (this.binding.inverseBindMatrices) {
        transform.multiplyRight(
          this.binding.inverseBindMatrices.subarray(index * 16, index * 16 + 16)
        );
      }
      transforms.set(transform, index * 16);
    }
    this.releasePalette ??= this.skins.claimGPUPalette(this.binding);
    this.indices.write(indices);
    this.transforms.write(transforms, 64);
    this.computation.setBindings({
      bodyPoses: publication.matrices,
      bodyIndices: this.indices,
      paletteTransforms: this.transforms,
      jointPalette: this.palette
    });
    this.publication = publication;
  }
}
