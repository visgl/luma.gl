// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { TextureView, Texture } from '@luma.gl/core';
export class NullTextureView extends TextureView {
    device;
    handle = null;
    texture;
    constructor(device, props) {
        super(device, { ...Texture.defaultProps, ...props });
        this.device = device;
        this.texture = props.texture;
    }
}
