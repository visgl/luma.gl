// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {FramebufferProps} from '../../../index';
import {Framebuffer, Texture} from '../../../index';
import {WebGPUDevice} from '../webgpu-device';
import {WebGPUTextureView} from './webgpu-texture-view';

/**
 * Create new textures with correct size for all attachments.
 * @note resize() destroys existing textures (if size has changed).
 */
export class WebGPUFramebuffer extends Framebuffer {
  readonly device: WebGPUDevice;
  readonly handle = null;
  /** Private multisampled color attachments resolving into the public color views. */
  multisampledColors: WebGPUTextureView[] = [];

  readonly colorAttachments: WebGPUTextureView[] = [];
  readonly depthStencilAttachment: WebGPUTextureView | null = null;

  constructor(device: WebGPUDevice, props: FramebufferProps) {
    super(device, props);
    this.device = device;

    // Auto create textures for attachments if needed
    this.autoCreateAttachmentTextures();
    this.updateAttachments();
  }

  protected updateAttachments(): void {
    if (this.props.samples !== 4) return;
    for (const attachment of this.multisampledColors)
      this.destroyAttachedResource(attachment.texture);
    this.multisampledColors = this.colorAttachments.map(attachment => {
      const texture = this.device.createTexture({
        format: attachment.props.format ?? attachment.texture.format,
        width: this.width,
        height: this.height,
        samples: 4,
        usage: Texture.RENDER_ATTACHMENT
      });
      this.attachResource(texture);
      return texture.view;
    });
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
