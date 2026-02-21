// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Stores luma.gl specific state associated with a context
 */
export interface WebGLContextData {
  /** This type is used by lower level code that is not aware of the Device type */
  device?: unknown;
  _polyfilled: boolean;
  _extensions: Record<string, any>;
  softwareRenderer?: boolean;
}

/**
 * Gets luma.gl specific state from a context
 * @returns context state
 */
export function getWebGLContextData(gl: WebGL2RenderingContext): WebGLContextData {
  // @ts-expect-error
  let luma = gl.luma as WebGLContextData | null;

  luma ||= {
    _polyfilled: false,
    _extensions: {},
    device: null,
    softwareRenderer: false
  } satisfies WebGLContextData;

  // @ts-expect-error
  gl.luma = luma;

  // Sanity check to make sure context data is properly initialized
  if (!('_polyfilled' in luma && '_extensions' in luma && 'device' in luma)) {
    throw new Error(`luma's WebGL context data is corrupted`);
  }

  return luma;
}
