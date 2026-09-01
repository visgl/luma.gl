// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, RenderPass} from '@luma.gl/core';
import {Model, type ModelProps} from '@luma.gl/engine';
import type {GPUData} from './gpu-data';
import type {GPUVector} from './gpu-vector';
import {getGPUVectorFormatInfo} from './gpu-vector-format';

/** Controls which draw count follows each physical GPUVector batch row count. */
export type GPUVectorModelCount = 'instance' | 'vertex' | 'none';

/** Props for a Model that can transiently bind aligned GPUVector chunks. */
export type GPUVectorModelProps = ModelProps & {
  /** Draw count updated from each batch. Defaults to `instance`. */
  gpuVectorCount?: GPUVectorModelCount;
};

/** One borrowed, row-aligned set of physical GPUData chunks. */
export type GPUVectorModelBatch = {
  batchIndex: number;
  rowIndexOffset: number;
  rowCount: number;
  data: Record<string, GPUData>;
};

/** Per-draw options for rendering aligned GPUVectors without creating table wrappers. */
export type GPUVectorModelDrawBatchesOptions = {
  /** Named vectors mapped to Model buffer-layout names. Undefined optional vectors are ignored. */
  vectors: Record<string, GPUVector | undefined>;
  /** Called after binding each batch and before its draw call. */
  onBatch?: (batch: GPUVectorModelBatch) => void;
};

/**
 * A Model that borrows aligned GPUVector chunks and draws each physical batch with one pipeline.
 *
 * The model never owns, destroys, packs, or transfers its input vectors or GPUData chunks.
 */
export class GPUVectorModel extends Model {
  private readonly gpuVectorCount: GPUVectorModelCount;
  private readonly explicitAttributes: NonNullable<ModelProps['attributes']>;
  private readonly explicitBindings: NonNullable<ModelProps['bindings']>;
  private readonly explicitInstanceCount: number;
  private readonly explicitVertexCount: number;

  constructor(device: Device, props: GPUVectorModelProps) {
    const {gpuVectorCount = 'instance', ...modelProps} = props;
    super(device, modelProps);
    this.gpuVectorCount = gpuVectorCount;
    this.explicitAttributes = {...(modelProps.attributes ?? {})};
    this.explicitBindings = {...(modelProps.bindings ?? {})};
    this.explicitInstanceCount = this.instanceCount;
    this.explicitVertexCount = this.vertexCount;
  }

  /** Draws each aligned physical chunk without retaining or taking ownership of input vectors. */
  drawBatches(
    renderPass: RenderPass,
    {vectors, onBatch}: GPUVectorModelDrawBatchesOptions
  ): boolean {
    const batches = getGPUVectorModelBatches(this.id, vectors);
    let drawSuccess = true;
    try {
      for (const batch of batches) {
        this.setAttributes(
          Object.fromEntries(Object.entries(batch.data).map(([name, data]) => [name, data.buffer]))
        );
        this.setBatchDrawCount(batch.rowCount);
        onBatch?.(batch);
        drawSuccess = super.draw(renderPass) && drawSuccess;
      }
    } finally {
      this.setAttributes(this.explicitAttributes);
      this.setBindings(this.explicitBindings);
      this.setInstanceCount(this.explicitInstanceCount);
      this.setVertexCount(this.explicitVertexCount);
    }
    return drawSuccess;
  }

  private setBatchDrawCount(rowCount: number): void {
    if (this.gpuVectorCount === 'instance') {
      this.setInstanceCount(rowCount);
    } else if (this.gpuVectorCount === 'vertex') {
      this.setVertexCount(rowCount);
    }
  }
}

/** Validates fixed-width vector alignment and returns borrowed batch-local GPUData references. */
export function getGPUVectorModelBatches(
  ownerName: string,
  vectors: Record<string, GPUVector | undefined>
): GPUVectorModelBatch[] {
  const entries = Object.entries(vectors).filter(
    (entry): entry is [string, GPUVector] => entry[1] !== undefined
  );
  if (entries.length === 0) return [];
  const [primaryName, primaryVector] = entries[0];
  for (const [name, vector] of entries) {
    if (!vector.format) {
      throw new Error(`${ownerName} GPUVector "${name}" requires a format`);
    }
    const formatInfo = getGPUVectorFormatInfo(vector.format);
    if (formatInfo.vertexList || formatInfo.valueList || formatInfo.fixedSizeList) {
      throw new Error(`${ownerName} GPUVector "${name}" requires a fixed-width scalar format`);
    }
    if (vector.length !== primaryVector.length) {
      throw new Error(`${ownerName} GPUVector "${name}" rows must match "${primaryName}" rows`);
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
