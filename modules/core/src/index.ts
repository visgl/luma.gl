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
export type {ResourceProps} from './adapter/resources/resource';
export {Resource} from './adapter/resources/resource';

export type {BufferProps} from './adapter/resources/buffer';
export {Buffer} from './adapter/resources/buffer';

export type {TextureProps} from './adapter/resources/texture';
export {Texture} from './adapter/resources/texture';

export type {TextureViewProps} from './adapter/resources/texture-view';
export {TextureView} from './adapter/resources/texture-view';

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
export type {CopyExternalImageOptions, CopyImageDataOptions} from './adapter/resources/texture';

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

// GPU TYPE UTILS - GPU MEMORY LAYOUT TYPES - EXTERNAL

export type {PrimitiveDataType, SignedDataType, NormalizedDataType} from './shadertypes/data-types';
export type {AttributeShaderType, VariableShaderType} from './shadertypes/shader-types';
export type {VertexFormat} from './shadertypes/vertex-formats';
export type {
  TextureFormat,
  ColorTextureFormat,
  DepthStencilTextureFormat,
  TextureCompression,
  TextureFormatInfo,
  TextureFormatCapabilities
} from './shadertypes/texture-formats';

// GPU TYPE UTILS - GPU MEMORY LAYOUT HELPERS - CAN BE USED BY APPS BUT MOSTLY USED INTERNALLY

export {
  getDataTypeInfo,
  getDataTypeFromTypedArray,
  getTypedArrayFromDataType,
  makeNormalizedDataType
} from './shadertypes/utils/decode-data-types';
export {
  getVariableShaderTypeInfo,
  getAttributeShaderTypeInfo
} from './shadertypes/utils/decode-shader-types';
export {
  getVertexFormatInfo,
  getVertexFormatFromAttribute,
  makeVertexFormat
} from './shadertypes/utils/decode-vertex-format';
export {
  getTextureFormatInfo,
  getTextureFormatCapabilities
} from './shadertypes/utils/decode-texture-format';

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
export {BufferLayoutHelper as _BufferLayoutHelper} from './adapter-utils/buffer-layout-helper';
export {getAttributeInfosFromLayouts} from './adapter-utils/get-attribute-from-layouts';
export {sortedBufferLayoutByShaderSourceLocations} from './adapter-utils/buffer-layout-order';

// TEST EXPORTS
export {
  getTextureFormatDefinition as _getTextureFormatDefinition,
  getTextureFormatTable as _getTextureFormatTable
} from './shadertypes/utils/texture-format-table';
