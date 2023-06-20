// luma.gl, MIT license
import type {CanvasContextProps} from '@luma.gl/api';
import {CanvasContext} from '@luma.gl/api';
import {WebGLDevice} from './webgl-device';
import {WEBGLFramebuffer} from './resources/webgl-framebuffer';

/** 
 * A WebGL Canvas Context which manages the canvas and handles drawing buffer resizing etc 
 */
export class WebGLCanvasContext extends CanvasContext {
  readonly device: WebGLDevice;
  presentationSize: [number, number];
  private _framebuffer: WEBGLFramebuffer | null = null;

  constructor(device: WebGLDevice, props: CanvasContextProps) {
    // Note: Base class creates / looks up the canvas (unless under Node.js)
    super(props);
    this.device = device;
    this.presentationSize = [-1, -1];
    this._setAutoCreatedCanvasId(`${this.device.id}-canvas`);
    this.update();
  }

  getCurrentFramebuffer(): WEBGLFramebuffer {
    this.update();
    // Setting handle to null returns a reference to the default framebuffer
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
      this.setDevicePixelRatio(devicePixelRatio, options);
      return;
    }

    // Resize headless gl context
    const ext = this.device.gl.getExtension('STACKGL_resize_drawingbuffer');
    if (ext && options && 'width' in options && 'height' in options) {
      ext.resize(options.width, options.height);
    }
  }

  commit() {
    // gl.commit was ultimately removed from standard??
    // if (this.offScreen && this.gl.commit) {
    //   // @ts-expect-error gl.commit is not officially part of WebGLRenderingContext
    //   this.gl.commit();
    // }
  }
}
