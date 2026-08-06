// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {AnimationSampler} from '@luma.gl/engine';

/** Parsed glTF animation definition. */
export type GLTFAnimation = {
  /** Application-visible animation name. */
  name: string;
  /** Channels that drive runtime node or material properties. */
  channels: GLTFAnimationChannel[];
};

/** Supported glTF animation target paths. */
export type GLTFAnimationPath = 'translation' | 'rotation' | 'scale' | 'weights' | 'visibility';

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
  | 'bumpFactor'
  | 'clearcoatFactor'
  | 'clearcoatRoughnessFactor'
  | 'diffuseTransmissionFactor'
  | 'diffuseTransmissionColorFactor'
  | 'dispersion'
  | 'emissiveFactor'
  | 'emissiveStrength'
  | 'ior'
  | 'iridescenceFactor'
  | 'iridescenceIor'
  | 'iridescenceThicknessRange'
  | 'metallicRoughnessValues'
  | 'multiscatterColorFactor'
  | 'normalScale'
  | 'occlusionStrength'
  | 'sheenColorFactor'
  | 'sheenRoughnessFactor'
  | 'scatterAnisotropy'
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

/** Camera projection property targeted by `KHR_animation_pointer`. */
export type GLTFCameraAnimationProperty =
  | 'aspectRatio'
  | 'yfov'
  | 'znear'
  | 'zfar'
  | 'xmag'
  | 'ymag';

/** Parsed glTF animation channel that updates an authored camera projection. */
export type GLTFCameraAnimationChannel = {
  type: 'camera';
  sampler: GLTFAnimationSampler;
  pointer: string;
  targetCameraIndex: number;
  projection: 'perspective' | 'orthographic';
  property: GLTFCameraAnimationProperty;
};

/** Punctual-light property targeted by `KHR_animation_pointer`. */
export type GLTFLightAnimationProperty =
  | 'color'
  | 'intensity'
  | 'range'
  | 'innerConeAngle'
  | 'outerConeAngle';

/** Parsed glTF animation channel that updates an authored punctual-light definition. */
export type GLTFLightAnimationChannel = {
  type: 'light';
  sampler: GLTFAnimationSampler;
  pointer: string;
  targetLightIndex: number;
  property: GLTFLightAnimationProperty;
  /** Individual RGB component index, when the pointer addresses one color element. */
  component?: number;
};

/** Parsed glTF animation channel. */
export type GLTFAnimationChannel =
  | GLTFNodeAnimationChannel
  | GLTFMaterialAnimationChannel
  | GLTFTextureTransformAnimationChannel
  | GLTFCameraAnimationChannel
  | GLTFLightAnimationChannel;

/** Parsed glTF animation sampler. */
export type GLTFAnimationSampler = AnimationSampler & {
  /** Keyframe times in seconds. */
  input: number[];
  /** glTF interpolation mode. */
  interpolation: string;
  /** Keyframe values, already expanded into JS arrays. */
  output: number[][];
};
