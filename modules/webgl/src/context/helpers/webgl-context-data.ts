// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Stores luma.gl specific state associated with a context
 */
export interface WebGLContextData {
  _polyfilled: boolean;
  _extensions: Record<string, any>;
  device?: unknown;
}

/**
 * Gets luma.gl specific state from a context
 * @returns context state
 */
export function getWebGLContextData(gl: WebGL2RenderingContext): WebGLContextData {
  // @ts-expect-error
  const luma = gl.luma as WebGLContextData | null;
  if (!luma) {
    const contextData: WebGLContextData = {
      _polyfilled: false,
      _extensions: {},
      device: null
    };
    // @ts-expect-error
    gl.luma = contextData;
  }

  // @ts-expect-error
  return gl.luma;
}
