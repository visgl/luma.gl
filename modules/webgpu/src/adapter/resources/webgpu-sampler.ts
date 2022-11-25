import {Sampler, SamplerProps} from '@luma.gl/api';
import type WebGPUDevice from '../webgpu-device';

export type WebGPUSamplerProps = SamplerProps & {
  handle?: GPUSampler;
}

/**
 *
 */
export default class WebGPUSampler extends Sampler {
  readonly device: WebGPUDevice;
  readonly handle: GPUSampler;

  constructor(device: WebGPUDevice, props: WebGPUSamplerProps) {
    super(device, props);
    this.device = device;

    // Prepare sampler props
    const samplerProps = this.props;
    if (samplerProps.type !== 'comparison-sampler') {
      delete samplerProps.compare;
    }

    this.handle = this.handle || this.device.handle.createSampler(this.props);
    this.handle.label = this.props.id;
  }

  destroy(): void {
    // this.handle.destroy();
  }
}
