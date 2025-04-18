// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {PrimitiveDataType} from './data-types';
import type {
  VariableShaderType,
  AttributeShaderType,
  AttributeShaderTypeInfo,
  VariableShaderTypeAlias,
  AttributeShaderTypeAlias
} from './shader-types';

/** Split a uniform type string into type and components */
export function getVariableShaderTypeInfo(format: VariableShaderType): {
  type: PrimitiveDataType;
  components: number;
} {
  const decoded = UNIFORM_FORMATS[format];
  return decoded;
}

/** Decodes a vertex type, returning byte length and flags (integer, signed, normalized) */
export function getAttributeShaderTypeInfo(
  attributeType: AttributeShaderType
): AttributeShaderTypeInfo {
  const [primitiveType, components] = TYPE_INFO[attributeType];
  const integer: boolean = primitiveType === 'i32' || primitiveType === 'u32';
  const signed: boolean = primitiveType !== 'u32';

  const byteLength = PRIMITIVE_TYPE_SIZES[primitiveType] * components;
  return {
    primitiveType,
    components,
    byteLength,
    integer,
    signed
  };
}

export function makeShaderAttributeType(
  primitiveType: PrimitiveDataType,
  components: 1 | 2 | 3 | 4
): AttributeShaderType {
  return components === 1 ? primitiveType : `vec${components}<${primitiveType}>`;
}

export function resolveAttributeShaderTypeAlias(
  alias: AttributeShaderTypeAlias | AttributeShaderType
): AttributeShaderType {
  return WGSL_ATTRIBUTE_TYPE_ALIAS_MAP[alias as AttributeShaderTypeAlias] || alias;
}

export function resolveVariableShaderTypeAlias(
  alias: VariableShaderTypeAlias | VariableShaderType
): VariableShaderType {
  return WGSL_VARIABLE_TYPE_ALIAS_MAP[alias as VariableShaderTypeAlias] || alias;
}

// TABLES

const PRIMITIVE_TYPE_SIZES: Record<PrimitiveDataType, 2 | 4> = {
  f32: 4,
  f16: 2,
  i32: 4,
  u32: 4
  // 'bool-webgl': 4,
};

/** All valid shader attribute types. A table guarantees exhaustive list and fast execution */
const TYPE_INFO: Record<AttributeShaderType, [PrimitiveDataType, components: 1 | 2 | 3 | 4]> = {
  f32: ['f32', 1],
  'vec2<f32>': ['f32', 2],
  'vec3<f32>': ['f32', 3],
  'vec4<f32>': ['f32', 4],
  f16: ['f16', 1],
  'vec2<f16>': ['f16', 2],
  'vec3<f16>': ['f16', 3],
  'vec4<f16>': ['f16', 4],
  i32: ['i32', 1],
  'vec2<i32>': ['i32', 2],
  'vec3<i32>': ['i32', 3],
  'vec4<i32>': ['i32', 4],
  u32: ['u32', 1],
  'vec2<u32>': ['u32', 2],
  'vec3<u32>': ['u32', 3],
  'vec4<u32>': ['u32', 4]
};

/** @todo These tables are quite big, consider parsing type strings instead */
const UNIFORM_FORMATS: Record<VariableShaderType, {type: PrimitiveDataType; components: number}> = {
  f32: {type: 'f32', components: 1},
  f16: {type: 'f16', components: 1},
  i32: {type: 'i32', components: 1},
  u32: {type: 'u32', components: 1},
  // 'bool-webgl': {type: 'bool-webgl', components: 1},
  'vec2<f32>': {type: 'f32', components: 2},
  'vec3<f32>': {type: 'f32', components: 3},
  'vec4<f32>': {type: 'f32', components: 4},
  'vec2<f16>': {type: 'f16', components: 2},
  'vec3<f16>': {type: 'f16', components: 3},
  'vec4<f16>': {type: 'f16', components: 4},
  'vec2<i32>': {type: 'i32', components: 2},
  'vec3<i32>': {type: 'i32', components: 3},
  'vec4<i32>': {type: 'i32', components: 4},
  'vec2<u32>': {type: 'u32', components: 2},
  'vec3<u32>': {type: 'u32', components: 3},
  'vec4<u32>': {type: 'u32', components: 4},

  'mat2x2<f32>': {type: 'f32', components: 4},
  'mat2x3<f32>': {type: 'f32', components: 6},
  'mat2x4<f32>': {type: 'f32', components: 8},
  'mat3x2<f32>': {type: 'f32', components: 6},
  'mat3x3<f32>': {type: 'f32', components: 9},
  'mat3x4<f32>': {type: 'f32', components: 12},
  'mat4x2<f32>': {type: 'f32', components: 8},
  'mat4x3<f32>': {type: 'f32', components: 12},
  'mat4x4<f32>': {type: 'f32', components: 16},

  'mat2x2<f16>': {type: 'f16', components: 4},
  'mat2x3<f16>': {type: 'f16', components: 6},
  'mat2x4<f16>': {type: 'f16', components: 8},
  'mat3x2<f16>': {type: 'f16', components: 6},
  'mat3x3<f16>': {type: 'f16', components: 9},
  'mat3x4<f16>': {type: 'f16', components: 12},
  'mat4x2<f16>': {type: 'f16', components: 8},
  'mat4x3<f16>': {type: 'f16', components: 12},
  'mat4x4<f16>': {type: 'f16', components: 16},

  'mat2x2<i32>': {type: 'i32', components: 4},
  'mat2x3<i32>': {type: 'i32', components: 6},
  'mat2x4<i32>': {type: 'i32', components: 8},
  'mat3x2<i32>': {type: 'i32', components: 6},
  'mat3x3<i32>': {type: 'i32', components: 9},
  'mat3x4<i32>': {type: 'i32', components: 12},
  'mat4x2<i32>': {type: 'i32', components: 8},
  'mat4x3<i32>': {type: 'i32', components: 12},
  'mat4x4<i32>': {type: 'i32', components: 16},

  'mat2x2<u32>': {type: 'u32', components: 4},
  'mat2x3<u32>': {type: 'u32', components: 6},
  'mat2x4<u32>': {type: 'u32', components: 8},
  'mat3x2<u32>': {type: 'u32', components: 6},
  'mat3x3<u32>': {type: 'u32', components: 9},
  'mat3x4<u32>': {type: 'u32', components: 12},
  'mat4x2<u32>': {type: 'u32', components: 8},
  'mat4x3<u32>': {type: 'u32', components: 12},
  'mat4x4<u32>': {type: 'u32', components: 16}
};

/**  Predeclared aliases @see https://www.w3.org/TR/WGSL/#vector-types */
export const WGSL_ATTRIBUTE_TYPE_ALIAS_MAP: Record<AttributeShaderTypeAlias, AttributeShaderType> =
  {
    vec2i: 'vec2<i32>',
    vec3i: 'vec3<i32>',
    vec4i: 'vec4<i32>',
    vec2u: 'vec2<u32>',
    vec3u: 'vec3<u32>',
    vec4u: 'vec4<u32>',
    vec2f: 'vec2<f32>',
    vec3f: 'vec3<f32>',
    vec4f: 'vec4<f32>',
    // Requires the f16 extension.
    vec2h: 'vec2<f16>',
    vec3h: 'vec3<f16>',
    vec4h: 'vec4<f16>'
  };

/** @todo These tables are quite big, consider parsing alias strings instead */
export const WGSL_VARIABLE_TYPE_ALIAS_MAP: Record<VariableShaderTypeAlias, VariableShaderType> = {
  ...WGSL_ATTRIBUTE_TYPE_ALIAS_MAP,
  mat2x2f: 'mat2x2<f32>',
  mat2x3f: 'mat2x3<f32>',
  mat2x4f: 'mat2x4<f32>',
  mat3x2f: 'mat3x2<f32>',
  mat3x3f: 'mat3x3<f32>',
  mat3x4f: 'mat3x4<f32>',
  mat4x2f: 'mat4x2<f32>',
  mat4x3f: 'mat4x3<f32>',
  mat4x4f: 'mat4x4<f32>',

  mat2x2i: 'mat2x2<i32>',
  mat2x3i: 'mat2x3<i32>',
  mat2x4i: 'mat2x4<i32>',
  mat3x2i: 'mat3x2<i32>',
  mat3x3i: 'mat3x3<i32>',
  mat3x4i: 'mat3x4<i32>',
  mat4x2i: 'mat4x2<i32>',
  mat4x3i: 'mat4x3<i32>',
  mat4x4i: 'mat4x4<i32>',

  mat2x2u: 'mat2x2<u32>',
  mat2x3u: 'mat2x3<u32>',
  mat2x4u: 'mat2x4<u32>',
  mat3x2u: 'mat3x2<u32>',
  mat3x3u: 'mat3x3<u32>',
  mat3x4u: 'mat3x4<u32>',
  mat4x2u: 'mat4x2<u32>',
  mat4x3u: 'mat4x3<u32>',
  mat4x4u: 'mat4x4<u32>',

  mat2x2h: 'mat2x2<f16>',
  mat2x3h: 'mat2x3<f16>',
  mat2x4h: 'mat2x4<f16>',
  mat3x2h: 'mat3x2<f16>',
  mat3x3h: 'mat3x3<f16>',
  mat3x4h: 'mat3x4<f16>',
  mat4x2h: 'mat4x2<f16>',
  mat4x3h: 'mat4x3<f16>',
  mat4x4h: 'mat4x4<f16>'
};
