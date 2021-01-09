/**
 * Returns multiplier need to convert CSS size to Device size
 */
export function cssToDeviceRatio(gl: WebGLRenderingContext): number;

/**
 * Maps CSS pixel position to device pixel position
 */
export function cssToDevicePixels(
  gl: WebGLRenderingContext,
  cssPixel: number[],
  yInvert?: boolean
): {
  x: number;
  y: number;
  width: number;
  height: number;
};

// INTERNAL HELPER

/**
 * Calulates device pixel ratio, used during context creation
 *
 * @param useDevicePixels - boolean or a number
 * @return - device pixel ratio
 */
export function getDevicePixelRatio(useDevicePixels: boolean | number): number;
