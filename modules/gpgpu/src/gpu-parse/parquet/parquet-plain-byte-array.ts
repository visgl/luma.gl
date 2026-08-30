// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** CPU control data for PLAIN BYTE_ARRAY values with their length prefixes removed. */
export type ParquetPlainByteArrayPlan = {
  sourceOffsets: Uint32Array;
  valueLengths: Uint32Array;
  valueOffsets: Uint32Array;
  valueCount: number;
  bytesConsumed: number;
  outputByteLength: number;
};

/** Parses little-endian PLAIN length prefixes while leaving value bytes in the source payload. */
export function parseParquetPlainByteArrayPlan(
  encoded: Uint8Array,
  valueCount: number
): ParquetPlainByteArrayPlan {
  if (!Number.isSafeInteger(valueCount) || valueCount < 0 || valueCount > 0xffffffff) {
    throw new Error('Parquet PLAIN BYTE_ARRAY valueCount must be a non-negative uint32');
  }
  const sourceOffsets = new Uint32Array(valueCount);
  const valueLengths = new Uint32Array(valueCount);
  const valueOffsets = new Uint32Array(valueCount);
  let sourceByteOffset = 0;
  let outputByteOffset = 0;
  for (let valueIndex = 0; valueIndex < valueCount; valueIndex++) {
    if (sourceByteOffset + 4 > encoded.length) {
      throw new Error('Parquet PLAIN BYTE_ARRAY length prefix is truncated');
    }
    const byteLength = readUint32LittleEndian(encoded, sourceByteOffset);
    sourceByteOffset += 4;
    if (sourceByteOffset + byteLength > encoded.length) {
      throw new Error('Parquet PLAIN BYTE_ARRAY value is truncated');
    }
    sourceOffsets[valueIndex] = sourceByteOffset;
    valueLengths[valueIndex] = byteLength;
    valueOffsets[valueIndex] = outputByteOffset;
    outputByteOffset += byteLength;
    if (outputByteOffset > 0xffffffff) {
      throw new Error('Parquet PLAIN BYTE_ARRAY output length exceeds uint32');
    }
    sourceByteOffset += byteLength;
  }
  return Object.freeze({
    sourceOffsets,
    valueLengths,
    valueOffsets,
    valueCount,
    bytesConsumed: sourceByteOffset,
    outputByteLength: outputByteOffset
  });
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
