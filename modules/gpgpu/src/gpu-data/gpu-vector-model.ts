// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {BufferLayout, Device, RenderPass} from '@luma.gl/core';
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
  private currentAttributes!: NonNullable<ModelProps['attributes']>;

  constructor(device: Device, props: GPUVectorModelProps) {
    const {gpuVectorCount = 'instance', ...modelProps} = props;
    super(device, modelProps);
    this.gpuVectorCount = gpuVectorCount;
    this.currentAttributes = {...(modelProps.attributes ?? {})};
  }

  /** Tracks the live attribute state so batched draws can restore inherited Model mutations. */
  override setAttributes(
    attributes: NonNullable<ModelProps['attributes']>,
    options?: {disableWarnings?: boolean}
  ): void {
    this.currentAttributes = Object.assign(this.currentAttributes ?? {}, attributes);
    super.setAttributes(attributes, options);
  }

  /** Draws each aligned physical chunk without retaining or taking ownership of input vectors. */
  drawBatches(
    renderPass: RenderPass,
    {vectors, onBatch}: GPUVectorModelDrawBatchesOptions
  ): boolean {
    const batches = getGPUVectorModelBatches(this.id, vectors);
    validateGPUVectorModelLayouts(this.id, vectors, this.bufferLayout, this.currentAttributes);
    const previousAttributes = {...this.currentAttributes};
    const previousBindings = {...this.bindings};
    const previousInstanceCount = this.instanceCount;
    const previousVertexCount = this.vertexCount;
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
      this.setAttributes(previousAttributes);
      for (const name of Object.keys(this.bindings)) {
        if (!(name in previousBindings)) delete this.bindings[name];
      }
      this.setBindings(previousBindings);
      this.setInstanceCount(previousInstanceCount);
      this.setVertexCount(previousVertexCount);
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

function validateGPUVectorModelLayouts(
  ownerName: string,
  vectors: Record<string, GPUVector | undefined>,
  bufferLayouts: BufferLayout[],
  attributes: NonNullable<ModelProps['attributes']>
): void {
  for (const [name, vector] of Object.entries(vectors)) {
    if (!vector) continue;
    if (!vector.format) {
      throw new Error(`${ownerName} GPUVector "${name}" requires a format`);
    }
    if (!attributes[name]) {
      throw new Error(`${ownerName} GPUVector "${name}" requires an existing Model attribute`);
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
    const byteOffset = attributeLayout?.byteOffset ?? 0;
    const formatInfo = getGPUVectorFormatInfo(vector.format);
    const byteStride = bufferLayout.byteStride ?? formatInfo.byteLength;
    if (
      format !== vector.format ||
      byteStride !== vector.byteStride ||
      vector.rowByteLength !== formatInfo.byteLength
    ) {
      throw new Error(`${ownerName} GPUVector "${name}" must match its Model buffer layout`);
    }
    for (const chunk of vector.data) {
      if (chunk.byteOffset !== byteOffset) {
        throw new Error(
          `${ownerName} GPUVector "${name}" chunk byte offsets must match its Model buffer layout`
        );
      }
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
