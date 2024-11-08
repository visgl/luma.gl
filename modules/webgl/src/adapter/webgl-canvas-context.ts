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
    this._updateDevice();
  }

  getCurrentFramebuffer(): WEBGLFramebuffer {
    // Setting handle to null returns a reference to the default framebuffer
    this._framebuffer = this._framebuffer || new WEBGLFramebuffer(this.device, {handle: null});
    return this._framebuffer;
  }

  // IMPLEMENTATION OF ABSTRACT METHODS

  _updateDevice(): void {}
}
