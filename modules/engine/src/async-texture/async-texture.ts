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

import {loadImageBitmap} from '../application-utils/load-file';

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

  texture: Texture;
  sampler: Sampler;
  view: TextureView;

  readonly ready: Promise<void>;
  isReady: boolean = false;
  destroyed: boolean = false;

  protected resolveReady: () => void;
  protected rejectReady: (error: Error) => void;

  constructor(device: Device, props: AsyncTextureProps) {
    this.device = device;

    // Signature: new AsyncTexture(device, {data: url})
    if (typeof props?.data === 'string' && props.dimension === '2d') {
      props = {...props, data: loadImageBitmap(props.data)};
    }

    this.ready = new Promise<void>((resolve, reject) => {
      this.resolveReady = () => {
        this.isReady = true;
        resolve();
      };
      this.rejectReady = reject;
    });

    this.initAsync(props);
  }

  async initAsync(props: AsyncTextureProps): Promise<void> {
    let resolveReady;
    let rejectReady;

    const asyncData: AsyncTextureData = props.data;
    const data: TextureData = await awaitAllPromises(asyncData).then(resolveReady, rejectReady);

    // Check that we haven't been destroyed while waiting for texture data to load
    if (this.destroyed) {
      return;
    }

    // Now we can actually create the texture
    // @ts-expect-error Discriminated union
    const syncProps: TextureProps = {...props, data};

    this.texture = this.device.createTexture(syncProps);
    this.sampler = this.texture.sampler;
    this.view = this.texture.view;
    this.isReady = true;
  }

  destroy(): void {
    if (this.texture) {
      this.texture.destroy();
      this.texture = null;
    }
    this.destroyed = true;
  }

  // We could implement resize by replacing the texture
  // resize(width: number, height: number): boolean {
  //   throw new Error('Not implemented');
  //   // return false;
  // }
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
