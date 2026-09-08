// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const PARQUET_DELTA_BINARY_PACKED_DESCRIPTOR_WORDS = 5;

/** CPU-parsed control data for an INT32 Parquet DELTA_BINARY_PACKED stream. */
export type ParquetDeltaBinaryPackedPlan = {
  blockSize: number;
  miniBlockCount: number;
  valuesPerMiniBlock: number;
  valueCount: number;
  firstValue: number;
  miniBlockDescriptors: Uint32Array;
  descriptorCount: number;
  bytesConsumed: number;
};

/** Parses DELTA_BINARY_PACKED headers and mini-block metadata without expanding values. */
export function parseParquetDeltaBinaryPackedPlan(
  encoded: Uint8Array
): ParquetDeltaBinaryPackedPlan {
  let byteOffset = 0;
  const blockSizeResult = readUnsignedVarint(encoded, byteOffset);
  const blockSize = toUint32(blockSizeResult.value, 'block size');
  byteOffset = blockSizeResult.nextByteOffset;
  const miniBlockCountResult = readUnsignedVarint(encoded, byteOffset);
  const miniBlockCount = toUint32(miniBlockCountResult.value, 'mini-block count');
  byteOffset = miniBlockCountResult.nextByteOffset;
  const valueCountResult = readUnsignedVarint(encoded, byteOffset);
  const valueCount = toUint32(valueCountResult.value, 'value count');
  byteOffset = valueCountResult.nextByteOffset;
  const firstValueResult = readSignedVarint(encoded, byteOffset);
  const firstValue = toInt32(firstValueResult.value, 'first value');
  byteOffset = firstValueResult.nextByteOffset;

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
    const minimumDeltaResult = readSignedVarint(encoded, byteOffset);
    const minimumDelta = toInt32(minimumDeltaResult.value, 'minimum delta');
    byteOffset = minimumDeltaResult.nextByteOffset;
    if (byteOffset + miniBlockCount > encoded.length) {
      throw new Error('Parquet delta mini-block widths are truncated');
    }
    const bitWidths = encoded.subarray(byteOffset, byteOffset + miniBlockCount);
    byteOffset += miniBlockCount;
    for (const bitWidth of bitWidths) {
      const decodedValueCount = Math.min(valuesPerMiniBlock, valueCount - outputOffset);
      if (decodedValueCount === 0) {
        continue;
      }
      if (bitWidth > 32) {
        throw new Error('Parquet INT32 delta mini-block bit width exceeds 32');
      }
      const payloadByteLength = (valuesPerMiniBlock * bitWidth) / 8;
      if (byteOffset + payloadByteLength > encoded.length) {
        throw new Error('Parquet delta mini-block payload is truncated');
      }
      descriptors.push(outputOffset, decodedValueCount, byteOffset, bitWidth, minimumDelta >>> 0);
      outputOffset += decodedValueCount;
      byteOffset += payloadByteLength;
    }
  }
  return Object.freeze({
    blockSize,
    miniBlockCount,
    valuesPerMiniBlock,
    valueCount,
    firstValue,
    miniBlockDescriptors: Uint32Array.from(descriptors),
    descriptorCount: descriptors.length / PARQUET_DELTA_BINARY_PACKED_DESCRIPTOR_WORDS,
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

function toInt32(value: bigint, name: string): number {
  if (value < -0x80000000n || value > 0x7fffffffn) {
    throw new Error(`Parquet delta ${name} exceeds INT32`);
  }
  return Number(value);
}
