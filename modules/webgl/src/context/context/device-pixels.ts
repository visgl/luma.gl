import {log} from '@luma.gl/api';
import {getContextState} from './context-state';

/**
 * Returns multiplier need to convert CSS size to Device size
 */
export function cssToDeviceRatio(gl: WebGLRenderingContext): number {
  const state = getContextState(gl);

  if (gl.canvas && state) {
    // For headless gl we might have used custom width and height
    // hence use cached clientWidth
    const {clientWidth} = state._canvasSizeInfo;
    return clientWidth ? gl.drawingBufferWidth / clientWidth : 1;
  }
  // use default device pixel ratio
  return 1;
}

/**
 * Maps CSS pixel position to device pixel position
 */
 export function cssToDevicePixels(
  gl: WebGLRenderingContext,
  cssPixel: number[],
  yInvert: boolean = true
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const ratio = cssToDeviceRatio(gl);
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  return scalePixels(cssPixel, ratio, width, height, yInvert);
}

/**
 * Calulates device pixel ratio, used during context creation
 *
 * @param useDevicePixels - boolean or a number
 * @return - device pixel ratio
 */
 export function getDevicePixelRatio(useDevicePixels: boolean | number): number {
  const windowRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  if (Number.isFinite(useDevicePixels)) {
    // @ts-expect-error Can no longer be boolean after previous line
    return useDevicePixels <= 0 ? 1 : useDevicePixels;
  }
  return useDevicePixels ? windowRatio : 1;
}

// use devicePixelRatio to set canvas width and height
export function setDevicePixelRatio(gl, devicePixelRatio, options: {width?: number, height?: number} = {}) {
  // NOTE: if options.width and options.height not used remove in v8
  let clientWidth = 'width' in options ? options.width : gl.canvas.clientWidth;
  let clientHeight = 'height' in options ? options.height : gl.canvas.clientHeight;

  if (!clientWidth || !clientHeight) {
    log.log(1, 'Canvas clientWidth/clientHeight is 0')();
    // by forcing devicePixel ratio to 1, we do not scale gl.canvas.width and height in each frame.
    devicePixelRatio = 1;
    clientWidth = gl.canvas.width || 1;
    clientHeight = gl.canvas.height || 1;
  }

  const contextState = getContextState(gl);
  const cachedSize = contextState._canvasSizeInfo;
  // Check if canvas needs to be resized
  if (
    cachedSize.clientWidth !== clientWidth ||
    cachedSize.clientHeight !== clientHeight ||
    cachedSize.devicePixelRatio !== devicePixelRatio
  ) {
    let clampedPixelRatio = devicePixelRatio;

    const canvasWidth = Math.floor(clientWidth * clampedPixelRatio);
    const canvasHeight = Math.floor(clientHeight * clampedPixelRatio);
    gl.canvas.width = canvasWidth;
    gl.canvas.height = canvasHeight;

    // Note: when devicePixelRatio is too high, it is possible we might hit system limit for
    // drawing buffer width and hight, in those cases they get clamped and resulting aspect ration may not be maintained
    // for those cases, reduce devicePixelRatio.
    if (gl.drawingBufferWidth !== canvasWidth || gl.drawingBufferHeight !== canvasHeight) {
      log.warn(`Device pixel ratio clamped`)();
      clampedPixelRatio = Math.min(
        gl.drawingBufferWidth / clientWidth,
        gl.drawingBufferHeight / clientHeight
      );

      gl.canvas.width = Math.floor(clientWidth * clampedPixelRatio);
      gl.canvas.height = Math.floor(clientHeight * clampedPixelRatio);
    }

    Object.assign(contextState._canvasSizeInfo, {clientWidth, clientHeight, devicePixelRatio});
  }
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
