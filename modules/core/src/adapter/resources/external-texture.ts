// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '../device';
import {Resource, ResourceProps} from './resource';

export type ExternalTextureProps = ResourceProps & {
  source: HTMLVideoElement; //  | null;
  colorSpace?: 'srgb';
};
export abstract class ExternalTexture extends Resource<ExternalTextureProps> {
  static override defaultProps: Required<ExternalTextureProps> = {
    ...Resource.defaultProps,
    source: undefined!,
    colorSpace: 'srgb'
  };

  override get [Symbol.toStringTag](): string {
    return 'ExternalTexture';
  }

  constructor(device: Device, props: ExternalTextureProps) {
    super(device, props, ExternalTexture.defaultProps);
  }
}
