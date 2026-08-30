// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPU_LZ_BYTE_DESCRIPTOR_WORDS} from '@luma.gl/gpgpu/gpu-core';

export const SNAPPY_DESCRIPTOR_WORDS = GPU_LZ_BYTE_DESCRIPTOR_WORDS;

/** CPU-parsed raw Snappy block control data for GPU upload. */
export type SnappyDecompressionPlan = {
  /** Generic `[outputOffset, byteLength, literalSourceOffset, matchOffset]` LZ spans. */
  descriptors: Uint32Array;
  descriptorCount: number;
  compressedByteLength: number;
  outputByteLength: number;
};

/** Parses a raw Snappy block into literal/backreference spans without expanding its bytes. */
export function parseSnappyDecompressionPlan(compressed: Uint8Array): SnappyDecompressionPlan {
  const lengthResult = readVarint(compressed, 0);
  const outputByteLength = lengthResult.value;
  let compressedByteOffset = lengthResult.nextByteOffset;
  let outputByteOffset = 0;
  const descriptors: number[] = [];
  while (compressedByteOffset < compressed.length) {
    const tag = compressed[compressedByteOffset++];
    const tagKind = tag & 3;
    if (tagKind === 0) {
      const literalLengthResult = readLiteralLength(compressed, compressedByteOffset, tag >>> 2);
      compressedByteOffset = literalLengthResult.nextByteOffset;
      const literalLength = literalLengthResult.length;
      if (compressedByteOffset + literalLength > compressed.length) {
        throw new Error('Snappy literal payload is truncated');
      }
      appendSpan(descriptors, outputByteOffset, literalLength, compressedByteOffset, 0);
      compressedByteOffset += literalLength;
      outputByteOffset = addOutputLength(outputByteOffset, literalLength, outputByteLength);
      continue;
    }

    const copyResult = readCopy(compressed, compressedByteOffset, tag, tagKind);
    compressedByteOffset = copyResult.nextByteOffset;
    if (copyResult.matchOffset === 0 || copyResult.matchOffset > outputByteOffset) {
      throw new Error('Snappy copy offset is outside the decoded prefix');
    }
    appendSpan(descriptors, outputByteOffset, copyResult.length, 0, copyResult.matchOffset);
    outputByteOffset = addOutputLength(outputByteOffset, copyResult.length, outputByteLength);
  }
  if (outputByteOffset !== outputByteLength) {
    throw new Error('Snappy decoded length does not match the preamble');
  }
  return Object.freeze({
    descriptors: Uint32Array.from(descriptors),
    descriptorCount: descriptors.length / SNAPPY_DESCRIPTOR_WORDS,
    compressedByteLength: compressed.length,
    outputByteLength
  });
}

function readVarint(
  compressed: Uint8Array,
  byteOffset: number
): {value: number; nextByteOffset: number} {
  let value = 0;
  let multiplier = 1;
  for (let byteIndex = 0; byteIndex < 5; byteIndex++) {
    if (byteOffset >= compressed.length) {
      throw new Error('Snappy uncompressed length is truncated');
    }
    const byte = compressed[byteOffset++];
    value += (byte & 0x7f) * multiplier;
    if ((byte & 0x80) === 0) {
      if (!Number.isSafeInteger(value) || value > 0xffffffff) {
        throw new Error('Snappy uncompressed length exceeds uint32');
      }
      return {value, nextByteOffset: byteOffset};
    }
    multiplier *= 128;
  }
  throw new Error('Snappy uncompressed length exceeds five bytes');
}

function readLiteralLength(
  compressed: Uint8Array,
  byteOffset: number,
  encodedLength: number
): {length: number; nextByteOffset: number} {
  if (encodedLength < 60) {
    return {length: encodedLength + 1, nextByteOffset: byteOffset};
  }
  const lengthByteCount = encodedLength - 59;
  if (byteOffset + lengthByteCount > compressed.length) {
    throw new Error('Snappy literal length is truncated');
  }
  let lengthMinusOne = 0;
  let multiplier = 1;
  for (let byteIndex = 0; byteIndex < lengthByteCount; byteIndex++) {
    lengthMinusOne += compressed[byteOffset++] * multiplier;
    multiplier *= 256;
  }
  return {length: lengthMinusOne + 1, nextByteOffset: byteOffset};
}

function readCopy(
  compressed: Uint8Array,
  byteOffset: number,
  tag: number,
  tagKind: number
): {length: number; matchOffset: number; nextByteOffset: number} {
  if (tagKind === 1) {
    if (byteOffset >= compressed.length) {
      throw new Error('Snappy one-byte copy offset is truncated');
    }
    return {
      length: 4 + ((tag >>> 2) & 7),
      matchOffset: ((tag & 0xe0) << 3) | compressed[byteOffset],
      nextByteOffset: byteOffset + 1
    };
  }
  const offsetByteCount = tagKind === 2 ? 2 : 4;
  if (byteOffset + offsetByteCount > compressed.length) {
    throw new Error('Snappy copy offset is truncated');
  }
  let matchOffset = 0;
  let multiplier = 1;
  for (let byteIndex = 0; byteIndex < offsetByteCount; byteIndex++) {
    matchOffset += compressed[byteOffset++] * multiplier;
    multiplier *= 256;
  }
  return {
    length: 1 + (tag >>> 2),
    matchOffset,
    nextByteOffset: byteOffset
  };
}

function appendSpan(
  descriptors: number[],
  outputByteOffset: number,
  byteLength: number,
  literalSourceOffset: number,
  matchOffset: number
): void {
  if (byteLength > 0) {
    descriptors.push(outputByteOffset, byteLength, literalSourceOffset, matchOffset);
  }
}

function addOutputLength(
  outputByteOffset: number,
  byteLength: number,
  expectedByteLength: number
): number {
  const result = outputByteOffset + byteLength;
  if (!Number.isSafeInteger(result) || result > expectedByteLength) {
    throw new Error('Snappy elements exceed the declared uncompressed length');
  }
  return result;
}
