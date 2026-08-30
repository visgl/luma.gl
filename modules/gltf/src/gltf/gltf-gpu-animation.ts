// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFPostprocessed} from '@loaders.gl/gltf';

/** Optional one-time animation baking followed by GPU vertex-stage sampling. */
export type GLTFCrowdGPUAnimationOptions = {
  /** Enables GPU sampling without changing the established CPU-animation default. */
  enabled?: boolean;
  /** Number of baked poses per second. Defaults to 30. */
  sampleRate?: number;
  /** Maximum combined baked frames before gracefully retaining CPU animation. Defaults to 8192. */
  maxFrames?: number;
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

/** Creates bounded clip/frame metadata without decoding or duplicating loader-owned accessors. */
export function createGLTFCrowdGPUAnimationLayout(
  gltf: GLTFPostprocessed,
  options: GLTFCrowdGPUAnimationOptions = {}
): GLTFCrowdGPUAnimationLayout | null {
  if (options.enabled === false || !gltf.animations?.length) {
    return null;
  }

  const sampleRate = options.sampleRate ?? 30;
  const maxFrames = options.maxFrames ?? 8192;
  if (!Number.isFinite(sampleRate) || sampleRate <= 0 || !Number.isSafeInteger(maxFrames)) {
    return null;
  }

  let frameCount = 0;
  const clips = gltf.animations.map((animation, animationIndex) => {
    let duration = 0;
    for (const sampler of animation.samplers || []) {
      const values = gltf.accessors[sampler.input]?.value;
      for (const value of values || []) {
        duration = Math.max(duration, Number(value));
      }
    }
    const clipFrameCount = Math.max(1, Math.ceil(duration * sampleRate) + 1);
    const clip: GLTFCrowdGPUAnimationClip = {
      name: animation.name || `Animation-${animationIndex}`,
      duration,
      frameOffset: frameCount,
      frameCount: clipFrameCount
    };
    frameCount += clipFrameCount;
    return clip;
  });

  return frameCount <= maxFrames ? {sampleRate, frameCount, clips} : null;
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
