// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GL, GLPrimitiveTopology, GLPrimitive} from '@luma.gl/constants';
import {PrimitiveTopology} from '@luma.gl/core';

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
export function getPrimitiveCount(options: {
  drawMode: GLPrimitiveTopology;
  vertexCount: number;
}): number {
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
export function getVertexCount(options: {
  drawMode: GLPrimitiveTopology;
  vertexCount: number;
}): number {
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

/** Get the primitive type for draw */
export function getGLDrawMode(
  topology: PrimitiveTopology
):
  | GL.POINTS
  | GL.LINES
  | GL.LINE_STRIP
  | GL.LINE_LOOP
  | GL.TRIANGLES
  | GL.TRIANGLE_STRIP
  | GL.TRIANGLE_FAN {
  // prettier-ignore
  switch (topology) {
    case 'point-list': return GL.POINTS;
    case 'line-list': return GL.LINES;
    case 'line-strip': return GL.LINE_STRIP;
    case 'triangle-list': return GL.TRIANGLES;
    case 'triangle-strip': return GL.TRIANGLE_STRIP;
    default: throw new Error(topology);
  }
}

/** Get the primitive type for transform feedback */
export function getGLPrimitive(topology: PrimitiveTopology): GL.POINTS | GL.LINES | GL.TRIANGLES {
  // prettier-ignore
  switch (topology) {
    case 'point-list': return GL.POINTS;
    case 'line-list': return GL.LINES;
    case 'line-strip': return GL.LINES;
    case 'triangle-list': return GL.TRIANGLES;
    case 'triangle-strip': return GL.TRIANGLES;
    default: throw new Error(topology);
  }
}
