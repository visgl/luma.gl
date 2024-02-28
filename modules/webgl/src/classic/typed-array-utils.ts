// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TypedArray, TypedArrayConstructor} from '@luma.gl/core';
import {GL, GLDataType, GLPixelType} from '@luma.gl/constants';

const ERR_TYPE_DEDUCTION = 'Failed to deduce GL constant from typed array';

/**
 * Converts TYPED ARRAYS to corresponding GL constant
 * Used to auto deduce gl parameter types
 * @deprecated Use getDataTypeFromTypedArray
 * @param arrayOrType
 * @returns
 */
export function getGLTypeFromTypedArray(arrayOrType: TypedArray): GLDataType {
  // If typed array, look up constructor
  const type = ArrayBuffer.isView(arrayOrType) ? arrayOrType.constructor : arrayOrType;
  switch (type) {
    case Float32Array:
      return GL.FLOAT;
    case Uint16Array:
      return GL.UNSIGNED_SHORT;
    case Uint32Array:
      return GL.UNSIGNED_INT;
    case Uint8Array:
      return GL.UNSIGNED_BYTE;
    case Uint8ClampedArray:
      return GL.UNSIGNED_BYTE;
    case Int8Array:
      return GL.BYTE;
    case Int16Array:
      return GL.SHORT;
    case Int32Array:
      return GL.INT;
    default:
      throw new Error(ERR_TYPE_DEDUCTION);
  }
}

/**
 * Converts GL constant to corresponding TYPED ARRAY
 * Used to auto deduce gl parameter types
 * @deprecated Use getTypedArrayFromDataType
 * @param glType
 * @param param1
 * @returns
 */
// eslint-disable-next-line complexity
export function getTypedArrayFromGLType(
  glType: GLDataType | GLPixelType,
  options?: {
    clamped?: boolean;
  }
): TypedArrayConstructor {
  const {clamped = true} = options || {};
  // Sorted in some order of likelihood to reduce amount of comparisons
  switch (glType) {
    case GL.FLOAT:
      return Float32Array;
    case GL.UNSIGNED_SHORT:
    case GL.UNSIGNED_SHORT_5_6_5:
    case GL.UNSIGNED_SHORT_4_4_4_4:
    case GL.UNSIGNED_SHORT_5_5_5_1:
      return Uint16Array;
    case GL.UNSIGNED_INT:
      return Uint32Array;
    case GL.UNSIGNED_BYTE:
      return clamped ? Uint8ClampedArray : Uint8Array;
    case GL.BYTE:
      return Int8Array;
    case GL.SHORT:
      return Int16Array;
    case GL.INT:
      return Int32Array;
    default:
      throw new Error('Failed to deduce typed array type from GL constant');
  }
}

/**
 * Flip rows (can be used on arrays returned from `Framebuffer.readPixels`)
 * https: *stackoverflow.com/questions/41969562/
 * how-can-i-flip-the-result-of-webglrenderingcontext-readpixels
 * @param param0
 */
export function flipRows(options: {
  data: TypedArray;
  width: number;
  height: number;
  bytesPerPixel?: number;
  temp?: Uint8Array;
}): void {
  const {data, width, height, bytesPerPixel = 4, temp} = options;
  const bytesPerRow = width * bytesPerPixel;

  // make a temp buffer to hold one row
  const tempBuffer = temp || new Uint8Array(bytesPerRow);
  for (let y = 0; y < height / 2; ++y) {
    const topOffset = y * bytesPerRow;
    const bottomOffset = (height - y - 1) * bytesPerRow;
    // make copy of a row on the top half
    tempBuffer.set(data.subarray(topOffset, topOffset + bytesPerRow));
    // copy a row from the bottom half to the top
    data.copyWithin(topOffset, bottomOffset, bottomOffset + bytesPerRow);
    // copy the copy of the top half row to the bottom half
    data.set(tempBuffer, bottomOffset);
  }
}

export function scalePixels(options: {data: TypedArray; width: number; height: number}): {
  data: Uint8Array;
  width: number;
  height: number;
} {
  const {data, width, height} = options;
  const newWidth = Math.round(width / 2);
  const newHeight = Math.round(height / 2);
  const newData = new Uint8Array(newWidth * newHeight * 4);
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      for (let c = 0; c < 4; c++) {
        newData[(y * newWidth + x) * 4 + c] = data[(y * 2 * width + x * 2) * 4 + c];
      }
    }
  }
  return {data: newData, width: newWidth, height: newHeight};
}
