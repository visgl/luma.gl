// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { TextureView } from '@luma.gl/core';
/**
 *
 */
export class WebGPUTextureView extends TextureView {
    device;
    handle;
    texture;
    constructor(device, props) {
        super(device, props);
        this.device = device;
        this.texture = props.texture;
        this.device.pushErrorScope('validation');
        this.handle =
            // props.handle ||
            this.texture.handle.createView({
                format: (this.props.format || this.texture.format),
                dimension: this.props.dimension || this.texture.dimension,
                aspect: this.props.aspect,
                baseMipLevel: this.props.baseMipLevel,
                mipLevelCount: this.props.mipLevelCount,
                baseArrayLayer: this.props.baseArrayLayer,
                arrayLayerCount: this.props.arrayLayerCount
            });
        this.device.popErrorScope((error) => {
            this.device.reportError(new Error(`TextureView constructor: ${error.message}`), this)();
            this.device.debug();
        });
        this.handle.label = this.props.id;
    }
    destroy() {
        // GPUTextureView does not have a destroy method
        // this.handle.destroy();
        // @ts-expect-error readonly
        this.handle = null;
    }
}
