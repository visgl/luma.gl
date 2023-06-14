// luma.gl, MIT license

// MATH TYPES
// TODO - these types could be imported from math.gl

/** TypeScript type covering all typed arrays */
export type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array;

export type BigIntTypedArray = BigInt64Array | BigUint64Array;

/** type covering all typed arrays and classic arrays consisting of numbers */
export type NumberArray = number[] | TypedArray;

export type BigIntOrNumberArray = NumberArray | BigIntTypedArray;

// UNIFORM TYPES 
// These are "duplicated" from API module to avoid cross-dependencies

export type UniformDataType =
  'uint32' |
  'sint32' |
  'float32'
  ;

export type UniformFormat = 
  'f32' |
  'i32' |
  'u32' |
  'vec2<f32>' |
  'vec3<f32>' |
  'vec4<f32>' |
  'vec2<i32>' |
  'vec3<i32>' |
  'vec4<i32>' |
  'vec2<u32>' |
  'vec3<u32>' |
  'vec4<u32>' |
  'mat2x2<f32>' |
  'mat2x3<f32>' |
  'mat2x4<f32>' |
  'mat3x2<f32>' |
  'mat3x3<f32>' |
  'mat3x4<f32>' |
  'mat4x2<f32>' |
  'mat4x3<f32>' |
  'mat4x4<f32>'
  ;
