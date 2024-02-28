// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GL} from '@luma.gl/constants';
import {ShaderAttributeType, ShaderDataType} from '@luma.gl/core';

/** Get shader attribute type from GL constants */
export function getShaderAttributeTypeFromGL(
  type: GL,
  components: 1 | 2 | 3 | 4
): ShaderAttributeType {
  const dataType = getShaderDataTypeFromGL(type);
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

/** Get shader data type from GL constants */
export function getShaderDataTypeFromGL(type: GL): ShaderDataType {
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

/** GetGL constant from shader data type */
export function getGLFromShaderDataType(
  type: ShaderDataType
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
