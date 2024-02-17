// luma.gl, MIT license
// Copyright (c) vis.gl contributors

/**
 * Stores luma.gl specific state associated with a context
 */
export interface WebGLContextData {
  _polyfilled: boolean;
  _extensions: Record<string, any>;
}

/**
 * Gets luma.gl specific state from a context
 * @returns context state
 */
export function getContextData(gl: WebGL2RenderingContext): WebGLContextData {
  // @ts-expect-error
  const luma = gl.luma as WebGLContextData | null;
  if (!luma) {
    const contextState: WebGLContextData = {
      _polyfilled: false,
      _extensions: {}
    };
    // @ts-expect-error
    gl.luma = contextState;
  }

  // @ts-expect-error
  return gl.luma;
}

export function initializeExtensions(gl: WebGL2RenderingContext): void {
  const contextState = getContextData(gl);
  // `getSupportedExtensions` can return null when context is lost.
  const EXTENSIONS = gl.getSupportedExtensions() || [];
  // Generates warnings in Chrome
  const IGNORE_EXTENSIONS = ['WEBGL_polygon_mode'];
  for (const extensionName of EXTENSIONS) {
    if (!IGNORE_EXTENSIONS.includes(extensionName)) {
      const extension = gl.getExtension(extensionName);
      contextState._extensions[extensionName] = extension;
    }
  }
}
