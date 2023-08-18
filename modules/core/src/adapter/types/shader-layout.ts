// luma.gl, MIT license
import {TextureFormat} from '../types/texture-formats';
import {VertexFormat} from '../types/vertex-formats';
import {AccessorObject} from '../types/accessor';
import type {Buffer} from '../resources/buffer';
import type {Sampler} from '../resources/sampler';
import type {Texture} from '../resources/texture';
import {UniformFormat} from './uniform-formats';

/**
 * Describes an attribute binding for a program
 * @example
 * ```
  device.createRenderPipeline({
    layout: [
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
  attributes: AttributeLayout[];
  bindings: BindingLayout[];
  /** WebGL only (WebGPU use bindings and uniform buffers) */
  uniforms?: any[];
  /** WebGL2 only (WebGPU use compute shaders) */
  varyings?: any[];
};

/** ShaderLayout for attributes */
export type AttributeLayout = {
  /** The name of this attribute in the shader */
  name: string;
  /** The index into the GPU's vertex array buffer bank (usually between 0-15) */
  location: number;
  /** WebGPU-style format, such as float32x3 or uint8x4 */
  format: VertexFormat;
  /** @note defaults to vertex */
  stepMode?: 'vertex' | 'instance';
};

// BUFFER MAP

/**
 * A buffer map is used to specify "non-standard" buffer layouts (buffers with offsets, interleaved buffers etc)
 *
 * @example
 * ```
  device.createRenderPipeline({
    layout: shaderLayout,
    // interleaved bindings, auto offset
    bufferMap: [
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
export type BufferMapping = SingleBufferMapping | InterleavedBufferMapping;

/** Specify stride and offset for a buffer that only handles one attribute*/
export type SingleBufferMapping = {
  /** Mark this as interleaved */
  type?: 'override';
  /** Name of attribute to adjust */
  name: string;
  /** vertex format override, when using formats other than float32, uint32, sint32 */
  format: VertexFormat;
  /** bytes between successive elements @note `stride` is auto calculated if omitted */
  byteStride?: number;
  /** offset into buffer. Defaults to `0` */
  byteOffset?: number;
};

/** Map an interleaved buffer */
export type InterleavedBufferMapping = {
  /** Mark this as interleaved */
  type: 'interleave';
  /** Name of buffer (to which the multiple attributes are to be bound) */
  name: string;
  /** bytes between successive elements. Assumes tight packing if omitted */
  byteStride?: number;
  /** offset into buffer Defaults to `0` */
  byteOffset?: number;
  /** Attributes that read from this buffer */
  attributes: InterleavedAttribute[];
  /** @deprecated Dummy for typing */
  format?: VertexFormat;
};

/** @note Not public: not exported outside of api module */
export type InterleavedAttribute = {
  /** Name of attribute that maps to an interleaved "view" of this buffer */
  name: string;
  /** vertex format override, when using formats other than float32 (& uint32, sint32) */
  format?: VertexFormat;
  /** 
   * offset into one stride. 
   * @note additive to the parent's buffer byteOffset
   * @note if not supplied, offset for each attribute is auto calculated starting 
   * from zero assuming aligned packing
   */
  byteOffset?: number;
};

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
export type BindingLayout =
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
  format: UniformFormat;
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
