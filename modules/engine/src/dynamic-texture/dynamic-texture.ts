// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import type {
  TextureProps,
  SamplerProps,
  TextureView,
  Device,
  TextureFormat,
  TextureReadOptions
} from '@luma.gl/core';

import {Buffer, Texture, Sampler, log} from '@luma.gl/core';

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
  resolveTextureImageFormat,
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
  async initAsync(originalPropsWithAsyncData: DynamicTextureProps): Promise<void> {
    try {
      // TODO - Accept URL string for 2D: turn into ExternalImage promise
      // const dataProps =
      //   typeof props.data === 'string' && (props.dimension ?? '2d') === '2d'
      //     ? ({dimension: '2d', data: loadImageBitmap(props.data)} as const)
      //     : {};

      const propsWithSyncData = await this._loadAllData(originalPropsWithAsyncData);
      this._checkNotDestroyed();
      const subresources = propsWithSyncData.data ? getTextureSubresources(propsWithSyncData) : [];
      const userProvidedFormat =
        'format' in originalPropsWithAsyncData && originalPropsWithAsyncData.format !== undefined;
      const userProvidedUsage =
        'usage' in originalPropsWithAsyncData && originalPropsWithAsyncData.usage !== undefined;

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

      // Normalize caller-provided subresources into one validated mip chain description.
      const textureData = analyzeTextureSubresources(this.device, subresources, size, {
        format: userProvidedFormat ? originalPropsWithAsyncData.format : undefined
      });
      const resolvedFormat = textureData.format ?? this.props.format;

      // Create a minimal TextureProps and validate via `satisfies`
      const baseTextureProps = {
        ...this.props,
        ...size,
        format: resolvedFormat,
        mipLevels: 1, // temporary; updated below
        data: undefined
      } satisfies TextureProps;

      if (this.device.isTextureFormatCompressed(resolvedFormat) && !userProvidedUsage) {
        baseTextureProps.usage = Texture.SAMPLE | Texture.COPY_DST;
      }

      // Explicit mip arrays take ownership of the mip chain; otherwise we may auto-generate it.
      const shouldGenerateMipmaps =
        this.props.mipmaps &&
        !textureData.hasExplicitMipChain &&
        !this.device.isTextureFormatCompressed(resolvedFormat);

      if (this.device.type === 'webgpu' && shouldGenerateMipmaps) {
        const requiredUsage =
          this.props.dimension === '3d'
            ? Texture.SAMPLE | Texture.STORAGE | Texture.COPY_DST | Texture.COPY_SRC
            : Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST | Texture.COPY_SRC;
        baseTextureProps.usage |= requiredUsage;
      }

      // Compute mip levels (auto clamps to max)
      const maxMips = this.device.getMipLevelCount(baseTextureProps.width, baseTextureProps.height);
      const desired = textureData.hasExplicitMipChain
        ? textureData.mipLevels
        : this.props.mipLevels === 'auto'
          ? maxMips
          : Math.max(1, Math.min(maxMips, this.props.mipLevels ?? 1));

      const finalTextureProps: TextureProps = {...baseTextureProps, mipLevels: desired};

      this._texture = this.device.createTexture(finalTextureProps);
      this._sampler = this.texture.sampler;
      this._view = this.texture.view;

      // Upload data if provided
      if (textureData.subresources.length) {
        this._setTextureSubresources(textureData.subresources);
      }

      if (this.props.mipmaps && !textureData.hasExplicitMipChain && !shouldGenerateMipmaps) {
        log.warn(`${this} skipping auto-generated mipmaps for compressed texture format`)();
      }

      if (shouldGenerateMipmaps) {
        this.generateMipmaps();
      }

      this.isReady = true;
      this.resolveReady(this.texture);

      log.info(0, `${this} created`)();
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      this.rejectReady(err);
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
    if (this.device.type === 'webgl') {
      this.texture.generateMipmapsWebGL();
    } else if (this.device.type === 'webgpu') {
      this.device.generateMipmapsWebGPU(this.texture);
    } else {
      log.warn(`${this} mipmaps not supported on ${this.device.type}`);
    }
  }

  /** Set sampler or create one from props */
  setSampler(sampler: Sampler | SamplerProps = {}): void {
    this._checkReady();
    const s = sampler instanceof Sampler ? sampler : this.device.createSampler(sampler);
    this.texture.setSampler(s);
    this._sampler = s;
  }

  /**
   * Copies texture contents into a GPU buffer and waits until the copy is complete.
   * The caller owns the returned buffer and must destroy it when finished.
   */
  async readBuffer(options: TextureReadOptions = {}): Promise<Buffer> {
    if (!this.isReady) {
      await this.ready;
    }

    const width = options.width ?? this.texture.width;
    const height = options.height ?? this.texture.height;
    const depthOrArrayLayers = options.depthOrArrayLayers ?? this.texture.depth;
    const layout = this.texture.computeMemoryLayout({width, height, depthOrArrayLayers});

    const buffer = this.device.createBuffer({
      byteLength: layout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });

    this.texture.readBuffer(
      {
        ...options,
        width,
        height,
        depthOrArrayLayers
      },
      buffer
    );

    const fence = this.device.createFence();
    await fence.signaled;
    fence.destroy();

    return buffer;
  }

  /** Reads texture contents back to CPU memory. */
  async readAsync(options: TextureReadOptions = {}): Promise<ArrayBuffer> {
    if (!this.isReady) {
      await this.ready;
    }

    const width = options.width ?? this.texture.width;
    const height = options.height ?? this.texture.height;
    const depthOrArrayLayers = options.depthOrArrayLayers ?? this.texture.depth;
    const layout = this.texture.computeMemoryLayout({width, height, depthOrArrayLayers});

    const buffer = await this.readBuffer(options);
    const data = await buffer.readAsync(0, layout.byteLength);
    buffer.destroy();
    return data.buffer;
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
  setTextureCubeArrayData(data: TextureCubeArrayData): void {
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
          const {data, textureFormat} = subresource;
          if (textureFormat && textureFormat !== this.texture.format) {
            throw new Error(
              `${this} mip level ${mipLevel} uses format "${textureFormat}" but texture format is "${this.texture.format}"`
            );
          }
          this.texture.writeData(data.data, {
            x: 0,
            y: 0,
            z,
            width: data.width,
            height: data.height,
            depthOrArrayLayers: 1,
            mipLevel
          });
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

type TextureSubresourceAnalysis = {
  readonly subresources: TextureSubresource[];
  readonly mipLevels: number;
  readonly format?: TextureFormat;
  readonly hasExplicitMipChain: boolean;
};

// Flatten dimension-specific texture data into one list of uploadable subresources.
function getTextureSubresources(props: TextureDataProps): TextureSubresource[] {
  if (!props.data) {
    return [];
  }

  switch (props.dimension) {
    case '1d':
      return getTexture1DSubresources(props.data);
    case '2d':
      return getTexture2DSubresources(0, props.data);
    case '3d':
      return getTexture3DSubresources(props.data);
    case '2d-array':
      return getTextureArraySubresources(props.data);
    case 'cube':
      return getTextureCubeSubresources(props.data);
    case 'cube-array':
      return getTextureCubeArraySubresources(props.data);
    default:
      throw new Error(`Unhandled dimension ${(props as TextureDataProps).dimension}`);
  }
}

// Resolve a consistent texture format and the longest mip chain valid across all slices.
function analyzeTextureSubresources(
  device: Device,
  subresources: TextureSubresource[],
  size: {width: number; height: number},
  options: {format?: TextureFormat}
): TextureSubresourceAnalysis {
  if (subresources.length === 0) {
    return {
      subresources,
      mipLevels: 1,
      format: options.format,
      hasExplicitMipChain: false
    };
  }

  const groupedSubresources = new Map<number, TextureSubresource[]>();
  for (const subresource of subresources) {
    const group = groupedSubresources.get(subresource.z) ?? [];
    group.push(subresource);
    groupedSubresources.set(subresource.z, group);
  }

  const hasExplicitMipChain = subresources.some(subresource => subresource.mipLevel > 0);
  let resolvedFormat = options.format;
  let resolvedMipLevels = Number.POSITIVE_INFINITY;
  const validSubresources: TextureSubresource[] = [];

  for (const [z, sliceSubresources] of groupedSubresources) {
    // Validate each slice independently, then keep only the mip levels that are valid everywhere.
    const sortedSubresources = [...sliceSubresources].sort(
      (left, right) => left.mipLevel - right.mipLevel
    );
    const baseLevel = sortedSubresources[0];
    if (!baseLevel || baseLevel.mipLevel !== 0) {
      throw new Error(`DynamicTexture: slice ${z} is missing mip level 0`);
    }

    const baseSize = getTextureSubresourceSize(device, baseLevel);
    if (baseSize.width !== size.width || baseSize.height !== size.height) {
      throw new Error(
        `DynamicTexture: slice ${z} base level dimensions ${baseSize.width}x${baseSize.height} do not match expected ${size.width}x${size.height}`
      );
    }

    const baseFormat = getTextureSubresourceFormat(baseLevel);
    if (baseFormat) {
      if (resolvedFormat && resolvedFormat !== baseFormat) {
        throw new Error(
          `DynamicTexture: slice ${z} base level format "${baseFormat}" does not match texture format "${resolvedFormat}"`
        );
      }
      resolvedFormat = baseFormat;
    }

    const mipLevelLimit =
      resolvedFormat && device.isTextureFormatCompressed(resolvedFormat)
        ? // Block-compressed formats cannot have mips smaller than a single compression block.
          getMaxCompressedMipLevels(device, baseSize.width, baseSize.height, resolvedFormat)
        : device.getMipLevelCount(baseSize.width, baseSize.height);

    let validMipLevelsForSlice = 0;
    for (
      let expectedMipLevel = 0;
      expectedMipLevel < sortedSubresources.length;
      expectedMipLevel++
    ) {
      const subresource = sortedSubresources[expectedMipLevel];
      // Stop at the first gap so callers can provide extra trailing data without breaking creation.
      if (!subresource || subresource.mipLevel !== expectedMipLevel) {
        break;
      }
      if (expectedMipLevel >= mipLevelLimit) {
        break;
      }

      const subresourceSize = getTextureSubresourceSize(device, subresource);
      const expectedWidth = Math.max(1, baseSize.width >> expectedMipLevel);
      const expectedHeight = Math.max(1, baseSize.height >> expectedMipLevel);
      if (subresourceSize.width !== expectedWidth || subresourceSize.height !== expectedHeight) {
        break;
      }

      const subresourceFormat = getTextureSubresourceFormat(subresource);
      if (subresourceFormat) {
        if (!resolvedFormat) {
          resolvedFormat = subresourceFormat;
        }
        // Later mip levels must stay on the same format as the validated base level.
        if (subresourceFormat !== resolvedFormat) {
          break;
        }
      }

      validMipLevelsForSlice++;
      validSubresources.push(subresource);
    }

    resolvedMipLevels = Math.min(resolvedMipLevels, validMipLevelsForSlice);
  }

  const mipLevels = Number.isFinite(resolvedMipLevels) ? Math.max(1, resolvedMipLevels) : 1;

  return {
    // Keep every slice trimmed to the same mip count so the texture shape stays internally consistent.
    subresources: validSubresources.filter(subresource => subresource.mipLevel < mipLevels),
    mipLevels,
    format: resolvedFormat,
    hasExplicitMipChain
  };
}

// Read the per-level format using the transitional textureFormat -> format fallback rules.
function getTextureSubresourceFormat(subresource: TextureSubresource): TextureFormat | undefined {
  if (subresource.type !== 'texture-data') {
    return undefined;
  }
  return subresource.textureFormat ?? resolveTextureImageFormat(subresource.data);
}

// Resolve dimensions from either raw bytes or external-image subresources.
function getTextureSubresourceSize(
  device: Device,
  subresource: TextureSubresource
): {width: number; height: number} {
  switch (subresource.type) {
    case 'external-image':
      return device.getExternalImageSize(subresource.image);
    case 'texture-data':
      return {width: subresource.data.width, height: subresource.data.height};
    default:
      throw new Error('Unsupported texture subresource');
  }
}

// Count the mip levels that stay at or above one compression block in each dimension.
function getMaxCompressedMipLevels(
  device: Device,
  baseWidth: number,
  baseHeight: number,
  format: TextureFormat
): number {
  const {blockWidth = 1, blockHeight = 1} = device.getTextureFormatInfo(format);
  let mipLevels = 1;
  for (let mipLevel = 1; ; mipLevel++) {
    const width = Math.max(1, baseWidth >> mipLevel);
    const height = Math.max(1, baseHeight >> mipLevel);
    if (width < blockWidth || height < blockHeight) {
      break;
    }
    mipLevels++;
  }
  return mipLevels;
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
    const values = await Promise.all(Object.values(object).map(awaitAllPromises));
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
