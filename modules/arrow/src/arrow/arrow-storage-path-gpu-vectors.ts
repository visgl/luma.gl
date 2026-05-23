// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding, type Device} from '@luma.gl/core';
import {GPUVector, type GPUData} from '@luma.gl/tables';
import {Bool, DataType, FixedSizeList, Float32, Float64, List, Uint8, Vector} from 'apache-arrow';
import {closeArrowPaths} from './close-arrow-paths';
import {
  makeArrowPathViewOriginVector,
  type ArrowPathSourceVectors,
  type ArrowPathViewOriginUpdateProps,
  type PrepareArrowPathGPUVectorsOptions,
  updateViewOriginValues,
  writeArrowPathViewOriginGPUVector
} from './arrow-path-model';
import {prepareGpuPathFloat64DeltaVector} from './gpu-path-float64-deltas';
import {makeArrowGPUVector} from './arrow-gpu-table-adapters';
import {isVariableLengthAttributeArrowType} from './arrow-types';
import type {ArrowStoragePathInputProps} from './arrow-storage-path-model';
import {prepareArrowTemporalGPUVector} from './arrow-temporal-gpu-vector';

type ArrowPathCoordinateType = List<FixedSizeList<Float32>>;
type ArrowPathFloat64CoordinateType = List<FixedSizeList<Float64>>;
type ArrowPathRowColorType = FixedSizeList<Uint8>;
type ArrowPathVertexColorType = List<FixedSizeList<Uint8>>;
type ArrowPathColorType = ArrowPathRowColorType | ArrowPathVertexColorType;
type ArrowPathViewOriginType = FixedSizeList<Float32>;
type ArrowPathTimestampType = List<Float32>;

/** Prepared storage-backed path vectors plus retained row-alignment helpers. */
export type PreparedArrowStoragePathGPUVectors = {
  /** Prepared Float32 path coordinates, one Arrow row per path. */
  paths: GPUVector<ArrowPathCoordinateType>;
  /** Optional packed RGBA8 path colors aligned with source path rows or vertices. */
  colors?: GPUVector<ArrowPathColorType>;
  /** Optional Float32 path widths aligned with source path rows. */
  widths?: GPUVector<Float32>;
  /** Optional prepared relative Float32 temporal stream aligned with path vertices. */
  timestamps?: GPUVector<ArrowPathTimestampType>;
  /** Optional Float32 view-space origins aligned with source path rows. */
  viewOrigins?: GPUVector<ArrowPathViewOriginType>;
  /** Optional retained Float64 source origins used to refresh view-space origins. */
  sourceOrigins?: Float64Array;
  /** Props ready for {@link ArrowStoragePathModel}. */
  storagePathProps: ArrowStoragePathInputProps;
  /** Refreshes prepared Float32 view origins after a model-view matrix change. */
  updateViewOrigins: (props: ArrowPathViewOriginUpdateProps) => void;
  /** Releases owned prepared vectors. */
  destroy: () => void;
};

/** Per-source-batch storage bindings and path range metadata. */
export type ResolvedArrowStoragePathBatchInputs = {
  /** Global source path row index assigned to local row zero. */
  batchRowIndexBase: number;
  /** Source path rows included in this batch. */
  rowCount: number;
  /** Float32 coordinate components in each prepared path point. */
  componentCount: number;
  /** Flattened path point offsets copied from Arrow list metadata. */
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
export type ResolvedArrowStoragePathInputs = {
  /** Per-source-batch storage bindings and path range metadata. */
  batches: ResolvedArrowStoragePathBatchInputs[];
};

/** Prepares raw Arrow path/style columns for WebGPU storage-backed path rendering. */
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
    ? makeArrowGPUVector(device, sourceVectors.colors, {
        name: 'colors',
        id: `${id}-colors`,
        preserveDataChunks: true
      })
    : undefined;
  const widths = sourceVectors.widths
    ? makeArrowGPUVector(device, sourceVectors.widths, {
        name: 'widths',
        id: `${id}-widths`,
        preserveDataChunks: true
      })
    : undefined;
  const preparedTimestamps = sourceVectors.timestamps
    ? await prepareArrowTemporalGPUVector(device, sourceVectors.timestamps, {
        name: 'timestamps',
        id: `${id}-timestamps`
      })
    : undefined;
  const timestamps = preparedTimestamps?.temporal as GPUVector<ArrowPathTimestampType> | undefined;
  const sourceOrigins = preparedPathData.sourceOrigins;
  const viewOriginValues = new Float32Array(sourceVectors.paths.length * 4);
  const viewOriginVector = sourceOrigins
    ? makeArrowPathViewOriginVector(
        viewOriginValues,
        preparedPathData.paths.data.map(data => data.length)
      )
    : undefined;
  const viewOrigins = sourceOrigins
    ? makeArrowGPUVector(device, viewOriginVector!, {
        name: 'pathViewOrigins',
        id: `${id}-view-origins`,
        preserveDataChunks: true
      })
    : undefined;
  if (sourceOrigins && viewOrigins) {
    updateViewOriginValues(
      viewOriginValues,
      sourceOrigins,
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    );
    writeArrowPathViewOriginGPUVector(viewOrigins, viewOriginValues);
  }

  const storagePathProps: ArrowStoragePathInputProps = {
    id,
    paths,
    ...(colors ? {colors} : {}),
    ...(widths ? {widths} : {}),
    ...(timestamps ? {timestamps} : {}),
    ...(viewOrigins ? {viewOrigins} : {})
  };
  let destroyed = false;

  const updateViewOrigins = ({modelViewMatrix}: ArrowPathViewOriginUpdateProps): void => {
    if (!sourceOrigins || !viewOrigins) {
      return;
    }
    updateViewOriginValues(viewOriginValues, sourceOrigins, modelViewMatrix);
    writeArrowPathViewOriginGPUVector(viewOrigins, viewOriginValues);
  };

  return {
    paths,
    ...(colors ? {colors} : {}),
    ...(widths ? {widths} : {}),
    ...(timestamps ? {timestamps} : {}),
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
      preparedTimestamps?.destroy();
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
            timestampData.readbackMetadata?.kind === 'variable-length-attribute'
              ? timestampData.readbackMetadata.valueByteLength
              : undefined
          )
        : undefined
    });
    batchRowIndexBase += pathData.length;
  }

  return {batches};
}

function assertArrowStoragePathVectorTypes(props: ArrowStoragePathInputProps): void {
  assertArrowStoragePathCoordinateType(props.paths.type, 'paths');
  if (props.colors && !isArrowPathColorType(props.colors.type)) {
    throw new Error(
      'ArrowStoragePathModel colors must be GPUVector<FixedSizeList<Uint8>[4]> or GPUVector<List<FixedSizeList<Uint8>[4]>>'
    );
  }
  if (props.widths && !(props.widths.type instanceof Float32)) {
    throw new Error('ArrowStoragePathModel widths must be GPUVector<Float32>');
  }
  if (
    props.timestamps &&
    (!DataType.isList(props.timestamps.type) ||
      !(props.timestamps.type.children[0]?.type instanceof Float32))
  ) {
    throw new Error('ArrowStoragePathModel timestamps must be GPUVector<List<Float32>>');
  }
  if (
    props.viewOrigins &&
    (!DataType.isFixedSizeList(props.viewOrigins.type) ||
      props.viewOrigins.type.listSize !== 4 ||
      !(props.viewOrigins.type.children[0]?.type instanceof Float32))
  ) {
    throw new Error(
      'ArrowStoragePathModel viewOrigins must be GPUVector<FixedSizeList<Float32>[4]>'
    );
  }
}

function isArrowPathRowColorType(type: DataType): type is ArrowPathRowColorType {
  return (
    DataType.isFixedSizeList(type) && type.listSize === 4 && type.children[0]?.type instanceof Uint8
  );
}

function isArrowPathVertexColorType(type: DataType): type is ArrowPathVertexColorType {
  return DataType.isList(type) && isArrowPathRowColorType(type.children[0]?.type);
}

function isArrowPathColorType(type: DataType): type is ArrowPathColorType {
  return isArrowPathRowColorType(type) || isArrowPathVertexColorType(type);
}

function assertArrowStoragePathSourceVectorTypes(sourceVectors: ArrowPathSourceVectors): void {
  assertArrowStoragePathSourceCoordinateType(sourceVectors.paths.type, 'paths');
  if (sourceVectors.colors && !isArrowPathColorType(sourceVectors.colors.type)) {
    throw new Error(
      'prepareArrowStoragePathGPUVectors colors must be Vector<FixedSizeList<Uint8>[4]> or Vector<List<FixedSizeList<Uint8>[4]>>'
    );
  }
  if (sourceVectors.widths && !(sourceVectors.widths.type instanceof Float32)) {
    throw new Error('prepareArrowStoragePathGPUVectors widths must be Vector<Float32>');
  }
  if (sourceVectors.closed && !(sourceVectors.closed.type instanceof Bool)) {
    throw new Error('prepareArrowStoragePathGPUVectors closed flags must be Vector<Bool>');
  }
  if (
    sourceVectors.timestamps &&
    !(
      DataType.isList(sourceVectors.timestamps.type) &&
      sourceVectors.timestamps.type.children[0]?.type &&
      (DataType.isDate(sourceVectors.timestamps.type.children[0].type) ||
        DataType.isTime(sourceVectors.timestamps.type.children[0].type) ||
        DataType.isTimestamp(sourceVectors.timestamps.type.children[0].type) ||
        DataType.isDuration(sourceVectors.timestamps.type.children[0].type))
    )
  ) {
    throw new Error(
      'prepareArrowStoragePathGPUVectors timestamps must be Vector<List<Date|Time|Timestamp|Duration>>'
    );
  }
}

function assertArrowStoragePathSourceVectorRows(sourceVectors: ArrowPathSourceVectors): void {
  const rowInputs: Array<[string, Vector | undefined]> = [
    ['colors', sourceVectors.colors],
    ['widths', sourceVectors.widths],
    ['closed', sourceVectors.closed],
    ['timestamps', sourceVectors.timestamps]
  ];
  for (const [name, vector] of rowInputs) {
    if (vector && vector.length !== sourceVectors.paths.length) {
      throw new Error(
        `prepareArrowStoragePathGPUVectors ${name} rows must match paths rows (${vector.length} !== ${sourceVectors.paths.length})`
      );
    }
  }
  if (sourceVectors.colors && isArrowPathVertexColorType(sourceVectors.colors.type)) {
    assertArrowStoragePathSourceVertexColorAlignment(
      sourceVectors.paths,
      sourceVectors.colors as Vector<ArrowPathVertexColorType>
    );
  }
}

function assertArrowStoragePathCoordinateType(type: DataType, name: string): void {
  if (
    !isVariableLengthAttributeArrowType(type) ||
    !DataType.isFixedSizeList(type.children[0].type) ||
    type.children[0].type.listSize < 2 ||
    type.children[0].type.listSize > 4 ||
    !(type.children[0].type.children[0]?.type instanceof Float32)
  ) {
    throw new Error(
      `ArrowStoragePathModel ${name} must be GPUVector<List<FixedSizeList<Float32>[2..4]>>`
    );
  }
}

function assertArrowStoragePathSourceCoordinateType(type: DataType, name: string): void {
  const coordinateValueType = getArrowStoragePathCoordinateValueType(type);
  if (
    !isVariableLengthAttributeArrowType(type) ||
    !DataType.isFixedSizeList(type.children[0].type) ||
    type.children[0].type.listSize < 2 ||
    type.children[0].type.listSize > 4 ||
    (!(coordinateValueType instanceof Float32) && !(coordinateValueType instanceof Float64))
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
    ['timestamps', props.timestamps],
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
  if (props.timestamps) {
    assertArrowStoragePathTimestampAlignment(props.paths, props.timestamps);
  }
  if (props.colors && isArrowPathVertexColorType(props.colors.type)) {
    assertArrowStoragePathVertexColorAlignment(
      props.paths,
      props.colors as GPUVector<ArrowPathVertexColorType>
    );
  }
}

function assertArrowStoragePathTimestampAlignment(
  paths: GPUVector<ArrowPathCoordinateType>,
  timestamps: GPUVector<ArrowPathTimestampType>
): void {
  for (let batchIndex = 0; batchIndex < paths.data.length; batchIndex++) {
    const pathOffsets = getArrowStoragePathOffsets(
      paths.data[batchIndex] as GPUData<ArrowPathCoordinateType>
    );
    const timestampData = timestamps.data[batchIndex];
    const timestampMetadata = timestampData.readbackMetadata;
    if (timestampMetadata?.kind !== 'variable-length-attribute') {
      throw new Error('ArrowStoragePathModel timestamps require copied variable-length offsets');
    }
    if (!areArrowOffsetsEqual(pathOffsets, timestampMetadata.valueOffsets)) {
      throw new Error('ArrowStoragePathModel timestamps must align with path vertex offsets');
    }
  }
}

function assertArrowStoragePathSourceVertexColorAlignment(
  paths: ArrowPathSourceVectors['paths'],
  colors: Vector<ArrowPathVertexColorType>
): void {
  if (paths.data.length !== colors.data.length) {
    throw new Error('prepareArrowStoragePathGPUVectors vertex color batch count must match paths');
  }
  for (let batchIndex = 0; batchIndex < paths.data.length; batchIndex++) {
    const pathOffsets = paths.data[batchIndex]?.valueOffsets as Int32Array | undefined;
    const colorOffsets = colors.data[batchIndex]?.valueOffsets as Int32Array | undefined;
    if (!pathOffsets || !colorOffsets || !areArrowOffsetsEqual(pathOffsets, colorOffsets)) {
      throw new Error('prepareArrowStoragePathGPUVectors vertex colors must align with paths');
    }
  }
}

function assertArrowStoragePathVertexColorAlignment(
  paths: GPUVector<ArrowPathCoordinateType>,
  colors: GPUVector<ArrowPathVertexColorType>
): void {
  for (let batchIndex = 0; batchIndex < paths.data.length; batchIndex++) {
    const pathOffsets = getArrowStoragePathOffsets(
      paths.data[batchIndex] as GPUData<ArrowPathCoordinateType>
    );
    const colorData = colors.data[batchIndex];
    const colorMetadata = colorData.readbackMetadata;
    if (colorMetadata?.kind !== 'variable-length-attribute') {
      throw new Error('ArrowStoragePathModel vertex colors require copied variable-length offsets');
    }
    if (!areArrowOffsetsEqual(pathOffsets, colorMetadata.valueOffsets)) {
      throw new Error('ArrowStoragePathModel vertex colors must align with path vertex offsets');
    }
  }
}

function areArrowOffsetsEqual(left: Int32Array, right: Int32Array): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
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

function getArrowStoragePathCoordinateComponentCount(type: DataType): number {
  const pathElementType = type.children[0]?.type;
  if (!pathElementType || !DataType.isFixedSizeList(pathElementType)) {
    throw new Error('ArrowStoragePathModel paths require FixedSizeList coordinate elements');
  }
  return pathElementType.listSize;
}

function getArrowStoragePathCoordinateValueType(type: DataType): DataType | undefined {
  const pathElementType = type.children[0]?.type;
  return DataType.isFixedSizeList(pathElementType) ? pathElementType.children[0]?.type : undefined;
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
  if (coordinateValueType instanceof Float32) {
    return {
      paths: makeArrowGPUVector(device, paths as Vector<ArrowPathCoordinateType>, {
        name: 'paths',
        id: `${options.id || 'arrow-storage-path-model'}-paths`,
        preserveDataChunks: true
      })
    };
  }
  if (!(coordinateValueType instanceof Float64)) {
    throw new Error('prepareArrowStoragePathGPUVectors paths must contain Float32 or Float64');
  }
  return prepareGpuPathFloat64DeltaVector(
    device,
    paths as Vector<ArrowPathFloat64CoordinateType>,
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

function getStorageGPUDataValueByteLength(data: GPUData<any>, rowByteStride: number): number {
  return data.readbackMetadata?.kind === 'variable-length-attribute'
    ? data.readbackMetadata.valueByteLength
    : data.length * rowByteStride;
}
