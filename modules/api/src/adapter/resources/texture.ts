// luma.gl, MIT license
import type Device from '../device';
import type {TextureFormat} from '../types/formats';
import Resource, {ResourceProps, DEFAULT_RESOURCE_PROPS} from './resource';
import Sampler, {SamplerProps} from './sampler';

// required GPUExtent3D size;
// GPUIntegerCoordinate mipLevelCount = 1;
// GPUSize32 sampleCount = 1;
// GPUTextureDimension dimension = "2d";
// required GPUTextureFormat format;
// required GPUTextureUsageFlags usage;

/** Abstract Texture interface */
export type TextureProps = ResourceProps & {
  format?: TextureFormat | number;
  dimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  width?: number;
  height?: number;
  depth?: number;
  usage?: number;

  data?: any;
  mipmaps?: boolean;
  sampler?: Sampler | SamplerProps;

  mipLevels?: number;
  samples?: number;
  type?: number;
  compressed?: boolean;

  /** @deprecated use sampler */
  parameters?: object;
  /** @deprecated use data */
  pixels?: any;
  /** @deprecated use format */
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
  width: undefined,
  height: undefined,
  depth: 1,
  mipmaps: false,
  parameters: {},
  type: undefined,
  compressed: false,
  // mipLevels: 1,
  format: 'rgba8unorm',
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
  get [Symbol.toStringTag](): string { return 'Texture'; }

  constructor(device: Device, props: TextureProps) {
    super(device, props, DEFAULT_TEXTURE_PROPS);
  }
}
