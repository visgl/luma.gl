// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { CommandBuffer } from '@luma.gl/core';
export class NullCommandBuffer extends CommandBuffer {
    device;
    handle = null;
    constructor(device, props) {
        super(device, props);
        this.device = device;
    }
    copyBufferToBuffer(options) { }
    copyBufferToTexture(options) { }
    copyTextureToBuffer(options) { }
    copyTextureToTexture(options) { }
    pushDebugGroup(groupLabel) { }
    popDebugGroup() { }
    insertDebugMarker(markerLabel) { }
    resolveQuerySet(querySet) { }
}
