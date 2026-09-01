// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getArrowVectorByPath, makeGPUVectorFromArrow} from '@luma.gl/arrow';
import type {Device} from '@luma.gl/core';
import type {GPUVector, GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';
import {RecordBatch, Table, Vector, type DataType} from 'apache-arrow';

/** Materialized Arrow sources accepted by synchronous GPUVector adapters. */
export type ArrowGPUVectorLayerData = Table | RecordBatch;
/** Named or direct Arrow vector selected for one semantic GPUVector input. */
export type ArrowGPUVectorColumnSelector<TypeT extends DataType = DataType> =
  | string
  | Vector<TypeT>;

/** Resolves a column and uploads it as an adapter-owned GPUVector. */
export function makeLayerGPUVectorFromArrow<FormatT extends GPUVectorFormat>(
  device: Device,
  data: ArrowGPUVectorLayerData,
  selector: ArrowGPUVectorColumnSelector,
  options: {name: string; id: string; format: FormatT}
): GPUVector<FormatT> {
  const vector =
    selector instanceof Vector
      ? selector
      : getArrowVectorByPath(data instanceof Table ? data : new Table([data]), selector);
  if (!vector) throw new Error(`Arrow GPU layer column "${String(selector)}" is missing`);
  if (vector.data.some(chunk => chunk.nullCount > 0)) {
    throw new Error(`Arrow GPU layer column "${options.name}" contains null rows`);
  }
  return makeGPUVectorFromArrow(device, vector, {
    name: options.name,
    id: options.id,
    format: options.format,
    preserveDataChunks: true
  });
}

/** Destroys only vectors created and owned by an Arrow adapter. */
export function destroyLayerGPUVectors(vectors: Array<GPUVector | undefined>): void {
  for (const vector of vectors) vector?.destroy();
}
