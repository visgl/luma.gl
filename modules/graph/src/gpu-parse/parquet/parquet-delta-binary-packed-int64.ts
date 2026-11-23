// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const PARQUET_DELTA_BINARY_PACKED_INT64_DESCRIPTOR_WORDS = 6;

/** CPU-parsed control data for an INT64 Parquet DELTA_BINARY_PACKED stream. */
export type ParquetDeltaBinaryPackedInt64Plan = {
  blockSize: number;
  miniBlockCount: number;
  valuesPerMiniBlock: number;
  valueCount: number;
  firstValueLow: number;
  firstValueHigh: number;
  miniBlockDescriptors: Uint32Array;
  descriptorCount: number;
  bytesConsumed: number;
};

/** Parses INT64 delta headers and emits split-word mini-block descriptors. */
export function parseParquetDeltaBinaryPackedInt64Plan(
  encoded: Uint8Array
): ParquetDeltaBinaryPackedInt64Plan {
  let byteOffset = 0;
  const blockResult = readUnsignedVarint(encoded, byteOffset);
  const blockSize = toUint32(blockResult.value, 'block size');
  byteOffset = blockResult.nextByteOffset;
  const miniBlockResult = readUnsignedVarint(encoded, byteOffset);
  const miniBlockCount = toUint32(miniBlockResult.value, 'mini-block count');
  byteOffset = miniBlockResult.nextByteOffset;
  const countResult = readUnsignedVarint(encoded, byteOffset);
  const valueCount = toUint32(countResult.value, 'value count');
  byteOffset = countResult.nextByteOffset;
  const firstResult = readSignedVarint(encoded, byteOffset);
  validateInt64(firstResult.value, 'first value');
  byteOffset = firstResult.nextByteOffset;
  if (blockSize === 0 || blockSize % 128 !== 0) {
    throw new Error('Parquet delta block size must be a positive multiple of 128');
  }
  if (miniBlockCount === 0 || blockSize % miniBlockCount !== 0) {
    throw new Error('Parquet delta mini-block count must divide the block size');
  }
  const valuesPerMiniBlock = blockSize / miniBlockCount;
  if (valuesPerMiniBlock % 32 !== 0) {
    throw new Error('Parquet delta mini-block value count must be a multiple of 32');
  }
  if (valueCount === 0) {
    throw new Error('Parquet delta value count must be positive');
  }

  const descriptors: number[] = [];
  let outputOffset = 1;
  while (outputOffset < valueCount) {
    const minimumResult = readSignedVarint(encoded, byteOffset);
    validateInt64(minimumResult.value, 'minimum delta');
    byteOffset = minimumResult.nextByteOffset;
    if (byteOffset + miniBlockCount > encoded.length) {
      throw new Error('Parquet delta mini-block widths are truncated');
    }
    const bitWidths = encoded.subarray(byteOffset, byteOffset + miniBlockCount);
    byteOffset += miniBlockCount;
    const minimumWords = splitInt64(minimumResult.value);
    for (const bitWidth of bitWidths) {
      const decodedValueCount = Math.min(valuesPerMiniBlock, valueCount - outputOffset);
      if (decodedValueCount === 0) {
        continue;
      }
      if (bitWidth > 64) {
        throw new Error('Parquet INT64 delta mini-block bit width exceeds 64');
      }
      const payloadByteLength = (valuesPerMiniBlock * bitWidth) / 8;
      if (byteOffset + payloadByteLength > encoded.length) {
        throw new Error('Parquet delta mini-block payload is truncated');
      }
      descriptors.push(
        outputOffset,
        decodedValueCount,
        byteOffset,
        bitWidth,
        minimumWords.low,
        minimumWords.high
      );
      outputOffset += decodedValueCount;
      byteOffset += payloadByteLength;
    }
  }
  const firstWords = splitInt64(firstResult.value);
  return Object.freeze({
    blockSize,
    miniBlockCount,
    valuesPerMiniBlock,
    valueCount,
    firstValueLow: firstWords.low,
    firstValueHigh: firstWords.high,
    miniBlockDescriptors: Uint32Array.from(descriptors),
    descriptorCount: descriptors.length / PARQUET_DELTA_BINARY_PACKED_INT64_DESCRIPTOR_WORDS,
    bytesConsumed: byteOffset
  });
}

function readUnsignedVarint(
  encoded: Uint8Array,
  byteOffset: number
): {value: bigint; nextByteOffset: number} {
  let value = 0n;
  for (let byteIndex = 0; byteIndex < 10; byteIndex++) {
    if (byteOffset >= encoded.length) {
      throw new Error('Parquet delta varint is truncated');
    }
    const byte = encoded[byteOffset++];
    value |= BigInt(byte & 0x7f) << BigInt(byteIndex * 7);
    if ((byte & 0x80) === 0) {
      return {value, nextByteOffset: byteOffset};
    }
  }
  throw new Error('Parquet delta varint exceeds ten bytes');
}

function readSignedVarint(
  encoded: Uint8Array,
  byteOffset: number
): {value: bigint; nextByteOffset: number} {
  const result = readUnsignedVarint(encoded, byteOffset);
  return {
    value: (result.value >> 1n) ^ -(result.value & 1n),
    nextByteOffset: result.nextByteOffset
  };
}

function toUint32(value: bigint, name: string): number {
  if (value < 0n || value > 0xffffffffn) {
    throw new Error(`Parquet delta ${name} exceeds uint32`);
  }
  return Number(value);
}

function validateInt64(value: bigint, name: string): void {
  if (value < -0x8000000000000000n || value > 0x7fffffffffffffffn) {
    throw new Error(`Parquet delta ${name} exceeds INT64`);
  }
}

function splitInt64(value: bigint): {low: number; high: number} {
  const unsignedValue = BigInt.asUintN(64, value);
  return {
    low: Number(unsignedValue & 0xffffffffn),
    high: Number(unsignedValue >> 32n)
  };
}
