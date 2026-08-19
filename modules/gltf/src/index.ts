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
  createGLTFAnimatedCrowd,
  GLTFAnimatedCrowd,
  type GLTFCrowdAnimationStats,
  type GLTFCrowdLODLevelStats,
  type GLTFCrowdLODOptions,
  type GLTFCrowdLODStats,
  type GLTFCrowdLODView,
  type GLTFAnimatedCrowdOptions,
  GLTFCrowdActor,
  type GLTFCrowdActorOptions,
  type GLTFCrowdClipSelectionOptions,
  type GLTFCrowdPrimitiveGroup
} from './gltf/gltf-animated-crowd';
export {
  type GLTFCrowdGPUAnimationClip,
  type GLTFCrowdGPUAnimationLayout,
  type GLTFCrowdGPUAnimationOptions
} from './gltf/gltf-gpu-animation';
export {
  generateGLTFLODLevels,
  type GenerateGLTFLODLevelsOptions,
  getGLTFNodeLODs,
  type GLTFNodeLODLevel
} from './gltf/gltf-lod';
export {
  type GLTFExtensionSupport,
  type GLTFExtensionSupportLevel,
  type GLTFExtensionStandardStatus,
  type GLTFExtensionSupportSummary,
  type GLTFRegisteredExtensionSupport,
  getGLTFExtensionSupport,
  getGLTFExtensionSupportSummary,
  getRegisteredGLTFExtensions
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
  exportGLTF,
  type GLTFExportAccessor,
  type GLTFExportAnimation,
  type GLTFExportAnimationChannel,
  type GLTFExportAnimationSampler,
  type GLTFExportImage,
  type GLTFExportMesh,
  type GLTFExportNode,
  type GLTFExportOptions,
  type GLTFExportPrimitive,
  type GLTFExportScene,
  type GLTFExportSkin
} from './export/gltf-exporter';
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

// Standards-native glTF extension runtime helpers.
export {
  assertSupportedGLTFExtensions,
  getUnsupportedRequiredGLTFExtensions
} from './gltf/gltf-extension-support';
export {
  getGLTFNodeInstancing,
  type GLTFGPUInstancing,
  type GLTFInstanceAttribute
} from './gltf/gltf-instancing';
export {
  GLTFMaterialVariants,
  type GLTFMaterialVariant,
  type GLTFPrimitiveMaterialVariants
} from './gltf/gltf-material-variants';
export type {
  GLTFCameraAnimationChannel,
  GLTFCameraAnimationProperty,
  GLTFLightAnimationChannel,
  GLTFLightAnimationProperty
} from './gltf/animations/animations';
