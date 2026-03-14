// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Framebuffer } from '@luma.gl/core';
/**
 * Create new textures with correct size for all attachments.
 * @note resize() destroys existing textures (if size has changed).
 */
export class WebGPUFramebuffer extends Framebuffer {
    device;
    handle = null;
    colorAttachments = [];
    depthStencilAttachment = null;
    constructor(device, props) {
        super(device, props);
        this.device = device;
        // Auto create textures for attachments if needed
        this.autoCreateAttachmentTextures();
    }
    updateAttachments() {
        // WebGPU framebuffers are JS only objects, nothing to update
    }
}
