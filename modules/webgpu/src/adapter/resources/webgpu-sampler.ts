// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import {Sampler, SamplerProps} from '@luma.gl/core';
import type {WebGPUDevice} from '../webgpu-device';

export type WebGPUSamplerProps = SamplerProps & {
  handle?: GPUSampler;
};

/**
 * A WebGPU sampler object
 */
export class WebGPUSampler extends Sampler {
  readonly device: WebGPUDevice;
  readonly handle: GPUSampler;

  constructor(device: WebGPUDevice, props: WebGPUSamplerProps) {
    super(device, props);
    this.device = device;

    if (
      [props.addressModeU, props.addressModeV, props.addressModeW].includes(
        'mirror-clamp-to-edge-webgl'
      )
    ) {
      throw new Error('mirror-clamp-to-edge-webgl is only supported in WebGL');
    }

    // Prepare sampler props. Mostly identical
    const samplerDescriptor: Partial<GPUSamplerDescriptor> = {
      ...this.props,
      addressModeU: this.props.addressModeU as GPUAddressMode,
      addressModeV: this.props.addressModeV as GPUAddressMode,
      addressModeW: this.props.addressModeW as GPUAddressMode,
      mipmapFilter: undefined
    };

    // props.compare automatically turns this into a comparison sampler
    if (props.type !== 'comparison-sampler') {
      delete samplerDescriptor.compare;
    }

    // disable mipmapFilter if not set
    if (props.mipmapFilter && props.mipmapFilter !== 'none') {
      samplerDescriptor.mipmapFilter = props.mipmapFilter;
    }

    this.handle = props.handle || this.device.handle.createSampler(samplerDescriptor);
    this.handle.label = this.props.id;
  }

  override destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyResource();
    // GPUSampler does not have a destroy method
    // this.handle.destroy();
    // @ts-expect-error readonly
    this.handle = null;
  }
}
