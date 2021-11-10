// luma.gl, MIT license
import Resource, {ResourceProps, DEFAULT_RESOURCE_PROPS} from './resource';
import type Device from './device';

// required GPUExtent3D size;
// GPUIntegerCoordinate mipLevelCount = 1;
// GPUSize32 sampleCount = 1;
// GPUTextureDimension dimension = "2d";
// required GPUTextureFormat format;
// required GPUTextureUsageFlags usage;

/** Abstract Texture interface */
export type TextureProps = ResourceProps & {
  data?: any;
  width?: number;
  height?: number;
  depth?: number;

  pixels?: any;
  format?: number;
  dataFormat?: number;
  border?: number;
  recreate?: boolean;
  type?: number;
  compressed?: boolean;
  mipmaps?: boolean;

  parameters?: object;
  pixelStore?: object;
  textureUnit?: number;

  target?: number;
};

export type WebGPUTextureProps = ResourceProps & {
  dimension?: '1d' | '2d' | '3d';
  width: number;
  height: number;
  depth?: number;
  mipLevels?: number;
  format?: string;
  usage?: number;
};

export type TextureViewProps = {
  format: string;
  dimension: '1d', '2d', '2d-array', 'cube', 'cube-array', '3d';
  aspect?: 'all', 'stencil-only', 'depth-only';
  arrayLayerCount: number;
  baseArrayLayer?: number;
  mipLevelCount: number;
  baseMipLevel?: number;
};

const DEFAULT_TEXTURE_PROPS: Required<TextureProps> = {
  ...DEFAULT_RESOURCE_PROPS,
  dimension: '2d',
  width: 1,
  height: 1,
  depth: 1,
  mipLevels: 1,
  // @ts-expect-error
  format: 'unorm8',
  usage: 0
};

/** 
 * Abstract Texture interface
 * Texture Object
 * https://gpuweb.github.io/gpuweb/#gputexture
 */
export default abstract class Texture extends Resource<TextureProps> {
  constructor(device: Device, props: TextureProps) {
    super(device, props, DEFAULT_TEXTURE_PROPS);
  }

  get [Symbol.toStringTag](): string {
    return 'Texture';
  }
}
