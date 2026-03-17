// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PresentationContextProps, TextureFormatDepthStencil, Framebuffer} from '@luma.gl/core';
import {PresentationContext} from '@luma.gl/core';
import type {WebGLDevice} from './webgl-device';

type PresentationCanvasRenderingContext2D =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;

/**
 * Tracks a non-WebGL destination canvas while rendering into the device's default canvas context.
 */
export class WebGLPresentationContext extends PresentationContext {
  readonly device: WebGLDevice;
  readonly handle = null;
  readonly context2d: PresentationCanvasRenderingContext2D;

  get [Symbol.toStringTag](): string {
    return 'WebGLPresentationContext';
  }

  constructor(device: WebGLDevice, props: PresentationContextProps = {}) {
    super(props);
    this.device = device;
    const contextLabel = `${this[Symbol.toStringTag]}(${this.id})`;

    const defaultCanvasContext = this.device.getDefaultCanvasContext();
    if (!defaultCanvasContext.offscreenCanvas) {
      throw new Error(
        `${contextLabel}: WebGL PresentationContext requires the default CanvasContext canvas to be an OffscreenCanvas`
      );
    }

    const context2d = this.canvas.getContext('2d');
    if (!context2d) {
      throw new Error(`${contextLabel}: Failed to create 2d presentation context`);
    }
    this.context2d = context2d;

    this._setAutoCreatedCanvasId(`${this.device.id}-presentation-canvas`);
    this._configureDevice();
    this._startObservers();
  }

  present(): void {
    this._resizeDrawingBufferIfNeeded();
    this.device.submit();

    const defaultCanvasContext = this.device.getDefaultCanvasContext();
    const [sourceWidth, sourceHeight] = defaultCanvasContext.getDrawingBufferSize();

    // Responsive layouts can transiently collapse presentation canvases to 0x0 during reflow.
    // In that case WebGL has nothing meaningful to present, and drawImage() would throw when the
    // offscreen source canvas has zero width or height.
    if (
      this.drawingBufferWidth === 0 ||
      this.drawingBufferHeight === 0 ||
      sourceWidth === 0 ||
      sourceHeight === 0 ||
      defaultCanvasContext.canvas.width === 0 ||
      defaultCanvasContext.canvas.height === 0
    ) {
      return;
    }

    if (
      sourceWidth !== this.drawingBufferWidth ||
      sourceHeight !== this.drawingBufferHeight ||
      defaultCanvasContext.canvas.width !== this.drawingBufferWidth ||
      defaultCanvasContext.canvas.height !== this.drawingBufferHeight
    ) {
      throw new Error(
        `${this[Symbol.toStringTag]}(${this.id}): Default canvas context size ${sourceWidth}x${sourceHeight} does not match presentation size ${this.drawingBufferWidth}x${this.drawingBufferHeight}`
      );
    }

    this.context2d.clearRect(0, 0, this.drawingBufferWidth, this.drawingBufferHeight);
    this.context2d.drawImage(defaultCanvasContext.canvas, 0, 0);
  }

  protected override _configureDevice(): void {}

  protected override _getCurrentFramebuffer(options?: {
    depthStencilFormat?: TextureFormatDepthStencil | false;
  }): Framebuffer {
    const defaultCanvasContext = this.device.getDefaultCanvasContext();
    defaultCanvasContext.setDrawingBufferSize(this.drawingBufferWidth, this.drawingBufferHeight);
    return defaultCanvasContext.getCurrentFramebuffer(options);
  }
}
