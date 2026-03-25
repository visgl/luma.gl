// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Parsed glTF animation definition. */
export type GLTFAnimation = {
  /** Application-visible animation name. */
  name: string;
  /** Channels that drive runtime node or material properties. */
  channels: GLTFAnimationChannel[];
};

/** Supported glTF animation target paths. */
export type GLTFAnimationPath = 'translation' | 'rotation' | 'scale' | 'weights';

/** Parsed glTF animation channel that targets a scenegraph node. */
export type GLTFNodeAnimationChannel = {
  /** Channel target kind. */
  type: 'node';
  /** Node property written by this channel. */
  path: GLTFAnimationPath;
  /** Time/value sampler used to evaluate the channel. */
  sampler: GLTFAnimationSampler;
  /** Target node identifier in the generated scenegraph. */
  targetNodeId: string;
};

/** Material uniform property targeted by a parsed animation pointer. */
export type GLTFMaterialAnimationProperty =
  | 'alphaCutoff'
  | 'anisotropyRotation'
  | 'anisotropyStrength'
  | 'attenuationColor'
  | 'attenuationDistance'
  | 'baseColorFactor'
  | 'clearcoatFactor'
  | 'clearcoatRoughnessFactor'
  | 'emissiveFactor'
  | 'emissiveStrength'
  | 'ior'
  | 'iridescenceFactor'
  | 'iridescenceIor'
  | 'iridescenceThicknessRange'
  | 'metallicRoughnessValues'
  | 'normalScale'
  | 'occlusionStrength'
  | 'sheenColorFactor'
  | 'sheenRoughnessFactor'
  | 'specularColorFactor'
  | 'specularIntensityFactor'
  | 'thicknessFactor'
  | 'transmissionFactor';

/** Parsed glTF animation channel that targets a material uniform. */
export type GLTFMaterialAnimationChannel = {
  /** Channel target kind. */
  type: 'material';
  /** Time/value sampler used to evaluate the channel. */
  sampler: GLTFAnimationSampler;
  /** Original JSON pointer from `KHR_animation_pointer`. */
  pointer: string;
  /** Target material index in the source glTF. */
  targetMaterialIndex: number;
  /** Material uniform property updated by this channel. */
  property: GLTFMaterialAnimationProperty;
  /** Component index inside a packed material uniform, when only one element is animated. */
  component?: number;
};

/** Parsed glTF animation channel that targets a runtime texture-transform delta. */
export type GLTFTextureTransformAnimationChannel = {
  /** Channel target kind. */
  type: 'textureTransform';
  /** Time/value sampler used to evaluate the channel. */
  sampler: GLTFAnimationSampler;
  /** Original JSON pointer from `KHR_animation_pointer`. */
  pointer: string;
  /** Target material index in the source glTF. */
  targetMaterialIndex: number;
  /** Texture slot updated by this channel. */
  textureSlot: import('../../pbr/texture-transform').PBRTextureTransformSlot;
  /** Texture transform component updated by this channel. */
  path: import('../../pbr/texture-transform').PBRTextureTransformPath;
  /** Component index when animating a single offset or scale element. */
  component?: number;
  /** Static source transform baked by loaders.gl before runtime animation. */
  baseTransform: import('../../pbr/texture-transform').PBRTextureTransform;
};

/** Parsed glTF animation channel. */
export type GLTFAnimationChannel =
  | GLTFNodeAnimationChannel
  | GLTFMaterialAnimationChannel
  | GLTFTextureTransformAnimationChannel;

/** Parsed glTF animation sampler. */
export type GLTFAnimationSampler = {
  /** Keyframe times in seconds. */
  input: number[];
  /** glTF interpolation mode. */
  interpolation: string;
  /** Keyframe values, already expanded into JS arrays. */
  output: number[][];
};
