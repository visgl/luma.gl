// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Resource } from './resource';
/** Immutable Sampler object */
export class Sampler extends Resource {
    static defaultProps = {
        ...Resource.defaultProps,
        type: 'color-sampler',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        addressModeW: 'clamp-to-edge',
        magFilter: 'nearest',
        minFilter: 'nearest',
        mipmapFilter: 'none',
        lodMinClamp: 0,
        lodMaxClamp: 32, // Per WebGPU spec
        compare: 'less-equal',
        maxAnisotropy: 1
    };
    get [Symbol.toStringTag]() {
        return 'Sampler';
    }
    constructor(device, props) {
        props = Sampler.normalizeProps(device, props);
        super(device, props, Sampler.defaultProps);
    }
    static normalizeProps(device, props) {
        return props;
    }
}
