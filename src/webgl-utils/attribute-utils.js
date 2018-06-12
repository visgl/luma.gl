/* eslint-disable camelcase */
import assert from '../utils/assert';

const GL_POINTS = 0x0;
const GL_LINES = 0x1;
const GL_LINE_LOOP = 0x2;
const GL_LINE_STRIP = 0x3;
const GL_TRIANGLES = 0x4;
const GL_TRIANGLE_STRIP = 0x5;
const GL_TRIANGLE_FAN = 0x6;

// Local constants - these will "collapse" during minification
const GL_FLOAT = 0x1406;
const GL_FLOAT_VEC2 = 0x8B50;
const GL_FLOAT_VEC3 = 0x8B51;
const GL_FLOAT_VEC4 = 0x8B52;

const GL_INT = 0x1404;
const GL_INT_VEC2 = 0x8B53;
const GL_INT_VEC3 = 0x8B54;
const GL_INT_VEC4 = 0x8B55;

const GL_UNSIGNED_INT = 0x1405;
const GL_UNSIGNED_INT_VEC2 = 0x8DC6;
const GL_UNSIGNED_INT_VEC3 = 0x8DC7;
const GL_UNSIGNED_INT_VEC4 = 0x8DC8;

const GL_BOOL = 0x8B56;
const GL_BOOL_VEC2 = 0x8B57;
const GL_BOOL_VEC3 = 0x8B58;
const GL_BOOL_VEC4 = 0x8B59;

const GL_FLOAT_MAT2 = 0x8B5A;
const GL_FLOAT_MAT3 = 0x8B5B;
const GL_FLOAT_MAT4 = 0x8B5C;

const GL_FLOAT_MAT2x3 = 0x8B65;
const GL_FLOAT_MAT2x4 = 0x8B66;
const GL_FLOAT_MAT3x2 = 0x8B67;
const GL_FLOAT_MAT3x4 = 0x8B68;
const GL_FLOAT_MAT4x2 = 0x8B69;
const GL_FLOAT_MAT4x3 = 0x8B6A;

// Composite types table
const COMPOSITE_GL_TYPES = {
  [GL_FLOAT]: [GL_FLOAT, 1],
  [GL_FLOAT_VEC2]: [GL_FLOAT, 2],
  [GL_FLOAT_VEC3]: [GL_FLOAT, 3],
  [GL_FLOAT_VEC4]: [GL_FLOAT, 4],

  [GL_INT]: [GL_INT, 1],
  [GL_INT_VEC2]: [GL_INT, 2],
  [GL_INT_VEC3]: [GL_INT, 3],
  [GL_INT_VEC4]: [GL_INT, 4],

  [GL_UNSIGNED_INT]: [GL_UNSIGNED_INT, 1],
  [GL_UNSIGNED_INT_VEC2]: [GL_UNSIGNED_INT, 2],
  [GL_UNSIGNED_INT_VEC3]: [GL_UNSIGNED_INT, 3],
  [GL_UNSIGNED_INT_VEC4]: [GL_UNSIGNED_INT, 4],

  [GL_BOOL]: [GL_FLOAT, 1],
  [GL_BOOL_VEC2]: [GL_FLOAT, 2],
  [GL_BOOL_VEC3]: [GL_FLOAT, 3],
  [GL_BOOL_VEC4]: [GL_FLOAT, 4],

  [GL_FLOAT_MAT2]: [GL_FLOAT, 8], // 4
  [GL_FLOAT_MAT2x3]: [GL_FLOAT, 8], // 6
  [GL_FLOAT_MAT2x4]: [GL_FLOAT, 8], // 8

  [GL_FLOAT_MAT3]: [GL_FLOAT, 12], // 9
  [GL_FLOAT_MAT3x2]: [GL_FLOAT, 12], // 6
  [GL_FLOAT_MAT3x4]: [GL_FLOAT, 12], // 12

  [GL_FLOAT_MAT4]: [GL_FLOAT, 16], // 16
  [GL_FLOAT_MAT4x2]: [GL_FLOAT, 16], // 8
  [GL_FLOAT_MAT4x3]: [GL_FLOAT, 16] // 12
};

// Counts the number of complete primitives given a number of vertices and a drawMode
export function getPrimitiveDrawMode(drawMode) {
  switch (drawMode) {
  case GL_POINTS: return GL_POINTS;
  case GL_LINES: return GL_LINES;
  case GL_LINE_STRIP: return GL_LINES;
  case GL_LINE_LOOP: return GL_LINES;
  case GL_TRIANGLES: return GL_TRIANGLES;
  case GL_TRIANGLE_STRIP: return GL_TRIANGLES;
  case GL_TRIANGLE_FAN: return GL_TRIANGLES;
  default: assert(false); return 0;
  }
}

// Counts the number of complete "primitives" given a number of vertices and a drawMode
export function getPrimitiveCount({drawMode, vertexCount}) {
  switch (drawMode) {
  case GL_POINTS:
  case GL_LINE_LOOP:
    return vertexCount;
  case GL_LINES: return vertexCount / 2;
  case GL_LINE_STRIP: return vertexCount - 1;
  case GL_TRIANGLES: return vertexCount / 3;
  case GL_TRIANGLE_STRIP:
  case GL_TRIANGLE_FAN:
    return vertexCount - 2;
  default: assert(false); return 0;
  }
}

// Counts the number of vertices after splitting the vertex stream into separate "primitives"
export function getVertexCount({drawMode, vertexCount}) {
  const primitiveCount = getPrimitiveCount({drawMode, vertexCount});
  switch (getPrimitiveDrawMode(drawMode)) {
  case GL_POINTS: return primitiveCount;
  case GL_LINES: return primitiveCount * 2;
  case GL_TRIANGLES: return primitiveCount * 3;
  default: assert(false); return 0;
  }
}

// Decomposes a composite type GL.VEC3 into a basic type (GL.FLOAT) and components (3)
export function decomposeCompositeGLType(compositeGLType) {
  const typeAndSize = COMPOSITE_GL_TYPES[compositeGLType];
  if (!typeAndSize) {
    return null;
  }
  const [type, components] = typeAndSize;
  return {type, components};
}
