/** @typedef {import('./device-pixels')} types */

/**
 * Returns multiplier need to convert CSS size to Device size
 * @type {types['cssToDeviceRatio']}
 */
export function cssToDeviceRatio(gl) {
  // @ts-ignore
  const {luma} = gl;

  if (gl.canvas && luma) {
    // For headless gl we might have used custom width and height
    // hence prioritize cached clientWidth
    const cachedSize = luma.canvasSizeInfo;
    const clientWidth =
      'clientWidth' in cachedSize ? cachedSize.clientWidth : gl.canvas.clientWidth;
    return clientWidth ? gl.drawingBufferWidth / clientWidth : 1;
  }
  // use default device pixel ratio
  return 1;
}

/**
 * Maps CSS pixel position to device pixel position
 * @type {types['cssToDevicePixels']}
 */
export function cssToDevicePixels(gl, cssPixel, yInvert = true) {
  const ratio = cssToDeviceRatio(gl);
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  return scalePixels(cssPixel, ratio, width, height, yInvert);
}

// HELPER METHOD

/**
 * Calulates device pixel ratio, used during context creation
 * @type {types['getDevicePixelRatio']}
 */
export function getDevicePixelRatio(useDevicePixels) {
  const windowRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  if (Number.isFinite(useDevicePixels)) {
    // @ts-ignore Can no longer be boolean after previous line
    return useDevicePixels <= 0 ? 1 : useDevicePixels;
  }
  return useDevicePixels ? windowRatio : 1;
}

// PRIVATE

function scalePixels(pixel, ratio, width, height, yInvert) {
  const x = scaleX(pixel[0], ratio, width);
  let y = scaleY(pixel[1], ratio, height, yInvert);

  // Find boundaries of next pixel to provide valid range of device pixel locaitons

  let t = scaleX(pixel[0] + 1, ratio, width);
  // If next pixel's position is clamped to boundary, use it as is, otherwise subtract 1 for current pixel boundary
  const xHigh = t === width - 1 ? t : t - 1;

  t = scaleY(pixel[1] + 1, ratio, height, yInvert);
  let yHigh;
  if (yInvert) {
    // If next pixel's position is clamped to boundary, use it as is, otherwise clamp it to valid range
    t = t === 0 ? t : t + 1;
    // swap y and yHigh
    yHigh = y;
    y = t;
  } else {
    // If next pixel's position is clamped to boundary, use it as is, otherwise clamp it to valid range
    yHigh = t === height - 1 ? t : t - 1;
    // y remains same
  }
  return {
    x,
    y,
    // when ratio < 1, current css pixel and next css pixel may point to same device pixel, set width/height to 1 in those cases.
    width: Math.max(xHigh - x + 1, 1),
    height: Math.max(yHigh - y + 1, 1)
  };
}

function scaleX(x, ratio, width) {
  // since we are rounding to nearest, when ratio > 1, edge pixels may point to out of bounds value, clamp to the limit
  const r = Math.min(Math.round(x * ratio), width - 1);
  return r;
}

function scaleY(y, ratio, height, yInvert) {
  // since we are rounding to nearest, when ratio > 1, edge pixels may point to out of bounds value, clamp to the limit
  return yInvert
    ? Math.max(0, height - 1 - Math.round(y * ratio))
    : Math.min(Math.round(y * ratio), height - 1);
}
