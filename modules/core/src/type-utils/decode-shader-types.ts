// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderUniformType, ShaderDataType} from './shader-types';

const UNIFORM_FORMATS: Record<ShaderUniformType, {type: ShaderDataType; components: number}> = {
  f32: {type: 'f32', components: 1},
  i32: {type: 'i32', components: 1},
  u32: {type: 'u32', components: 1},
  // 'bool-webgl': {type: 'bool-webgl', components: 1},
  'vec2<f32>': {type: 'f32', components: 2},
  'vec3<f32>': {type: 'f32', components: 3},
  'vec4<f32>': {type: 'f32', components: 4},
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
  'mat4x4<f32>': {type: 'f32', components: 16}
};

/** Split a uniform type string into type and components */
export function decodeShaderUniformType(format: ShaderUniformType): {
  type: ShaderDataType;
  components: number;
} {
  const decoded = UNIFORM_FORMATS[format];
  return decoded;
}

/** Align offset to 1, 2 or 4 elements (4, 8 or 16 bytes) */
export function alignTo(size: number, count: number): number {
  // prettier-ignore
  switch (count) {
    case 1: return size; // Pad upwards to even multiple of 2
    case 2: return size + (size % 2); // Pad upwards to even multiple of 2
    default: return size + ((4 - (size % 4)) % 4); // Pad upwards to even multiple of 4
  }
}
