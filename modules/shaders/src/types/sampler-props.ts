// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type CompareFunction =
  | 'never'
  | 'less'
  | 'equal'
  | 'less-equal'
  | 'greater'
  | 'not-equal'
  | 'greater-equal'
  | 'always';

export type SamplerProps = {
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
