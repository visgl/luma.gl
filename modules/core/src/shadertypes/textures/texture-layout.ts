// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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
/**
 * Describes the required layout of memory to store texture data that has been read or is to be written
 * @note Total byte length of buffer `byteLength = layout.bytesPerRow * rowsPerImage * imageCount
 */
export type TextureDataLayout = {
  /** Bytes per row, can be less than width if subimage, but padded to 256 bytes on WebGPU */
  bytesPerRow: number;
  /** Number of rows per image in this buffer (can be less than height if subimage) */
  rowsPerImage: number;
  /** Number of images, if more than one depth or arrayLayer is read or written */
  imageCount: number;
};


// export type TextureMemoryLayoutOptions = {
//   /** Width of the texture in pixels/texels */
//   textureWidth: number;
//   /** Number of rows to be read or written */
//   rows: number;
//   /** Number of images to be read or written */
//   depthOrArrayLayers: number;
//   /** Number of bytes per pixel */
//   bytesPerPixel: number;
//   /** Alignment of each row */
//   byteAlignment: number;
// };

// /** Get the memory layout of a texture */
// export function getTextureMemoryLayout({
//   textureWidth,
//   rows,
//   depthOrArrayLayers,
//   bytesPerPixel,
//   byteAlignment
// }: TextureMemoryLayoutOptions): TextureMemoryLayout {
//   // WebGPU requires bytesPerRow to be a multiple of 256.
//   const unpaddedBytesPerRow = textureWidth * bytesPerPixel;
//   const bytesPerRow = Math.ceil(unpaddedBytesPerRow / byteAlignment) * byteAlignment;
//   const rowsPerImage = rows;
//   const byteLength = bytesPerRow * rowsPerImage * depthOrArrayLayers;

//   return {
//     bytesPerPixel,
//     bytesPerRow,
//     rowsPerImage: rows,
//     depthOrArrayLayers,
//     bytesPerImage: bytesPerRow * rowsPerImage,
//     byteLength
//   };
// }

// export function getTextureSlice<T extends TextureFormat>(
//   arrayBuffer: ArrayBuffer,
//   memoryLayout: TextureMemoryLayout,
//   format: T,
//   slice = 0
// ) {
//   const {bytesPerImage} = memoryLayout;
//   const offset = bytesPerImage * slice;
//   const totalPixels = memoryLayout.bytesPerImage / memoryLayout.bytesPerPixel;

//   switch (format) {
//     case 'rgba8unorm':
//     case 'bgra8unorm':
//     case 'rgba8uint':
//       return new Uint8Array(arrayBuffer, offset, totalPixels);
//     case 'r8unorm':
//       return new Uint8Array(arrayBuffer, offset, totalPixels);
//     case 'r16uint':
//     case 'rgba16uint':
//       return new Uint16Array(arrayBuffer, offset, totalPixels);
//     case 'r32uint':
//     case 'rgba32uint':
//       return new Uint32Array(arrayBuffer, offset, totalPixels);
//     case 'r32float':
//       return new Float32Array(arrayBuffer, offset, totalPixels);
//     case 'rgba16float':
//       return new Uint16Array(arrayBuffer, offset, totalPixels); // 4 channels
//     case 'rgba32float':
//       return new Float32Array(arrayBuffer, offset, totalPixels);
//     default:
//       throw new Error(`Unsupported format: ${format}`);
//   }
// }

// export function setTextureSlice<T extends TextureFormat>(
//   arrayBuffer: ArrayBuffer,
//   memoryLayout: TextureMemoryLayout,
//   format: T,
//   data: TypedArray,
//   slice = 0
// ): void {
//   const {bytesPerImage} = memoryLayout;
//   const offset = bytesPerImage * slice;
//   const totalPixels = memoryLayout.bytesPerImage / memoryLayout.bytesPerPixel;
//   const typedArray = getTextureSlice(arrayBuffer, memoryLayout, format, slice);
//   typedArray.set(data.subarray(0, totalPixels), offset);
// }
