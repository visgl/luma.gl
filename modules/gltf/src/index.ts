// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type {
  GLTFAnimation,
  GLTFAnimationChannel,
  GLTFAnimationPath,
  GLTFAnimationSampler,
  GLTFMaterialAnimationChannel,
  GLTFMaterialAnimationProperty,
  GLTFNodeAnimationChannel,
  GLTFTextureTransformAnimationChannel
} from './gltf/animations/animations';
// glTF Scenegraph Instantiator
export {
  createScenegraphsFromGLTF,
  type GLTFScenegraphBounds,
  type GLTFScenegraphs
} from './gltf/create-scenegraph-from-gltf';
export {
  GLTFAnimationClip,
  type GLTFAnimationClipProps,
  type GLTFAnimationSelectionOptions,
  GLTFAnimator,
  type GLTFAnimatorProps
} from './gltf/gltf-animator';
export {
  type GLTFExtensionSupport,
  type GLTFExtensionSupportLevel,
  getGLTFExtensionSupport
} from './gltf/gltf-extension-support';
export {
  type GLTFSkinBinding,
  GLTFSkinController,
  type GLTFSkinControllerProps,
  resolveGLTFSkinIndex
} from './gltf/gltf-skin';
export {parseGLTFAnimations} from './parsers/parse-gltf-animations';
export {type ParseGLTFLightsOptions, parseGLTFLights} from './parsers/parse-gltf-lights';
export {
  type CreateGLTFTextureOptions,
  createGLTFTexture,
  type ParsePBRMaterialOptions,
  parsePBRMaterial
} from './parsers/parse-pbr-material';
export {loadPBREnvironment, type PBREnvironment} from './pbr/pbr-environment';
export {type ParsedPBRMaterial} from './pbr/pbr-material';
export {
  getTextureTransformMatrix,
  getTextureTransformSlotDefinition,
  getTextureTransformSlotDefinitions,
  type PBRTextureTransform,
  type PBRTextureTransformSlot,
  type PBRTextureTransformSlotDefinition,
  resolveTextureCoordinateSet,
  resolveTextureTransform
} from './pbr/texture-transform';
export {
  convertSampler as convertGLTFSampler,
  convertSamplerToGLTF,
  type GLTFSampler
} from './webgl-to-webgpu/convert-webgl-sampler';
