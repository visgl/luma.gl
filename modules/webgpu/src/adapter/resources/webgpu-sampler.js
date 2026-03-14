// luma.gl, MIT license
// Copyright (c) vis.gl contributors
import { Sampler } from '@luma.gl/core';
/**
 * A WebGPU sampler object
 */
export class WebGPUSampler extends Sampler {
    device;
    handle;
    constructor(device, props) {
        super(device, props);
        this.device = device;
        // Prepare sampler props. Mostly identical
        const samplerDescriptor = {
            ...this.props,
            mipmapFilter: undefined
        };
        // props.compare automatically turns this into a comparison sampler
        if (props.type !== 'comparison-sampler') {
            delete samplerDescriptor.compare;
        }
        // disable mipmapFilter if not set
        if (props.mipmapFilter && props.mipmapFilter !== 'none') {
            samplerDescriptor.mipmapFilter = props.mipmapFilter;
        }
        this.handle = props.handle || this.device.handle.createSampler(samplerDescriptor);
        this.handle.label = this.props.id;
    }
    destroy() {
        // GPUSampler does not have a destroy method
        // this.handle.destroy();
        // @ts-expect-error readonly
        this.handle = null;
    }
}
