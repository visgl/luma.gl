// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type AttributeShaderTypeT, type VariableShaderTypeT} from '@luma.gl/core';

/**
 * Helper type to check if two types are equal
 * @type Explicit false Return: If the types do not match, the type explicitly resolves to false instead of never.
 * @note Wrapped in Tuples: By wrapping T and Expected in tuples ([T] and [Expected]), we avoid TypeScript's distributive conditional type behavior, which can lead to never in some cases.
 * @note type AssertEqual<T, Expected> = T extends Expected ? (Expected extends T ? true : false) : false;
 */
export type AssertEqual<T, Expected> = [T] extends [Expected]
  ? [Expected] extends [T]
    ? true
    : false
  : false;

export type AssertNotEqual<T, Expected> = [T] extends [Expected]
  ? [Expected] extends [T]
    ? false
    : true
  : true;

// Test cases for alias types
type AttributeShaderTypeTests = {
  // Test that aliases are mapped to the correct types
  vec2f: AssertEqual<AttributeShaderTypeT<'vec2f'>, 'vec2<f32>'>;
  vec3i: AssertEqual<AttributeShaderTypeT<'vec3i'>, 'vec3<i32>'>;
  vec4u: AssertEqual<AttributeShaderTypeT<'vec4u'>, 'vec4<u32>'>;
  vec2h: AssertEqual<AttributeShaderTypeT<'vec2h'>, 'vec2<f16>'>;
  mat2x2f: AssertEqual<AttributeShaderTypeT<'mat2x2f'>, 'mat2x2<f32>'>;
  mat3x3f: AssertEqual<AttributeShaderTypeT<'mat3x3f'>, 'mat3x3<i32>'>;
  mat4x4f: AssertEqual<AttributeShaderTypeT<'mat4x4f'>, 'mat4x4<u32>'>;

  // Test that qualified types
  // Test cases for fully qualified types are preserved
  vec2: AssertEqual<AttributeShaderTypeT<'vec2<f32>'>, 'vec2<f32>'>;
  vec3: AssertEqual<AttributeShaderTypeT<'vec3<i32>'>, 'vec3<i32>'>;
  vec4: AssertEqual<AttributeShaderTypeT<'vec4<u32>'>, 'vec4<u32>'>;
  mat2x2: AssertEqual<AttributeShaderTypeT<'mat2x2<f32>'>, 'mat2x2<f32>'>;
  mat3x3: AssertEqual<AttributeShaderTypeT<'mat3x3<i32>'>, 'mat3x3<i32>'>;
  mat4x4: AssertEqual<AttributeShaderTypeT<'mat4x4<u32>'>, 'mat4x4<u32>'>;

  // Test cases for invalid types
  // @ts-expect-error test: should generate a type error
  vec5f: AssertEqual<AttributeShaderTypeT<'vec5f'>, never>;
  // @ts-expect-error test: should generate a type error
  vec2unkown: AssertEqual<AttributeShaderTypeT<'vec2<unknown>'>, never>;
};

// Assertions
export const attributeShaderTypeTests: AttributeShaderTypeTests = {
  vec2f: true,
  vec3i: true,
  vec4u: true,
  vec2h: true,
  mat2x2f: true,
  mat3x3f: true,
  mat4x4f: true,

  // @ts-expect-error test: should generate a type error
  vec5f: false,
  // @ts-expect-error test: should generate a type error
  vec2unkown: false
};

type VariableShaderTypeTests = {
  // Test that aliases are mapped to the correct types
  vec2f: AssertEqual<VariableShaderTypeT<'vec2f'>, 'vec2<f32>'>;
  vec3i: AssertEqual<VariableShaderTypeT<'vec3i'>, 'vec3<i32>'>;
  vec4u: AssertEqual<VariableShaderTypeT<'vec4u'>, 'vec4<u32>'>;
  vec2h: AssertEqual<VariableShaderTypeT<'vec2h'>, 'vec2<f16>'>;
  mat2x2f: AssertEqual<VariableShaderTypeT<'mat2x2f'>, 'mat2x2<f32>'>;
  mat3x3f: AssertEqual<VariableShaderTypeT<'mat3x3f'>, 'mat3x3<i32>'>;
  mat4x4f: AssertEqual<VariableShaderTypeT<'mat4x4f'>, 'mat4x4<u32>'>;

  // Test that qualified types
  // Test cases for fully qualified types are preserved
  vec2: AssertEqual<VariableShaderTypeT<'vec2<f32>'>, 'vec2<f32>'>;
  vec3: AssertEqual<VariableShaderTypeT<'vec3<i32>'>, 'vec3<i32>'>;
  vec4: AssertEqual<VariableShaderTypeT<'vec4<u32>'>, 'vec4<u32>'>;
  mat2x2: AssertEqual<VariableShaderTypeT<'mat2x2<f32>'>, 'mat2x2<f32>'>;
  mat3x3: AssertEqual<VariableShaderTypeT<'mat3x3<i32>'>, 'mat3x3<i32>'>;
  mat4x4: AssertEqual<VariableShaderTypeT<'mat4x4<u32>'>, 'mat4x4<u32>'>;

  // Test cases for invalid types
  // @ts-expect-error test: should generate a type error
  vec5f: AssertEqual<VariableShaderTypeT<'vec5f'>, never>;
  // @ts-expect-error test: should generate a type error
  vec2unkown: AssertEqual<VariableShaderTypeT<'vec2<unknown>'>, never>;
};

export const variableShaderTypeTests: VariableShaderTypeTests = {
  vec2f: true,
  vec3i: true,
  vec4u: true,
  vec2h: true,
  mat2x2f: true,
  mat3x3f: true,
  mat4x4f: true,

  // @ts-expect-error test: should generate a type error
  vec5f: false,
  // @ts-expect-error test: should generate a type error
  vec2unkown: false
};
