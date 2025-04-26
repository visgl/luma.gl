// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// MAIN API ACCESS POINT
export type {AttachDeviceProps, CreateDeviceProps} from './adapter/luma';
export {luma} from './adapter/luma';

// ADAPTER (DEVICE AND GPU RESOURCE INTERFACES)
export {Adapter} from './adapter/adapter';

export type {
  DeviceProps,
  DeviceInfo,
  DeviceFeature,
  DeviceTextureFormatCapabilities
} from './adapter/device';
export {Device, DeviceFeatures, DeviceLimits} from './adapter/device';

export type {CanvasContextProps} from './adapter/canvas-context';
export {CanvasContext} from './adapter/canvas-context';

// GPU RESOURCES
export {Resource, type ResourceProps} from './adapter/resources/resource';

export {Buffer, type BufferProps, type BufferMapCallback} from './adapter/resources/buffer';

export {Texture, type TextureProps} from './adapter/resources/texture';

export {TextureView, type TextureViewProps} from './adapter/resources/texture-view';

export type {ExternalTextureProps} from './adapter/resources/external-texture';
export {ExternalTexture} from './adapter/resources/external-texture';

export type {ShaderProps} from './adapter/resources/shader';
export {Shader} from './adapter/resources/shader';

export type {SamplerProps, SamplerParameters} from './adapter/resources/sampler';
export {Sampler} from './adapter/resources/sampler';

export type {FramebufferProps} from './adapter/resources/framebuffer';
export {Framebuffer} from './adapter/resources/framebuffer';

export type {RenderPipelineProps} from './adapter/resources/render-pipeline';
export {RenderPipeline} from './adapter/resources/render-pipeline';

export type {RenderPassProps} from './adapter/resources/render-pass';
export {RenderPass} from './adapter/resources/render-pass';

export type {ComputePipelineProps} from './adapter/resources/compute-pipeline';
export {ComputePipeline} from './adapter/resources/compute-pipeline';

export type {ComputePassProps} from './adapter/resources/compute-pass';
export {ComputePass} from './adapter/resources/compute-pass';

export type {CommandEncoderProps} from './adapter/resources/command-encoder';
export {CommandEncoder} from './adapter/resources/command-encoder';

export type {CommandBufferProps} from './adapter/resources/command-buffer';
export {CommandBuffer} from './adapter/resources/command-buffer';

export type {VertexArrayProps} from './adapter/resources/vertex-array';
export {VertexArray} from './adapter/resources/vertex-array';

export type {TransformFeedbackProps, BufferRange} from './adapter/resources/transform-feedback';
export {TransformFeedback} from './adapter/resources/transform-feedback';

export type {QuerySetProps} from './adapter/resources/query-set';
export {QuerySet} from './adapter/resources/query-set';

export type {PipelineLayoutProps} from './adapter/resources/pipeline-layout';
export {PipelineLayout} from './adapter/resources/pipeline-layout';

// PORTABLE API - UNIFORM BUFFERS
export {UniformBufferLayout} from './portable/uniform-buffer-layout';
export {UniformBlock} from './portable/uniform-block';
export {UniformStore} from './portable/uniform-store';
// TEXTURE TYPES

// API TYPES
export type {CompilerMessage} from './adapter/types/compiler-message';

export type {ExternalImage} from './image-utils/image-types';

export {
  type CopyExternalImageOptions,
  type CopyImageDataOptions
} from './adapter/resources/texture';

export type {Parameters, PrimitiveTopology, IndexFormat} from './adapter/types/parameters';

export type {
  CullMode,
  FrontFace,
  RasterizationParameters,
  CompareFunction,
  StencilOperation,
  DepthStencilParameters,
  BlendFactor,
  BlendOperation,
  ColorParameters,
  MultisampleParameters,
  RenderPassParameters,
  RenderPipelineParameters,
  PolygonMode,
  ProvokingVertex
} from './adapter/types/parameters';

export type {ColorAttachment, DepthStencilAttachment} from './adapter/types/attachments';

export type {
  ShaderLayout,
  ComputeShaderLayout,
  AttributeDeclaration,
  BindingDeclaration,
  Binding,
  UniformBufferBindingLayout,
  StorageBufferBindingLayout,
  TextureBindingLayout,
  SamplerBindingLayout,
  StorageTextureBindingLayout
} from './adapter/types/shader-layout';
export type {BufferLayout, BufferAttributeLayout} from './adapter/types/buffer-layout';
export type {
  // Deprecated, todo
  AttributeBinding,
  UniformBinding,
  UniformBlockBinding,
  VaryingBinding
} from './adapter/types/shader-layout';

export type {UniformValue} from './adapter/types/uniforms';

// TYPED ARRAY TYPES

export type {
  NumberArray,
  TypedArray,
  TypedArrayConstructor,
  BigTypedArray,
  BigTypedArrayConstructor
} from './types';

// GPU TYPE UTILS - BASIC DATA TYPES

export {
  type PrimitiveDataType,
  type SignedDataType,
  type NormalizedDataType,
  type DataTypeInfo,
  type DataTypeArray,
  type NormalizedDataTypeArray
} from './shadertypes/data-types/data-types';
export {
  type AttributeShaderType,
  type VariableShaderType
} from './shadertypes/data-types/shader-types';
export {
  getDataTypeInfo,
  getDataType,
  getTypedArrayConstructor,
  getNormalizedDataType
} from './shadertypes/data-types/decode-data-types';
export {
  getVariableShaderTypeInfo,
  getAttributeShaderTypeInfo
} from './shadertypes/data-types/decode-shader-types';

// GPU TYPE UTILS - VERTEX ARRAYs

export {type VertexFormat} from './shadertypes/vertex-arrays/vertex-formats';

export {
  getVertexFormatInfo,
  getVertexFormatFromAttribute,
  makeVertexFormat
} from './shadertypes/vertex-arrays/decode-vertex-format';

// GPU TYPE UTILS - Texture Formats

export {
  type TextureFormat,
  type TextureFormatColor,
  type TextureFormatDepthStencil,
  type TextureCompression,
  type TextureFormatInfo,
  type TextureFormatCapabilities
} from './shadertypes/textures/texture-formats';

export {
  TextureFormatDecoder,
  textureFormatDecoder
} from './shadertypes/textures/texture-format-decoder';

export {type PixelData, readPixel, writePixel} from './shadertypes/textures/pixel-utils';

// GENERAL EXPORTS - FOR APPLICATIONS

export type {StatsManager} from './utils/stats-manager'; // TODO - should this be moved to probe.gl?

// ADAPTER UTILS - for implementing Device adapters (@luma.gl/webgl and @luma.gl/webgpu)

export type {
  CopyBufferToBufferOptions,
  CopyBufferToTextureOptions,
  CopyTextureToBufferOptions,
  CopyTextureToTextureOptions
} from './adapter/resources/command-encoder';

// INTERNAL UTILS - for use in other luma.gl modules only
export {log} from './utils/log';
export {getScratchArray} from './utils/array-utils-flat';
export type {AttributeInfo} from './adapter-utils/get-attribute-from-layouts';
export {getAttributeInfosFromLayouts} from './adapter-utils/get-attribute-from-layouts';

// TEST EXPORTS
export {
  getTextureFormatDefinition as _getTextureFormatDefinition,
  getTextureFormatTable as _getTextureFormatTable
} from './shadertypes/textures/texture-format-table';
