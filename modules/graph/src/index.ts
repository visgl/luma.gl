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
  type GPUGraphScalarFormat,
  type GPUGraphVectorFormat,
  type GPUGraphTextureProps,
  GPUGraphCompiler,
  type GPUGraphBindings,
  type GPUGraphCompilation,
  type GPUGraphLoweredNode,
  type GPUGraphLoweringReport,
  GPUOperationLoweringRegistry,
  type GPUOperationLowerer,
  type GPUOperationLoweringContext,
  type GPUOperationLoweringDecision,
  type GPUGraphBackendCapabilities,
  inspectGPUGraphCompilation,
  type GPUGraphCompilationSummary,
  validateGPUGraph,
  type GPUGraphValidationIssue,
  type GPUGraphValidationReport,
  type GPUCommandGraphCompileContext,
  type GPUCommandGraphCapabilities,
  type GPUCommandGraphCPUCondition,
  type GPUCommandGraphComputeExecutable,
  type GPUCommandGraphComputeNode,
  type GPUCommandGraphCopyExecutable,
  type GPUCommandGraphCopyNode,
  type GPUCommandGraphEncodeContext,
  type GPUCommandGraphEncodeOptions,
  type GPUCommandGraphGPUIndirectCondition,
  type GPUCommandGraphNode,
  type GPUCommandGraphNodeCondition,
  type GPUCommandGraphNodeConditionPreflight,
  type GPUCommandGraphNodeEncodingStats,
  type GPUCommandGraphNodePreflight,
  type GPUCommandGraphResourceSummary,
  type GPUCommandGraphNodePublication,
  type GPUCommandGraphNodeTiming,
  type GPUCommandGraphNodeType,
  type GPUCommandGraphNodeWorkloadEstimate,
  type GPUCommandGraphPreflightReport,
  type GPUCommandGraphRenderExecutable,
  type GPUCommandGraphRenderNode,
  type GPUCommandGraphStats,
  type GPUCommandGraphEncodingStats,
  type GPUCommandGraphTimingReport,
  type GraphBufferDescriptor,
  type GraphBufferUsage,
  type GraphBufferUse,
  type GraphExternalTextureBinding,
  type GraphExternalTextureDescriptor,
  type GraphExternalTextureUse,
  type GraphFrameTextureBinding,
  type GraphImportedBuffer,
  type GraphImportedTexture,
  type GraphRenderPassAttachments,
  type GraphResourceUse,
  type GraphTextureAspect,
  type GraphTextureDescriptor,
  type GraphTextureDimension,
  type GraphTextureUsage,
  type GraphTextureUse,
  type GraphTextureViewProps,
  type GPUCommandGraphExecutionBudget,
  type GPUCommandGraphExecutionLatencyPriority,
  type GPUCommandGraphExecutionPublicationPolicy,
  type GPUCommandGraphExecutionOptions,
  type GPUCommandGraphExecutionPlanStep,
  type GPUCommandGraphExecutionPlan,
  type GPUCommandGraphExecutionStep
} from './gpu-graph/index';
export {
  getGPUCommandGraphAdapterIdentity,
  type GPUCommandGraphAdapterIdentity,
  type GPUCommandGraphKernelCandidate,
  type GPUCommandGraphKernelCalibration,
  type GPUCommandGraphAutotuningProfile,
  type GPUCommandGraphAutotunerProps,
  type GPUCommandGraphKernelSelectionRequest,
  type GPUCommandGraphKernelSelection,
  type GPUCommandGraphKernelObservation,
  GPUCommandGraphAutotuner
} from './gpu-core/gpu-command-graph-autotuner';
export {
  type GPUCommandGraphExecutionBudgetControllerProps,
  type GPUCommandGraphExecutionBudgetObservation,
  GPUCommandGraphExecutionBudgetController
} from './gpu-core/gpu-command-graph-budget-controller';
export {
  type GPUCommandGraphInspectorGraph,
  type GPUCommandGraphInspectorEncoding,
  type GPUCommandGraphInspectorObservableGraph,
  type GPUCommandGraphInspectorObservation,
  type GPUCommandGraphInspectorNodeIdentity,
  type GPUCommandGraphInspectorProps,
  type GPUCommandGraphInspectorDurationSnapshot,
  type GPUCommandGraphInspectorCounterSnapshot,
  type GPUCommandGraphInspectorNodeSnapshot,
  type GPUCommandGraphInspectorStatsSnapshot,
  type GPUCommandGraphInspectorGraphSnapshot,
  type GPUCommandGraphInspectorSnapshot,
  GPUCommandGraphInspector
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

export {GPUExpressionOperation} from './gpu-core/gpu-expression-operation';
export type {
  GPUExpressionOperationProps,
  GPUExpressionAST
} from './gpu-core/gpu-expression-operation';
export {CompiledGPUGraph} from './gpu-core/compiled-gpu-graph';
export type {
  GPUGraphCompileOptions,
  GPUGraphRunBindings,
  GPUGraphRunOptions
} from './gpu-core/gpu-expression-plan';
