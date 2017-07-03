// Resizing a webgl canvas

/* global window, document */

const isBrowser = typeof window !== 'undefined';

let isPageLoaded = false;

const pageLoadPromise = isBrowser ?
  new Promise((resolve, reject) => {
    window.onload = () => {
      isPageLoaded = true;
      resolve(document);
    };
  }) :
  Promise.resolve({});

/**
 * Returns a promise that resolves when the page is loaded
 * at this point the DOM can be manipulated, and e.g. a new canvas can be inserted
 * @return {Promise} - resolves when the page is loaded
 */
export function getPageLoadPromise() {
  return pageLoadPromise;
}

/**
 * Create a canvas
 * @param {Number} width - set to 100%
 * @param {Number} height - set to 100%
 */
export function createCanvas({width = 800, height = 600, id = 'gl-canvas', insert = true}) {
  const canvas = document.createElement('canvas');
  canvas.id = id;
  canvas.style.width = Number.isFinite(width) ? `${width}px` : '100%';
  canvas.style.height = Number.isFinite(height) ? `${height}px` : '100%';
  // add the canvas to the body element once the page has loaded
  if (insert) {
    getPageLoadPromise().then(document => {
      const body = document.body;
      body.insertBefore(canvas, body.firstChild);
    });
  }
  return canvas;
}

/**
 * Gets an already created canvas from the DOM
 * @param {Number} id - DOM element id
 */
export function getCanvas({id}) {
  if (!isPageLoaded) {
    throw new Error(`createGLContext called on canvas '${id}' before page was loaded`);
  }
  return document.getElementById(id);
}

// Gets current size of canvas in css (logical/window) coordinates
export function getCSSSize(canvas) {
  return {
    width: canvas.clientWidth,
    height: canvas.clientHeight
  };
}

// Gets current size of canvas drawing buffer in actual pixels
// This is needed for the gl.viewport call
export function getDrawingBufferSize(canvas) {
  return {
    width: canvas.width,
    height: canvas.height
  };
}

// Calculate the drawing buffer size that would cover current canvas size and device pixel ratio
// Intention is that every pixel in the drawing buffer will have a 1-to-1 mapping with
// actual device pixels in the hardware framebuffer, allowing us to render at the full
// resolution of the device.
export function calculateDrawingBufferSize(canvas, {useDevicePixelRatio = true}) {
  const cssToDevicePixels = useDevicePixelRatio ? window.devicePixelRatio || 1 : 1;

  // Lookup the size the browser is displaying the canvas in CSS pixels
  // and compute a size needed to make our drawingbuffer match it in
  // device pixels.
  const cssSize = getCSSSize(canvas);
  return {
    width: Math.floor(cssSize.width * cssToDevicePixels),
    height: Math.floor(cssSize.height * cssToDevicePixels),
    devicePixelRatio: cssToDevicePixels
  };
}

/**
 * Resizes canvas in "CSS coordinates" (note these can be very different from device coords,
 * depending on devicePixelRatio/retina screens and size of drawing buffer)
 * and can be changed separately from drawing buffer size.
 * Therefore, normally `resizeDrawingBuffer` should be called after calling `resizeCanvas`.
 *
 * See http://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
 *
 * @param {Number} width, height - new width and height of canvas in CSS coordinates
 */
export function resizeCanvas(canvas, {
  width,
  height,
  useDevicePixelRatio = true
}) {
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}

/**
 * Resize the canvas' drawing buffer to match the canvas CSS size,
 * and by default to also consider devicePixelRatio
 * detects if anything has changed, can be called every frame
 * for best visual results, usually set to either:
 *  canvas CSS width x canvas CSS height
 *  canvas CSS width * devicePixelRatio x canvas CSS height * devicePixelRatio
 *
 * NOTE: Regardless of size, the drawing buffer will always be scaled to the viewport
 * See http://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
 *
 * @param {Number} width - new width of canvas in CSS coordinates
 * @param {Number} height - new height of canvas in CSS coordinates
 */
export function resizeDrawingBuffer(canvas, {useDevicePixelRatio = true}) {
  // Resize the render buffer of the canvas to match canvas client size
  // multiplying with dpr (Optionally can be turned off)
  const newBufferSize = calculateDrawingBufferSize(canvas, {useDevicePixelRatio});
  // Only update if the canvas size has not changed
  if (newBufferSize.width !== canvas.width || newBufferSize.height !== canvas.height) {
    // Make the canvas render buffer the same size as
    canvas.width = newBufferSize.width;
    canvas.height = newBufferSize.height;
    // Always reset CSS size after setting drawing buffer size
    // canvas.style.width = `${cssSize.width}px`;
    // canvas.style.height = `${cssSize.height}px`;
  }
}
