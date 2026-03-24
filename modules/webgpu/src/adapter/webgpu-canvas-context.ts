// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// biome-ignore format: preserve layout
// / <reference types="@webgpu/types" />

import type {TextureFormatDepthStencil, CanvasContextProps} from '@luma.gl/core';
import {CanvasContext, Texture, log} from '@luma.gl/core';
import {WebGPUDevice} from './webgpu-device';
import {WebGPUFramebuffer} from './resources/webgpu-framebuffer';
import {WebGPUTexture} from './resources/webgpu-texture';
import {getCpuHotspotProfiler, getTimestamp} from './helpers/cpu-hotspot-profiler';

/**
 * Holds a WebGPU Canvas Context
 * The primary job of the CanvasContext is to generate textures for rendering into the current canvas
 * It also manages canvas sizing calculations and resizing.
 */
export class WebGPUCanvasContext extends CanvasContext {
  readonly device: WebGPUDevice;
  readonly handle: GPUCanvasContext;

  private colorAttachment: WebGPUTexture | null = null;
  private depthStencilAttachment: WebGPUTexture | null = null;
  private framebuffer: WebGPUFramebuffer | null = null;

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
    this._configureDevice();
    this._startObservers();
  }

  /** Destroy any textures produced while configured and remove the context configuration. */
  override destroy(): void {
    if (this.framebuffer) {
      this.framebuffer.destroy();
      this.framebuffer = null;
    }
    if (this.colorAttachment) {
      this.colorAttachment.destroy();
      this.colorAttachment = null;
    }
    if (this.depthStencilAttachment) {
      this.depthStencilAttachment.destroy();
      this.depthStencilAttachment = null;
    }
    this.handle.unconfigure();
    super.destroy();
  }

  // IMPLEMENTATION OF ABSTRACT METHODS

  /** @see https://www.w3.org/TR/webgpu/#canvas-configuration */
  _configureDevice(): void {
    if (this.depthStencilAttachment) {
      this.depthStencilAttachment.destroy();
      this.depthStencilAttachment = null;
    }

    // Reconfigure the canvas size.
    this.handle.configure({
      device: this.device.handle,
      format: this.device.preferredColorFormat,
      // Can be used to define e.g. -srgb views
      // viewFormats: [...]
      colorSpace: this.props.colorSpace,
      alphaMode: this.props.alphaMode
    });

    this._createDepthStencilAttachment(this.device.preferredDepthFormat);
  }

  /** Update framebuffer with properly resized "swap chain" texture views */
  _getCurrentFramebuffer(
    options: {depthStencilFormat?: TextureFormatDepthStencil | false} = {
      depthStencilFormat: 'depth24plus'
    }
  ): WebGPUFramebuffer {
    const profiler = getCpuHotspotProfiler(this.device);
    const startTime = profiler ? getTimestamp() : 0;
    if (profiler) {
      profiler.framebufferAcquireCount = (profiler.framebufferAcquireCount || 0) + 1;
      profiler.activeDefaultFramebufferAcquireDepth =
        (profiler.activeDefaultFramebufferAcquireDepth || 0) + 1;
    }

    try {
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

      this.framebuffer ||= new WebGPUFramebuffer(this.device, {
        id: `${this.id}#framebuffer`,
        colorAttachments: [currentColorAttachment],
        depthStencilAttachment: null
      });
      this.framebuffer._reinitialize(
        currentColorAttachment.view,
        options?.depthStencilFormat ? this.depthStencilAttachment?.view || null : null
      );
      return this.framebuffer;
    } finally {
      if (profiler) {
        profiler.activeDefaultFramebufferAcquireDepth =
          (profiler.activeDefaultFramebufferAcquireDepth || 1) - 1;
        profiler.framebufferAcquireTimeMs =
          (profiler.framebufferAcquireTimeMs || 0) + (getTimestamp() - startTime);
      }
    }
  }

  // PRIMARY METHODS

  /** Wrap the current canvas context texture in a luma.gl texture */
  _getCurrentTexture(): WebGPUTexture {
    const profiler = getCpuHotspotProfiler(this.device);
    const currentTextureStartTime = profiler ? getTimestamp() : 0;
    const handle = this.handle.getCurrentTexture();
    if (profiler) {
      profiler.currentTextureAcquireCount = (profiler.currentTextureAcquireCount || 0) + 1;
      profiler.currentTextureAcquireTimeMs =
        (profiler.currentTextureAcquireTimeMs || 0) + (getTimestamp() - currentTextureStartTime);
    }
    if (!this.colorAttachment) {
      this.colorAttachment = this.device.createTexture({
        id: `${this.id}#color-texture`,
        handle,
        format: this.device.preferredColorFormat,
        width: handle.width,
        height: handle.height
      });
      return this.colorAttachment;
    }

    this.colorAttachment._reinitialize(handle, {
      handle,
      format: this.device.preferredColorFormat,
      width: handle.width,
      height: handle.height
    });
    return this.colorAttachment;
  }

  /** We build render targets on demand (i.e. not when size changes but when about to render) */
  _createDepthStencilAttachment(depthStencilFormat: TextureFormatDepthStencil): WebGPUTexture {
    const needsNewDepthStencilAttachment =
      !this.depthStencilAttachment ||
      this.depthStencilAttachment.width !== this.drawingBufferWidth ||
      this.depthStencilAttachment.height !== this.drawingBufferHeight ||
      this.depthStencilAttachment.format !== depthStencilFormat;
    if (needsNewDepthStencilAttachment) {
      this.depthStencilAttachment?.destroy();
      this.depthStencilAttachment = this.device.createTexture({
        id: `${this.id}#depth-stencil-texture`,
        usage: Texture.RENDER_ATTACHMENT,
        format: depthStencilFormat,
        width: this.drawingBufferWidth,
        height: this.drawingBufferHeight
      });
    }
    return this.depthStencilAttachment!;
  }
}
