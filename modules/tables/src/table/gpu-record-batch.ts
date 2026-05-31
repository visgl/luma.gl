// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type BufferLayout} from '@luma.gl/core';
import type {DynamicBuffer} from '@luma.gl/engine';
import type {GPUField, GPUSchema, GPUTypeMap} from './gpu-schema';
import {GPUVector} from './gpu-vector';
import {createGPUVectorCollection} from './gpu-vector-collection';

type GPUVectorMap<T extends GPUTypeMap = GPUTypeMap> = {
  [Name in keyof T & string]: GPUVector<T[Name]>;
};

/** Props retained as a migration alias for adapters that synthesize appendable batches. */
export type GPURecordBatchAppendableProps = never;

/** Props for constructing a GPU record batch from existing vectors and metadata. */
export type GPURecordBatchFromVectorsProps<T extends GPUTypeMap = GPUTypeMap> = {
  /** GPU vectors keyed by name, or a list of named GPU vectors. */
  vectors: GPUVectorMap<T> | Record<string, GPUVector> | GPUVector[];
  /** Optional precomputed batch buffer layouts. */
  bufferLayout?: BufferLayout[];
  /** Optional selected schema fields. Defaults to fields synthesized from vector names and formats. */
  fields?: GPUField[];
  /** Explicit row count for intentionally vector-less batches. */
  numRows?: number;
  /** Optional batch-level schema metadata. */
  metadata?: Map<string, string>;
  /** Number of null rows in the generated GPU record batch. */
  nullCount?: number;
  /** Optional model-ready storage bindings keyed by shader binding name. */
  bindings?: Record<string, Buffer | DynamicBuffer>;
};

/** Generic record-batch construction props. */
export type GPURecordBatchProps<T extends GPUTypeMap = GPUTypeMap> =
  GPURecordBatchFromVectorsProps<T>;

/** GPU memory and schema metadata for one selected record batch. */
export class GPURecordBatch<T extends GPUTypeMap = GPUTypeMap> {
  /** GPU-facing schema for the selected columns. */
  schema: GPUSchema<T>;
  /** Number of logical rows represented by the batch. */
  numRows: number;
  /** Number of selected GPU columns in {@link schema}. */
  numCols: number;
  /** Number of null rows retained in batch metadata. */
  nullCount: number;
  /** Buffer layout derived by the producing adapter. */
  readonly bufferLayout: BufferLayout[] = [];
  /** GPU vectors keyed by shader/table column name. */
  readonly gpuVectors: Record<string, GPUVector> = {};
  /** Model-ready attribute buffers keyed by buffer layout name. */
  readonly attributes: Record<string, Buffer | DynamicBuffer> = {};
  /** Model-ready storage bindings keyed by shader binding name. */
  readonly bindings: Record<string, Buffer | DynamicBuffer> = {};

  /** Creates one GPU record batch from named GPU vectors and optional schema metadata. */
  constructor({
    vectors,
    bufferLayout,
    fields,
    numRows,
    metadata,
    nullCount = 0,
    bindings = {}
  }: GPURecordBatchFromVectorsProps<T>) {
    const vectorCollection = createGPUVectorCollection<T>({
      ownerName: 'GPURecordBatch',
      vectors,
      bufferLayout,
      fields,
      numRows
    });

    this.numRows = vectorCollection.numRows;
    this.nullCount = nullCount;
    Object.assign(this.gpuVectors, vectorCollection.gpuVectors);
    Object.assign(this.attributes, vectorCollection.attributes);
    Object.assign(this.bindings, bindings);
    this.bufferLayout.push(...vectorCollection.bufferLayout);
    this.schema = {
      fields: vectorCollection.fields,
      metadata: metadata ?? new Map()
    };
    this.numCols = vectorCollection.fields.length;
  }

  /** Adds logical row/null counts after an adapter appends into batch-local vectors. */
  appendRows(numRows: number, nullCount = 0): this {
    this.numRows += numRows;
    this.nullCount += nullCount;
    return this;
  }

  /** Clears logical row/null counts while retaining vectors and allocations. */
  resetRows(): this {
    this.numRows = 0;
    this.nullCount = 0;
    return this;
  }

  /** Clears appendable vector payloads plus batch row/null counts while retaining allocations. */
  resetLastBatch(): this {
    for (const gpuVector of Object.values(this.gpuVectors)) {
      gpuVector.resetLastBatch();
    }
    return this.resetRows();
  }

  /** Destroys every owned GPU vector retained by this batch. */
  destroy(): void {
    for (const gpuVector of Object.values(this.gpuVectors)) {
      gpuVector.destroy();
    }
  }
}
