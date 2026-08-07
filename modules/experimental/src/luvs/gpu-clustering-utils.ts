// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuVS.

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource,
  type GPUBoundedDispatchLayout
} from '../gpu-primitives/gpu-dispatch-utils';
import {
  getViewBinding,
  getViewBindingRange,
  validatePackedUint32View,
  validatePackedView
} from '../gpu-primitives/graph-data-view-utils';
import {
  GraphVectorView,
  type GPUCommandGraph,
  type GraphBufferUse,
  type GraphDataView
} from '../gpu-primitives/gpu-command-graph';
import type {GraphEmbeddingMatrix, GraphEmbeddingMatrixChunk} from './types';

/** Portable workgroup size shared by clustering and IVF-flat construction. @internal */
export const GPU_CLUSTERING_WORKGROUP_SIZE = 64;

const MAXIMUM_UINT32 = 0xffffffff;

/** One ordered, binding-size-safe slice of an original embedding chunk. @internal */
export type GPUClusteringMatrixTile = {
  chunk: GraphEmbeddingMatrixChunk;
  chunkIndex: number;
  chunkRowOffset: number;
  logicalRowOffset: number;
  sourceRowOffset: number;
  rowCount: number;
  values: GraphDataView<'float32'>;
  sourceRowIds?: GraphDataView<'uint32'>;
  validity?: GraphDataView<'uint32'>;
};

/** Packed row-oriented storage that may preserve source chunk boundaries. @internal */
export type GPUClusteringRowViews = GraphDataView<'uint32'> | GraphVectorView<'uint32'>;

/** Adds reusable GPU work without resolving imported buffers until graph encoding. @internal */
export function addGPUClusteringComputationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    resources: GraphBufferUse[];
    bindings: Record<string, GraphDataView>;
    elementCount: number;
    maxComputeWorkgroupsPerDimension?: number;
  }
): void {
  const dispatchLayout = getBoundedDispatchLayout(
    props.id,
    props.elementCount,
    GPU_CLUSTERING_WORKGROUP_SIZE,
    props.maxComputeWorkgroupsPerDimension ?? graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  graph.addComputePass({
    id: props.id,
    resources: props.resources,
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source: props.source,
        shaderLayout: {
          bindings: Object.keys(props.bindings).map((name, location) => ({
            name,
            type: 'storage' as const,
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {};
          for (const [name, view] of Object.entries(props.bindings)) {
            bindings[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(bindings);
          computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

/** Computes the bounded layout matching a generated clustering shader. @internal */
export function getGPUClusteringDispatchLayout(
  operationName: string,
  elementCount: number,
  maxComputeWorkgroupsPerDimension: number
): GPUBoundedDispatchLayout {
  return getBoundedDispatchLayout(
    operationName,
    elementCount,
    GPU_CLUSTERING_WORKGROUP_SIZE,
    maxComputeWorkgroupsPerDimension
  );
}

/** Flattens a bounded three-dimensional dispatch without uint32 wraparound. @internal */
export function getGPUClusteringInvocationIndexSource(layout: GPUBoundedDispatchLayout): string {
  return getBoundedInvocationIndexSource(layout, GPU_CLUSTERING_WORKGROUP_SIZE);
}

/** Validates direct graph matrix descriptors before any clustering allocations or tile loops. */
export function validateGPUClusteringEmbeddingMatrix(
  matrix: GraphEmbeddingMatrix,
  name: string
): void {
  if (
    !Number.isSafeInteger(matrix.dimensions) ||
    matrix.dimensions < 1 ||
    matrix.dimensions > MAXIMUM_UINT32
  ) {
    throw new Error(`${name} dimensions must be a positive uint32 integer`);
  }
  if (
    !Number.isSafeInteger(matrix.rowCount) ||
    matrix.rowCount < 0 ||
    matrix.rowCount > MAXIMUM_UINT32
  ) {
    throw new Error(`${name} row count must be a non-negative uint32 integer`);
  }
  if (!Array.isArray(matrix.chunks)) {
    throw new Error(`${name} chunks must preserve an ordered array of embedding allocations`);
  }

  let totalRowCount = 0;
  for (const [chunkIndex, chunk] of matrix.chunks.entries()) {
    const chunkName = `${name} chunk ${chunkIndex}`;
    validatePackedView(chunk.values, ['float32'], `${chunkName} flat values`);
    if (!Number.isSafeInteger(chunk.rowCount) || chunk.rowCount < 0) {
      throw new Error(`${chunkName} row count must be a non-negative safe integer`);
    }
    if (!Number.isSafeInteger(chunk.rowStride) || chunk.rowStride < matrix.dimensions) {
      throw new Error(`${chunkName} row stride must contain every embedding dimension`);
    }
    if (
      !Number.isSafeInteger(chunk.byteOffset) ||
      chunk.byteOffset < 0 ||
      chunk.byteOffset % Float32Array.BYTES_PER_ELEMENT !== 0 ||
      chunk.byteOffset !== chunk.values.byteOffset
    ) {
      throw new Error(`${chunkName} byte offset must match its aligned flat float32 view`);
    }
    if (
      !Number.isSafeInteger(chunk.sourceRowOffset) ||
      chunk.sourceRowOffset < 0 ||
      chunk.sourceRowOffset + chunk.rowCount > MAXIMUM_UINT32
    ) {
      throw new Error(`${chunkName} source rows must fit below the reserved invalid uint32 ID`);
    }
    const requiredValueCount =
      chunk.rowCount === 0 ? 0 : (chunk.rowCount - 1) * chunk.rowStride + matrix.dimensions;
    if (
      !Number.isSafeInteger(requiredValueCount) ||
      requiredValueCount > chunk.values.length ||
      chunk.byteOffset + requiredValueCount * Float32Array.BYTES_PER_ELEMENT >
        chunk.values.buffer.byteLength
    ) {
      throw new Error(`${chunkName} rows exceed their declared packed flat float32 view`);
    }
    for (const [metadataName, metadata] of [
      ['source-row IDs', chunk.sourceRowIds],
      ['validity flags', chunk.validity]
    ] as const) {
      if (!metadata) continue;
      validatePackedUint32View(metadata, `${chunkName} ${metadataName}`);
      if (metadata.length < chunk.rowCount) {
        throw new Error(`${chunkName} ${metadataName} must contain one value per source row`);
      }
    }
    totalRowCount += chunk.rowCount;
    if (!Number.isSafeInteger(totalRowCount) || totalRowCount > MAXIMUM_UINT32) {
      throw new Error(`${name} total chunk row count must fit in uint32`);
    }
  }
  if (totalRowCount !== matrix.rowCount) {
    throw new Error(`${name} row count must match the sum of its source chunk rows`);
  }
}

/** Validates row labels or selections without requiring their source values to be packed rows. */
export function validateGPUClusteringRowViews(
  matrix: GraphEmbeddingMatrix,
  input: GPUClusteringRowViews,
  name: string
): void {
  const chunks = input instanceof GraphVectorView ? input.data : [input];
  for (const chunk of chunks) {
    validatePackedUint32View(chunk, name);
  }
  if (input instanceof GraphVectorView) {
    if (
      input.data.length !== matrix.chunks.length ||
      input.data.some((chunk, chunkIndex) => chunk.length !== matrix.chunks[chunkIndex].rowCount)
    ) {
      throw new Error(`${name} must preserve the embedding matrix chunk topology`);
    }
  } else if (input.length !== matrix.rowCount) {
    throw new Error(`${name} must contain one value per embedding row`);
  }
}

/** Returns a borrowed packed row slice without creating another logical graph buffer. */
export function createGPUClusteringRowSubview<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  view: GraphDataView<'uint32'>,
  rowOffset: number,
  rowCount: number
): GraphDataView<'uint32'> {
  return graph.createDataView(view.buffer, {
    format: 'uint32',
    length: rowCount,
    byteOffset: view.byteOffset + rowOffset * Uint32Array.BYTES_PER_ELEMENT
  });
}

/** Resolves one tile of either chunk-preserving labels or a single packed global row buffer. */
export function getGPUClusteringTileRowView<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  input: GPUClusteringRowViews,
  tile: GPUClusteringMatrixTile
): GraphDataView<'uint32'> {
  const chunk = input instanceof GraphVectorView ? input.data[tile.chunkIndex] : input;
  const rowOffset = input instanceof GraphVectorView ? tile.chunkRowOffset : tile.logicalRowOffset;
  return createGPUClusteringRowSubview(graph, chunk, rowOffset, tile.rowCount);
}

/** Shards existing chunks into aligned storage bindings without copying or repacking their rows. */
export function getGPUClusteringMatrixTiles<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  matrix: GraphEmbeddingMatrix,
  maximumRowsPerTile = Number.MAX_SAFE_INTEGER
): GPUClusteringMatrixTile[] {
  validateGPUClusteringEmbeddingMatrix(matrix, 'GPU embedding matrix');
  if (!Number.isSafeInteger(maximumRowsPerTile) || maximumRowsPerTile < 1) {
    throw new Error('GPU embedding tile row count must be a positive integer');
  }
  const maximumBindingSize = graph.device.limits.maxStorageBufferBindingSize;
  const dimensionByteLength = matrix.dimensions * Float32Array.BYTES_PER_ELEMENT;
  const tiles: GPUClusteringMatrixTile[] = [];
  let logicalRowOffset = 0;

  for (const [chunkIndex, chunk] of matrix.chunks.entries()) {
    let chunkRowOffset = 0;
    while (chunkRowOffset < chunk.rowCount) {
      const byteOffset =
        chunk.values.byteOffset + chunkRowOffset * chunk.rowStride * Float32Array.BYTES_PER_ELEMENT;
      const alignmentPrefix = byteOffset % 256;
      const availableByteLength = maximumBindingSize - alignmentPrefix;
      if (availableByteLength < dimensionByteLength) {
        throw new Error('GPU embedding row exceeds maxStorageBufferBindingSize');
      }
      const maximumBindingRows =
        Math.floor(
          (availableByteLength - dimensionByteLength) /
            (chunk.rowStride * Float32Array.BYTES_PER_ELEMENT)
        ) + 1;
      const rowCount = Math.min(
        chunk.rowCount - chunkRowOffset,
        maximumRowsPerTile,
        maximumBindingRows
      );
      const values = graph.createDataView<'float32'>(chunk.values.buffer, {
        format: 'float32',
        length: (rowCount - 1) * chunk.rowStride + matrix.dimensions,
        byteOffset
      });
      if (getViewBindingRange(values).size > maximumBindingSize) {
        throw new Error('GPU embedding tile exceeds maxStorageBufferBindingSize');
      }
      tiles.push({
        chunk,
        chunkIndex,
        chunkRowOffset,
        logicalRowOffset: logicalRowOffset + chunkRowOffset,
        sourceRowOffset: chunk.sourceRowOffset + chunkRowOffset,
        rowCount,
        values,
        ...(chunk.sourceRowIds
          ? {
              sourceRowIds: createGPUClusteringRowSubview(
                graph,
                chunk.sourceRowIds,
                chunkRowOffset,
                rowCount
              )
            }
          : {}),
        ...(chunk.validity
          ? {
              validity: createGPUClusteringRowSubview(
                graph,
                chunk.validity,
                chunkRowOffset,
                rowCount
              )
            }
          : {})
      });
      chunkRowOffset += rowCount;
    }
    logicalRowOffset += chunk.rowCount;
  }
  return tiles;
}
