// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '../device';
import type {TypedArray} from '../../types';
import type {TextureFormat} from '../types/texture-formats';
import {Resource, ResourceProps} from './resource';
import {Sampler, SamplerProps} from './sampler';
import {TextureView, TextureViewProps} from './texture-view';

// required GPUExtent3D size;
// GPUIntegerCoordinate mipLevelCount = 1;
// GPUSize32 sampleCount = 1;
// GPUTextureDimension dimension = "2d";
// required GPUTextureFormat format;
// required GPUTextureUsageFlags usage;

/** Data types that can be used to initialize textures */
export type TextureData = TypedArray | ArrayBuffer | Buffer | ImageBitmap | HTMLImageElement;

export type CubeTextureData = Record<string, TextureData> | Record<string, Promise<TextureData>>;

export type ExternalTextureData = HTMLVideoElement;

/** Abstract Texture interface */
export type TextureProps = ResourceProps & {
  format?: TextureFormat;
  dimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  width?: number | undefined;
  height?: number | undefined;
  depth?: number;
  usage?: number;

  data?: TextureData | Promise<TextureData> | CubeTextureData | string | HTMLVideoElement | null;
  mipmaps?: boolean;

  mipLevels?: number;
  samples?: number;
  type?: number;
  compressed?: boolean;

  sampler?: Sampler | SamplerProps;
  view?: TextureViewProps;
};

export type WebGPUTextureProps = ResourceProps & {
  width: number;
  height: number;
  depth?: number;
  mipLevels?: number;
  format?: string;
};

/**
 * @deprecated
 * @todo remove, are these even used anymore?
 */
export type DeprecatedWebGLTextureProps = {
  /** @deprecated use props.sampler */
  parameters?: Record<number, number>;
  /** @deprecated use props.data */
  pixels?: any;
  /** @deprecated use props.format */
  dataFormat?: number | null;
  /** @deprecated rarely supported */
  border?: number;
  /** @deprecated WebGL only. */
  pixelStore?: object;
  /** @deprecated WebGL only. */
  textureUnit?: number;
  /** @deprecated WebGL only. Use dimension. */
  target?: number;
};

/**
 * Abstract Texture interface
 * Texture Object
 * https://gpuweb.github.io/gpuweb/#gputexture
 */
export abstract class Texture<Props extends TextureProps = TextureProps> extends Resource<Props> {
  static override defaultProps: Required<TextureProps> = {
    ...Resource.defaultProps,
    data: null,
    dimension: '2d',
    format: 'rgba8unorm',
    width: undefined!,
    height: undefined!,
    depth: 1,
    mipmaps: true,
    // type: undefined,
    compressed: false,
    // mipLevels: 1,
    usage: 0,
    // usage: GPUTextureUsage.COPY_DST
    mipLevels: undefined!,
    samples: undefined!,
    type: undefined!,
    sampler: {},
    view: undefined!
  };

  static COPY_SRC = 0x01;
  static COPY_DST = 0x02;
  static TEXTURE_BINDING = 0x04;
  static STORAGE_BINDING = 0x08;
  static RENDER_ATTACHMENT = 0x10;

  override get [Symbol.toStringTag](): string {
    return 'Texture';
  }

  /** dimension of this texture */
  readonly dimension: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  /** format of this texture */
  readonly format: TextureFormat;
  /** width in pixels of this texture */
  width: number;
  /** height in pixels of this texture */
  height: number;
  /** depth of this texture */
  readonly depth: number;

  /** Default sampler for this texture */
  abstract sampler: Sampler;

  /** Default view for this texture */
  abstract view: TextureView;

  /** "Time" of last update. Monotonically increasing timestamp */
  updateTimestamp: number;

  /** Do not use directly. Create with device.createTexture() */
  constructor(
    device: Device,
    props: Props,
    defaultProps = Texture.defaultProps as Required<Props>
  ) {
    super(device, props, defaultProps);
    this.dimension = this.props.dimension;
    this.format = this.props.format;
    this.width = this.props.width;
    this.height = this.props.height;
    this.depth = this.props.depth;

    // TODO - perhaps this should be set on async write completion?
    this.updateTimestamp = device.incrementTimestamp();
  }

  /** Create a texture view for this texture */
  abstract createView(props?: TextureViewProps): TextureView;
}
