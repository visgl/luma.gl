// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {VERSION} from './init';

// GENERAL TYPES
export type {ConstructorOf, PartialBy} from './types';

// NUMERIC TYPES - TODO: could be imported from @math.gl/types
export type {TypedArray, TypedArrayConstructor, NumberArray, BigIntOrNumberArray} from './types';

export {isTypedArray, isNumberArray} from './utils/is-array';

// MAIN API ACCESS POINTS
export {luma} from './portable/luma';

export type {DeviceProps, DeviceInfo, DeviceFeature} from './adapter/device';
export {Device, DeviceFeatures, DeviceLimits} from './adapter/device';
export type {CanvasContextProps} from './adapter/canvas-context';
export {CanvasContext} from './adapter/canvas-context';

// GPU RESOURCES
export type {ResourceProps} from './adapter/resources/resource';
export {Resource} from './adapter/resources/resource';

export type {BufferProps} from './adapter/resources/buffer';
export {Buffer} from './adapter/resources/buffer';

export type {TextureProps, TextureData} from './adapter/resources/texture';
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

// API TYPES
export type {AccessorObject} from './adapter/types/accessor';
export type {
  Parameters,
  PrimitiveTopology,
  IndexFormat,
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
  RenderPipelineParameters
} from './adapter/types/parameters';

export type {ColorAttachment, DepthStencilAttachment} from './adapter/types/types';

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

export type {UniformValue} from './adapter/types/types';
export {UniformBufferLayout} from './portable/uniforms/uniform-buffer-layout';
export {UniformBlock} from './portable/uniforms/uniform-block';
export {UniformStore} from './portable/uniforms/uniform-store';

// TYPE UTILS
// MEMORY LAYOUT TYPES
export type {VertexFormat, VertexType} from './type-utils/vertex-formats';
export type {
  TextureFormat,
  ColorTextureFormat,
  DepthStencilTextureFormat
} from './type-utils/texture-formats';
export type {
  ShaderDataType,
  ShaderAttributeType,
  ShaderUniformType
} from './type-utils/shader-types';

export {decodeVertexFormat} from './type-utils/decode-vertex-format';
export {decodeTextureFormat} from './type-utils/decode-texture-format';
export {
  getDataTypeFromTypedArray,
  getTypedArrayFromDataType,
  getVertexFormatFromAttribute
} from './type-utils/vertex-format-from-attribute';
export {decodeShaderUniformType} from './type-utils/decode-shader-types';
export {decodeShaderAttributeType} from './type-utils/decode-attribute-type';

// COMPILER LOG
export type {CompilerMessage} from './portable/compiler-log/compiler-message';
export {formatCompilerLog} from './portable/compiler-log/format-compiler-log';

// GENERAL UTILS

export {StatsManager} from './utils/stats-manager';
export {log} from './utils/log';
export {isUniformValue, splitUniformsAndBindings} from './portable/uniforms/uniform';
export {setPathPrefix, loadFile, loadImage, loadImageBitmap, loadScript} from './utils/load-file';
export {getScratchArrayBuffer, getScratchArray, fillArray} from './utils/array-utils-flat';
export {makeRandomNumberGenerator, random} from './utils/random';
export {deepEqual} from './utils/deep-equal';

/**
 * Marks GLSL shaders for syntax highlighting: glsl`...`
 * Install https://marketplace.visualstudio.com/items?itemName=boyswan.glsl-literal
 */
export const glsl = (x: TemplateStringsArray) => `${x}`;

// INTERNAL - for use in other luma.gl modules only

export {uid, isObjectEmpty} from './utils/utils';

export type {AttributeInfo} from './adapter-utils/get-attribute-from-layouts';
export {
  getAttributeInfosFromLayouts,
  mergeShaderLayout
} from './adapter-utils/get-attribute-from-layouts';

export type {
  CopyBufferToBufferOptions,
  CopyBufferToTextureOptions,
  CopyTextureToBufferOptions,
  CopyTextureToTextureOptions
} from './adapter/resources/command-encoder';
