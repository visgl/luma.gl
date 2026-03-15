// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Parsed glTF animation definition. */
export type GLTFAnimation = {
  /** Application-visible animation name. */
  name: string;
  /** Channels that drive individual node properties. */
  channels: GLTFAnimationChannel[];
};

/** Supported glTF animation target paths. */
export type GLTFAnimationPath = 'translation' | 'rotation' | 'scale' | 'weights';

/** Parsed glTF animation channel. */
export type GLTFAnimationChannel = {
  /** Node property written by this channel. */
  path: GLTFAnimationPath;
  /** Time/value sampler used to evaluate the channel. */
  sampler: GLTFAnimationSampler;
  /** Target node identifier in the generated scenegraph. */
  targetNodeId: string;
};

/** Parsed glTF animation sampler. */
export type GLTFAnimationSampler = {
  /** Keyframe times in seconds. */
  input: number[];
  /** glTF interpolation mode. */
  interpolation: string;
  /** Keyframe values, already expanded into JS arrays. */
  output: number[][];
};
