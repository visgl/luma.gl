export const ERR_CONTEXT: string;
export const ERR_WEBGL: string;
export const ERR_WEBGL2: string;

/** Options for createGLContext */
export type CreateGLContextOptions = {
  // COMMON CONTEXT PARAMETERS
  webgl2?: boolean; // Set to false to not create a WebGL2 context (force webgl1)
  webgl1?: boolean; // set to false to not create a WebGL1 context (fail if webgl2 not available)
  throwOnError?: boolean; // If set to false, return `null` if context creation fails.
  manageState?: boolean; // Set to false to disable WebGL state management instrumentation
  break?: Array<any>; // TODO: types
  onError?: any;
  onContextLost?: (event: Event) => void;
  onContextRestored?: (event: Event) => void;
  // BROWSER CONTEXT PARAMETERS
  canvas?: HTMLCanvasElement | string | OffscreenCanvas | null; // A canvas element or a canvas string id
  debug?: boolean; // Instrument context (at the expense of performance)
  alpha?: boolean; // Default render target has an alpha buffer.
  depth?: boolean; // Default render target has a depth buffer of at least 16 bits.
  stencil?: boolean; // Default render target has a stencil buffer of at least 8 bits.
  antialias?: boolean; // Boolean that indicates whether or not to perform anti-aliasing.
  premultipliedAlpha?: boolean; // Boolean that indicates that the page compositor will assume the drawing buffer contains colors with pre-multiplied alpha.
  preserveDrawingBuffer?: boolean; // Default render target buffers will not be automatically cleared and will preserve their values until cleared or overwritten
  failIfMajorPerformanceCaveat?: boolean; // Do not create if the system performance is low.
  // HEADLESS CONTEXT PARAMETERS
  width?: number /** width are height are only used by headless gl */;
  height?: number /** width are height are only used by headless gl */;
  // WEBGL/HEADLESS CONTEXT PARAMETERS
  // Remaining options are passed through to context creator
};

/*
 * Creates a context giving access to the WebGL API
 */
export function createGLContext(options?: CreateGLContextOptions): WebGLRenderingContext;

export function instrumentGLContext(
  gl: WebGLRenderingContext,
  options?: CreateGLContextOptions
): WebGLRenderingContext;

/**
 * Provides strings identifying the GPU vendor and driver.
 * https://www.khronos.org/registry/webgl/extensions/WEBGL_debug_renderer_info/
 */
export function getContextDebugInfo(
  gl: WebGLRenderingContext
): {
  vendor: string;
  renderer: string;
  vendorMasked: string;
  rendererMasked: string;
  version: string;
  shadingLanguageVersion: string;
};

/**
 * Resize the canvas' drawing buffer.
 *
 * Can match the canvas CSS size, and optionally also consider devicePixelRatio
 * Can be called every frame
 *
 * Regardless of size, the drawing buffer will always be scaled to the viewport, but
 * for best visual results, usually set to either:
 *  canvas CSS width x canvas CSS height
 *  canvas CSS width * devicePixelRatio x canvas CSS height * devicePixelRatio
 * See http://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
 *
 * resizeGLContext(gl, {width, height, useDevicePixels})
 */
export function resizeGLContext(
  gl: WebGLRenderingContext,
  options?: {
    width?: number;
    height?: number;
    useDevicePixels?: boolean | number;
  }
);
