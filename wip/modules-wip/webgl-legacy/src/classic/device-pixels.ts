// luma.gl, MIT license

import type {Device} from '@luma.gl/core';
import {WebGLDevice} from '@luma.gl/webgl';

/**
 * Returns multiplier need to convert CSS size to Device size
 * @deprecated Use device.canvasContext.cssToDeviceRatio
 */
export function cssToDeviceRatio(device: Device | WebGLRenderingContext): number {
  const webglDevice = WebGLDevice.attach(device);
  return webglDevice.canvasContext.cssToDeviceRatio();
}

/**
 * Maps CSS pixel position to device pixel position
 * @deprecated Use device.canvasContext.cssToDevicePixels
 */
export function cssToDevicePixels(
  device: Device | WebGLRenderingContext,
  cssPixel: number[],
  yInvert: boolean = true
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const webglDevice = WebGLDevice.attach(device);
  return webglDevice.canvasContext.cssToDevicePixels(cssPixel, yInvert);
}

/**
 * Calulates device pixel ratio, used during context creation
 *
 * @param useDevicePixels - boolean or a number
 * @return - device pixel ratio
 * @deprecated Use device.canvasContext.getDevicePixelRatio
 */
export function getDevicePixelRatio(useDevicePixels: boolean | number): number {
  const windowRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  if (Number.isFinite(useDevicePixels)) {
    // @ts-expect-error Can no longer be boolean after previous line
    return useDevicePixels <= 0 ? 1 : useDevicePixels;
  }
  return useDevicePixels ? windowRatio : 1;
}

/**
 * Use devicePixelRatio to set canvas width and height
 * @deprecated Use device.canvasContext.setDevicePixelRatio
 */ 
export function setDevicePixelRatio(device: Device | WebGLRenderingContext, devicePixelRatio: number, options: {width?: number, height?: number} = {}) {
  const webglDevice = WebGLDevice.attach(device);
  return webglDevice.canvasContext.setDevicePixelRatio(devicePixelRatio, options);
}
