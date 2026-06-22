// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Buffer} from '@luma.gl/core';
import type {DynamicBuffer} from '@luma.gl/engine';
import type {GPUData} from './gpu-data';
import type {GPURecordBatch} from './gpu-record-batch';
import type {GPUTable} from './gpu-table';
import type {GPUVector} from './gpu-vector';

/** Returns the materialized payload byte length of one GPU data chunk. */
export function getGPUDataByteLength(data: GPUData): number {
  if (data.byteStride === 0) {
    return data.rowByteLength;
  }
  if (data.length === 0) {
    return 0;
  }
  return data.length * data.byteStride;
}

/** Returns the materialized payload byte length across all chunks in a GPU vector. */
export function getGPUVectorByteLength(vector: GPUVector): number {
  return vector.data.reduce((byteLength, data) => byteLength + getGPUDataByteLength(data), 0);
}

/** Returns the single GPUData chunk for APIs that require contiguous GPU vector storage. */
export function getGPUVectorData(vector: GPUVector): GPUData {
  const [data, ...remainingData] = vector.data;
  if (!data || remainingData.length > 0) {
    throw new Error(`GPUVector "${vector.name}" requires exactly one GPUData chunk`);
  }
  return data;
}

/** Returns the single backing buffer for APIs that bind contiguous GPU vector storage directly. */
export function getGPUVectorBuffer(vector: GPUVector): Buffer | DynamicBuffer {
  return getGPUVectorData(vector).buffer;
}

/** Returns a required GPU vector from a table or record batch by column name. */
export function getRequiredGPUVector(
  tableOrBatch: GPUTable | GPURecordBatch,
  columnName: string,
  ownerName = 'GPU table'
): GPUVector {
  const vector = tableOrBatch.gpuVectors[columnName];
  if (!vector) {
    throw new Error(`${ownerName} is missing GPU vector "${columnName}"`);
  }
  return vector;
}
