// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  type TextureProps,
  type TextureViewProps,
  type CopyExternalImageOptions,
  type CopyImageDataOptions,
  type TextureReadOptions,
  type TextureWriteOptions,
  type Sampler,
  type SamplerProps,
  Buffer,
  Texture
} from '@luma.gl/core';
import {NullDevice} from '../null-device';
import {NullSampler} from './null-sampler';
import {NullTextureView} from './null-texture-view';

export class NullTexture extends Texture {
  readonly device: NullDevice;
  readonly handle = null;

  sampler: NullSampler;
  view: NullTextureView;

  constructor(device: NullDevice, props: TextureProps) {
    super(device, props);

    this.device = device;

    // const data = props.data;
    // this.setImageData(props);

    if (props.sampler) {
      this.setSampler(props.sampler);
    }

    this.sampler = new NullSampler(this.device, this.props.sampler);

    this.view = new NullTextureView(this.device, {
      ...props,
      texture: this,
      mipLevelCount: 1,
      arrayLayerCount: 1
    });

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

  copyExternalImage(options: CopyExternalImageOptions): {width: number; height: number} {
    this.trackDeallocatedMemory('Texture');

    // const {image: data} = options;
    // if (data && data.byteLength) {
    //   this.trackAllocatedMemory(data.byteLength, 'Texture');
    // } else {
    const bytesPerPixel = 4;
    this.trackAllocatedMemory(this.width * this.height * bytesPerPixel, 'Texture');
    // }

    return {width: this.width, height: this.height};
  }

  override setSampler(sampler?: Sampler | SamplerProps): void {
    // ignore
  }

  copyImageData(options: CopyImageDataOptions): void {
    throw new Error('copyImageData not implemented');
  }

  override readBuffer(options: TextureReadOptions = {}, buffer?: Buffer): Buffer {
    if (!buffer) {
      throw new Error('buffer required');
    }
    return buffer;
  }

  override async readDataAsync(options: TextureReadOptions = {}): Promise<ArrayBuffer> {
    return new ArrayBuffer(0);
  }

  override writeBuffer(buffer: Buffer, options: TextureWriteOptions = {}) {
    // ignore
  }

  override writeData(data: ArrayBuffer | ArrayBufferView, options: TextureWriteOptions = {}): void {
    // ignore
  }
}
