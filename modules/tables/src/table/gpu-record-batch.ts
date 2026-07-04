// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BufferLayout, VertexFormat} from '@luma.gl/core';
import type {GPUData} from './gpu-data';
import type {GPUField, GPUSchema, GPUTypeMap} from './gpu-schema';
import {isGPUTableIndexColumnName} from './gpu-schema';
import {
  getGPUVectorElementFormat,
  isValueListGPUVectorFormat,
  isVertexListGPUVectorFormat
} from './gpu-vector-format';

/** Batch-local GPU data keyed by selected table column name. */
export type GPUDataMap<T extends GPUTypeMap = GPUTypeMap> = {
  [Name in keyof T & string]: GPUData<T[Name]>;
};

/** Generic source-row identity for a GPU record batch. */
export type GPURecordBatchSourceInfo = {
  /** Zero-based source batch index in the producing stream/table. */
  sourceBatchIndex: number;
  /** Zero-based source row index assigned to the first logical source row in this batch. */
  sourceRowIndexOffset: number;
  /** Number of logical source rows represented by this batch. */
  sourceRowCount: number;
};

/** Props for constructing one immutable GPU record batch from GPU data chunks. */
export type GPURecordBatchFromDataProps<T extends GPUTypeMap = GPUTypeMap> = {
  /** One batch-local GPU data chunk keyed by selected column name. */
  gpuData: GPUDataMap<T> | Record<string, GPUData>;
  /** Optional precomputed batch buffer layouts. */
  bufferLayout?: BufferLayout[];
  /** Optional selected schema fields. Defaults to fields synthesized from data names and formats. */
  fields?: GPUField[];
  /** Explicit row count for intentionally data-less batches. */
  numRows?: number;
  /** Optional batch-level schema metadata. */
  metadata?: Map<string, string>;
  /** Optional source-row identity retained for picking and row-level diagnostics. */
  sourceInfo?: GPURecordBatchSourceInfo;
  /** Number of null rows in the generated GPU record batch. */
  nullCount?: number;
};

/** Generic record-batch construction props. */
export type GPURecordBatchProps<T extends GPUTypeMap = GPUTypeMap> = GPURecordBatchFromDataProps<T>;

/** Immutable GPU memory and schema metadata for one selected record batch. */
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
  /** One batch-local GPU data chunk keyed by shader/table column name. */
  readonly gpuData: Record<string, GPUData> = {};
  /** Optional source-row identity retained from the producing table/stream. */
  readonly sourceInfo?: GPURecordBatchSourceInfo;

  /** Creates one immutable GPU record batch from named GPU data chunks. */
  constructor({
    gpuData,
    bufferLayout,
    fields,
    numRows,
    metadata,
    sourceInfo,
    nullCount = 0
  }: GPURecordBatchFromDataProps<T>) {
    this.numRows = getGPUDataCollectionRowCount(gpuData, numRows);
    this.nullCount = nullCount;
    Object.assign(this.gpuData, gpuData);
    this.bufferLayout.push(...getGPUDataCollectionBufferLayout(gpuData, bufferLayout));
    const resolvedFields = getGPUDataCollectionFields(gpuData, fields, this.bufferLayout);
    this.schema = {
      fields: resolvedFields,
      metadata: metadata ?? new Map()
    };
    this.numCols = resolvedFields.length;
    this.sourceInfo = sourceInfo ? {...sourceInfo} : undefined;
  }

  /** Destroys every owned GPU data chunk retained by this batch. */
  destroy(): void {
    for (const data of Object.values(this.gpuData)) {
      data.destroy();
    }
  }
}

/** Returns the shared row count after validating every named data chunk. */
function getGPUDataCollectionRowCount<T extends GPUTypeMap>(
  gpuData: GPURecordBatchFromDataProps<T>['gpuData'],
  explicitNumRows?: number
): number {
  const firstData = Object.values(gpuData)[0];
  if (!firstData) {
    return explicitNumRows ?? 0;
  }

  const numRows = explicitNumRows ?? firstData.length;
  const mismatchedData = Object.values(gpuData).find(data => data.length !== numRows);
  if (mismatchedData) {
    throw new Error('GPURecordBatch requires matching GPUData row counts');
  }
  return numRows;
}

/** Returns producer-supplied layouts or synthesizes layouts from typed data chunks. */
function getGPUDataCollectionBufferLayout<T extends GPUTypeMap>(
  gpuData: GPURecordBatchFromDataProps<T>['gpuData'],
  explicitBufferLayout?: BufferLayout[]
): BufferLayout[] {
  if (explicitBufferLayout) {
    for (const layout of explicitBufferLayout) {
      if (isGPUTableIndexColumnName(layout.name)) {
        throw new Error(
          `GPURecordBatch buffer layout cannot include reserved index column "${layout.name}"`
        );
      }
      if (!gpuData[layout.name]) {
        throw new Error(`GPURecordBatch buffer layout references missing GPUData "${layout.name}"`);
      }
    }
    return explicitBufferLayout;
  }

  return Object.entries(gpuData).flatMap(([name, data]) =>
    isGPUTableIndexColumnName(name) ? [] : synthesizeGPUDataBufferLayout(name, data)
  );
}

function synthesizeGPUDataBufferLayout(name: string, data: GPUData): BufferLayout[] {
  if (!data.format) {
    throw new Error(
      `GPURecordBatch cannot synthesize a buffer layout for GPUData "${name}" without a format`
    );
  }
  if (isVertexListGPUVectorFormat(data.format)) {
    throw new Error(
      `GPURecordBatch cannot synthesize a generic buffer layout for vertex-list GPUData "${name}"`
    );
  }
  if (isValueListGPUVectorFormat(data.format)) {
    throw new Error(
      `GPURecordBatch cannot synthesize a generic buffer layout for value-list GPUData "${name}"`
    );
  }
  return [
    {
      name,
      byteStride: data.byteStride,
      format: getGPUVectorElementFormat(data.format) as VertexFormat
    }
  ];
}

/** Returns producer-supplied fields or synthesizes batch fields from typed data chunks. */
function getGPUDataCollectionFields<T extends GPUTypeMap>(
  gpuData: GPURecordBatchFromDataProps<T>['gpuData'],
  explicitFields: GPUField[] | undefined,
  bufferLayout: BufferLayout[]
): GPUField[] {
  if (explicitFields) {
    for (const field of explicitFields) {
      if (!gpuData[field.name]) {
        throw new Error(`GPURecordBatch schema references missing GPUData "${field.name}"`);
      }
    }
    return explicitFields;
  }

  const layoutNames = new Set(bufferLayout.map(layout => layout.name));
  return Object.entries(gpuData).map(([name, data]) => {
    if (!data.format) {
      if (layoutNames.has(name)) {
        return {
          name,
          nullable: false,
          metadata: new Map()
        };
      }
      throw new Error(
        `GPURecordBatch cannot synthesize a schema field for GPUData "${name}" without a format`
      );
    }
    return {
      name,
      format: data.format,
      nullable: false,
      metadata: new Map()
    };
  });
}
