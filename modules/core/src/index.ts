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

// PORTABLE API - UNIFORM BUFFERS
export {UniformBufferLayout} from './portable/uniform-buffer-layout';
export {UniformBlock} from './portable/uniform-block';
export {UniformStore} from './portable/uniform-store';
// TEXTURE TYPES

// API TYPES
export type {CompilerMessage} from './adapter/types/compiler-message';

export type {
  TextureCompressionFormat,
  TextureCubeFace,
  TextureLevelData,
  ExternalImage,
  TextureData,
  Texture1DData,
  Texture2DData,
  Texture3DData,
  TextureCubeData,
  TextureArrayData,
  TextureCubeArrayData,
  CopyExternalImageOptions
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
  Binding
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

// GPU TYPE UTILS - GPU MEMORY LAYOUT TYPES - EXTERNAL

export type {NumberArray, TypedArray, TypedArrayConstructor} from './types';
export type {VertexFormat, VertexType} from './gpu-type-utils/vertex-formats';
export type {
  ShaderDataType,
  ShaderAttributeType,
  ShaderUniformType
} from './gpu-type-utils/shader-types';
export type {
  TextureFormat,
  ColorTextureFormat,
  DepthStencilTextureFormat
} from './gpu-type-utils/texture-formats';
export type {TextureFormatInfo} from './gpu-type-utils/texture-format-info';
export type {TextureFormatCapabilities} from './gpu-type-utils/texture-format-capabilities';

// GPU TYPE UTILS - GPU MEMORY LAYOUT HELPERS - CAN BE USED BY APPS BUT MOSTLY USED INTERNALLY

export {decodeVertexFormat} from './gpu-type-utils/decode-vertex-format';
export {decodeShaderUniformType} from './gpu-type-utils/decode-shader-types';
export {decodeShaderAttributeType} from './gpu-type-utils/decode-attribute-type';
export {getDataTypeFromTypedArray} from './gpu-type-utils/vertex-format-from-attribute';
export {getTypedArrayFromDataType} from './gpu-type-utils/vertex-format-from-attribute';
export {getVertexFormatFromAttribute} from './gpu-type-utils/vertex-format-from-attribute';

export {decodeTextureFormat} from './gpu-type-utils/decode-texture-format';
export {getTextureFormatCapabilities} from './gpu-type-utils/texture-format-capabilities';

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

// TEST EXPORTS
export {
  getTextureFormatDefinition as _getTextureFormatDefinition,
  getTextureFormatTable as _getTextureFormatTable
} from './gpu-type-utils/texture-format-table';
