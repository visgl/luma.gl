// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PrimitiveDataType} from './data-types';

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
 * Describes the type of a variable that can declared in shader source code.
 * @note Uniforms can be declared using these types
 * @note Uniforms can be of a wider range of types than attributes.
 * @note to WebGL users: "bindings" (textures, samplers, and uniform buffers) are considered "bindings", not shader variables/uniforms
 */
export type VariableShaderType =
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

/* Suffixes used by WGSL alias types */
type ShaderTypeAliasSuffix = 'f' | 'i' | 'u' | 'h';

/** Shorthand type aliases recognized by WGSL */
export type AttributeShaderTypeAlias =
  | `vec2${ShaderTypeAliasSuffix}`
  | `vec3${ShaderTypeAliasSuffix}`
  | `vec4${ShaderTypeAliasSuffix}`;

/** Shorthand type aliases recognized by WGSL */
export type VariableShaderTypeAlias =
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

/** A composite shader type can include structs and arrays, recursively */
export type CompositeShaderType = VariableShaderType | StructShaderType | ArrayShaderType;

/** Represents a struct in WGSL */
export type StructShaderType = {
  members: Record<string, CompositeShaderType>;
};

/** Represents an array in WGSL */
export type ArrayShaderType = {
  type: CompositeShaderType;
  length: number;
};

/** Information extracted from a AttributeShaderType constant */
export type AttributeShaderTypeInfo = {
  /** WGSL-style primitive data type, f32, i32, u32 */
  primitiveType: PrimitiveDataType;
  /** Whether this is a normalized integer (that must be used as float) */
  components: 1 | 2 | 3 | 4;
  /** Length in bytes of the data for one vertex */
  byteLength?: number;
  /** Whether this is for integer or float vert */
  integer: boolean;
  /** Whether this data type is signed */
  signed: boolean;
};
