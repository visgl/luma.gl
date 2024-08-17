// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GL} from '@luma.gl/constants';

// Returns number of components in a specific readPixels WebGL format
export function glFormatToComponents(format) {
  switch (format) {
    case GL.ALPHA:
    case GL.R32F:
    case GL.RED:
    case GL.RED_INTEGER:
      return 1;
    case GL.RG32I:
    case GL.RG32UI:
    case GL.RG32F:
    case GL.RG_INTEGER:
    case GL.RG:
      return 2;
    case GL.RGB:
    case GL.RGB_INTEGER:
    case GL.RGB32F:
      return 3;
    case GL.RGBA:
    case GL.RGBA_INTEGER:
    case GL.RGBA32F:
      return 4;
    // TODO: Add support for additional WebGL2 formats
    default:
      return 0;
  }
}

// Return byte count for given readPixels WebGL type
export function glTypeToBytes(type) {
  switch (type) {
    case GL.UNSIGNED_BYTE:
      return 1;
    case GL.UNSIGNED_SHORT_5_6_5:
    case GL.UNSIGNED_SHORT_4_4_4_4:
    case GL.UNSIGNED_SHORT_5_5_5_1:
      return 2;
    case GL.FLOAT:
      return 4;
    // TODO: Add support for additional WebGL2 types
    default:
      return 0;
  }
}
