// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import type {Texture, TextureProps, Sampler, TextureView, Device} from '@luma.gl/core';

import type {
  Texture1DData,
  Texture2DData,
  Texture3DData,
  TextureArrayData,
  TextureCubeData,
  TextureCubeArrayData
} from '@luma.gl/core';

export type AsyncTextureProps = Omit<TextureProps, 'data'> & AsyncTextureDataProps;

type AsyncTextureDataProps =
  | AsyncTexture1DProps
  | AsyncTexture2DProps
  | AsyncTexture3DProps
  | AsyncTextureArrayProps
  | AsyncTextureCubeProps
  | AsyncTextureCubeArrayProps;

type AsyncTexture1DProps = {dimension: '1d'; data: Promise<Texture1DData> | Texture1DData | null};
type AsyncTexture2DProps = {dimension?: '2d'; data: Promise<Texture2DData> | Texture2DData | null};
type AsyncTexture3DProps = {dimension: '3d'; data: Promise<Texture3DData> | Texture3DData | null};
type AsyncTextureArrayProps = {
  dimension: '2d-array';
  data: Promise<TextureArrayData> | TextureArrayData | null;
};
type AsyncTextureCubeProps = {
  dimension: 'cube';
  data: Promise<TextureCubeData> | TextureCubeData | null;
};
type AsyncTextureCubeArrayProps = {
  dimension: 'cube-array';
  data: Promise<TextureCubeArrayData> | TextureCubeArrayData | null;
};

type TextureData = TextureProps['data'];
type AsyncTextureData = AsyncTextureProps['data'];

/**
 * It is very convenient to be able to initialize textures with promises
 * This can add considerable complexity to the Texture class, and doesn't
 * fit with the immutable nature of WebGPU resources.
 * Instead, luma.gl offers async textures as a separate class.
 */
export class AsyncTexture {
  readonly device: Device;

  initialized: boolean = false;
  texture: Texture;
  sampler: Sampler;
  view: TextureView;

  constructor(device: Device, props: AsyncTextureProps) {
    this.device = device;
    this.createAsyncTexture(props);
  }

  // resize(width: number, height: number): boolean {
  //   return false;
  // }

  // Implementation

  protected async createAsyncTexture(props: AsyncTextureProps) {
    // Signature: new Texture2D(gl, {data: url})
    // if (typeof this.props?.data === 'string') {
    //   Object.assign(this.props, {data: loadImage(this.props.data)});
    // }

    const asyncData: AsyncTextureData = props.data;
    const data: TextureData = await awaitAllPromises(asyncData);

    // @ts-expect-error Discriminated union
    const syncProps: TextureProps = {...props, data};

    this.texture = this.device.createTexture(syncProps);
    this.sampler = this.texture.sampler;
    this.view = this.texture.view;
    this.initialized = true;
  }
}

// HELPERS

/** Resolve all promises in a nested data structure */
async function awaitAllPromises(x: any): Promise<any> {
  x = await x;
  if (Array.isArray(x)) {
    return x.map(awaitAllPromises);
  }
  if (x && typeof x === 'object' && x.constructor === Object) {
    const entries = Object.entries(x).map(([key, value]) => [key, awaitAllPromises(value)]);
    return Object.fromEntries(entries);
  }
  return x;
}
