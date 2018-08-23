import assert from '../utils/assert';

const GL_ALPHA = 0x1906;
const GL_RED = 0x1903;
const GL_RG = 0x8227;
const GL_RGB = 0x1907;
const GL_RGBA = 0x1908;
const GL_UNSIGNED_BYTE = 0x1401;
const GL_UNSIGNED_SHORT_4_4_4_4 = 0x8033;
const GL_UNSIGNED_SHORT_5_5_5_1 = 0x8034;
const GL_UNSIGNED_SHORT_5_6_5 = 0x8363;
const GL_FLOAT = 0x1406;
const GL_R32F = 0x822E;
const GL_RG32F = 0x8230;
const GL_RGBA32F = 0x8814;
const GL_RGB32F = 0x8815;

// Returns number of components in a specific readPixels WebGL format
export function glFormatToComponents(format) {
  switch (format) {
  case GL_ALPHA:
  case GL_R32F:
  case GL_RED:
    return 1;
  case GL_RG32F:
  case GL_RG:
    return 2;
  case GL_RGB:
  case GL_RGB32F:
    return 3;
  case GL_RGBA:
  case GL_RGBA32F:
    return 4;
  // TODO: Add support for additional WebGL2 formats
  default: assert(false); return 0;
  }
}

// Return byte count for given readPixels WebGL type
export function glTypeToBytes(type) {
  switch (type) {
  case GL_UNSIGNED_BYTE:
    return 1;
  case GL_UNSIGNED_SHORT_5_6_5:
  case GL_UNSIGNED_SHORT_4_4_4_4:
  case GL_UNSIGNED_SHORT_5_5_5_1:
    return 2;
  case GL_FLOAT:
    return 4;
  // TODO: Add support for additional WebGL2 types
  default: assert(false); return 0;
  }
}
