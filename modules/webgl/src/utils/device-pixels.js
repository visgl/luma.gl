/* global window */

// multiplier need to convert CSS size to Device size
export function cssToDeviceRatio(gl) {
  return gl.drawingBufferWidth / (gl.canvas.clientWidth || gl.canvas.width);
}

// Maps CSS pixel position to device pixel position
export function cssToDevicePixels(gl, cssPixel, yInvert = true) {
  const ratio = cssToDeviceRatio(gl);
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  return scalePixels(cssPixel, ratio, width, height, yInvert);
}

// HELPER METHODS

/**
 * Calulates device pixel ratio, used during context creation
 *
 * @param {boolean or Number} useDevicePixels - boolean or a Number
 * @return {Number} - device pixel ratio
 */
export function getDevicePixelRatio(useDevicePixels) {
  const windowRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  if (Number.isFinite(useDevicePixels)) {
    return useDevicePixels <= 0 ? 1 : useDevicePixels;
  }
  return useDevicePixels ? windowRatio : 1;
}

// PRIVATE

function scalePixels(pixel, ratio, width, height, yInvert) {
  // since we are rounding to nearest, when dpr > 1, edge pixels may point to out of bounds value, clamp to the limit
  const x = Math.min(Math.round(pixel[0] * ratio), width - 1);
  const y = yInvert
    ? Math.max(0, height - Math.ceil(ratio) - Math.round(pixel[1] * ratio))
    : Math.min(Math.round(pixel[1] * ratio), height - 1);

  return [x, y];
}
