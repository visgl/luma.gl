// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GPURecordBatchSourceInfo} from '../../table/gpu-record-batch';
import type {GPUConstant} from '../../table/gpu-constant';
import type {GPUVector} from '../../table/gpu-vector';
import type {VertexList} from '../../table/gpu-vector-format';
import {type GPUInputSchema, validateGPUInputVectors} from '../../engine/gpu-input-schema';

/** Prepared generated GPU inputs consumed by filled polygon models. */
export const POLYGON_GPU_INPUT_SCHEMA = [
  {
    columnName: 'positions',
    attributeName: 'positions',
    storageBindingName: 'polygonPositions',
    kind: 'positions',
    required: true,
    formats: ['vertex-list<float32x4>'],
    internal: true
  },
  {
    columnName: 'colors',
    attributeName: 'colors',
    storageBindingName: 'polygonColors',
    kind: 'colors',
    required: false,
    formats: ['unorm8x4', 'vertex-list<unorm8x4>'],
    internal: true
  },
  {
    columnName: 'rowIndices',
    attributeName: 'rowIndices',
    storageBindingName: 'polygonRowIndices',
    kind: 'scalars',
    required: true,
    formats: ['vertex-list<uint32>'],
    internal: true
  },
  {
    columnName: 'indices',
    kind: 'scalars',
    required: true,
    formats: ['vertex-list<uint32>'],
    internal: true
  }
] as const satisfies GPUInputSchema;

/** Prepared GPU vector formats consumed by filled polygon models. */
export type PolygonGPUTypeMap = {
  positions: VertexList<'float32x4'>;
  colors: VertexList<'unorm8x4'>;
  rowIndices: VertexList<'uint32'>;
  indices: VertexList<'uint32'>;
};

/** Prepared GPU vectors consumed by one filled polygon model batch. */
export type PolygonGPUVectors = {
  positions: GPUVector<PolygonGPUTypeMap['positions']>;
  colors: GPUVector<PolygonGPUTypeMap['colors']> | GPUConstant<'unorm8x4'>;
  rowIndices: GPUVector<PolygonGPUTypeMap['rowIndices']>;
  indices: GPUVector<PolygonGPUTypeMap['indices']>;
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
  validateGPUInputVectors(modelName, POLYGON_GPU_INPUT_SCHEMA, vectors);
  assertPolygonVectorRowAlignment(modelName, vectors);
  assertPolygonVertexValueAlignment(modelName, vectors);
}

function assertPolygonVectorRowAlignment(modelName: string, vectors: PolygonGPUVectors): void {
  const varyingVectors = Object.entries(vectors).filter(([, column]) => 'data' in column) as Array<
    [string, GPUVector]
  >;
  const [referenceName, referenceVector] = varyingVectors[0];
  for (const [name, vector] of varyingVectors.slice(1)) {
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
    ('valueLength' in vectors.colors && vectors.colors.valueLength !== vertexCount) ||
    vectors.rowIndices.valueLength !== vertexCount
  ) {
    throw new Error(`${modelName} positions, colors, and rowIndices require matching valueLength`);
  }
}
