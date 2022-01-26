// luma.gl, MIT license
import {TextureFormat} from '../types/texture-formats';
import {VertexFormat} from '../types/vertex-formats';
import {Accessor} from '../types/accessor';
import type Buffer from '../resources/buffer';
import type Sampler from '../resources/sampler';
import type Texture from '../resources/texture';
import {UniformFormat} from './uniform-formats';

/**
 * Describes an attribute binding for a program
 * @example
 * ```
  const SHADER_LAYOUTS = {
    attributes: [
      {name: 'instancePositions', location: 0, format: 'float32x2', stepMode: 'instance'},
      {name: 'instanceVelocities', location: 1, format: 'float32x2', stepMode: 'instance'},
      {name: 'vertexPositions', location: 2, format: 'float32x2', stepMode: 'vertex'}
    ],
  ```
 * @example
 * ```
  device.createRenderPipeline({
    shaderLayouts,
    // interleaved bindings, auto offset
    bufferMap: {
      particles: [
        {name: 'instancePositions', location: 0},
        {name: 'instanceVelocities', location: 1}
      ]
    }
  ];

  const bufferMap = [
    // single buffer per binding
    {name: 'vertexPositions', location: 2, accessor: {format: 'float32x2'}}
    // interleaved bindings, auto offset
    {name: 'particles', stepMode: 'instance', fields: [
      {name: 'instancePositions', location: 0, format: 'float32x4'},
      {name: 'instanceVelocities', location: 1, format: 'float32x4'}
    ]},
  ]
  ```
 */
export type ShaderLayout = {
  // vs: Shader,
  // vsEntryPoint?: string;
  // vsConstants?: Record<string, number>;
  // fs?: Shader,
  // fsEntryPoint?: string;
  // fsConstants?: Record<string, number>;
  // cs: Shader,
  // csEntryPoint?: string;
  // csConstants?: Record<string, number>;
  attributes: AttributeLayout[];
  bindings: BindingLayout[];
  /** WebGL only (WebGPU use bindings and uniform buffers) */
  uniforms?: any[]
  /** WebGL2 only (WebGPU use compute shaders) */
  varyings?: any[]
};

/** ShaderLayout for attributes */
export type AttributeLayout = {
  name: string;
  location: number;
  /** WebGPU-style `format` string **/
  format: VertexFormat;
  /** @note defaults to vertex */
  stepMode?: 'vertex' | 'instance';
};

// BUFFER MAP

/**
 * A buffer map is used to specify "non-standard" buffer layouts (buffers with offsets, interleaved buffers etc)
 *
 ```
 bufferMap: [
   {name: 'interleavedPositions', attributes: [...]}
   {name: 'position', byteOffset: 1024}
 ]
 ```
 */
export type BufferMapping = SingleBufferMapping | InterleavedBufferMapping;

/** @note Not public: not exported outside of api module */
export type SingleBufferMapping = {
  /** Name of attribute to adjust */
  name: string;
  /** bytes between successive elements @note `stride` is auto calculated if omitted */
  byteStride?: number;
  /** offset into buffer. Defaults to `0` */
  byteOffset?: number;
};

/** @note Not public: not exported outside of api module */
export type InterleavedBufferMapping = {
  /** Name of buffer () */
  name: string;
  /** bytes between successive elements @note `stride` is auto calculated if omitted */
  byteStride?: number;
  /** offset into buffer Defaults to `0` */
  byteOffset?: number;
  /** Attributes that read from this buffer */
  attributes: InterleavedAttribute[];
};

/** @note Not public: not exported outside of api module */
export type InterleavedAttribute = {
  /** Name of buffer to map */
  name?: string;
  /** offset into one stride. @note `offset` is auto calculated starting from zero */
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

// ATTRIBUTE LAYOUTS

/**
 * Holds metadata describing attribute configurations for a program's shaders
 * @deprecated - unify witb ShaderLayout
 */
export type ProgramBindings = {
  readonly attributes: AttributeBinding[];
  readonly varyings: VaryingBinding[];
  readonly uniformBlocks: UniformBlockBinding[];
  // Note - samplers are always in unform bindings, even if uniform blocks are used
  readonly uniforms: UniformBinding[];
};

/** @deprecated Describes a varying binding for a program */
export type VaryingBinding = {
  location: number;
  name: string;
  accessor: Accessor;
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
  accessor: Accessor;
};
