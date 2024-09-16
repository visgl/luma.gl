// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PrimitiveDataType} from './data-types';

/**
 * A composite shader type can include structs and arrays, recursively
 * This type is designed to allow applications to create compact specifications of shader types.
 * @note To obtain detailed information about a composite shader type, including memory layout, call `getShaderTypeInfo`.
 */
export type ShaderType = VariableShaderType | StructShaderType | ArrayShaderType;

export type ShaderTypeAlias = VariableShaderTypeAlias;

/** Represents a struct in WGSL */
export type StructShaderType = {[member: string]: ShaderType};

/** Represents an array in WGSL */
export type ArrayShaderType = [type: ShaderType, length: number];

/**
 * Describes the type of an attribute as defined in the shader source code.
 * @note This is a subset of shader variable types
 * @note Buffers with various `VertexFormat`s can be supplied for each type, GPU will convert them at runtime/
 */
export type AttributeShaderType =
  | PrimitiveDataType
  | `vec2<${PrimitiveDataType}>`
  | `vec3<${PrimitiveDataType}>`
  | `vec4<${PrimitiveDataType}>`;

/**
 * Describes the type of a uniform that can declared in shader source code.
 * @note Uniforms can be declared using these types
 * @note Uniforms can be of a wider range of types than attributes.
 * @note to WebGL users: "bindings" (textures, samplers, and uniform buffers) are considered "bindings", not shader variables/uniforms
 */
export type UniformShaderType =
  | PrimitiveDataType
  | `vec2<${PrimitiveDataType}>`
  | `vec3<${PrimitiveDataType}>`
  | `vec4<${PrimitiveDataType}>`
  | `mat2x2<${PrimitiveDataType}>`
  | `mat2x3<${PrimitiveDataType}>`
  | `mat2x4<${PrimitiveDataType}>`
  | `mat3x2<${PrimitiveDataType}>`
  | `mat3x3<${PrimitiveDataType}>`
  | `mat3x4<${PrimitiveDataType}>`
  | `mat4x2<${PrimitiveDataType}>`
  | `mat4x3<${PrimitiveDataType}>`
  | `mat4x4<${PrimitiveDataType}>`;

export type AtomicShaderType = 'atomic<i32>' | 'atomic<u32>';

/**
 * Describes the type of an "internal" variable that can declared in shader source code.
 * @note Uniforms can be declared using these types
 * @note Uniforms can be of a wider range of types than attributes.
 * @note to WebGL users: "bindings" (textures, samplers, and uniform buffers) are considered "bindings", not shader variables/uniforms
 */
export type VariableShaderType = UniformShaderType | AtomicShaderType | 'bool';

/* Suffixes used by WGSL alias types */
type ShaderTypeAliasSuffix = 'f' | 'i' | 'u' | 'h';

/** Shorthand type aliases recognized by WGSL for attributes */
export type AttributeShaderTypeAlias =
  | `vec2${ShaderTypeAliasSuffix}`
  | `vec3${ShaderTypeAliasSuffix}`
  | `vec4${ShaderTypeAliasSuffix}`;

/** Shorthand type aliases recognized by WGSL for uniforms and storage */
export type UniformShaderTypeAlias =
  | AttributeShaderTypeAlias
  | `mat2x2${ShaderTypeAliasSuffix}`
  | `mat2x3${ShaderTypeAliasSuffix}`
  | `mat2x4${ShaderTypeAliasSuffix}`
  | `mat3x2${ShaderTypeAliasSuffix}`
  | `mat3x3${ShaderTypeAliasSuffix}`
  | `mat3x4${ShaderTypeAliasSuffix}`
  | `mat4x2${ShaderTypeAliasSuffix}`
  | `mat4x3${ShaderTypeAliasSuffix}`
  | `mat4x4${ShaderTypeAliasSuffix}`;

/** Shorthand type aliases recognized by WGSL for internal types */
export type VariableShaderTypeAlias = UniformShaderTypeAlias;

/**
 * Info about any ShaderType
 * @note `offset` will be zero until getMemoryOffsets has been called.
 */
// prettier-ignore
export type ShaderTypeInfo =
  | {kind: 'array'; shaderType: ArrayShaderType; elementType: ShaderTypeInfo, elements?: number; byteLength: number; byteOffset: number;}
  | {kind: 'struct'; shaderType: StructShaderType; fields: Record<string, ShaderTypeInfo>; byteLength: number; byteOffset: number;}
  | {kind: 'primitive'; shaderType: VariableShaderType; byteLength: number, byteOffset: number;} & AttributeShaderTypeInfo;

/** Information extracted from a AttributeShaderType constant */
export type AttributeShaderTypeInfo = {
  /** WGSL-style primitive data type, f32, i32, u32 */
  primitiveType: PrimitiveDataType;
  /** Whether this is a normalized integer (that must be used as float) */
  components: 1 | 2 | 3 | 4;
  /** Whether this is for integer or float vert */
  integer: boolean;
  /** Whether this data type is signed */
  signed: boolean;
  /** Size of this */
  byteLength: number;
  /** Memory alignment required by this type */
  byteAlignment: number;
};
