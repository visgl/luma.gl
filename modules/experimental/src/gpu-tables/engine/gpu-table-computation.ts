// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, type Binding, type ComputePass, Device} from '@luma.gl/core';
import {Computation, type ComputationProps} from '@luma.gl/engine';
import {DynamicBuffer} from '@luma.gl/engine';
import {
  isFixedSizeListGPUVectorFormat,
  type GPUData,
  type GPUVector
} from '@luma.gl/gpgpu/gpu-data';

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
      ...getDirectVectorBindings(device, inputVectors),
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

  /**
   * Dispatches once per vector batch, rebinding storage ranges before each dispatch.
   *
   * Batches that bind an empty input chunk are skipped, because WebGPU rejects zero-size
   * storage bindings. Their output chunks are left in place, so batch boundaries are preserved.
   */
  dispatchBatches(
    computePass: ComputePass,
    getWorkgroupCount: number | ((batch: GPUTableComputationBatch) => number),
    y?: number,
    z?: number
  ): void {
    for (let batchIndex = 0; batchIndex < this.batchState.batchCount; batchIndex++) {
      if (this.batchState.emptyBatches[batchIndex]) {
        continue;
      }
      const batch = {
        batchIndex,
        numRows: this.batchState.batchRowCounts[batchIndex]
      } satisfies GPUTableComputationBatch;
      this.setBindings({
        ...this.baseBindings,
        ...getBatchVectorBindings(this.device, this.inputVectors, batchIndex)
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
  /** Whether each batch binds at least one zero-row input chunk. */
  emptyBatches: boolean[];
};

function getGPUTableComputationBatchState(
  inputVectors: Record<string, GPUVector>
): GPUTableComputationBatchState {
  const batchedVectorEntries = Object.entries(inputVectors).filter(([, vector]) =>
    requiresBatchBinding(vector)
  );
  const hasEmptyDirectVector = Object.values(inputVectors).some(
    vector => !requiresBatchBinding(vector) && vector.length === 0
  );
  if (batchedVectorEntries.length === 0) {
    const firstVector = Object.values(inputVectors)[0];
    return {
      batchCount: 1,
      batchRowCounts: [firstVector?.length ?? 0],
      emptyBatches: [hasEmptyDirectVector]
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

  return {
    batchCount,
    batchRowCounts,
    emptyBatches: batchRowCounts.map(rowCount => hasEmptyDirectVector || rowCount === 0)
  };
}

function requiresBatchBinding(vector: GPUVector): boolean {
  return vector.data.length !== 1;
}

function getDirectVectorBindings(
  device: Device,
  inputVectors: Record<string, GPUVector>
): Record<string, Binding> {
  const bindings: Record<string, Binding> = {};
  for (const [name, vector] of Object.entries(inputVectors)) {
    if (!requiresBatchBinding(vector)) {
      bindings[name] = getGPUDataBinding(device, getSingleGPUVectorData(vector));
    }
  }
  return bindings;
}

function getBatchVectorBindings(
  device: Device,
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
    bindings[name] = getGPUDataBinding(device, data);
  }
  return bindings;
}

function getGPUDataBinding(device: Device, data: GPUData): Binding {
  // WebGPU storage bindings must start at a multiple of minStorageBufferOffsetAlignment.
  // Views that start inside a shared buffer need a binding that starts at an aligned offset.
  assert(data.byteOffset % getStorageOffsetAlignment(device) === 0);
  const fixedSizeListByteLength =
    data.format && isFixedSizeListGPUVectorFormat(data.format)
      ? data.length === 0
        ? 0
        : (data.length - 1) * data.byteStride + data.rowByteLength
      : undefined;
  return {
    buffer: getGPUDataBuffer(data),
    offset: data.byteOffset,
    size:
      fixedSizeListByteLength === undefined
        ? (data.valueByteLength ?? data.length * data.byteStride)
        : Math.max(data.valueByteLength ?? 0, fixedSizeListByteLength)
  };
}

function getStorageOffsetAlignment(device: Device): number {
  return Math.max(device.limits.minStorageBufferOffsetAlignment || 1, 1);
}

function getGPUDataBuffer(data: GPUData) {
  return data.buffer instanceof DynamicBuffer ? data.buffer.buffer : data.buffer;
}

function getSingleGPUVectorData(vector: GPUVector): GPUData {
  const [data, ...remainingData] = vector.data;
  if (!data || remainingData.length > 0) {
    throw new Error(
      `GPUTableComputation vector "${vector.name}" requires exactly one GPUData chunk`
    );
  }
  return data;
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
