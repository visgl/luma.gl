// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GL, GLDataType, GLPixelType} from '@luma.gl/constants';
import {SignedDataType} from '@luma.gl/core';

/** Get shadertypes data type from GL constants */
export function convertGLDataTypeToDataType(type: GLDataType | GLPixelType): SignedDataType {
  return GL_DATA_TYPE_MAP[type];
}

const GL_DATA_TYPE_MAP: Record<GLDataType | GLPixelType, SignedDataType> = {
  [GL.INT]: 'sint32',
  [GL.UNSIGNED_INT]: 'uint32',
  [GL.SHORT]: 'sint16',
  [GL.UNSIGNED_SHORT]: 'uint16',
  [GL.BYTE]: 'sint8',
  [GL.UNSIGNED_BYTE]: 'uint8',
  [GL.FLOAT]: 'float32',
  [GL.HALF_FLOAT]: 'float16',
  [GL.UNSIGNED_SHORT_5_6_5]: 'uint16',
  [GL.UNSIGNED_SHORT_4_4_4_4]: 'uint16',
  [GL.UNSIGNED_SHORT_5_5_5_1]: 'uint16',
  [GL.UNSIGNED_INT_2_10_10_10_REV]: 'uint32',
  [GL.UNSIGNED_INT_10F_11F_11F_REV]: 'uint32',
  [GL.UNSIGNED_INT_5_9_9_9_REV]: 'uint32',
  [GL.UNSIGNED_INT_24_8]: 'uint32',
  [GL.FLOAT_32_UNSIGNED_INT_24_8_REV]: 'uint32'
};

/** Get shader data type from GL constants *
export function getPrimitiveTypeFromGL(type: GL): PrimitiveDataType {
  switch (type) {
    case GL.INT:
      return 'i32';
    case GL.UNSIGNED_INT:
      return 'u32';
    case GL.SHORT:
      return 'i32';
    case GL.UNSIGNED_SHORT:
      return 'u32';
    case GL.BYTE:
      return 'i32';
    case GL.UNSIGNED_BYTE:
      return 'u32';
    case GL.FLOAT:
      return 'f32';
    case GL.HALF_FLOAT:
      return 'f16';
    default:
      throw new Error(String(type));
  }
}

/** Get shader attribute type from GL constants *
export function getShaderAttributeTypeFromGL(
  type: GL,
  components: 1 | 2 | 3 | 4
): AttributeShaderType {
  const dataType = getPrimitiveTypeFromGL(type);
  switch (components) {
    case 1:
      return dataType;
    case 2:
      return `vec2<${dataType}>`;
    case 3:
      return `vec2<${dataType}>`;
    case 4:
      return `vec2<${dataType}>`;
    default:
      throw new Error(String(components));
  }
}
*/

/** GetGL constant from shader data type
export function getGLFromShaderDataType(
  type: PrimitiveDataType
): GL.INT | GL.UNSIGNED_INT | GL.FLOAT | GL.HALF_FLOAT {
  switch (type) {
    // TODO
    case 'i32':
      return GL.INT;
    case 'u32':
      return GL.UNSIGNED_INT;
    case 'f32':
      return GL.FLOAT;
    case 'f16':
      return GL.HALF_FLOAT;
    default:
      throw new Error(String(type));
  }
}
*/
