// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding, type ComputePass, Device} from '@luma.gl/core';
import {Computation, type ComputationProps} from '@luma.gl/engine';
import {DynamicBuffer} from '@luma.gl/engine';
import type {GPUData} from './gpu-data';
import type {GPUVector} from './gpu-vector';

/** Metadata supplied to one GPU table computation batch dispatch. */
export type GPUTableComputationBatch = {
  /** Zero-based batch index. */
  batchIndex: number;
  /** Shared logical row count for the current batched vector slice. */
  numRows: number;
};

/** Props for creating a WebGPU computation backed by GPU table vectors. */
export type GPUTableComputationProps = Omit<ComputationProps, 'bindings'> & {
  /** Ordinary non-table bindings forwarded to {@link Computation}. */
  bindings?: Record<string, Binding>;
  /** GPU vectors converted to storage-buffer bindings by name. */
  inputVectors?: Record<string, GPUVector>;
};

/**
 * A WebGPU computation that accepts {@link GPUVector} storage bindings.
 *
 * Direct vectors bind once during construction. Aggregate multi-buffer vectors
 * can be dispatched batch-by-batch with {@link dispatchBatches}.
 */
export class GPUTableComputation extends Computation {
  /** GPU vectors supplied when the computation was created. */
  readonly inputVectors: Record<string, GPUVector>;
  private readonly baseBindings: Record<string, Binding>;
  private readonly batchState: GPUTableComputationBatchState;

  constructor(device: Device, props: GPUTableComputationProps) {
    const {inputVectors = {}, bindings = {}, ...computationProps} = props;
    assertNoDuplicateBindingNames(inputVectors, bindings);

    const batchState = getGPUTableComputationBatchState(inputVectors);
    const baseBindings = {
      ...getDirectVectorBindings(inputVectors),
      ...bindings
    };

    super(device, {
      ...computationProps,
      bindings: baseBindings
    });

    this.inputVectors = {...inputVectors};
    this.baseBindings = baseBindings;
    this.batchState = batchState;
  }

  /** Dispatches once per vector batch, rebinding storage ranges before each dispatch. */
  dispatchBatches(
    computePass: ComputePass,
    getWorkgroupCount: number | ((batch: GPUTableComputationBatch) => number),
    y?: number,
    z?: number
  ): void {
    for (let batchIndex = 0; batchIndex < this.batchState.batchCount; batchIndex++) {
      const batch = {
        batchIndex,
        numRows: this.batchState.batchRowCounts[batchIndex]
      } satisfies GPUTableComputationBatch;
      this.setBindings({
        ...this.baseBindings,
        ...getBatchVectorBindings(this.inputVectors, batchIndex)
      });

      const workgroupCount =
        typeof getWorkgroupCount === 'function' ? getWorkgroupCount(batch) : getWorkgroupCount;
      super.dispatch(computePass, workgroupCount, y, z);
    }

    this.setBindings(this.baseBindings);
  }
}

type GPUTableComputationBatchState = {
  batchCount: number;
  batchRowCounts: number[];
};

function getGPUTableComputationBatchState(
  inputVectors: Record<string, GPUVector>
): GPUTableComputationBatchState {
  const batchedVectorEntries = Object.entries(inputVectors).filter(([, vector]) =>
    requiresBatchBinding(vector)
  );
  if (batchedVectorEntries.length === 0) {
    const firstVector = Object.values(inputVectors)[0];
    return {
      batchCount: 1,
      batchRowCounts: [firstVector?.length ?? 0]
    };
  }

  const [referenceName, referenceVector] = batchedVectorEntries[0];
  const batchCount = referenceVector.data.length;
  const batchRowCounts = referenceVector.data.map(data => data.length);

  for (const [name, vector] of batchedVectorEntries.slice(1)) {
    if (vector.data.length !== batchCount) {
      throw new Error(
        `GPUTableComputation vector "${name}" batch count does not match "${referenceName}"`
      );
    }
    vector.data.forEach((data, batchIndex) => {
      if (data.length !== batchRowCounts[batchIndex]) {
        throw new Error(
          `GPUTableComputation vector "${name}" batch ${batchIndex} rows do not match "${referenceName}"`
        );
      }
    });
  }

  return {batchCount, batchRowCounts};
}

function requiresBatchBinding(vector: GPUVector): boolean {
  try {
    vector.buffer;
    return false;
  } catch {
    return true;
  }
}

function getDirectVectorBindings(inputVectors: Record<string, GPUVector>): Record<string, Binding> {
  const bindings: Record<string, Binding> = {};
  for (const [name, vector] of Object.entries(inputVectors)) {
    if (!requiresBatchBinding(vector)) {
      bindings[name] = getDirectVectorBinding(vector);
    }
  }
  return bindings;
}

function getDirectVectorBinding(vector: GPUVector): Binding {
  const buffer = vector.buffer;
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
}

function getBatchVectorBindings(
  inputVectors: Record<string, GPUVector>,
  batchIndex: number
): Record<string, Binding> {
  const bindings: Record<string, Binding> = {};
  for (const [name, vector] of Object.entries(inputVectors)) {
    if (!requiresBatchBinding(vector)) {
      continue;
    }
    const data = vector.data[batchIndex];
    if (!data) {
      throw new Error(`GPUTableComputation vector "${name}" is missing batch ${batchIndex}`);
    }
    bindings[name] = getGPUDataBinding(data);
  }
  return bindings;
}

function getGPUDataBinding(data: GPUData): Binding {
  return {
    buffer: data.buffer.buffer,
    offset: data.byteOffset,
    size: data.length * data.byteStride
  };
}

function assertNoDuplicateBindingNames(
  inputVectors: Record<string, GPUVector>,
  bindings: Record<string, Binding>
): void {
  for (const name of Object.keys(inputVectors)) {
    if (name in bindings) {
      throw new Error(`GPUTableComputation binding "${name}" duplicates an explicit binding`);
    }
  }
}
