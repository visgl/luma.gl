// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {PrimitiveTopology} from '@luma.gl/core';

// NOTE: Modules other than `@luma.gl/webgl` should not import `GL` from
// `@luma.gl/constants`. Locally we use `GLEnum` instead of `GL` to avoid
// conflicts with the `babel-plugin-inline-webgl-constants` plugin.
// eslint-disable-next-line no-shadow
export enum GLEnum {
  POINTS = 0x0,
  LINES = 0x1,
  LINE_LOOP = 0x2,
  LINE_STRIP = 0x3,
  TRIANGLES = 0x4,
  TRIANGLE_STRIP = 0x5,
  TRIANGLE_FAN = 0x6
}

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
