// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// prettier-ignore
// / <reference types="@webgpu/types" />

import type {TextureFormatDepthStencil, CanvasContextProps} from '@luma.gl/core';
import {CanvasContext, Texture, log} from '@luma.gl/core';
import {WebGPUDevice} from './webgpu-device';
import {WebGPUFramebuffer} from './resources/webgpu-framebuffer';
import {WebGPUTexture} from './resources/webgpu-texture';

/**
 * Holds a WebGPU Canvas Context
 * The primary job of the CanvasContext is to generate textures for rendering into the current canvas
 * It also manages canvas sizing calculations and resizing.
 */
export class WebGPUCanvasContext extends CanvasContext {
  readonly device: WebGPUDevice;
  readonly handle: GPUCanvasContext;

  private depthStencilAttachment: WebGPUTexture | null = null;

  get [Symbol.toStringTag](): string {
    return 'WebGPUCanvasContext';
  }

  constructor(device: WebGPUDevice, adapter: GPUAdapter, props: CanvasContextProps) {
    super(props);

    const context = this.canvas.getContext('webgpu');
    if (!context) {
      throw new Error(`${this}: Failed to create WebGPU canvas context`);
    }
    this.device = device;
    this.handle = context;

    // Base class constructor cannot access derived methods/fields, so we need to call these functions in the subclass constructor
    this._setAutoCreatedCanvasId(`${this.device.id}-canvas`);
    this._updateDevice();
  }

  /** Destroy any textures produced while configured and remove the context configuration. */
  override destroy(): void {
    this.handle.unconfigure();
    super.destroy();
  }

  /** Update framebuffer with properly resized "swap chain" texture views */
  _getCurrentFramebuffer(
    options: {depthStencilFormat?: TextureFormatDepthStencil | false} = {
      depthStencilFormat: 'depth24plus'
    }
  ): WebGPUFramebuffer {
    // Wrap the current canvas context texture in a luma.gl texture
    const currentColorAttachment = this._getCurrentTexture();
    // TODO - temporary debug code
    if (
      currentColorAttachment.width !== this.drawingBufferWidth ||
      currentColorAttachment.height !== this.drawingBufferHeight
    ) {
      const [oldWidth, oldHeight] = this.getDrawingBufferSize();
      this.drawingBufferWidth = currentColorAttachment.width;
      this.drawingBufferHeight = currentColorAttachment.height;
      log.log(
        1,
        `${this}: Resized to compensate for initial canvas size mismatch ${oldWidth}x${oldHeight} => ${this.drawingBufferWidth}x${this.drawingBufferHeight}px`
      )();
    }

    // Resize the depth stencil attachment
    if (options?.depthStencilFormat) {
      this._createDepthStencilAttachment(options?.depthStencilFormat);
    }

    return new WebGPUFramebuffer(this.device, {
      colorAttachments: [currentColorAttachment],
      depthStencilAttachment: this.depthStencilAttachment
    });
  }

  // IMPLEMENTATION OF ABSTRACT METHODS

  _updateDevice(): void {
    if (this.depthStencilAttachment) {
      this.depthStencilAttachment.destroy();
      this.depthStencilAttachment = null;
    }

    // Reconfigure the canvas size.
    // https://www.w3.org/TR/webgpu/#canvas-configuration
    this.handle.configure({
      device: this.device.handle,
      format: this.device.preferredColorFormat,
      // Can be used to define e.g. -srgb views
      // viewFormats: [...]
      colorSpace: this.props.colorSpace,
      alphaMode: this.props.alphaMode
    });
  }

  /** Wrap the current canvas context texture in a luma.gl texture */
  _getCurrentTexture(): WebGPUTexture {
    const handle = this.handle.getCurrentTexture();
    return this.device.createTexture({
      id: `${this.id}#color-texture`,
      handle,
      format: this.device.preferredColorFormat,
      width: handle.width,
      height: handle.height
    });
  }

  /** We build render targets on demand (i.e. not when size changes but when about to render) */
  _createDepthStencilAttachment(depthStencilFormat: TextureFormatDepthStencil): WebGPUTexture {
    if (!this.depthStencilAttachment) {
      this.depthStencilAttachment = this.device.createTexture({
        id: `${this.id}#depth-stencil-texture`,
        usage: Texture.RENDER_ATTACHMENT,
        format: depthStencilFormat,
        width: this.drawingBufferWidth,
        height: this.drawingBufferHeight
      });
    }
    return this.depthStencilAttachment;
  }
}
