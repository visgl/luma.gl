/**
 * Stores luma.gl specific state associated with a context
 */
export interface ContextState {
  _canvasSizeInfo: {
    clientWidth: number;
    clientHeight: number;
    devicePixelRatio: number;
  };
  _polyfilled: boolean;
  _extensions: Record<string, any>;
}

/**
 * Gets luma.gl specific state from a context
 * @returns context state
 */
export function getContextState(gl: WebGLRenderingContext): ContextState {
  // @ts-expect-error
  const {device, luma} = gl;
  if (device) {
    return device as ContextState;
  }
  if (!luma) {
    const contextState: ContextState = {
      _canvasSizeInfo: {
        clientWidth: 0,
        clientHeight: 0,
        devicePixelRatio: 1,
      },
      _polyfilled: false,
      _extensions: {}
    };
    // @ts-expect-error
    gl.luma = contextState;
  }
  // @ts-expect-error
  return gl.luma;
}
