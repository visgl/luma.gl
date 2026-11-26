// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '../device';
import {type Sampler, type SamplerProps, setTextureSampler} from './sampler';
import {DeviceResource, DeviceResourceProps} from './device-resource';

/** Properties for one concrete backend external texture binding snapshot. */
export type ExternalTextureProps = DeviceResourceProps & {
  /** Browser video source imported into this concrete WebGPU external binding. */
  source?: HTMLVideoElement | VideoFrame;
  /** Width for handle-backed external textures when it cannot be inferred from source. */
  width?: number;
  /** Height for handle-backed external textures when it cannot be inferred from source. */
  height?: number;
  /** Color space requested when importing the browser-owned source. */
  colorSpace?: 'srgb';
  /** Default sampler used when a shader exposes a paired `${name}Sampler` binding. */
  sampler?: Sampler | SamplerProps;
};

/** Concrete backend binding snapshot for opaque external texture data. */
export abstract class ExternalTexture extends DeviceResource<ExternalTextureProps> {
  /** Width in pixels for this concrete sampled binding. */
  readonly width: number;
  /** Height in pixels for this concrete sampled binding. */
  readonly height: number;
  /** Default sampler for this external texture. */
  abstract sampler: Sampler;
  /** Replace the default sampler used for paired shader sampler bindings. */
  setSampler(sampler: Sampler | SamplerProps): this {
    setTextureSampler(this, sampler);
    return this;
  }
  /** Device timestamp of this external binding acquisition. */
  updateTimestamp: number;

  /** DeviceResource label used by debug output. */
  override get [Symbol.toStringTag](): string {
    return 'ExternalTexture';
  }

  /**
   * Creates concrete external binding metadata from a source or borrowed handle.
   * @param device Device that owns this concrete external binding snapshot.
   * @param props Source, borrowed handle, dimensions, and sampler for this snapshot.
   */
  constructor(device: Device, props: ExternalTextureProps) {
    super(device, props, ExternalTexture.defaultProps);
    const sourceSize = this.props.source ? device.getExternalImageSize(this.props.source) : null;
    this.width = this.props.width || sourceSize?.width || 0;
    this.height = this.props.height || sourceSize?.height || 0;
    this.updateTimestamp = device.incrementTimestamp();
  }

  /** Default resolved properties used by concrete external texture bindings. */
  static override defaultProps: Required<ExternalTextureProps> = {
    ...DeviceResource.defaultProps,
    source: undefined!,
    width: 0,
    height: 0,
    colorSpace: 'srgb',
    sampler: {}
  };
}
