// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TextureView, TextureViewProps} from '@luma.gl/core';
import type {WebGPUDevice} from '../webgpu-device';
import type {WebGPUTexture} from './webgpu-texture';

export type WebGPUTextureViewProps = TextureViewProps & {
  handle?: GPUTextureView;
};

/**
 *
 */
export class WebGPUTextureView extends TextureView {
  readonly device: WebGPUDevice;
  readonly handle: GPUTextureView;
  readonly texture: WebGPUTexture;

  constructor(device: WebGPUDevice, props: WebGPUTextureViewProps & {texture: WebGPUTexture}) {
    super(device, props);
    this.device = device;
    this.texture = props.texture;

    this.handle =
      this.handle ||
      this.texture.handle.createView({
        format: (props.format || this.texture.format) as GPUTextureFormat,
        dimension: props.dimension || this.texture.dimension,
        aspect: props.aspect,
        baseMipLevel: props.baseMipLevel,
        mipLevelCount: props.mipLevelCount, // GPUIntegerCoordinate;
        baseArrayLayer: props.baseArrayLayer, // GPUIntegerCoordinate;
        arrayLayerCount: props.arrayLayerCount // GPUIntegerCoordinate;
      });
    this.handle.label = this.props.id;
  }

  override destroy(): void {
    // this.handle.destroy();
    this.handle = null;
  }
}
