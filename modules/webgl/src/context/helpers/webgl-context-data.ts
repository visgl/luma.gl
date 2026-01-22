// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLExtensions} from '@luma.gl/constants';

/**
 * Stores luma.gl specific state associated with a context
 */
export interface WebGLContextData {
  _polyfilled: boolean;
  extensions: GLExtensions;
}

/**
 * Gets luma.gl specific state from a context
 * @returns context state
 */
export function getWebGLContextData(gl: WebGL2RenderingContext): WebGLContextData {
  // @ts-expect-error
  const luma = gl.luma as WebGLContextData | null;
  if (!luma) {
    const contextState: WebGLContextData = {
      _polyfilled: false,
      extensions: {}
    };
    // @ts-expect-error
    gl.luma = contextState;
  }

  // @ts-expect-error
  return gl.luma;
}
