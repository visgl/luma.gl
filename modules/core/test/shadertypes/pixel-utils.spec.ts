// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape';
import {writePixel, readPixel, PixelData} from '@luma.gl/core';
import {readBitsFromDataView, writeBitsToDataView} from '../../src/shadertypes/textures/pixel-utils';

/**
 * Test readBitsFromDataView.
 */
test('readBitsFromDataView - aligned 8, 16, and 32-bit values', t => {
  // Create a buffer with known bytes: 0x12, 0x34, 0x56, 0x78.
  const buffer = new Uint8Array([0x12, 0x34, 0x56, 0x78]).buffer;
  const dataView = new DataView(buffer);

  // Aligned read at bit offset 0 for 8 bits.
  t.equal(readBitsFromDataView(dataView, 0, 8), 0x12, 'should read 8-bit value correctly');

  // Aligned read at bit offset 8 for 16 bits (should get 0x3456).
  t.equal(readBitsFromDataView(dataView, 8, 16), 0x3456, 'should read 16-bit value correctly');

  // Aligned read at bit offset 0 for 32 bits.
  t.equal(readBitsFromDataView(dataView, 0, 32), 0x12345678, 'should read 32-bit value correctly');
  t.end();
});

test('readBitsFromDataView - unaligned bits', t => {
  // Create a buffer with a single byte: 0xAC (binary: 1010 1100).
  const buffer = new Uint8Array([0xac]).buffer;
  const dataView = new DataView(buffer);
  // Read 4 bits starting from bit offset 3.
  // 0xAC = 1010 1100; starting at bit offset 3 gives bits: positions 3-6 = 0,1,1,0 → 0b0110 = 6.
  t.equal(readBitsFromDataView(dataView, 3, 4), 6, 'should correctly read unaligned 4 bits');
  t.end();
});

/**
 * Test writeBitsToDataView.
 */
test('writeBitsToDataView - writes an aligned 8-bit value', t => {
  const buffer = new ArrayBuffer(4);
  const dataView = new DataView(buffer);
  writeBitsToDataView(dataView, 0, 8, 0xab);
  t.equal(dataView.getUint8(0), 0xab, 'should write 8-bit value correctly');
  t.end();
});

test('writeBitsToDataView - writes an aligned 16-bit value', t => {
  const buffer = new ArrayBuffer(4);
  const dataView = new DataView(buffer);
  // Write 16 bits at a byte-aligned offset (bit offset 8 -> byte index 1).
  writeBitsToDataView(dataView, 8, 16, 0xcdef);
  t.equal(dataView.getUint16(1, false), 0xcdef, 'should write 16-bit value correctly');
  t.end();
});

test('writeBitsToDataView - round-trip unaligned bits', t => {
  const buffer = new ArrayBuffer(2);
  const dataView = new DataView(buffer);
  // Write 5 bits at a non-byte-aligned offset.
  writeBitsToDataView(dataView, 3, 5, 0b10101);
  const value = readBitsFromDataView(dataView, 3, 5);
  t.equal(value, 0b10101, 'should round-trip unaligned bits correctly');
  t.end();
});

/**
 * Test writePixel.
 */
test('writePixel - encodes an RGBA pixel with 8-bit channels', t => {
  const bitsPerChannel: [number, number, number, number] = [8, 8, 8, 8];
  const pixel: [number, number, number, number] = [10, 20, 30, 40];
  const buffer = new ArrayBuffer(4);
  const dataView = new DataView(buffer);
  writePixel(dataView, 0, bitsPerChannel, pixel);
  t.equal(dataView.getUint8(0), 10, 'Red channel should be 10');
  t.equal(dataView.getUint8(1), 20, 'Green channel should be 20');
  t.equal(dataView.getUint8(2), 30, 'Blue channel should be 30');
  t.equal(dataView.getUint8(3), 40, 'Alpha channel should be 40');
  t.end();
});

test('writePixel - encodes an RGBA pixel with non-8-bit channels', t => {
  // Example: a packed format with:
  // Red: 3 bits, Green: 3 bits, Blue: 2 bits, Alpha: 0 bits (packed into 8 bits total).
  const bitsPerChannel: [number, number, number, number] = [3, 3, 2, 0];
  // Choose sample values (max for 3 bits is 7, for 2 bits is 3).
  // For example: red = 5, green = 6, blue = 2.
  const pixel: [number, number, number, number] = [5, 6, 2, 0];
  const buffer = new ArrayBuffer(1);
  const dataView = new DataView(buffer);
  writePixel(dataView, 0, bitsPerChannel, pixel);

  // Expected bit pattern:
  // Red (5):  101 (3 bits)
  // Green (6): 110 (3 bits)
  // Blue (2):  10  (2 bits)
  // Combined: 10111010 → 0xBA.
  t.equal(dataView.getUint8(0), 0xba, 'should encode pixel to 0xBA');
  t.end();
});

// Assume readPixel and the PixelData type are defined in the same module, e.g.:
// import { readPixel, PixelData } from './pixelUtils';

/**
 * PixelData type definition:
 * type PixelData = {
 *   bitsPerChannel: [number, number, number, number],
 *   width: number;
 *   height: number;
 *   bytesPerPixel: number;
 *   bytesPerRow: number;
 *   arrayBuffer: ArrayBuffer;
 * };
 */

test.skip('readPixel - 8-bit channels (RGBA8)', t => {
  // Create a 2x2 image with one pixel per 4 bytes (RGBA8) and no padding.
  const width = 2;
  const height = 2;
  const bytesPerPixel = 4;
  const bytesPerRow = width * bytesPerPixel; // 8 bytes per row.
  // Pixel order (row-major):
  // Row 0: pixel(0,0) = [10, 20, 30, 40], pixel(1,0) = [50, 60, 70, 80]
  // Row 1: pixel(0,1) = [90, 100, 110, 120], pixel(1,1) = [130, 140, 150, 160]
  const pixelArray = new Uint8Array([
    10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160
  ]);
  const pixelData: PixelData = {
    bitsPerChannel: [8, 8, 8, 8],
    width,
    height,
    bytesPerPixel,
    bytesPerRow,
    arrayBuffer: pixelArray.buffer
  };

  t.deepEqual(
    readPixel(pixelData, 0, 0),
    [10, 20, 30, 40],
    'Pixel at (0,0) should be [10,20,30,40]'
  );
  t.deepEqual(
    readPixel(pixelData, 1, 0),
    [50, 60, 70, 80],
    'Pixel at (1,0) should be [50,60,70,80]'
  );
  t.deepEqual(
    readPixel(pixelData, 0, 1),
    [90, 100, 110, 120],
    'Pixel at (0,1) should be [90,100,110,120]'
  );
  t.deepEqual(
    readPixel(pixelData, 1, 1),
    [130, 140, 150, 160],
    'Pixel at (1,1) should be [130,140,150,160]'
  );

  t.end();
});

test.skip('readPixel - packed non-8-bit channels', t => {
  // Example: a 1x1 image where the pixel is stored in 1 byte using:
  // Red: 3 bits, Green: 3 bits, Blue: 2 bits, Alpha: 0 bits.
  // Let's pack: red = 5 (101), green = 6 (110), blue = 2 (10).
  // Combined bits: 101 (R), 110 (G), 10 (B) → 10111010 = 0xBA.
  const width = 1;
  const height = 1;
  const bytesPerPixel = 1;
  const bytesPerRow = 1;
  const pixelArray = new Uint8Array([0xba]);
  const pixelData: PixelData = {
    bitsPerChannel: [3, 3, 2, 0],
    width,
    height,
    bytesPerPixel,
    bytesPerRow,
    arrayBuffer: pixelArray.buffer
  };

  // Expected: red = 5, green = 6, blue = 2, alpha = 0.
  t.deepEqual(readPixel(pixelData, 0, 0), [5, 6, 2, 0], 'Packed pixel should decode to [5,6,2,0]');
  t.end();
});

test.skip('readPixel - out-of-bounds coordinates', t => {
  // Create a 1x1 image with RGBA8.
  const width = 1;
  const height = 1;
  const bytesPerPixel = 4;
  const bytesPerRow = 4;
  const pixelArray = new Uint8Array([1, 2, 3, 4]);
  const pixelData: PixelData = {
    bitsPerChannel: [8, 8, 8, 8],
    width,
    height,
    bytesPerPixel,
    bytesPerRow,
    arrayBuffer: pixelArray.buffer
  };

  t.throws(
    () => readPixel(pixelData, 1, 0),
    /Coordinates out of bounds/,
    'Should throw error for x coordinate out of bounds'
  );
  t.throws(
    () => readPixel(pixelData, 0, 1),
    /Coordinates out of bounds/,
    'Should throw error for y coordinate out of bounds'
  );
  t.end();
});
