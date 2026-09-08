// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Number of uint32 words in one GPU-facing hybrid-run descriptor. */
export const PARQUET_RLE_RUN_DESCRIPTOR_WORDS = 4;

/** CPU-parsed control data for a Parquet RLE/bit-packed hybrid stream. */
export type ParquetRleBitPackedRunPlan = {
  /** `[outputOffset, valueCount, payloadByteOffset, kind]` for each run; kind is 0 for RLE. */
  runDescriptors: Uint32Array;
  runCount: number;
  valueCount: number;
  bytesConsumed: number;
};

/**
 * Parses variable-length hybrid run headers into fixed-width descriptors suitable for GPU upload.
 *
 * `encoded` starts at the first hybrid run header: callers remove any page-level length prefix or
 * dictionary-index bit-width byte before calling this function.
 */
export function parseParquetRleBitPackedRunPlan(
  encoded: Uint8Array,
  bitWidth: number,
  valueCount: number
): ParquetRleBitPackedRunPlan {
  validateBitWidth(bitWidth);
  validateValueCount(valueCount);
  const descriptors: number[] = [];
  let byteOffset = 0;
  let outputOffset = 0;
  while (outputOffset < valueCount) {
    const header = readUnsignedVarint(encoded, byteOffset);
    byteOffset = header.nextByteOffset;
    const isBitPacked = header.value % 2 === 1;
    const encodedCount = Math.floor(header.value / 2);
    if (encodedCount === 0) {
      throw new Error('Parquet hybrid run header has a zero run length');
    }
    const runValueCount = isBitPacked ? encodedCount * 8 : encodedCount;
    const payloadByteLength = isBitPacked ? encodedCount * bitWidth : Math.ceil(bitWidth / 8);
    if (
      !Number.isSafeInteger(payloadByteLength) ||
      byteOffset + payloadByteLength > encoded.length
    ) {
      throw new Error('Parquet hybrid run payload is truncated');
    }
    const decodedRunValueCount = Math.min(runValueCount, valueCount - outputOffset);
    descriptors.push(outputOffset, decodedRunValueCount, byteOffset, isBitPacked ? 1 : 0);
    outputOffset += decodedRunValueCount;
    byteOffset += payloadByteLength;
  }
  return Object.freeze({
    runDescriptors: Uint32Array.from(descriptors),
    runCount: descriptors.length / PARQUET_RLE_RUN_DESCRIPTOR_WORDS,
    valueCount,
    bytesConsumed: byteOffset
  });
}

function readUnsignedVarint(
  encoded: Uint8Array,
  byteOffset: number
): {value: number; nextByteOffset: number} {
  let value = 0;
  for (let byteIndex = 0; byteIndex < 5; byteIndex++) {
    if (byteOffset >= encoded.length) {
      throw new Error('Parquet hybrid run header is truncated');
    }
    const byte = encoded[byteOffset++];
    value += (byte & 0x7f) * 2 ** (byteIndex * 7);
    if (value > 0xffffffff) {
      throw new Error('Parquet hybrid run header exceeds uint32');
    }
    if ((byte & 0x80) === 0) {
      return {value, nextByteOffset: byteOffset};
    }
  }
  throw new Error('Parquet hybrid run header exceeds five bytes');
}

function validateBitWidth(bitWidth: number): void {
  if (!Number.isSafeInteger(bitWidth) || bitWidth < 0 || bitWidth > 32) {
    throw new Error('Parquet hybrid bitWidth must be an integer from 0 through 32');
  }
}

function validateValueCount(valueCount: number): void {
  if (!Number.isSafeInteger(valueCount) || valueCount < 0 || valueCount > 0xffffffff) {
    throw new Error('Parquet hybrid valueCount must be a non-negative uint32');
  }
}
