// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PrimitiveDataType} from '../data-types/data-types';

/**
 * @type the type of an attribute as defined in the shader source code.
 * @note This is a subset of shader variable types
 * @note Buffers with various `VertexFormat`s can be supplied for each type, GPU will convert them at runtime/
 */
export type AttributeShaderType =
  | 'i32'
  | 'u32'
  | 'f32'
  | 'f16'
  | `vec2<${PrimitiveDataType}>`
  | `vec3<${PrimitiveDataType}>`
  | `vec4<${PrimitiveDataType}>`;

/**
 * @type Describes the type of a variable that can declared in shader source code.
 * @note Uniforms can be declared using these types
 * @note Uniforms can be of a wider range of types than attributes.
 * @note to WebGL users: "bindings" (textures, samplers, and uniform buffers) are considered "bindings", not shader variables/uniforms
 */
export type VariableShaderType =
  | 'i32'
  | 'u32'
  | 'f32'
  | 'f16'
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

/** @type A composite shader type can include structs and arrays, recursively */
export type CompositeShaderType = VariableShaderType | StructShaderType | ArrayShaderType;

/** @type Represents a struct in WGSL */
export type StructShaderType = {
  members: Record<string, CompositeShaderType>;
};

/** @type Represents an array in WGSL */
export type ArrayShaderType = {
  type: CompositeShaderType;
  length: number;
};

// Alias types

/** @type Shorthand type aliases recognized by WGSL */
export type AttributeShaderTypeAlias = keyof AttributeShaderTypeAliasMap;

/** @note work around for lack of type narrowing in conditional generics */
// prettier-ignore
type AttributeShaderTypeAliasMap = {
  vec2f: 'vec2<f32>';
  vec3f: 'vec3<f32>';
  vec4f: 'vec4<f32>';
  vec2i: 'vec2<i32>';
  vec3i: 'vec3<i32>';
  vec4i: 'vec4<i32>';
  vec2u: 'vec2<u32>';
  vec3u: 'vec3<u32>';
  vec4u: 'vec4<u32>';
  vec2h: 'vec2<f16>';
  vec3h: 'vec3<f16>';
  vec4h: 'vec4<f16>';
};

/** @type Shorthand type aliases recognized by WGSL */
export type VariableShaderTypeAlias = keyof VariableShaderTypeAliasMap;

/** @note work around for lack of type narrowing in conditional generics */
// prettier-ignore
type VariableShaderTypeAliasMap = {
  // Vector aliases
  vec2f: 'vec2<f32>';
  vec3f: 'vec3<f32>';
  vec4f: 'vec4<f32>';
  vec2i: 'vec2<i32>';
  vec3i: 'vec3<i32>';
  vec4i: 'vec4<i32>';
  vec2u: 'vec2<u32>';
  vec3u: 'vec3<u32>';
  vec4u: 'vec4<u32>';
  vec2h: 'vec2<f16>';
  vec3h: 'vec3<f16>';
  vec4h: 'vec4<f16>';

  // Matrix aliases
  mat2x2f: 'mat2x2<f32>';
  mat2x3f: 'mat2x3<f32>';
  mat2x4f: 'mat2x4<f32>';
  mat3x2f: 'mat3x2<f32>';
  mat3x3f: 'mat3x3<f32>';
  mat3x4f: 'mat3x4<f32>';
  mat4x2f: 'mat4x2<f32>';
  mat4x3f: 'mat4x3<f32>';
  mat4x4f: 'mat4x4<f32>';

  mat2x2i: 'mat2x2<i32>';
  mat2x3i: 'mat2x3<i32>';
  mat2x4i: 'mat2x4<i32>';
  mat3x2i: 'mat3x2<i32>';
  mat3x3i: 'mat3x3<i32>';
  mat3x4i: 'mat3x4<i32>';
  mat4x2i: 'mat4x2<i32>';
  mat4x3i: 'mat4x3<i32>';
  mat4x4i: 'mat4x4<i32>';

  mat2x2u: 'mat2x2<u32>';
  mat2x3u: 'mat2x3<u32>';
  mat2x4u: 'mat2x4<u32>';
  mat3x2u: 'mat3x2<u32>';
  mat3x3u: 'mat3x3<u32>';
  mat3x4u: 'mat3x4<u32>';
  mat4x2u: 'mat4x2<u32>';
  mat4x3u: 'mat4x3<u32>';
  mat4x4u: 'mat4x4<u32>';

  mat2x2h: 'mat2x2<f16>';
  mat2x3h: 'mat2x3<f16>';
  mat2x4h: 'mat2x4<f16>';
  mat3x2h: 'mat3x2<f16>';
  mat3x3h: 'mat3x3<f16>';
  mat3x4h: 'mat3x4<f16>';
  mat4x2h: 'mat4x2<f16>';
  mat4x3h: 'mat4x3<f16>';
  mat4x4h: 'mat4x4<f16>';
};

// GENERICS

/** @type The unaliased type */
export type AttributeShaderTypeT<T extends AttributeShaderTypeAlias | AttributeShaderType> =
  T extends AttributeShaderTypeAlias ? AttributeShaderTypeAliasMap[T] : T;

/** @type The unaliased type */
export type VariableShaderTypeT<T extends VariableShaderType | keyof VariableShaderTypeAliasMap> =
  T extends VariableShaderTypeAlias ? VariableShaderTypeAliasMap[T] : T;

// HELPER TYPES

// prettier-ignore
type TypeOfAliasSuffix<T extends string> =
  T extends 'f' ? 'f32' :
  T extends 'i' ? 'i32' :
  T extends 'u' ? 'u32' :
  T extends 'h' ? 'f16' :
  never;

// prettier-ignore
export type AttributeShaderTypeAliasT<T extends AttributeShaderTypeAlias> =
  T extends `vec2${infer S}` ? `vec2<${TypeOfAliasSuffix<S>}>` :
  T extends `vec3${infer S}` ? `vec3<${TypeOfAliasSuffix<S>}>` :
  T extends `vec4${infer S}` ? `vec4<${TypeOfAliasSuffix<S>}>` :
  never;

// prettier-ignore
export type VariableShaderTypeAliasT<T extends VariableShaderTypeAlias> =
  T extends `vec2${infer S}` ? `vec2<${TypeOfAliasSuffix<S>}>` :
  T extends `vec3${infer S}` ? `vec3<${TypeOfAliasSuffix<S>}>` :
  T extends `vec4${infer S}` ? `vec4<${TypeOfAliasSuffix<S>}>` :
  T extends `mat2x2${infer S}` ? `mat2x2<${TypeOfAliasSuffix<S>}>` :
  T extends `mat2x3${infer S}` ? `mat2x3<${TypeOfAliasSuffix<S>}>` :
  T extends `mat2x4${infer S}` ? `mat2x4<${TypeOfAliasSuffix<S>}>` :
  T extends `mat3x2${infer S}` ? `mat3x2<${TypeOfAliasSuffix<S>}>` :
  T extends `mat3x3${infer S}` ? `mat3x3<${TypeOfAliasSuffix<S>}>` :
  T extends `mat3x4${infer S}` ? `mat3x4<${TypeOfAliasSuffix<S>}>` :
  T extends `mat4x2${infer S}` ? `mat4x2<${TypeOfAliasSuffix<S>}>` :
  T extends `mat4x3${infer S}` ? `mat4x3<${TypeOfAliasSuffix<S>}>` :
  T extends `mat4x4${infer S}` ? `mat4x4<${TypeOfAliasSuffix<S>}>` :
  never;

// : T extends `vec2<${infer S}>`
//   ? `vec2<${S}>`
//   : T extends `vec3<${infer S}>`
//     ? `vec3<${S}>`
//     : T extends `vec4<${infer S}>`
//       ? `vec4<${S}>`
//       : T extends `mat2x2<${infer S}>`
//         ? `mat2x2<${S}>`
//         : T extends `mat2x3<${infer S}>`
//           ? `mat2x3<${S}>`
//           : T extends `mat2x4<${infer S}>`
//             ? `mat2x4<${S}>`
//             : T extends `mat3x2<${infer S}>`
//               ? `mat3x2<${S}>`
//               : T extends `mat3x3<${infer S}>`
//                 ? `mat3x3<${S}>`
//                 : T extends `mat3x4<${infer S}>`
//                   ? `mat3x4<${S}>`
//                   : T extends `mat4x2<${infer S}>`
//                     ? `mat4x2<${S}>`
//                     : T extends `mat4x3<${infer S}>`
//                       ? `mat4x3<${S}>`
//                       : T extends `mat4x4<${infer S}>`
//                         ? `mat4x4<${S}>`
//                         : never;
