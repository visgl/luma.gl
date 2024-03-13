// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '../device';
import type {Texture} from './texture';
import type {TextureFormat} from '../../gpu-type-utils/texture-formats';
import {Resource, ResourceProps} from './resource';

/** Properties for initializing a texture view */
export type TextureViewProps = ResourceProps & {
  /** The format of the texture view. Must be either the format of the texture or one of the viewFormats specified during its creation. */
  format?: TextureFormat;
  /** The dimension to view the texture as. */
  dimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  /** Which aspect(s) of the texture are accessible to the texture view. default "all"*/
  aspect?: 'all' | 'stencil-only' | 'depth-only';
  /** The first (most detailed) mipmap level accessible to the texture view.  default 0*/
  baseMipLevel?: number;
  /** How many mipmap levels, starting with baseMipLevel, are accessible to the texture view. */
  mipLevelCount: number;
  /** The index of the first array layer accessible to the texture view. default 0 */
  baseArrayLayer?: number;
  /** How many array layers, starting with baseArrayLayer, are accessible to the texture view. */
  arrayLayerCount: number;
};

/** Immutable TextureView object */
export abstract class TextureView extends Resource<TextureViewProps> {
  static override defaultProps: Required<TextureViewProps> = {
    ...Resource.defaultProps,
    format: undefined!,
    dimension: undefined!,
    aspect: 'all',
    baseMipLevel: 0,
    mipLevelCount: undefined!,
    baseArrayLayer: 0,
    arrayLayerCount: undefined!
  };

  abstract texture: Texture;

  override get [Symbol.toStringTag](): string {
    return 'TextureView';
  }

  /** Should not be constructed directly. Use `texture.createView(props)` */
  constructor(device: Device, props: TextureViewProps & {texture: Texture}) {
    super(device, props, TextureView.defaultProps);
  }
}
