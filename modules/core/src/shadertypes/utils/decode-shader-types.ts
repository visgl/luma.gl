// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {PrimitiveDataType} from '../data-types';
import type {
  ShaderType,
  ShaderTypeAlias,
  ShaderTypeInfo,
  UniformShaderType,
  AttributeShaderType,
  VariableShaderType,
  UniformShaderTypeAlias,
  AttributeShaderTypeAlias,
  AttributeShaderTypeInfo
} from '../shader-types';

/** Recursively decodes any shader type, including structs and arrays */
export function getShaderTypeInfo(shaderTypeOrAlias: ShaderType | ShaderTypeAlias): ShaderTypeInfo {
  const shaderType = resolveShaderTypeAlias(shaderTypeOrAlias);
  if (Array.isArray(shaderType)) {
    return {
      kind: 'array',
      shaderType,
      elementType: getShaderTypeInfo(shaderType[0]),
      elements: shaderType[1],
      byteLength: 0,
      byteOffset: 0
    };
  }
  if (typeof shaderType === 'object') {
    const fields: Record<string, ShaderTypeInfo> = {};
    for (const [fieldName, fieldType] of Object.entries(shaderType)) {
      fields[fieldName] = getShaderTypeInfo(fieldType);
    }
    return {kind: 'struct', shaderType, byteLength: 0, byteOffset: 0, fields};
  }
  const shaderTypeInfo = getAttributeShaderTypeInfo(shaderType as AttributeShaderType);
  return {kind: 'primitive', shaderType, byteOffset: 0, ...shaderTypeInfo};
}

/** Split a uniform type string into type and components */
export function getVariableShaderTypeInfo(format: UniformShaderType): {
  type: PrimitiveDataType;
  components: number;
} {
  const decoded = WGSL_VARIABLE_TYPE_DATA[format];
  return decoded;
}

/** Decodes a vertex type, returning byte length and flags (integer, signed, normalized) */
export function getAttributeShaderTypeInfo(
  attributeType: AttributeShaderType
): AttributeShaderTypeInfo {
  const {type: primitiveType, components, align} = WGSL_VARIABLE_TYPE_DATA[attributeType];
  const integer: boolean = primitiveType === 'i32' || primitiveType === 'u32';
  const signed: boolean = primitiveType !== 'u32';

  const byteLength = PRIMITIVE_TYPE_SIZES[primitiveType] * components;
  return {
    primitiveType,
    components: components as 1 | 2 | 3 | 4,
    integer,
    signed,
    byteLength,
    byteAlignment: align
  };
}

export function resolveShaderTypeAlias(alias: ShaderType | ShaderTypeAlias): ShaderType {
  return WGSL_VARIABLE_TYPE_ALIAS_MAP[alias as ShaderTypeAlias] || alias;
}

export function resolveAttributeShaderTypeAlias(
  alias: AttributeShaderTypeAlias | AttributeShaderType
): AttributeShaderType {
  return WGSL_ATTRIBUTE_TYPE_ALIAS_MAP[alias as AttributeShaderTypeAlias] || alias;
}

export function resolveVariableShaderTypeAlias(
  alias: UniformShaderTypeAlias | UniformShaderType
): UniformShaderType {
  return WGSL_VARIABLE_TYPE_ALIAS_MAP[alias as UniformShaderTypeAlias] || alias;
}

// TABLES

const PRIMITIVE_TYPE_SIZES: Record<PrimitiveDataType, 2 | 4> = {
  f32: 4,
  f16: 2,
  i32: 4,
  u32: 4
  // 'bool-webgl': 4,
};

type VariableTypeData = {
  components: number;
  align: number;
  size: number;
  pad?: [number, number];
  type: PrimitiveDataType;
};

const REUSABLE_TYPE_DATA = {
  i32: {components: 1, align: 4, size: 4, type: 'i32'},
  u32: {components: 1, align: 4, size: 4, type: 'u32'},
  f32: {components: 1, align: 4, size: 4, type: 'f32'},
  f16: {components: 1, align: 2, size: 2, type: 'f16'},

  'vec2<f32>': {components: 2, align: 8, size: 8, type: 'f32'},
  'vec2<i32>': {components: 2, align: 8, size: 8, type: 'i32'},
  'vec2<u32>': {components: 2, align: 8, size: 8, type: 'u32'},
  'vec2<f16>': {components: 2, align: 4, size: 4, type: 'f16'},
  'vec3<i32>': {components: 3, align: 16, size: 12, type: 'i32'},
  'vec3<u32>': {components: 3, align: 16, size: 12, type: 'u32'},
  'vec3<f32>': {components: 3, align: 16, size: 12, type: 'f32'},
  'vec3<f16>': {components: 3, align: 8, size: 6, type: 'f16'},
  'vec4<i32>': {components: 4, align: 16, size: 16, type: 'i32'},
  'vec4<u32>': {components: 4, align: 16, size: 16, type: 'u32'},
  'vec4<f32>': {components: 4, align: 16, size: 16, type: 'f32'},
  'vec4<f16>': {components: 4, align: 8, size: 8, type: 'f16'},

  // AlignOf(vecR)	SizeOf(array<vecR, C>)
  'mat2x2<f32>': {components: 4, align: 8, size: 16, type: 'f32'},
  'mat2x2<f16>': {components: 4, align: 4, size: 8, type: 'f16'},
  'mat3x2<f32>': {components: 6, align: 8, size: 24, type: 'f32'},
  'mat3x2<f16>': {components: 6, align: 4, size: 12, type: 'f16'},
  'mat4x2<f32>': {components: 8, align: 8, size: 32, type: 'f32'},
  'mat4x2<f16>': {components: 8, align: 4, size: 16, type: 'f16'},
  'mat2x3<f32>': {components: 8, align: 16, size: 32, pad: [3, 1], type: 'f32'},
  'mat2x3<f16>': {components: 8, align: 8, size: 16, pad: [3, 1], type: 'f16'},
  'mat3x3<f32>': {components: 12, align: 16, size: 48, pad: [3, 1], type: 'f32'},
  'mat3x3<f16>': {components: 12, align: 8, size: 24, pad: [3, 1], type: 'f16'},
  'mat4x3<f32>': {components: 16, align: 16, size: 64, pad: [3, 1], type: 'f32'},
  'mat4x3<f16>': {components: 16, align: 8, size: 32, pad: [3, 1], type: 'f16'},
  'mat2x4<f32>': {components: 8, align: 16, size: 32, type: 'f32'},
  'mat2x4<f16>': {components: 8, align: 8, size: 16, type: 'f16'},
  'mat3x4<f32>': {components: 12, align: 16, size: 48, pad: [3, 1], type: 'f32'},
  'mat3x4<f16>': {components: 12, align: 8, size: 24, pad: [3, 1], type: 'f16'},
  'mat4x4<f32>': {components: 16, align: 16, size: 64, type: 'f32'},
  'mat4x4<f16>': {components: 16, align: 8, size: 32, type: 'f16'}
} as const satisfies Partial<Record<VariableShaderType, VariableTypeData>>;

const t = REUSABLE_TYPE_DATA;

/** @todo These tables are quite big, consider parsing type strings instead */
const WGSL_VARIABLE_TYPE_DATA: Record<VariableShaderType, Readonly<VariableTypeData>> = {
  ...REUSABLE_TYPE_DATA,

  'atomic<i32>': t.i32,
  'atomic<u32>': t.u32,

  // Note: As of WGSL V1 you can not declare a bool for uniform or storage.
  // You can only create one in an "internal" struct.
  bool: {components: 0, align: 1, size: 0, type: 'i32'}, // 'bool'},

  'vec2<i32>': t['vec2<i32>'],
  'vec2<u32>': t['vec2<u32>'],
  'vec2<f32>': t['vec2<f32>'],
  'vec2<f16>': t['vec2<f16>'],
  'vec3<i32>': t['vec3<i32>'],
  'vec3<u32>': t['vec3<u32>'],
  'vec3<f32>': t['vec3<f32>'],
  'vec3<f16>': t['vec3<f16>'],
  'vec4<i32>': t['vec4<i32>'],
  'vec4<u32>': t['vec4<u32>'],
  'vec4<f32>': t['vec4<f32>'],
  'vec4<f16>': t['vec4<f16>'],

  'mat2x2<f32>': t['mat2x2<f32>'],
  'mat2x2<f16>': t['mat2x2<f16>'],
  'mat3x2<f32>': t['mat3x2<f32>'],
  'mat3x2<f16>': t['mat3x2<f16>'],
  'mat4x2<f32>': t['mat4x2<f32>'],
  'mat4x2<f16>': t['mat4x2<f16>'],
  'mat2x3<f32>': t['mat2x3<f32>'],
  'mat2x3<f16>': t['mat2x3<f16>'],
  'mat3x3<f32>': t['mat3x3<f32>'],
  'mat3x3<f16>': t['mat3x3<f16>'],
  'mat4x3<f32>': t['mat4x3<f32>'],
  'mat4x3<f16>': t['mat4x3<f16>'],
  'mat2x4<f32>': t['mat2x4<f32>'],
  'mat2x4<f16>': t['mat2x4<f16>'],
  'mat3x4<f32>': t['mat3x4<f32>'],
  'mat3x4<f16>': t['mat3x4<f16>'],
  'mat4x4<f32>': t['mat4x4<f32>'],
  'mat4x4<f16>': t['mat4x4<f16>'],

  'mat2x2<i32>': t['mat2x2<f32>'],
  'mat2x3<i32>': t['mat2x3<f32>'],
  'mat2x4<i32>': t['mat2x4<f32>'],
  'mat3x2<i32>': t['mat3x2<f32>'],
  'mat3x3<i32>': t['mat3x3<f32>'],
  'mat3x4<i32>': t['mat3x4<f32>'],
  'mat4x2<i32>': t['mat4x2<f32>'],
  'mat4x3<i32>': t['mat4x3<f32>'],
  'mat4x4<i32>': t['mat4x4<f32>'],

  'mat2x2<u32>': t['mat2x2<f32>'],
  'mat2x3<u32>': t['mat2x3<f32>'],
  'mat2x4<u32>': t['mat2x4<f32>'],
  'mat3x2<u32>': t['mat3x2<f32>'],
  'mat3x3<u32>': t['mat3x3<f32>'],
  'mat3x4<u32>': t['mat3x4<f32>'],
  'mat4x2<u32>': t['mat4x2<f32>'],
  'mat4x3<u32>': t['mat4x3<f32>'],
  'mat4x4<u32>': t['mat4x4<f32>']
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
export const WGSL_VARIABLE_TYPE_ALIAS_MAP: Record<UniformShaderTypeAlias, UniformShaderType> = {
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
