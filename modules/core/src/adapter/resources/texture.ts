// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '../device';
import type {TypedArray} from '../../types';
import type {TextureFormat} from '../../gpu-type-utils/texture-formats';
import type {TextureView, TextureViewProps} from './texture-view';
import {Resource, ResourceProps} from './resource';
import {Sampler, SamplerProps} from './sampler';

/**
 * These represent the main compressed texture formats
 * Each format typically has a number of more specific subformats
 */
export type TextureCompressionFormat =
  | 'dxt'
  | 'dxt-srgb'
  | 'etc1'
  | 'etc2'
  | 'pvrtc'
  | 'atc'
  | 'astc'
  | 'rgtc';

/** Names of cube texture faces */
export type TextureCubeFace = '+X' | '-X' | '+Y' | '-Y' | '+Z' | '-Z';

/**
 * One mip level
 * Basic data structure is similar to `ImageData`
 * additional optional fields can describe compressed texture data.
 */
export type TextureLevelData = {
  /** WebGPU style format string. Defaults to 'rgba8unorm' */
  format?: TextureFormat;
  data: TypedArray;
  width: number;
  height: number;

  compressed?: boolean;
  byteLength?: number;
  hasAlpha?: boolean;
};

/**
 * Built-in data types that can be used to initialize textures
 * @note WebGL supports OffscreenCanvas but seems WebGPU does not?
 */
export type ExternalImage =
  | ImageData
  | ImageBitmap
  | HTMLImageElement
  | HTMLVideoElement
  | HTMLCanvasElement;

export type TextureLevelSource = TextureLevelData | ExternalImage;

/** Texture data can be one or more mip levels */
export type TextureData = TextureLevelData | ExternalImage | (TextureLevelData | ExternalImage)[];

/** @todo - define what data type is supported for 1D textures */
export type Texture1DData = TypedArray | TextureLevelData;

/** Texture data can be one or more mip levels */
export type Texture2DData =
  | TypedArray
  | TextureLevelData
  | ExternalImage
  | (TextureLevelData | ExternalImage)[];

/** Array of textures */
export type Texture3DData = TypedArray | TextureData[];

/** 6 face textures */
export type TextureCubeData = Record<TextureCubeFace, Texture2DData>;

/** Array of textures */
export type TextureArrayData = TextureData[];

/** Array of 6 face textures */
export type TextureCubeArrayData = Record<TextureCubeFace, TextureData>[];

type TextureDataProps =
  | Texture1DProps
  | Texture2DProps
  | Texture3DProps
  | TextureArrayProps
  | TextureCubeProps
  | TextureCubeArrayProps;

type Texture1DProps = {dimension: '1d'; data?: Texture1DData | null};
type Texture2DProps = {dimension?: '2d'; data?: Texture2DData | null};
type Texture3DProps = {dimension: '3d'; data?: Texture3DData | null};
type TextureArrayProps = {dimension: '2d-array'; data?: TextureArrayData | null};
type TextureCubeProps = {dimension: 'cube'; data?: TextureCubeData | null};
type TextureCubeArrayProps = {dimension: 'cube-array'; data: TextureCubeArrayData | null};

/** Texture properties */
export type TextureProps = ResourceProps &
  TextureDataProps & {
    format?: TextureFormat;
    width?: number | undefined;
    height?: number | undefined;
    depth?: number;
    usage?: number;

    /** How many mip levels */
    mipLevels?: number | 'pyramid';
    /** Multi sampling */
    samples?: number;

    /** Specifying mipmaps will default mipLevels to 'pyramid' and attempt to generate mipmaps */
    mipmaps?: boolean;

    /** Sampler (or SamplerProps) for the default sampler for this texture. Used if no sampler provided. Note that other samplers can still be used. */
    sampler?: Sampler | SamplerProps;
    /** Props for the default TextureView for this texture. Note that other views can still be created and used. */
    view?: TextureViewProps;

    /** @deprecated - this is implicit from format */
    compressed?: boolean;
  };

/**
 * Abstract Texture interface
 * Texture Object
 * https://gpuweb.github.io/gpuweb/#gputexture
 */
export abstract class Texture extends Resource<TextureProps> {
  static COPY_SRC = 0x01;
  static COPY_DST = 0x02;
  static TEXTURE = 0x04;
  static STORAGE = 0x08;
  static RENDER_ATTACHMENT = 0x10;

  static CubeFaces: TextureCubeFace[] = ['+X', '-X', '+Y', '-Y', '+Z', '-Z'];

  static override defaultProps: Required<TextureProps> = {
    ...Resource.defaultProps,
    data: null,
    dimension: '2d',
    format: 'rgba8unorm',
    width: undefined!,
    height: undefined!,
    depth: 1,
    mipmaps: false,
    compressed: false,
    usage: 0,
    mipLevels: undefined!,
    samples: undefined!,
    sampler: {},
    view: undefined!
  };

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
  depth: number;
  /** mip levels in this texture */
  mipLevels: number;

  /** Default sampler for this texture */
  abstract sampler: Sampler;
  /** Default view for this texture */
  abstract view: TextureView;

  /** "Time" of last update. Monotonically increasing timestamp */
  updateTimestamp: number;

  /** Check if data is an external image */
  static isExternalImage(data: unknown): data is ExternalImage {
    return (
      (typeof ImageData !== 'undefined' && data instanceof ImageData) ||
      (typeof ImageBitmap !== 'undefined' && data instanceof ImageBitmap) ||
      (typeof HTMLImageElement !== 'undefined' && data instanceof HTMLImageElement) ||
      (typeof HTMLCanvasElement !== 'undefined' && data instanceof HTMLCanvasElement) ||
      (typeof HTMLVideoElement !== 'undefined' && data instanceof HTMLVideoElement)
    );
  }

  /** Determine size (width and height) of provided image data */
  static getExternalImageSize(data: ExternalImage): {width: number; height: number} | null {
    if (
      (typeof ImageData !== 'undefined' && data instanceof ImageData) ||
      (typeof ImageBitmap !== 'undefined' && data instanceof ImageBitmap) ||
      (typeof HTMLCanvasElement !== 'undefined' && data instanceof HTMLCanvasElement)
    ) {
      return {width: data.width, height: data.height};
    }
    if (typeof HTMLImageElement !== 'undefined' && data instanceof HTMLImageElement) {
      return {width: data.naturalWidth, height: data.naturalHeight};
    }
    if (typeof HTMLVideoElement !== 'undefined' && data instanceof HTMLVideoElement) {
      return {width: data.videoWidth, height: data.videoHeight};
    }
    return null;
  }

  /** Check if texture data is a typed array */
  isTextureLevelData(data: TextureData): data is TextureLevelData {
    const typedArray = (data as TextureLevelData)?.data;
    return ArrayBuffer.isView(typedArray);
  }

  /** Get the size of the texture described by the provided TextureData */
  getTextureDataSize(
    data: TextureData | TextureCubeData | TextureArrayData | TextureCubeArrayData | TypedArray
  ): {width: number; height: number} | null {
    if (!data) {
      return null;
    }
    if (ArrayBuffer.isView(data)) {
      return null;
    }
    // Recurse into arrays (array of miplevels)
    if (Array.isArray(data)) {
      return this.getTextureDataSize(data[0]);
    }
    if (Texture.isExternalImage(data)) {
      return Texture.getExternalImageSize(data);
    }
    if (data && typeof data === 'object' && data.constructor === Object) {
      const untypedData = data as unknown as Record<string, number>;
      return {width: untypedData.width, height: untypedData.height};
    }
    throw new Error('texture size deduction failed');
  }

  /** Calculate the number of mip levels for a texture of width and height */
  getMipLevelCount(width: number, height: number): number {
    return Math.floor(Math.log2(Math.max(width, height))) + 1;
  }

  /** Convert luma.gl cubemap face constants to depth index */
  getCubeFaceDepth(face: TextureCubeFace): number {
    // prettier-ignore
    switch (face) {
        case '+X': return  0;
        case '-X': return  1;
        case '+Y': return  2;
        case '-Y': return  3;
        case '+Z': return  4;
        case '-Z': return  5;
        default: throw new Error(face);
      }
  }

  /** Do not use directly. Create with device.createTexture() */
  constructor(device: Device, props: TextureProps) {
    super(device, props, Texture.defaultProps);
    this.dimension = this.props.dimension;
    this.format = this.props.format;

    // Size
    this.width = this.props.width;
    this.height = this.props.height;
    this.depth = this.props.depth;

    // Calculate size, if not provided
    if (this.props.width === undefined || this.props.height === undefined) {
      // @ts-ignore
      const size = this.getTextureDataSize(this.props.data);
      this.width = size?.width || 1;
      this.height = size?.height || 1;
    }

    // mipLevels

    // If mipmap generation is requested and mipLevels is not provided, initialize a full pyramid
    if (this.props.mipmaps && this.props.mipLevels === undefined) {
      this.props.mipLevels = 'pyramid';
    }

    // Auto-calculate the number of mip levels as a convenience
    // TODO - Should we clamp to 1-getMipLevelCount?
    this.mipLevels =
      this.props.mipLevels === 'pyramid'
        ? this.getMipLevelCount(this.width, this.height)
        : this.props.mipLevels || 1;

    // TODO - perhaps this should be set on async write completion?
    this.updateTimestamp = device.incrementTimestamp();
  }

  /** Create a texture view for this texture */
  abstract createView(props: TextureViewProps): TextureView;

  /** Set sampler props associated with this texture */
  abstract setSampler(sampler?: Sampler | SamplerProps): void;
}
