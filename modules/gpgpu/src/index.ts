// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Resources
export {
  getGPUDataEvaluator,
  getGPUDataEvaluator,
  GPUDataEvaluator,
  GPUDataEvaluator
} from './operation/gpu-data-evaluator';
export type {
  GPUDataEvaluatorEvaluateOptions,
  GPUDataEvaluatorInput,
  GPUDataEvaluatorProps,
  GPUDataEvaluatorEvaluateOptions,
  GPUDataEvaluatorInput,
  GPUDataEvaluatorProps
} from './operation/gpu-data-evaluator';
export {getGPUVectorEvaluator, GPUVectorEvaluator} from './operation/gpu-vector-evaluator';
export type {
  GPUVectorEvaluatorEvaluateOptions,
  GPUVectorEvaluatorInput,
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
