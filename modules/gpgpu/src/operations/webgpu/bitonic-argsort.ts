// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type ComputePass, type Device} from '@luma.gl/core';
import {Computation, DynamicBuffer} from '@luma.gl/engine';
import {GPUVector, getGPUVectorData} from '@luma.gl/tables';
import {getWebGPUDispatchLayout, getWebGPUDispatchRowIndex} from './common/dispatch';

const BITONIC_WORKGROUP_SIZE = 64;
const INVALID_INDEX = 0xffffffff;
const MAXIMUM_LOGICAL_LENGTH = 0x80000000;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const BITONIC_BUFFER_USAGE = Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC;

type BitonicArgsortStage = {
  blockWidth: number;
  compareStride: number;
};

/**
 * WebGPU-only stable argsort for one packed `GPUVector<'uint32'>`.
 *
 * @remarks
 * `BitonicArgsort` sorts `(key, sourceRowIndex)` tuples in ascending order, so equal keys keep
 * their original row order. The helper is final-result oriented: it returns sorted source row
 * indices and keeps bitonic scratch buffers internal for reuse across calls.
 *
 * The helper is intentionally Arrow-agnostic. Use `@luma.gl/arrow` adapters before calling this
 * class when the source keys start as an Arrow vector.
 */
export class BitonicArgsort {
  /** WebGPU device used for compute dispatch and owned scratch buffers. */
  readonly device: Device;

  private scratchBuffers: [Buffer, Buffer] | null = null;
  private scratchPaddedLength = 0;
  private isDestroyed = false;

  /**
   * Creates one reusable bitonic argsort helper for a WebGPU device.
   *
   * @param device - WebGPU device that owns input, scratch, and output buffers.
   * @throws If `device` is not a WebGPU device.
   */
  constructor(device: Device) {
    if (device.type !== 'webgpu') {
      throw new Error('BitonicArgsort requires a WebGPU device');
    }

    this.device = device;
  }

  /**
   * Returns source row indices ordered by ascending `uint32` key value.
   *
   * @remarks
   * Equal keys keep their source row order. Non-power-of-two row counts are padded internally
   * with invalid sentinels that sort after real rows. The returned vector owns its output buffer;
   * destroying the sorter does not destroy previously returned vectors.
   *
   * @param keys - One contiguous packed `GPUVector<'uint32'>` chunk on this sorter's device.
   * @returns Caller-owned `GPUVector<'uint32'>` containing stable sorted source row indices.
   * @throws If the sorter has been destroyed or `keys` is not one packed, aligned, same-device
   * `uint32` chunk covering every vector row.
   */
  sortGPUVector(keys: GPUVector<'uint32'>): GPUVector<'uint32'> {
    this.assertUsable();
    const input = getPackedUint32Input(keys, this.device);
    const outputBuffer = this.device.createBuffer({
      id: `${keys.name}-sorted-row-indices`,
      byteLength: Math.max(keys.length, 1) * UINT32_BYTE_LENGTH,
      usage: BITONIC_BUFFER_USAGE
    });
    const output = new GPUVector({
      type: 'buffer',
      name: `${keys.name}-sorted-row-indices`,
      buffer: outputBuffer,
      format: 'uint32',
      length: keys.length,
      ownsBuffer: true
    });

    if (keys.length === 0) {
      return output;
    }

    const paddedLength = getNextPowerOfTwo(keys.length);
    const scratchBuffers = this.getScratchBuffers(paddedLength);
    const dispatchLayout = getWebGPUDispatchLayout(
      Math.ceil(paddedLength / BITONIC_WORKGROUP_SIZE),
      this.device.limits.maxComputeWorkgroupsPerDimension
    );
    const computations: Computation[] = [];

    try {
      const initializeComputation = makeInitializeComputation(
        this.device,
        keys.length,
        paddedLength,
        dispatchLayout
      );
      computations.push(initializeComputation);

      const stages = getBitonicArgsortStages(paddedLength);
      for (const stage of stages) {
        computations.push(
          makeSortStageComputation(this.device, {
            dispatchLayout,
            keysByteOffset: input.keysByteOffset,
            logicalLength: keys.length,
            paddedLength,
            stage
          })
        );
      }

      const copyComputation = makeCopyComputation(this.device, keys.length, dispatchLayout);
      computations.push(copyComputation);

      const computePass = this.device.beginComputePass({});
      try {
        dispatchComputation(initializeComputation, computePass, dispatchLayout, {
          indicesOut: scratchBuffers[0]
        });

        let currentIndices = scratchBuffers[0];
        let nextIndices = scratchBuffers[1];
        for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
          const stageComputation = computations[stageIndex + 1];
          dispatchComputation(stageComputation, computePass, dispatchLayout, {
            keys: input.buffer,
            indicesIn: currentIndices,
            indicesOut: nextIndices
          });
          [currentIndices, nextIndices] = [nextIndices, currentIndices];
        }

        dispatchComputation(copyComputation, computePass, dispatchLayout, {
          indicesIn: currentIndices,
          indicesOut: outputBuffer
        });
      } finally {
        computePass.end();
      }
      this.device.submit();
    } catch (error) {
      output.destroy();
      throw error;
    } finally {
      for (const computation of computations) {
        computation.destroy();
      }
    }

    return output;
  }

  /**
   * Releases scratch buffers owned by this sorter.
   *
   * @remarks
   * Calling `destroy()` more than once is a no-op. Output vectors returned by
   * {@link BitonicArgsort.sortGPUVector} remain caller-owned.
   */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.destroyScratchBuffers();
    this.isDestroyed = true;
  }

  private assertUsable(): void {
    if (this.isDestroyed) {
      throw new Error('BitonicArgsort has been destroyed');
    }
  }

  private getScratchBuffers(paddedLength: number): [Buffer, Buffer] {
    if (this.scratchBuffers && this.scratchPaddedLength >= paddedLength) {
      return this.scratchBuffers;
    }

    this.destroyScratchBuffers();
    const byteLength = paddedLength * UINT32_BYTE_LENGTH;
    this.scratchBuffers = [
      this.device.createBuffer({
        id: 'bitonic-argsort-indices-a',
        byteLength,
        usage: BITONIC_BUFFER_USAGE
      }),
      this.device.createBuffer({
        id: 'bitonic-argsort-indices-b',
        byteLength,
        usage: BITONIC_BUFFER_USAGE
      })
    ];
    this.scratchPaddedLength = paddedLength;
    return this.scratchBuffers;
  }

  private destroyScratchBuffers(): void {
    if (!this.scratchBuffers) {
      return;
    }

    for (const buffer of this.scratchBuffers) {
      buffer.destroy();
    }
    this.scratchBuffers = null;
    this.scratchPaddedLength = 0;
  }
}

function getPackedUint32Input(
  keys: GPUVector<'uint32'>,
  device: Device
): {buffer: Buffer; keysByteOffset: number} {
  if (!Number.isSafeInteger(keys.length) || keys.length < 0) {
    throw new Error('BitonicArgsort.sortGPUVector() requires a non-negative safe integer length');
  }
  if (keys.length > MAXIMUM_LOGICAL_LENGTH) {
    throw new Error(
      `BitonicArgsort.sortGPUVector() supports at most ${MAXIMUM_LOGICAL_LENGTH} rows`
    );
  }
  if (keys.format !== 'uint32') {
    throw new Error('BitonicArgsort.sortGPUVector() requires GPUVector<"uint32"> keys');
  }

  const data = getGPUVectorData(keys);
  if (
    data.format !== 'uint32' ||
    data.stride !== 1 ||
    data.byteStride !== UINT32_BYTE_LENGTH ||
    data.rowByteLength !== UINT32_BYTE_LENGTH
  ) {
    throw new Error('BitonicArgsort.sortGPUVector() requires packed uint32 key storage');
  }
  if (data.length !== keys.length) {
    throw new Error('BitonicArgsort.sortGPUVector() key chunk must cover every vector row');
  }
  if (data.byteOffset % UINT32_BYTE_LENGTH !== 0) {
    throw new Error('BitonicArgsort.sortGPUVector() requires uint32-aligned key storage');
  }

  const buffer = getCoreBuffer(data.buffer);
  if (buffer.device !== device) {
    throw new Error('BitonicArgsort.sortGPUVector() keys must belong to the sorter device');
  }
  const requiredByteLength = data.byteOffset + keys.length * UINT32_BYTE_LENGTH;
  if (requiredByteLength > buffer.byteLength) {
    throw new Error('BitonicArgsort.sortGPUVector() key storage is smaller than vector length');
  }

  return {buffer, keysByteOffset: data.byteOffset / UINT32_BYTE_LENGTH};
}

function getCoreBuffer(buffer: Buffer | DynamicBuffer): Buffer {
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
}

function getNextPowerOfTwo(length: number): number {
  let paddedLength = 1;
  while (paddedLength < length) {
    paddedLength *= 2;
  }
  return paddedLength;
}

function getBitonicArgsortStages(paddedLength: number): BitonicArgsortStage[] {
  const stages: BitonicArgsortStage[] = [];
  for (let blockWidth = 2; blockWidth <= paddedLength; blockWidth *= 2) {
    for (let compareStride = blockWidth / 2; compareStride >= 1; compareStride /= 2) {
      stages.push({blockWidth, compareStride});
    }
  }
  return stages;
}

function makeInitializeComputation(
  device: Device,
  logicalLength: number,
  paddedLength: number,
  dispatchLayout: ReturnType<typeof getWebGPUDispatchLayout>
): Computation {
  return new Computation(device, {
    id: 'bitonic-argsort-initialize',
    source: /* wgsl */ `
const INVALID_INDEX: u32 = ${INVALID_INDEX}u;
const LOGICAL_LENGTH: u32 = ${logicalLength}u;
const PADDED_LENGTH: u32 = ${paddedLength}u;
@group(0) @binding(0) var<storage, read_write> indicesOut: array<u32>;

@compute @workgroup_size(${BITONIC_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${getWebGPUDispatchRowIndex(dispatchLayout, BITONIC_WORKGROUP_SIZE)};
  if (rowIndex >= PADDED_LENGTH) {
    return;
  }

  indicesOut[rowIndex] = select(INVALID_INDEX, rowIndex, rowIndex < LOGICAL_LENGTH);
}
`,
    shaderLayout: {
      bindings: [{name: 'indicesOut', type: 'storage', group: 0, location: 0}]
    }
  });
}

function makeSortStageComputation(
  device: Device,
  {
    dispatchLayout,
    keysByteOffset,
    logicalLength,
    paddedLength,
    stage
  }: {
    dispatchLayout: ReturnType<typeof getWebGPUDispatchLayout>;
    keysByteOffset: number;
    logicalLength: number;
    paddedLength: number;
    stage: BitonicArgsortStage;
  }
): Computation {
  return new Computation(device, {
    id: `bitonic-argsort-sort-${stage.blockWidth}-${stage.compareStride}`,
    source: /* wgsl */ `
const INVALID_INDEX: u32 = ${INVALID_INDEX}u;
const KEY_ROW_OFFSET: u32 = ${keysByteOffset}u;
const LOGICAL_LENGTH: u32 = ${logicalLength}u;
const PADDED_LENGTH: u32 = ${paddedLength}u;
const BLOCK_WIDTH: u32 = ${stage.blockWidth}u;
const COMPARE_STRIDE: u32 = ${stage.compareStride}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> indicesIn: array<u32>;
@group(0) @binding(2) var<storage, read_write> indicesOut: array<u32>;

fn is_valid_index(index: u32) -> bool {
  return index != INVALID_INDEX && index < LOGICAL_LENGTH;
}

fn comes_before(leftIndex: u32, rightIndex: u32) -> bool {
  let leftValid = is_valid_index(leftIndex);
  let rightValid = is_valid_index(rightIndex);
  if (leftValid != rightValid) {
    return leftValid;
  }
  if (!leftValid) {
    return false;
  }

  let leftKey = keys[KEY_ROW_OFFSET + leftIndex];
  let rightKey = keys[KEY_ROW_OFFSET + rightIndex];
  return leftKey < rightKey || (leftKey == rightKey && leftIndex < rightIndex);
}

@compute @workgroup_size(${BITONIC_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${getWebGPUDispatchRowIndex(dispatchLayout, BITONIC_WORKGROUP_SIZE)};
  if (rowIndex >= PADDED_LENGTH) {
    return;
  }

  let partnerIndex = rowIndex ^ COMPARE_STRIDE;
  if (partnerIndex <= rowIndex) {
    return;
  }

  let leftIndex = indicesIn[rowIndex];
  let rightIndex = indicesIn[partnerIndex];
  let ascending = (rowIndex & BLOCK_WIDTH) == 0u;
  let shouldSwap = select(
    comes_before(leftIndex, rightIndex),
    comes_before(rightIndex, leftIndex),
    ascending
  );
  indicesOut[rowIndex] = select(leftIndex, rightIndex, shouldSwap);
  indicesOut[partnerIndex] = select(rightIndex, leftIndex, shouldSwap);
}
`,
    shaderLayout: {
      bindings: [
        {name: 'keys', type: 'read-only-storage', group: 0, location: 0},
        {name: 'indicesIn', type: 'read-only-storage', group: 0, location: 1},
        {name: 'indicesOut', type: 'storage', group: 0, location: 2}
      ]
    }
  });
}

function makeCopyComputation(
  device: Device,
  logicalLength: number,
  dispatchLayout: ReturnType<typeof getWebGPUDispatchLayout>
): Computation {
  return new Computation(device, {
    id: 'bitonic-argsort-copy',
    source: /* wgsl */ `
const LOGICAL_LENGTH: u32 = ${logicalLength}u;
@group(0) @binding(0) var<storage, read> indicesIn: array<u32>;
@group(0) @binding(1) var<storage, read_write> indicesOut: array<u32>;

@compute @workgroup_size(${BITONIC_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${getWebGPUDispatchRowIndex(dispatchLayout, BITONIC_WORKGROUP_SIZE)};
  if (rowIndex >= LOGICAL_LENGTH) {
    return;
  }

  indicesOut[rowIndex] = indicesIn[rowIndex];
}
`,
    shaderLayout: {
      bindings: [
        {name: 'indicesIn', type: 'read-only-storage', group: 0, location: 0},
        {name: 'indicesOut', type: 'storage', group: 0, location: 1}
      ]
    }
  });
}

function dispatchComputation(
  computation: Computation,
  computePass: ComputePass,
  dispatchLayout: ReturnType<typeof getWebGPUDispatchLayout>,
  bindings: Parameters<Computation['setBindings']>[0]
): void {
  computation.setBindings(bindings);
  computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
}
