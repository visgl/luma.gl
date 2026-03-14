// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { CommandEncoder } from '@luma.gl/core';
import { WEBGLCommandBuffer } from './webgl-command-buffer';
import { WEBGLRenderPass } from './webgl-render-pass';
export class WEBGLCommandEncoder extends CommandEncoder {
    device;
    handle = null;
    commandBuffer;
    constructor(device, props) {
        super(device, props);
        this.device = device;
        this.commandBuffer = new WEBGLCommandBuffer(device);
    }
    destroy() { }
    finish() {
        return this.commandBuffer;
    }
    beginRenderPass(props) {
        return new WEBGLRenderPass(this.device, props);
    }
    beginComputePass(props) {
        throw new Error('ComputePass not supported in WebGL');
    }
    copyBufferToBuffer(options) {
        this.commandBuffer.commands.push({ name: 'copy-buffer-to-buffer', options });
    }
    copyBufferToTexture(options) {
        this.commandBuffer.commands.push({ name: 'copy-buffer-to-texture', options });
    }
    copyTextureToBuffer(options) {
        this.commandBuffer.commands.push({ name: 'copy-texture-to-buffer', options });
    }
    copyTextureToTexture(options) {
        this.commandBuffer.commands.push({ name: 'copy-texture-to-texture', options });
    }
    // clearTexture(options: ClearTextureOptions): void {
    //   this.commandBuffer.commands.push({name: 'copy-texture-to-texture', options});
    // }
    pushDebugGroup(groupLabel) { }
    popDebugGroup() { }
    insertDebugMarker(markerLabel) { }
    resolveQuerySet(querySet, destination, options) { }
}
