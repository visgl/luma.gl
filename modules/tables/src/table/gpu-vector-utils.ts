// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Buffer, BufferLayout} from '@luma.gl/core';
import type {DynamicBuffer} from '@luma.gl/engine';
import type {GPUData} from './gpu-data';
import type {GPUTable} from './gpu-table';
import type {GPUVector} from './gpu-vector';

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

/** Derives model-ready attribute buffers from layout metadata and GPU vector storage. */
export function getGPUVectorBuffersForLayout(
  bufferLayout: BufferLayout[],
  gpuVectors: Record<string, GPUVector>
): Record<string, Buffer | DynamicBuffer> {
  const buffers: Record<string, Buffer | DynamicBuffer> = {};
  for (const layout of bufferLayout) {
    const vector = gpuVectors[layout.name];
    if (!vector) {
      throw new Error(`Buffer layout references missing GPU vector "${layout.name}"`);
    }
    if (vector.data.length === 0) {
      continue;
    }
    buffers[layout.name] = getGPUVectorBuffer(vector);
  }
  return buffers;
}

/** Derives model-ready attribute buffers from layout metadata and batch-local GPU data. */
export function getGPUDataBuffersForLayout(
  bufferLayout: BufferLayout[],
  gpuData: Record<string, GPUData>
): Record<string, Buffer | DynamicBuffer> {
  const buffers: Record<string, Buffer | DynamicBuffer> = {};
  for (const layout of bufferLayout) {
    const data = gpuData[layout.name];
    if (!data) {
      throw new Error(`Buffer layout references missing GPUData "${layout.name}"`);
    }
    buffers[layout.name] = data.buffer;
  }
  return buffers;
}

/** Returns a required GPU vector from a table by column name. */
export function getRequiredGPUVector(
  table: GPUTable,
  columnName: string,
  ownerName = 'GPU table'
): GPUVector {
  const vector = table.gpuVectors[columnName];
  if (!vector) {
    throw new Error(`${ownerName} is missing GPU vector "${columnName}"`);
  }
  return vector;
}
