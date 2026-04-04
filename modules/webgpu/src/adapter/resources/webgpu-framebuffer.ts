// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {FramebufferProps} from '@luma.gl/core';
import {Framebuffer} from '@luma.gl/core';
import {WebGPUDevice} from '../webgpu-device';
import {WebGPUTextureView} from '../resources/webgpu-texture-view';

/**
 * Create new textures with correct size for all attachments.
 * @note resize() destroys existing textures (if size has changed).
 */
export class WebGPUFramebuffer extends Framebuffer {
  readonly device: WebGPUDevice;
  readonly handle = null;

  readonly colorAttachments: WebGPUTextureView[] = [];
  readonly depthStencilAttachment: WebGPUTextureView | null = null;

  constructor(device: WebGPUDevice, props: FramebufferProps) {
    super(device, props);
    this.device = device;

    // Auto create textures for attachments if needed
    this.autoCreateAttachmentTextures();
  }

  protected updateAttachments(): void {
    // WebGPU framebuffers are JS only objects, nothing to update
  }

  /**
   * Internal-only hook for the cached CanvasContext/PresentationContext swapchain path.
   * Rebinds the long-lived default framebuffer wrapper to the current per-frame color view
   * and optional depth attachment without allocating a new luma.gl Framebuffer object.
   */
  _reinitialize(
    colorAttachment: WebGPUTextureView,
    depthStencilAttachment: WebGPUTextureView | null
  ): void {
    this.colorAttachments[0] = colorAttachment;
    // @ts-expect-error Internal-only canvas wrapper reuse mutates this otherwise-readonly attachment.
    this.depthStencilAttachment = depthStencilAttachment;
    this.width = colorAttachment.texture.width;
    this.height = colorAttachment.texture.height;

    this.props.width = this.width;
    this.props.height = this.height;
    this.props.colorAttachments = [colorAttachment.texture];
    this.props.depthStencilAttachment = depthStencilAttachment?.texture || null;
  }
}
