// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, TextureViewProps} from '../../../index';
// import {getTextureFormatInfo} from '../../../index';
import {TextureView, Texture} from '../../../index';

import {WebGLDevice} from '../webgl-device';
import {WEBGLTexture} from './webgl-texture';

export class WEBGLTextureView extends TextureView {
  readonly device: WebGLDevice;
  readonly gl: WebGL2RenderingContext;
  readonly handle: null; // Does not have a WebGL representation
  readonly texture: WEBGLTexture;

  constructor(device: Device, props: TextureViewProps & {texture: WEBGLTexture}) {
    super(device, {...Texture.defaultProps, ...props});

    this.device = device as WebGLDevice;
    this.gl = this.device.gl;
    this.handle = null;
    this.texture = props.texture;
    if (props.aspect === 'stencil-only' && !this.device.features.has('stencil-texturing')) {
      throw new Error('Stencil sampling requires WEBGL_stencil_texturing');
    }
    if (props.aspect === 'stencil-only' && !this.texture.format.endsWith('-stencil8')) {
      throw new Error('A stencil-only view requires a packed depth/stencil texture in WebGL2');
    }
  }
}
