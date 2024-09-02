// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import type {
  Texture,
  TextureProps,
  Sampler,
  TextureView,
  Device,
  Texture1DData,
  Texture2DData,
  Texture3DData,
  TextureArrayData,
  TextureCubeData,
  TextureCubeArrayData
} from '@luma.gl/core';

import {loadImageBitmap} from '../application-utils/load-file';
import {uid} from '../utils/uid';

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
  readonly id: string;

  // TODO - should we type these as possibly `null`? It will make usage harder?
  // @ts-expect-error
  texture: Texture;
  // @ts-expect-error
  sampler: Sampler;
  // @ts-expect-error
  view: TextureView;

  readonly ready: Promise<void>;
  isReady: boolean = false;
  destroyed: boolean = false;

  protected resolveReady: () => void = () => {};
  protected rejectReady: (error: Error) => void = () => {};

  get [Symbol.toStringTag]() {
    return 'AsyncTexture';
  }

  toString(): string {
    return `AsyncTexture:"${this.id}"(${this.isReady ? 'ready' : 'loading'})`;
  }

  constructor(device: Device, props: AsyncTextureProps) {
    this.device = device;
    this.id = props.id || uid('async-texture');
    // this.id = typeof props?.data === 'string' ? props.data.slice(-20) : uid('async-texture');

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
      // @ts-expect-error
      this.texture = null;
    }
    this.destroyed = true;
  }

  /**
   * Textures are immutable and cannot be resized after creation,
   * but we can create a similar texture with the same parameters but a new size.
   * @note Does not copy contents of the texture
   * @todo Abort pending promise and create a texture with the new size?
   */
  resize(size: {width: number; height: number}): boolean {
    if (!this.isReady) {
      throw new Error('Cannot resize texture before it is ready');
    }

    if (size.width === this.texture.width && size.height === this.texture.height) {
      return false;
    }

    if (this.texture) {
      const texture = this.texture;
      this.texture = texture.clone(size);
      texture.destroy();
    }
    return true;
  }
}

// HELPERS

/** Resolve all promises in a nested data structure */
async function awaitAllPromises(x: any): Promise<any> {
  x = await x;
  if (Array.isArray(x)) {
    return await Promise.all(x.map(awaitAllPromises));
  }
  if (x && typeof x === 'object' && x.constructor === Object) {
    const object: Record<string, any> = x;
    const values = await Promise.all(Object.values(object));
    const keys = Object.keys(object);
    const resolvedObject: Record<string, any> = {};
    for (let i = 0; i < keys.length; i++) {
      resolvedObject[keys[i]] = values[i];
    }
    return resolvedObject;
  }
  return x;
}
