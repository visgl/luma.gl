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
export function createCanvas({width, height, id = 'gl-canvas'}) {
  const canvas = document.createElement('canvas');
  canvas.id = id;
  canvas.style.width = Number.isFinite(width) ? `${width}px` : '100%';
  canvas.style.height = Number.isFinite(height) ? `${height}px` : '100%';
  // adds the canvas to the body element once the page has loaded
  getPageLoadPromise().then(document => {
    const body = document.body;
    body.insertBefore(canvas, body.firstChild);
  });
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

/**
 * Resizes canvas in "CSS coordinates" (note these can be different from device coords,
 * depending on devicePixelRatio/retina screens) and is separate from its drawing buffer
 * size.
 * See http://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
 * @param {Number} width, height - new width and height of canvas in CSS coordinates
 */
export function resizeCanvas({
  canvas,
  width,
  height,
  useDevicePixelRatio = true,
  resizeDrawingBuffer = true
}) {
  if (resizeDrawingBuffer) {
    const cssToDevicePixels = useDevicePixelRatio ? window.devicePixelRatio || 1 : 1;

    // Lookup the size the browser is displaying the canvas in CSS pixels
    // and compute a size needed to make our drawingbuffer match it in
    // device pixels.
    const displayWidth = Math.floor(width * cssToDevicePixels);
    const displayHeight = Math.floor(height * cssToDevicePixels);

    // Check if the canvas is not the same size.
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      // Make the canvas the same size
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }
  }

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  // if (canvas) {
  //   // Lookup the size the browser is displaying the canvas.
  //   var displayWidth = canvas.clientWidth;
  //   var displayHeight = canvas.clientHeight;

  //   // Check if the canvas is not the same size.
  //   if (canvas.width  !== displayWidth || canvas.height !== displayHeight) {
  //     // Make the canvas the same size
  //     canvas.width  = displayWidth;
  //     canvas.height = displayHeight;
  //   }
  // }
}
