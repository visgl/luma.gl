// luma.gl, MIT license
import type {TextureFormat} from '../types/texture-formats';
import type {VertexFormat} from './vertex-formats';
import type {ShaderUniformType, ShaderAttributeType} from './shader-formats';
import {AccessorObject} from '../types/accessor';
import type {Buffer} from '../resources/buffer';
import type {Sampler} from '../resources/sampler';
import type {Texture} from '../resources/texture';

/**
 * Describes all shader binding points for a `RenderPipeline` or `ComputePipeline`
 * A ShaderLayout describes the static structure of a shader pipeline.
 * It also allows the numeric locations in the shader to accessed with the same variable names
 * used in the shader.
 * @note A ShaderLayout needs to be complemented by a BufferLayout that describes 
 * the actual memory layout of the buffers that will be used with the pipeline.
 * 
 * @example
 * ```
  device.createRenderPipeline({
    shaderLayout: [
      attributes: [
        {name: 'instancePositions', location: 0, format: 'float32x2', stepMode: 'instance'},
        {name: 'instanceVelocities', location: 1, format: 'float32x2', stepMode: 'instance'},
        {name: 'vertexPositions', location: 2, format: 'float32x2', stepMode: 'vertex'}
      ],
      bindings: [...]
    ]
  })
 * ```
 */
export type ShaderLayout = {
  /** All attributes, their locations, and basic type information. Also an auto-deduced step mode */
  attributes: AttributeDeclaration[];
  /** All bidning points (textures, samplers, uniform buffers) with their locations and type */
  bindings: BindingDeclaration[];
  /** WebGL only (WebGPU use bindings and uniform buffers) */
  uniforms?: any[];
  /** WebGL2 only (WebGPU use compute shaders) */
  varyings?: any[];
};

/** 
 * Declares one for attributes 
 */
export type AttributeDeclaration = {
  /** The name of this attribute in the shader */
  name: string;
  /** The index into the GPU's vertex array buffer bank (usually between 0-15) */
  location: number;
  /** WebGPU-style shader type. The declared format of the attribute in the shader code. Buffer's vertex format needs to map to this. */
  type: ShaderAttributeType;
  /** Inferred from attribute name. @note Technically not part of static structure of shader */
  stepMode?: 'vertex' | 'instance';
};

// BUFFER LAYOUT

/** 
 * A BufferLayout complements the static structure in a ShaderLayout with information
 * about the dynamic memory layout of the buffers that will be used with the pipeline.
 * 
 * Provides specific details about the memory layout of the actual buffers 
 * that will be provided to a `RenderPipeline`.
 */
export type SingleBufferLayout = BufferLayout;

/** 
 * Specify memory layout for a buffer that is only used by one attribute
 * @note Specifies format, stride, offset and step mode
 * @note The buffer can be set using the attribute name. 
 */
export type BufferLayout = {
  /** Name of attribute to adjust */
  name: string;
  /** vertex format. Auto calculated. @note Needs to match type/components of the ShaderLayout ('f32', 'i32', 's32') */
  format?: VertexFormat;
  /** offset into buffer. Defaults to `0` */
  byteOffset?: number;
  /** bytes between successive elements. If omitted, stride is set to reflect a "packed" buffer */
  byteStride?: number;
  /** Whether the attribute is instanced. @note Only needs to be provided if auto deduction failed. */
  stepMode?: 'vertex' | 'instance';
  /** Optional: interleaved attributes that read from this buffer */
  attributes?: InterleavedAttributeLayout[];
};

/**  */
export type InterleavedAttributeLayout = {
  /** Name of attribute that maps to an interleaved "view" of this buffer */
  name: string;
  /** vertex format override, when using formats other than float32 (& uint32, sint32) */
  format?: VertexFormat;
  /** 
   * offset into one stride. 
   * @note additive to the parent's buffer byteOffset
   * @note if not supplied, offset for each attribute is auto calculated starting from zero assuming aligned packing
   */
  byteOffset?: number;
};

/** 
 * Map an interleaved buffer whose values 
 * @note The buffer can be set using the defined buffer name. 
 */
// export type InterleavedBufferLayout = {
//   /** Mark this as interleaved */
//   type: 'interleave';
//   /** Name of buffer (to which the multiple attributes are to be bound) */
//   name: string;
//   /** bytes between successive elements. Assumes tight packing if omitted */
//   byteStride?: number;
//   /** offset into buffer Defaults to `0` */
//   byteOffset?: number;
//   /** Attributes that read from this buffer */
//   attributes: InterleavedAttribute[];
//   /** @deprecated Dummy for typing */
//   format?: VertexFormat;
// };


/**
 * A buffer map is used to specify "non-standard" buffer layouts (buffers with offsets, interleaved buffers etc)
 *
 * @example
 * ```
  device.createRenderPipeline({
    shaderLayout: shaderLayout,
    // interleaved bindings, auto offset
    bufferLayout: [
      {name: 'interleavedPositions', attributes: [...]}
      {name: 'position', byteOffset: 1024}
      // single buffer per binding
      {name: 'vertexPositions', location: 2, accessor: {format: 'float32x2'}}
      // interleaved bindings, auto offset
      {name: 'particles', stepMode: 'instance', fields: [
        {name: 'instancePositions', location: 0, format: 'float32x4'},
        {name: 'instanceVelocities', location: 1, format: 'float32x4'}
      ]},
    ]
  ];
  ```
 */
// export type BufferLayout = SingleBufferLayout | InterleavedBufferLayout;

// /** Specify stride and offset for a buffer that only handles one attribute*/
// export type SingleBufferLayout = {
//   /** Mark this as interleaved */
//   type?: 'override';
//   /** Name of attribute to adjust */
//   name: string;
//   /** vertex format override, when using formats other than float32, uint32, sint32 */
//   format: VertexFormat;
//   /** bytes between successive elements @note `stride` is auto calculated if omitted */
//   byteStride?: number;
//   /** offset into buffer. Defaults to `0` */
//   byteOffset?: number;
// };

// /** Map an interleaved buffer */
// export type InterleavedBufferLayout = {
//   /** Mark this as interleaved */
//   type: 'interleave';
//   /** Name of buffer (to which the multiple attributes are to be bound) */
//   name: string;
//   /** bytes between successive elements. Assumes tight packing if omitted */
//   byteStride?: number;
//   /** offset into buffer Defaults to `0` */
//   byteOffset?: number;
//   /** Attributes that read from this buffer */
//   attributes: InterleavedAttribute[];
//   /** @deprecated Dummy for typing */
//   format?: VertexFormat;
// };

// /** @note Not public: not exported outside of api module */
// export type InterleavedAttribute = {
//   /** Name of attribute that maps to an interleaved "view" of this buffer */
//   name: string;
//   /** vertex format override, when using formats other than float32 (& uint32, sint32) */
//   format?: VertexFormat;
//   /** 
//    * offset into one stride. 
//    * @note additive to the parent's buffer byteOffset
//    * @note if not supplied, offset for each attribute is auto calculated starting 
//    * from zero assuming aligned packing
//    */
//   byteOffset?: number;
// };

// BINDING LAYOUTS

/*
type Binding = {
  binding: number;
  visibility: number;

  buffer?: {
    type?: 'uniform' | 'storage' | 'read-only-storage';
    hasDynamicOffset?: false;
    minBindingSize?: number;
  };

  // type = sampler
  samplerType?: 'filtering' | 'non-filtering' | 'comparison';

  // type = texture
  viewDimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  sampleType?: 'float' | 'unfilterable-float' | 'depth' | 'sint' | 'uint';
  multisampled?: boolean;

  // type = storage
  viewDimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  access: 'read-only' | 'write-only';
  format: string;
};
*/

/** ShaderLayout for bindings */
export type BindingDeclaration =
  | UniformBufferBindingLayout 
  | BufferBindingLayout
  | TextureBindingLayout
  | SamplerBindingLayout
  | StorageTextureBindingLayout;

export type UniformBufferBindingLayout = {
  type: 'uniform';
  name: string;
  location: number;
  visibility?: number;
  hasDynamicOffset?: boolean;
  minBindingSize?: number;
  uniforms?: UniformInfo[];
};

export type UniformInfo = {
  name: string;
  format: ShaderUniformType;
  type?: string;
  arrayLength: number;
  byteOffset: number;
  byteStride: number;
};

export type BufferBindingLayout = {
  type: 'uniform' | 'storage' | 'read-only-storage';
  name: string;
  location: number;
  visibility?: number;
  hasDynamicOffset?: boolean;
  minBindingSize?: number;
};

type TextureBindingLayout = {
  type: 'texture';
  name: string;
  location: number;
  visibility?: number;
  viewDimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d'; // default: '2d'
  sampleType?: 'float' | 'unfilterable-float' | 'depth' | 'sint' | 'uint'; // default: 'float'
  multisampled?: boolean;
};

type SamplerBindingLayout = {
  type: 'sampler';
  name: string;
  location: number;
  visibility?: number;
  samplerType?: 'filtering' | 'non-filtering' | 'comparison'; // default: filtering
};

type StorageTextureBindingLayout = {
  type: 'storage';
  name: string;
  location: number;
  visibility?: number;
  access?: 'write-only';
  format: TextureFormat;
  viewDimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
};

// BINDINGS

/** Binding value */
export type Binding = Texture | Sampler | Buffer | {buffer: Buffer; offset?: number; size?: number};

// SHADER LAYOUTS

/** 
 * Describes a varying binding for a program 
 * @deprecated Varyings are WebGL-only
 */
export type VaryingBinding = {
  location: number;
  name: string;
  accessor: AccessorObject;
};

// Uniform bindings

/** Describes a uniform block binding for a program */
export type UniformBlockBinding = {
  location: number;
  name: string;
  byteLength: number;
  vertex: boolean;
  fragment: boolean;
  uniformCount: number;
  uniformIndices?: number[];
  uniforms: UniformInfo[];
};

/** Describes a uniform (sampler etc) binding for a program */
export type UniformBinding = {
  location: number;
  name: string;
  size: number;
  type: number;
  isArray: boolean;
};

/** @deprecated */
export type AttributeBinding = {
  name: string;
  location: number;
  accessor: AccessorObject;
};
