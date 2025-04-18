// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TypedArray} from '@math.gl/types';
import {TextureFormat} from './texture-formats';

// type TextureFormatToTypedArray<T extends TextureFormat> = T extends
//   | 'r8unorm'
//   | 'rgba8unorm'
//   | 'bgra8unorm'
//   | 'rgba8uint'
//   ? Uint8Array<ArrayBuffer>
//   : T extends 'r16uint' | 'rgba16uint' | 'rgba16float'
//     ? Uint16Array<ArrayBuffer>
//     : T extends 'r32uint' | 'rgba32uint'
//       ? Uint32Array<ArrayBuffer>
//       : T extends 'r32float' | 'rgba32float'
//         ? Float32Array<ArrayBuffer>
//         : // Default to UINT8Array for other formats
//           Uint8Array<ArrayBuffer>;

/**
 * Memory layout for reading/writing to a texture
 * Layout and size of  memory covering a specific range of rows and images in a texture.
 *
 * @note The total length is bytesPerRow * rowsPerImage * depthOrArrayLayers.
 *
 * @note Texture data must be provided in this layout.
 * - Only the range of rows that are actually read or written need to be allocated.
 * - However, space for the full, padded! rows must be allocated in the buffer,
 *   even if just a partial horizontal range `{x, width}` is actually read or written.
 */
export type TextureMemoryLayout = {
  bytesPerPixel: number;
  /** Number of bytes per row (padded) */
  bytesPerRow: number;
  /** Number of rows per image */
  rowsPerImage: number;
  /** Number of images */
  depthOrArrayLayers: number;
  /** Total length in bytes */
  byteLength: number;
  /** Stride between successive images (Use when depthOrArrayLayers > 1) */
  bytesPerImage: number;
};

export type TextureMemoryLayoutOptions = {
  /** Width of the texture in pixels/texels */
  textureWidth: number;
  /** Number of rows to be read or written */
  rows: number;
  /** Number of images to be read or written */
  depthOrArrayLayers?: number;

  /** Number of bytes per pixel */
  bytesPerPixel: number;
  /** Alignment of each row */
  byteAlignment?: number;
};

/** Get the memory layout of a texture */
export function getTextureMemoryLayout({
  textureWidth,
  rows,
  depthOrArrayLayers = 1,
  bytesPerPixel,
  byteAlignment = 256
}: TextureMemoryLayoutOptions): TextureMemoryLayout {
  // WebGPU requires bytesPerRow to be a multiple of 256.
  const unpaddedBytesPerRow = textureWidth * bytesPerPixel;
  const bytesPerRow = Math.ceil(unpaddedBytesPerRow / byteAlignment) * byteAlignment;
  const rowsPerImage = rows;
  const byteLength = bytesPerRow * rowsPerImage * depthOrArrayLayers;

  return {
    bytesPerPixel,
    bytesPerRow,
    rowsPerImage: rows,
    depthOrArrayLayers,
    bytesPerImage: bytesPerRow * rowsPerImage,
    byteLength
  };
}

export function getTextureSlice<T extends TextureFormat>(
  arrayBuffer: ArrayBuffer,
  memoryLayout: TextureMemoryLayout,
  format: T,
  slice = 0
) {
  const {bytesPerImage} = memoryLayout;
  const offset = bytesPerImage * slice;
  const totalPixels = memoryLayout.bytesPerImage / memoryLayout.bytesPerPixel;

  switch (format) {
    case 'rgba8unorm':
    case 'bgra8unorm':
    case 'rgba8uint':
      return new Uint8Array(arrayBuffer, offset, totalPixels);
    case 'r8unorm':
      return new Uint8Array(arrayBuffer, offset, totalPixels);
    case 'r16uint':
    case 'rgba16uint':
      return new Uint16Array(arrayBuffer, offset, totalPixels);
    case 'r32uint':
    case 'rgba32uint':
      return new Uint32Array(arrayBuffer, offset, totalPixels);
    case 'r32float':
      return new Float32Array(arrayBuffer, offset, totalPixels);
    case 'rgba16float':
      return new Uint16Array(arrayBuffer, offset, totalPixels); // 4 channels
    case 'rgba32float':
      return new Float32Array(arrayBuffer, offset, totalPixels);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

export function setTextureSlice<T extends TextureFormat>(
  arrayBuffer: ArrayBuffer,
  memoryLayout: TextureMemoryLayout,
  format: T,
  data: TypedArray,
  slice = 0
): void {
  const {bytesPerImage} = memoryLayout;
  const offset = bytesPerImage * slice;
  const totalPixels = memoryLayout.bytesPerImage / memoryLayout.bytesPerPixel;
  const typedArray = getTextureSlice(arrayBuffer, memoryLayout, format, slice);
  typedArray.set(data.subarray(0, totalPixels), offset);
}
