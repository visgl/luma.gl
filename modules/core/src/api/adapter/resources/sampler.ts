// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '../device';
import type {SamplerProps as ShaderSamplerProps} from '@luma.gl/shaders/types';
import {DeviceResource, DeviceResourceProps} from './device-resource';

/** Edge values sampling mode */
export type SamplerAddressMode = 'clamp-to-edge' | 'repeat' | 'mirror-repeat';

/** Sampler filtering mode */
export type SamplerFilterMode = 'nearest' | 'linear';
export type SamplerProps = DeviceResourceProps & ShaderSamplerProps;

export type SamplerParameters = Omit<SamplerProps, keyof DeviceResourceProps>;

/** Immutable Sampler object */
export abstract class Sampler extends DeviceResource<SamplerProps> {
  static override defaultProps: Required<SamplerProps> = {
    ...DeviceResource.defaultProps,
    type: 'color-sampler',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
    addressModeW: 'clamp-to-edge',
    magFilter: 'nearest',
    minFilter: 'nearest',
    mipmapFilter: 'none',
    lodMinClamp: 0,
    lodMaxClamp: 32, // Per WebGPU spec
    compare: 'less-equal',
    maxAnisotropy: 1
  };

  override get [Symbol.toStringTag](): string {
    return 'Sampler';
  }

  constructor(device: Device, props: SamplerProps) {
    props = Sampler.normalizeProps(device, props);
    super(device, props, Sampler.defaultProps);
  }

  protected static normalizeProps(device: Device, props: SamplerProps): SamplerProps {
    return props;
  }
}
