// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import type {
  TextureProps,
  SamplerProps,
  TextureView,
  Device,
  TypedArray,
  TextureFormat,
  ExternalImage
} from '@luma.gl/core';

import {Texture, Sampler, log} from '@luma.gl/core';

import {loadImageBitmap} from '../application-utils/load-file';
import {uid} from '../utils/uid';

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

type AsyncTextureData = AsyncTextureProps['data'];

/** Names of cube texture faces */
export type TextureCubeFace = '+X' | '-X' | '+Y' | '-Y' | '+Z' | '-Z';
export const TextureCubeFaces: TextureCubeFace[] = ['+X', '-X', '+Y', '-Y', '+Z', '-Z'];
// prettier-ignore
export const TextureCubeFaceMap = {'+X': 0, '-X': 1, '+Y': 2, '-Y': 3, '+Z': 4, '-Z': 5};

/**
 * One mip level
 * Basic data structure is similar to `ImageData`
 * additional optional fields can describe compressed texture data.
 */
export type TextureImageData = {
  /** WebGPU style format string. Defaults to 'rgba8unorm' */
  format?: TextureFormat;
  data: TypedArray;
  width: number;
  height: number;

  compressed?: boolean;
  byteLength?: number;
  hasAlpha?: boolean;
};

export type TextureLevelSource = TextureImageData | ExternalImage;

/** Texture data can be one or more mip levels */
export type TextureData = TextureImageData | ExternalImage | (TextureImageData | ExternalImage)[];

/** @todo - define what data type is supported for 1D textures */
export type Texture1DData = TypedArray | TextureImageData;

/** Texture data can be one or more mip levels */
export type Texture2DData =
  | TypedArray
  | TextureImageData
  | ExternalImage
  | (TextureImageData | ExternalImage)[];

/** 6 face textures */
export type TextureCubeData = Record<TextureCubeFace, TextureData>;

/** Array of textures */
export type Texture3DData = TextureData[];

/** Array of textures */
export type TextureArrayData = TextureData[];

/** Array of 6 face textures */
export type TextureCubeArrayData = Record<TextureCubeFace, TextureData>[];

export const CubeFaces: TextureCubeFace[] = ['+X', '-X', '+Y', '-Y', '+Z', '-Z'];

/** Properties for an async texture */
export type AsyncTextureProps = Omit<TextureProps, 'data' | 'mipLevels' | 'width' | 'height'> &
  AsyncTextureDataProps & {
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
 * It is very convenient to be able to initialize textures with promises
 * This can add considerable complexity to the Texture class, and doesn't
 * fit with the immutable nature of WebGPU resources.
 * Instead, luma.gl offers async textures as a separate class.
 */
export class AsyncTexture {
  readonly device: Device;
  readonly id: string;
  props: Required<Omit<AsyncTextureProps, 'data'>>;

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

    // TODO - if we support URL strings as data...
    const id = uid('async-texture'); // typeof props?.data === 'string' ? props.data.slice(-20) : uid('async-texture');
    this.props = {...AsyncTexture.defaultProps, id, ...props};
    this.id = this.props.id;

    props = {...props};
    // Signature: new AsyncTexture(device, {data: url})
    if (typeof props?.data === 'string' && props.dimension === '2d') {
      props.data = loadImageBitmap(props.data);
    }

    // If mipmaps are requested, we need to allocate space for them
    if (props.mipmaps) {
      props.mipLevels = 'auto';
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
    const asyncData: AsyncTextureData = props.data;
    // @ts-expect-error not clear how to convince TS that null will be returned
    const data: TextureData | null = await awaitAllPromises(asyncData).then(
      undefined,
      this.rejectReady
    );

    // Check that we haven't been destroyed while waiting for texture data to load
    if (this.destroyed) {
      return;
    }

    // Now we can actually create the texture

    // Auto-deduce width and height if not supplied
    const size =
      this.props.width && this.props.height
        ? {width: this.props.width, height: this.props.height}
        : this.getTextureDataSize(data);
    if (!size) {
      throw new Error('Texture size could not be determined');
    }
    const syncProps: TextureProps = {...size, ...props, data: undefined, mipLevels: 1};

    // Auto-calculate the number of mip levels as a convenience
    // TODO - Should we clamp to 1-getMipLevelCount?
    const maxMips = this.device.getMipLevelCount(syncProps.width, syncProps.height);
    syncProps.mipLevels =
      this.props.mipLevels === 'auto' ? maxMips : Math.min(maxMips, this.props.mipLevels);

    this.texture = this.device.createTexture(syncProps);
    this.sampler = this.texture.sampler;
    this.view = this.texture.view;

    if (props.data) {
      switch (this.props.dimension) {
        case '1d':
          this._setTexture1DData(this.texture, data as Texture1DData);
          break;
        case '2d':
          this._setTexture2DData(data as Texture2DData);
          break;
        case '3d':
          this._setTexture3DData(this.texture, data as Texture3DData);
          break;
        case '2d-array':
          this._setTextureArrayData(this.texture, data as TextureArrayData);
          break;
        case 'cube':
          this._setTextureCubeData(this.texture, data as unknown as TextureCubeData);
          break;
        case 'cube-array':
          this._setTextureCubeArrayData(this.texture, data as unknown as TextureCubeArrayData);
          break;
      }
    }

    // Do we need to generate mipmaps?
    if (this.props.mipmaps) {
      this.generateMipmaps();
    }

    log.info(1, `${this} loaded`);
    this.resolveReady();
  }

  destroy(): void {
    if (this.texture) {
      this.texture.destroy();
      // @ts-expect-error
      this.texture = null;
    }
    this.destroyed = true;
  }

  generateMipmaps(): void {
    // if (this.device.type === 'webgl') {
    this.texture.generateMipmapsWebGL();
    // }
  }

  /** Set sampler or create and set new Sampler from SamplerProps */
  setSampler(sampler: Sampler | SamplerProps = {}): void {
    this.texture.setSampler(
      sampler instanceof Sampler ? sampler : this.device.createSampler(sampler)
    );
  }

  /**
   * Textures are immutable and cannot be resized after creation,
   * but we can create a similar texture with the same parameters but a new size.
   * @note Does not copy contents of the texture
   * @note Mipmaps may need to be regenerated after resizing / setting new data
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

  /** Check if texture data is a typed array */
  isTextureLevelData(data: TextureData): data is TextureImageData {
    const typedArray = (data as TextureImageData)?.data;
    return ArrayBuffer.isView(typedArray);
  }

  /** Get the size of the texture described by the provided TextureData */
  getTextureDataSize(
    data:
      | TextureData
      | TextureCubeData
      | TextureArrayData
      | TextureCubeArrayData
      | TypedArray
      | null
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
    if (this.device.isExternalImage(data)) {
      return this.device.getExternalImageSize(data);
    }
    if (data && typeof data === 'object' && data.constructor === Object) {
      const textureDataArray = Object.values(data);
      const untypedData = textureDataArray[0];
      return {width: untypedData.width, height: untypedData.height};
    }
    throw new Error('texture size deduction failed');
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

  // EXPERIMENTAL

  setTextureData(data: TextureData) {}

  /** Experimental: Set multiple mip levels */
  _setTexture1DData(texture: Texture, data: Texture1DData): void {
    throw new Error('setTexture1DData not supported in WebGL.');
  }

  /** Experimental: Set multiple mip levels */
  _setTexture2DData(lodData: Texture2DData, depth = 0): void {
    if (!this.texture) {
      throw new Error('Texture not initialized');
    }

    const lodArray = this._normalizeTextureData(lodData);

    // If the user provides multiple LODs, then automatic mipmap
    // generation generateMipmap() should be disabled to avoid overwriting them.
    if (lodArray.length > 1 && this.props.mipmaps !== false) {
      log.warn(`Texture ${this.id} mipmap and multiple LODs.`)();
    }

    for (let mipLevel = 0; mipLevel < lodArray.length; mipLevel++) {
      const imageData = lodArray[mipLevel];
      if (this.device.isExternalImage(imageData)) {
        this.texture.copyExternalImage({image: imageData, depth, mipLevel, flipY: true});
      } else {
        this.texture.copyImageData({data: imageData.data /* , depth */, mipLevel});
      }
    }
  }

  /**
   * Experimental: Sets 3D texture data: multiple depth slices, multiple mip levels
   * @param data
   */
  _setTexture3DData(texture: Texture, data: Texture3DData): void {
    if (this.texture?.props.dimension !== '3d') {
      throw new Error(this.id);
    }
    for (let depth = 0; depth < data.length; depth++) {
      this._setTexture2DData(data[depth], depth);
    }
  }

  /**
   * Experimental: Set Cube texture data, multiple faces, multiple mip levels
   * @todo - could support TextureCubeArray with depth
   * @param data
   * @param index
   */
  _setTextureCubeData(texture: Texture, data: TextureCubeData): void {
    if (this.texture?.props.dimension !== 'cube') {
      throw new Error(this.id);
    }
    for (const [face, faceData] of Object.entries(data)) {
      const faceDepth = CubeFaces.indexOf(face as TextureCubeFace);
      this._setTexture2DData(faceData, faceDepth);
    }
  }

  /**
   * Experimental: Sets texture array data, multiple levels, multiple depth slices
   * @param data
   */
  _setTextureArrayData(texture: Texture, data: TextureArrayData): void {
    if (this.texture?.props.dimension !== '2d-array') {
      throw new Error(this.id);
    }
    for (let depth = 0; depth < data.length; depth++) {
      this._setTexture2DData(data[depth], depth);
    }
  }

  /**
   * Experimental: Sets texture cube array, multiple faces, multiple levels, multiple mip levels
   * @param data
   */
  _setTextureCubeArrayData(texture: Texture, data: TextureCubeArrayData): void {
    throw new Error('setTextureCubeArrayData not supported in WebGL2.');
  }

  /** Experimental */
  _setTextureCubeFaceData(
    texture: Texture,
    lodData: Texture2DData,
    face: TextureCubeFace,
    depth: number = 0
  ): void {
    // assert(this.props.dimension === 'cube');

    // If the user provides multiple LODs, then automatic mipmap
    // generation generateMipmap() should be disabled to avoid overwriting them.
    if (Array.isArray(lodData) && lodData.length > 1 && this.props.mipmaps !== false) {
      log.warn(`${this.id} has mipmap and multiple LODs.`)();
    }

    const faceDepth = TextureCubeFaces.indexOf(face);
    this._setTexture2DData(lodData, faceDepth);
  }

  /**
   * Normalize TextureData to an array of TextureImageData / ExternalImages
   * @param data
   * @param options
   * @returns array of TextureImageData / ExternalImages
   */
  _normalizeTextureData(data: Texture2DData): (TextureImageData | ExternalImage)[] {
    const options: {width: number; height: number; depth: number} = this.texture;
    let mipLevelArray: (TextureImageData | ExternalImage)[];
    if (ArrayBuffer.isView(data)) {
      mipLevelArray = [
        {
          // ts-expect-error does data really need to be Uint8ClampedArray?
          data,
          width: options.width,
          height: options.height
          // depth: options.depth
        }
      ];
    } else if (!Array.isArray(data)) {
      mipLevelArray = [data];
    } else {
      mipLevelArray = data;
    }
    return mipLevelArray;
  }

  static defaultProps: Required<AsyncTextureProps> = {
    ...Texture.defaultProps,
    data: null,
    mipmaps: false
  };
}

// TODO - Remove when texture refactor is complete

/*
setCubeMapData(options: {
  width: number;
  height: number;
  data: Record<GL, Texture2DData> | Record<TextureCubeFace, Texture2DData>;
  format?: any;
  type?: any;
  /** @deprecated Use .data *
  pixels: any;
}): void {
  const {gl} = this;

  const {width, height, pixels, data, format = GL.RGBA, type = GL.UNSIGNED_BYTE} = options;

  // pixel data (imageDataMap) is an Object from Face to Image or Promise.
  // For example:
  // {
  // GL.TEXTURE_CUBE_MAP_POSITIVE_X : Image-or-Promise,
  // GL.TEXTURE_CUBE_MAP_NEGATIVE_X : Image-or-Promise,
  // ... }
  // To provide multiple level-of-details (LODs) this can be Face to Array
  // of Image or Promise, like this
  // {
  // GL.TEXTURE_CUBE_MAP_POSITIVE_X : [Image-or-Promise-LOD-0, Image-or-Promise-LOD-1],
  // GL.TEXTURE_CUBE_MAP_NEGATIVE_X : [Image-or-Promise-LOD-0, Image-or-Promise-LOD-1],
  // ... }

  const imageDataMap = this._getImageDataMap(pixels || data);

  const resolvedFaces = WEBGLTexture.FACES.map(face => {
    const facePixels = imageDataMap[face];
    return Array.isArray(facePixels) ? facePixels : [facePixels];
  });
  this.bind();

  WEBGLTexture.FACES.forEach((face, index) => {
    if (resolvedFaces[index].length > 1 && this.props.mipmaps !== false) {
      // If the user provides multiple LODs, then automatic mipmap
      // generation generateMipmaps() should be disabled to avoid overwritting them.
      log.warn(`${this.id} has mipmap and multiple LODs.`)();
    }
    resolvedFaces[index].forEach((image, lodLevel) => {
      // TODO: adjust width & height for LOD!
      if (width && height) {
        gl.texImage2D(face, lodLevel, format, width, height, 0 /* border*, format, type, image);
      } else {
        gl.texImage2D(face, lodLevel, format, format, type, image);
      }
    });
  });

  this.unbind();
}
*/

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
