// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GLExtensions} from '@luma.gl/webgl/constants';

/** Ensure extensions are only requested once */
export function getWebGLExtension<K extends keyof GLExtensions>(
  gl: WebGL2RenderingContext,
  name: K,
  extensions: GLExtensions
): GLExtensions[K] {
  if (extensions[name] === undefined) {
    extensions[name] = (gl.getExtension(name) || null) as GLExtensions[K];
  }
  return extensions[name];
}
