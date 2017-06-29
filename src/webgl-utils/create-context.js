// Create a WebGL context
import assert from 'assert';

/* global window, HTMLCanvasElement, WebGLRenderingContext */

/**
 * Installs a spy on Canvas.getContext
 * calls the provided callback with the {context}
 */
export function trackContextCreation({
  onContextCreate = () => null,
  onContextCreated = () => {}
}) {
  assert(onContextCreate || onContextCreated);
  if (typeof HTMLCanvasElement !== 'undefined') {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContextSpy(type, opts) {
      // Let intercepter create context
      let context;
      if (type === 'webgl') {
        context = onContextCreate({canvas: this, type, opts, getContext: getContext.bind(this)});
      }
      // If not, create context
      context = context || getContext.call(this, type, opts);
      // Report it created
      if (context instanceof WebGLRenderingContext) {
        onContextCreated({canvas: this, context, type, opts});
      }
      return context;
    };
  }
}

/**
 * Create a WebGL context for a canvas
 * Note calling this multiple time on the same canvas does return the same context
 */
export function createContext({
  canvas,
  opts = {}, // WebGLRenderingContext options
  onError = message => null
}) {
  canvas.addEventListener('webglcontextcreationerror', e => {
    onError(`WebGL context: ${e.statusMessage || 'Unknown error'}`);
  }, false);

  const {webgl1 = true, webgl2 = true} = opts;
  let gl = null;
  // Prefer webgl2 over webgl1, prefer conformant over experimental
  if (webgl2) {
    gl = gl || canvas.getContext('webgl2', opts);
    gl = gl || canvas.getContext('experimental-webgl2', opts);
  }
  if (webgl1) {
    gl = gl || canvas.getContext('webgl', opts);
    gl = gl || canvas.getContext('experimental-webgl', opts);
  }
  if (!gl) {
    return onError(`Failed to create ${webgl2 && !webgl1 ? 'WebGL2' : 'WebGL'} context`);
  }

  return gl;
}

/**
 * Resize the canvas' drawing buffer
 * for best visual results, usually set to either:
 *  canvas CSS width x canvas CSS height
 *  canvas CSS width * devicePixelRatio x canvas CSS height * devicePixelRatio
 * NOTE: Regardless of size, the drawing buffer will always be scaled to the viewport
 * See http://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
 * @param {Number} width - new width of canvas in CSS coordinates
 * @param {Number} height - new height of canvas in CSS coordinates
 */
export function resizeDrawingBuffer({gl, useDevicePixelRatio = true}) {
  // Resize the render buffer of the canvas to match canvas client size
  // multiplying with dpr (Optionally can be turned off)
  const {canvas} = gl;
  const cssToDevicePixels = useDevicePixelRatio ? window.devicePixelRatio || 1 : 1;

  // Lookup the size the browser is displaying the canvas in CSS pixels
  // and compute a size needed to make our drawingbuffer match it in
  // device pixels.
  const oldWidth = window.innerWidth;
  const oldHeight = window.innerHeight;
  const displayWidth = Math.floor(oldWidth * cssToDevicePixels);
  const displayHeight = Math.floor(oldHeight * cssToDevicePixels);

  // Check if the canvas size has not changed
  if (oldWidth !== displayWidth || oldHeight !== displayHeight) {
    // Make the canvas the same size
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    canvas.style.width = oldWidth;
    canvas.style.height = oldHeight;
  }
}

/**
 * Resizes a webgl context's viewport to cover the size of its canvas
 * @param {WebGLRenderingContext} gl - gl context
 */
export function resizeViewport({gl}) {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}
