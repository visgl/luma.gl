// WebGLRenderingContext related methods
/* eslint-disable quotes */
import GL from '@luma.gl/constants';
import {global, isBrowser as getIsBrowser} from 'probe.gl/env';
import {trackContextState} from '../state-tracker/track-context-state';

import {log} from '../utils/log';
import {assert} from '../utils/assert';
import {getDevicePixelRatio} from '../utils/device-pixels';
import {isWebGL2} from '../utils/webgl-checks';

const isBrowser = getIsBrowser();
const isPage = isBrowser && typeof document !== 'undefined';

/**
 * Options for createGLContext
 * COMMON CONTEXT PARAMETERS
* @param webgl2 Set to false to not create a WebGL2 context (force webgl1)
* @param webgl1 set to false to not create a WebGL1 context (fail if webgl2 not available)
* @param throwOnError If set to false, return `null` if context creation fails.
* @param manageState Set to false to disable WebGL state management instrumentation
* @param break
* @param onError
* @param onContextLost
* @param onContextRestored
*
* BROWSER CONTEXT PARAMETERS
* @param canvas A canvas element or a canvas string id.
* @param debug Instrument context (at the expense of performance).
* @param alpha Default render target has an alpha buffer.
* @param depth Default render target has a depth buffer of at least 16 bits.
* @param stencil Default render target has a stencil buffer of at least 8 bits.
* @param antialias Boolean that indicates whether or not to perform anti-aliasing.
* @param premultipliedAlpha Boolean that indicates that the page compositor will assume the drawing buffer contains colors with pre-multiplied alpha.
* @param preserveDrawingBuffer Default render target buffers will not be automatically cleared and will preserve their values until cleared or overwritten
* @param failIfMajorPerformanceCaveat Do not create if the system performance is low.
*
* HEADLESS CONTEXT PARAMETERS
* @param width only used by headless gl
* @param height only used by headless gl
*
* WEBGL/HEADLESS CONTEXT PARAMETERS
* Remaining options are passed through to context creator
*/
export type GLContextOptions = {
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

const CONTEXT_DEFAULTS = {
  // COMMON CONTEXT PARAMETERS
  // Attempt to allocate WebGL2 context
  webgl2: true, // Attempt to create a WebGL2 context (false to force webgl1)
  webgl1: true, // Attempt to create a WebGL1 context (false to fail if webgl2 not available)
  throwOnError: true,
  manageState: true,
  // BROWSER CONTEXT PARAMETERS
  canvas: null, // A canvas element or a canvas string id
  debug: false, // Instrument context (at the expense of performance)
  // HEADLESS CONTEXT PARAMETERS
  width: 800, // width are height are only used by headless gl
  height: 600
  // WEBGL/HEADLESS CONTEXT PARAMETERS
  // Remaining options are passed through to context creator
};

/**
 * Creates a context giving access to the WebGL API
 */
/* eslint-disable complexity, max-statements */
export function createGLContext(options?: GLContextOptions): WebGLRenderingContext {
  assert(
    isBrowser,
    "createGLContext only available in the browser.\nCreate your own headless context or use 'createHeadlessContext' from @luma.gl/test-utils"
  );

  options = Object.assign({}, CONTEXT_DEFAULTS, options);
  const {width, height} = options;

  // Error reporting function, enables exceptions to be disabled
  function onError(message) {
    if (options.throwOnError) {
      throw new Error(message);
    }
    // eslint-disable-next-line
    console.error(message);
    return null;
  }
  options.onError = onError;

  let gl;
  // Get or create a canvas
  const {canvas} = options;
  const targetCanvas = getCanvas({canvas, width, height, onError});
  // Create a WebGL context in the canvas
  gl = createBrowserContext(targetCanvas, options);

  if (!gl) {
    return null;
  }

  gl = instrumentGLContext(gl, options);

  // Log some debug info about the newly created context
  logInfo(gl);

  // Add to seer integration
  return gl;
}

/*
 * Creates a context giving access to the WebGL API
 */
export function instrumentGLContext(
  gl: WebGLRenderingContext,
  options?: GLContextOptions
): WebGLRenderingContext {
  // Avoid multiple instrumentations
  // @ts-ignore
  if (!gl || gl._instrumented) {
    return gl;
  }

  // @ts-ignore
  gl._version = gl._version || getVersion(gl);

  // Cache canvas size information to avoid setting it on every frame.
  // @ts-ignore
  gl.luma = gl.luma || {};
  // @ts-ignore
  gl.luma.canvasSizeInfo = gl.luma.canvasSizeInfo || {};

  options = Object.assign({}, CONTEXT_DEFAULTS, options);
  const {manageState, debug} = options;

  // Install context state tracking
  if (manageState) {
    trackContextState(gl, {
      copyState: false,
      log: (...args) => log.log(1, ...args)()
    });
  }

  // Add debug instrumentation to the context
  if (isBrowser && debug) {
    // @ts-ignore
    if (!global.makeDebugContext) {
      log.warn('WebGL debug mode not activated. import "@luma.gl/debug" to enable.')();
    } else {
      // @ts-ignore
      gl = global.makeDebugContext(gl, options);
      // Debug forces log level to at least 1
      log.level = Math.max(log.level, 1);
    }
  }

  // @ts-ignore
  gl._instrumented = true;

  return gl;
}

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
} {
  const vendorMasked = gl.getParameter(GL.VENDOR);
  const rendererMasked = gl.getParameter(GL.RENDERER);
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const vendorUnmasked = ext && gl.getParameter(ext.UNMASKED_VENDOR_WEBGL || GL.VENDOR);
  const rendererUnmasked = ext && gl.getParameter(ext.UNMASKED_RENDERER_WEBGL || GL.RENDERER);
  return {
    vendor: vendorUnmasked || vendorMasked,
    renderer: rendererUnmasked || rendererMasked,
    vendorMasked,
    rendererMasked,
    version: gl.getParameter(GL.VERSION),
    shadingLanguageVersion: gl.getParameter(GL.SHADING_LANGUAGE_VERSION)
  };
}

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
) {
  // Resize browser context . 
  if (gl.canvas) {
    const devicePixelRatio = getDevicePixelRatio(options?.useDevicePixels);
    setDevicePixelRatio(gl, devicePixelRatio, options);
    return;
  }

  // Resize headless gl context
  const ext = gl.getExtension('STACKGL_resize_drawingbuffer');
  if (ext && options && `width` in options && `height` in options) {
    ext.resize(options.width, options.height);
  }
}

// HELPER METHODS

/**
 * Create a WebGL context for a canvas
 * Note calling this multiple time on the same canvas does return the same context
 */

function createBrowserContext(canvas, options) {
  const {onError} = options;

  // Try to extract any extra information about why context creation failed
  let errorMessage = null;
  const onCreateError = (error) => (errorMessage = error.statusMessage || errorMessage);
  canvas.addEventListener('webglcontextcreationerror', onCreateError, false);

  const {webgl1 = true, webgl2 = true} = options;
  let gl = null;
  // Prefer webgl2 over webgl1, prefer conformant over experimental
  if (webgl2) {
    gl = gl || canvas.getContext('webgl2', options);
    gl = gl || canvas.getContext('experimental-webgl2', options);
  }
  if (webgl1) {
    gl = gl || canvas.getContext('webgl', options);
    gl = gl || canvas.getContext('experimental-webgl', options);
  }

  canvas.removeEventListener('webglcontextcreationerror', onCreateError, false);

  if (!gl) {
    return onError(
      `Failed to create ${webgl2 && !webgl1 ? 'WebGL2' : 'WebGL'} context: ${
        errorMessage || 'Unknown error'
      }`
    );
  }

  if (options.onContextLost) {
    canvas.addEventListener('webglcontextlost', options.onContextLost, false);
  }

  if (options.onContextRestored) {
    canvas.addEventListener('webglcontextrestored', options.onContextRestored, false);
  }

  return gl;
}

function getCanvas({canvas, width = 800, height = 600, onError}) {
  let targetCanvas;
  if (typeof canvas === 'string') {
    const isPageLoaded = isPage && document.readyState === 'complete';
    if (!isPageLoaded) {
      onError(`createGLContext called on canvas '${canvas}' before page was loaded`);
    }
    targetCanvas = document.getElementById(canvas);
  } else if (canvas) {
    targetCanvas = canvas;
  } else {
    targetCanvas = document.createElement('canvas');
    targetCanvas.id = 'lumagl-canvas';
    targetCanvas.style.width = Number.isFinite(width) ? `${width}px` : '100%';
    targetCanvas.style.height = Number.isFinite(height) ? `${height}px` : '100%';
    document.body.insertBefore(targetCanvas, document.body.firstChild);
  }

  return targetCanvas;
}

function logInfo(gl) {
  const webGL = isWebGL2(gl) ? 'WebGL2' : 'WebGL1';
  const info = getContextDebugInfo(gl);
  const driver = info ? `(${info.vendor},${info.renderer})` : '';
  const debug = gl.debug ? ' debug' : '';
  log.info(1, `${webGL}${debug} context ${driver}`)();
}

function getVersion(gl) {
  if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
    // WebGL2 context.
    return 2;
  }
  // Must be a WebGL1 context.
  return 1;
}

// use devicePixelRatio to set canvas width and height
function setDevicePixelRatio(gl, devicePixelRatio, options: {width?: number, height?: number} = {}) {
  // NOTE: if options.width and options.height not used remove in v8
  let clientWidth = 'width' in options ? options.width : gl.canvas.clientWidth;
  let clientHeight = 'height' in options ? options.height : gl.canvas.clientHeight;

  if (!clientWidth || !clientHeight) {
    log.log(1, 'Canvas clientWidth/clientHeight is 0')();
    // by forcing devicePixel ratio to 1, we do not scale gl.canvas.width and height in each frame.
    devicePixelRatio = 1;
    clientWidth = gl.canvas.width || 1;
    clientHeight = gl.canvas.height || 1;
  }

  gl.luma = gl.luma || {};
  gl.luma.canvasSizeInfo = gl.luma.canvasSizeInfo || {};
  const cachedSize = gl.luma.canvasSizeInfo;
  // Check if canvas needs to be resized
  if (
    cachedSize.clientWidth !== clientWidth ||
    cachedSize.clientHeight !== clientHeight ||
    cachedSize.devicePixelRatio !== devicePixelRatio
  ) {
    let clampedPixelRatio = devicePixelRatio;

    const canvasWidth = Math.floor(clientWidth * clampedPixelRatio);
    const canvasHeight = Math.floor(clientHeight * clampedPixelRatio);
    gl.canvas.width = canvasWidth;
    gl.canvas.height = canvasHeight;

    // Note: when devicePixelRatio is too high, it is possible we might hit system limit for
    // drawing buffer width and hight, in those cases they get clamped and resulting aspect ration may not be maintained
    // for those cases, reduce devicePixelRatio.
    if (gl.drawingBufferWidth !== canvasWidth || gl.drawingBufferHeight !== canvasHeight) {
      log.warn(`Device pixel ratio clamped`)();
      clampedPixelRatio = Math.min(
        gl.drawingBufferWidth / clientWidth,
        gl.drawingBufferHeight / clientHeight
      );

      gl.canvas.width = Math.floor(clientWidth * clampedPixelRatio);
      gl.canvas.height = Math.floor(clientHeight * clampedPixelRatio);
    }

    Object.assign(gl.luma.canvasSizeInfo, {clientWidth, clientHeight, devicePixelRatio});
  }
}
