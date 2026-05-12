// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Resources
export {GPUTable} from './operation/gpu-table';
export type {GPUTableProps} from './operation/gpu-table';

// Operations
export {add} from './operations/add';
export {interleave} from './operations/interleave';
export {fround} from './operations/fround';

// Arrow operations
export {ArrowGPUTransform} from './arrow/arrow-gpu-transform';
export {
  ArrowAddOperation,
  ArrowDeinterleaveOperation,
  ArrowDesegmentOperation,
  ArrowGPUOperationNode,
  ArrowFroundOperation,
  ArrowInterleaveOperation,
  ArrowProjectWGS84ToPseudoMercatorOperation,
  ArrowSegmentOperation,
  ArrowUploadOperation,
  arrowAdd,
  arrowDeinterleave,
  arrowDesegment,
  arrowFround,
  arrowInterleave,
  arrowProjectWGS84ToPseudoMercator,
  arrowSegment,
  arrowUpload,
  evaluateGPUComputeGraph,
  type ArrowAddParameters,
  type ArrowDeinterleaveParameters,
  type ArrowDesegmentParameters,
  type ArrowGPUDeinterleaveProps,
  type ArrowGPUDesegmentProps,
  type ArrowFroundParameters,
  type ArrowGPUAddOutput,
  type ArrowGPUSegmentProps,
  type ArrowGPUFroundOutput,
  type ArrowGPUInput,
  type ArrowGPUInterleaveProps,
  type ArrowGPUOperationNodeProps,
  type ArrowGPUOperationProps,
  type ArrowGPUOutputPlacement,
  type ArrowGPUProjectWGS84ToPseudoMercatorOutput,
  type ArrowInterleaveParameters,
  type ArrowProjectWGS84ToPseudoMercatorParameters,
  type ArrowSegmentParameters,
  type ArrowGPUUploadProps,
  type ArrowUploadParameters
} from './arrow/arrow-gpu-compute-graph';
// EXPERIMENTAL: underscored exports are not part of the stable v1 Arrow GPGPU API.
export {addInPlace as _addInPlace, type ArrowGPUAddInPlaceProps} from './arrow/add-in-place';
export {
  deinterleave as _deinterleave,
  type ArrowGPUDeinterleaveProps as _ArrowGPUDeinterleaveProps
} from './arrow/deinterleave';
export {froundInPlace as _froundInPlace} from './arrow/fround-in-place';

// Backends
export {backendRegistry} from './operation/backend-registry';
export {webglBackend} from './operations/webgl/index';
export {webgpuBackend} from './operations/webgpu/index';
