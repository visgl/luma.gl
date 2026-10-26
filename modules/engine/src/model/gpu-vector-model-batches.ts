// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  vertexFormatDecoder,
  type Buffer,
  type BufferLayout,
  type VertexFormat
} from '@luma.gl/core';
import type {DynamicBuffer} from '@luma.gl/core/dynamic';

/** Controls which draw count follows each physical vector batch row count. */
export type GPUVectorModelCount = 'instance' | 'vertex' | 'none';

/** Borrowed physical chunk required by vector rendering, independent of its producer. */
export type GPUVectorModelData = {
  readonly buffer: Buffer | DynamicBuffer;
  readonly byteOffset: number;
  readonly length: number;
  readonly format?: unknown;
  readonly byteStride: number;
  readonly rowByteLength: number;
};

/** Structural input contract implemented by GPUVector without an engine-to-gpgpu dependency. */
export type GPUVectorModelInput<Data extends GPUVectorModelData = GPUVectorModelData> = {
  readonly name: string;
  readonly format?: string;
  readonly length: number;
  readonly byteStride: number;
  readonly rowByteLength: number;
  readonly bufferLayout?: BufferLayout;
  readonly data: readonly Data[];
};

/** One borrowed, row-aligned set of physical vector chunks. */
export type GPUVectorModelBatch<Data extends GPUVectorModelData = GPUVectorModelData> = {
  batchIndex: number;
  rowIndexOffset: number;
  rowCount: number;
  data: Record<string, Data>;
};

/** Named vector inputs, which may have different physical formats. */
export type GPUVectorModelInputs = Record<string, GPUVectorModelInput | undefined>;

/** Per-draw options for rendering aligned vectors without creating table wrappers. */
export type GPUVectorModelDrawBatchesOptions<
  Inputs extends GPUVectorModelInputs = GPUVectorModelInputs
> = {
  vectors: Inputs;
  onBatch?: (batch: GPUVectorModelBatch<NonNullable<Inputs[keyof Inputs]>['data'][number]>) => void;
};

export function validateGPUVectorModelLayouts(
  ownerName: string,
  vectors: GPUVectorModelInputs,
  bufferLayouts: BufferLayout[]
): void {
  for (const [name, vector] of Object.entries(vectors)) {
    if (!vector) continue;
    if (!vector.format) {
      throw new Error(`${ownerName} GPUVector "${name}" requires a format`);
    }
    const bufferLayout = bufferLayouts.find(layout => layout.name === name);
    if (!bufferLayout) {
      throw new Error(`${ownerName} GPUVector "${name}" requires a Model buffer layout`);
    }
    const attributeLayouts = bufferLayout.attributes ?? [];
    if (attributeLayouts.length > 1) {
      throw new Error(`${ownerName} GPUVector "${name}" does not support interleaved layouts`);
    }
    const attributeLayout = attributeLayouts[0];
    const format = bufferLayout.format ?? attributeLayout?.format;
    const formatInfo = getVectorVertexFormatInfo(ownerName, name, vector.format);
    const byteStride = bufferLayout.byteStride ?? formatInfo.byteLength;
    if (
      format !== vector.format ||
      byteStride !== vector.byteStride ||
      vector.rowByteLength !== formatInfo.byteLength
    ) {
      throw new Error(`${ownerName} GPUVector "${name}" must match its Model buffer layout`);
    }
  }
}

/** Validates fixed-width vector alignment and returns borrowed batch-local chunk references. */
export function getGPUVectorModelBatches<Inputs extends GPUVectorModelInputs>(
  ownerName: string,
  vectors: Inputs
): GPUVectorModelBatch<NonNullable<Inputs[keyof Inputs]>['data'][number]>[] {
  type Data = NonNullable<Inputs[keyof Inputs]>['data'][number];
  const entries = Object.entries(vectors).filter(
    (entry): entry is [string, NonNullable<Inputs[keyof Inputs]>] => entry[1] !== undefined
  );
  if (entries.length === 0) return [];
  const [primaryName, primaryVector] = entries[0];
  for (const [name, vector] of entries) {
    if (!vector.format) {
      throw new Error(`${ownerName} GPUVector "${name}" requires a format`);
    }
    getVectorVertexFormatInfo(ownerName, name, vector.format);
    if (vector.length !== primaryVector.length) {
      throw new Error(`${ownerName} GPUVector "${name}" rows must match "${primaryName}" rows`);
    }
    if (vector.data.length !== primaryVector.data.length) {
      throw new Error(`${ownerName} GPUVector chunk counts must align`);
    }
  }

  let rowIndexOffset = 0;
  return primaryVector.data.map((primaryData, batchIndex) => {
    const data: Record<string, Data> = {};
    for (const [name, vector] of entries) {
      // Entries retain the concrete chunk types of the supplied vector collection.
      const chunk = vector.data[batchIndex] as Data | undefined;
      if (!chunk || chunk.length !== primaryData.length) {
        throw new Error(`${ownerName} GPUVector chunk ${batchIndex} row counts must align`);
      }
      if (
        chunk.format !== vector.format ||
        chunk.byteStride !== vector.byteStride ||
        chunk.rowByteLength !== vector.rowByteLength
      ) {
        throw new Error(`${ownerName} GPUVector "${name}" chunk layout must be stable`);
      }
      data[name] = chunk;
    }
    const batch = {batchIndex, rowIndexOffset, rowCount: primaryData.length, data};
    rowIndexOffset += primaryData.length;
    return batch;
  });
}

/** Only fixed-width vertex formats can be consumed by the generic vector draw path. */
function getVectorVertexFormatInfo(ownerName: string, name: string, format: string) {
  if (format.includes('<')) {
    throw new Error(`${ownerName} GPUVector "${name}" requires a fixed-width scalar format`);
  }
  return vertexFormatDecoder.getVertexFormatInfo(format as VertexFormat);
}
