// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CanvasContextProps, TextureFormat} from '@luma.gl/core';
import {CanvasContext} from '@luma.gl/core';
import type {NullDevice} from './null-device';
import {NullFramebuffer} from './resources/null-framebuffer';

/**
 * A WebGL Canvas Context which manages the canvas and handles drawing buffer resizing etc
 */
export class NullCanvasContext extends CanvasContext {
  readonly device: NullDevice;
  readonly format: TextureFormat = 'rgba8unorm';
  readonly depthStencilFormat: TextureFormat = 'depth24plus';

  presentationSize: [number, number];
  private _framebuffer: NullFramebuffer | null = null;

  get [Symbol.toStringTag]() {
    return 'NullCanvasContext';
  }

  constructor(device: NullDevice, props: CanvasContextProps) {
    // Note: Base class creates / looks up the canvas (unless under Node.js)
    super(props);
    this.device = device;

    // Base class constructor cannot access derived methods/fields, so we need to call these functions in the subclass constructor
    this._setAutoCreatedCanvasId(`${this.device.id}-canvas`);
    this.updateSize([this.drawingBufferWidth, this.drawingBufferHeight]);
  }

  getCurrentFramebuffer(): NullFramebuffer {
    // Setting handle to null returns a reference to the default framebuffer
    this._framebuffer = this._framebuffer || new NullFramebuffer(this.device, {handle: null});
    return this._framebuffer;
  }

  /** Resizes and updates render targets if necessary */
  updateSize(size: [number, number]) {}

  resize(options?: {width?: number; height?: number; useDevicePixels?: boolean | number}): void {
    throw new Error('not implemented');
  }

  commit() {}
}
