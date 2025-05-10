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
  | PrimitiveDataType
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
  | PrimitiveDataType
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

/* Suffixes used by WGSL alias types */
type ShaderTypeAliasSuffix = 'f' | 'i' | 'u' | 'h';

/** @type Shorthand type aliases recognized by WGSL */
export type AttributeShaderTypeAlias =
  | `vec2${ShaderTypeAliasSuffix}`
  | `vec3${ShaderTypeAliasSuffix}`
  | `vec4${ShaderTypeAliasSuffix}`;

/** @type Shorthand type aliases recognized by WGSL */
export type VariableShaderTypeAlias =
  | AttributeShaderTypeAlias
  | `mat2x2${ShaderTypeAliasSuffix}`
  | `mat2x3${ShaderTypeAliasSuffix}`
  | `mat2x4${ShaderTypeAliasSuffix}`
  | `mat3x2${ShaderTypeAliasSuffix}`
  | `mat3x3${ShaderTypeAliasSuffix}`
  | `mat3x4${ShaderTypeAliasSuffix}`
  | `mat4x2${ShaderTypeAliasSuffix}`
  | `mat4x3${ShaderTypeAliasSuffix}`
  | `mat4x4${ShaderTypeAliasSuffix}`;

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

// GENERICS

type TypeOfAliasSuffix<T extends string> = T extends 'f'
  ? 'f32'
  : T extends 'i'
    ? 'i32'
    : T extends 'u'
      ? 'u32'
      : T extends 'h'
        ? 'f16'
        : never;

/** @type The unaliased type */
export type AttributeShaderTypeT<T extends AttributeShaderType | AttributeShaderTypeAlias> =
  T extends AttributeShaderTypeAlias
    ? T extends `vec2${infer S}`
      ? `vec2<${TypeOfAliasSuffix<S>}>`
      : T extends `vec3${infer S}`
        ? `vec3<${TypeOfAliasSuffix<S>}>`
        : T extends `vec4${infer S}`
          ? `vec4<${TypeOfAliasSuffix<S>}>`
          : T extends `mat2x2${infer S}`
            ? `mat2x2<${TypeOfAliasSuffix<S>}>`
            : T extends `mat3x3${infer S}`
              ? `mat3x3<${TypeOfAliasSuffix<S>}>`
              : T extends `mat4x4${infer S}`
                ? `mat4x4<${TypeOfAliasSuffix<S>}>`
                : never
    : T extends `vec2<${infer S}>`
      ? `vec2<${TypeOfAliasSuffix<S>}>`
      : T extends `vec3<${infer S}>`
        ? `vec3<${TypeOfAliasSuffix<S>}>`
        : T extends `vec4<${infer S}>`
          ? `vec4<${TypeOfAliasSuffix<S>}>`
          : T extends `mat2x2<${infer S}>`
            ? `mat2x2<${TypeOfAliasSuffix<S>}>`
            : T extends `mat2x3<${infer S}>`
              ? `mat2x3<${TypeOfAliasSuffix<S>}>`
              : T extends `mat2x4<${infer S}>`
                ? `mat2x4<${TypeOfAliasSuffix<S>}>`
                : T extends `mat3x2<${infer S}>`
                  ? `mat3x2<${TypeOfAliasSuffix<S>}>`
                  : T extends `mat3x3<${infer S}>`
                    ? `mat3x3<${TypeOfAliasSuffix<S>}>`
                    : T extends `mat3x4<${infer S}>`
                      ? `mat3x4<${TypeOfAliasSuffix<S>}>`
                      : T extends `mat4x2<${infer S}>`
                        ? `mat4x2<${TypeOfAliasSuffix<S>}>`
                        : T extends `mat4x3<${infer S}>`
                          ? `mat4x3<${TypeOfAliasSuffix<S>}>`
                          : T extends `mat4x4<${infer S}>`
                            ? `mat4x4<${TypeOfAliasSuffix<S>}>`
                            : never;

/** @type The unaliased type */
export type VariableShaderTypeT<T extends VariableShaderType | VariableShaderTypeAlias> =
  T extends VariableShaderTypeAlias
    ? T extends `vec2${infer S}`
      ? `vec2<${S}>`
      : T extends `vec3${infer S}`
        ? `vec3<${S}>`
        : T extends `vec4${infer S}`
          ? `vec4<${S}>`
          : T extends `mat2x2${infer S}`
            ? `mat2x2<${S}>`
            : T extends `mat2x3${infer S}`
              ? `mat2x3<${S}>`
              : T extends `mat2x4${infer S}`
                ? `mat2x4<${S}>`
                : T extends `mat3x2${infer S}`
                  ? `mat3x2<${S}>`
                  : T extends `mat3x3${infer S}`
                    ? `mat3x3<${S}>`
                    : T extends `mat3x4${infer S}`
                      ? `mat3x4<${S}>`
                      : T extends `mat4x2${infer S}`
                        ? `mat4x2<${S}>`
                        : T extends `mat4x3${infer S}`
                          ? `mat4x3<${S}>`
                          : T extends `mat4x4${infer S}`
                            ? `mat4x4<${S}>`
                            : never
    : T extends `vec2<${infer S}>`
      ? `vec2<${S}>`
      : T extends `vec3<${infer S}>`
        ? `vec3<${S}>`
        : T extends `vec4<${infer S}>`
          ? `vec4<${S}>`
          : T extends `mat2x2<${infer S}>`
            ? `mat2x2<${S}>`
            : T extends `mat2x3<${infer S}>`
              ? `mat2x3<${S}>`
              : T extends `mat2x4<${infer S}>`
                ? `mat2x4<${S}>`
                : T extends `mat3x2<${infer S}>`
                  ? `mat3x2<${S}>`
                  : T extends `mat3x3<${infer S}>`
                    ? `mat3x3<${S}>`
                    : T extends `mat3x4<${infer S}>`
                      ? `mat3x4<${S}>`
                      : T extends `mat4x2<${infer S}>`
                        ? `mat4x2<${S}>`
                        : T extends `mat4x3<${infer S}>`
                          ? `mat4x3<${S}>`
                          : T extends `mat4x4<${infer S}>`
                            ? `mat4x4<${S}>`
                            : never;
