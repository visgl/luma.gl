// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderAttributeType} from './shader-types';

/**  Predeclared aliases @see https://www.w3.org/TR/WGSL/#vector-types */
export const WGSL_TYPE_ALIAS_MAP: Record<string, ShaderAttributeType> = {
  vec2i: 'vec2<i32>',
  vec3i: 'vec3<i32>',
  vec4i: 'vec4<i32>',
  vec2u: 'vec2<u32>',
  vec3u: 'vec3<u32>',
  vec4u: 'vec4<u32>',
  vec2f: 'vec2<f32>',
  vec3f: 'vec3<f32>',
  vec4f: 'vec4<f32>',
  // Requires the f16 extension.
  vec2h: 'vec2<f16>',
  vec3h: 'vec3<f16>',
  vec4h: 'vec4<f16>'
};
