// luma.gl, MIT license
import { getDevicePixelRatio, setDevicePixelRatio } from "./device-pixels";
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
  // Resize browser context .
  if (gl.canvas) {
    const devicePixelRatio = getDevicePixelRatio(options?.useDevicePixels);
    setDevicePixelRatio(gl, devicePixelRatio, options);
    return;
  }

  // Resize headless gl context
  const ext = gl.getExtension('STACKGL_resize_drawingbuffer');
  if (ext && options && `width` in options && `height` in options) {
    ext.resize(options.width, options.height);
  }
}
