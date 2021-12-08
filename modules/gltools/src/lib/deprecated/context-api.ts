// luma.gl, MIT license
// LEGACY v8 API for WebGLRendering context

/* eslint-disable quotes */
import GL from '@luma.gl/constants';
import {WebGLDevice, WebGLDeviceProps} from '@luma.gl/webgl';
import {FEATURES} from './features';

export type GLContextOptions = WebGLDeviceProps & {
  throwOnError?: boolean; // If set to false, return `null` if context creation fails.
};

export function createGLContext(options?: GLContextOptions): WebGLRenderingContext | null {
  const webglDevice = new WebGLDevice(options);
  // Note: OK to return the context, it holds on to the device
  return webglDevice.gl;
}

export function instrumentGLContext(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  options?: GLContextOptions
): WebGLRenderingContext {
  const webglDevice = WebGLDevice.attach(gl, options);
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
 */
export function resizeGLContext(
  gl: WebGLRenderingContext,
  options?: {
    width?: number;
    height?: number;
    useDevicePixels?: boolean | number;
  }
) {
  const webglDevice = WebGLDevice.attach(gl);
  webglDevice.resize(options);
}

/** Check one or more features */
export function hasFeatures(gl: WebGLRenderingContext, features: string | string[]): boolean {
  const webglDevice = WebGLDevice.attach(gl);
  const normalizedFeatures = Array.isArray(features) ? features : [features];
  const deviceFeatures = normalizedFeatures.map(feature => getDeviceFeature(feature));
  return deviceFeatures.every((feature) => webglDevice.webglFeatures.has(feature));
}

function getDeviceFeature(feature) {
  return feature.toLowerCase().replace('webgl-', '').replace('-', '_');
}

// DEPRECATED API

/**
 * Check one feature
 * @deprecated Use `WebGLDevice.webglFeatures` or `getFeatures()`
 */
export function hasFeature(gl: WebGLRenderingContext, feature: string): boolean {
  return hasFeatures(gl, feature);
}

/**
 * Return a map of supported features
 * @deprecated Use `WebGLDevice.webglFeatures`
 */
export function getFeatures(gl: WebGLRenderingContext): Record<string, boolean>  {
  const webglDevice = WebGLDevice.attach(gl);
  const featureMap: Record<string, boolean> = {};
  for (const feature in FEATURES) {
    featureMap[feature] = webglDevice.webglFeatures.has(feature);
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
  const info = webglDevice.info;
  return {
    ...webglDevice.info,
    vendorMasked: webglDevice.info.vendor,
    rendererMasked: webglDevice.info.renderer
  };
}

/** @deprecated Use `WebGLDevice.info` */
export function getGLContextInfo(gl) {
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
export function getContextInfo(gl) {
  return {
    ...getContextDebugInfo(gl),
    ...getContextLimits(gl),
    info: getGLContextInfo(gl),
  };
}

/** @deprecated Use `WebGLDevice.limits` */
export function getContextLimits(gl) {
  const webglDevice = WebGLDevice.attach(gl);
  return {limits: webglDevice.webglLimits};
}
