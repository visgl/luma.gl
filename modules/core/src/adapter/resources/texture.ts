// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TypedArray} from '@math.gl/types';
import type {Device} from '../device';
import type {TextureFormat} from '../../gpu-type-utils/texture-formats';
import type {TextureView, TextureViewProps} from './texture-view';
import {Resource, ResourceProps} from './resource';
import {Sampler, SamplerProps} from './sampler';
import {ExternalImage} from '../../image-utils/image-types';
import {log} from '../../utils/log';

/** Texture properties */
export type TextureProps = ResourceProps & {
  /** @deprecated Use AsyncTexture to create textures with data. */
  data?: ExternalImage | TypedArray | null;
  /** Dimension of this texture. Defaults to '2d' */
  dimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  /** The format (bit layout) of the textures pixel data */
  format?: TextureFormat;
  /** Width in texels */
  width?: number | undefined;
  /** Width in texels */
  height?: number | undefined;
  /** Number of depth layers */
  depth?: number;
  /** How this texture will be used. Defaults to TEXTURE | COPY_DST | RENDER_ATTACHMENT */
  usage?: number;
  /** How many mip levels */
  mipLevels?: number | 'auto';
  /** Multi sampling */
  samples?: number;

  /** Specifying mipmaps will default mipLevels to 'auto' and attempt to generate mipmaps */
  mipmaps?: boolean;

  /** Sampler (or SamplerProps) for the default sampler for this texture. Used if no sampler provided. Note that other samplers can still be used. */
  sampler?: Sampler | SamplerProps;
  /** Props for the default TextureView for this texture. Note that other views can still be created and used. */
  view?: TextureViewProps;

  /** @deprecated - this is implicit from format */
  compressed?: boolean;

  /** Whether to flip a supplied image bitmap vertically. Used only if texture is initialized with an image. */
  flipY?: boolean;
};

/** Options for Texture.copyExternalImage */
export type CopyExternalImageOptions = {
  /** Image */
  image: ExternalImage;
  /** Copy from image x offset (default 0) */
  sourceX?: number;
  /** Copy from image y offset (default 0) */
  sourceY?: number;
  /** Copy area width (default 1) */
  width?: number;
  /** Copy area height (default 1) */
  height?: number;
  /** Copy depth, number of layers/depth slices(default 1) */
  depth?: number;
  /** Start copying into offset x (default 0) */
  x?: number;
  /** Start copying into offset y (default 0) */
  y?: number;
  /** Start copying into layer / depth slice z (default 0) */
  z?: number;
  /** Which mip-level to copy into (default 0) */
  mipLevel?: number;
  /** When copying into depth stencil textures (default 'all') */
  aspect?: 'all' | 'stencil-only' | 'depth-only';
  /** Specific color space of image data */
  colorSpace?: 'srgb';
  /** load as premultiplied alpha  */
  premultipliedAlpha?: boolean;
  /** Whether to flip the image vertically */
  flipY?: boolean;
};

/** Options for copyImageData */
export type CopyImageDataOptions = {
  /** Data to copy (array of bytes) */
  data: ArrayBuffer | SharedArrayBuffer | ArrayBufferView;
  /** Offset into the data (in addition to any offset built-in to the ArrayBufferView) */
  byteOffset?: number;
  /** The stride, in bytes, between the beginning of each texel block row and the subsequent texel block row. Required if there are multiple texel block rows (i.e. the copy height or depth is more than one block). */
  bytesPerRow?: number;
  /** Number or rows per image (needed if multiple images are being set) */
  rowsPerImage?: number;
  /** Start copying into offset x (default 0) */
  x?: number;
  /** Start copying into offset y (default 0) */
  y?: number;
  /** Start copying from depth layer z (default 0) */
  z?: number;
  /** Which mip-level to copy into (default 0) */
  mipLevel?: number;
  /** When copying into depth stencil textures (default 'all') */
  aspect?: 'all' | 'stencil-only' | 'depth-only';
};

/**
 * Abstract Texture interface
 * Texture Object
 * https://gpuweb.github.io/gpuweb/#gputexture
 */
export abstract class Texture extends Resource<TextureProps> {
  /** The texture can be bound for use as a sampled texture in a shader */
  static SAMPLER = 0x04;
  /** The texture can be bound for use as a storage texture in a shader */
  static STORAGE = 0x08;
  /** The texture can be used as a color or depth/stencil attachment in a render pass */
  static RENDER = 0x10;
  /** The texture can be used as the source of a copy operation */
  static COPY_SRC = 0x01;
  /** he texture can be used as the destination of a copy or write operation */
  static COPY_DST = 0x02;

  /** @deprecated Use Texture.SAMPLE */
  static TEXTURE = 0x04;
  /** @deprecated Use Texture.RENDER */
  static RENDER_ATTACHMENT = 0x10;

  /** dimension of this texture */
  readonly dimension: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  /** format of this texture */
  readonly format: TextureFormat;
  /** width in pixels of this texture */
  width: number;
  /** height in pixels of this texture */
  height: number;
  /** depth of this texture */
  depth: number;
  /** mip levels in this texture */
  mipLevels: number;
  /** Default sampler for this texture */
  abstract sampler: Sampler;
  /** Default view for this texture */
  abstract view: TextureView;

  /** "Time" of last update. Monotonically increasing timestamp. TODO move to AsyncTexture? */
  updateTimestamp: number;

  override get [Symbol.toStringTag](): string {
    return 'Texture';
  }

  override toString(): string {
    return `Texture(${this.id},${this.format},${this.width}x${this.height})`;
  }

  /** Do not use directly. Create with device.createTexture() */
  constructor(device: Device, props: TextureProps) {
    props = Texture.normalizeProps(device, props);
    super(device, props, Texture.defaultProps);
    this.dimension = this.props.dimension;
    this.format = this.props.format;

    // Size
    this.width = this.props.width;
    this.height = this.props.height;
    this.depth = this.props.depth;

    // this.mipmaps = Boolean(this.props.mipmaps);

    // Calculate size, if not provided
    if (this.props.width === undefined || this.props.height === undefined) {
      if (device.isExternalImage(props.data)) {
        const size = device.getExternalImageSize(props.data);
        this.width = size?.width || 1;
        this.height = size?.height || 1;
      } else {
        this.width = 1;
        this.height = 1;
        if (this.props.width === undefined || this.props.height === undefined) {
          log.warn(
            `${this} created with undefined width or height. This is deprecated. Use AsyncTexture instead.`
          )();
        }
      }
    }

    // mipLevels

    // If mipmap generation is requested and mipLevels is not provided, initialize a full pyramid
    // TODO - is this too clever? Require app to specify both mipLevels: 'auto' and mipmaps: true?
    if (this.props.mipmaps && this.props.mipLevels === undefined) {
      this.props.mipLevels = 'auto';
    }

    // Auto-calculate the number of mip levels as a convenience
    // TODO - Should we clamp to 1-getMipLevelCount?
    this.mipLevels =
      this.props.mipLevels === 'auto'
        ? device.getMipLevelCount(this.width, this.height)
        : this.props.mipLevels || 1;

    // TODO - perhaps this should be set on async write completion?
    this.updateTimestamp = device.incrementTimestamp();
  }

  /** Create a texture view for this texture */
  abstract createView(props: TextureViewProps): TextureView;
  /** Set sampler props associated with this texture */
  abstract setSampler(sampler?: Sampler | SamplerProps): void;
  /** Copy an image (e.g an ImageBitmap) into the texture */
  abstract copyExternalImage(options: CopyExternalImageOptions): {width: number; height: number};
  /** Copy raw image data (bytes) into the texture */
  abstract copyImageData(options: CopyImageDataOptions): void;

  /**
   * Create a new texture with the same parameters and optionally a different size
   * @note Textures are immutable and cannot be resized after creation, but we can create a similar texture with the same parameters but a new size.
   * @note Does not copy contents of the texture
   */
  clone(size?: {width: number; height: number}): Texture {
    return this.device.createTexture({...this.props, ...size});
  }

  /** Ensure we have integer coordinates */
  protected static normalizeProps(device: Device, props: TextureProps): TextureProps {
    const newProps = {...props};

    // Allow device to override props (e.g. props.mipmaps)
    const overriddenDefaultProps: Partial<TextureProps> =
      device?.props?._resourceDefaults?.texture || {};
    // Note: Type issue with props.data circumvented with Object.assign
    Object.assign(newProps, overriddenDefaultProps);

    // Ensure we have integer coordinates
    const {width, height} = newProps;
    if (typeof width === 'number') {
      newProps.width = Math.max(1, Math.ceil(width));
    }
    if (typeof height === 'number') {
      newProps.height = Math.max(1, Math.ceil(height));
    }
    return newProps;
  }

  _normalizeCopyImageDataOptions(options_: CopyImageDataOptions): Required<CopyImageDataOptions> {
    const {width, height, depth} = this;
    const options = {...Texture.defaultCopyDataOptions, width, height, depth, ...options_};
    // WebGL will error if we try to copy outside the bounds of the texture
    // options.width = Math.min(options.width, this.width - options.x);
    // options.height = Math.min(options.height, this.height - options.y);
    return options;
  }

  _normalizeCopyExternalImageOptions(
    options_: CopyExternalImageOptions
  ): Required<CopyExternalImageOptions> {
    const size = this.device.getExternalImageSize(options_.image);
    const options = {...Texture.defaultCopyExternalImageOptions, ...size, ...options_};
    // WebGL will error if we try to copy outside the bounds of the texture
    options.width = Math.min(options.width, this.width - options.x);
    options.height = Math.min(options.height, this.height - options.y);
    return options;
  }

  /** Default options */
  static override defaultProps: Required<TextureProps> = {
    ...Resource.defaultProps,
    data: null,
    dimension: '2d',
    format: 'rgba8unorm',
    usage: Texture.TEXTURE | Texture.RENDER_ATTACHMENT | Texture.COPY_DST,
    width: undefined!,
    height: undefined!,
    depth: 1,
    mipmaps: false,
    compressed: false,
    mipLevels: undefined!,
    samples: undefined!,
    sampler: {},
    view: undefined!,
    flipY: undefined!
  };

  protected static defaultCopyDataOptions: Required<CopyImageDataOptions> = {
    data: undefined!,
    byteOffset: 0,
    bytesPerRow: 0,
    rowsPerImage: 0,
    mipLevel: 0,
    x: 0,
    y: 0,
    z: 0,
    aspect: 'all'
  };

  /** Default options */
  protected static defaultCopyExternalImageOptions: Required<CopyExternalImageOptions> = {
    image: undefined!,
    sourceX: 0,
    sourceY: 0,
    width: undefined!,
    height: undefined!,
    depth: 1,
    mipLevel: 0,
    x: 0,
    y: 0,
    z: 0,
    aspect: 'all',
    colorSpace: 'srgb',
    premultipliedAlpha: false,
    flipY: false
  };
}
