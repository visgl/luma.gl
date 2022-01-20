// luma.gl, MIT license
import type {CanvasContextProps} from '@luma.gl/api';
import {CanvasContext} from '@luma.gl/api';
import {getDevicePixelRatio, setDevicePixelRatio} from '../context/context/device-pixels';
import WebGLDevice from './webgl-device';
import WEBGLFramebuffer from './resources/webgl-framebuffer';

/** 
 * Holds a WebGL Canvas Context which will handle drawing buffer resizing etc 
 * @todo This class is WIP, intended to replace the old gltools-based context size tracking
 */
export default class WebGLCanvasContext extends CanvasContext {
  device: WebGLDevice;
  presentationSize: [number, number];
  private _framebuffer: WEBGLFramebuffer;

  constructor(device: WebGLDevice, props: CanvasContextProps) {
    // Note: Base class creates / looks up the canvas (unless under Node.js)
    super(props);
    this.device = device;
    this.presentationSize = [-1, -1];
    this.update();
  }

  getCurrentFramebuffer(): WEBGLFramebuffer {
    this.update();
    this._framebuffer = this._framebuffer || new WEBGLFramebuffer(this.device, {handle: null});
    return this._framebuffer;
  }

  /** Resizes and updates render targets if necessary */
  update() {
    const size = this.getPixelSize();
    const sizeChanged = size[0] !== this.presentationSize[0] || size[1] !== this.presentationSize[1];
    if (sizeChanged) {
      this.presentationSize = size;
    }
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
   */
   resize(options?: {width?: number; height?: number; useDevicePixels?: boolean | number}): void {
    // Resize browser context .
    if (this.canvas) {
      const devicePixelRatio = getDevicePixelRatio(options?.useDevicePixels);
      setDevicePixelRatio(this.device.gl, devicePixelRatio, options);
      return;
    }

    // Resize headless gl context
    const ext = this.device.gl.getExtension('STACKGL_resize_drawingbuffer');
    if (ext && options && `width` in options && `height` in options) {
      ext.resize(options.width, options.height);
    }
  }

  commit() {
    // gl.commit was ultimately removed??
    // if (this.offScreen && this.gl.commit) {
    //   // @ts-expect-error gl.commit is not officially part of WebGLRenderingContext
    //   this.gl.commit();
    // }
  }
}
