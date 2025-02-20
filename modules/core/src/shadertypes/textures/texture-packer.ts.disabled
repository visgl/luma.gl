import {TypedArray} from '@math.gl/types';
import {TextureFormat, getTextureFormatInfo} from '@luma.gl/core';
import {TextureFormatTypedArray} from './texture-formats';

export type PackedTextureData<FormatT extends TextureFormat> = {
  data: TextureFormatTypedArray<FormatT>;
  format: FormatT;
  width: number;
  height: number;
  depthOrArrayLayers: number;
};

export type AlignedTextureData<FormatT extends TextureFormat> = {
  data: Uint8Array;
  format: FormatT;
  width: number;
  height: number;
  depthOrArrayLayers: number;
  bytesPerRow: number;
  rowsPerImage: number;
};

export class TexturePacker {
  /**
   * Converts tightly packed texture data into padded texture layout required for WebGPU.
   */
  static toAligned(packed: PackedTextureData<TextureFormat>): AlignedTextureData<FormatT> {
    const {data, format, width, height, depthOrArrayLayers} = packed;
    const info = getTextureFormatInfo(format);
    if (!info || !info.color) throw new Error(`Unsupported format ${format}`);

    const bytesPerPixel = info.color.bytesPerPixel;
    const unpaddedRowSize = width * bytesPerPixel;

    const bytesPerRow = Math.ceil(unpaddedRowSize / 256) * 256;
    const rowsPerImage = height;
    const totalBytes = bytesPerRow * rowsPerImage * depthOrArrayLayers;

    const aligned = new Uint8Array(totalBytes);
    const source = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

    for (let slice = 0; slice < depthOrArrayLayers; slice++) {
      for (let row = 0; row < rowsPerImage; row++) {
        const srcOffset = (slice * rowsPerImage + row) * unpaddedRowSize;
        const dstOffset = (slice * rowsPerImage + row) * bytesPerRow;

        for (let i = 0; i < unpaddedRowSize; i++) {
          aligned[dstOffset + i] = source[srcOffset + i];
        }
      }
    }

    return {
      data: aligned,
      format,
      width,
      height,
      depthOrArrayLayers,
      bytesPerRow,
      rowsPerImage
    };
  }

  /**
   * Converts padded GPU layout data into tightly packed texture data.
   */
  static toPacked<FormatT extends TextureFormat>(
    aligned: AlignedTextureData<FormatT>,
    arrayType: {new (buffer: ArrayBuffer): PackedTextureData<FormatT>['data']}
  ): PackedTextureData<FormatT> {
    const {data, format, width, height, depthOrArrayLayers, bytesPerRow, rowsPerImage} = aligned;
    const info = getTextureFormatInfo(format);
    if (!info || !info.color) throw new Error(`Unsupported format ${format}`);

    const bytesPerPixel = info.color.bytesPerPixel;
    const unpaddedRowSize = width * bytesPerPixel;
    const totalTexels = width * height * depthOrArrayLayers;
    const target = new Uint8Array(totalTexels * bytesPerPixel);

    for (let slice = 0; slice < depthOrArrayLayers; slice++) {
      for (let row = 0; row < rowsPerImage; row++) {
        const srcOffset = (slice * rowsPerImage + row) * bytesPerRow;
        const dstOffset = (slice * rowsPerImage + row) * unpaddedRowSize;

        for (let i = 0; i < unpaddedRowSize; i++) {
          target[dstOffset + i] = data[srcOffset + i];
        }
      }
    }

    const result = new arrayType(target.buffer);
    return {
      data: result,
      format,
      width,
      height,
      depthOrArrayLayers
    };
  }

  static readAlignedPixel(
    data: AlignedTextureData,
    x: number,
    y: number,
    layer: number,
    bitsPerChannel: [number, number, number, number]
  ): [number, number, number, number] {
    const {width, height, bytesPerRow, rowsPerImage, depthOrArrayLayers} = data;

    if (x < 0 || y < 0 || layer < 0 || x >= width || y >= height || layer >= depthOrArrayLayers) {
      throw new Error(`Pixel coordinate out of bounds: x=${x}, y=${y}, layer=${layer}`);
    }

    const bitsPerPixel = bitsPerChannel.reduce((sum, bits) => sum + bits, 0);
    const rowOffset = y * bytesPerRow;
    const sliceOffset = layer * rowsPerImage * bytesPerRow;
    const byteOffset = sliceOffset + rowOffset + Math.floor((x * bitsPerPixel) / 8);
    const bitOffset = (sliceOffset + rowOffset) * 8 + x * bitsPerPixel;

    const view = new Uint8Array(data.data.buffer, data.data.byteOffset, data.data.byteLength);

    let currentBitOffset = bitOffset;
    const result: [number, number, number, number] = [0, 0, 0, 0];

    for (let i = 0; i < 4; i++) {
      const bits = bitsPerChannel[i];
      if (bits > 0) {
        result[i] = readBitsFromUint8Array(view, currentBitOffset, bits);
        currentBitOffset += bits;
      }
    }

    return result;
  }

  writeAlignedPixel(
    data: AlignedTextureData,
    x: number,
    y: number,
    layer: number,
    bitsPerChannel: [number, number, number, number],
    pixel: [number, number, number, number]
  ): void {
    const {width, height, bytesPerRow, rowsPerImage, depthOrArrayLayers} = data;

    if (x < 0 || y < 0 || layer < 0 || x >= width || y >= height || layer >= depthOrArrayLayers) {
      throw new Error(`Pixel coordinate out of bounds: x=${x}, y=${y}, layer=${layer}`);
    }

    const bitsPerPixel = bitsPerChannel.reduce((sum, bits) => sum + bits, 0);
    const bytesPerPixel = bitsPerPixel / 8;

    const rowOffset = y * bytesPerRow;
    const sliceOffset = layer * rowsPerImage * bytesPerRow;
    const byteOffset = sliceOffset + rowOffset + x * bytesPerPixel;

    const view = new DataView(data.data.buffer, data.data.byteOffset + byteOffset, bytesPerPixel);
    let bitOffsetWithinPixel = 0;

    for (let i = 0; i < 4; i++) {
      const bits = bitsPerChannel[i];
      if (bits > 0) {
        const maxValue = (1 << bits) - 1;
        const channelValue = pixel[i] & maxValue;
        writeBitsToDataView(view, bitOffsetWithinPixel, bits, channelValue);
        bitOffsetWithinPixel += bits;
      }
    }
  }
}


/**
 * Reads a specified number of bits from a DataView starting at a given bit offset.
 *
 * For channels with a bit width of 8, 16, or 32 bits and when the bitOffset is byte-aligned,
 * this function uses DataView methods for fast extraction.
 *
 * Bits are assumed to be stored in big-endian order (i.e. the most-significant bit is at position 7 in each byte).
 *
 * @param dataView - The DataView containing the data.
 * @param bitOffset - The offset (in bits) within the data from which to start reading.
 * @param bitCount - The number of bits to read (supported range: 1 to 32).
 * @returns The extracted value as a number.
 */
export function readBitsFromUint8Array(
  bytes: Uint8Array,
  bitOffset: number,
  bitCount: number
): number {
  let value = 0;
  for (let i = 0; i < bitCount; i++) {
    const bitIndex = bitOffset + i;
    const byteIndex = Math.floor(bitIndex / 8);
    const innerBitIndex = 7 - (bitIndex % 8); // big-endian
    const byte = bytes[byteIndex];
    const bit = (byte >> innerBitIndex) & 1;
    value = (value << 1) | bit;
  }
  return value;
}

/**
 * Writes a specified number of bits from a value into a DataView at a given bit offset.
 *
 * For channels with a bit width of 8, 16, or 32 bits and when the bit offset is byte-aligned,
 * this function uses DataView methods for fast writing.
 *
 * Bits are assumed to be stored in big-endian order (i.e. the most-significant bit is at position 7 in each byte).
 *
 * @param dataView - The DataView to write into.
 * @param bitOffset - The bit offset at which to begin writing.
 * @param bitCount - The number of bits to write (supported range: 1 to 32).
 * @param value - The numeric value whose lower bitCount bits will be written.
 */
export function writeBitsToUint8Array(
  bytes: Uint8Array,
  bitOffset: number,
  bitCount: number,
  value: number
): void {
  for (let i = 0; i < bitCount; i++) {
    const bitIndex = bitOffset + i;
    const byteIndex = Math.floor(bitIndex / 8);
    const innerBitIndex = 7 - (bitIndex % 8); // big-endian

    const bit = (value >> (bitCount - 1 - i)) & 1;
    if (bit === 1) {
      bytes[byteIndex] |= 1 << innerBitIndex;
    } else {
      bytes[byteIndex] &= ~(1 << innerBitIndex);
    }
  }
}
