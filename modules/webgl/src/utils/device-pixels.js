/* global window */

/**
 * Calulates device pixel ratio
 *
 * @param {boolean or Number} useDevicePixels - boolean or a Number
 * @return {Number} - device pixel ratio
 */
export function getDevicePixelRatio(useDevicePixels) {
  const windowRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  if (Number.isFinite(useDevicePixels)) {
    return useDevicePixels <= 0 ? windowRatio : useDevicePixels;
  }
  return useDevicePixels ? windowRatio : 1;
}


// Maps window postion to device position
export function mapToDevicePosition(gl, position, yInvert = true) {
  const dpr = gl.drawingBufferWidth / gl.canvas.clientWidth;

  // since we are rounding to nearest, when dpr > 1, edge pixels may point to out of bounds value, clamp to the limit
  const x = Math.min(Math.round(position[0] * dpr), gl.drawingBufferWidth - 1);
  const y = yInvert
    ? Math.max(0, gl.drawingBufferHeight - Math.ceil(dpr) - Math.round(position[1] * dpr))
    : Math.min(Math.round(position[1] * dpr), gl.drawingBufferHeight - 1);

  return [x, y];
}
