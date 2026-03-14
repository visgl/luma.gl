// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// import {getTextureFormatInfo} from '@luma.gl/core';
import { TextureView, Texture } from '@luma.gl/core';
export class WEBGLTextureView extends TextureView {
    device;
    gl;
    handle; // Does not have a WebGL representation
    texture;
    constructor(device, props) {
        super(device, { ...Texture.defaultProps, ...props });
        this.device = device;
        this.gl = this.device.gl;
        this.handle = null;
        this.texture = props.texture;
    }
}
