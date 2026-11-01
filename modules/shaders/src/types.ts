// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// MATH TYPES
export type {TypedArray, NumberArray, NumericArray} from '@math.gl/core';

// export type BigIntOrNumberArray = NumberArray | BigIntTypedArray;

// UNIFORM TYPES
// These are "duplicated" from core module to avoid cross-dependencies

export type UniformDataType = 'uint32' | 'sint32' | 'float32';

export type UniformFormat =
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

export {type PrimitiveDataType} from './types/primitive-data-types';
export {
  type AttributeShaderType,
  type VariableShaderType,
  type CompositeShaderType,
  type StructShaderType,
  type ArrayShaderType,
  type AttributeShaderTypeAlias,
  type VariableShaderTypeAlias,
  type AttributeShaderTypeT,
  type VariableShaderTypeT,
  type AttributeShaderTypeAliasT,
  type VariableShaderTypeAliasT
} from './types/shader-types';
export {
  getVariableShaderTypeInfo,
  getAttributeShaderTypeInfo,
  makeShaderAttributeType,
  resolveAttributeShaderTypeAlias,
  resolveVariableShaderTypeAlias,
  type VariableShaderTypeInfo,
  type AttributeShaderTypeInfo,
  ShaderTypeDecoder,
  shaderTypeDecoder,
  WGSL_ATTRIBUTE_TYPE_ALIAS_MAP,
  WGSL_VARIABLE_TYPE_ALIAS_MAP
} from './types/shader-type-decoder';
export {
  makeShaderBlockLayout,
  getLeafLayoutInfo,
  isCompositeShaderTypeStruct,
  type ShaderBlockLayoutEntry,
  type ShaderBlockLayoutOptions,
  type ShaderBlockLayout
} from './types/shader-block-layout';
export {
  type ShaderLayout,
  type ComputeShaderLayout,
  type AttributeDeclaration,
  type BindingDeclaration,
  type UniformBufferBindingLayout,
  type UniformBlockLayout,
  type UniformInfo,
  type StorageBufferBindingLayout,
  type TextureBindingLayout,
  type ExternalTextureBindingLayout,
  type SamplerBindingLayout,
  type StorageTextureBindingLayout,
  type VaryingBinding,
  type UniformBlockBinding,
  type UniformBinding
} from './types/shader-layout';
export {
  type TextureFormat,
  type TextureFormatDepthStencil,
  type TextureFormatColor,
  type TextureFormatColorUncompressed,
  type TextureFormatUnorm8,
  type TextureFormatSnorm8,
  type TextureFormatUint8,
  type TextureFormatSint8,
  type TextureFormatUnorm16,
  type TextureFormatSnorm16,
  type TextureFormatUint16,
  type TextureFormatSint16,
  type TextureFormatFloat16,
  type TextureFormatUint32,
  type TextureFormatSint32,
  type TextureFormatFloat32,
  type TextureFormatPacked16,
  type TextureFormatPacked32,
  type TextureFormatCompressed,
  type CompressedTextureFormat
} from './types/texture-formats';
export {type CompareFunction, type SamplerProps} from './types/sampler-props';
export {alignTo} from './types/align-to';

/** Resource values remain opaque until an execution adapter binds them. */
export type ShaderBinding = unknown;
