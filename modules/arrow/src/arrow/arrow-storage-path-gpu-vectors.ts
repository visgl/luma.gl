// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding, type Device} from '@luma.gl/core';
import {GPUVector, type GPUData} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';
import {closeArrowPaths} from './close-arrow-paths';
import {
  makeArrowPathViewOriginVector,
  type ArrowPathSourceVectors,
  type ArrowPathViewOriginUpdateProps,
  type PrepareArrowPathGPUVectorsOptions,
  updateViewOriginValues
} from './arrow-path-model';
import {prepareGpuPathFloat64DeltaVector} from './gpu-path-float64-deltas';
import {makeArrowGPUVector} from './arrow-gpu-table-adapters';
import {isVariableLengthAttributeArrowType} from './arrow-types';
import type {ArrowStoragePathInputProps} from './arrow-storage-path-model';

type ArrowPathCoordinateType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;
type ArrowPathFloat64CoordinateType = arrow.List<arrow.FixedSizeList<arrow.Float64>>;
type ArrowPathColorType = arrow.FixedSizeList<arrow.Uint8>;
type ArrowPathViewOriginType = arrow.FixedSizeList<arrow.Float32>;

export type PreparedArrowStoragePathGPUVectors = {
  paths: GPUVector<ArrowPathCoordinateType>;
  colors?: GPUVector<ArrowPathColorType>;
  widths?: GPUVector<arrow.Float32>;
  viewOrigins?: GPUVector<ArrowPathViewOriginType>;
  sourceOrigins?: Float64Array;
  storagePathProps: ArrowStoragePathInputProps;
  updateViewOrigins: (props: ArrowPathViewOriginUpdateProps) => void;
  destroy: () => void;
};

export type ResolvedArrowStoragePathBatchInputs = {
  batchRowIndexBase: number;
  rowCount: number;
  componentCount: number;
  valueOffsets: Int32Array;
  recordOffsets: number[];
  segmentCount: number;
  pathValuesBinding: Binding;
  viewOriginsBinding?: Binding;
  colorsBinding?: Binding;
  widthsBinding?: Binding;
};

export type ResolvedArrowStoragePathInputs = {
  batches: ResolvedArrowStoragePathBatchInputs[];
};

export async function prepareArrowStoragePathGPUVectors(
  device: Device,
  sourceVectors: ArrowPathSourceVectors,
  options: PrepareArrowPathGPUVectorsOptions = {}
): Promise<PreparedArrowStoragePathGPUVectors> {
  if (device.type !== 'webgpu') {
    throw new Error('prepareArrowStoragePathGPUVectors requires a WebGPU device');
  }

  assertArrowStoragePathSourceVectorTypes(sourceVectors);
  assertArrowStoragePathSourceVectorRows(sourceVectors);

  const id = options.id || 'arrow-storage-path-model';
  const preparedPathData = await prepareArrowStoragePathCoordinateData(
    device,
    sourceVectors.paths,
    {id}
  );
  let paths = preparedPathData.paths;
  if (sourceVectors.closed) {
    const normalizedPaths = await closeArrowPaths(device, {
      paths,
      closed: sourceVectors.closed,
      epsilon: options.closeEpsilon ?? 0,
      id: `${id}-closed`
    });
    paths.destroy();
    paths = normalizedPaths;
  }

  const colors = sourceVectors.colors
    ? makeArrowGPUVector(device, sourceVectors.colors, {name: 'colors', id: `${id}-colors`})
    : undefined;
  const widths = sourceVectors.widths
    ? makeArrowGPUVector(device, sourceVectors.widths, {name: 'widths', id: `${id}-widths`})
    : undefined;
  const sourceOrigins = preparedPathData.sourceOrigins;
  const viewOriginValues = new Float32Array(sourceVectors.paths.length * 4);
  const viewOrigins = sourceOrigins
    ? makeArrowGPUVector(device, makeArrowPathViewOriginVector(viewOriginValues), {
        name: 'pathViewOrigins',
        id: `${id}-view-origins`
      })
    : undefined;
  if (sourceOrigins && viewOrigins) {
    updateViewOriginValues(
      viewOriginValues,
      sourceOrigins,
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    );
    viewOrigins.buffer.write(viewOriginValues);
  }

  const storagePathProps: ArrowStoragePathInputProps = {
    id,
    paths,
    ...(colors ? {colors} : {}),
    ...(widths ? {widths} : {}),
    ...(viewOrigins ? {viewOrigins} : {})
  };
  let destroyed = false;

  const updateViewOrigins = ({modelViewMatrix}: ArrowPathViewOriginUpdateProps): void => {
    if (!sourceOrigins || !viewOrigins) {
      return;
    }
    updateViewOriginValues(viewOriginValues, sourceOrigins, modelViewMatrix);
    viewOrigins.buffer.write(viewOriginValues);
  };

  return {
    paths,
    ...(colors ? {colors} : {}),
    ...(widths ? {widths} : {}),
    ...(viewOrigins ? {viewOrigins} : {}),
    ...(sourceOrigins ? {sourceOrigins} : {}),
    storagePathProps,
    updateViewOrigins,
    destroy: () => {
      if (destroyed) {
        return;
      }
      destroyed = true;
      paths.destroy();
      colors?.destroy();
      widths?.destroy();
      viewOrigins?.destroy();
    }
  };
}

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
        pathData.readbackMetadata?.kind === 'variable-length-attribute'
          ? pathData.readbackMetadata.valueByteLength
          : undefined
      ),
      viewOriginsBinding: viewOriginData
        ? getStorageGPUDataBinding(
            viewOriginData,
            viewOriginData.length * props.viewOrigins!.byteStride
          )
        : undefined,
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
  if (
    props.viewOrigins &&
    (!arrow.DataType.isFixedSizeList(props.viewOrigins.type) ||
      props.viewOrigins.type.listSize !== 4 ||
      !(props.viewOrigins.type.children[0]?.type instanceof arrow.Float32))
  ) {
    throw new Error(
      'ArrowStoragePathModel viewOrigins must be GPUVector<FixedSizeList<Float32>[4]>'
    );
  }
}

function assertArrowStoragePathSourceVectorTypes(sourceVectors: ArrowPathSourceVectors): void {
  assertArrowStoragePathSourceCoordinateType(sourceVectors.paths.type, 'paths');
  if (
    sourceVectors.colors &&
    (!arrow.DataType.isFixedSizeList(sourceVectors.colors.type) ||
      sourceVectors.colors.type.listSize !== 4 ||
      !(sourceVectors.colors.type.children[0]?.type instanceof arrow.Uint8))
  ) {
    throw new Error(
      'prepareArrowStoragePathGPUVectors colors must be Vector<FixedSizeList<Uint8>[4]>'
    );
  }
  if (sourceVectors.widths && !(sourceVectors.widths.type instanceof arrow.Float32)) {
    throw new Error('prepareArrowStoragePathGPUVectors widths must be Vector<Float32>');
  }
  if (sourceVectors.closed && !(sourceVectors.closed.type instanceof arrow.Bool)) {
    throw new Error('prepareArrowStoragePathGPUVectors closed flags must be Vector<Bool>');
  }
}

function assertArrowStoragePathSourceVectorRows(sourceVectors: ArrowPathSourceVectors): void {
  const rowInputs: Array<[string, arrow.Vector | undefined]> = [
    ['colors', sourceVectors.colors],
    ['widths', sourceVectors.widths],
    ['closed', sourceVectors.closed]
  ];
  for (const [name, vector] of rowInputs) {
    if (vector && vector.length !== sourceVectors.paths.length) {
      throw new Error(
        `prepareArrowStoragePathGPUVectors ${name} rows must match paths rows (${vector.length} !== ${sourceVectors.paths.length})`
      );
    }
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

function assertArrowStoragePathSourceCoordinateType(type: arrow.DataType, name: string): void {
  const coordinateValueType = getArrowStoragePathCoordinateValueType(type);
  if (
    !isVariableLengthAttributeArrowType(type) ||
    !arrow.DataType.isFixedSizeList(type.children[0].type) ||
    type.children[0].type.listSize < 2 ||
    type.children[0].type.listSize > 4 ||
    (!(coordinateValueType instanceof arrow.Float32) &&
      !(coordinateValueType instanceof arrow.Float64))
  ) {
    throw new Error(
      `prepareArrowStoragePathGPUVectors ${name} must be Vector<List<FixedSizeList<Float32|Float64>[2..4]>>`
    );
  }
}

function assertArrowStoragePathVectorRowAlignment(props: ArrowStoragePathInputProps): void {
  const rowInputs = [
    ['paths', props.paths],
    ['colors', props.colors],
    ['widths', props.widths],
    ['viewOrigins', props.viewOrigins]
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

function getArrowStoragePathCoordinateValueType(type: arrow.DataType): arrow.DataType | undefined {
  const pathElementType = type.children[0]?.type;
  return arrow.DataType.isFixedSizeList(pathElementType)
    ? pathElementType.children[0]?.type
    : undefined;
}

async function prepareArrowStoragePathCoordinateData(
  device: Device,
  paths: ArrowPathSourceVectors['paths'],
  options: PrepareArrowPathGPUVectorsOptions
): Promise<{
  paths: GPUVector<ArrowPathCoordinateType>;
  sourceOrigins?: Float64Array;
}> {
  const coordinateValueType = getArrowStoragePathCoordinateValueType(paths.type);
  if (coordinateValueType instanceof arrow.Float32) {
    return {
      paths: makeArrowGPUVector(device, paths as arrow.Vector<ArrowPathCoordinateType>, {
        name: 'paths',
        id: `${options.id || 'arrow-storage-path-model'}-paths`
      })
    };
  }
  if (!(coordinateValueType instanceof arrow.Float64)) {
    throw new Error('prepareArrowStoragePathGPUVectors paths must contain Float32 or Float64');
  }
  return prepareGpuPathFloat64DeltaVector(
    device,
    paths as arrow.Vector<ArrowPathFloat64CoordinateType>,
    options
  );
}

function getStorageGPUDataBinding(data: GPUData<any>, size?: number): Binding {
  return {
    buffer: data.buffer.buffer,
    offset: data.byteOffset,
    ...(size && size > 0 ? {size} : {})
  };
}
