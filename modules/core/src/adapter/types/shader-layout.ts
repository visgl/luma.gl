// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TextureFormat} from '../types/texture-formats';
import type {ShaderUniformType, ShaderAttributeType} from './shader-types';
import {AccessorObject} from '../types/accessor';
import type {Buffer} from '../resources/buffer';
import type {Sampler} from '../resources/sampler';
import type {Texture} from '../resources/texture';
import type {TextureView} from '../resources/texture-view';

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
        {name: 'instancePositions', location: 0, format: 'vec3<f32>', stepMode: 'instance'},
        {name: 'instanceVelocities', location: 1, format: 'vec3<f32>', stepMode: 'instance'},
        {name: 'vertexPositions', location: 2, format: 'vec3<f32>', stepMode: 'vertex'}
      ],
      bindings: [...]
    ]
  })
 * ```
 */
export type ShaderLayout = {
  /** All attributes, their locations, and basic type information. Also an auto-deduced step mode */
  attributes: AttributeDeclaration[];
  /** All binding points (textures, samplers, uniform buffers) with their locations and type */
  bindings: BindingDeclaration[];
  /** WebGL only (WebGPU use bindings and uniform buffers) */
  uniforms?: any[];
  /** WebGL2 only (WebGPU use compute shaders) */
  varyings?: VaryingBinding[];
};

export type ComputeShaderLayout = {
  /** All binding points (textures, samplers, uniform buffers) with their locations and type */
  bindings: BindingDeclaration[];
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
  | StorageBufferBindingLayout
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

export type StorageBufferBindingLayout = {
  type: 'storage' | 'read-only-storage';
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
export type Binding =
  | TextureView
  | Texture
  | Sampler
  | Buffer
  | {buffer: Buffer; offset?: number; size?: number};

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
