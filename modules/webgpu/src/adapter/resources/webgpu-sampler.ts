// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import {Sampler, SamplerProps} from '@luma.gl/core';
import type {WebGPUDevice} from '../webgpu-device';

export type WebGPUSamplerProps = SamplerProps & {
  handle?: GPUSampler;
};

/**
 *
 */
export class WebGPUSampler extends Sampler {
  readonly device: WebGPUDevice;
  readonly handle: GPUSampler;

  constructor(device: WebGPUDevice, props: WebGPUSamplerProps) {
    super(device, props);
    this.device = device;

    // Prepare sampler props
    const samplerProps: Partial<WebGPUSamplerProps> = {...this.props};
    if (samplerProps.type !== 'comparison-sampler') {
      delete samplerProps.compare;
    }

    this.handle = this.handle || this.device.handle.createSampler(samplerProps);
    this.handle.label = this.props.id;
  }

  override destroy(): void {
    // GPUSampler does not have a destroy method
    // this.handle.destroy();
    // @ts-expect-error readonly
    this.handle = null;
  }
}
