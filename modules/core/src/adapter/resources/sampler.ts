// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '../device';
import {CompareFunction} from '../types/parameters';
import {Resource, ResourceProps} from './resource';

/** Edge values sampling mode */
export type SamplerAddressMode = 'clamp-to-edge' | 'repeat' | 'mirror-repeat';

/** Sampler filtering mode */
export type SamplerFilterMode = 'nearest' | 'linear';

/**
 * Properties for initializing a sampler
 */
export type SamplerProps = ResourceProps & {
  /** Comparison / shadow samplers are used with depth textures. See the `Sampler.compare` field */
  type?: 'color-sampler' | 'comparison-sampler';
  /** Edge value sampling in X direction */
  addressModeU?: 'clamp-to-edge' | 'repeat' | 'mirror-repeat';
  /** Edge value sampling in Y direction */
  addressModeV?: 'clamp-to-edge' | 'repeat' | 'mirror-repeat';
  /** Edge value sampling in Z direction */
  addressModeW?: 'clamp-to-edge' | 'repeat' | 'mirror-repeat';

  /** Magnification: the area of the fragment in texture space is smaller than a texel */
  magFilter?: 'nearest' | 'linear';
  /** Minification: the area of the fragment in texture space is larger than a texel */
  minFilter?: 'nearest' | 'linear';
  /** mipmapping: select between multiple mipmaps based on angle and size of the texture relative to the screen. */
  mipmapFilter?: 'none' | 'nearest' | 'linear';
  /** Affects the mipmap image selection */
  lodMinClamp?: number;
  /** Affects the mipmap image selection */
  lodMaxClamp?: number;
  /** Maximum number of samples that can be taken of the texture during any one texture fetch */
  maxAnisotropy?: number;
  /** How to compare reference values provided in shader shadow sampler calls with those pulled from the texture */
  compare?: CompareFunction;
};

export type SamplerParameters = Omit<SamplerProps, keyof ResourceProps>;

/** Immutable Sampler object */
export abstract class Sampler extends Resource<SamplerProps> {
  static override defaultProps: Required<SamplerProps> = {
    ...Resource.defaultProps,
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
    const overriddenDefaultProps: Partial<SamplerProps> =
      device?.props?._resourceDefaults?.sampler || {};
    const newProps = {...props, ...overriddenDefaultProps};
    return newProps;
  }
}
