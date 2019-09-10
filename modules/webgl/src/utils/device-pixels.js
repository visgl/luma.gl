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
  const xLow = scaleX(pixel[0], ratio, width);
  const yLow = scaleY(pixel[1], ratio, height, yInvert);

  // Find boundaries of next pixel to provide valid range of device pixel locaitons

  let t = scaleX(pixel[0] + 1, ratio, width);
  // If next pixel's position is clamped to boundary, use it as is, otherwise subtract 1 for current pixel boundary
  const xHigh = t === width - 1 ? t : t - 1;

  t = scaleY(pixel[1] + 1, ratio, height, yInvert);
  // Handle boundary and detla for y-inversion
  const yBoundary = yInvert ? 0 : height - 1;
  const yDelta = yInvert ? -1 : 1;
  // If next pixel's position is clamped to boundary, use it as is, otherwise subtract delta for current pixel boundary
  const yHigh = t === yBoundary ? t : t - yDelta;

  return {
    low: [xLow, yLow],
    high: [xHigh, yHigh]
  };
}

function scaleX(x, ratio, width) {
  return Math.min(Math.round(x * ratio), width - 1);
}

function scaleY(y, ratio, height, yInvert) {
  return yInvert
    ? Math.max(0, height - 1 - Math.round(y * ratio))
    : Math.min(Math.round(y * ratio), height - 1);
}
