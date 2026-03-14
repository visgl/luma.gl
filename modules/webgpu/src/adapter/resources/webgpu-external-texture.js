// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { ExternalTexture } from '@luma.gl/core';
import { WebGPUSampler } from './webgpu-sampler';
/**
 * Cheap, temporary texture view for videos
 * Only valid within same callback, destroyed automatically as a microtask.
 */
export class WebGPUExternalTexture extends ExternalTexture {
    device;
    handle;
    sampler;
    constructor(device, props) {
        super(device, props);
        this.device = device;
        this.handle =
            this.props.handle ||
                this.device.handle.importExternalTexture({
                    source: props.source,
                    colorSpace: props.colorSpace
                });
        // @ts-expect-error
        this.sampler = null;
    }
    destroy() {
        // External textures are destroyed automatically,
        // as a microtask, instead of manually or upon garbage collection like other resources.
        // this.handle.destroy();
        // @ts-expect-error readonly
        this.handle = null;
    }
    /** Set default sampler */
    setSampler(sampler) {
        // We can accept a sampler instance or set of props;
        this.sampler =
            sampler instanceof WebGPUSampler ? sampler : new WebGPUSampler(this.device, sampler);
        return this;
    }
}
