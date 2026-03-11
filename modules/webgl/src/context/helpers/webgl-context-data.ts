// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLExtensions} from '@luma.gl/constants';

/**
 * Stores luma.gl specific state associated with a context
 */
export interface WebGLContextData {
  /** This type is used by lower level code that is not aware of the Device type */
  device?: unknown;
  _polyfilled: boolean;
  extensions: GLExtensions;
  /** Compatibility alias for older data objects */
  _extensions?: GLExtensions;
  softwareRenderer?: boolean;
}

/**
 * Gets luma.gl specific state from a context
 * @returns context state
 */
export function getWebGLContextData(gl: WebGL2RenderingContext): WebGLContextData {
  // @ts-expect-error
  const contextData = (gl.luma as WebGLContextData | null) || {
    _polyfilled: false,
    extensions: {},
    softwareRenderer: false
  };

  if (!contextData.extensions && contextData._extensions) {
    contextData.extensions = contextData._extensions;
  }
  contextData._polyfilled ??= false;
  contextData.extensions ||= {};
  if (contextData.extensions && !contextData._extensions) {
    contextData._extensions = contextData.extensions;
  }

  // @ts-expect-error
  gl.luma = contextData;

  return contextData;
}
