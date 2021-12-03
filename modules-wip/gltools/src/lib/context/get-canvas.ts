// luma.gl, MIT license
import {isBrowser} from 'probe.gl/env';
const isPage = isBrowser() && typeof document !== 'undefined';

/**
 * Creates a new canvas or returns the HTML element for a canvas.
 * @param width
 * @param height
 * @returns
 */
export function getCanvas(options: {
  canvas?: string | HTMLCanvasElement | OffscreenCanvas,
  width: number,
  height: number
}): HTMLCanvasElement | OffscreenCanvas {
  const {canvas, width = 800, height = 600} = options;

  if (!canvas) {
    const targetCanvas = document.createElement('canvas');
    targetCanvas.id = 'lumagl-canvas';
    targetCanvas.style.width = Number.isFinite(width) ? `${width}px` : '100%';
    targetCanvas.style.height = Number.isFinite(height) ? `${height}px` : '100%';
    document.body.insertBefore(targetCanvas, document.body.firstChild);
    return targetCanvas;
  }

  if (typeof canvas === 'string') {
    const isPageLoaded = isPage && document.readyState === 'complete';
    if (!isPageLoaded) {
      throw new Error(`createGLContext called on canvas '${canvas}' before page was loaded`);
    }
    // TODO - check type?
    return document.getElementById(canvas) as HTMLCanvasElement;
  }

  return canvas;
}
