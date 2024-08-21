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

    // Prepare sampler props. Mostly identical
    const samplerDescriptor: Partial<GPUSamplerDescriptor> = {
      ...this.props,
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

    this.handle = this.handle || this.device.handle.createSampler(samplerDescriptor);
    this.handle.label = this.props.id;
  }

  override destroy(): void {
    // GPUSampler does not have a destroy method
    // this.handle.destroy();
    // @ts-expect-error readonly
    this.handle = null;
  }
}
