// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type ImageData = {
  /** Offset into the data (in addition to any offset built-in to the ArrayBufferView) */
  byteOffset?: number;
  /** The stride, in bytes, between the beginning of each texel block row and the subsequent texel block row. Required if there are multiple texel block rows (i.e. the copy height or depth is more than one block). */
  bytesPerRow?: number;
  /** Number or rows per image (needed if multiple images are being set) */
  rowsPerImage?: number;
  /** Bits per channel */
  bitsPerChannel: [number, number, number, number];
};

export type PixelData = {
  arrayBuffer: ArrayBuffer;
  width: number;
  height: number;
  /** Bytes per pixel */
  bytesPerPixel: number;
  bytesPerRow: number;
  bitsPerChannel: [number, number, number, number];
};

/**
 * Extracts a single RGBA pixel value from PixelData at the given (x, y) coordinate.
 *
 * The pixel's data is assumed to be packed according to pixelData.bitsPerChannel.
 * The pixel data for a given row is padded to pixelData.bytesPerRow.
 *
 * @param pixelData - The metadata and data for the pixel buffer.
 * @param x - The x coordinate (0-based).
 * @param y - The y coordinate (0-based).
 * @returns A tuple [r, g, b, a] where each channel is the extracted numeric value.
 *
* @example

Assume you obtained an ArrayBuffer from copyTextureToBuffer and have the following metadata:

  const pixelData: PixelData = {
    bitsPerChannel: [5, 6, 5, 0], // For example, a 16-bit RGB565 format (no alpha)
    width: 800,
    height: 600,
    bytesPerPixel: 2,           // 16 bits per pixel
    bytesPerRow: 1600,          // Assuming no extra padding
    arrayBuffer: myTextureBuffer, // Obtained from copyTextureToBuffer
  };

You can then extract the pixel at (x, y) like so:

  const rgba = extractPixel(pixelData, x, y);
  console.log("Extracted RGBA:", rgba);

For RGBA formats where all channels are present (e.g. [8, 8, 8, 8]), the function will extract a 4-channel pixel value.
*/

export function readPixel(
  pixelData: PixelData,
  x: number,
  y: number,
  bitsPerChannel: [number, number, number, number]
): [number, number, number, number] {
  if (x < 0 || x >= pixelData.width || y < 0 || y >= pixelData.height) {
    throw new Error('Coordinates out of bounds.');
  }

  // Compute the byte offset of the pixel in the buffer.
  const byteOffset = y * pixelData.bytesPerRow + x * pixelData.bytesPerPixel;

  // Create a Uint8Array view for this pixel's bytes.
  // We only need to view pixelData.bytesPerPixel bytes.
  const pixelDataView = new DataView(pixelData.arrayBuffer, byteOffset, pixelData.bytesPerPixel);

  let bitOffsetWithinPixel = 0;
  const channels: number[] = [];

  // Extract each of the four channels.
  for (let i = 0; i < 4; i++) {
    const bits = bitsPerChannel[i];
    // If a channel's bit width is zero or negative, consider it not present.
    if (bits <= 0) {
      channels.push(0);
    } else {
      const channelValue = readBitsFromDataView(pixelDataView, bitOffsetWithinPixel, bits);
      channels.push(channelValue);
      bitOffsetWithinPixel += bits;
    }
  }

  return [channels[0], channels[1], channels[2], channels[3]];
}

/**
 * Encodes an RGBA pixel into a DataView at a given bit offset according to a specified bit layout.
 *
 * The channels are written sequentially in the order R, G, B, A. For each channel, the number
 * of bits is taken from the bitsPerChannel array. Channel values are masked to fit within the specified width.
 *
 * @param dataView - The DataView into which the pixel will be encoded.
 * @param bitOffset - The bit offset in the DataView where the pixel should be written.
 * @param bitsPerChannel - A tuple specifying the number of bits for each channel: [R, G, B, A].
 * @param pixel - A tuple [r, g, b, a] containing the channel values (as numbers).
 *
 * @example

Assume you want to encode a pixel into a packed format where:
  - Red uses 5 bits
  - Green uses 6 bits
  - Blue uses 5 bits
  - Alpha is not used (0 bits)
And the pixel format is packed into 16 bits total.

You might have:
  const bitsPerChannel: [number, number, number, number] = [5, 6, 5, 0];
  const pixel: [number, number, number, number] = [15, 31, 15, 0]; // Example values
  const buffer = new ArrayBuffer(2); // 16 bits = 2 bytes
  const dataView = new DataView(buffer);

Now encode the pixel at bit offset 0:
  encodePixel(dataView, 0, bitsPerChannel, pixel);

The dataView now contains the 16-bit packed pixel value in big-endian order.
*/
export function writePixel(
  dataView: DataView,
  bitOffset: number,
  bitsPerChannel: [number, number, number, number],
  pixel: [number, number, number, number]
): void {
  let currentBitOffset = bitOffset;
  for (let channel = 0; channel < 4; channel++) {
    const bits = bitsPerChannel[channel];
    // Clamp the channel value to the maximum allowed by the bit width.
    const maxValue = (1 << bits) - 1;
    const channelValue = pixel[channel] & maxValue;
    writeBitsToDataView(dataView, currentBitOffset, bits, channelValue);
    currentBitOffset += bits;
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
export function readBitsFromDataView(
  dataView: DataView,
  bitOffset: number,
  bitCount: number
): number {
  // Check if we can optimize when bitOffset is byte-aligned.
  if (bitOffset % 8 === 0) {
    const byteOffset = bitOffset / 8;
    if (bitCount === 8 && byteOffset + 1 <= dataView.byteLength) {
      return dataView.getUint8(byteOffset);
    } else if (bitCount === 16 && byteOffset + 2 <= dataView.byteLength) {
      // false for big-endian reading.
      return dataView.getUint16(byteOffset, false);
    } else if (bitCount === 32 && byteOffset + 4 <= dataView.byteLength) {
      return dataView.getUint32(byteOffset, false);
    }
  }

  // Fallback: bit-level extraction for non-aligned or non-standard bit widths.
  let value = 0;
  for (let i = 0; i < bitCount; i++) {
    const overallBitIndex = bitOffset + i;
    const byteIndex = Math.floor(overallBitIndex / 8);
    const bitIndex = overallBitIndex % 8;
    // Read the byte and extract the bit at position (7 - bitIndex).
    const byteValue = dataView.getUint8(byteIndex);
    const bit = (byteValue >> (7 - bitIndex)) & 1;
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
export function writeBitsToDataView(
  dataView: DataView,
  bitOffset: number,
  bitCount: number,
  value: number
): void {
  // If the bitOffset is byte-aligned, we may optimize for common bit widths.
  if (bitOffset % 8 === 0) {
    const byteOffset = bitOffset / 8;
    if (bitCount === 8 && byteOffset + 1 <= dataView.byteLength) {
      dataView.setUint8(byteOffset, value & 0xff);
      return;
    } else if (bitCount === 16 && byteOffset + 2 <= dataView.byteLength) {
      dataView.setUint16(byteOffset, value & 0xffff, false); // big-endian
      return;
    } else if (bitCount === 32 && byteOffset + 4 <= dataView.byteLength) {
      dataView.setUint32(byteOffset, value, false); // big-endian
      return;
    }
  }

  // Fallback: write bit-by-bit.
  for (let i = 0; i < bitCount; i++) {
    const overallBitIndex = bitOffset + i;
    const byteIndex = Math.floor(overallBitIndex / 8);
    const bitIndex = overallBitIndex % 8;
    const mask = 1 << (7 - bitIndex);
    // Extract the i-th bit from value (starting from the most-significant bit)
    const bitValue = (value >> (bitCount - 1 - i)) & 1;
    // Read the current byte.
    let currentByte = dataView.getUint8(byteIndex);
    // Clear the target bit.
    currentByte &= ~mask;
    // Set the target bit if bitValue is 1.
    if (bitValue) {
      currentByte |= mask;
    }
    dataView.setUint8(byteIndex, currentByte);
  }
}
