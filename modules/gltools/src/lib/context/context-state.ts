export interface ContextState {
  _canvasSizeInfo: {
    clientWidth: number;
    clientHeight: number;
    devicePixelRatio: number;
  };
  _polyfilled: boolean;
  _extensions: Record<string, any>;
}

export function getContextState(gl: WebGLRenderingContext): ContextState {
  // @ts-expect-error
  return gl.device;
}