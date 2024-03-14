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

  constructor(device: WebGPUDevice, adapter: GPUAdapter, props: CanvasContextProps) {
    super(props);
    this.device = device;
    // TODO - hack to trigger resize?
    this.width = -1;
    this.height = -1;

    this._setAutoCreatedCanvasId(`${this.device.id}-canvas`);
    // @ts-ignore TODO - we don't handle OffscreenRenderingContext.
    this.gpuCanvasContext = this.canvas.getContext('webgpu');
    // TODO this has been replaced
    // this.format = this.gpuCanvasContext.getPreferredFormat(adapter);
    this.format = 'bgra8unorm';
  }

  /** Destroy any textures produced while configured and remove the context configuration. */
  destroy(): void {
    this.gpuCanvasContext.unconfigure();
  }

  /** Update framebuffer with properly resized "swap chain" texture views */
  getCurrentFramebuffer(): WebGPUFramebuffer {
    // Ensure the canvas context size is updated
    this.update();

    // Wrap the current canvas context texture in a luma.gl texture
    // const currentColorAttachment = this.device.createTexture({
    //   id: 'default-render-target',
    //   handle: this.gpuCanvasContext.getCurrentTexture(),
    //   format: this.format,
    //   width: this.width,
    //   height: this.height
    // });

    // Wrap the current canvas context texture in a luma.gl texture
    const currentColorAttachment = this.getCurrentTexture();
    this.width = currentColorAttachment.width;
    this.height = currentColorAttachment.height;

    // Resize the depth stencil attachment
    this._createDepthStencilAttachment();

    return new WebGPUFramebuffer(this.device, {
      colorAttachments: [currentColorAttachment],
      depthStencilAttachment: this.depthStencilAttachment
    });
  }

  /** Resizes and updates render targets if necessary */
  update() {
    const [width, height] = this.getPixelSize();

    const sizeChanged = width !== this.width || height !== this.height;

    if (sizeChanged) {
      this.width = width;
      this.height = height;

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

      log.log(1, `Resized to ${this.width}x${this.height}px`)();
    }
  }

  resize(options?: {width?: number; height?: number; useDevicePixels?: boolean | number}): void {
    this.update();
  }

  /** Wrap the current canvas context texture in a luma.gl texture */
  getCurrentTexture(): WebGPUTexture {
    return this.device._createTexture({
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
        width: this.width,
        height: this.height,
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      });
    }
    return this.depthStencilAttachment;
  }
}
