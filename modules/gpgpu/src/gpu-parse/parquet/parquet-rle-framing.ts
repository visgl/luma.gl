// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  PARQUET_RLE_RUN_DESCRIPTOR_WORDS,
  parseParquetRleBitPackedRunPlan,
  type ParquetRleBitPackedRunPlan
} from './parquet-rle-bit-packed';

/** Parsed dictionary-index framing and its rebased hybrid-run plan. */
export type ParquetDictionaryIndicesPlan = {
  bitWidth: number;
  runPlan: ParquetRleBitPackedRunPlan;
  bytesConsumed: number;
};

/** Reads the leading bit-width byte used by RLE_DICTIONARY and PLAIN_DICTIONARY data pages. */
export function parseParquetDictionaryIndicesPlan(
  encoded: Uint8Array,
  valueCount: number
): ParquetDictionaryIndicesPlan {
  if (encoded.length === 0) {
    throw new Error('Parquet dictionary index bit width is missing');
  }
  const bitWidth = encoded[0];
  const localPlan = parseParquetRleBitPackedRunPlan(encoded.subarray(1), bitWidth, valueCount);
  const runPlan = rebaseRunPlan(localPlan, 1, localPlan.bytesConsumed + 1);
  return Object.freeze({bitWidth, runPlan, bytesConsumed: runPlan.bytesConsumed});
}

/** Reads the four-byte little-endian length used by Data Page V1 RLE level/value streams. */
export function parseParquetLengthPrefixedRleBitPackedRunPlan(
  encoded: Uint8Array,
  bitWidth: number,
  valueCount: number
): ParquetRleBitPackedRunPlan {
  if (encoded.length < 4) {
    throw new Error('Parquet length-prefixed hybrid stream header is truncated');
  }
  const payloadByteLength = readUint32LittleEndian(encoded, 0);
  if (payloadByteLength > encoded.length - 4) {
    throw new Error('Parquet length-prefixed hybrid stream payload is truncated');
  }
  const localPlan = parseParquetRleBitPackedRunPlan(
    encoded.subarray(4, 4 + payloadByteLength),
    bitWidth,
    valueCount
  );
  return rebaseRunPlan(localPlan, 4, payloadByteLength + 4);
}

/** Parsed deprecated standalone BIT_PACKED payload metadata. */
export type ParquetBitPackedPlan = {
  bitWidth: number;
  valueCount: number;
  bytesConsumed: number;
};

/** Validates one deprecated standalone, MSB-first BIT_PACKED payload. */
export function parseParquetBitPackedRunPlan(
  encoded: Uint8Array,
  bitWidth: number,
  valueCount: number
): ParquetBitPackedPlan {
  validateBitWidth(bitWidth);
  validateValueCount(valueCount);
  const groupCount = Math.ceil(valueCount / 8);
  const payloadByteLength = groupCount * bitWidth;
  if (payloadByteLength > encoded.length) {
    throw new Error('Parquet BIT_PACKED payload is truncated');
  }
  return Object.freeze({bitWidth, valueCount, bytesConsumed: payloadByteLength});
}

function rebaseRunPlan(
  plan: ParquetRleBitPackedRunPlan,
  baseByteOffset: number,
  bytesConsumed: number
): ParquetRleBitPackedRunPlan {
  const runDescriptors = plan.runDescriptors.slice();
  for (
    let descriptorOffset = 0;
    descriptorOffset < runDescriptors.length;
    descriptorOffset += PARQUET_RLE_RUN_DESCRIPTOR_WORDS
  ) {
    runDescriptors[descriptorOffset + 2] += baseByteOffset;
  }
  return Object.freeze({...plan, runDescriptors, bytesConsumed});
}

function readUint32LittleEndian(bytes: Uint8Array, byteOffset: number): number {
  return (
    (bytes[byteOffset] |
      (bytes[byteOffset + 1] << 8) |
      (bytes[byteOffset + 2] << 16) |
      (bytes[byteOffset + 3] << 24)) >>>
    0
  );
}

function validateBitWidth(bitWidth: number): void {
  if (!Number.isSafeInteger(bitWidth) || bitWidth < 0 || bitWidth > 32) {
    throw new Error('Parquet BIT_PACKED bitWidth must be an integer from 0 through 32');
  }
}

function validateValueCount(valueCount: number): void {
  if (!Number.isSafeInteger(valueCount) || valueCount < 0 || valueCount > 0xffffffff) {
    throw new Error('Parquet BIT_PACKED valueCount must be a non-negative uint32');
  }
}
