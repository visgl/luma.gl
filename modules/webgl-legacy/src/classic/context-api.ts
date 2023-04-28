// luma.gl, MIT license
// LEGACY luma.gl v8 API for WebGLRendering context
// DEPRECATED API - may be removed in luma.gl v9 or v10.

/* eslint-disable quotes */
import type {Device, DeviceProps} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {WebGLDevice} from '@luma.gl/webgl';
import {DEPRECATED_FEATURES, DEPRECATED_TO_CLASSIC_FEATURES} from './features';

export type GLContextOptions = DeviceProps & {
  throwOnError?: boolean; // If set to false, return `null` if context creation fails.
  onContextLost?: (event: Event) => void;
  onContextRestored?: (event: Event) => void;
};

/** @deprecated Use `new WebGLDevice()` or `luma.createDevice()` */
export function createGLContext(options?: GLContextOptions): WebGLRenderingContext | null {
  const webglDevice = new WebGLDevice(options);
  // Note: OK to return the context, it holds on to the device
  return webglDevice.gl;
}

/** @deprecated Use `WebGLDevice.attach()` */
export function instrumentGLContext(gl: WebGLRenderingContext | WebGL2RenderingContext, options?: GLContextOptions): WebGLRenderingContext {
  const webglDevice = WebGLDevice.attach(gl);
  return webglDevice.gl;
}

/**
 * Resize the canvas' drawing buffer.
 *
 * Can match the canvas CSS size, and optionally also consider devicePixelRatio
 * Can be called every frame
 *
 * Regardless of size, the drawing buffer will always be scaled to the viewport, but
 * for best visual results, usually set to either:
 *  canvas CSS width x canvas CSS height
 *  canvas CSS width * devicePixelRatio x canvas CSS height * devicePixelRatio
 * See http://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
 *
 * resizeGLContext(gl, {width, height, useDevicePixels})
 * @deprecated Use WebGLDevice.resize()
 */
export function resizeGLContext(
  device: Device | WebGLRenderingContext,
  options?: {
    width?: number;
    height?: number;
    useDevicePixels?: boolean | number;
  }
) {
  const webglDevice = WebGLDevice.attach(device);
  webglDevice.canvasContext.resize(options);
}

/**
 * Check one or more features
 * @deprecated Use `WebGLDevice.features.has()`
*/
export function hasFeatures(device: Device | WebGLRenderingContext, features: string | string[]): boolean {
  const webglDevice = WebGLDevice.attach(device);
  const normalizedFeatures = Array.isArray(features) ? features : [features];
  const deviceFeatures = normalizedFeatures.map(feature => classicToDeviceFeature(feature));
  // @ts-expect-error Feature is a string enum
  return deviceFeatures.every((feature) => webglDevice.features.has(feature));
}

function classicToDeviceFeature(feature: string): string {
  return DEPRECATED_TO_CLASSIC_FEATURES[feature];
  // const deviceFeature = feature.toLowerCase().replace(/\_/g, '-');
  // if (deviceFeature.startsWith('webgl2') || deviceFeature.startsWith('glsl-')) {
  //   return deviceFeature;
  // }
  // return `webgl-${deviceFeature}`;
}

/**
 * Check one feature
 * @deprecated Use `WebGLDevice.features`
 */
export function hasFeature(device: Device | WebGLRenderingContext, feature: string): boolean {
  return hasFeatures(device, feature);
}

/**
 * Return a map of supported features
 * @deprecated Use `WebGLDevice.features`
 */
export function getFeatures(device: Device | WebGLRenderingContext): Record<string, boolean>  {
  const webglDevice = WebGLDevice.attach(device);
  const featureMap: Record<string, boolean> = {};
  for (const feature in DEPRECATED_FEATURES) {
    // @ts-expect-error Feature is a string enum
    featureMap[feature] = webglDevice.features.has(classicToDeviceFeature(feature));
  }
  return featureMap;
}

/**
 * Provides strings identifying the GPU vendor and driver.
 * https://www.khronos.org/registry/webgl/extensions/WEBGL_debug_renderer_info/
 *
 * @deprecated Use `WebGLDevice.info`
 */
export function getContextDebugInfo(gl: WebGLRenderingContext): {
  vendor: string;
  renderer: string;
  vendorMasked: string;
  rendererMasked: string;
  version: string;
} {
  const webglDevice = WebGLDevice.attach(gl);
  // const info = webglDevice.info;
  return {
    ...webglDevice.info,
    vendorMasked: webglDevice.info.vendor,
    rendererMasked: webglDevice.info.renderer
  };
}

/** @deprecated Use `WebGLDevice.info` */
export function getGLContextInfo(gl: WebGLRenderingContext) {
  const info = getContextDebugInfo(gl);
  return {
    [GL.UNMASKED_VENDOR_WEBGL]: info.vendor,
    [GL.UNMASKED_RENDERER_WEBGL]: info.renderer,
    [GL.VENDOR]: info.vendorMasked,
    [GL.RENDERER]: info.rendererMasked,
    [GL.VERSION]: info.version,
  };
}

/** @deprecated Use `WebGLDevice.info` and `WebGLDevice.limits` */
export function getContextInfo(gl: WebGLRenderingContext) {
  return {
    ...getContextDebugInfo(gl),
    ...getContextLimits(gl),
    info: getGLContextInfo(gl),
  };
}

/** @deprecated Use `WebGLDevice.limits` */
export function getContextLimits(gl: WebGLRenderingContext) {
  const webglDevice = WebGLDevice.attach(gl);
  return {limits: webglDevice.webglLimits};
}
