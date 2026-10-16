// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type {AttachDeviceProps, CreateDeviceProps} from './api/index';

export {luma} from './api/index';

export {Adapter} from './api/index';

export type {
  DeviceProps,
  DeviceInfo,
  DeviceFeature,
  WebGPUDeviceFeature,
  BrowserDeviceFeature,
  DeviceTextureFormatCapabilities,
  WebGPUFeatureLevel,
  WebGPUDeviceFeatureLevel,
  DeviceLostInfo
} from './api/index';

export {Device, DeviceFeatures, DeviceLimits, isHTMLInCanvasSupported} from './api/index';

export type {CanvasContextProps} from './api/index';

export {CanvasContext} from './api/index';

export type {PresentationContextProps} from './api/index';

export {PresentationContext} from './api/index';

export {Resource, type ResourceProps} from './api/index';

export {Buffer, type BufferProps, type BufferMapCallback} from './api/index';

export {Texture, type TextureProps} from './api/index';

export {TextureView, type TextureViewProps} from './api/index';

export type {ExternalTextureProps} from './api/index';

export {ExternalTexture} from './api/index';

export type {ShaderProps} from './api/index';

export {Shader} from './api/index';

export type {SamplerProps, SamplerParameters} from './api/index';

export {Sampler} from './api/index';

export type {FramebufferProps} from './api/index';

export {Framebuffer} from './api/index';

export type {RenderPipelineProps} from './api/index';

export {RenderPipeline} from './api/index';

export {
  SharedRenderPipeline,
  type SharedRenderPipelineProps
} from './api/index';

export type {PipelineFactoryProps} from './api/index';

export {PipelineFactory} from './api/index';

export {ShaderFactory} from './api/index';

export {_getDefaultBindGroupFactory} from './api/index';

export type {
  RenderPassProps,
  RenderPassDrawOptions,
  RenderPassBindingOptions
} from './api/index';

export {RenderPass} from './api/index';

export type {RenderBundleEncoderProps} from './api/index';

export {RenderBundle, RenderBundleEncoder} from './api/index';

export type {ComputePipelineProps} from './api/index';

export {ComputePipeline} from './api/index';

export type {ComputePassProps} from './api/index';

export {ComputePass} from './api/index';

export type {CommandEncoderProps} from './api/index';

export {CommandEncoder} from './api/index';

export {CommandBuffer} from './api/index';

export type {VertexArrayProps} from './api/index';

export {VertexArray} from './api/index';

export type {TransformFeedbackProps, BufferRange} from './api/index';

export {TransformFeedback} from './api/index';

export type {QuerySetProps} from './api/index';

export {QuerySet} from './api/index';

export {Fence, type FenceProps} from './api/index';

export type {PipelineLayoutProps} from './api/index';

export {PipelineLayout} from './api/index';

export {
  makeShaderBlockLayout,
  type ShaderBlockLayout,
  type ShaderBlockLayoutEntry,
  type ShaderBlockLayoutOptions
} from './shadertypes/index';

export {ShaderBlockWriter} from './api/index';

export {UniformBlock} from './api/index';

export {UniformStore} from './api/index';

export type {CompilerMessage} from './api/index';

export type {ExternalImage} from './shadertypes/index';

export {
  type CopyElementImageOptions,
  type CopyExternalImageOptions,
  type CopyImageDataOptions,
  type TextureReadOptions,
  type TextureWriteOptions
} from './api/index';

export type {Parameters, PrimitiveTopology, IndexFormat} from './api/index';

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
} from './api/index';

export type {ColorAttachment, DepthStencilAttachment} from './api/index';

export type {
  ShaderLayout,
  ComputeShaderLayout,
  AttributeDeclaration,
  BindingDeclaration,
  Binding,
  Bindings,
  BindingsByGroup,
  UniformBlockLayout,
  UniformBufferBindingLayout,
  UniformInfo,
  StorageBufferBindingLayout,
  TextureBindingLayout,
  ExternalTextureBindingLayout,
  SamplerBindingLayout,
  StorageTextureBindingLayout
} from './api/index';

export type {BufferLayout, BufferAttributeLayout} from './api/index';

export type {
  // Deprecated, todo
  AttributeBinding,
  UniformBinding,
  UniformBlockBinding,
  VaryingBinding
} from './api/index';

export type {UniformValue} from './api/index';

export type {
  CompositeUniformValue,
  CompositeUniformValueArray,
  CompositeUniformValueStruct
} from './api/index';

export type {
  NumberArray,
  TypedArray,
  TypedArrayConstructor,
  BigTypedArray,
  BigTypedArrayConstructor
} from './api/index';

export {
  getFloat16ArrayConstructor,
  isFloat16ArrayConstructor,
  NativeFloat16ArrayConstructor
} from './api/index';

export {
  type PrimitiveDataType,
  type SignedDataType,
  type NormalizedDataType,
  type DataTypeInfo,
  type PrimitiveDataTypeT,
  type SignedDataTypeT,
  type TypedArrayConstructorT,
  type NormalizedTypedArrayConstructorT
} from './shadertypes/index';

export {dataTypeDecoder} from './shadertypes/index';

export {
  getDataTypeByteLength,
  getDataTypeFromTypedArray,
  getTypedArrayConstructor,
  getTypedArrayFromDataType
} from './shadertypes/index';

export {
  type AttributeShaderTypeT,
  type AttributeShaderType,
  type ArrayShaderType,
  type CompositeShaderType,
  type StructShaderType,
  type VariableShaderTypeT,
  type VariableShaderType
} from './shadertypes/index';

export {
  shaderTypeDecoder,
  getAttributeShaderTypeInfo,
  getVariableShaderTypeInfo,
  type AttributeShaderTypeInfo
} from './shadertypes/index';

export {
  type VertexFormat,
  type VertexFormatDataTypeT
} from './shadertypes/index';

export {vertexFormatDecoder} from './shadertypes/index';

export {
  type TextureFormat,
  type TextureFormatColor,
  type TextureFormatDepthStencil,
  type CompressedTextureFormat,
  type TextureCompression,
  type TextureFormatInfo,
  type TextureFormatCapabilities,
  type TextureMemoryLayout
} from './shadertypes/index';

export {type TextureFormatDataTypeT} from './shadertypes/index';

export {
  type TextureFormatDecoder,
  textureFormatDecoder
} from './shadertypes/index';

export {getTextureImageView, setTextureImageData} from './shadertypes/index';

export {type PixelData, readPixel, writePixel} from './shadertypes/index';

export {isExternalImage, getExternalImageSize} from './shadertypes/index';

export type {StatsManager} from './api/index';

export type {
  CopyBufferToBufferOptions,
  CopyBufferToTextureOptions,
  CopyTextureToBufferOptions,
  CopyTextureToTextureOptions
} from './api/index';

export {log} from './api/index';

export {
  getShaderLayoutBinding,
  normalizeBindingsByGroup,
  flattenBindingsByGroup
} from './api/index';

export {assert, assertDefined} from './api/index';

export {getScratchArray} from './api/index';

export type {AttributeInfo} from './api/index';

export {getAttributeInfosFromLayouts} from './api/index';

export type {LogicalAttributeMapping} from './api/index';

export {
  getBufferLayoutAttributeNames,
  getBufferLayoutMinAttributeLocation,
  getLogicalBufferSlots,
  getMinimumAttributeLocation,
  getShaderAttributeLocationMap,
  resolveLogicalAttributeMappings
} from './api/index';

export {
  _getTextureFormatDefinition,
  _getTextureFormatTable
} from './shadertypes/index';
