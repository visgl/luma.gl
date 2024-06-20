// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// MATH TYPES
export {TypedArray, NumberArray, NumericArray} from '@math.gl/types';

// export type BigIntOrNumberArray = NumberArray | BigIntTypedArray;

// UNIFORM TYPES
// These are "duplicated" from core module to avoid cross-dependencies

export type UniformDataType = 'uint32' | 'sint32' | 'float32';

export type UniformFormat =
  | 'f32'
  | 'i32'
  | 'u32'
  | 'vec2<f32>'
  | 'vec3<f32>'
  | 'vec4<f32>'
  | 'vec2<i32>'
  | 'vec3<i32>'
  | 'vec4<i32>'
  | 'vec2<u32>'
  | 'vec3<u32>'
  | 'vec4<u32>'
  | 'mat2x2<f32>'
  | 'mat2x3<f32>'
  | 'mat2x4<f32>'
  | 'mat3x2<f32>'
  | 'mat3x3<f32>'
  | 'mat3x4<f32>'
  | 'mat4x2<f32>'
  | 'mat4x3<f32>'
  | 'mat4x4<f32>';
