// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import type {
  CommandEncoder,
  ComputePass,
  Device,
  ExternalTexture,
  Framebuffer,
  QuerySet,
  RenderPass,
  TextureFormat,
  TextureView
} from '@luma.gl/core';
import {DynamicBuffer, DynamicTexture} from '@luma.gl/engine';
import {
  type GPUData,
  type GPUVector,
  type GPUVectorFormat,
  getGPUVectorFormatInfo,
  isValueListGPUVectorFormat,
  isVertexListGPUVectorFormat
} from '@luma.gl/gpgpu/gpu-data';
import {
  compileGPUCommandGraph,
  compileGPUCommandGraphAsync,
  getBufferHandle,
  getTextureHandle,
  isGraphBufferUse,
  isGraphTextureUse,
  validateGraphNodeBufferBindingAliasing,
  type BufferTransientAllocation,
  type CompiledNode,
  type GPUCommandGraphCompilation,
  type TextureTransientAllocation
} from './gpu-command-graph-compiler';
import {
  GraphBufferHandle,
  GraphDataView,
  GraphExternalTextureHandle,
  GraphTextureHandle,
  GraphTextureView,
  GraphVectorView
} from './gpu-command-graph-types';
import type {GPUCommandGraphAutotuner} from './gpu-command-graph-autotuner';

import type {
  GPUCommandGraphComputeExecutable,
  GPUCommandGraphComputeNode,
  GPUCommandGraphCapabilities,
  GPUCommandGraphCopyExecutable,
  GPUCommandGraphCopyNode,
  GPUCommandGraphEncodeContext,
  GPUCommandGraphEncodeOptions,
  GPUCommandGraphEncodingStats,
  GPUCommandGraphNode,
  GPUCommandGraphNodeEncodingStats,
  GPUCommandGraphNodePreflight,
  GPUCommandGraphNodePublication,
  GPUCommandGraphPreflightReport,
  GPUCommandGraphRenderExecutable,
  GPUCommandGraphRenderNode,
  GPUCommandGraphStats,
  GPUCommandGraphTimingReport,
  GraphBufferDescriptor,
  GraphBufferUsage,
  GraphExternalTextureBinding,
  GraphExternalTextureDescriptor,
  GraphFrameTextureBinding,
  GraphImportedBuffer,
  GraphImportedTexture,
  GraphRenderPassAttachments,
  GraphTextureDescriptor,
  GraphTextureUsage,
  GraphTextureUse,
  GraphTextureViewProps,
  NormalizedGraphTextureDescriptor
} from './gpu-command-graph-types';

const UINT32_BYTE_LENGTH = 4;

export {
  GraphBufferHandle,
  GraphDataView,
  GraphExternalTextureHandle,
  GraphTextureHandle,
  GraphTextureView,
  GraphVectorView
} from './gpu-command-graph-types';
export type {
  GPUCommandGraphCompileContext,
  GPUCommandGraphCapabilities,
  GPUCommandGraphCPUCondition,
  GPUCommandGraphComputeExecutable,
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
  GraphTextureViewProps
} from './gpu-command-graph-types';

/** Per-submission limits for a resumable command-graph execution. */
export type GPUCommandGraphExecutionBudget = {
  maximumInvocationCount: number;
  maximumNodeCount?: number;
  maximumCommandCount?: number;
  maximumReadByteLength?: number;
  maximumWriteByteLength?: number;
};

export type GPUCommandGraphExecutionLatencyPriority = 'interactive' | 'normal' | 'background';
export type GPUCommandGraphExecutionPublicationPolicy = 'final' | 'progressive';
export type GPUCommandGraphExecutionOptions = {
  latencyPriority?: GPUCommandGraphExecutionLatencyPriority;
  publicationPolicy?: GPUCommandGraphExecutionPublicationPolicy;
};
export type GPUCommandGraphExecutionPlanStep = any;
export type GPUCommandGraphExecutionPlan = any;
export type GPUCommandGraphExecutionStep = any;

// NOTE: remainder of file unchanged except GPUCommandGraph.captureCommandNodes(), inserted below.

