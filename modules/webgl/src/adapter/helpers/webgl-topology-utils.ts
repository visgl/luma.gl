import {GL, GLPrimitiveTopology, GLPrimitive} from '@luma.gl/constants';

// Counts the number of complete primitives given a number of vertices and a drawMode
export function getPrimitiveDrawMode(drawMode: GLPrimitiveTopology): GLPrimitive {
  switch (drawMode) {
    case GL.POINTS:
      return GL.POINTS;
    case GL.LINES:
      return GL.LINES;
    case GL.LINE_STRIP:
      return GL.LINES;
    case GL.LINE_LOOP:
      return GL.LINES;
    case GL.TRIANGLES:
      return GL.TRIANGLES;
    case GL.TRIANGLE_STRIP:
      return GL.TRIANGLES;
    case GL.TRIANGLE_FAN:
      return GL.TRIANGLES;
    default:
      throw new Error('drawMode');
  }
}

// Counts the number of complete "primitives" given a number of vertices and a drawMode
export function getPrimitiveCount(options: {drawMode: GLPrimitiveTopology, vertexCount: number}): number {
  const {drawMode, vertexCount} = options;
  switch (drawMode) {
    case GL.POINTS:
    case GL.LINE_LOOP:
      return vertexCount;
    case GL.LINES:
      return vertexCount / 2;
    case GL.LINE_STRIP:
      return vertexCount - 1;
    case GL.TRIANGLES:
      return vertexCount / 3;
    case GL.TRIANGLE_STRIP:
    case GL.TRIANGLE_FAN:
      return vertexCount - 2;
    default:
      throw new Error('drawMode');
  }
}

// Counts the number of vertices after splitting the vertex stream into separate "primitives"
export function getVertexCount(options: {drawMode: GLPrimitiveTopology, vertexCount: number}): number {
  const {drawMode, vertexCount} = options;
  const primitiveCount = getPrimitiveCount({drawMode, vertexCount});
  switch (getPrimitiveDrawMode(drawMode)) {
    case GL.POINTS:
      return primitiveCount;
    case GL.LINES:
      return primitiveCount * 2;
    case GL.TRIANGLES:
      return primitiveCount * 3;
    default:
      throw new Error('drawMode');
  }
}
