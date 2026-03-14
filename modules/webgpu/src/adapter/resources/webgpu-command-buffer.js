// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { CommandBuffer } from '@luma.gl/core';
export class WebGPUCommandBuffer extends CommandBuffer {
    device;
    handle;
    constructor(commandEncoder, props) {
        super(commandEncoder.device, {});
        this.device = commandEncoder.device;
        this.handle =
            this.props.handle ||
                commandEncoder.handle.finish({
                    label: props?.id || 'unnamed-command-buffer'
                });
    }
}
