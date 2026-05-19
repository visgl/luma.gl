// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {GPUVector, type GPUData} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';
import {isVariableLengthAttributeArrowType} from './arrow-types';
import type {ArrowStoragePathInputProps} from './arrow-storage-path-model';

type ArrowPathCoordinateType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;

export type ResolvedArrowStoragePathBatchInputs = {
  batchRowIndexBase: number;
  rowCount: number;
  componentCount: number;
  valueOffsets: Int32Array;
  recordOffsets: number[];
  segmentCount: number;
  pathValuesBinding: Binding;
  colorsBinding?: Binding;
  widthsBinding?: Binding;
};

export type ResolvedArrowStoragePathInputs = {
  batches: ResolvedArrowStoragePathBatchInputs[];
};

/** Prepare aligned path/style GPUVector batches for storage-backed path expansion. */
export function resolveArrowStoragePathInputs(
  props: ArrowStoragePathInputProps
): ResolvedArrowStoragePathInputs {
  assertArrowStoragePathVectorTypes(props);
  assertArrowStoragePathVectorRowAlignment(props);
  const batches: ResolvedArrowStoragePathBatchInputs[] = [];
  const componentCount = getArrowStoragePathCoordinateComponentCount(props.paths.type);
  let batchRowIndexBase = 0;

  for (let batchIndex = 0; batchIndex < props.paths.data.length; batchIndex++) {
    const pathData = props.paths.data[batchIndex] as GPUData<ArrowPathCoordinateType>;
    const valueOffsets = getArrowStoragePathOffsets(pathData);
    const recordOffsets = makeArrowStoragePathRecordOffsets(valueOffsets, pathData.length);
    const segmentCount = recordOffsets[recordOffsets.length - 1] ?? 0;
    const colorData = props.colors?.data[batchIndex];
    const widthData = props.widths?.data[batchIndex];
    batches.push({
      batchRowIndexBase,
      rowCount: pathData.length,
      componentCount,
      valueOffsets,
      recordOffsets,
      segmentCount,
      pathValuesBinding: getStorageGPUDataBinding(
        pathData,
        pathData.readbackMetadata?.kind === 'variable-length-attribute'
          ? pathData.readbackMetadata.valueByteLength
          : undefined
      ),
      colorsBinding: colorData
        ? getStorageGPUDataBinding(colorData, colorData.length * props.colors!.byteStride)
        : undefined,
      widthsBinding: widthData
        ? getStorageGPUDataBinding(widthData, widthData.length * props.widths!.byteStride)
        : undefined
    });
    batchRowIndexBase += pathData.length;
  }

  return {batches};
}

function assertArrowStoragePathVectorTypes(props: ArrowStoragePathInputProps): void {
  assertArrowStoragePathCoordinateType(props.paths.type, 'paths');
  if (
    props.colors &&
    (!arrow.DataType.isFixedSizeList(props.colors.type) ||
      props.colors.type.listSize !== 4 ||
      !(props.colors.type.children[0]?.type instanceof arrow.Uint8))
  ) {
    throw new Error('ArrowStoragePathModel colors must be GPUVector<FixedSizeList<Uint8>[4]>');
  }
  if (props.widths && !(props.widths.type instanceof arrow.Float32)) {
    throw new Error('ArrowStoragePathModel widths must be GPUVector<Float32>');
  }
}

function assertArrowStoragePathCoordinateType(type: arrow.DataType, name: string): void {
  if (
    !isVariableLengthAttributeArrowType(type) ||
    !arrow.DataType.isFixedSizeList(type.children[0].type) ||
    type.children[0].type.listSize < 2 ||
    type.children[0].type.listSize > 4 ||
    !(type.children[0].type.children[0]?.type instanceof arrow.Float32)
  ) {
    throw new Error(
      `ArrowStoragePathModel ${name} must be GPUVector<List<FixedSizeList<Float32>[2..4]>>`
    );
  }
}

function assertArrowStoragePathVectorRowAlignment(props: ArrowStoragePathInputProps): void {
  const rowInputs = [
    ['paths', props.paths],
    ['colors', props.colors],
    ['widths', props.widths]
  ].filter(([, vector]) => vector !== undefined) as Array<[string, GPUVector<any>]>;
  const [referenceName, referenceVector] = rowInputs[0];
  for (const [name, vector] of rowInputs.slice(1)) {
    if (vector.length !== referenceVector.length) {
      throw new Error(
        `ArrowStoragePathModel ${name} rows must match ${referenceName} rows (${vector.length} !== ${referenceVector.length})`
      );
    }
    if (vector.data.length !== referenceVector.data.length) {
      throw new Error(
        `ArrowStoragePathModel ${name} batch count must match ${referenceName} batch count`
      );
    }
    for (let batchIndex = 0; batchIndex < vector.data.length; batchIndex++) {
      if (vector.data[batchIndex].length !== referenceVector.data[batchIndex].length) {
        throw new Error(
          `ArrowStoragePathModel ${name} batch ${batchIndex} rows must match ${referenceName}`
        );
      }
    }
  }
}

function getArrowStoragePathOffsets(data: GPUData<ArrowPathCoordinateType>): Int32Array {
  const metadata = data.readbackMetadata;
  if (metadata?.kind !== 'variable-length-attribute') {
    throw new Error(
      'ArrowStoragePathModel paths require copied variable-length Arrow offset metadata'
    );
  }
  return metadata.valueOffsets;
}

function makeArrowStoragePathRecordOffsets(valueOffsets: Int32Array, rowCount: number): number[] {
  const recordOffsets: number[] = [0];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const pathStart = valueOffsets[rowIndex] ?? 0;
    const pathEnd = valueOffsets[rowIndex + 1] ?? pathStart;
    const segmentCount = Math.max(0, pathEnd - pathStart - 1);
    recordOffsets.push((recordOffsets[recordOffsets.length - 1] ?? 0) + segmentCount);
  }
  return recordOffsets;
}

function getArrowStoragePathCoordinateComponentCount(type: arrow.DataType): number {
  const pathElementType = type.children[0]?.type;
  if (!pathElementType || !arrow.DataType.isFixedSizeList(pathElementType)) {
    throw new Error('ArrowStoragePathModel paths require FixedSizeList coordinate elements');
  }
  return pathElementType.listSize;
}

function getStorageGPUDataBinding(data: GPUData<any>, size?: number): Binding {
  return {
    buffer: data.buffer.buffer,
    offset: data.byteOffset,
    ...(size && size > 0 ? {size} : {})
  };
}
