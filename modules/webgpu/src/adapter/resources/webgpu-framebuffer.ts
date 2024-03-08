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

  colorAttachments: WebGPUTextureView[] = [];
  depthStencilAttachment: WebGPUTextureView | null = null;

  constructor(device: WebGPUDevice, props: FramebufferProps) {
    super(device, props);
    this.device = device;

    // Auto create textures for attachments if needed
    this.autoCreateAttachmentTextures();
  }
}
