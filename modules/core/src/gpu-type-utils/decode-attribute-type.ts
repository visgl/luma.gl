// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderDataType, ShaderAttributeType} from './shader-types';
import {VertexFormat, VertexType} from './vertex-formats';

/** Information extracted from a ShaderAttributeInfo constant */
export type ShaderAttributeTypeInfo = {
  /** WGSL-style primitive data type, f32, i32, u32 */
  dataType: ShaderDataType;
  /** Whether this is a normalized integer (that must be used as float) */
  components: 1 | 2 | 3 | 4;
  /** Length in bytes of the data for one vertex */
  byteLength?: number;
  /** Whether this is for integer or float vert */
  integer: boolean;
  /** Whether this data type is signed */
  signed: boolean;
  /** The simplest vertex format that matches the shader attribute's data type */
  defaultVertexFormat: VertexFormat;
};

/** Decodes a vertex type, returning byte length and flags (integer, signed, normalized) */
export function decodeShaderAttributeType(
  attributeType: ShaderAttributeType
): ShaderAttributeTypeInfo {
  const [dataType, components] = TYPE_INFO[attributeType];
  const integer: boolean = dataType === 'i32' || dataType === 'u32';
  const signed: boolean = dataType !== 'u32';

  const byteLength = TYPE_SIZES[dataType] * components;
  const defaultVertexFormat = getCompatibleVertexFormat(dataType, components);
  return {
    dataType,
    components,
    defaultVertexFormat,
    byteLength,
    integer,
    signed
  };
}

/** Get the "default" vertex format for a certain shader data type */
function getCompatibleVertexFormat(
  dataType: ShaderDataType,
  components: 1 | 2 | 3 | 4
): VertexFormat {
  let vertexType: VertexType;
  switch (dataType) {
    case 'f32':
      vertexType = 'float32';
      break;
    case 'i32':
      vertexType = 'sint32';
      break;
    case 'u32':
      vertexType = 'uint32';
      break;
    case 'f16':
      return components <= 2 ? 'float16x2' : 'float16x4';
  }
  // TODO logic does not work for float16
  if (components === 1) {
    return vertexType;
  }
  return `${vertexType}x${components}`;
}

/** All valid shader attribute types. A table guarantees exhaustive list and fast execution */
const TYPE_INFO: Record<ShaderAttributeType, [ShaderDataType, 1 | 2 | 3 | 4]> = {
  f32: ['f32', 1],
  'vec2<f32>': ['f32', 2],
  'vec3<f32>': ['f32', 3],
  'vec4<f32>': ['f32', 4],
  f16: ['f16', 1],
  'vec2<f16>': ['f16', 2],
  'vec3<f16>': ['f16', 3],
  'vec4<f16>': ['f16', 4],
  i32: ['i32', 1],
  'vec2<i32>': ['i32', 2],
  'vec3<i32>': ['i32', 3],
  'vec4<i32>': ['i32', 4],
  u32: ['u32', 1],
  'vec2<u32>': ['u32', 2],
  'vec3<u32>': ['u32', 3],
  'vec4<u32>': ['u32', 4]
};

const TYPE_SIZES: Record<ShaderDataType, number> = {
  f32: 4,
  f16: 2,
  i32: 4,
  u32: 4
  // 'bool-webgl': 4,
};
