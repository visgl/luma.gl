// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TextureFormat} from '@luma.gl/shadertypes';
import type {CanvasContextProps} from '@luma.gl/core';
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

  constructor(device: NullDevice, props: CanvasContextProps) {
    // Note: Base class creates / looks up the canvas (unless under Node.js)
    super(props);
    this.device = device;
    this.presentationSize = [-1, -1];
    this._setAutoCreatedCanvasId(`${this.device.id}-canvas`);
    this.update();
  }

  getCurrentFramebuffer(): NullFramebuffer {
    this.update();
    // Setting handle to null returns a reference to the default framebuffer
    this._framebuffer = this._framebuffer || new NullFramebuffer(this.device, {handle: null});
    return this._framebuffer;
  }

  /** Resizes and updates render targets if necessary */
  update() {
    const size = this.getPixelSize();
    const sizeChanged =
      size[0] !== this.presentationSize[0] || size[1] !== this.presentationSize[1];
    if (sizeChanged) {
      this.presentationSize = size;
      this.resize();
    }
  }

  resize(options?: {width?: number; height?: number; useDevicePixels?: boolean | number}): void {
    if (this.canvas) {
      const devicePixelRatio = this.getDevicePixelRatio(options?.useDevicePixels);
      this.setDevicePixelRatio(devicePixelRatio, options);
      return;
    }
  }

  override getDrawingBufferSize(): [number, number] {
    return [this.width, this.height];
  }

  commit() {}
}
