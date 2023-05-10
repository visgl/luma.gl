// luma.gl, MIT license
import {ExternalTexture, ExternalTextureProps, Sampler, SamplerProps} from '@luma.gl/api';
import type {WebGPUDevice} from '../webgpu-device';
import {WebGPUSampler} from './webgpu-sampler';

/**
 * Cheap, temporary texture view for videos
 * Only valid within same callback, destroyed automatically as a microtask.
 */
export class WebGPUExternalTexture extends ExternalTexture {
  readonly device: WebGPUDevice;
  readonly handle: GPUExternalTexture;
  sampler: WebGPUSampler;

  constructor(device: WebGPUDevice, props: ExternalTextureProps) {
    super(device, props);
    this.device = device;
    this.handle = this.props.handle || this.device.handle.importExternalTexture({
      source: props.source,
      colorSpace: props.colorSpace
    });
    this.sampler = null;
  }

  override destroy(): void {
    // External textures are destroyed automatically,
    // as a microtask, instead of manually or upon garbage collection like other resources.
    // this.handle.destroy();
  }

  /** Set default sampler */
  setSampler(sampler: Sampler | SamplerProps): this {
    // We can accept a sampler instance or set of props;
    this.sampler = sampler instanceof WebGPUSampler ? sampler : new WebGPUSampler(this.device, sampler);
    return this;
  }
}
