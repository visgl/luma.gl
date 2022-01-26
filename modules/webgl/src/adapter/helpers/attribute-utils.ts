import {assert} from '@luma.gl/api';
import GL from '@luma.gl/constants';


// Counts the number of complete primitives given a number of vertices and a drawMode
export function getPrimitiveDrawMode(drawMode) {
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
      assert(false);
      return 0;
  }
}

// Counts the number of complete "primitives" given a number of vertices and a drawMode
export function getPrimitiveCount({drawMode, vertexCount}) {
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
      assert(false);
      return 0;
  }
}

// Counts the number of vertices after splitting the vertex stream into separate "primitives"
export function getVertexCount({drawMode, vertexCount}) {
  const primitiveCount = getPrimitiveCount({drawMode, vertexCount});
  switch (getPrimitiveDrawMode(drawMode)) {
    case GL.POINTS:
      return primitiveCount;
    case GL.LINES:
      return primitiveCount * 2;
    case GL.TRIANGLES:
      return primitiveCount * 3;
    default:
      assert(false);
      return 0;
  }
}
