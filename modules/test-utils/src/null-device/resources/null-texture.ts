// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TextureProps, Sampler, SamplerProps, TextureViewProps} from '@luma.gl/core';
import {Texture, assert, loadImage} from '@luma.gl/core';
import {NullDevice} from '../null-device';
import {NullSampler} from './null-sampler';
import {NullTextureView} from './null-texture-view';

export class NullTexture extends Texture<TextureProps> {
  readonly device: NullDevice;

  sampler!: NullSampler;
  view!: NullTextureView;

  constructor(device: NullDevice, props: TextureProps) {
    super(device, props);

    this.device = device;

    // Signature: new Texture2D(gl, {data: url})
    if (typeof this.props?.data === 'string') {
      Object.assign(this.props, {data: loadImage(this.props.data)});
    }

    this.initialize(this.props);

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
    const data = props.data;

    if (data instanceof Promise) {
      data.then(resolvedImageData =>
        this.initialize(
          Object.assign({}, props, {
            pixels: resolvedImageData,
            data: resolvedImageData
          })
        )
      );
      return this;
    }

    this.setImageData(props);

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

  resize(options: {height: number; width: number; mipmaps?: boolean}): this {
    const {height, width, mipmaps = false} = options;
    if (width !== this.width || height !== this.height) {
      return this.initialize({
        width,
        height,
        mipmaps
      });
    }
    return this;
  }

  setImageData(options: {data?: any; width?: number; height?: number}) {
    this.trackDeallocatedMemory('Texture');

    const {data} = options;

    if (data && data.byteLength) {
      this.trackAllocatedMemory(data.byteLength, 'Texture');
    } else {
      const bytesPerPixel = 4;
      this.trackAllocatedMemory(this.width * this.height * bytesPerPixel, 'Texture');
    }

    const width = options.width ?? (data as ImageBitmap).width;
    const height = options.height ?? (data as ImageBitmap).height;

    this.width = width;
    this.height = height;

    return this;
  }

  setSubImageData(options: {data: any; width?: number; height?: number; x?: number; y?: number}) {
    const {data, x = 0, y = 0} = options;
    const width = options.width ?? (data as ImageBitmap).width;
    const height = options.height ?? (data as ImageBitmap).height;
    assert(width + x <= this.width && height + y <= this.height);
  }
}
