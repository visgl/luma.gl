// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import type {Device} from '@luma.gl/core';

/** Optional one-time animation baking followed by GPU vertex-stage sampling. */
export type GLTFGPUAnimationOptions = {
  /** Enables GPU sampling without changing the established CPU-animation default. */
  enabled?: boolean;
  /** Number of baked poses per second. Defaults to 30. */
  sampleRate?: number;
  /** Maximum combined baked frames before gracefully retaining CPU animation. Defaults to 8192. */
  maxFrames?: number;
  /** Maximum estimated GPU atlas bytes across primitives. Defaults to 64 MiB. */
  maxBytes?: number;
};

/** Backwards-compatible crowd option name; scenes and crowds use the same baked format. */
export type GLTFCrowdGPUAnimationOptions = GLTFGPUAnimationOptions;

/** Runtime diagnostics for baked skeletal and morph playback. */
export type GLTFGPUAnimationStats = {
  mode: 'cpu' | 'gpu';
  sampleRate?: number;
  frameCount: number;
  clipCount: number;
  morphGroupCount: number;
  /** Conservative GPU atlas byte estimate; CPU staging requires the same amount again. */
  estimatedByteLength: number;
  /** Present only when an explicitly requested GPU path retained CPU playback. */
  fallbackReason?: GLTFGPUAnimationFallbackReason;
};

/** One named clip stored inside a shared frame-address space. */
export type GLTFCrowdGPUAnimationClip = {
  name: string;
  duration: number;
  frameOffset: number;
  frameCount: number;
};

/** Immutable baked-frame layout shared by all actor draw groups. */
export type GLTFCrowdGPUAnimationLayout = {
  sampleRate: number;
  frameCount: number;
  clips: readonly GLTFCrowdGPUAnimationClip[];
};

/** Reason an explicitly requested baked animation path retained CPU playback. */
export type GLTFGPUAnimationFallbackReason =
  | 'disabled'
  | 'no-animations'
  | 'invalid-options'
  | 'invalid-animation'
  | 'frame-budget'
  | 'byte-budget'
  | 'texture-limit'
  | 'buffer-limit'
  | 'unsupported-scene';

/** Backwards-compatible crowd diagnostic name. */
export type GLTFCrowdGPUAnimationFallbackReason = GLTFGPUAnimationFallbackReason;

/** Allocation preflight, before scenegraph construction creates any baked resources. */
type GLTFCrowdGPUAnimationPlan = {
  layout: GLTFCrowdGPUAnimationLayout | null;
  estimatedByteLength: number;
  fallbackReason?: GLTFGPUAnimationFallbackReason;
};

type GLTFCrowdGPUAnimationDevice = Pick<Device, 'type' | 'limits'>;

/** Creates bounded clip/frame metadata without decoding or duplicating loader-owned accessors. */
export function createGLTFCrowdGPUAnimationLayout(
  gltf: GLTFPostprocessed,
  options: GLTFCrowdGPUAnimationOptions = {}
): GLTFCrowdGPUAnimationLayout | null {
  return planGLTFCrowdGPUAnimation(gltf, options).layout;
}

/** Bounds GPU atlases and their equally sized CPU staging arrays before allocating either. */
export function planGLTFCrowdGPUAnimation(
  gltf: GLTFPostprocessed,
  options: GLTFCrowdGPUAnimationOptions,
  device?: GLTFCrowdGPUAnimationDevice
): GLTFCrowdGPUAnimationPlan {
  const reject = (
    fallbackReason: GLTFCrowdGPUAnimationFallbackReason,
    estimatedByteLength = 0
  ): GLTFCrowdGPUAnimationPlan => ({layout: null, estimatedByteLength, fallbackReason});
  if (options.enabled === false) {
    return reject('disabled');
  }
  if (!gltf.animations?.length) {
    return reject('no-animations');
  }

  const sampleRate = options.sampleRate ?? 30;
  const maxFrames = options.maxFrames ?? 8192;
  const maxBytes = options.maxBytes ?? 64 * 1024 * 1024;
  if (
    !Number.isFinite(sampleRate) ||
    sampleRate <= 0 ||
    !Number.isSafeInteger(maxFrames) ||
    maxFrames <= 0 ||
    !Number.isSafeInteger(maxBytes) ||
    maxBytes <= 0
  ) {
    return reject('invalid-options');
  }

  let frameCount = 0;
  const clips: GLTFCrowdGPUAnimationClip[] = [];
  for (const [animationIndex, animation] of gltf.animations.entries()) {
    let duration = 0;
    for (const sampler of animation.samplers || []) {
      const values = gltf.accessors[sampler.input]?.value;
      for (const value of values || []) {
        const time = Number(value);
        if (!Number.isFinite(time) || time < 0) {
          return reject('invalid-animation');
        }
        duration = Math.max(duration, time);
      }
    }
    const clipFrameCount = Math.max(1, Math.ceil(duration * sampleRate) + 1);
    if (!Number.isSafeInteger(clipFrameCount) || frameCount + clipFrameCount > maxFrames) {
      return reject('frame-budget');
    }
    clips.push({
      name: animation.name || `Animation-${animationIndex}`,
      duration,
      frameOffset: frameCount,
      frameCount: clipFrameCount
    });
    frameCount += clipFrameCount;
  }

  const jointsPerInstance = Math.max(0, ...(gltf.skins || []).map(skin => skin.joints.length));
  const meshReferenceCounts = new Map<string, number>();
  for (const node of gltf.nodes) {
    if (node.mesh) {
      meshReferenceCounts.set(node.mesh.id, (meshReferenceCounts.get(node.mesh.id) || 0) + 1);
    }
  }

  let estimatedByteLength = 0;
  let maximumAtlasByteLength = 0;
  let maximumFrameStride = 0;
  for (const mesh of gltf.meshes) {
    // Parsing creates all source meshes and may clone models for independently posed nodes.
    // Counting every reference is a conservative upper bound when rigid nodes share a model.
    const meshCopies = Math.max(1, meshReferenceCounts.get(mesh.id) || 0);
    for (const primitive of mesh.primitives) {
      const hasSkin = Boolean(
        primitive.attributes['JOINTS_0'] && primitive.attributes['WEIGHTS_0']
      );
      const frameStride =
        4 + (hasSkin ? jointsPerInstance * 4 : 0) + (primitive.targets?.length || 0);
      const atlasByteLength = frameCount * frameStride * 16;
      maximumFrameStride = Math.max(maximumFrameStride, frameStride);
      maximumAtlasByteLength = Math.max(maximumAtlasByteLength, atlasByteLength);
      estimatedByteLength += atlasByteLength * meshCopies;
    }
  }
  if (!Number.isSafeInteger(estimatedByteLength) || estimatedByteLength > maxBytes) {
    return reject('byte-budget', estimatedByteLength);
  }
  if (device?.type === 'webgpu') {
    if (
      maximumAtlasByteLength >
      Math.min(device.limits.maxBufferSize, device.limits.maxStorageBufferBindingSize)
    ) {
      return reject('buffer-limit', estimatedByteLength);
    }
  } else if (
    device &&
    (maximumFrameStride > device.limits.maxTextureDimension2D ||
      frameCount > device.limits.maxTextureDimension2D)
  ) {
    return reject('texture-limit', estimatedByteLength);
  }

  return {layout: {sampleRate, frameCount, clips}, estimatedByteLength};
}

/** Resolves adjacent baked frames while retaining interpolation on the GPU. */
export function getGLTFCrowdGPUAnimationFrames(
  clip: GLTFCrowdGPUAnimationClip,
  time: number,
  sampleRate: number
): readonly [number, number, number] {
  const frame = Math.min(Math.max(time, 0) * sampleRate, clip.frameCount - 1);
  const firstFrame = Math.floor(frame);
  const secondFrame = Math.min(firstFrame + 1, clip.frameCount - 1);
  return [clip.frameOffset + firstFrame, clip.frameOffset + secondFrame, frame - firstFrame];
}
