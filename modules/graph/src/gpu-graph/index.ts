// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** GPU graph authoring and command execution. */
export {
  GPUCommandGraph,
  CompiledGPUCommandGraph,
  GPUCommandGraphEncoding,
  GPUCommandGraphExecution,
  getGPUCommandGraphExecutionPlan,
  GraphBufferHandle,
  GraphDataView,
  GraphExternalTextureHandle,
  GraphTextureHandle,
  GraphTextureView,
  GraphVectorView
} from '../gpu-core/gpu-command-graph';
export type * from '../gpu-core/gpu-command-graph';

export {composite, GPUGraph} from '../gpu-core/gpu-graph';
export {
  GPUGraphScalar,
  GPUGraphVector,
  GPUGraphTexture,
  GPUGraphTextureView
} from '../gpu-core/gpu-graph-value';
export type {
  GPUGraphScalarFormat,
  GPUGraphVectorFormat,
  GPUGraphTextureProps
} from '../gpu-core/gpu-graph-value';
export {GPUGraphCompiler} from '../gpu-core/gpu-graph-compiler';
export type {
  GPUGraphBindings,
  GPUGraphCompilation,
  GPUGraphLoweredNode,
  GPUGraphLoweringReport
} from '../gpu-core/gpu-graph-compiler';
export {GPUOperationLoweringRegistry} from '../gpu-core/gpu-graph-lowering';
export type {
  GPUOperationLowerer,
  GPUOperationLoweringContext,
  GPUOperationLoweringDecision,
  GPUGraphBackendCapabilities
} from '../gpu-core/gpu-graph-lowering';
export {inspectGPUGraphCompilation} from '../gpu-core/gpu-graph-inspector';
export type {GPUGraphCompilationSummary} from '../gpu-core/gpu-graph-inspector';
export {validateGPUGraph} from '../gpu-core/gpu-graph-validation';
export type {
  GPUGraphValidationIssue,
  GPUGraphValidationReport
} from '../gpu-core/gpu-graph-validation';

export type {
  GPUOperationContract,
  GPUOperationValueReference,
  GPUOperationValueUse,
  GPUOperationVectorShape
} from '../gpu-core/gpu-operation-contract';
export type {GPUOperation} from '../gpu-core/gpu-operation';
