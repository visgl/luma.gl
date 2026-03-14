// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Resource } from './resource';
/** Immutable TextureView object */
export class TextureView extends Resource {
    get [Symbol.toStringTag]() {
        return 'TextureView';
    }
    /** Should not be constructed directly. Use `texture.createView(props)` */
    constructor(device, props) {
        super(device, props, TextureView.defaultProps);
    }
    static defaultProps = {
        ...Resource.defaultProps,
        format: undefined,
        dimension: undefined,
        aspect: 'all',
        baseMipLevel: 0,
        mipLevelCount: undefined,
        baseArrayLayer: 0,
        arrayLayerCount: undefined
    };
}
