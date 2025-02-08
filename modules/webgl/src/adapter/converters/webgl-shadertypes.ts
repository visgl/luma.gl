// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {VariableShaderType, SignedDataType, VertexFormat, NormalizedDataType} from '@luma.gl/core';
import {GL, GLUniformType, GLSamplerType, GLDataType} from '@luma.gl/constants';

export type TextureBindingInfo = {
  viewDimension: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  sampleType: 'float' | 'unfilterable-float' | 'depth' | 'sint' | 'uint';
};

/** Converts to a luma shadertype to a GL data type (GL.BYTE, GL.FLOAT32 etc)  */
export function convertDataTypeToGLDataType(normalizedType: NormalizedDataType): GLDataType {
  return NORMALIZED_SHADER_TYPE_TO_WEBGL[normalizedType];
}

/** Converts to a luma shadertype to a GL data type (GL.BYTE, GL.FLOAT32 etc)  */
export function convertShaderVariableTypeToGLDataType(
  normalizedType: VariableShaderType
): GLDataType {
  // @ts-ignore TODO
  return NORMALIZED_SHADER_TYPE_TO_WEBGL[normalizedType];
}

/** Convert a WebGL "compisite type (e.g. GL.VEC3) into the corresponding luma shader uniform type */
export function convertGLUniformTypeToShaderVariableType(
  glUniformType: GLUniformType
): VariableShaderType {
  return WEBGL_SHADER_TYPES[glUniformType];
}

/** Check if a WebGL "uniform:" is a texture binding */
export function isGLSamplerType(type: GLUniformType | GLSamplerType): type is GLSamplerType {
  // @ts-ignore TODO
  return Boolean(WEBGL_SAMPLER_TO_TEXTURE_BINDINGS[type]);
}

/* Get luma texture binding info (viewDimension and sampleType) from a WebGL "sampler" binding */
export function getTextureBindingFromGLSamplerType(
  glSamplerType: GLSamplerType
): TextureBindingInfo {
  return WEBGL_SAMPLER_TO_TEXTURE_BINDINGS[glSamplerType];
}

/** Get vertex format from GL constants */
export function getVertexFormatFromGL(type: GLDataType, components: 1 | 2 | 3 | 4): VertexFormat {
  const base = getVertexTypeFromGL(type);
  // prettier-ignore
  switch (components) {
    case 1: return base;
    case 2: return `${base}x2`;
    // @ts-expect-error - deal with lack of "unaligned" formats
    case 3: return `${base}x3`;
    case 4: return `${base}x4`;
  }
  // @ts-ignore unreachable
  throw new Error(String(components));
}

/** Get data type from GL constants */
export function getVertexTypeFromGL(glType: GLDataType, normalized = false): NormalizedDataType {
  const index = normalized ? 1 : 0;
  return WEBGL_TO_NORMALIZED_DATA_TYPE[glType][index];
}

// Composite types table
// @ts-ignore TODO - fix the type confusion here
const WEBGL_SHADER_TYPES: Record<GLUniformType, VariableShaderType> = {
  [GL.FLOAT]: 'f32',
  [GL.FLOAT_VEC2]: 'vec2<f32>',
  [GL.FLOAT_VEC3]: 'vec3<f32>',
  [GL.FLOAT_VEC4]: 'vec4<f32>',

  [GL.INT]: 'i32',
  [GL.INT_VEC2]: 'vec2<i32>',
  [GL.INT_VEC3]: 'vec3<i32>',
  [GL.INT_VEC4]: 'vec4<i32>',

  [GL.UNSIGNED_INT]: 'u32',
  [GL.UNSIGNED_INT_VEC2]: 'vec2<u32>',
  [GL.UNSIGNED_INT_VEC3]: 'vec3<u32>',
  [GL.UNSIGNED_INT_VEC4]: 'vec4<u32>',

  [GL.BOOL]: 'f32',
  [GL.BOOL_VEC2]: 'vec2<f32>',
  [GL.BOOL_VEC3]: 'vec3<f32>',
  [GL.BOOL_VEC4]: 'vec4<f32>',

  // TODO - are sizes/components below correct?
  [GL.FLOAT_MAT2]: 'mat2x2<f32>',
  [GL.FLOAT_MAT2x3]: 'mat2x3<f32>',
  [GL.FLOAT_MAT2x4]: 'mat2x4<f32>',

  [GL.FLOAT_MAT3x2]: 'mat3x2<f32>',
  [GL.FLOAT_MAT3]: 'mat3x3<f32>',
  [GL.FLOAT_MAT3x4]: 'mat3x4<f32>',

  [GL.FLOAT_MAT4x2]: 'mat4x2<f32>',
  [GL.FLOAT_MAT4x3]: 'mat4x3<f32>',
  [GL.FLOAT_MAT4]: 'mat4x4<f32>'
};

const WEBGL_SAMPLER_TO_TEXTURE_BINDINGS: Record<GLSamplerType, TextureBindingInfo> = {
  [GL.SAMPLER_2D]: {viewDimension: '2d', sampleType: 'float'},
  [GL.SAMPLER_CUBE]: {viewDimension: 'cube', sampleType: 'float'},
  [GL.SAMPLER_3D]: {viewDimension: '3d', sampleType: 'float'},
  [GL.SAMPLER_2D_SHADOW]: {viewDimension: '3d', sampleType: 'depth'},
  [GL.SAMPLER_2D_ARRAY]: {viewDimension: '2d-array', sampleType: 'float'},
  [GL.SAMPLER_2D_ARRAY_SHADOW]: {viewDimension: '2d-array', sampleType: 'depth'},
  [GL.SAMPLER_CUBE_SHADOW]: {viewDimension: 'cube', sampleType: 'float'},
  [GL.INT_SAMPLER_2D]: {viewDimension: '2d', sampleType: 'sint'},
  [GL.INT_SAMPLER_3D]: {viewDimension: '3d', sampleType: 'sint'},
  [GL.INT_SAMPLER_CUBE]: {viewDimension: 'cube', sampleType: 'sint'},
  [GL.INT_SAMPLER_2D_ARRAY]: {viewDimension: '2d-array', sampleType: 'uint'},
  [GL.UNSIGNED_INT_SAMPLER_2D]: {viewDimension: '2d', sampleType: 'uint'},
  [GL.UNSIGNED_INT_SAMPLER_3D]: {viewDimension: '3d', sampleType: 'uint'},
  [GL.UNSIGNED_INT_SAMPLER_CUBE]: {viewDimension: 'cube', sampleType: 'uint'},
  [GL.UNSIGNED_INT_SAMPLER_2D_ARRAY]: {viewDimension: '2d-array', sampleType: 'uint'}
};

/** Map from WebGL normalized types to WebGL */
const NORMALIZED_SHADER_TYPE_TO_WEBGL: Record<NormalizedDataType, GLDataType> = {
  uint8: GL.UNSIGNED_BYTE,
  sint8: GL.BYTE,
  unorm8: GL.UNSIGNED_BYTE,
  snorm8: GL.BYTE,
  uint16: GL.UNSIGNED_SHORT,
  sint16: GL.SHORT,
  unorm16: GL.UNSIGNED_SHORT,
  snorm16: GL.SHORT,
  uint32: GL.UNSIGNED_INT,
  sint32: GL.INT,
  // WebGPU does not support normalized 32 bit integer attributes
  //  'unorm32': GL.UNSIGNED_INT,
  //  'snorm32': GL.INT,
  float16: GL.HALF_FLOAT,
  float32: GL.FLOAT
};

/* Map from WebGL types to webgpu normalized types */
const WEBGL_TO_NORMALIZED_DATA_TYPE: Record<GLDataType, [SignedDataType, NormalizedDataType]> = {
  [GL.BYTE]: ['sint8', 'snorm16'],
  [GL.UNSIGNED_BYTE]: ['uint8', 'unorm8'],
  [GL.SHORT]: ['sint16', 'unorm16'],
  [GL.UNSIGNED_SHORT]: ['uint16', 'unorm16'],
  [GL.INT]: ['sint32', 'sint32'],
  [GL.UNSIGNED_INT]: ['uint32', 'uint32'],
  [GL.FLOAT]: ['float32', 'float32'],
  [GL.HALF_FLOAT]: ['float16', 'float16']
};
