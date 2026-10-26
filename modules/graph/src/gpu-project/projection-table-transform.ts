// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import type {Device} from '@luma.gl/core';
import type {GPURecordBatchSourceInfo} from '../gpu-tables';
import type {PreparedCRSProjectionResult} from './projection-engine';
import {GPUProjectionTable, type GPUProjectionTableProps} from './gpu-projection-table';
import type {ProjectionBounds} from './types';

/** One dense source batch. Array views retain their own offsets; no concatenation is performed. */
export type ProjectionTableBatch = {
  positions: Float64Array;
  inputValidity?: Uint32Array;
  sourceInfo?: GPURecordBatchSourceInfo;
  metadata?: ReadonlyMap<string, string>;
};

export type ProjectedTableBatch = {
  positions: Float64Array;
  validity: Uint32Array;
  numRows: number;
  encoding: 'float64-absolute';
  sourceInfo?: GPURecordBatchSourceInfo;
  metadata: Map<string, string>;
};

/** Provider failure is fatal for the current batch, not equivalent to an invalid GPU row. */
export class ProjectionTableError extends Error {
  constructor(
    readonly rowIndex: number,
    readonly sourceInfo: GPURecordBatchSourceInfo | undefined,
    cause: unknown
  ) {
    super(`CPU table projection failed at batch row ${rowIndex}`, {cause});
    this.name = 'ProjectionTableError';
  }
}

/**
 * Explicit CPU/GPU selection over one retained transform and bounded source domain.
 * CPU output is absolute binary64; GPU encoding/origin is described by prepared.compiled.
 * The prepared engine and program must remain unchanged for this consumer's lifetime.
 */
export class ProjectionTableTransform {
  private readonly bounds: ProjectionBounds;

  constructor(readonly prepared: Extract<PreparedCRSProjectionResult, {status: 'ready'}>) {
    const operation = prepared.program.operations[0];
    if (
      prepared.compiled.inputFormat !== 'uint32x4' ||
      prepared.program.operations.length !== 1 ||
      operation?.type !== 'adaptive'
    ) {
      throw new Error(
        'projection table transforms require a binary64-input prepared adaptive transform'
      );
    }
    this.bounds = operation.plan.bounds;
  }

  /**
   * Batch-atomic reusable-output scalar execution. Unlike bulk prefix-commit APIs, partial
   * results are never returned. Upstream/nonfinite/out-of-domain rows produce zero + validity 0.
   * Provider exceptions/nonfinite results inside the fitted domain abort the batch.
   */
  projectBatch(batch: ProjectionTableBatch): ProjectedTableBatch {
    const numRows = batch.positions.length / 2;
    if (
      !Number.isInteger(numRows) ||
      (batch.inputValidity && batch.inputValidity.length !== numRows)
    ) {
      throw new Error('projection table batches require coordinate pairs and matching validity');
    }
    const positions = new Float64Array(batch.positions.length);
    const validity = new Uint32Array(numRows);
    const coordinate: [number, number] = [0, 0];
    const projected = new Float64Array(2);
    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
      if (batch.inputValidity && !batch.inputValidity[rowIndex]) continue;
      coordinate[0] = batch.positions[rowIndex * 2];
      coordinate[1] = batch.positions[rowIndex * 2 + 1];
      // Prepared adaptive plans tile the entire finite source rectangle. CPU execution needs
      // only this domain check, not the GPU's per-patch polynomial routing.
      if (
        !Number.isFinite(coordinate[0]) ||
        !Number.isFinite(coordinate[1]) ||
        coordinate[0] < this.bounds[0] ||
        coordinate[1] < this.bounds[1] ||
        coordinate[0] > this.bounds[2] ||
        coordinate[1] > this.bounds[3]
      )
        continue;
      try {
        projected.fill(NaN);
        this.prepared.projection.projectToSync(coordinate, projected);
        if (!Number.isFinite(projected[0]) || !Number.isFinite(projected[1])) {
          throw new Error('prepared CPU projection returned nonfinite coordinates');
        }
      } catch (cause) {
        throw new ProjectionTableError(
          rowIndex,
          batch.sourceInfo ? {...batch.sourceInfo} : undefined,
          cause
        );
      }
      positions[rowIndex * 2] = projected[0];
      positions[rowIndex * 2 + 1] = projected[1];
      validity[rowIndex] = 1;
    }
    return {
      positions,
      validity,
      numRows,
      encoding: 'float64-absolute',
      sourceInfo: batch.sourceInfo ? {...batch.sourceInfo} : undefined,
      metadata: new Map(batch.metadata)
    };
  }

  /** Lazy, bounded-memory execution; earlier yielded batches remain committed if a later one fails. */
  *projectBatches(batches: Iterable<ProjectionTableBatch>): IterableIterator<ProjectedTableBatch> {
    for (const batch of batches) yield this.projectBatch(batch);
  }

  /** Allocate only derived GPU output. Registration and submission remain explicit. */
  createGPUProjectionTable(
    device: Device,
    props: Omit<GPUProjectionTableProps, 'projection'>
  ): GPUProjectionTable {
    return new GPUProjectionTable(device, {...props, projection: this.prepared.compiled});
  }
}
