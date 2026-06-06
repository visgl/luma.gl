// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GPURecordBatchSourceInfo} from '../../table/gpu-record-batch';
import type {GPUVector} from '../../table/gpu-vector';
import type {VertexList} from '../../table/gpu-vector-format';
import {
  assertModelGPUVectorInputs,
  type ModelGPUInputSchema
} from '../../engine/gpu-table-model-input-schema';

/** Prepared generated GPU inputs consumed by filled polygon models. */
export const POLYGON_GPU_INPUT_SCHEMA = [
  {
    name: 'positions',
    kind: 'positions',
    required: true,
    formats: ['vertex-list<float32x4>'],
    source: 'generated'
  },
  {
    name: 'colors',
    kind: 'colors',
    required: true,
    formats: ['vertex-list<unorm8x4>'],
    source: 'generated'
  },
  {
    name: 'rowIndices',
    kind: 'scalars',
    required: true,
    formats: ['vertex-list<uint32>'],
    source: 'generated'
  },
  {
    name: 'indices',
    kind: 'scalars',
    required: true,
    formats: ['vertex-list<uint32>'],
    source: 'generated'
  }
] as const satisfies ModelGPUInputSchema;

/** Prepared GPU vector formats consumed by filled polygon models. */
export type PolygonGPUTypeMap = {
  positions: VertexList<'float32x4'>;
  colors: VertexList<'unorm8x4'>;
  rowIndices: VertexList<'uint32'>;
  indices: VertexList<'uint32'>;
};

/** Prepared GPU vectors consumed by one filled polygon model batch. */
export type PolygonGPUVectors = {
  [ColumnName in keyof PolygonGPUTypeMap]: GPUVector<PolygonGPUTypeMap[ColumnName]>;
};

/** One prepared filled polygon batch appended to a model. */
export type PolygonBatchProps = PolygonGPUVectors & {
  /** Optional source-row identity retained for picking and row diagnostics. */
  sourceInfo?: GPURecordBatchSourceInfo;
  /** Number of null source rows represented by this generated batch. */
  nullCount?: number;
};

/** Validates row-preserving generated polygon vectors before a model binds them. */
export function assertPolygonGPUVectorInputs(modelName: string, vectors: PolygonGPUVectors): void {
  assertModelGPUVectorInputs(modelName, POLYGON_GPU_INPUT_SCHEMA, vectors);
  assertPolygonVectorRowAlignment(modelName, vectors);
  assertPolygonVertexValueAlignment(modelName, vectors);
}

function assertPolygonVectorRowAlignment(modelName: string, vectors: PolygonGPUVectors): void {
  const [referenceName, referenceVector] = Object.entries(vectors)[0] as [
    keyof PolygonGPUVectors,
    GPUVector
  ];
  for (const [name, vector] of Object.entries(vectors).slice(1)) {
    if (vector.length !== referenceVector.length) {
      throw new Error(
        `${modelName} ${name} rows must match ${referenceName} rows (${vector.length} !== ${referenceVector.length})`
      );
    }
  }
}

function assertPolygonVertexValueAlignment(modelName: string, vectors: PolygonGPUVectors): void {
  const vertexCount = vectors.positions.valueLength;
  if (
    vectors.colors.valueLength !== vertexCount ||
    vectors.rowIndices.valueLength !== vertexCount
  ) {
    throw new Error(`${modelName} positions, colors, and rowIndices require matching valueLength`);
  }
}
