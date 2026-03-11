import type {TypedArray, TextureFormat, ExternalImage} from '@luma.gl/core';
import {isExternalImage, getExternalImageSize} from '@luma.gl/core';

export type TextureImageSource = ExternalImage;

/**
 * One mip level
 * Basic data structure is similar to `ImageData`
 * additional optional fields can describe compressed texture data.
 */
export type TextureImageData = {
  /** WebGPU style format string. Defaults to 'rgba8unorm' */
  format?: TextureFormat;
  /** Typed Array with the bytes of the image. @note beware row byte alignment requirements */
  data: TypedArray;
  /** Width of the image, in pixels, @note beware row byte alignment requirements */
  width: number;
  /** Height of the image, in rows */
  height: number;
};

/**
 * A single mip-level can be initialized by data or an ImageBitmap etc
 * @note in the WebGPU spec a mip-level is called a subresource
 */
export type TextureMipLevelData = TextureImageData | TextureImageSource;

/**
 * Texture data for one image "slice" (which can consist of multiple miplevels)
 * Thus data for one slice be a single mip level or an array of miplevels
 * @note in the WebGPU spec each cross-section image in a 3D texture is called a "slice",
 * in a array texture each image in the array is called an array "layer"
 * luma.gl calls one image in a GPU texture a "slice" regardless of context.
 */
export type TextureSliceData = TextureMipLevelData | TextureMipLevelData[];

/** Names of cube texture faces */
export type TextureCubeFace = '+X' | '-X' | '+Y' | '-Y' | '+Z' | '-Z';

/** Array of cube texture faces. @note: index in array is the face index */
// prettier-ignore
export const TEXTURE_CUBE_FACES = ['+X', '-X', '+Y', '-Y', '+Z', '-Z'] as const satisfies readonly TextureCubeFace[];

/** Map of cube texture face names to face indexes */
// prettier-ignore
export const TEXTURE_CUBE_FACE_MAP = {'+X': 0, '-X': 1, '+Y': 2, '-Y': 3, '+Z': 4, '-Z': 5} as const satisfies Record<TextureCubeFace, number>;

/** @todo - Define what data type is supported for 1D textures. TextureImageData with height = 1 */
export type Texture1DData = TextureSliceData;

/** Texture data can be one or more mip levels */
export type Texture2DData = TextureSliceData;

/** 6 face textures */
export type TextureCubeData = Record<TextureCubeFace, TextureSliceData>;

/** Array of textures */
export type Texture3DData = TextureSliceData[];

/** Array of textures */
export type TextureArrayData = TextureSliceData[];

/** Array of 6 face textures */
export type TextureCubeArrayData = Record<TextureCubeFace, TextureSliceData>[];

type TextureData =
  | Texture1DData
  | Texture3DData
  | TextureArrayData
  | TextureCubeArrayData
  | TextureCubeData;

/** Sync data props */
export type TextureDataProps =
  | {dimension: '1d'; data: Texture1DData | null}
  | {dimension?: '2d'; data: Texture2DData | null}
  | {dimension: '3d'; data: Texture3DData | null}
  | {dimension: '2d-array'; data: TextureArrayData | null}
  | {dimension: 'cube'; data: TextureCubeData | null}
  | {dimension: 'cube-array'; data: TextureCubeArrayData | null};

/** Async data props */
export type TextureDataAsyncProps =
  | {dimension: '1d'; data?: Promise<Texture1DData> | Texture1DData | null}
  | {dimension?: '2d'; data?: Promise<Texture2DData> | Texture2DData | null}
  | {dimension: '3d'; data?: Promise<Texture3DData> | Texture3DData | null}
  | {dimension: '2d-array'; data?: Promise<TextureArrayData> | TextureArrayData | null}
  | {dimension: 'cube'; data?: Promise<TextureCubeData> | TextureCubeData | null}
  | {dimension: 'cube-array'; data?: Promise<TextureCubeArrayData> | TextureCubeArrayData | null};

/** Describes data for one sub resource (one mip level of one slice (depth or array layer)) */
export type TextureSubresource = {
  /** slice (depth or array layer)) */
  z: number;
  /** mip level (0 - max mip levels) */
  mipLevel: number;
} & (
  | {
      type: 'external-image';
      image: ExternalImage;
      /** @deprecated is this an appropriate place for this flag? */
      flipY?: boolean;
    }
  | {
      type: 'texture-data';
      data: TextureImageData;
    }
);

/** Check if texture data is a typed array */
export function isTextureSliceData(data: TextureData): data is TextureImageData {
  const typedArray = (data as TextureImageData)?.data;
  return ArrayBuffer.isView(typedArray);
}

export function getFirstMipLevel(layer: TextureSliceData | null): TextureMipLevelData | null {
  if (!layer) return null;
  return Array.isArray(layer) ? (layer[0] ?? null) : layer;
}

export function getTextureSizeFromData(
  props: TextureDataProps
): {width: number; height: number} | null {
  const {dimension, data} = props;
  if (!data) {
    return null;
  }

  switch (dimension) {
    case '1d': {
      const mipLevel = getFirstMipLevel(data);
      if (!mipLevel) return null;
      const {width} = getTextureMipLevelSize(mipLevel);
      return {width, height: 1};
    }
    case '2d': {
      const mipLevel = getFirstMipLevel(data);
      return mipLevel ? getTextureMipLevelSize(mipLevel) : null;
    }
    case '3d':
    case '2d-array': {
      if (!Array.isArray(data) || data.length === 0) return null;
      const mipLevel = getFirstMipLevel(data[0]);
      return mipLevel ? getTextureMipLevelSize(mipLevel) : null;
    }
    case 'cube': {
      const face = (Object.keys(data)[0] as TextureCubeFace) ?? null;
      if (!face) return null;
      const faceData = (data as Record<TextureCubeFace, TextureSliceData>)[face];
      const mipLevel = getFirstMipLevel(faceData);
      return mipLevel ? getTextureMipLevelSize(mipLevel) : null;
    }
    case 'cube-array': {
      if (!Array.isArray(data) || data.length === 0) return null;
      const firstCube = data[0];
      const face = (Object.keys(firstCube)[0] as TextureCubeFace) ?? null;
      if (!face) return null;
      const mipLevel = getFirstMipLevel(firstCube[face]);
      return mipLevel ? getTextureMipLevelSize(mipLevel) : null;
    }
    default:
      return null;
  }
}

function getTextureMipLevelSize(data: TextureMipLevelData): {width: number; height: number} {
  if (isExternalImage(data)) {
    return getExternalImageSize(data);
  }
  if (typeof data === 'object' && 'width' in data && 'height' in data) {
    return {width: data.width, height: data.height};
  }
  throw new Error('Unsupported mip-level data');
}

/** Type guard: is a mip-level `TextureImageData` (vs ExternalImage) */
function isTextureImageData(data: TextureMipLevelData): data is TextureImageData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'data' in data &&
    'width' in data &&
    'height' in data
  );
}

/** Resolve size for a single mip-level datum */
// function getTextureMipLevelSizeFromData(data: TextureMipLevelData): {
//   width: number;
//   height: number;
// } {
//   if (this.device.isExternalImage(data)) {
//     return this.device.getExternalImageSize(data);
//   }
//   if (this.isTextureImageData(data)) {
//     return {width: data.width, height: data.height};
//   }
//   // Fallback (should not happen with current types)
//   throw new Error('Unsupported mip-level data');
// }

/** Convert cube face label to depth index */
export function getCubeFaceIndex(face: TextureCubeFace): number {
  const idx = TEXTURE_CUBE_FACE_MAP[face];
  if (idx === undefined) throw new Error(`Invalid cube face: ${face}`);
  return idx;
}

/** Convert cube face label to texture slice index. Index can be used with `setTexture2DData()`. */
export function getCubeArrayFaceIndex(cubeIndex: number, face: TextureCubeFace): number {
  return 6 * cubeIndex + getCubeFaceIndex(face);
}

// ------------------ Upload helpers ------------------

/** Experimental: Set multiple mip levels (1D) */
export function getTexture1DSubresources(data: Texture1DData): TextureSubresource[] {
  // Not supported in WebGL; left explicit
  throw new Error('setTexture1DData not supported in WebGL.');
  // const subresources: TextureSubresource[] = [];
  // return subresources;
}

/** Normalize 2D layer payload into an array of mip-level items */
function _normalizeTexture2DData(data: Texture2DData): (TextureImageData | ExternalImage)[] {
  return Array.isArray(data) ? data : [data];
}

/** Experimental: Set multiple mip levels (2D), optionally at `z` (depth/array index) */
export function getTexture2DSubresources(
  slice: number,
  lodData: Texture2DData
): TextureSubresource[] {
  const lodArray = _normalizeTexture2DData(lodData);
  const z = slice;

  const subresources: TextureSubresource[] = [];

  for (let mipLevel = 0; mipLevel < lodArray.length; mipLevel++) {
    const imageData = lodArray[mipLevel];
    if (isExternalImage(imageData)) {
      subresources.push({
        type: 'external-image',
        image: imageData,
        z,
        mipLevel
      });
    } else if (isTextureImageData(imageData)) {
      subresources.push({
        type: 'texture-data',
        data: imageData,
        z,
        mipLevel
      });
    } else {
      throw new Error('Unsupported 2D mip-level payload');
    }
  }

  return subresources;
}

/** 3D: multiple depth slices, each may carry multiple mip levels */
export function getTexture3DSubresources(data: Texture3DData): TextureSubresource[] {
  const subresources: TextureSubresource[] = [];
  for (let depth = 0; depth < data.length; depth++) {
    subresources.push(...getTexture2DSubresources(depth, data[depth]));
  }
  return subresources;
}

/** 2D array: multiple layers, each may carry multiple mip levels */
export function getTextureArraySubresources(data: TextureArrayData): TextureSubresource[] {
  const subresources: TextureSubresource[] = [];
  for (let layer = 0; layer < data.length; layer++) {
    subresources.push(...getTexture2DSubresources(layer, data[layer]));
  }
  return subresources;
}

/** Cube: 6 faces, each may carry multiple mip levels */
export function getTextureCubeSubresources(data: TextureCubeData): TextureSubresource[] {
  const subresources: TextureSubresource[] = [];
  for (const [face, faceData] of Object.entries(data) as [TextureCubeFace, TextureSliceData][]) {
    const faceDepth = getCubeFaceIndex(face);
    subresources.push(...getTexture2DSubresources(faceDepth, faceData));
  }
  return subresources;
}

/** Cube array: multiple cubes (faces×layers), each face may carry multiple mips */
export function getTextureCubeArraySubresources(data: TextureCubeArrayData): TextureSubresource[] {
  const subresources: TextureSubresource[] = [];
  data.forEach((cubeData, cubeIndex) => {
    for (const [face, faceData] of Object.entries(cubeData)) {
      const faceDepth = getCubeArrayFaceIndex(cubeIndex, face as TextureCubeFace);
      getTexture2DSubresources(faceDepth, faceData);
    }
  });
  return subresources;
}
