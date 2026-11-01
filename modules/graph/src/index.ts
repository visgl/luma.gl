// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

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
  GraphVectorView,
  composite,
  GPUGraph,
  GPUGraphScalar,
  GPUGraphVector,
  GPUGraphTexture,
  GPUGraphTextureView,
  GPUGraphCompiler,
  GPUOperationLoweringRegistry,
  inspectGPUGraphCompilation,
  validateGPUGraph
} from './gpu-graph/index';
export type {
  GPUGraphScalarFormat,
  GPUGraphVectorFormat,
  GPUGraphTextureProps,
  GPUGraphBindings,
  GPUGraphCompilation,
  GPUGraphLoweredNode,
  GPUGraphLoweringReport,
  GPUOperationLowerer,
  GPUOperationLoweringContext,
  GPUOperationLoweringDecision,
  GPUGraphBackendCapabilities,
  GPUGraphCompilationSummary,
  GPUGraphValidationIssue,
  GPUGraphValidationReport,
  GPUCommandGraphCompileContext,
  GPUCommandGraphCapabilities,
  GPUCommandGraphCPUCondition,
  GPUCommandGraphComputeExecutable,
  GPUCommandGraphComputeNode,
  GPUCommandGraphCopyExecutable,
  GPUCommandGraphCopyNode,
  GPUCommandGraphEncodeContext,
  GPUCommandGraphEncodeOptions,
  GPUCommandGraphGPUIndirectCondition,
  GPUCommandGraphNode,
  GPUCommandGraphNodeCondition,
  GPUCommandGraphNodeConditionPreflight,
  GPUCommandGraphNodeEncodingStats,
  GPUCommandGraphNodePreflight,
  GPUCommandGraphResourceSummary,
  GPUCommandGraphNodePublication,
  GPUCommandGraphNodeTiming,
  GPUCommandGraphNodeType,
  GPUCommandGraphNodeWorkloadEstimate,
  GPUCommandGraphPreflightReport,
  GPUCommandGraphRenderExecutable,
  GPUCommandGraphRenderNode,
  GPUCommandGraphStats,
  GPUCommandGraphEncodingStats,
  GPUCommandGraphTimingReport,
  GraphBufferDescriptor,
  GraphBufferUsage,
  GraphBufferUse,
  GraphExternalTextureBinding,
  GraphExternalTextureDescriptor,
  GraphExternalTextureUse,
  GraphFrameTextureBinding,
  GraphImportedBuffer,
  GraphImportedTexture,
  GraphRenderPassAttachments,
  GraphResourceUse,
  GraphTextureAspect,
  GraphTextureDescriptor,
  GraphTextureDimension,
  GraphTextureUsage,
  GraphTextureUse,
  GraphTextureViewProps,
  GPUCommandGraphExecutionBudget,
  GPUCommandGraphExecutionLatencyPriority,
  GPUCommandGraphExecutionPublicationPolicy,
  GPUCommandGraphExecutionOptions,
  GPUCommandGraphExecutionPlanStep,
  GPUCommandGraphExecutionPlan,
  GPUCommandGraphExecutionStep
} from './gpu-graph/index';
export {
  getGPUCommandGraphAdapterIdentity,
  GPUCommandGraphAutotuner
} from './gpu-core/gpu-command-graph-autotuner';
export type {
  GPUCommandGraphAdapterIdentity,
  GPUCommandGraphKernelCandidate,
  GPUCommandGraphKernelCalibration,
  GPUCommandGraphAutotuningProfile,
  GPUCommandGraphAutotunerProps,
  GPUCommandGraphKernelSelectionRequest,
  GPUCommandGraphKernelSelection,
  GPUCommandGraphKernelObservation
} from './gpu-core/gpu-command-graph-autotuner';
export {GPUCommandGraphExecutionBudgetController} from './gpu-core/gpu-command-graph-budget-controller';
export type {
  GPUCommandGraphExecutionBudgetControllerProps,
  GPUCommandGraphExecutionBudgetObservation
} from './gpu-core/gpu-command-graph-budget-controller';
export {GPUCommandGraphInspector} from './gpu-core/gpu-command-graph-inspector';
export type {
  GPUCommandGraphInspectorGraph,
  GPUCommandGraphInspectorEncoding,
  GPUCommandGraphInspectorObservableGraph,
  GPUCommandGraphInspectorObservation,
  GPUCommandGraphInspectorNodeIdentity,
  GPUCommandGraphInspectorProps,
  GPUCommandGraphInspectorDurationSnapshot,
  GPUCommandGraphInspectorCounterSnapshot,
  GPUCommandGraphInspectorNodeSnapshot,
  GPUCommandGraphInspectorStatsSnapshot,
  GPUCommandGraphInspectorGraphSnapshot,
  GPUCommandGraphInspectorSnapshot
} from './gpu-core/gpu-command-graph-inspector';

// Shared execution and resource primitives
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
