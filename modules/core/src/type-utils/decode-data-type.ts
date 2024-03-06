// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DataType, NormalizedDataType} from './vertex-formats';

export type DecodedVertexType = {
  /** WebGPU data type */
  dataType: DataType;
  /** Length in bytes of the data for one vertex */
  byteLength: number;
  /** Whether this is for integer or float vert */
  integer: boolean;
  /** Whether this data type is signed */
  signed: boolean;
  /** Whether this is a normalized integer (that must be used as float) */
  normalized: boolean;
};

/** Decodes a vertex type, returning byte length and flags (integer, signed, normalized) */
export function decodeVertexType(type: NormalizedDataType): DecodedVertexType {
  const dataType = TYPE_MAP[type];
  const bytes = getDataTypeBytes(dataType);
  const normalized: boolean = type.includes('norm');
  const integer: boolean = !normalized && !type.startsWith('float');
  const signed: boolean = type.startsWith('s');
  return {
    dataType: TYPE_MAP[type],
    byteLength: bytes,
    integer,
    signed,
    normalized
  };
}

function getDataTypeBytes(type: DataType): number {
  const bytes = TYPE_SIZES[type];
  // assert(bytes);
  return bytes;
}

const TYPE_MAP: Record<NormalizedDataType, DataType> = {
  uint8: 'uint8',
  sint8: 'sint8',
  unorm8: 'uint8',
  snorm8: 'sint8',
  uint16: 'uint16',
  sint16: 'sint16',
  unorm16: 'uint16',
  snorm16: 'sint16',
  float16: 'float16',
  float32: 'float32',
  uint32: 'uint32',
  sint32: 'sint32'
};

const TYPE_SIZES: Record<DataType, number> = {
  uint8: 1,
  sint8: 1,
  uint16: 2,
  sint16: 2,
  float16: 2,
  float32: 4,
  uint32: 4,
  sint32: 4
};
