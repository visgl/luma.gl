// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '../../../api/utils/assert';
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
    if (props.aspect === 'stencil-only') {
      // WebGL can select stencil for sampling only on packed textures with the extension enabled.
      assert(
        this.texture.format.endsWith('-stencil8') &&
          this.device.features.has('stencil-texturing-webgl')
      );
    }
  }
}
