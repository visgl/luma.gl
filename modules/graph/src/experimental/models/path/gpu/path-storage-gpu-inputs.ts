// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Binding, type Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/core/dynamic';
import {getGPUVectorFormatInfo, isVertexListGPUVectorFormat} from '@luma.gl/graph/gpu-data';
import type {GPUData} from '@luma.gl/graph/gpu-data';
import type {GPUVector, VertexList} from '@luma.gl/graph/gpu-data';
import {type GPUInputSchema, validateGPUInputVectors} from '@luma.gl/graph/gpu-tables';
export type GPUPathStorageInputProps = {
  /** Variable-length Float32 XY, XYZ, or XYZM path coordinates, one GPU row per path. */
  paths: GPUVector<VertexList<'float32x2' | 'float32x3' | 'float32x4'>>;
  /** Optional packed RGBA8 path colors, either one per path row or one per path vertex. */
  colors?: GPUVector<'unorm8x4' | VertexList<'unorm8x4'>>;
  /** Optional per-path widths, one GPU row per path. */
  widths?: GPUVector<'float32'>;
  /** Optional per-path Float32 temporal stream aligned with path vertices. */
  timestamps?: GPUVector<VertexList<'float32'>>;
  /** Optional per-path view-space origins, one GPU row per path. */
  viewOrigins?: GPUVector<'float32x4'>;
  /** Global source row index assigned to the first prepared path row. */
  rowIndexBase?: number;
  /** Constant fallback path color used when `colors` is absent. */
  color?: [number, number, number, number];
  /** Constant fallback path width used when `widths` is absent. */
  width?: number;
};

/** Per-source-batch storage bindings and path range metadata. */
export type PathStorageBatchInputs = {
  /** Global source path row index assigned to local row zero. */
  batchRowIndexBase: number;
  /** Source path rows included in this batch. */
  rowCount: number;
  /** Float32 coordinate components in each prepared path point. */
  componentCount: number;
  /** Flattened path point offsets copied from variable-length GPU list metadata. */
  valueOffsets: Int32Array;
  /** Generated segment record offsets, length = source path rows + 1. */
  recordOffsets: number[];
  /** Generated segment records in this source batch. */
  segmentCount: number;
  /** Read-only storage binding for flattened prepared path values. */
  pathValuesBinding: Binding;
  /** Optional read-only storage binding for Float32 path view origins. */
  viewOriginsBinding?: Binding;
  /** Optional read-only storage binding for packed RGBA8 path colors. */
  colorsBinding?: Binding;
  /** Optional read-only storage binding for Float32 path widths. */
  widthsBinding?: Binding;
  /** Optional read-only storage binding for prepared Float32 path timestamps. */
  timestampsBinding?: Binding;
};

/** Storage path inputs resolved across preserved source GPU batches. */
export type PathStorageInputs = {
  /** Per-source-batch storage bindings and path range metadata. */
  batches: PathStorageBatchInputs[];
};

/** Resolves aligned path/style GPUVector batches for storage-backed path expansion. */
export function resolvePathStorageInputs(
  props: GPUPathStorageInputProps,
  gpuInputSchema: GPUInputSchema
): PathStorageInputs {
  assertPathStorageVectorTypes(props, gpuInputSchema);
  assertPathStorageVectorRowAlignment(props);
  const batches: PathStorageBatchInputs[] = [];
  const componentCount = getPathStorageCoordinateComponentCount(props.paths);
  let batchRowIndexBase = props.rowIndexBase ?? 0;

  for (let batchIndex = 0; batchIndex < props.paths.data.length; batchIndex++) {
    const pathData = props.paths.data[batchIndex] as GPUData;
    const valueOffsets = getPathStorageOffsets(pathData);
    const recordOffsets = makePathStorageRecordOffsets(valueOffsets, pathData.length);
    const segmentCount = recordOffsets[recordOffsets.length - 1] ?? 0;
    const colorData = props.colors?.data[batchIndex];
    const widthData = props.widths?.data[batchIndex];
    const timestampData = props.timestamps?.data[batchIndex];
    const viewOriginData = props.viewOrigins?.data[batchIndex];
    batches.push({
      batchRowIndexBase,
      rowCount: pathData.length,
      componentCount,
      valueOffsets,
      recordOffsets,
      segmentCount,
      pathValuesBinding: getStorageGPUDataBinding(
        pathData,
        getStorageGPUDataValueByteLength(pathData, props.paths.byteStride)
      ),
      viewOriginsBinding: viewOriginData
        ? getStorageGPUDataBinding(
            viewOriginData,
            viewOriginData.length * props.viewOrigins!.byteStride
          )
        : undefined,
      colorsBinding: colorData
        ? getStorageGPUDataBinding(
            colorData,
            getStorageGPUDataValueByteLength(colorData, props.colors!.byteStride)
          )
        : undefined,
      widthsBinding: widthData
        ? getStorageGPUDataBinding(widthData, widthData.length * props.widths!.byteStride)
        : undefined,
      timestampsBinding: timestampData
        ? getStorageGPUDataBinding(
            timestampData,
            getStorageGPUDataValueByteLength(timestampData, props.timestamps!.byteStride)
          )
        : undefined
    });
    batchRowIndexBase += pathData.length;
  }

  return {batches};
}

function assertPathStorageVectorTypes(
  props: GPUPathStorageInputProps,
  gpuInputSchema: GPUInputSchema
): void {
  validateGPUInputVectors('PathStorageModel', gpuInputSchema, {
    paths: props.paths,
    colors: props.colors,
    widths: props.widths,
    timestamps: props.timestamps,
    viewOrigins: props.viewOrigins
  });
}

function assertPathStorageVectorRowAlignment(props: GPUPathStorageInputProps): void {
  const rowInputs = [
    ['paths', props.paths],
    ['colors', props.colors],
    ['widths', props.widths],
    ['timestamps', props.timestamps],
    ['viewOrigins', props.viewOrigins]
  ].filter(([, vector]) => vector !== undefined) as Array<[string, GPUVector]>;
  const [referenceName, referenceVector] = rowInputs[0];
  for (const [name, vector] of rowInputs.slice(1)) {
    if (vector.length !== referenceVector.length) {
      throw new Error(
        `PathStorageModel ${name} rows must match ${referenceName} rows (${vector.length} !== ${referenceVector.length})`
      );
    }
    if (vector.data.length !== referenceVector.data.length) {
      throw new Error(
        `PathStorageModel ${name} batch count must match ${referenceName} batch count`
      );
    }
    for (let batchIndex = 0; batchIndex < vector.data.length; batchIndex++) {
      if (vector.data[batchIndex].length !== referenceVector.data[batchIndex].length) {
        throw new Error(
          `PathStorageModel ${name} batch ${batchIndex} rows must match ${referenceName}`
        );
      }
    }
  }
  if (props.timestamps) {
    assertPathStorageTimestampAlignment(props.paths, props.timestamps);
  }
  if (props.colors && isPathVertexColorGPUVector(props.colors)) {
    assertPathStorageVertexColorAlignment(props.paths, props.colors);
  }
}

function assertPathStorageTimestampAlignment(paths: GPUVector, timestamps: GPUVector): void {
  for (let batchIndex = 0; batchIndex < paths.data.length; batchIndex++) {
    const pathOffsets = getPathStorageOffsets(paths.data[batchIndex] as GPUData);
    const timestampOffsets = timestamps.data[batchIndex].valueOffsets;
    if (!timestampOffsets) {
      throw new Error('PathStorageModel timestamps require copied variable-length offsets');
    }
    if (!areOffsetsEqual(pathOffsets, timestampOffsets)) {
      throw new Error('PathStorageModel timestamps must align with path vertex offsets');
    }
  }
}

function assertPathStorageVertexColorAlignment(paths: GPUVector, colors: GPUVector): void {
  for (let batchIndex = 0; batchIndex < paths.data.length; batchIndex++) {
    const pathOffsets = getPathStorageOffsets(paths.data[batchIndex] as GPUData);
    const colorOffsets = colors.data[batchIndex].valueOffsets;
    if (!colorOffsets) {
      throw new Error('PathStorageModel vertex colors require copied variable-length offsets');
    }
    if (!areOffsetsEqual(pathOffsets, colorOffsets)) {
      throw new Error('PathStorageModel vertex colors must align with path vertex offsets');
    }
  }
}

function areOffsetsEqual(left: Int32Array, right: Int32Array): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function getPathStorageOffsets(data: GPUData): Int32Array {
  if (!data.valueOffsets) {
    throw new Error('PathStorageModel paths require copied variable-length offset metadata');
  }
  return data.valueOffsets;
}

function makePathStorageRecordOffsets(valueOffsets: Int32Array, rowCount: number): number[] {
  const recordOffsets: number[] = [0];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const pathStart = valueOffsets[rowIndex] ?? 0;
    const pathEnd = valueOffsets[rowIndex + 1] ?? pathStart;
    const segmentCount = Math.max(0, pathEnd - pathStart - 1);
    recordOffsets.push((recordOffsets[recordOffsets.length - 1] ?? 0) + segmentCount);
  }
  return recordOffsets;
}

function getPathStorageCoordinateComponentCount(paths: GPUPathStorageInputProps['paths']): number {
  const format = paths.format;
  if (!format) {
    throw new Error('PathStorageModel paths require GPUVector.format');
  }
  return getGPUVectorFormatInfo(format).components;
}

function isPathVertexColorGPUVector(
  colors: NonNullable<GPUPathStorageInputProps['colors']>
): boolean {
  return colors.format !== undefined && isVertexListGPUVectorFormat(colors.format);
}

function getStorageGPUDataBinding(data: GPUData, size?: number): Binding {
  return {
    buffer: getGPUDataBuffer(data),
    offset: data.byteOffset,
    ...(size && size > 0 ? {size} : {})
  };
}

function getGPUDataBuffer(data: GPUData): Buffer {
  return data.buffer instanceof DynamicBuffer ? data.buffer.buffer : data.buffer;
}

function getStorageGPUDataValueByteLength(data: GPUData, rowByteStride: number): number {
  return data.valueByteLength ?? data.valueLength * rowByteStride;
}
