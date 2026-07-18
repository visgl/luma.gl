// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, TextureViewProps} from '@luma.gl/core';
// import {getTextureFormatInfo} from '@luma.gl/core';
import {TextureView, Texture} from '@luma.gl/core';
import {GL} from '@luma.gl/webgl/constants';

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

    if (this.props.swizzle !== 'rgba') {
      throw new Error('Texture view swizzles are only supported in WebGPU');
    }
    if (
      this.props.aspect === 'stencil-only' &&
      !this.device.features.has('stencil-texturing-webgl')
    ) {
      throw new Error('stencil-only texture views require stencil-texturing-webgl');
    }
  }

  /**
   * Applies the texture-global depth/stencil sampling mode required by this virtual view.
   * WebGL has no texture-view object, so callers must not bind conflicting aspects of one
   * texture in the same draw.
   */
  _applyAspectMode(): void {
    if (this.props.aspect === 'all') {
      return;
    }

    this.gl.texParameteri(
      this.texture.glTarget,
      GL.DEPTH_STENCIL_TEXTURE_MODE_WEBGL,
      this.props.aspect === 'stencil-only' ? GL.STENCIL_INDEX_WEBGL : GL.DEPTH_COMPONENT
    );
  }
}
