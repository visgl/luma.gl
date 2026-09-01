// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {PickingInfo} from '@deck.gl/core';
import type {Buffer, BufferLayout, VertexFormat} from '@luma.gl/core';
import type {GPUData, GPUVector, GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';
import {getGPUVectorFormatInfo} from '@luma.gl/gpgpu/gpu-data';
import {DynamicBuffer} from '@luma.gl/engine';

/** One physical, row-aligned set of GPUVector chunks rendered as a deck child layer. */
export type GPUVectorLayerBatch = {
  batchIndex: number;
  rowIndexOffset: number;
  rowCount: number;
  data: Record<string, GPUData>;
};

/** Global row and physical chunk provenance attached to GPUVector layer picking results. */
export type GPUVectorLayerPickingInfo = PickingInfo & {
  gpuVector?: {rowIndex: number; batchIndex: number; batchRowIndex: number};
};

/** Resolves global picking identity back to a physical GPUVector chunk. */
export function getGPUVectorPickingProvenance(
  vector: GPUVector,
  rowIndex: number
): {rowIndex: number; batchIndex: number; batchRowIndex: number} {
  let rowIndexOffset = 0;
  for (const [batchIndex, data] of vector.data.entries()) {
    if (rowIndex < rowIndexOffset + data.length) {
      return {rowIndex, batchIndex, batchRowIndex: rowIndex - rowIndexOffset};
    }
    rowIndexOffset += data.length;
  }
  return {rowIndex, batchIndex: -1, batchRowIndex: -1};
}

/** Validates vector formats and returns aligned physical batches without packing or copying. */
export function getGPUVectorLayerBatches(
  ownerName: string,
  vectors: Record<string, GPUVector | undefined>,
  formats: Record<string, readonly GPUVectorFormat[]>
): GPUVectorLayerBatch[] {
  const entries = Object.entries(vectors).filter((entry): entry is [string, GPUVector] =>
    Boolean(entry[1])
  );
  if (entries.length === 0) return [];
  const [primaryName, primaryVector] = entries[0];
  for (const [name, vector] of entries) {
    const acceptedFormats = formats[name];
    if (!vector.format || !acceptedFormats?.includes(vector.format)) {
      throw new Error(
        `${ownerName} ${name} GPUVector.format "${vector.format ?? 'undefined'}" must be one of ${acceptedFormats?.join(', ') ?? 'the declared formats'}`
      );
    }
    if (vector.length !== primaryVector.length) {
      throw new Error(
        `${ownerName} ${name} rows must match ${primaryName} rows (${vector.length} !== ${primaryVector.length})`
      );
    }
    if (vector.data.length !== primaryVector.data.length) {
      throw new Error(`${ownerName} GPUVector chunk counts must align`);
    }
  }

  let rowIndexOffset = 0;
  return primaryVector.data.map((primaryData, batchIndex) => {
    const data: Record<string, GPUData> = {};
    for (const [name, vector] of entries) {
      const chunk = vector.data[batchIndex];
      if (!chunk || chunk.length !== primaryData.length) {
        throw new Error(`${ownerName} GPUVector chunk ${batchIndex} row counts must align`);
      }
      data[name] = chunk;
    }
    const batch = {
      batchIndex,
      rowIndexOffset,
      rowCount: primaryData.length,
      data
    };
    rowIndexOffset += primaryData.length;
    return batch;
  });
}

/** Returns the luma buffer behind a fixed-width GPUData chunk. */
export function getGPUDataBuffer(data: GPUData): Buffer {
  return data.buffer instanceof DynamicBuffer ? data.buffer.buffer : data.buffer;
}

/** Describes one borrowed GPUData chunk as a model vertex buffer. */
export function makeGPUDataBufferLayout(data: GPUData, name: string): BufferLayout {
  if (!data.format || typeof data.format !== 'string') {
    throw new Error('GPU deck layers require a scalar GPUVectorFormat');
  }
  const formatInfo = getGPUVectorFormatInfo(data.format);
  if (formatInfo.vertexList || formatInfo.valueList || formatInfo.fixedSizeList) {
    throw new Error(`GPU deck binary attributes do not accept ${data.format}`);
  }
  return {
    name,
    stepMode: 'instance',
    byteStride: data.byteStride,
    attributes: [
      {
        attribute: name,
        format: data.format as VertexFormat,
        byteOffset: data.byteOffset
      }
    ]
  };
}
