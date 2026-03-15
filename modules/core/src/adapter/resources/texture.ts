// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type TypedArray} from '@math.gl/types';
import {type Device} from '../device';
import {
  type TextureFormat,
  type TextureMemoryLayout,
  type TextureFormatInfo
} from '../../shadertypes/textures/texture-formats';
import {type ExternalImage} from '../../image-utils/image-types';
import {type TextureView, type TextureViewProps} from './texture-view';
import {Resource, type ResourceProps} from './resource';
import {Sampler, type SamplerProps} from './sampler';
import {Buffer} from './buffer';
import {log} from '../../utils/log';
import {textureFormatDecoder} from '../../shadertypes/textures/texture-format-decoder';

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
  /** Width to copy */
  width?: number;
  /** Height to copy */
  height?: number;
  /** Copy depth or number of layers */
  depthOrArrayLayers?: number;
  /** @deprecated Use `depthOrArrayLayers` */
  depth?: number;
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

export type TextureReadOptions = {
  /** Start reading from offset x (default 0) */
  x?: number;
  /** Start reading from offset y (default 0) */
  y?: number;
  /** Start reading from layer / depth slice z (default 0) */
  z?: number;
  /** Width of the region to read. Defaults to the mip width. */
  width?: number;
  /** Height of the region to read. Defaults to the mip height. */
  height?: number;
  /** Number of array layers or depth slices to read. Defaults to 1. */
  depthOrArrayLayers?: number;
  /** Which mip-level to read from (default 0) */
  mipLevel?: number;
  /** When reading from depth stencil textures (default 'all') */
  aspect?: 'all' | 'stencil-only' | 'depth-only';
};

export type TextureWriteOptions = {
  /** Offset into the source data or buffer, in bytes. */
  byteOffset?: number;
  /** The stride, in bytes, between successive texel rows. */
  bytesPerRow?: number;
  /** The number of rows that make up one image when writing multiple layers or slices. */
  rowsPerImage?: number;
  /** Start writing into offset x (default 0) */
  x?: number;
  /** Start writing into offset y (default 0) */
  y?: number;
  /** Start writing into layer / depth slice z (default 0) */
  z?: number;
  /** Width of the region to write. Defaults to the mip width. */
  width?: number;
  /** Height of the region to write. Defaults to the mip height. */
  height?: number;
  /** Number of array layers or depth slices to write. Defaults to 1, or the full mip depth for 3D textures. */
  depthOrArrayLayers?: number;
  /** Which mip-level to write into (default 0) */
  mipLevel?: number;
  /** When writing into depth stencil textures (default 'all') */
  aspect?: 'all' | 'stencil-only' | 'depth-only';
};

const BASE_DIMENSIONS = {
  '1d': '1d',
  '2d': '2d',
  '2d-array': '2d',
  cube: '2d',
  'cube-array': '2d',
  '3d': '3d'
} as const satisfies Record<string, '1d' | '2d' | '3d'>;

/** Texture properties */
export type TextureProps = ResourceProps & {
  /** @deprecated Use DynamicTexture to create textures with data. */
  data?: ExternalImage | TypedArray | null;
  /** Dimension of this texture. Defaults to '2d' */
  dimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  /** The format (bit layout) of the textures pixel data */
  format?: TextureFormat;
  /** Width in texels */
  width: number;
  /** Width in texels */
  height: number;
  /** Number of depth layers */
  depth?: number;
  /** How this texture will be used. Defaults to TEXTURE | COPY_DST | RENDER_ATTACHMENT */
  usage?: number;
  /** How many mip levels */
  mipLevels?: number;
  /** Multi sampling */
  samples?: number;

  /** Sampler (or SamplerProps) for the default sampler for this texture. Used if no sampler provided. Note that other samplers can still be used. */
  sampler?: Sampler | SamplerProps;
  /** Props for the default TextureView for this texture. Note that other views can still be created and used. */
  view?: TextureViewProps;
};

/**
 * Abstract Texture interface
 * Texture Object
 * https://gpuweb.github.io/gpuweb/#gputexture
 */
export abstract class Texture extends Resource<TextureProps> {
  /** The texture can be bound for use as a sampled texture in a shader */
  static SAMPLE = 0x04;
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
  /** base dimension of this texture */
  readonly baseDimension: '1d' | '2d' | '3d';
  /** format of this texture */
  readonly format: TextureFormat;
  /** width in pixels of this texture */
  readonly width: number;
  /** height in pixels of this texture */
  readonly height: number;
  /** depth of this texture */
  readonly depth: number;
  /** mip levels in this texture */
  readonly mipLevels: number;
  /** Rows are multiples of this length, padded with extra bytes if needed */
  readonly byteAlignment: number;
  /** Default sampler for this texture */
  abstract sampler: Sampler;
  /** Default view for this texture */
  abstract view: TextureView;

  /** The ready promise is always resolved. It is provided for type compatibility with DynamicTexture. */
  readonly ready: Promise<Texture> = Promise.resolve(this);
  /** isReady is always true. It is provided for type compatibility with DynamicTexture. */
  readonly isReady: boolean = true;

  /** "Time" of last update. Monotonically increasing timestamp. TODO move to DynamicTexture? */
  updateTimestamp: number;

  override get [Symbol.toStringTag](): string {
    return 'Texture';
  }

  override toString(): string {
    return `Texture(${this.id},${this.format},${this.width}x${this.height})`;
  }

  /** Do not use directly. Create with device.createTexture() */
  constructor(device: Device, props: TextureProps, backendProps?: {byteAlignment?: number}) {
    props = Texture.normalizeProps(device, props);
    super(device, props, Texture.defaultProps);
    this.dimension = this.props.dimension;
    this.baseDimension = BASE_DIMENSIONS[this.dimension];
    this.format = this.props.format;

    // Size
    this.width = this.props.width;
    this.height = this.props.height;
    this.depth = this.props.depth;
    this.mipLevels = this.props.mipLevels;

    if (this.dimension === 'cube') {
      this.depth = 6;
    }

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
            `${this} created with undefined width or height. This is deprecated. Use DynamicTexture instead.`
          )();
        }
      }
    }

    this.byteAlignment = backendProps?.byteAlignment || 1;

    // TODO - perhaps this should be set on async write completion?
    this.updateTimestamp = device.incrementTimestamp();
  }

  /**
   * Create a new texture with the same parameters and optionally a different size
   * @note Textures are immutable and cannot be resized after creation, but we can create a similar texture with the same parameters but a new size.
   * @note Does not copy contents of the texture
   */
  clone(size?: {width: number; height: number}): Texture {
    return this.device.createTexture({...this.props, ...size});
  }

  /** Set sampler props associated with this texture */
  setSampler(sampler: Sampler | SamplerProps): void {
    this.sampler = sampler instanceof Sampler ? sampler : this.device.createSampler(sampler);
  }

  /** Create a texture view for this texture */
  abstract createView(props: TextureViewProps): TextureView;

  /** Copy an image (e.g an ImageBitmap) into the texture */
  abstract copyExternalImage(options: CopyExternalImageOptions): {width: number; height: number};

  /**
   * Copy raw image data (bytes) into the texture.
   * @deprecated Use writeData()
   */
  copyImageData(options: CopyImageDataOptions): void {
    const {data, depth, ...writeOptions} = options;
    const normalizedWriteOptions = this._normalizeTextureWriteOptions({
      ...writeOptions,
      depthOrArrayLayers: writeOptions.depthOrArrayLayers ?? depth
    });
    this.writeData(data, normalizedWriteOptions);
  }

  /**
   * Calculates the memory layout of the texture, required when reading and writing data.
   * @return the memory layout of the texture, in particular bytesPerRow which includes required padding
   */
  computeMemoryLayout(options_: TextureReadOptions = {}): TextureMemoryLayout {
    const options = this._normalizeTextureReadOptions(options_);
    const {width = this.width, height = this.height, depthOrArrayLayers = this.depth} = options;
    const {format, byteAlignment} = this;

    // TODO - does the overriding above make sense?
    // return textureFormatDecoder.computeMemoryLayout(this);
    return textureFormatDecoder.computeMemoryLayout({
      format,
      width,
      height,
      depth: depthOrArrayLayers,
      byteAlignment
    });
  }

  /**
   * Read the contents of a texture into a GPU Buffer.
   * @returns A Buffer containing the texture data.
   *
   * @note The memory layout of the texture data is determined by the texture format and dimensions.
   * @note The application can call Texture.computeMemoryLayout() to compute the layout.
   * @note The application can call Buffer.readAsync()
   * @note If not supplied a buffer will be created and the application needs to call Buffer.destroy
   */
  readBuffer(options?: TextureReadOptions, buffer?: Buffer): Buffer {
    throw new Error('readBuffer not implemented');
  }

  /**
   * Reads data from a texture into an ArrayBuffer.
   * @returns An ArrayBuffer containing the texture data.
   *
   * @note The memory layout of the texture data is determined by the texture format and dimensions.
   * @note The application can call Texture.computeMemoryLayout() to compute the layout.
   */
  readDataAsync(options?: TextureReadOptions): Promise<ArrayBuffer> {
    throw new Error('readBuffer not implemented');
  }

  /**
   * Writes an GPU Buffer into a texture.
   *
   * @param buffer - Source GPU buffer.
   * @param options - Destination subresource, extent, and source layout options.
   * @note The memory layout of the texture data is determined by the texture format and dimensions.
   * @note The application can call Texture.computeMemoryLayout() to compute the layout.
   */
  writeBuffer(buffer: Buffer, options?: TextureWriteOptions): void {
    throw new Error('readBuffer not implemented');
  }

  /**
   * Writes an array buffer into a texture.
   *
   * @param data - Source texel data.
   * @param options - Destination subresource, extent, and source layout options.
   * @note The memory layout of the texture data is determined by the texture format and dimensions.
   * @note The application can call Texture.computeMemoryLayout() to compute the layout.
   */
  writeData(
    data: ArrayBuffer | SharedArrayBuffer | ArrayBufferView,
    options?: TextureWriteOptions
  ): void {
    throw new Error('readBuffer not implemented');
  }

  // IMPLEMENTATION SPECIFIC

  /**
   * WebGL can read data synchronously.
   * @note While it is convenient, the performance penalty is very significant
   */
  readDataSyncWebGL(options?: TextureReadOptions): ArrayBuffer | ArrayBufferView {
    throw new Error('readDataSyncWebGL not available');
  }

  /** Generate mipmaps (WebGL only) */
  generateMipmapsWebGL(): void {
    throw new Error('generateMipmapsWebGL not available');
  }

  // HELPERS

  /** Ensure we have integer coordinates */
  protected static normalizeProps(device: Device, props: TextureProps): TextureProps {
    const newProps = {...props};

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

  /** Initialize texture with supplied props */
  // eslint-disable-next-line max-statements
  _initializeData(data: TextureProps['data']): void {
    // Store opts for accessors

    if (this.device.isExternalImage(data)) {
      this.copyExternalImage({
        image: data,
        width: this.width,
        height: this.height,
        depth: this.depth,
        mipLevel: 0,
        x: 0,
        y: 0,
        z: 0,
        aspect: 'all',
        colorSpace: 'srgb',
        premultipliedAlpha: false,
        flipY: false
      });
    } else if (data) {
      this.copyImageData({
        data,
        // width: this.width,
        // height: this.height,
        // depth: this.depth,
        mipLevel: 0,
        x: 0,
        y: 0,
        z: 0,
        aspect: 'all'
      });
    }
  }

  _normalizeCopyImageDataOptions(options_: CopyImageDataOptions): Required<CopyImageDataOptions> {
    const {data, depth, ...writeOptions} = options_;
    const options = this._normalizeTextureWriteOptions({
      ...writeOptions,
      depthOrArrayLayers: writeOptions.depthOrArrayLayers ?? depth
    });
    return {data, depth: options.depthOrArrayLayers, ...options};
  }

  _normalizeCopyExternalImageOptions(
    options_: CopyExternalImageOptions
  ): Required<CopyExternalImageOptions> {
    const optionsWithoutUndefined = Texture._omitUndefined(options_);
    const mipLevel = optionsWithoutUndefined.mipLevel ?? 0;
    const mipLevelSize = this._getMipLevelSize(mipLevel);
    const size = this.device.getExternalImageSize(options_.image);
    const options = {
      ...Texture.defaultCopyExternalImageOptions,
      ...mipLevelSize,
      ...size,
      ...optionsWithoutUndefined
    };
    // WebGL will error if we try to copy outside the bounds of the texture
    options.width = Math.min(options.width, mipLevelSize.width - options.x);
    options.height = Math.min(options.height, mipLevelSize.height - options.y);
    options.depth = Math.min(options.depth, mipLevelSize.depthOrArrayLayers - options.z);
    return options;
  }

  _normalizeTextureReadOptions(options_: TextureReadOptions): Required<TextureReadOptions> {
    const optionsWithoutUndefined = Texture._omitUndefined(options_);
    const mipLevel = optionsWithoutUndefined.mipLevel ?? 0;
    const mipLevelSize = this._getMipLevelSize(mipLevel);
    const options = {
      ...Texture.defaultTextureReadOptions,
      ...mipLevelSize,
      ...optionsWithoutUndefined
    };
    // WebGL will error if we try to copy outside the bounds of the texture
    options.width = Math.min(options.width, mipLevelSize.width - options.x);
    options.height = Math.min(options.height, mipLevelSize.height - options.y);
    options.depthOrArrayLayers = Math.min(
      options.depthOrArrayLayers,
      mipLevelSize.depthOrArrayLayers - options.z
    );
    return options;
  }

  /**
   * Normalizes a texture read request and validates the color-only readback contract used by the
   * current texture read APIs. Supported dimensions are `2d`, `cube`, `cube-array`,
   * `2d-array`, and `3d`.
   *
   * @throws if the texture format, aspect, or dimension is not supported by the first-pass
   * color-read implementation.
   */
  protected _getSupportedColorReadOptions(
    options_: TextureReadOptions
  ): Required<TextureReadOptions> {
    const options = this._normalizeTextureReadOptions(options_);
    const formatInfo = textureFormatDecoder.getInfo(this.format);

    this._validateColorReadAspect(options);
    this._validateColorReadFormat(formatInfo);

    switch (this.dimension) {
      case '2d':
      case 'cube':
      case 'cube-array':
      case '2d-array':
      case '3d':
        return options;

      default:
        throw new Error(`${this} color readback does not support ${this.dimension} textures`);
    }
  }

  /** Validates that a read request targets the full color aspect of the texture. */
  protected _validateColorReadAspect(options: Required<TextureReadOptions>): void {
    if (options.aspect !== 'all') {
      throw new Error(`${this} color readback only supports aspect 'all'`);
    }
  }

  /** Validates that a read request targets an uncompressed color-renderable texture format. */
  protected _validateColorReadFormat(formatInfo: TextureFormatInfo): void {
    if (formatInfo.compressed) {
      throw new Error(
        `${this} color readback does not support compressed formats (${this.format})`
      );
    }

    switch (formatInfo.attachment) {
      case 'color':
        return;

      case 'depth':
        throw new Error(`${this} color readback does not support depth formats (${this.format})`);

      case 'stencil':
        throw new Error(`${this} color readback does not support stencil formats (${this.format})`);

      case 'depth-stencil':
        throw new Error(
          `${this} color readback does not support depth-stencil formats (${this.format})`
        );

      default:
        throw new Error(`${this} color readback does not support format ${this.format}`);
    }
  }

  _normalizeTextureWriteOptions(options_: TextureWriteOptions): Required<TextureWriteOptions> {
    const optionsWithoutUndefined = Texture._omitUndefined(options_);
    const mipLevel = optionsWithoutUndefined.mipLevel ?? 0;
    const mipLevelSize = this._getMipLevelSize(mipLevel);
    const options = {
      ...Texture.defaultTextureWriteOptions,
      ...mipLevelSize,
      ...optionsWithoutUndefined
    };

    options.width = Math.min(options.width, mipLevelSize.width - options.x);
    options.height = Math.min(options.height, mipLevelSize.height - options.y);
    options.depthOrArrayLayers = Math.min(
      options.depthOrArrayLayers,
      mipLevelSize.depthOrArrayLayers - options.z
    );

    const layout = textureFormatDecoder.computeMemoryLayout({
      format: this.format,
      width: options.width,
      height: options.height,
      depth: options.depthOrArrayLayers,
      byteAlignment: this.byteAlignment
    });

    const minimumBytesPerRow = layout.bytesPerPixel * options.width;
    options.bytesPerRow = optionsWithoutUndefined.bytesPerRow ?? layout.bytesPerRow;
    options.rowsPerImage = optionsWithoutUndefined.rowsPerImage ?? options.height;

    if (options.bytesPerRow < minimumBytesPerRow) {
      throw new Error(
        `bytesPerRow (${options.bytesPerRow}) must be at least ${minimumBytesPerRow} for ${this.format}`
      );
    }
    if (options.rowsPerImage < options.height) {
      throw new Error(
        `rowsPerImage (${options.rowsPerImage}) must be at least ${options.height} for ${this.format}`
      );
    }

    const bytesPerPixel = this.device.getTextureFormatInfo(this.format).bytesPerPixel;
    if (bytesPerPixel && options.bytesPerRow % bytesPerPixel !== 0) {
      throw new Error(
        `bytesPerRow (${options.bytesPerRow}) must be a multiple of bytesPerPixel (${bytesPerPixel}) for ${this.format}`
      );
    }

    return options;
  }

  protected _getMipLevelSize(
    mipLevel: number
  ): Required<Pick<TextureReadOptions, 'width' | 'height' | 'depthOrArrayLayers'>> {
    const width = Math.max(1, this.width >> mipLevel);
    const height = this.baseDimension === '1d' ? 1 : Math.max(1, this.height >> mipLevel);
    const depthOrArrayLayers =
      this.dimension === '3d' ? Math.max(1, this.depth >> mipLevel) : this.depth;

    return {width, height, depthOrArrayLayers};
  }

  protected static _omitUndefined<T extends object>(options: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(options).filter(([, value]) => value !== undefined)
    ) as Partial<T>;
  }

  static override defaultProps: Required<TextureProps> = {
    ...Resource.defaultProps,
    data: null,
    dimension: '2d',
    format: 'rgba8unorm',
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST,
    width: undefined!,
    height: undefined!,
    depth: 1,
    mipLevels: 1,
    samples: undefined!,
    sampler: {},
    view: undefined!
  };

  protected static defaultCopyDataOptions: Required<CopyImageDataOptions> = {
    data: undefined!,
    byteOffset: 0,
    bytesPerRow: undefined!,
    rowsPerImage: undefined!,
    width: undefined!,
    height: undefined!,
    depthOrArrayLayers: undefined!,
    depth: 1,
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

  protected static defaultTextureReadOptions: Required<TextureReadOptions> = {
    x: 0,
    y: 0,
    z: 0,
    width: undefined!,
    height: undefined!,
    depthOrArrayLayers: 1,
    mipLevel: 0,
    aspect: 'all'
  };

  protected static defaultTextureWriteOptions: Required<TextureWriteOptions> = {
    byteOffset: 0,
    bytesPerRow: undefined!,
    rowsPerImage: undefined!,
    x: 0,
    y: 0,
    z: 0,
    width: undefined!,
    height: undefined!,
    depthOrArrayLayers: 1,
    mipLevel: 0,
    aspect: 'all'
  };
}
