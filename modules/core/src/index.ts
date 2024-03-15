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
export {luma} from './lib/luma';

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
  RenderPipelineParameters,
  PolygonMode,
  ProvokingVertex
} from './adapter/types/parameters';

// MEMORY LAYOUT TYPES
export type {VertexFormat, VertexType} from './adapter/types/vertex-formats';
export type {
  TextureFormat,
  ColorTextureFormat,
  DepthStencilTextureFormat
} from './adapter/types/texture-formats';
export type {
  ShaderDataType,
  ShaderAttributeType,
  ShaderUniformType
} from './adapter/types/shader-types';

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
export {UniformBufferLayout} from './lib/uniforms/uniform-buffer-layout';
export {UniformBlock} from './lib/uniforms/uniform-block';
export {UniformStore} from './lib/uniforms/uniform-store';

// TYPE UTILS
export {decodeVertexFormat} from './adapter/type-utils/decode-vertex-format';
export {decodeTextureFormat} from './adapter/type-utils/decode-texture-format';
export {
  getDataTypeFromTypedArray,
  getTypedArrayFromDataType,
  getVertexFormatFromAttribute
} from './adapter/type-utils/vertex-format-from-attribute';

// SHADER TYPE UTILS
export {decodeShaderUniformType} from './adapter/type-utils/decode-shader-types';
export {decodeShaderAttributeType} from './adapter/type-utils/decode-attribute-type';

// COMPILER LOG
export type {CompilerMessage} from './lib/compiler-log/compiler-message';
export {formatCompilerLog} from './lib/compiler-log/format-compiler-log';

//
export type {AttributeInfo} from './adapter/attribute-utils/get-attribute-from-layouts';
export {
  getAttributeInfosFromLayouts,
  mergeShaderLayout
} from './adapter/attribute-utils/get-attribute-from-layouts';

// GENERAL UTILS

export {StatsManager} from './utils/stats-manager';
export {assert} from './utils/assert';
export {cast} from './utils/cast';
export {log} from './utils/log';
export {uid, isObjectEmpty} from './utils/utils';
export {isUniformValue, splitUniformsAndBindings} from './lib/uniforms/uniform';
export {formatValue} from './utils/format-value';
export {stubRemovedMethods} from './utils/stub-methods';
export {checkProps} from './utils/check-props';
export {setPathPrefix, loadFile, loadImage, loadImageBitmap, loadScript} from './utils/load-file';
export {getScratchArrayBuffer, getScratchArray, fillArray} from './utils/array-utils-flat';
export {makeRandomNumberGenerator, random} from './utils/random';
export {deepEqual} from './utils/deep-equal';

// ENGINE - TODO/move to @luma.gl/engine once that module is webgl-independent?
export {requestAnimationFrame, cancelAnimationFrame} from './utils/request-animation-frame';

// SHADER HELPERS

/**
 * Marks GLSL shaders for syntax highlighting: glsl`...`
 * Install https://marketplace.visualstudio.com/items?itemName=boyswan.glsl-literal
 */
export const glsl = (x: TemplateStringsArray) => `${x}`;

// INTERNAL

export type {
  CopyBufferToBufferOptions,
  CopyBufferToTextureOptions,
  CopyTextureToBufferOptions,
  CopyTextureToTextureOptions
} from './adapter/resources/command-encoder';
