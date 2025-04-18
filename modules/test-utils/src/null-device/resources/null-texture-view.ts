// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TextureViewProps} from '@luma.gl/core';
import {TextureView, Texture} from '@luma.gl/core';

import type {NullDevice} from '../null-device';
import type {NullTexture} from './null-texture';

export class NullTextureView extends TextureView {
  readonly device: NullDevice;
  readonly handle = null;

  readonly texture: NullTexture;

  constructor(device: NullDevice, props: TextureViewProps & {texture: NullTexture}) {
    super(device, {...Texture.defaultProps, ...props});

    this.device = device;
    this.texture = props.texture;
  }
}
