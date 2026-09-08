// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Parquet physical types relevant to fixed-width page decoding. */
export type ParquetPhysicalType =
  | 'BOOLEAN'
  | 'INT32'
  | 'INT64'
  | 'INT96'
  | 'FLOAT'
  | 'DOUBLE'
  | 'BYTE_ARRAY'
  | 'FIXED_LEN_BYTE_ARRAY';

/** Parquet encodings supported by the first GPU decoding tranche. */
export type ParquetEncoding = 'PLAIN' | 'BYTE_STREAM_SPLIT';

/** How a supported page payload reaches its decoded physical byte layout. */
export type ParquetColumnDecodeStrategy = 'zero-copy' | 'gpu-byte-stream-split';

/** Inputs needed to plan one fixed-width Parquet data-page payload. */
export type ParquetColumnDecodeProps = {
  encoding: ParquetEncoding;
  physicalType: ParquetPhysicalType;
  valueCount: number;
  /** Required only for `FIXED_LEN_BYTE_ARRAY`. */
  typeLength?: number;
};

/** Device-independent plan for one supported Parquet column payload. */
export type ParquetColumnDecodePlan = {
  encoding: ParquetEncoding;
  physicalType: ParquetPhysicalType;
  strategy: ParquetColumnDecodeStrategy;
  valueCount: number;
  byteWidth: number;
  encodedByteLength: number;
  decodedByteLength: number;
};

/** Returns the physical width of a fixed-width Parquet type. */
export function getParquetPhysicalTypeByteWidth(
  physicalType: ParquetPhysicalType,
  typeLength?: number
): number | null {
  switch (physicalType) {
    case 'INT32':
    case 'FLOAT':
      return 4;
    case 'INT64':
    case 'DOUBLE':
      return 8;
    case 'INT96':
      return 12;
    case 'FIXED_LEN_BYTE_ARRAY':
      if (!Number.isSafeInteger(typeLength) || Number(typeLength) <= 0) {
        throw new Error('FIXED_LEN_BYTE_ARRAY requires a positive integer typeLength');
      }
      return Number(typeLength);
    case 'BOOLEAN':
    case 'BYTE_ARRAY':
      return null;
  }
}

/**
 * Plans the supported physical decoding step for one Parquet page payload.
 *
 * `PLAIN` fixed-width bytes need no compute pass. `BYTE_STREAM_SPLIT` uses a GPU byte transpose.
 * Level decoding and compression are intentionally outside this plan.
 */
export function planParquetColumnDecode(props: ParquetColumnDecodeProps): ParquetColumnDecodePlan {
  validateValueCount(props.valueCount);
  const byteWidth = getParquetPhysicalTypeByteWidth(props.physicalType, props.typeLength);
  if (byteWidth === null) {
    throw new Error(`${props.encoding} ${props.physicalType} is not a fixed-width byte payload`);
  }
  if (props.encoding === 'BYTE_STREAM_SPLIT' && props.physicalType === 'INT96') {
    throw new Error('BYTE_STREAM_SPLIT does not support the Parquet INT96 physical type');
  }
  const decodedByteLength = props.valueCount * byteWidth;
  if (!Number.isSafeInteger(decodedByteLength) || decodedByteLength > 0xffffffff) {
    throw new Error('Parquet decoded byte length must fit in a uint32 index range');
  }
  return Object.freeze({
    encoding: props.encoding,
    physicalType: props.physicalType,
    strategy: props.encoding === 'PLAIN' ? 'zero-copy' : 'gpu-byte-stream-split',
    valueCount: props.valueCount,
    byteWidth,
    encodedByteLength: decodedByteLength,
    decodedByteLength
  });
}

function validateValueCount(valueCount: number): void {
  if (!Number.isSafeInteger(valueCount) || valueCount < 0 || valueCount > 0xffffffff) {
    throw new Error('Parquet valueCount must be a non-negative uint32');
  }
}
