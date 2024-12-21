// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GLExtensions} from '@luma.gl/constants';

/** Ensure extensions are only requested once */
export function getWebGLExtension(
  gl: WebGL2RenderingContext,
  name: string,
  extensions: GLExtensions
): unknown {
  // @ts-ignore TODO
  if (extensions[name] === undefined) {
    // @ts-ignore TODO
    extensions[name] = gl.getExtension(name) || null;
  }
  // @ts-ignore TODO
  return extensions[name];
}
