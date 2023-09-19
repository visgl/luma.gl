// luma.gl, MIT license

export {VERSION} from './init';

// GENERAL TYPES
export type {ConstructorOf, PartialBy} from './types';

// NUMERIC TYPES - TODO: could be imported from @math.gl/types
export type {
  TypedArray,
  TypedArrayConstructor,
  NumberArray,
  NumericArray,
  BigIntOrNumberArray,
  BigIntOrNumericArray
} from './types';

// MAIN API ACCESS POINTS
export {luma} from './lib/luma';

export type {DeviceProps, DeviceLimits, DeviceInfo, DeviceFeature} from './adapter/device';
export {Device} from './adapter/device';
export type {CanvasContextProps} from './adapter/canvas-context';
export {CanvasContext} from './adapter/canvas-context';

// GPU RESOURCES
export type {ResourceProps} from './adapter/resources/resource';
export {Resource} from './adapter/resources/resource';
export type {BufferProps} from './adapter/resources/buffer';
export {Buffer} from './adapter/resources/buffer';
export type {TextureProps, TextureData} from './adapter/resources/texture';
export {Texture} from './adapter/resources/texture';
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

export type {ComputePipelineProps} from './adapter/resources/compute-pipeline';
export {ComputePipeline} from './adapter/resources/compute-pipeline';
export type {RenderPassProps} from './adapter/resources/render-pass';
export {RenderPass} from './adapter/resources/render-pass';
export type {ComputePassProps} from './adapter/resources/compute-pass';
export {ComputePass} from './adapter/resources/compute-pass';
export type {CommandEncoderProps} from './adapter/resources/command-encoder';
export {CommandEncoder} from './adapter/resources/command-encoder';
export type {CommandBufferProps} from './adapter/resources/command-buffer';
export {CommandBuffer} from './adapter/resources/command-buffer';

export type {VertexArrayProps} from './adapter/resources/vertex-array';
export {VertexArray} from './adapter/resources/vertex-array';

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
} from './adapter/types/shader-formats';

export type {ColorAttachment, DepthStencilAttachment} from './adapter/types/types';

export type {
  ShaderLayout,
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
export {UniformBufferLayout} from './lib/uniform-buffer-layout';
export {UniformBlock} from './lib/uniform-block';

// TYPE UTILS
export {decodeVertexFormat} from './adapter/type-utils/decode-vertex-format';
export {decodeTextureFormat} from './adapter/type-utils/decode-texture-format';
export {decodeShaderUniformType} from './adapter/type-utils/decode-uniform-type';
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

export {StatsManager} from './lib/utils/stats-manager';
export {assert} from './lib/utils/assert';
export {cast} from './lib/utils/cast';
export {log} from './lib/utils/log';
export {uid, isPowerOfTwo, isObjectEmpty} from './lib/utils/utils';
export {formatValue} from './lib/utils/format-value';
export {stubRemovedMethods} from './lib/utils/stub-methods';
export {checkProps} from './lib/utils/check-props';
export {
  setPathPrefix,
  loadFile,
  loadImage,
  loadImageBitmap,
  loadScript
} from './lib/utils/load-file';
export {getScratchArrayBuffer, getScratchArray, fillArray} from './lib/utils/array-utils-flat';
export {getRandom, random} from './lib/utils/random';
export {deepEqual} from './lib/utils/deep-equal';

// ENGINE - TODO/move to @luma.gl/engine once that module is webgl-independent?
export {requestAnimationFrame, cancelAnimationFrame} from './lib/request-animation-frame';

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
