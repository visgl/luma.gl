// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  TextureProps,
  Sampler,
  SamplerProps,
  TextureViewProps,
  CopyExternalImageOptions,
  CopyImageDataOptions
} from '@luma.gl/core';

import {Texture} from '@luma.gl/core';
import {NullDevice} from '../null-device';
import {NullSampler} from './null-sampler';
import {NullTextureView} from './null-texture-view';

export class NullTexture extends Texture {
  readonly device: NullDevice;

  sampler: NullSampler;
  view: NullTextureView;

  constructor(device: NullDevice, props: TextureProps) {
    super(device, props);

    // Texture base class strips out the data prop, so we need to add it back in
    const propsWithData = {...this.props};
    propsWithData.data = props.data;

    this.device = device;

    this.initialize(propsWithData);

    Object.seal(this);
  }

  override destroy(): void {
    if (!this.destroyed) {
      super.destroy();
      this.trackDeallocatedMemory('Texture');
    }
  }

  createView(props: TextureViewProps): NullTextureView {
    return new NullTextureView(this.device, {...props, texture: this});
  }

  initialize(props: TextureProps = {}): this {
    // const data = props.data;
    // this.setImageData(props);

    this.setSampler(props.sampler);

    this.view = new NullTextureView(this.device, {
      ...props,
      texture: this,
      mipLevelCount: 1,
      arrayLayerCount: 1
    });

    return this;
  }

  setSampler(sampler: Sampler | SamplerProps = {}): this {
    if (sampler instanceof NullSampler) {
      this.sampler = sampler;
    } else {
      this.sampler = new NullSampler(this.device, sampler);
    }

    return this;
  }

  copyExternalImage(options: CopyExternalImageOptions): {width: number; height: number} {
    this.trackDeallocatedMemory('Texture');

    const {image: data} = options;

    // if (data && data.byteLength) {
    //   this.trackAllocatedMemory(data.byteLength, 'Texture');
    // } else {
    const bytesPerPixel = 4;
    this.trackAllocatedMemory(this.width * this.height * bytesPerPixel, 'Texture');
    // }

    const width = options.width ?? (data as ImageBitmap).width;
    const height = options.height ?? (data as ImageBitmap).height;

    this.width = width;
    this.height = height;

    return {width, height};
  }

  override copyImageData(options: CopyImageDataOptions): void {
    throw new Error('copyImageData not implemented');
  }
}
