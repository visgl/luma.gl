// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {PrimitiveTopology} from '@luma.gl/core';
import {GLEnum} from './gltf-webgl-constants';

type GLTFIndexArray = Uint8Array | Uint16Array | Uint32Array;
type GLTFDrawMode =
  | GLEnum.POINTS
  | GLEnum.LINES
  | GLEnum.LINE_STRIP
  | GLEnum.LINE_LOOP
  | GLEnum.TRIANGLES
  | GLEnum.TRIANGLE_STRIP
  | GLEnum.TRIANGLE_FAN;

export type NormalizedGLTFTopology = {
  topology: PrimitiveTopology;
  indices?: Uint16Array | Uint32Array;
};

/** Converts a WebGL draw mode into a luma.gl primitive topology string. */
export function convertGLDrawModeToTopology(drawMode: GLTFDrawMode): PrimitiveTopology {
  // biome-ignore format: preserve layout
  switch (drawMode) {
    case GLEnum.POINTS: return 'point-list';
    case GLEnum.LINES: return 'line-list';
    case GLEnum.LINE_STRIP: return 'line-strip';
    case GLEnum.TRIANGLES: return 'triangle-list';
    case GLEnum.TRIANGLE_STRIP: return 'triangle-strip';
    default: throw new Error(String(drawMode));
  }
}

/**
 * Converts WebGL-only glTF primitive modes to portable indexed list topologies.
 *
 * The returned indices are newly allocated so the post-processed source document remains
 * unchanged. Uint8 source indices are widened because WebGPU does not support uint8 index buffers.
 */
export function normalizeGLTFTopology(
  drawMode: GLTFDrawMode,
  sourceIndices: GLTFIndexArray | undefined,
  vertexCount: number
): NormalizedGLTFTopology {
  if (drawMode !== GLEnum.LINE_LOOP && drawMode !== GLEnum.TRIANGLE_FAN) {
    return {topology: convertGLDrawModeToTopology(drawMode)};
  }

  const sourceVertexCount = sourceIndices?.length ?? vertexCount;
  const indexCount =
    drawMode === GLEnum.LINE_LOOP
      ? sourceVertexCount >= 2
        ? sourceVertexCount * 2
        : 0
      : sourceVertexCount >= 3
        ? (sourceVertexCount - 2) * 3
        : 0;
  const IndexArray =
    sourceIndices instanceof Uint32Array || (!sourceIndices && vertexCount > 65536)
      ? Uint32Array
      : Uint16Array;
  const indices = new IndexArray(indexCount);
  const getSourceIndex = (index: number): number => sourceIndices?.[index] ?? index;

  if (drawMode === GLEnum.LINE_LOOP) {
    for (let index = 0; index < sourceVertexCount; index++) {
      indices[index * 2] = getSourceIndex(index);
      indices[index * 2 + 1] = getSourceIndex((index + 1) % sourceVertexCount);
    }
    return {topology: 'line-list', indices};
  }

  for (let triangleIndex = 0; triangleIndex < sourceVertexCount - 2; triangleIndex++) {
    indices[triangleIndex * 3] = getSourceIndex(0);
    indices[triangleIndex * 3 + 1] = getSourceIndex(triangleIndex + 1);
    indices[triangleIndex * 3 + 2] = getSourceIndex(triangleIndex + 2);
  }
  return {topology: 'triangle-list', indices};
}
