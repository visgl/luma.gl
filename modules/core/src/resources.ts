// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Narrow entry point for portable GPU resource classes. */

export {Resource, type ResourceProps} from './adapter/resources/resource';
export {Buffer, type BufferProps, type BufferMapCallback} from './adapter/resources/buffer';
export {Texture, type TextureProps} from './adapter/resources/texture';
export {TextureView, type TextureViewProps} from './adapter/resources/texture-view';
export {ExternalTexture, type ExternalTextureProps} from './adapter/resources/external-texture';
export {Shader, type ShaderProps} from './adapter/resources/shader';
export {Sampler, type SamplerProps, type SamplerParameters} from './adapter/resources/sampler';
export {Framebuffer, type FramebufferProps} from './adapter/resources/framebuffer';
export {RenderPipeline, type RenderPipelineProps} from './adapter/resources/render-pipeline';
export {
  SharedRenderPipeline,
  type SharedRenderPipelineProps
} from './adapter/resources/shared-render-pipeline';
export {PipelineFactory, type PipelineFactoryProps} from './factories/pipeline-factory';
export {ShaderFactory} from './factories/shader-factory';
export {_getDefaultBindGroupFactory} from './factories/bind-group-factory';
export {
  RenderPass,
  type RenderPassProps,
  type RenderPassDrawOptions,
  type RenderPassBindingOptions
} from './adapter/resources/render-pass';
export {
  RenderBundle,
  RenderBundleEncoder,
  type RenderBundleEncoderProps
} from './adapter/resources/render-bundle';
export {ComputePipeline, type ComputePipelineProps} from './adapter/resources/compute-pipeline';
export {ComputePass, type ComputePassProps} from './adapter/resources/compute-pass';
export {CommandEncoder, type CommandEncoderProps} from './adapter/resources/command-encoder';
export {CommandBuffer} from './adapter/resources/command-buffer';
export {VertexArray, type VertexArrayProps} from './adapter/resources/vertex-array';
export {
  TransformFeedback,
  type TransformFeedbackProps,
  type BufferRange
} from './adapter/resources/transform-feedback';
export {QuerySet, type QuerySetProps} from './adapter/resources/query-set';
export {Fence, type FenceProps} from './adapter/resources/fence';
export {PipelineLayout, type PipelineLayoutProps} from './adapter/resources/pipeline-layout';

export type {
  CopyBufferToBufferOptions,
  CopyBufferToTextureOptions,
  CopyTextureToBufferOptions,
  CopyTextureToTextureOptions
} from './adapter/resources/command-encoder';
export type {
  CopyElementImageOptions,
  CopyExternalImageOptions,
  CopyImageDataOptions,
  TextureReadOptions,
  TextureWriteOptions
} from './adapter/resources/texture';
