// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const LZ4_RAW_DESCRIPTOR_WORDS = 4;

/** CPU-parsed LZ4_RAW sequence control data for GPU upload. */
export type LZ4RawDecompressionPlan = {
  /** Generic `[outputOffset, byteLength, literalSourceOffset, matchOffset]` LZ spans. */
  descriptors: Uint32Array;
  descriptorCount: number;
  compressedByteLength: number;
  outputByteLength: number;
};

/** Parses LZ4_RAW tokens without materializing decompressed bytes. External dictionaries are absent. */
export function parseLZ4RawDecompressionPlan(compressed: Uint8Array): LZ4RawDecompressionPlan {
  const descriptors: number[] = [];
  let compressedByteOffset = 0;
  let outputByteOffset = 0;
  while (compressedByteOffset < compressed.length) {
    const token = compressed[compressedByteOffset++];
    const literalResult = readExtendedLength(compressed, compressedByteOffset, token >>> 4);
    const literalLength = literalResult.length;
    compressedByteOffset = literalResult.nextByteOffset;
    const literalSourceOffset = compressedByteOffset;
    if (compressedByteOffset + literalLength > compressed.length) {
      throw new Error('LZ4_RAW literal payload is truncated');
    }
    compressedByteOffset += literalLength;
    if (compressedByteOffset === compressed.length) {
      if (literalLength > 0) {
        descriptors.push(outputByteOffset, literalLength, literalSourceOffset, 0);
      }
      outputByteOffset = addOutputLength(outputByteOffset, literalLength);
      break;
    }
    if (compressedByteOffset + 2 > compressed.length) {
      throw new Error('LZ4_RAW match offset is truncated');
    }
    const matchOffset =
      compressed[compressedByteOffset] | (compressed[compressedByteOffset + 1] << 8);
    compressedByteOffset += 2;
    if (matchOffset === 0 || matchOffset > outputByteOffset + literalLength) {
      throw new Error('LZ4_RAW match offset is outside the decoded prefix');
    }
    const matchResult = readExtendedLength(compressed, compressedByteOffset, token & 15);
    const matchLength = matchResult.length + 4;
    compressedByteOffset = matchResult.nextByteOffset;
    if (literalLength > 0) {
      descriptors.push(outputByteOffset, literalLength, literalSourceOffset, 0);
    }
    descriptors.push(outputByteOffset + literalLength, matchLength, 0, matchOffset);
    outputByteOffset = addOutputLength(outputByteOffset, literalLength + matchLength);
  }
  return Object.freeze({
    descriptors: Uint32Array.from(descriptors),
    descriptorCount: descriptors.length / LZ4_RAW_DESCRIPTOR_WORDS,
    compressedByteLength: compressed.length,
    outputByteLength: outputByteOffset
  });
}

function readExtendedLength(
  compressed: Uint8Array,
  byteOffset: number,
  initialLength: number
): {length: number; nextByteOffset: number} {
  let length = initialLength;
  if (initialLength !== 15) {
    return {length, nextByteOffset: byteOffset};
  }
  while (true) {
    if (byteOffset >= compressed.length) {
      throw new Error('LZ4_RAW extended length is truncated');
    }
    const extension = compressed[byteOffset++];
    length += extension;
    if (!Number.isSafeInteger(length) || length > 0xffffffff) {
      throw new Error('LZ4_RAW extended length exceeds uint32');
    }
    if (extension !== 255) {
      return {length, nextByteOffset: byteOffset};
    }
  }
}

function addOutputLength(outputByteOffset: number, byteLength: number): number {
  const result = outputByteOffset + byteLength;
  if (!Number.isSafeInteger(result) || result > 0xffffffff) {
    throw new Error('LZ4_RAW output byte length exceeds uint32');
  }
  return result;
}
