// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Resources
export {GPUEvaluationScope} from './operation/gpu-evaluation-scope';
export {getGPUDataEvaluator, GPUDataEvaluator} from './operation/gpu-data-evaluator';
export type {
  GPUDataEvaluatorEvaluateOptions,
  GPUDataEvaluatorFromGPUDataOptions,
  GPUDataEvaluatorFromGPUDataViewOptions,
  GPUDataEvaluatorInput,
  GPUDataEvaluatorProps,
  GPUDataEvaluatorTargetBuffer
} from './operation/gpu-data-evaluator';
export {getGPUVectorEvaluator, GPUVectorEvaluator} from './operation/gpu-vector-evaluator';
export type {
  GPUVectorEvaluatorEvaluateOptions,
  GPUVectorEvaluatorFromGPUDataEvaluatorsOptions,
  GPUVectorEvaluatorInput,
  GPUVectorEvaluatorMapGPUDataTransform,
  GPUVectorEvaluatorProps
} from './operation/gpu-vector-evaluator';

// Operations
export {
  abs,
  add,
  cos,
  divide,
  exp,
  log,
  multiply,
  pow,
  sin,
  sqrt,
  subtract,
  tan
} from './operations/arithmetic';
export {extent} from './operations/extent';
export {convertColorData} from './operations/convert-colors';
export type {
  ColorInputFormat,
  ConvertColorsInputs,
  ConvertColorsProps
} from './operations/convert-colors';
export {castData} from './operations/cast-data';
export type {CastDataInputs, CastDataProps} from './operations/cast-data';
export {dot} from './operations/dot';
export {equalAll} from './operations/equal-all';
export {interleave} from './operations/interleave';
export {fround} from './operations/fround';
export {gather} from './operations/gather';
export {length} from './operations/length';
export {segmentedMap} from './operations/segmented-map';
export {select} from './operations/select';
export {sequence} from './operations/sequence';
export {swizzle} from './operations/swizzle';

// Backends
export {backendRegistry} from './operation/backend-registry';
export type {BackendModule} from './operation/backend-registry';
export {Operation} from './operation/operation';
export type {OperationHandler, OperationHandlerResult} from './operation/operation';
export {cleanEvaluate} from './utils/clean-evaluate';
export {cleanEvaluateSync} from './utils/clean-evaluate';

export type {
  GPUEvaluatorInspection,
  GPUEvaluatorInspectionNode
} from './operation/gpu-evaluator-inspection';

export {
  inspectEvaluators as getGPUDataEvaluatorInspection,
  getGPUDataEvaluatorFormat
} from './operation/gpu-evaluator-inspection';

// Shared execution and resource primitives
export type {BufferTransformProps} from './execution/compute/buffer-transform';
export {BufferTransform} from './execution/compute/buffer-transform';
export type {TextureTransformProps} from './execution/compute/texture-transform';
export {TextureTransform} from './execution/compute/texture-transform';
export {ShaderInputs} from './execution/shader-inputs';
export type {ShaderInputBinding, ShaderInputsProps} from './execution/shader-inputs';
export type {
  TextureCubeFace,
  TextureImageData,
  Texture1DData,
  Texture2DData,
  Texture3DData,
  TextureCubeData,
  TextureArrayData,
  TextureCubeArrayData
} from './execution/dynamic-texture/texture-data';
export type {DynamicTextureProps} from './execution/dynamic-texture/dynamic-texture';
export {DynamicTexture} from './execution/dynamic-texture/dynamic-texture';
export type {
  TextureBindingLayout,
  TextureBindingSource
} from './execution/dynamic-texture/texture-binding-source';
export type {
  BufferBindingSource,
  DynamicBufferProps,
  DynamicBufferRange
} from './execution/dynamic-buffer/dynamic-buffer';
export {DynamicBuffer} from './execution/dynamic-buffer/dynamic-buffer';
export type {ComputationProps} from './execution/compute/computation';
export {Computation} from './execution/compute/computation';
export {getPlatformInfo} from './execution/utils/get-platform-info';
export type {
  KernelProps,
  KernelDispatchOptions,
  KernelDispatchIndirectOptions
} from './execution/compute/kernel';
export {Kernel} from './execution/compute/kernel';
export {RenderKernel} from './execution/compute/render-kernel';
export type {
  RenderKernelProps,
  RenderKernelDrawOptions,
  RenderKernelIndirectDrawOptions
} from './execution/compute/render-kernel';
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
} from './execution/model/gpu-vector-model';
export {
  GPUVectorGeometry,
  type GPUVectorGeometryProps
} from './execution/geometry/gpu-vector-geometry';
export type {
  GPUVectorModelAttributes,
  GPUVectorModelConstant
} from './execution/model/gpu-vector-bindings';
export {
  validateGPUVectorBatchStructure,
  type GPUVectorBatchStructureInput
} from './execution/utils/gpu-vector-batch-structure';
