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
