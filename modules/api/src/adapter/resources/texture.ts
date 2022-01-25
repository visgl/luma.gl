// luma.gl, MIT license
import type Device from '../device';
import type {TypedArray} from '../../types';
import type {TextureFormat} from '../types/texture-formats';
import Resource, {ResourceProps, DEFAULT_RESOURCE_PROPS} from './resource';
import Sampler, {SamplerProps} from './sampler';

// required GPUExtent3D size;
// GPUIntegerCoordinate mipLevelCount = 1;
// GPUSize32 sampleCount = 1;
// GPUTextureDimension dimension = "2d";
// required GPUTextureFormat format;
// required GPUTextureUsageFlags usage;

/** Data types that can be used to initialize textures */
export type TextureData = 
  TypedArray | ArrayBuffer | Buffer | ImageBitmap | HTMLImageElement
  ;

export type CubeTextureData = 
  Record<string, TextureData> |
  Record<string, Promise<TextureData>>
  ;

export type ExternalTextureData = HTMLVideoElement;

/** Abstract Texture interface */
export type TextureProps = ResourceProps & {
  format?: TextureFormat | number;
  dimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  width?: number;
  height?: number;
  depth?: number;
  usage?: number;

  data?: TextureData | Promise<TextureData> | CubeTextureData | string | HTMLVideoElement;
  mipmaps?: boolean;
  sampler?: Sampler | SamplerProps;

  mipLevels?: number;
  samples?: number;
  type?: number;
  compressed?: boolean;

  /** @deprecated use props.sampler */
  parameters?: Record<number, number>;
  /** @deprecated use props.data */
  pixels?: any;
  /** @deprecated use props.format */
  dataFormat?: number;
  /** @deprecated rarely supported */
  border?: number;
  /** @deprecated WebGL only. */
  pixelStore?: object;
  /** @deprecated WebGL only. */
  textureUnit?: number;
  /** @deprecated WebGL only. Use dimension. */
  target?: number;
  /** @deprecated not supported */
  recreate?: boolean;
};

export type WebGPUTextureProps = ResourceProps & {
  width: number;
  height: number;
  depth?: number;
  mipLevels?: number;
  format?: string;
};

export type TextureViewProps = {
  format: string;
  dimension: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  aspect?: 'all' | 'stencil-only' | 'depth-only';
  arrayLayerCount: number;
  baseArrayLayer?: number;
  mipLevels?: number;
  baseMipLevel?: number;
};

// @ts-expect-error
const DEFAULT_TEXTURE_PROPS: Required<TextureProps> = {
  ...DEFAULT_RESOURCE_PROPS,
  data: undefined,
  dimension: '2d',
  format: 'rgba8unorm',
  width: undefined,
  height: undefined,
  depth: 1,
  mipmaps: true,
  sampler: {},
  parameters: {},
  type: undefined,
  compressed: false,
  // mipLevels: 1,
  usage: 0
};

// const DEFAULT_TEXTURE_PROPS: Required<TextureProps> = {
//   handle: undefined,
//   id: undefined,
//   depth: 1,
//   format: 'rgba8unorm',
//   usage: GPUTextureUsage.COPY_DST
// };

/**
 * Abstract Texture interface
 * Texture Object
 * https://gpuweb.github.io/gpuweb/#gputexture
 */
export default abstract class Texture extends Resource<TextureProps> {
  static COPY_SRC = 0x01;
  static COPY_DST = 0x02;
  static TEXTURE_BINDING = 0x04;
  static STORAGE_BINDING = 0x08;
  static RENDER_ATTACHMENT = 0x10;

  get [Symbol.toStringTag](): string { return 'Texture'; }

  constructor(device: Device, props: TextureProps) {
    super(device, props, DEFAULT_TEXTURE_PROPS);
  }

  /** Default sampler for this device */
  abstract sampler: Sampler;
}
