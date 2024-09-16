import {
  TypedArray,
  TypedArrayConstructor,
  isTypedArray,
} from './typed-arrays.js';
import {
  generateMipmap,
  numMipLevels,
} from './generate-mipmap.js';

export type CopyTextureOptions = {
  flipY?: boolean,
  premultipliedAlpha?: boolean,
  colorSpace?: PredefinedColorSpace;
  dimension?: GPUTextureViewDimension;
  baseArrayLayer?: number;
};

export type TextureData = {
  data: TypedArray | number[],
};
export type TextureCreationData = TextureData & {
  width?: number,
  height?: number,
};

export type TextureRawDataSource = TextureCreationData | TypedArray | number[];
export type TextureSource = GPUImageCopyExternalImage['source'] | TextureRawDataSource;

function isTextureData(source: TextureSource) {
  const src = source as TextureData;
  return isTypedArray(src.data) || Array.isArray(src.data);
}

function isTextureRawDataSource(source: TextureSource) {
  return isTypedArray(source) || Array.isArray(source) || isTextureData(source);
}

function toTypedArray(v: TypedArray | number[], format: GPUTextureFormat): TypedArray {
  if (isTypedArray(v)) {
    return v as TypedArray;
  }
  const { Type } = getTextureFormatInfo(format);
  return new Type(v);
}

function guessDimensions(width: number | undefined, height: number | undefined, numElements: number, dimension: GPUTextureViewDimension = '2d'): number[] {
  if (numElements % 1 !== 0) {
    throw new Error("can't guess dimensions");
  }
  if (!width && !height) {
    const size = Math.sqrt(numElements / (dimension === 'cube' ? 6 : 1));
    if (size % 1 === 0) {
      width = size;
      height = size;
    } else {
      width = numElements;
      height = 1;
    }
  } else if (!height) {
    height = numElements / width!;
    if (height % 1) {
      throw new Error("can't guess dimensions");
    }
  } else if (!width) {
    width = numElements / height;
    if (width % 1) {
      throw new Error("can't guess dimensions");
    }
  }
  const depth = numElements / width! / height;
  if (depth % 1) {
    throw new Error("can't guess dimensions");
  }
  return [width!, height, depth];
}

function textureViewDimensionToDimension(viewDimension: GPUTextureViewDimension | undefined) {
  switch (viewDimension) {
    case '1d': return '1d';
    case '3d': return '3d';
    default: return '2d';
  }
}

const kFormatToTypedArray: {[key: string]: TypedArrayConstructor} = {
  '8snorm': Int8Array,
  '8unorm': Uint8Array,
  '8sint': Int8Array,
  '8uint': Uint8Array,
  '16snorm': Int16Array,
  '16unorm': Uint16Array,
  '16sint': Int16Array,
  '16uint': Uint16Array,
  '32snorm': Int32Array,
  '32unorm': Uint32Array,
  '32sint': Int32Array,
  '32uint': Uint32Array,
  '16float': Uint16Array,  // TODO: change to Float16Array
  '32float': Float32Array,
};

const kTextureFormatRE = /([a-z]+)(\d+)([a-z]+)/;

function getTextureFormatInfo(format: GPUTextureFormat) {
  // this is a hack! It will only work for common formats
  const [, channels, bits, typeName] = kTextureFormatRE.exec(format)!;
  // TODO: if the regex fails, use table for other formats?
  const numChannels = channels.length;
  const bytesPerChannel = parseInt(bits) / 8;
  const bytesPerElement = numChannels * bytesPerChannel;
  const Type = kFormatToTypedArray[`${bits}${typeName}`];

  return {
    channels,
    numChannels,
    bytesPerChannel,
    bytesPerElement,
    Type,
  };
}


/**
 * Gets the size of a mipLevel. Returns an array of 3 numbers [width, height, depthOrArrayLayers]
 */
export function getSizeForMipFromTexture(texture: GPUTexture, mipLevel: number): number[] {
  return [
    texture.width,
    texture.height,
    texture.depthOrArrayLayers,
  ].map(v => Math.max(1, Math.floor(v / 2 ** mipLevel)));
}

/**
 * Uploads Data to a texture
 */
function uploadDataToTexture(
  device: GPUDevice,
  texture: GPUTexture,
  source: TextureRawDataSource,
  options: { origin?: GPUOrigin3D },
) {
  const data = toTypedArray((source as TextureData).data || source, texture.format);
  const mipLevel = 0;
  const size = getSizeForMipFromTexture(texture, mipLevel);
  const { bytesPerElement } = getTextureFormatInfo(texture.format);
  const origin = options.origin || [0, 0, 0];
  device.queue.writeTexture(
    { texture, origin },
    data,
    { bytesPerRow: bytesPerElement * size[0], rowsPerImage: size[1] },
    size,
  );
}
/**
 * Copies a an array of "sources" (Video, Canvas, OffscreenCanvas, ImageBitmap)
 * to a texture and then optionally generates mip levels
 */
export function copySourcesToTexture(
    device: GPUDevice,
    texture: GPUTexture,
    sources: TextureSource[],
    options: CopyTextureOptions = {},
) {
  let tempTexture: GPUTexture | undefined;
  sources.forEach((source, layer) => {
    const origin = [0, 0, layer + (options.baseArrayLayer || 0)];
    if (isTextureRawDataSource(source)) {
      uploadDataToTexture(device, texture, source as TextureRawDataSource, { origin });
    } else {
      const s = source as GPUImageCopyExternalImage['source'];
      // work around limit that you can't call copyExternalImageToTexture for 3d texture.
      // sse https://github.com/gpuweb/gpuweb/issues/4697 for if we can remove this
      let dstTexture = texture;
      let copyOrigin = origin;
      if (texture.dimension === '3d') {
        tempTexture = tempTexture ?? device.createTexture({
          format: texture.format,
          usage: texture.usage | GPUTextureUsage.COPY_SRC,
          size: [texture.width, texture.height, 1],
        });
        dstTexture = tempTexture;
        copyOrigin = [0, 0, 0];
      }

      const {flipY, premultipliedAlpha, colorSpace} = options;
      device.queue.copyExternalImageToTexture(
        { source: s, flipY, },
        { texture: dstTexture, premultipliedAlpha, colorSpace, origin: copyOrigin },
        getSizeFromSource(s, options),
      );

      if (tempTexture) {
        const encoder = device.createCommandEncoder();
        encoder.copyTextureToTexture(
          { texture: tempTexture },
          { texture, origin },
          tempTexture,
        );
        device.queue.submit([encoder.finish()]);
      }
    }
  });

  if (tempTexture) {
    tempTexture.destroy();
  }

  if (texture.mipLevelCount > 1) {
    generateMipmap(device, texture);
  }
}


/**
 * Copies a "source" (Video, Canvas, OffscreenCanvas, ImageBitmap)
 * to a texture and then optionally generates mip levels
 */
export function copySourceToTexture(
    device: GPUDevice,
    texture: GPUTexture,
    source: TextureSource,
    options: CopyTextureOptions = {}) {
  copySourcesToTexture(device, texture, [source], options);
}

/**
 * @property mips if true and mipLevelCount is not set then wll automatically generate
 *    the correct number of mip levels.
 * @property format Defaults to "rgba8unorm"
 * @property mipLeveLCount Defaults to 1 or the number of mips needed for a full mipmap if `mips` is true
 */
export type CreateTextureOptions = CopyTextureOptions & {
  mips?: boolean,
  usage?: GPUTextureUsageFlags,
  format?: GPUTextureFormat,
  mipLevelCount?: number,
};

/**
 * Gets the size from a source. This is to smooth out the fact that different
 * sources have a different way to get their size.
 */
export function getSizeFromSource(source: TextureSource, options: CreateTextureOptions): number[] {
  if (source instanceof HTMLVideoElement) {
    return [source.videoWidth, source.videoHeight, 1];
  } else {
    const maybeHasWidthAndHeight = source as { width: number, height: number };
    const { width, height } = maybeHasWidthAndHeight;
    if (width > 0 && height > 0 && !isTextureRawDataSource(source)) {
      // this should cover Canvas, Image, ImageData, ImageBitmap, TextureCreationData
      return [width, height, 1];
    }
    const format = options.format || 'rgba8unorm';
    const { bytesPerElement, bytesPerChannel } = getTextureFormatInfo(format);
    const data = isTypedArray(source) || Array.isArray(source)
       ? source
       : (source as TextureData).data;
    const numBytes = isTypedArray(data)
        ? (data as TypedArray).byteLength
        : ((data as number[]).length * bytesPerChannel);
    const numElements = numBytes / bytesPerElement;
    return guessDimensions(width, height, numElements);
  }
}

/**
 * Create a texture from an array of sources (Video, Canvas, OffscreenCanvas, ImageBitmap)
 * and optionally create mip levels. If you set `mips: true` and don't set a mipLevelCount
 * then it will automatically make the correct number of mip levels.
 *
 * Example:
 *
 * ```js
 * const texture = createTextureFromSource(
 *     device,
 *     [
 *        someCanvasOrVideoOrImageImageBitmap0,
 *        someCanvasOrVideoOrImageImageBitmap1,
 *     ],
 *     {
 *       usage: GPUTextureUsage.TEXTURE_BINDING |
 *              GPUTextureUsage.RENDER_ATTACHMENT |
 *              GPUTextureUsage.COPY_DST,
 *       mips: true,
 *     }
 * );
 * ```
 */
export function createTextureFromSources(
    device: GPUDevice,
    sources: TextureSource[],
    options: CreateTextureOptions = {}): GPUTexture {
  // NOTE: We assume all the sizes are the same. If they are not you'll get
  // an error.
  const size = getSizeFromSource(sources[0], options);
  size[2] = size[2] > 1 ? size[2] : sources.length;

  const texture = device.createTexture({
    dimension: textureViewDimensionToDimension(options.dimension),
    format: options.format || 'rgba8unorm',
    mipLevelCount: options.mipLevelCount
        ? options.mipLevelCount
        : options.mips ? numMipLevels(size) : 1,
    size,
    usage: (options.usage ?? 0) |
           GPUTextureUsage.TEXTURE_BINDING |
           GPUTextureUsage.COPY_DST |
           GPUTextureUsage.RENDER_ATTACHMENT,
  });

  copySourcesToTexture(device, texture, sources, options);

  return texture;
}

/**
 * Create a texture from a source (Video, Canvas, OffscreenCanvas, ImageBitmap)
 * and optionally create mip levels. If you set `mips: true` and don't set a mipLevelCount
 * then it will automatically make the correct number of mip levels.
 *
 * Example:
 *
 * ```js
 * const texture = createTextureFromSource(
 *     device,
 *     someCanvasOrVideoOrImageImageBitmap,
 *     {
 *       usage: GPUTextureUsage.TEXTURE_BINDING |
 *              GPUTextureUsage.RENDER_ATTACHMENT |
 *              GPUTextureUsage.COPY_DST,
 *       mips: true,
 *     }
 * );
 * ```
 */
export function createTextureFromSource(
    device: GPUDevice,
    source: TextureSource,
    options: CreateTextureOptions = {}): GPUTexture {
  return createTextureFromSources(device, [source], options);
}

export type CreateTextureFromBitmapOptions = CreateTextureOptions & ImageBitmapOptions;

/**
 * Load an ImageBitmap
 * @param url
 * @param options
 * @returns the loaded ImageBitmap
 */
export async function loadImageBitmap(url: string, options: ImageBitmapOptions = {}): Promise<ImageBitmap> {
  const res = await fetch(url);
  const blob = await res.blob();
  const opt: ImageBitmapOptions = {
    ...options,
    ...(options.colorSpaceConversion !== undefined && {colorSpaceConversion: 'none'}),
  };
  return await createImageBitmap(blob, opt);
}

/**
 * Load images and create a texture from them, optionally generating mip levels
 *
 * Assumes all the urls reference images of the same size.
 *
 * Example:
 *
 * ```js
 * const texture = await createTextureFromImage(
 *   device,
 *   [
 *     'https://someimage1.url',
 *     'https://someimage2.url',
 *   ],
 *   {
 *     mips: true,
 *     flipY: true,
 *   },
 * );
 * ```
 */
export async function createTextureFromImages(device: GPUDevice, urls: string[], options: CreateTextureFromBitmapOptions = {}): Promise<GPUTexture> {
  // TODO: start once we've loaded one?
  // We need at least 1 to know the size of the texture to create
  const imgBitmaps = await Promise.all(urls.map(url => loadImageBitmap(url)));
  return createTextureFromSources(device, imgBitmaps, options);
}

/**
 * Load an image and create a texture from it, optionally generating mip levels
 *
 * Example:
 *
 * ```js
 * const texture = await createTextureFromImage(device, 'https://someimage.url', {
 *   mips: true,
 *   flipY: true,
 * });
 * ```
 */
export async function createTextureFromImage(device: GPUDevice, url: string, options: CreateTextureFromBitmapOptions = {}): Promise<GPUTexture> {
  return createTextureFromImages(device, [url], options);
}
