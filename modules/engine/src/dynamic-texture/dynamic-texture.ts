// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import type {TextureProps, SamplerProps, TextureView, Device} from '@luma.gl/core';

import {Texture, Sampler, log} from '@luma.gl/core';

// import {loadImageBitmap} from '../application-utils/load-file';
import {uid} from '../utils/uid';
import {
  // cube constants
  type TextureCubeFace,
  TEXTURE_CUBE_FACE_MAP,

  // texture slice/mip data types
  type TextureSubresource,

  // props (dimension + data)
  type TextureDataProps,
  type TextureDataAsyncProps,

  // combined data for different texture types
  type Texture1DData,
  type Texture2DData,
  type Texture3DData,
  type TextureArrayData,
  type TextureCubeArrayData,
  type TextureCubeData,

  // Helpers
  getTextureSizeFromData,
  getTexture1DSubresources,
  getTexture2DSubresources,
  getTexture3DSubresources,
  getTextureCubeSubresources,
  getTextureArraySubresources,
  getTextureCubeArraySubresources
} from './texture-data';

/**
 * Properties for a dynamic texture
 */
export type DynamicTextureProps = Omit<TextureProps, 'data' | 'mipLevels' | 'width' | 'height'> &
  TextureDataAsyncProps & {
    /** Generate mipmaps after creating textures and setting data */
    mipmaps?: boolean;
    /** nipLevels can be set to 'auto' to generate max number of mipLevels */
    mipLevels?: number | 'auto';
    /** Width - can be auto-calculated when initializing from ExternalImage */
    width?: number;
    /** Height - can be auto-calculated when initializing from ExternalImage */
    height?: number;
  };

/**
 * Dynamic Textures
 *
 * - Mipmaps - DynamicTexture can generate mipmaps for textures (WebGPU does not provide built-in mipmap generation).
 *
 * - Texture initialization and updates - complex textures (2d array textures, cube textures, 3d textures) need multiple images
 *   `DynamicTexture` provides an API that makes it easy to provide the required data.
 *
 * - Texture resizing - Textures are immutable in WebGPU, meaning that they cannot be resized after creation.
 *   DynamicTexture provides a `resize()` method that internally creates a new texture with the same parameters
 *   but a different size.
 *
 * - Async image data initialization - It is often very convenient to be able to initialize textures with promises
 *   returned by image or data loading functions, as it allows a callback-free linear style of programming.
 *
 * @note GPU Textures are quite complex objects, with many subresources and modes of usage.
 * The `DynamicTexture` class allows luma.gl to provide some support for working with textures
 * without accumulating excessive complexity in the core Texture class which is designed as an immutable nature of GPU resource.
 */
export class DynamicTexture {
  readonly device: Device;
  readonly id: string;

  /** Props with defaults resolved (except `data` which is processed separately) */
  props: Readonly<Required<DynamicTextureProps>>;

  /** Created resources */
  private _texture: Texture | null = null;
  private _sampler: Sampler | null = null;
  private _view: TextureView | null = null;

  /** Ready when GPU texture has been created and data (if any) uploaded */
  readonly ready: Promise<Texture>;
  isReady = false;
  destroyed = false;

  private resolveReady: (t: Texture) => void = () => {};
  private rejectReady: (error: Error) => void = () => {};

  get texture(): Texture {
    if (!this._texture) throw new Error('Texture not initialized yet');
    return this._texture;
  }
  get sampler(): Sampler {
    if (!this._sampler) throw new Error('Sampler not initialized yet');
    return this._sampler;
  }
  get view(): TextureView {
    if (!this._view) throw new Error('View not initialized yet');
    return this._view;
  }

  get [Symbol.toStringTag]() {
    return 'DynamicTexture';
  }
  toString(): string {
    return `DynamicTexture:"${this.id}":${this.texture.width}x${this.texture.height}px:(${this.isReady ? 'ready' : 'loading...'})`;
  }

  constructor(device: Device, props: DynamicTextureProps) {
    this.device = device;

    const id = uid('dynamic-texture');
    // NOTE: We avoid holding on to data to make sure it can be garbage collected.
    const originalPropsWithAsyncData = props;
    this.props = {...DynamicTexture.defaultProps, id, ...props, data: null};
    this.id = this.props.id;

    this.ready = new Promise<Texture>((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });

    this.initAsync(originalPropsWithAsyncData);
  }

  /** @note Fire and forget; caller can await `ready` */
  async initAsync(originalPropsWithAsyncData: TextureDataAsyncProps): Promise<void> {
    try {
      // TODO - Accept URL string for 2D: turn into ExternalImage promise
      // const dataProps =
      //   typeof props.data === 'string' && (props.dimension ?? '2d') === '2d'
      //     ? ({dimension: '2d', data: loadImageBitmap(props.data)} as const)
      //     : {};

      const propsWithSyncData = await this._loadAllData(originalPropsWithAsyncData);
      this._checkNotDestroyed();

      // Deduce size when not explicitly provided
      // TODO - what about depth?
      const deduceSize = (): {width: number; height: number} => {
        if (this.props.width && this.props.height) {
          return {width: this.props.width, height: this.props.height};
        }

        const size = getTextureSizeFromData(propsWithSyncData);
        if (size) {
          return size;
        }

        return {width: this.props.width || 1, height: this.props.height || 1};
      };

      const size = deduceSize();
      if (!size || size.width <= 0 || size.height <= 0) {
        throw new Error(`${this} size could not be determined or was zero`);
      }

      // Create a minimal TextureProps and validate via `satisfies`
      const baseTextureProps = {
        ...this.props,
        ...size,
        mipLevels: 1, // temporary; updated below
        data: undefined
      } satisfies TextureProps;

      // Compute mip levels (auto clamps to max)
      const maxMips = this.device.getMipLevelCount(baseTextureProps.width, baseTextureProps.height);
      const desired =
        this.props.mipLevels === 'auto'
          ? maxMips
          : Math.max(1, Math.min(maxMips, this.props.mipLevels ?? 1));

      const finalTextureProps: TextureProps = {...baseTextureProps, mipLevels: desired};

      this._texture = this.device.createTexture(finalTextureProps);
      this._sampler = this.texture.sampler;
      this._view = this.texture.view;

      // Upload data if provided
      if (propsWithSyncData.data) {
        switch (propsWithSyncData.dimension) {
          case '1d':
            this.setTexture1DData(propsWithSyncData.data);
            break;
          case '2d':
            this.setTexture2DData(propsWithSyncData.data);
            break;
          case '3d':
            this.setTexture3DData(propsWithSyncData.data);
            break;
          case '2d-array':
            this.setTextureArrayData(propsWithSyncData.data);
            break;
          case 'cube':
            this.setTextureCubeData(propsWithSyncData.data);
            break;
          case 'cube-array':
            this.setTextureCubeArrayData(propsWithSyncData.data);
            break;
          default: {
            throw new Error(`Unhandled dimension ${propsWithSyncData.dimension}`);
          }
        }
      }

      if (this.props.mipmaps) {
        this.generateMipmaps();
      }

      this.isReady = true;
      this.resolveReady(this.texture);

      log.info(0, `${this} created`)();
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      this.rejectReady(err);
      throw err;
    }
  }

  destroy(): void {
    if (this._texture) {
      this._texture.destroy();
      this._texture = null;
      this._sampler = null;
      this._view = null;
    }
    this.destroyed = true;
  }

  generateMipmaps(): void {
    // Call the WebGL-style mipmap generation helper
    // WebGL implementation generates mipmaps, WebGPU logs a warning
    this.texture.generateMipmapsWebGL();
  }

  /** Set sampler or create one from props */
  setSampler(sampler: Sampler | SamplerProps = {}): void {
    this._checkReady();
    const s = sampler instanceof Sampler ? sampler : this.device.createSampler(sampler);
    this.texture.setSampler(s);
    this._sampler = s;
  }

  /**
   * Resize by cloning the underlying immutable texture.
   * Does not copy contents; caller may need to re-upload and/or regenerate mips.
   */
  resize(size: {width: number; height: number}): boolean {
    this._checkReady();

    if (size.width === this.texture.width && size.height === this.texture.height) {
      return false;
    }
    const prev = this.texture;
    this._texture = prev.clone(size);
    this._sampler = this.texture.sampler;
    this._view = this.texture.view;

    prev.destroy();
    log.info(`${this} resized`);
    return true;
  }

  /** Convert cube face label to texture slice index. Index can be used with `setTexture2DData()`. */
  getCubeFaceIndex(face: TextureCubeFace): number {
    const index = TEXTURE_CUBE_FACE_MAP[face];
    if (index === undefined) throw new Error(`Invalid cube face: ${face}`);
    return index;
  }

  /** Convert cube face label to texture slice index. Index can be used with `setTexture2DData()`. */
  getCubeArrayFaceIndex(cubeIndex: number, face: TextureCubeFace): number {
    return 6 * cubeIndex + this.getCubeFaceIndex(face);
  }

  /** @note experimental: Set multiple mip levels (1D) */
  setTexture1DData(data: Texture1DData): void {
    this._checkReady();
    if (this.texture.props.dimension !== '1d') {
      throw new Error(`${this} is not 1d`);
    }
    const subresources = getTexture1DSubresources(data);
    this._setTextureSubresources(subresources);
  }

  /** @note experimental: Set multiple mip levels (2D), optionally at `z`, slice (depth/array level) index */
  setTexture2DData(lodData: Texture2DData, z: number = 0): void {
    this._checkReady();
    if (this.texture.props.dimension !== '2d') {
      throw new Error(`${this} is not 2d`);
    }

    const subresources = getTexture2DSubresources(z, lodData);
    this._setTextureSubresources(subresources);
  }

  /** 3D: multiple depth slices, each may carry multiple mip levels */
  setTexture3DData(data: Texture3DData): void {
    if (this.texture.props.dimension !== '3d') {
      throw new Error(`${this} is not 3d`);
    }
    const subresources = getTexture3DSubresources(data);
    this._setTextureSubresources(subresources);
  }

  /** 2D array: multiple layers, each may carry multiple mip levels */
  setTextureArrayData(data: TextureArrayData): void {
    if (this.texture.props.dimension !== '2d-array') {
      throw new Error(`${this} is not 2d-array`);
    }
    const subresources = getTextureArraySubresources(data);
    this._setTextureSubresources(subresources);
  }

  /** Cube: 6 faces, each may carry multiple mip levels */
  setTextureCubeData(data: TextureCubeData): void {
    if (this.texture.props.dimension !== 'cube') {
      throw new Error(`${this} is not cube`);
    }
    const subresources = getTextureCubeSubresources(data);
    this._setTextureSubresources(subresources);
  }

  /** Cube array: multiple cubes (faces×layers), each face may carry multiple mips */
  private setTextureCubeArrayData(data: TextureCubeArrayData): void {
    if (this.texture.props.dimension !== 'cube-array') {
      throw new Error(`${this} is not cube-array`);
    }
    const subresources = getTextureCubeArraySubresources(data);
    this._setTextureSubresources(subresources);
  }

  /** Sets multiple mip levels on different `z` slices (depth/array index) */
  private _setTextureSubresources(subresources: TextureSubresource[]): void {
    // If user supplied multiple mip levels, warn if auto-mips also requested
    // if (lodArray.length > 1 && this.props.mipmaps !== false) {
    //   log.warn(
    //     `Texture ${this.id}: provided multiple LODs and also requested mipmap generation.`
    //   )();
    // }

    for (const subresource of subresources) {
      const {z, mipLevel} = subresource;
      switch (subresource.type) {
        case 'external-image':
          const {image, flipY} = subresource;
          this.texture.copyExternalImage({image, z, mipLevel, flipY});
          break;
        case 'texture-data':
          const {data} = subresource;
          // TODO - we are throwing away some of the info in data.
          // Did we not need it in the first place? Can we use it to validate?
          this.texture.copyImageData({data: data.data, z, mipLevel});
          break;
        default:
          throw new Error('Unsupported 2D mip-level payload');
      }
    }
  }

  // ------------------ helpers ------------------

  /** Recursively resolve all promises in data structures */
  private async _loadAllData(props: TextureDataAsyncProps): Promise<TextureDataProps> {
    const syncData = await awaitAllPromises(props.data);
    const dimension = (props.dimension ?? '2d') as TextureDataProps['dimension'];
    return {dimension, data: syncData ?? null} as TextureDataProps;
  }

  private _checkNotDestroyed() {
    if (this.destroyed) {
      log.warn(`${this} already destroyed`);
    }
  }

  private _checkReady() {
    if (!this.isReady) {
      log.warn(`${this} Cannot perform this operation before ready`);
    }
  }

  static defaultProps: Required<DynamicTextureProps> = {
    ...Texture.defaultProps,
    dimension: '2d',
    data: null,
    mipmaps: false
  };
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

// /** @note experimental: Set multiple mip levels (2D), optionally at `z`, slice (depth/array level) index */
// setTexture2DData(lodData: Texture2DData, z: number = 0): void {
//   this._checkReady();

//   const lodArray = this._normalizeTexture2DData(lodData);

//   // If user supplied multiple mip levels, warn if auto-mips also requested
//   if (lodArray.length > 1 && this.props.mipmaps !== false) {
//     log.warn(
//       `Texture ${this.id}: provided multiple LODs and also requested mipmap generation.`
//     )();
//   }

//   for (let mipLevel = 0; mipLevel < lodArray.length; mipLevel++) {
//     const imageData = lodArray[mipLevel];
//     if (this.device.isExternalImage(imageData)) {
//       this.texture.copyExternalImage({image: imageData, z, mipLevel, flipY: true});
//     } else if (this._isTextureImageData(imageData)) {
//       this.texture.copyImageData({data: imageData.data, z, mipLevel});
//     } else {
//       throw new Error('Unsupported 2D mip-level payload');
//     }
//   }
// }

// /** Normalize 2D layer payload into an array of mip-level items */
// private _normalizeTexture2DData(data: Texture2DData): (TextureImageData | ExternalImage)[] {
//   return Array.isArray(data) ? data : [data];
// }
