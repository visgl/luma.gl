// luma.gl, MIT license

import type {Device} from '../device';
import {CompareFunction} from '../types/parameters';
import {Resource, ResourceProps, DEFAULT_RESOURCE_PROPS} from './resource';

export type SamplerAddressMode = 'clamp-to-edge' | 'repeat' | 'mirror-repeat';
export type SamplerFilterMode = 'nearest' | 'linear';

/**
 * Properties for initializing a sampler
 */
export type SamplerProps = ResourceProps & {
  type?: 'color-sampler' | 'comparison-sampler';
  addressModeU?: 'clamp-to-edge' | 'repeat' | 'mirror-repeat';
  addressModeV?: 'clamp-to-edge' | 'repeat' | 'mirror-repeat';
  addressModeW?: 'clamp-to-edge' | 'repeat' | 'mirror-repeat';
  magFilter?: 'nearest' | 'linear';
  minFilter?: 'nearest' | 'linear';
  mipmapFilter?: 'nearest' | 'linear';
  lodMinClamp?: number;
  lodMaxClamp?: number;
  maxAnisotropy?: number;  
  compare?: CompareFunction;
};

export type SamplerParameters = Omit<SamplerProps, keyof ResourceProps>;

const DEFAULT_SAMPLER_PROPS: Required<SamplerProps> = {
  ...DEFAULT_RESOURCE_PROPS,
  type: 'color-sampler',
  addressModeU: 'clamp-to-edge',
  addressModeV: 'clamp-to-edge',
  addressModeW: 'clamp-to-edge',
  magFilter: 'nearest',
  minFilter: 'nearest',
  mipmapFilter: 'nearest',
  lodMinClamp: 0,
  lodMaxClamp: 32, // Per WebGPU spec
  compare: 'less-equal',
  maxAnisotropy: 1
};

/** Immutable Sampler object */
export abstract class Sampler extends Resource<SamplerProps> {
  override get [Symbol.toStringTag](): string {
    return 'Sampler';
  }

  constructor(device: Device, props: SamplerProps) {
    super(device, props, DEFAULT_SAMPLER_PROPS);
  }
}
