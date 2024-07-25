import type {Matrix3, Matrix4, Vector2, Vector3, Vector4} from '@math.gl/core';

export type NumArray2 = [number, number];
export type NumArray3 = [number, number, number];
export type NumArray4 = [number, number, number, number];
export type NumArray6 = [number, number, number, number, number, number];
export type NumArray8 = [number, number, number, number, number, number, number, number];
export type NumArray9 = [number, number, number, number, number, number, number, number, number];
export type NumArray12 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];
export type NumArray16 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

/*
 * Allowed types to be used for uniform values
 *
 * Only allow types whose length we can type-check (not `TypedArray`)
 */
export type UniformValue = Readonly<
  | number
  | boolean
  | NumArray2
  | NumArray3
  | NumArray4
  | NumArray6
  | NumArray8
  | NumArray9
  | NumArray12
  | NumArray16
  | Vector2
  | Vector3
  | Vector4
  | Matrix3
  | Matrix4
>;

type UniformType<ValueT extends UniformValue> = ValueT extends number | boolean
  ? 'f32' | 'i32' | 'u32'
  : ValueT extends Readonly<NumArray2 | Vector2>
  ? 'vec2<f32>' | 'vec2<i32>' | 'vec2<u32>'
  : ValueT extends Readonly<NumArray3 | Vector3>
  ? 'vec3<f32>' | 'vec3<i32>' | 'vec3<u32>'
  : ValueT extends Readonly<NumArray4 | Vector4>
  ? 'vec4<f32>' | 'vec4<i32>' | 'vec4<u32>' | 'mat2x2<f32>'
  : ValueT extends Readonly<NumArray6>
  ? 'mat2x3<f32>' | 'mat3x2<f32>'
  : ValueT extends Readonly<NumArray8>
  ? 'mat2x4<f32>' | 'mat4x2<f32>'
  : ValueT extends Readonly<NumArray9 | Matrix3>
  ? 'mat3x3<f32>'
  : ValueT extends Readonly<NumArray12>
  ? 'mat3x4<f32>' | 'mat4x3<f32>'
  : ValueT extends Readonly<NumArray16 | Matrix4>
  ? 'mat4x4<f32>'
  : never;

type UniformProps = {
  [name: string]: UniformValue;
};

export type UniformTypes<PropsT extends UniformProps> = {
  [name in keyof PropsT]: UniformType<PropsT[name]>;
};
