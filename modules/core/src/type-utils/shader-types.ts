// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Primitive data types understood by shaders
 * @note These types describe the type used in shader calculations, but for attribute inputs these can be populated from a different in-memory type.
 * @note bindings (like textures, samplers, and uniform buffers) are considered "bindings", not types
 * @note `f16` requires the `f16` extension
 */
export type ShaderDataType = 'u32' | 'i32' | 'f32' | 'f16';

/**
 * Describes the type of an attribute as defined in the shader source code.
 * @note Buffers with various `VertexFormat`s can be supplied for each type, and the GPU will convert them at runtime,
 * but there are limitations, see documentation for details.
 */
export type ShaderAttributeType =
  | 'f32'
  | 'vec2<f32>'
  | 'vec3<f32>'
  | 'vec4<f32>'
  | 'i32'
  | 'vec2<i32>'
  | 'vec3<i32>'
  | 'vec4<i32>'
  | 'u32'
  | 'vec2<u32>'
  | 'vec3<u32>'
  | 'vec4<u32>'
  // requires `f16` extension
  | 'f16'
  | 'vec2<f16>'
  | 'vec3<f16>'
  | 'vec4<f16>';

/**
 * Describes the type of a uniform as described in the shader source code.
 * Uniforms can be of a wider range of types than attributes.
 */
export type ShaderUniformType =
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

/** Shorthand type aliases recognized by WGSL */
export type ShaderTypeAlias =
  | 'vec2i'
  | 'vec3i'
  | 'vec4i'
  | 'vec2u'
  | 'vec3u'
  | 'vec4u'
  | 'vec2f'
  | 'vec3f'
  | 'vec4f'
  // Requires the f16 extension.
  | 'vec2h'
  | 'vec3h'
  | 'vec4h';
