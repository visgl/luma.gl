// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { CommandEncoder } from '@luma.gl/core';
import { NullCommandBuffer } from './null-command-buffer';
import { NullRenderPass } from './null-render-pass';
export class NullCommandEncoder extends CommandEncoder {
    device;
    handle = null;
    constructor(device, props) {
        super(device, props);
        this.device = device;
    }
    finish(props) {
        return new NullCommandBuffer(this.device, props);
    }
    beginRenderPass(props) {
        return new NullRenderPass(this.device, props);
    }
    beginComputePass(props) {
        throw new Error('ComputePass not supported in WebGL');
    }
    copyBufferToBuffer(options) { }
    copyBufferToTexture(options) { }
    copyTextureToBuffer(options) { }
    copyTextureToTexture(options) { }
    resolveQuerySet(querySet) { }
    pushDebugGroup(groupLabel) { }
    popDebugGroup() { }
    insertDebugMarker(markerLabel) { }
}
