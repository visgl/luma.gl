// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuGraph.

import type {GPURecordBatch, GPUTable, GPUVector} from '@luma.gl/tables';

const MAXIMUM_VERTEX_COUNT = 0xfffffffe;
const MAXIMUM_EDGE_COUNT = 0xffffffff;
const SCALAR_BYTE_LENGTH = 4;
const EMPTY_EDGE_BATCHES: readonly GPURecordBatch[] = Object.freeze([]);

/** Existing, caller-owned GPU columns and optional graph property tables. */
export type GPUGraphProps = {
  /** Explicit vertex count, including vertices absent from every edge. */
  vertexCount: number;
  /** Stable source vertex identifiers, preserved in their existing chunks. */
  sourceVertices: GPUVector<'uint32'>;
  /** Stable target vertex identifiers with the same source-batch topology. */
  targetVertices: GPUVector<'uint32'>;
  /** Optional source-aligned, single-precision edge weights. */
  edgeWeights?: GPUVector<'float32'>;
  /** Optional source-aligned stable edge identifiers. */
  edgeIds?: GPUVector<'uint32'>;
  /** Optional caller-owned vertex properties with one row per vertex. */
  nodeAttributes?: GPUTable;
  /** Optional caller-owned edge properties preserving original record batches. */
  edgeAttributes?: GPUTable;
  /** Whether source-to-target edges are directed. Defaults to true. */
  directed?: boolean;
};

/**
 * Lightweight graph metadata over existing GPU-resident columns.
 *
 * Construction preserves vector, chunk, record-batch, and source-identity references. It never
 * allocates or destroys buffers, repacks source data, submits commands, or reads GPU memory.
 */
export class GPUGraph {
  /** Explicit vertex count, including isolated vertices. */
  readonly vertexCount: number;
  /** Existing source vertex identifiers in source-batch order. */
  readonly sourceVertices: GPUVector<'uint32'>;
  /** Existing target vertex identifiers in source-batch order. */
  readonly targetVertices: GPUVector<'uint32'>;
  /** Optional existing single-precision edge weights. */
  readonly edgeWeights?: GPUVector<'float32'>;
  /** Optional existing stable edge identifiers. */
  readonly edgeIds?: GPUVector<'uint32'>;
  /** Optional existing vertex property table. */
  readonly nodeAttributes?: GPUTable;
  /** Optional existing edge property table. */
  readonly edgeAttributes?: GPUTable;
  /** Whether source-to-target edges are directed. */
  readonly directed: boolean;

  /** Describes caller-owned graph sources without allocating or submitting GPU work. */
  constructor({
    vertexCount,
    sourceVertices,
    targetVertices,
    edgeWeights,
    edgeIds,
    nodeAttributes,
    edgeAttributes,
    directed = true
  }: GPUGraphProps) {
    if (
      !Number.isSafeInteger(vertexCount) ||
      vertexCount < 0 ||
      vertexCount > MAXIMUM_VERTEX_COUNT
    ) {
      throw new Error('GPUGraph vertexCount must leave room for uint32 adjacency offsets');
    }

    validateGraphVector(sourceVertices, 'uint32', 'sourceVertices');
    validateGraphVector(targetVertices, 'uint32', 'targetVertices');
    validateMatchingGraphVector(sourceVertices, targetVertices, 'targetVertices');

    if (sourceVertices.length > MAXIMUM_EDGE_COUNT) {
      throw new Error('GPUGraph edgeCount must fit in uint32');
    }
    if (edgeWeights) {
      validateGraphVector(edgeWeights, 'float32', 'edgeWeights');
      validateMatchingGraphVector(sourceVertices, edgeWeights, 'edgeWeights');
    }
    if (edgeIds) {
      validateGraphVector(edgeIds, 'uint32', 'edgeIds');
      validateMatchingGraphVector(sourceVertices, edgeIds, 'edgeIds');
    }
    if (nodeAttributes && nodeAttributes.numRows !== vertexCount) {
      throw new Error('GPUGraph nodeAttributes must contain one row per vertex');
    }
    if (edgeAttributes) {
      validateEdgeAttributes(edgeAttributes, sourceVertices, targetVertices, edgeWeights, edgeIds);
    }

    this.vertexCount = vertexCount;
    this.sourceVertices = sourceVertices;
    this.targetVertices = targetVertices;
    this.edgeWeights = edgeWeights;
    this.edgeIds = edgeIds;
    this.nodeAttributes = nodeAttributes;
    this.edgeAttributes = edgeAttributes;
    this.directed = directed;
  }

  /** Number of original, unsymmetrized source edges. */
  get edgeCount(): number {
    return this.sourceVertices.length;
  }

  /** Original edge record batches, including empty batches and source-identity metadata. */
  get sourceEdgeBatches(): readonly GPURecordBatch[] {
    return this.edgeAttributes?.batches ?? EMPTY_EDGE_BATCHES;
  }
}

/** Requires one fixed-width scalar vector and preserves its existing packed data chunks. */
function validateGraphVector<Format extends 'uint32' | 'float32'>(
  vector: GPUVector<Format>,
  format: Format,
  name: string
): void {
  if (
    vector.format !== format ||
    vector.stride !== 1 ||
    vector.byteStride !== SCALAR_BYTE_LENGTH ||
    vector.rowByteLength !== SCALAR_BYTE_LENGTH ||
    vector.valueLength !== vector.length ||
    vector.bufferLayout
  ) {
    throw new Error(`GPUGraph ${name} must contain packed ${format} rows`);
  }
  for (const chunk of vector.data) {
    if (
      chunk.format !== format ||
      chunk.stride !== 1 ||
      chunk.byteStride !== SCALAR_BYTE_LENGTH ||
      chunk.rowByteLength !== SCALAR_BYTE_LENGTH ||
      chunk.byteOffset % SCALAR_BYTE_LENGTH !== 0 ||
      chunk.valueLength !== chunk.length
    ) {
      throw new Error(`GPUGraph ${name} must contain packed ${format} chunks`);
    }
  }
}

/** Preserves ordered source batch boundaries, including intentionally empty chunks. */
function validateMatchingGraphVector(
  source: GPUVector<'uint32'>,
  vector: GPUVector<'uint32'> | GPUVector<'float32'>,
  name: string
): void {
  if (
    vector.length !== source.length ||
    vector.data.length !== source.data.length ||
    vector.data.some((chunk, chunkIndex) => chunk.length !== source.data[chunkIndex].length)
  ) {
    throw new Error(`GPUGraph ${name} must preserve source edge chunk topology`);
  }
}

/** Validates optional source-edge properties without requiring a particular property schema. */
function validateEdgeAttributes(
  edgeAttributes: GPUTable,
  sourceVertices: GPUVector<'uint32'>,
  targetVertices: GPUVector<'uint32'>,
  edgeWeights?: GPUVector<'float32'>,
  edgeIds?: GPUVector<'uint32'>
): void {
  if (edgeAttributes.numRows !== sourceVertices.length) {
    throw new Error('GPUGraph edgeAttributes must contain one row per edge');
  }
  if (
    edgeAttributes.batches.length !== sourceVertices.data.length ||
    edgeAttributes.batches.some(
      (batch, batchIndex) => batch.numRows !== sourceVertices.data[batchIndex].length
    )
  ) {
    throw new Error('GPUGraph edgeAttributes must preserve source edge batch topology');
  }

  const graphColumns = {
    sourceVertices,
    targetVertices,
    ...(edgeWeights ? {edgeWeights} : {}),
    ...(edgeIds ? {edgeIds} : {})
  };
  for (const [name, vector] of Object.entries(graphColumns)) {
    for (const columnName of new Set([name, vector.name])) {
      const attributeVector = edgeAttributes.gpuVectors[columnName];
      if (
        attributeVector &&
        (attributeVector.data.length !== vector.data.length ||
          attributeVector.data.some((chunk, chunkIndex) => chunk !== vector.data[chunkIndex]))
      ) {
        throw new Error(`GPUGraph edgeAttributes ${columnName} must preserve source edge data`);
      }
    }
  }
}
