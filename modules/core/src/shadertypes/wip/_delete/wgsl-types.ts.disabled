import {
    keysOf,
} from './utils.js';
import {
    TypedArrayConstructor,
} from './typed-arrays.js';

export type TypeDef = {
    numElements: number;
    align: number;
    size: number;
    type: string;
    View: TypedArrayConstructor;
    flatten?: boolean,
    pad?: readonly number[];
};

const createTypeDefs = <T extends Record<string, TypeDef>>(defs: T): { readonly [K in keyof T]: TypeDef } => defs;

const b = createTypeDefs({
  i32: { numElements: 1, align: 4, size: 4, type: 'i32', View: Int32Array },
  u32: { numElements: 1, align: 4, size: 4, type: 'u32', View: Uint32Array },
  f32: { numElements: 1, align: 4, size: 4, type: 'f32', View: Float32Array },
  f16: { numElements: 1, align: 2, size: 2, type: 'u16', View: Uint16Array },

  vec2f: { numElements: 2, align:  8, size:  8, type: 'f32', View: Float32Array },
  vec2i: { numElements: 2, align:  8, size:  8, type: 'i32', View: Int32Array },
  vec2u: { numElements: 2, align:  8, size:  8, type: 'u32', View: Uint32Array },
  vec2h: { numElements: 2, align:  4, size:  4, type: 'u16', View: Uint16Array },
  vec3i: { numElements: 3, align: 16, size: 12, type: 'i32', View: Int32Array },
  vec3u: { numElements: 3, align: 16, size: 12, type: 'u32', View: Uint32Array },
  vec3f: { numElements: 3, align: 16, size: 12, type: 'f32', View: Float32Array },
  vec3h: { numElements: 3, align:  8, size:  6, type: 'u16', View: Uint16Array },
  vec4i: { numElements: 4, align: 16, size: 16, type: 'i32', View: Int32Array },
  vec4u: { numElements: 4, align: 16, size: 16, type: 'u32', View: Uint32Array },
  vec4f: { numElements: 4, align: 16, size: 16, type: 'f32', View: Float32Array },
  vec4h: { numElements: 4, align:  8, size:  8, type: 'u16', View: Uint16Array },

  // AlignOf(vecR)	SizeOf(array<vecR, C>)
  mat2x2f: { numElements:  4, align:  8, size: 16,              type: 'f32', View: Float32Array },
  mat2x2h: { numElements:  4, align:  4, size:  8,              type: 'u16', View: Uint16Array },
  mat3x2f: { numElements:  6, align:  8, size: 24,              type: 'f32', View: Float32Array },
  mat3x2h: { numElements:  6, align:  4, size: 12,              type: 'u16', View: Uint16Array },
  mat4x2f: { numElements:  8, align:  8, size: 32,              type: 'f32', View: Float32Array },
  mat4x2h: { numElements:  8, align:  4, size: 16,              type: 'u16', View: Uint16Array },
  mat2x3f: { numElements:  8, align: 16, size: 32, pad: [3, 1], type: 'f32', View: Float32Array },
  mat2x3h: { numElements:  8, align:  8, size: 16, pad: [3, 1], type: 'u16', View: Uint16Array },
  mat3x3f: { numElements: 12, align: 16, size: 48, pad: [3, 1], type: 'f32', View: Float32Array },
  mat3x3h: { numElements: 12, align:  8, size: 24, pad: [3, 1], type: 'u16', View: Uint16Array },
  mat4x3f: { numElements: 16, align: 16, size: 64, pad: [3, 1], type: 'f32', View: Float32Array },
  mat4x3h: { numElements: 16, align:  8, size: 32, pad: [3, 1], type: 'u16', View: Uint16Array },
  mat2x4f: { numElements:  8, align: 16, size: 32,              type: 'f32', View: Float32Array },
  mat2x4h: { numElements:  8, align:  8, size: 16,              type: 'u16', View: Uint16Array },
  mat3x4f: { numElements: 12, align: 16, size: 48, pad: [3, 1], type: 'f32', View: Float32Array },
  mat3x4h: { numElements: 12, align:  8, size: 24, pad: [3, 1], type: 'u16', View: Uint16Array },
  mat4x4f: { numElements: 16, align: 16, size: 64,              type: 'f32', View: Float32Array },
  mat4x4h: { numElements: 16, align:  8, size: 32,              type: 'u16', View: Uint16Array },

  // Note: At least as of WGSL V1 you can not create a bool for uniform or storage.
  // You can only create one in an internal struct. But, this code generates
  // views of structs and it needs to not fail if the struct has a bool
  bool: { numElements: 0, align: 1, size: 0, type: 'bool', View: Uint32Array },
} as const);

export const kWGSLTypeInfo = createTypeDefs({
  ...b,

  'atomic<i32>': b.i32,
  'atomic<u32>': b.u32,

  'vec2<i32>': b.vec2i,
  'vec2<u32>': b.vec2u,
  'vec2<f32>': b.vec2f,
  'vec2<f16>': b.vec2h,
  'vec3<i32>': b.vec3i,
  'vec3<u32>': b.vec3u,
  'vec3<f32>': b.vec3f,
  'vec3<f16>': b.vec3h,
  'vec4<i32>': b.vec4i,
  'vec4<u32>': b.vec4u,
  'vec4<f32>': b.vec4f,
  'vec4<f16>': b.vec4h,

  'mat2x2<f32>': b.mat2x2f,
  'mat2x2<f16>': b.mat2x2h,
  'mat3x2<f32>': b.mat3x2f,
  'mat3x2<f16>': b.mat3x2h,
  'mat4x2<f32>': b.mat4x2f,
  'mat4x2<f16>': b.mat4x2h,
  'mat2x3<f32>': b.mat2x3f,
  'mat2x3<f16>': b.mat2x3h,
  'mat3x3<f32>': b.mat3x3f,
  'mat3x3<f16>': b.mat3x3h,
  'mat4x3<f32>': b.mat4x3f,
  'mat4x3<f16>': b.mat4x3h,
  'mat2x4<f32>': b.mat2x4f,
  'mat2x4<f16>': b.mat2x4h,
  'mat3x4<f32>': b.mat3x4f,
  'mat3x4<f16>': b.mat3x4h,
  'mat4x4<f32>': b.mat4x4f,
  'mat4x4<f16>': b.mat4x4h,
} as const);
export type WGSLType = keyof typeof kWGSLTypeInfo;
export const kWGSLTypes: readonly WGSLType[] = keysOf(kWGSLTypeInfo);
