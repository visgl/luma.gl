// Resizing a webgl canvas

/* global document */
import {isBrowser} from '../utils';

const isPage = isBrowser && typeof document !== 'undefined';

export function getCanvas({canvas, width, height, onError = () => {}}) {
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
    targetCanvas = createCanvas({id: 'lumagl-canvas', width, height, onError});
  }

  return targetCanvas;
}

/**
 * Create a canvas
 * @param {Number} width - set to 100%
 * @param {Number} height - set to 100%
 */
function createCanvas({width = 800, height = 600, id = 'gl-canvas', insert = true}) {
  const canvas = document.createElement('canvas');
  canvas.id = id;
  canvas.style.width = Number.isFinite(width) ? `${width}px` : '100%';
  canvas.style.height = Number.isFinite(height) ? `${height}px` : '100%';
  // add the canvas to the body element once the page has loaded
  if (insert) {
    const body = document.body;
    body.insertBefore(canvas, body.firstChild);
  }
  return canvas;
}
