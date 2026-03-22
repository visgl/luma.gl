// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {PrimitiveTopology} from '@luma.gl/core';
import {GLEnum} from './gltf-webgl-constants';

/** Converts a WebGL draw mode into a luma.gl primitive topology string. */
export function convertGLDrawModeToTopology(
  drawMode:
    | GLEnum.POINTS
    | GLEnum.LINES
    | GLEnum.LINE_STRIP
    | GLEnum.LINE_LOOP
    | GLEnum.TRIANGLES
    | GLEnum.TRIANGLE_STRIP
    | GLEnum.TRIANGLE_FAN
): PrimitiveTopology {
  // prettier-ignore
  switch (drawMode) {
    case GLEnum.POINTS: return 'point-list';
    case GLEnum.LINES: return 'line-list';
    case GLEnum.LINE_STRIP: return 'line-strip';
    case GLEnum.TRIANGLES: return 'triangle-list';
    case GLEnum.TRIANGLE_STRIP: return 'triangle-strip';
    default: throw new Error(String(drawMode));
  }
}
