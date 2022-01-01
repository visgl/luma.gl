import type Device from '../device';
import {CompareFunction} from '../types/parameters';
import Resource, {ResourceProps, DEFAULT_RESOURCE_PROPS} from './resource';

export type SamplerAddressMode = 'clamp-to-edge' | 'repeat' | 'mirror-repeat';
export type SamplerFilterMode = 'nearest' | 'linear';

export type SamplerParameters = {
  addressModeU?: 'clamp-to-edge' | 'repeat' | 'mirror-repeat';
  addressModeV?: 'clamp-to-edge' | 'repeat' | 'mirror-repeat';
  addressModeW?: 'clamp-to-edge' | 'repeat' | 'mirror-repeat';
  magFilter?: 'nearest' | 'linear';
  minFilter?: 'nearest' | 'linear';
  mipmapFilter?: 'nearest' | 'linear';
  lodMinClamp?: number;
  lodMaxClamp?: number;
  compare?: CompareFunction;
  maxAnisotropy?: number;
};

/**
 * Properties for initializing a sampler
 */
export type SamplerProps = ResourceProps & SamplerParameters;

const DEFAULT_SAMPLER_PROPS: Required<SamplerProps> = {
  ...DEFAULT_RESOURCE_PROPS,
  addressModeU: 'clamp-to-edge',
  addressModeV: 'clamp-to-edge',
  addressModeW: 'clamp-to-edge',
  magFilter: 'nearest',
  minFilter: 'nearest',
  mipmapFilter: 'nearest',
  lodMinClamp: 0,
  lodMaxClamp: 32, // Per WebGPU spec
  // Avoid setting compare default value:
  // Per WebGPU spec: If `compare` is provided, the sampler will be a "comparison sampler" with the specified GPUCompareFunction.
  compare: undefined,
  maxAnisotropy: 1
};

/** Immutable Sampler object */
export default abstract class Sampler extends Resource<SamplerProps> {
  get [Symbol.toStringTag](): string {
    return 'Sampler';
  }

  constructor(device: Device, props: SamplerProps) {
    super(device, props, DEFAULT_SAMPLER_PROPS);
  }
}
