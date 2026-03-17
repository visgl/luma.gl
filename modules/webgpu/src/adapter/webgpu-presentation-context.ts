// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// prettier-ignore
// / <reference types="@webgpu/types" />

import type {PresentationContextProps, TextureFormatDepthStencil} from '@luma.gl/core';
import {PresentationContext, Texture, log} from '@luma.gl/core';
import type {WebGPUDevice} from './webgpu-device';
import {WebGPUFramebuffer} from './resources/webgpu-framebuffer';
import {WebGPUTexture} from './resources/webgpu-texture';
import {getCpuHotspotProfiler, getTimestamp} from './helpers/cpu-hotspot-profiler';

/**
 * A WebGPU PresentationContext renders directly into its destination canvas.
 */
export class WebGPUPresentationContext extends PresentationContext {
  readonly device: WebGPUDevice;
  readonly handle: GPUCanvasContext;

  private colorAttachment: WebGPUTexture | null = null;
  private depthStencilAttachment: WebGPUTexture | null = null;
  private framebuffer: WebGPUFramebuffer | null = null;

  get [Symbol.toStringTag](): string {
    return 'WebGPUPresentationContext';
  }

  constructor(device: WebGPUDevice, props: PresentationContextProps = {}) {
    super(props);
    const contextLabel = `${this[Symbol.toStringTag]}(${this.id})`;

    const context = this.canvas.getContext('webgpu');
    if (!context) {
      throw new Error(`${contextLabel}: Failed to create WebGPU presentation context`);
    }
    this.device = device;
    this.handle = context;

    this._setAutoCreatedCanvasId(`${this.device.id}-presentation-canvas`);
    this._configureDevice();
    this._startObservers();
  }

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

  present(): void {
    this.device.submit();
  }

  protected override _configureDevice(): void {
    if (this.depthStencilAttachment) {
      this.depthStencilAttachment.destroy();
      this.depthStencilAttachment = null;
    }

    this.handle.configure({
      device: this.device.handle,
      format: this.device.preferredColorFormat,
      colorSpace: this.props.colorSpace,
      alphaMode: this.props.alphaMode
    });

    this._createDepthStencilAttachment(this.device.preferredDepthFormat);
  }

  protected override _getCurrentFramebuffer(
    options: {depthStencilFormat?: TextureFormatDepthStencil | false} = {
      depthStencilFormat: 'depth24plus'
    }
  ): WebGPUFramebuffer {
    const profiler = getCpuHotspotProfiler(this.device);
    const startTime = profiler ? getTimestamp() : 0;
    if (profiler) {
      profiler.framebufferAcquireCount = (profiler.framebufferAcquireCount || 0) + 1;
    }

    try {
      const currentColorAttachment = this._getCurrentTexture();
      if (
        currentColorAttachment.width !== this.drawingBufferWidth ||
        currentColorAttachment.height !== this.drawingBufferHeight
      ) {
        const [oldWidth, oldHeight] = this.getDrawingBufferSize();
        this.drawingBufferWidth = currentColorAttachment.width;
        this.drawingBufferHeight = currentColorAttachment.height;
        log.log(
          1,
          `${this[Symbol.toStringTag]}(${this.id}): Resized to compensate for initial canvas size mismatch ${oldWidth}x${oldHeight} => ${this.drawingBufferWidth}x${this.drawingBufferHeight}px`
        )();
      }

      if (options?.depthStencilFormat) {
        this._createDepthStencilAttachment(options.depthStencilFormat);
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
        profiler.framebufferAcquireTimeMs =
          (profiler.framebufferAcquireTimeMs || 0) + (getTimestamp() - startTime);
      }
    }
  }

  private _getCurrentTexture(): WebGPUTexture {
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

  private _createDepthStencilAttachment(
    depthStencilFormat: TextureFormatDepthStencil
  ): WebGPUTexture {
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
