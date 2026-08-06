// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUTable, GPUVector, type GPURecordBatchSourceInfo} from '@luma.gl/tables';

/** Framework-independent, decoded Gaussian splat columns for one source batch. */
export type SplatSource = {
  /** Packed world-space XYZ centers, one Float32 triplet per splat. */
  positions: Float32Array;
  /** Packed linear one-sigma XYZ scales, one Float32 triplet per splat. */
  scales: Float32Array;
  /** Packed quaternion rotations in `[w, x, y, z]` order. */
  rotations: Float32Array;
  /** Packed RGBA colors as normalized Uint8 values or unclamped linear Float32 radiance. */
  colors: Uint8Array | Float32Array;
  /** Decoded linear opacity values, without source-format logit encoding. */
  opacities: Float32Array;
  /** Zero-based source batch index retained for streamed row identity. */
  sourceBatchIndex?: number;
  /** Zero-based global row index of the first source row. */
  rowIndexBase?: number;
};

/** Typed GPU columns retained by one prepared Gaussian splat batch. */
export type GPUSplatVectors = {
  positions: GPUVector<'float32x3'>;
  scales: GPUVector<'float32x3'>;
  rotations: GPUVector<'float32x4'>;
  colors: GPUVector<'unorm8x4' | 'float32x4'>;
  opacities: GPUVector<'float32'>;
  rowIndices: GPUVector<'uint32'>;
};

/** Canonical stored memory formats for every prepared Gaussian splat column. */
export type GPUSplatTypeMap = {
  positions: 'float32x3';
  scales: 'float32x3';
  rotations: 'float32x4';
  colors: 'unorm8x4' | 'float32x4';
  opacities: 'float32';
  rowIndices: 'uint32';
};

/** One caller-owned Gaussian splat batch and its explicitly allocated GPU buffers. */
export class GPUSplatData {
  /** Device that owns this prepared batch's GPU allocations. */
  readonly device: Device;
  /** CPU source columns retained for camera-dependent projection and depth ordering. */
  readonly source: SplatSource;
  /** Number of logical Gaussian splat rows. */
  readonly length: number;
  /** GPU table preserving exactly one source record batch. */
  readonly table: GPUTable<GPUSplatTypeMap>;
  /** World-space center positions. */
  readonly positions: GPUVector<'float32x3'>;
  /** Decoded linear one-sigma scales. */
  readonly scales: GPUVector<'float32x3'>;
  /** Decoded `[w, x, y, z]` quaternion rotations. */
  readonly rotations: GPUVector<'float32x4'>;
  /** Normalized Uint8 RGBA colors or unclamped linear Float32 RGBA radiance. */
  readonly colors: GPUVector<'unorm8x4' | 'float32x4'>;
  /** Decoded linear opacity values. */
  readonly opacities: GPUVector<'float32'>;
  /** Stable global source-row indices. */
  readonly rowIndices: GPUVector<'uint32'>;
  /** Stable source batch and global row identity. */
  readonly sourceInfo: GPURecordBatchSourceInfo;
  private isDestroyed = false;

  /** Uploads one already-decoded source batch into separately owned typed GPU columns. */
  constructor(device: Device, source: SplatSource) {
    const length = getSplatSourceLength(source);
    this.device = device;
    this.source = source;
    this.length = length;
    this.sourceInfo = {
      sourceBatchIndex: source.sourceBatchIndex ?? 0,
      sourceRowIndexOffset: source.rowIndexBase ?? 0,
      sourceRowCount: length
    };

    const rowIndices = new Uint32Array(length);
    for (let rowIndex = 0; rowIndex < length; rowIndex++) {
      rowIndices[rowIndex] = this.sourceInfo.sourceRowIndexOffset + rowIndex;
    }

    this.positions = createSplatGPUVector(
      device,
      'positions',
      source.positions,
      'float32x3',
      length
    );
    this.scales = createSplatGPUVector(device, 'scales', source.scales, 'float32x3', length);
    this.rotations = createSplatGPUVector(
      device,
      'rotations',
      source.rotations,
      'float32x4',
      length
    );
    const colorFormat = source.colors instanceof Float32Array ? 'float32x4' : 'unorm8x4';
    this.colors = createSplatGPUVector(device, 'colors', source.colors, colorFormat, length);
    this.opacities = createSplatGPUVector(device, 'opacities', source.opacities, 'float32', length);
    this.rowIndices = createSplatGPUVector(device, 'rowIndices', rowIndices, 'uint32', length);
    this.table = new GPUTable({
      vectors: {
        positions: this.positions,
        scales: this.scales,
        rotations: this.rotations,
        colors: this.colors,
        opacities: this.opacities,
        rowIndices: this.rowIndices
      },
      sourceInfo: this.sourceInfo
    });
  }

  /** Number of logical source rows, matching {@link length}. */
  get rowCount(): number {
    return this.length;
  }

  /** Zero-based source batch identity. */
  get sourceBatchIndex(): number {
    return this.sourceInfo.sourceBatchIndex;
  }

  /** Global source row corresponding to the first batch-local row. */
  get rowIndexBase(): number {
    return this.sourceInfo.sourceRowIndexOffset;
  }

  /** Number of bytes allocated for all caller-owned splat columns. */
  get byteLength(): number {
    return Object.values(this.table.batches[0]?.gpuData ?? {}).reduce(
      (totalByteLength, data) => totalByteLength + data.buffer.byteLength,
      0
    );
  }

  /** Prepared-batch row, source identity, and GPU allocation diagnostics. */
  get stats(): {
    rowCount: number;
    batchCount: number;
    byteLength: number;
    sourceBatchIndex: number;
    rowIndexBase: number;
  } {
    return {
      rowCount: this.length,
      batchCount: 1,
      byteLength: this.byteLength,
      sourceBatchIndex: this.sourceBatchIndex,
      rowIndexBase: this.rowIndexBase
    };
  }

  /** Whether this prepared batch has already released its caller-owned GPU buffers. */
  get destroyed(): boolean {
    return this.isDestroyed;
  }

  /** Releases each owned source-column allocation exactly once. */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.table.destroy();
    this.isDestroyed = true;
  }
}

/** Uploads one decoded, framework-independent Gaussian splat source batch. */
export function makeGPUSplatData(device: Device, source: SplatSource): GPUSplatData {
  return new GPUSplatData(device, source);
}

function getSplatSourceLength(source: SplatSource): number {
  const length = source.positions.length / 3;
  if (
    !Number.isInteger(length) ||
    source.scales.length !== length * 3 ||
    source.rotations.length !== length * 4 ||
    source.colors.length !== length * 4 ||
    source.opacities.length !== length
  ) {
    throw new Error('SplatSource columns must contain matching Gaussian splat rows');
  }
  return length;
}

function createSplatGPUVector<
  Format extends 'float32x3' | 'float32x4' | 'unorm8x4' | 'float32' | 'uint32'
>(
  device: Device,
  name: string,
  values: Float32Array | Uint8Array | Uint32Array,
  format: Format,
  length: number
): GPUVector<Format> {
  const usage =
    Buffer.VERTEX |
    Buffer.COPY_DST |
    Buffer.COPY_SRC |
    (device.type === 'webgpu' ? Buffer.STORAGE : 0);
  const buffer = device.createBuffer({
    id: `splat-${name}`,
    ...(values.byteLength > 0 ? {data: values} : {byteLength: Uint32Array.BYTES_PER_ELEMENT}),
    usage
  });
  return new GPUVector<Format>({
    type: 'buffer',
    name,
    buffer,
    format,
    length,
    ownsBuffer: true
  });
}
