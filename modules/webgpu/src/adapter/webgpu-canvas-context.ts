// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// / <reference types="@webgpu/types" />

import type {Texture, TextureFormat, CanvasContextProps} from '@luma.gl/core';
import {CanvasContext, log} from '@luma.gl/core';
import {getWebGPUTextureFormat} from './helpers/convert-texture-format';
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
  readonly gpuCanvasContext: GPUCanvasContext;
  /** Format of returned textures: "bgra8unorm", "rgba8unorm", "rgba16float". */
  readonly format: TextureFormat = navigator.gpu.getPreferredCanvasFormat() as TextureFormat;
  /** Default stencil format for depth textures */
  readonly depthStencilFormat: TextureFormat = 'depth24plus';

  private depthStencilAttachment: Texture | null = null;

  get [Symbol.toStringTag](): string {
    return 'WebGPUCanvasContext';
  }

  constructor(device: WebGPUDevice, adapter: GPUAdapter, props: CanvasContextProps) {
    super(props);
    this.device = device;

    // @ts-ignore TODO - we don't handle OffscreenRenderingContext.
    this.gpuCanvasContext = this.canvas.getContext('webgpu');
    // TODO this has been replaced
    // this.format = this.gpuCanvasContext.getPreferredFormat(adapter);
    this.format = 'bgra8unorm';

    // Base class constructor cannot access derived methods/fields, so we need to call these functions in the subclass constructor
    this._setAutoCreatedCanvasId(`${this.device.id}-canvas`);
    this.updateSize([this.drawingBufferWidth, this.drawingBufferHeight]);
  }

  /** Destroy any textures produced while configured and remove the context configuration. */
  destroy(): void {
    this.gpuCanvasContext.unconfigure();
  }

  /** Update framebuffer with properly resized "swap chain" texture views */
  getCurrentFramebuffer(): WebGPUFramebuffer {
    // Wrap the current canvas context texture in a luma.gl texture
    const currentColorAttachment = this.getCurrentTexture();
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
    this._createDepthStencilAttachment();

    return new WebGPUFramebuffer(this.device, {
      colorAttachments: [currentColorAttachment],
      depthStencilAttachment: this.depthStencilAttachment
    });
  }

  /** Resizes and updates render targets if necessary */
  updateSize(size: [newWidth: number, newHeight: number]): void {
    if (this.depthStencilAttachment) {
      this.depthStencilAttachment.destroy();
      this.depthStencilAttachment = null;
    }

    // Reconfigure the canvas size.
    // https://www.w3.org/TR/webgpu/#canvas-configuration
    this.gpuCanvasContext.configure({
      device: this.device.handle,
      format: getWebGPUTextureFormat(this.format),
      // Can be used to define e.g. -srgb views
      // viewFormats: [...]
      colorSpace: this.props.colorSpace,
      alphaMode: this.props.alphaMode
    });
  }

  resize(options?: {width?: number; height?: number; useDevicePixels?: boolean | number}): void {
    if (!this.device.handle) return;

    if (this.props.autoResize) {
      return;
    }

    // Resize browser context .
    if (this.canvas) {
      const devicePixelRatio = this.getDevicePixelRatio(options?.useDevicePixels);
      this._setDevicePixelRatio(devicePixelRatio, options);
      return;
    }
  }

  /** Wrap the current canvas context texture in a luma.gl texture */
  getCurrentTexture(): WebGPUTexture {
    return this.device.createTexture({
      id: `${this.id}#color-texture`,
      handle: this.gpuCanvasContext.getCurrentTexture(),
      format: this.format
    });
  }

  /** We build render targets on demand (i.e. not when size changes but when about to render) */
  _createDepthStencilAttachment() {
    if (!this.depthStencilAttachment) {
      this.depthStencilAttachment = this.device.createTexture({
        id: `${this.id}#depth-stencil-texture`,
        format: this.depthStencilFormat,
        width: this.drawingBufferWidth,
        height: this.drawingBufferHeight,
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      });
    }
    return this.depthStencilAttachment;
  }
}
