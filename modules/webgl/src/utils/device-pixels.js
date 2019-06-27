/**
 * Calulates device pixel ratio
 *
 * @param {boolean or Number} useDevicePixels - gl context
 * @param {Number} windowPixelRatio - device supported pixel ratio
 * @return {Number} - device pixel ratio
 */
export function getDevicePixelRatio(useDevicePixels, windowPixelRatio) {
  const windowRatio = windowPixelRatio || 1;
  if (Number.isFinite(useDevicePixels)) {
    return useDevicePixels <= 0 ? 1 : useDevicePixels;
  }
  return useDevicePixels ? windowRatio : 1;
}

// Converts window pixel x position to device pixel x position
export function mapToDevicePositionX(x, gl) {
  const dpr = gl.drawingBufferWidth / gl.canvas.clientWidth;
  // since we are rounding to nearest, when dpr < 1, edge pixels may point to out of bounds value, clamp to the limit
  return Math.min(Math.round(x * dpr), gl.drawingBufferWidth - 1);
}

// Converts window y position to device y position
export function mapToDevicePositionY(y, gl, yInvert = true) {
  const dpr = gl.drawingBufferHeight / gl.canvas.clientHeight;
  let deviceY = Math.round(y * dpr);
  if (yInvert) {
    deviceY = Math.max(0, gl.drawingBufferHeight - Math.ceil(dpr) - Math.round(y * dpr));
  }
  return Math.min(deviceY, gl.drawingBufferHeight - 1);
}

// Maps window postion to device position
export function mapToDevicePosition(position, gl, yInvert = true) {
  return [mapToDevicePositionX(position[0], gl), mapToDevicePositionY(position[1], gl, yInvert)];
}
