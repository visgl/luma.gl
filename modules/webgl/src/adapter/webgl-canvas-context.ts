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
    this._configureDevice();
  }

  // IMPLEMENTATION OF ABSTRACT METHODS

  _configureDevice(): void {
    const shouldResize =
      this.drawingBufferWidth !== this._framebuffer?.width ||
      this.drawingBufferHeight !== this._framebuffer?.height;
    if (shouldResize) {
      this._framebuffer?.resize([this.drawingBufferWidth, this.drawingBufferHeight]);
    }
  }

  _getCurrentFramebuffer(): WEBGLFramebuffer {
    this._framebuffer ||= new WEBGLFramebuffer(this.device, {
      id: 'canvas-context-framebuffer',
      handle: null, // Setting handle to null returns a reference to the default WebGL framebuffer
      width: this.drawingBufferWidth,
      height: this.drawingBufferHeight
    });
    return this._framebuffer;
  }
}
