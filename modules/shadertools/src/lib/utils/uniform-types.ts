import type {
  Matrix3,
  Matrix4,
  Vector2,
  Vector3,
  Vector4,
  NumberArray2,
  NumberArray3,
  NumberArray4,
  NumberArray6,
  NumberArray8,
  NumberArray9,
  NumberArray12,
  NumberArray16
} from '@math.gl/core';

import type {CompositeShaderType} from '@luma.gl/core';

/*
 * Allowed types to be used for uniform values
 *
 * Only allow types whose length we can type-check (not `TypedArray`)
 */
export type UniformValue = Readonly<
  | number
  | boolean
  | NumberArray2
  | NumberArray3
  | NumberArray4
  | NumberArray6
  | NumberArray8
  | NumberArray9
  | NumberArray12
  | NumberArray16
  | Vector2
  | Vector3
  | Vector4
  | Matrix3
  | Matrix4
>;

export type ShaderModuleUniformValue =
  | UniformValue
  | ShaderModuleUniformStruct
  | ShaderModuleUniformArray;

export type ShaderModuleUniformStruct = {
  [name: string]: ShaderModuleUniformValue | undefined;
};

export type ShaderModuleUniformArray = ReadonlyArray<ShaderModuleUniformValue | undefined>;

type UniformLeafType<ValueT extends UniformValue> = ValueT extends number | boolean
  ? 'f32' | 'i32' | 'u32'
  : ValueT extends Readonly<NumberArray2 | Vector2>
    ? 'vec2<f32>' | 'vec2<i32>' | 'vec2<u32>'
    : ValueT extends Readonly<NumberArray3 | Vector3>
      ? 'vec3<f32>' | 'vec3<i32>' | 'vec3<u32>'
      : ValueT extends Readonly<NumberArray4 | Vector4>
        ? 'vec4<f32>' | 'vec4<i32>' | 'vec4<u32>' | 'mat2x2<f32>'
        : ValueT extends Readonly<NumberArray6>
          ? 'mat2x3<f32>' | 'mat3x2<f32>'
          : ValueT extends Readonly<NumberArray8>
            ? 'mat2x4<f32>' | 'mat4x2<f32>'
            : ValueT extends Readonly<NumberArray9 | Matrix3>
              ? 'mat3x3<f32>'
              : ValueT extends Readonly<NumberArray12>
                ? 'mat3x4<f32>' | 'mat4x3<f32>'
                : ValueT extends Readonly<NumberArray16 | Matrix4>
                  ? 'mat4x4<f32>'
                  : never;

type UniformType<ValueT> = ValueT extends UniformValue
  ? UniformLeafType<ValueT>
  : ValueT extends ReadonlyArray<infer ElementT>
    ? readonly [UniformType<NonNullable<ElementT>>, number]
    : ValueT extends Record<string, unknown>
      ? {[name in keyof ValueT]-?: UniformType<NonNullable<ValueT[name]>>}
      : never;

type UniformProps = Record<string, unknown>;

export type UniformTypes<PropsT extends UniformProps> = {
  [name in keyof PropsT]-?: UniformType<NonNullable<PropsT[name]>> & CompositeShaderType;
};
