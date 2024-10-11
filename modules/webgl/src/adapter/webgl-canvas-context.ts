// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CanvasContextProps} from '@luma.gl/core';
import {CanvasContext} from '@luma.gl/core';
import {WebGLDevice} from './webgl-device';
import {WEBGLFramebuffer} from './resources/webgl-framebuffer';

/**
 * A WebGL Canvas Context which manages the canvas and handles drawing buffer resizing etc
 */
export class WebGLCanvasContext extends CanvasContext {
  readonly device: WebGLDevice;
  readonly handle: unknown = null;

  private _framebuffer: WEBGLFramebuffer | null = null;

  get [Symbol.toStringTag](): string {
    return 'WebGLCanvasContext';
  }

  constructor(device: WebGLDevice, props: CanvasContextProps) {
    // Note: Base class creates / looks up the canvas (unless under Node.js)
    super(props);
    this.device = device;

    // Base class constructor cannot access derived methods/fields, so we need to call these functions in the subclass constructor
    this._setAutoCreatedCanvasId(`${this.device.id}-canvas`);
    this.updateSize([this.drawingBufferWidth, this.drawingBufferHeight]);
  }

  getCurrentFramebuffer(): WEBGLFramebuffer {
    // Setting handle to null returns a reference to the default framebuffer
    this._framebuffer = this._framebuffer || new WEBGLFramebuffer(this.device, {handle: null});
    return this._framebuffer;
  }

  updateSize(size: [number, number]): void {}

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
    if (!this.device.gl) return;

    // Resize browser context. TODO - this likely needs to be rewritten
    if (this.canvas) {
      const devicePixelRatio = this.getDevicePixelRatio(options?.useDevicePixels);
      this._setDevicePixelRatio(devicePixelRatio, options);
      return;
    }
  }

  commit() {
    // gl.commit was ultimately removed from the WebGL standard??
    // if (this.offScreen && this.gl.commit) {
    //   // @ts-expect-error gl.commit is not officially part of WebGL2RenderingContext
    //   this.gl.commit();
    // }
  }
}
