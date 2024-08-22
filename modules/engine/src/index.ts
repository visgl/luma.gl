// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// luma.gl Engine API

// Animation
export {Timeline} from './animation/timeline';
export {KeyFrames} from './animation/key-frames';
export type {AnimationProps} from './animation-loop/animation-props';

export {AnimationLoopTemplate} from './animation-loop/animation-loop-template';

export type {AnimationLoopProps} from './animation-loop/animation-loop';
export {AnimationLoop} from './animation-loop/animation-loop';

export type {MakeAnimationLoopProps} from './animation-loop/make-animation-loop';
export {makeAnimationLoop} from './animation-loop/make-animation-loop';

export type {ModelProps} from './model/model';
export {Model} from './model/model';

// Transforms
export type {BufferTransformProps} from './compute/buffer-transform';
export {BufferTransform} from './compute/buffer-transform';
export type {TextureTransformProps} from './compute/texture-transform';
export {TextureTransform} from './compute/texture-transform';

export {PipelineFactory} from './factories/pipeline-factory';
export {ShaderFactory} from './factories/shader-factory';

// Models
export type {ClipSpaceProps} from './models/clip-space';
export {ClipSpace} from './models/clip-space';
export type {BackgroundTextureModelProps} from './models/billboard-texture-model';
export {BackgroundTextureModel} from './models/billboard-texture-model';

// Scenegraph Core nodes
export {ScenegraphNode} from './scenegraph/scenegraph-node';
export {GroupNode} from './scenegraph/group-node';
export type {ModelNodeProps} from './scenegraph/model-node';
export {ModelNode} from './scenegraph/model-node';

// Geometries
export type {GeometryProps, GeometryAttribute} from './geometry/geometry';
export {Geometry} from './geometry/geometry';
export type {GPUGeometryProps} from './geometry/gpu-geometry';
export {GPUGeometry} from './geometry/gpu-geometry';

// Primitives
export type {ConeGeometryProps} from './geometries/cone-geometry';
export {ConeGeometry} from './geometries/cone-geometry';
export type {CubeGeometryProps} from './geometries/cube-geometry';
export {CubeGeometry} from './geometries/cube-geometry';
export type {CylinderGeometryProps} from './geometries/cylinder-geometry';
export {CylinderGeometry} from './geometries/cylinder-geometry';
export type {IcoSphereGeometryProps} from './geometries/ico-sphere-geometry';
export {IcoSphereGeometry} from './geometries/ico-sphere-geometry';
export type {PlaneGeometryProps} from './geometries/plane-geometry';
export {PlaneGeometry} from './geometries/plane-geometry';
export type {SphereGeometryProps} from './geometries/sphere-geometry';
export {SphereGeometry} from './geometries/sphere-geometry';
export type {TruncatedConeGeometryProps} from './geometries/truncated-cone-geometry';
export {TruncatedConeGeometry} from './geometries/truncated-cone-geometry';

export {ShaderInputs} from './shader-inputs';

// Application Utilities
export {makeRandomGenerator} from './application-utils/random';
export {setPathPrefix, loadImage, loadImageBitmap} from './application-utils/load-file';

// EXPERIMENTAL
export type {ShaderPassRendererProps} from './passes/shader-pass-renderer';
export {ShaderPassRenderer} from './passes/shader-pass-renderer';

export {Swap} from './compute/swap';
export {SwapBuffers} from './compute/swap';
export {SwapFramebuffers} from './compute/swap';

export type {ComputationProps} from './compute/computation';
export {Computation} from './compute/computation';

export type {AsyncTextureProps} from './async-texture/async-texture';
export {AsyncTexture} from './async-texture/async-texture';

export {PickingManager} from './modules/picking/picking-manager';
export {picking as indexPicking} from './modules/picking/index-picking';
export {picking as colorPicking} from './modules/picking/color-picking';

export {
  requestAnimationFramePolyfill,
  cancelAnimationFramePolyfill
} from './animation-loop/request-animation-frame';

// DEPRECATED

export {LegacyPickingManager} from './modules/picking/legacy-picking-manager';
