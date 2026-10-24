// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// luma.gl Engine API

// Animation
export type {AnimationClipControllerProps} from './animation/animator';
export {AnimationClipController, Animator} from './animation/animator';
export type {
  AnimationInterpolation,
  AnimationSampler,
  AnimationValueType
} from './animation/animation-interpolation';
export {evaluateAnimationSampler} from './animation/animation-interpolation';
export type {AnimationBinding, AnimationTrackProps} from './animation/animation-track';
export {AnimationTrack} from './animation/animation-track';
export type {AnimationClipProps} from './animation/animation-clip';
export {AnimationClip} from './animation/animation-clip';
export type {AnimationActionProps, AnimationLoopMode} from './animation/animation-mixer';
export {AnimationAction, AnimationMixer} from './animation/animation-mixer';
export type {MorphTargetAttributes} from './animation/morph-targets';
export {
  applyMorphTargets,
  decodeMorphTargetAttribute,
  updateMorphTargetBuffers
} from './animation/morph-targets';
export type {SkinJointMatricesProps} from './animation/skin';
export {updateSkinJointMatrices} from './animation/skin';
export {Timeline} from './animation/timeline';
export {KeyFrames} from './animation/key-frames';
export type {AnimationProps} from './animation-loop/animation-props';

export {AnimationLoopTemplate} from './animation-loop/animation-loop-template';

export type {
  AnimationFrameCallback,
  AnimationFrameProvider,
  AnimationLoopProps
} from './animation-loop/animation-loop';
export {AnimationLoop} from './animation-loop/animation-loop';

export type {MakeAnimationLoopProps} from './animation-loop/make-animation-loop';
export type {TemplateAnimationLoop} from './animation-loop/make-animation-loop';
export {makeAnimationLoop} from './animation-loop/make-animation-loop';

// Camera controls
export type {OrbitControlsProps, OrbitPosition} from './controls/orbit-controls';
export {OrbitControls} from './controls/orbit-controls';

export type {ModelProps} from './model/model';
export {Model} from './model/model';
export type {MaterialProps} from './material/material';
export {Material} from './material/material';
export type {MaterialFactoryProps} from './material/material-factory';
export {MaterialFactory} from './material/material-factory';

// Transforms
export type {BufferTransformProps} from './compute/buffer-transform';
export {BufferTransform} from './compute/buffer-transform';
export type {TextureTransformProps} from './compute/texture-transform';
export {TextureTransform} from './compute/texture-transform';

// Models
export type {ClipSpaceProps} from './models/clip-space';
export {ClipSpace} from './models/clip-space';
export type {BackgroundTextureModelProps} from './models/billboard-texture-model';
export {BackgroundTextureModel} from './models/billboard-texture-model';
export type {
  BaseLightModelProps,
  PointLightModelProps,
  SpotLightModelProps,
  DirectionalLightModelProps
} from './models/light-model-utils';
export {PointLightModel} from './models/point-light-model';
export {SpotLightModel} from './models/spot-light-model';
export {DirectionalLightModel} from './models/directional-light-model';

// Scenegraph Core nodes
export {ScenegraphNode} from './scenegraph/scenegraph-node';
export type {ScenegraphBounds} from './scenegraph/scenegraph-bounds';
export type {
  DepthSortedTraversalContext,
  DepthSortedTraversalOptions,
  GroupNodeProps
} from './scenegraph/group-node';
export {GroupNode} from './scenegraph/group-node';
export type {ModelNodeProps} from './scenegraph/model-node';
export {ModelNode} from './scenegraph/model-node';

// Geometries
export type {GeometryProps, GeometryAttribute, GeometryAttributeInput} from './geometry/geometry';
export {Geometry} from './geometry/geometry';
export {makeEdgeGeometry, makeEdgeGeometryFromGeometries} from './geometry/edge-geometry';
export type {MakeEdgeGeometryOptions} from './geometry/edge-geometry';
export {
  makeStrokeGeometry,
  type StrokeGeometryOptions,
  type StrokePosition
} from './geometry/stroke-geometry';
export type {MakeInterleavedGeometryOptions} from './geometry/geometry-utils';
export {makeInterleavedGeometry} from './geometry/geometry-utils';
export type {
  MeshSimplificationAttribute,
  MeshSimplificationOptions,
  MeshSimplificationResult
} from './geometry/mesh-simplification';
export {simplifyMesh} from './geometry/mesh-simplification';
export type {GPUGeometryProps} from './geometry/gpu-geometry';
export {GPUGeometry} from './geometry/gpu-geometry';

// Primitives
export type {ConeGeometryProps} from './geometry/geometry-primitives';
export {ConeGeometry} from './geometry/geometry-primitives';
export type {CubeGeometryProps} from './geometry/geometry-primitives';
export {CubeGeometry} from './geometry/geometry-primitives';
export type {CylinderGeometryProps} from './geometry/geometry-primitives';
export {CylinderGeometry} from './geometry/geometry-primitives';
export {TorusGeometry} from './geometry/geometry-primitives';
export type {TorusGeometryProps} from './geometry/geometry-primitives';
export type {IcoSphereGeometryProps} from './geometry/geometry-primitives';
export {IcoSphereGeometry} from './geometry/geometry-primitives';
export type {PlaneGeometryProps} from './geometry/geometry-primitives';
export {PlaneGeometry} from './geometry/geometry-primitives';
export type {SphereGeometryProps} from './geometry/geometry-primitives';
export {SphereGeometry} from './geometry/geometry-primitives';
export type {TruncatedConeGeometryProps} from './geometry/geometry-primitives';
export {TruncatedConeGeometry} from './geometry/geometry-primitives';

export {ShaderInputs} from './shader-inputs';
export type {ShaderInputBinding, ShaderInputsProps} from './shader-inputs';

// Application Utilities
export {makeRandomGenerator} from './application-utils/random';
export {
  setPathPrefix,
  loadImage,
  loadImageBitmap,
  _resolveLoadFileUrl
} from './application-utils/load-file';

// Dynamic Resources

export type {
  TextureCubeFace,
  TextureImageData,
  Texture1DData,
  Texture2DData,
  Texture3DData,
  TextureCubeData,
  TextureArrayData,
  TextureCubeArrayData
} from './dynamic-texture/texture-data';

export type {DynamicTextureProps} from './dynamic-texture/dynamic-texture';
export {DynamicTexture} from './dynamic-texture/dynamic-texture';
export type {
  TextureBindingLayout,
  TextureBindingSource
} from './dynamic-texture/texture-binding-source';
export type {VideoTextureProps} from './dynamic-texture/video-texture';
export {VideoTexture} from './dynamic-texture/video-texture';
export type {
  BufferBindingSource,
  DynamicBufferProps,
  DynamicBufferRange
} from './dynamic-buffer/dynamic-buffer';
export {DynamicBuffer} from './dynamic-buffer/dynamic-buffer';

// EXPERIMENTAL
export type {
  ShaderPassBinding,
  ShaderPassRendererProps,
  ShaderPassRendererRenderOptions,
  ShaderPassSourceTexture
} from './passes/shader-pass-renderer';
export {ShaderPassRenderer} from './passes/shader-pass-renderer';

export {Swap} from './compute/swap';
export {SwapBuffers} from './compute/swap';
export {SwapFramebuffers} from './compute/swap';

export type {ComputationProps} from './compute/computation';
export {Computation} from './compute/computation';
export {getPlatformInfo} from './utils/get-platform-info';
export type {
  KernelProps,
  KernelDispatchOptions,
  KernelDispatchIndirectOptions
} from './compute/kernel';
export {Kernel} from './compute/kernel';
export type {
  RenderKernelProps,
  RenderKernelDrawOptions,
  RenderKernelIndirectDrawOptions
} from './compute/render-kernel';
export {RenderKernel} from './compute/render-kernel';

export type {
  PickInfo,
  PickingTooltip,
  PickingMode,
  ResolvedPickingMode,
  PickingShouldPickOptions,
  PickingBackend,
  PickingManagerProps,
  ResolvedPickingBackend
} from './modules/picking/picking-manager';
export {
  PickingManager,
  supportsIndexPicking,
  resolvePickingMode,
  resolvePickingBackend
} from './modules/picking/picking-manager';
export {getIndexPickingModule, picking} from './modules/picking/picking';
export {picking as indexPicking} from './modules/picking/index-picking';
export {picking as indexColorPicking} from './modules/picking/index-color-picking';
export {picking as colorPicking} from './modules/picking/color-picking';

export {
  requestAnimationFramePolyfill,
  cancelAnimationFramePolyfill
} from './animation-loop/request-animation-frame';

// Format-independent scene runtime controllers. Source adapters provide resolved bindings.
export {
  SkinController,
  createSkinJointPaletteResource,
  type SkinBinding,
  type SkinControllerProps
} from './scenegraph/controllers/skin-controller';
export {
  MaterialVariants,
  type MaterialVariant,
  type MaterialVariantBinding,
  type PrimitiveMaterialVariants,
  type MaterialVariantsProps
} from './scenegraph/controllers/material-variants';
export {
  BillboardController,
  type BillboardOrientation,
  type BillboardBinding,
  type BillboardDrawEntry,
  type BillboardControllerProps
} from './scenegraph/controllers/billboard-controller';
export {
  AreaLightController,
  type AreaLightDefinition,
  type AreaLightBinding,
  type AreaLightControllerProps
} from './scenegraph/controllers/area-light-controller';
export {
  Interactivity,
  type InteractivityValue,
  type InteractivityNode,
  type InteractivityGraph,
  type InteractivityDefinition,
  type InteractivityValueType,
  type InteractivityPropertyAdapter,
  type InteractivityOptions
} from './interactivity/interactivity';
export {AudioGraph, type AudioGraphNode, type AudioGraphDefinition} from './audio/audio-graph';
export {
  AudioReverbBus,
  selectAudioEnvironmentZone,
  createParametricAudioResponse,
  type AudioEnvironmentZone,
  type AudioParametricReverb
} from './audio/audio-environment';

export {
  AudioController,
  type AudioControllerOptions,
  type AudioDefinition,
  type AudioNodeBinding,
  type AudioEnvironmentDefinition,
  type AudioSourceProperties
} from './audio/audio-controller';

// DEPRECATED

export {LegacyPickingManager} from './modules/picking/legacy-picking-manager';
export {legacyColorPicking} from './modules/picking/legacy-color-picking';

import {DynamicTexture, type DynamicTextureProps} from './dynamic-texture/dynamic-texture';
/** @deprecated use DynamicTexture */
export const AsyncTexture = DynamicTexture;
/** @deprecated use DynamicTextureProps */
export type AsyncTextureProps = DynamicTextureProps;

export {RingGeometry, type RingGeometryProps} from './geometry/ring-geometry';

export {
  GPUVectorModel,
  getGPUVectorModelBatches,
  type GPUVectorModelProps,
  type GPUVectorModelCount,
  type GPUVectorModelData,
  type GPUVectorModelInput,
  type GPUVectorModelInputs,
  type GPUVectorModelBatch,
  type GPUVectorModelDrawBatchesOptions
} from './model/gpu-vector-model';

export {GPUVectorGeometry, type GPUVectorGeometryProps} from './geometry/gpu-vector-geometry';
export type {GPUVectorModelAttributes, GPUVectorModelConstant} from './model/gpu-vector-bindings';

export {
  validateGPUVectorBatchStructure,
  type GPUVectorBatchStructureInput
} from './utils/gpu-vector-batch-structure';

export {JointController} from './scenegraph/controllers/joint-controller';
export type {
  ScenegraphJoint,
  ScenegraphJointLimit,
  ScenegraphJointDrive,
  ScenegraphJointAttachment,
  ResolvedScenegraphJoint
} from './scenegraph/controllers/joint-controller';
export {
  decomposePhysicsTransform,
  readPhysicsRotation,
  readPhysicsVector,
  transformPhysicsVector
} from './scenegraph/physics-transforms';
export type {PhysicsVector, PhysicsRotation} from './scenegraph/physics-transforms';

export {publishedTransforms} from './scenegraph/published-transforms';

export type {InteractivityPhysics} from './interactivity/physics';

export {setMorphWeights} from './scenegraph/controllers/morph-controller';
export type {MorphTargetState, MorphWeightState} from './scenegraph/controllers/morph-controller';
export {makeNodeAnimationBinding} from './animation/node-animation-binding';
export type {NodeAnimationProperty} from './animation/node-animation-binding';

export {
  ScenegraphAnimator,
  MixerAnimationClip,
  type AnimationSelectionOptions,
  type ScenegraphAnimationClip
} from './animation/scenegraph-animator';
export {
  makeMaterialAnimationBinding,
  makeTextureTransformAnimationBinding,
  makePropertyAnimationBinding,
  type MaterialAnimationTarget,
  type TextureTransformAnimationTarget,
  type MaterialTextureTransformState
} from './animation/property-animation-binding';
export {
  getTextureTransformMatrix,
  getTextureTransformDeltaMatrix,
  type PBRTextureTransform
} from './animation/texture-transform';

export {makeAdapterAnimationBinding} from './animation/property-animation-binding';

export {deformPositions} from './animation/deform-positions';
