// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import {GLExtensions} from '@luma.gl/constants';

/** Ensure extensions are only requested once */
export function getWebGLExtension(
  gl: WebGL2RenderingContext,
  name: string,
  extensions: GLExtensions
): void {
  if (extensions[name] === undefined) {
    extensions[name] = gl.getExtension(name) || null;
  }
}
