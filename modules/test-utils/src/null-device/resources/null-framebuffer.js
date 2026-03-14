// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Framebuffer } from '@luma.gl/core';
export class NullFramebuffer extends Framebuffer {
    device;
    handle = null;
    colorAttachments = [];
    depthStencilAttachment = null;
    constructor(device, props) {
        super(device, props);
        this.device = device;
    }
    updateAttachments() {
        // Null framebuffers are JS only objects, nothing to
    }
}
