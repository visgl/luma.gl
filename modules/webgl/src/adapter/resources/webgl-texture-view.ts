// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, TextureViewProps} from '@luma.gl/core';
// import {decodeTextureFormat} from '@luma.gl/core';
import {TextureView, Texture} from '@luma.gl/core';

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
  }
}
