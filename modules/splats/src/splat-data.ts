// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUTable, GPUVector, type GPURecordBatchSourceInfo} from '@luma.gl/tables';
import {
  getSplatSphericalHarmonicCoefficientCount,
  getSplatSphericalHarmonicsDegree,
  type SplatSphericalHarmonicsDegree
} from './splat-spherical-harmonics';

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
  /** Optional compact semantic class identifier for each source row. */
  semanticIds?: Uint32Array;
  /** Row-major non-DC spherical-harmonic coefficients packed as basis-major RGB triplets. */
  sphericalHarmonics?: Float32Array;
  /** Highest non-DC spherical-harmonic band; inferred from the coefficient count when omitted. */
  sphericalHarmonicsDegree?: SplatSphericalHarmonicsDegree;
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
  semanticIds?: GPUVector<'uint32'>;
  sphericalHarmonics?: GPUVector<'float32'>;
};

/** In-place replacement of complete rows within one existing prepared source batch. */
export type SplatDataUpdate = {
  /** Zero-based batch-local row receiving the first supplied replacement values. */
  rowOffset?: number;
  /** Replacement packed XYZ center positions. */
  positions?: Float32Array;
  /** Replacement packed XYZ one-sigma scales. */
  scales?: Float32Array;
  /** Replacement packed WXYZ quaternion rotations. */
  rotations?: Float32Array;
  /** Replacement RGBA colors using the prepared source's original typed-array format. */
  colors?: Uint8Array | Float32Array;
  /** Replacement decoded linear opacity values. */
  opacities?: Float32Array;
  /** Replacement semantic identifiers when the prepared source includes semantic metadata. */
  semanticIds?: Uint32Array;
  /** Replacement packed non-DC spherical-harmonic coefficients for complete source rows. */
  sphericalHarmonics?: Float32Array;
};

type SplatDataColumnUpdate = {
  source: Float32Array | Uint8Array | Uint32Array;
  values: Float32Array | Uint8Array | Uint32Array;
  vector: GPUVector;
  scalarStride: number;
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
  /** Optional independently owned compact semantic identifiers. */
  readonly semanticIds?: GPUVector<'uint32'>;
  /** Optional independently owned flattened non-DC spherical-harmonic coefficients. */
  readonly sphericalHarmonics?: GPUVector<'float32'>;
  /** Highest spherical-harmonic band represented by the prepared source. */
  readonly sphericalHarmonicsDegree: SplatSphericalHarmonicsDegree;
  /** Stable source batch and global row identity. */
  readonly sourceInfo: GPURecordBatchSourceInfo;
  private isDestroyed = false;
  private currentRevision = 0;

  /** Uploads one already-decoded source batch into separately owned typed GPU columns. */
  constructor(device: Device, source: SplatSource) {
    const length = getSplatSourceLength(source);
    const rowIndexBase = source.rowIndexBase ?? 0;
    if (
      !Number.isSafeInteger(rowIndexBase) ||
      rowIndexBase < 0 ||
      rowIndexBase + Math.max(length - 1, 0) > 0x7fff_ffff
    ) {
      throw new RangeError('Gaussian splat source rows must fit signed 32-bit GPU indices');
    }
    this.device = device;
    this.source = source;
    this.length = length;
    this.sphericalHarmonicsDegree = getSplatSourceSphericalHarmonicsDegree(source, length);
    this.sourceInfo = {
      sourceBatchIndex: source.sourceBatchIndex ?? 0,
      sourceRowIndexOffset: rowIndexBase,
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
    if (source.semanticIds) {
      this.semanticIds = createSplatGPUVector(
        device,
        'semanticIds',
        source.semanticIds,
        'uint32',
        length
      );
    }
    if (source.sphericalHarmonics) {
      this.sphericalHarmonics = createSplatGPUVector(
        device,
        'sphericalHarmonics',
        source.sphericalHarmonics,
        'float32',
        source.sphericalHarmonics.length
      );
    }
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
    const tableByteLength = Object.values(this.table.batches[0]?.gpuData ?? {}).reduce(
      (totalByteLength, data) => totalByteLength + data.buffer.byteLength,
      0
    );
    return (
      tableByteLength +
      (this.semanticIds?.data[0]?.buffer.byteLength ?? 0) +
      (this.sphericalHarmonics?.data[0]?.buffer.byteLength ?? 0)
    );
  }

  /** Monotonic revision incremented whenever existing source rows are updated in place. */
  get revision(): number {
    return this.currentRevision;
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

  /** Updates complete source rows without reallocating owned GPU buffers or changing row identity. */
  update(update: SplatDataUpdate): void {
    if (this.isDestroyed) {
      throw new Error('Cannot update destroyed Gaussian splat data');
    }

    const rowOffset = update.rowOffset ?? 0;
    if (!Number.isInteger(rowOffset) || rowOffset < 0 || rowOffset > this.length) {
      throw new RangeError('Gaussian splat update row offset is outside the prepared source batch');
    }

    const columnUpdates = this.getColumnUpdates(update);
    let updatedRowCount: number | undefined;
    for (const columnUpdate of columnUpdates) {
      if (
        columnUpdate.source.constructor !== columnUpdate.values.constructor ||
        columnUpdate.scalarStride === 0 ||
        columnUpdate.values.length % columnUpdate.scalarStride !== 0
      ) {
        throw new Error(
          'Gaussian splat updates must preserve source column types and complete rows'
        );
      }

      const columnRowCount = columnUpdate.values.length / columnUpdate.scalarStride;
      if (updatedRowCount !== undefined && updatedRowCount !== columnRowCount) {
        throw new Error('Gaussian splat update columns must contain matching row counts');
      }
      if (rowOffset + columnRowCount > this.length) {
        throw new RangeError('Gaussian splat update rows exceed the prepared source batch');
      }
      updatedRowCount = columnRowCount;
    }

    if (columnUpdates.length === 0 || updatedRowCount === 0) {
      return;
    }

    for (const columnUpdate of columnUpdates) {
      const sourceBytes = new Uint8Array(
        columnUpdate.source.buffer,
        columnUpdate.source.byteOffset,
        columnUpdate.source.byteLength
      );
      const updatedBytes = new Uint8Array(
        columnUpdate.values.buffer,
        columnUpdate.values.byteOffset,
        columnUpdate.values.byteLength
      );
      const byteOffset =
        rowOffset * columnUpdate.scalarStride * columnUpdate.source.BYTES_PER_ELEMENT;
      columnUpdate.vector.data[0].buffer.write(columnUpdate.values, byteOffset);
      sourceBytes.set(updatedBytes, byteOffset);
    }

    this.currentRevision++;
  }

  /** Updates complete source rows beginning at a batch-local row offset. */
  updateRows(rowOffset: number, update: Omit<SplatDataUpdate, 'rowOffset'>): void {
    this.update({...update, rowOffset});
  }

  /** Releases each owned source-column allocation exactly once. */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.table.destroy();
    this.semanticIds?.destroy();
    this.sphericalHarmonics?.destroy();
    this.isDestroyed = true;
  }

  private getColumnUpdates(update: SplatDataUpdate): SplatDataColumnUpdate[] {
    const updates: SplatDataColumnUpdate[] = [];
    const addUpdate = (
      source: Float32Array | Uint8Array | Uint32Array | undefined,
      values: Float32Array | Uint8Array | Uint32Array | undefined,
      vector: GPUVector | undefined,
      scalarStride: number
    ): void => {
      if (!values) {
        return;
      }
      if (!source || !vector) {
        throw new Error('Gaussian splat update requires an existing prepared source column');
      }
      updates.push({source, values, vector, scalarStride});
    };

    addUpdate(this.source.positions, update.positions, this.positions, 3);
    addUpdate(this.source.scales, update.scales, this.scales, 3);
    addUpdate(this.source.rotations, update.rotations, this.rotations, 4);
    addUpdate(this.source.colors, update.colors, this.colors, 4);
    addUpdate(this.source.opacities, update.opacities, this.opacities, 1);
    addUpdate(this.source.semanticIds, update.semanticIds, this.semanticIds, 1);
    addUpdate(
      this.source.sphericalHarmonics,
      update.sphericalHarmonics,
      this.sphericalHarmonics,
      getSplatSphericalHarmonicCoefficientCount(this.sphericalHarmonicsDegree)
    );
    return updates;
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
    source.opacities.length !== length ||
    (source.semanticIds && source.semanticIds.length !== length)
  ) {
    throw new Error('SplatSource columns must contain matching Gaussian splat rows');
  }
  return length;
}

function getSplatSourceSphericalHarmonicsDegree(
  source: SplatSource,
  rowCount: number
): SplatSphericalHarmonicsDegree {
  const coefficients = source.sphericalHarmonics;
  const explicitDegree = source.sphericalHarmonicsDegree;
  if (!coefficients) {
    if (explicitDegree !== undefined && explicitDegree !== 0) {
      throw new Error('Gaussian splat spherical harmonics require coefficient data');
    }
    return 0;
  }

  if (rowCount === 0) {
    if (coefficients.length !== 0) {
      throw new Error('Gaussian splat spherical-harmonic coefficients require source rows');
    }
    return explicitDegree ?? 0;
  }

  const coefficientCount = coefficients.length / rowCount;
  const inferredDegree = getSplatSphericalHarmonicsDegree(coefficientCount);
  if (explicitDegree !== undefined && explicitDegree !== inferredDegree) {
    throw new Error('Gaussian splat spherical-harmonic coefficients do not match their degree');
  }
  return inferredDegree;
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
