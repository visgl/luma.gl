// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Device} from '@luma.gl/core';
import type {VertexList} from '@luma.gl/tables';
import {Bool, DataType, FixedSizeList, Float32, Float64, List, Uint8, Vector} from 'apache-arrow';
import {closeArrowPaths} from '../transforms/close-arrow-paths';
import {
  makeArrowPathViewOriginVector,
  type ArrowPathViewOriginUpdateProps,
  updateViewOriginValues,
  writeArrowPathViewOriginGPUVector
} from '../transforms/path-view-origins';
import type {
  ArrowPathSourceVectors,
  ConvertArrowPathToGPUVectorsOptions
} from './arrow-path-gpu-vectors';
import {convertArrowPathFloat64ToGPUVector} from '../transforms/gpu-path-float64-deltas';
import {makeGPUVectorFromArrow} from '../../../gpu/arrow-gpu-table-adapters';
import {isVariableLengthAttributeArrowType} from '../../../arrow-utils/arrow-types';
import type {PathStorageInputProps} from '@luma.gl/tables';
import {convertArrowTemporalToGPUVector} from '../../../vectors/arrow-temporal-gpu-vector';
export {
  resolvePathStorageInputs,
  type PathStorageBatchInputs,
  type PathStorageInputs
} from '@luma.gl/tables';

type ArrowPathCoordinateType = List<FixedSizeList<Float32>>;
type ArrowPathFloat64CoordinateType = List<FixedSizeList<Float64>>;
type ArrowPathRowColorType = FixedSizeList<Uint8>;
type ArrowPathVertexColorType = List<FixedSizeList<Uint8>>;
type ArrowPathColorType = ArrowPathRowColorType | ArrowPathVertexColorType;

/** Prepared flat props for {@link PathStorageModel} plus retained update/destruction helpers. */
export type PreparedPathStorageGPUVectors = PathStorageInputProps & {
  /** Optional retained Float64 source origins used to refresh view-space origins. */
  sourceOrigins?: Float64Array;
  /** Refreshes prepared Float32 view origins after a model-view matrix change. */
  updateViewOrigins: (props: ArrowPathViewOriginUpdateProps) => void;
  /** Releases owned prepared vectors. */
  destroy: () => void;
};

/** Converts raw Arrow path/style columns for WebGPU storage-backed path rendering. */
export async function convertArrowPathStorageToGPUVectors(
  device: Device,
  sourceVectors: ArrowPathSourceVectors,
  options: ConvertArrowPathToGPUVectorsOptions = {}
): Promise<PreparedPathStorageGPUVectors> {
  if (device.type !== 'webgpu') {
    throw new Error('convertArrowPathStorageToGPUVectors requires a WebGPU device');
  }

  assertPathStorageSourceVectorTypes(sourceVectors);
  assertPathStorageSourceVectorRows(sourceVectors);

  const id = options.id || 'arrow-path-storage-model';
  const preparedPathData = await convertPathStorageCoordinateData(device, sourceVectors.paths, {
    id
  });
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
    ? makeGPUVectorFromArrow(device, sourceVectors.colors, {
        name: 'colors',
        id: `${id}-colors`,
        format: getArrowPathColorFormat(sourceVectors.colors.type),
        preserveDataChunks: true
      })
    : undefined;
  const widths = sourceVectors.widths
    ? makeGPUVectorFromArrow(device, sourceVectors.widths, {
        name: 'widths',
        id: `${id}-widths`,
        preserveDataChunks: true
      })
    : undefined;
  const preparedTimestamps = sourceVectors.timestamps
    ? await convertArrowTemporalToGPUVector(device, sourceVectors.timestamps, {
        name: 'timestamps',
        id: `${id}-timestamps`
      })
    : undefined;
  const timestamps = preparedTimestamps?.temporal as
    | NonNullable<PathStorageInputProps['timestamps']>
    | undefined;
  const sourceOrigins = preparedPathData.sourceOrigins;
  const viewOriginValues = new Float32Array(sourceVectors.paths.length * 4);
  const viewOriginVector = sourceOrigins
    ? makeArrowPathViewOriginVector(
        viewOriginValues,
        preparedPathData.paths.data.map(data => data.length)
      )
    : undefined;
  const viewOrigins = sourceOrigins
    ? makeGPUVectorFromArrow(device, viewOriginVector!, {
        name: 'pathViewOrigins',
        id: `${id}-view-origins`,
        format: 'float32x4',
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

  let destroyed = false;

  const updateViewOrigins = ({modelViewMatrix}: ArrowPathViewOriginUpdateProps): void => {
    if (!sourceOrigins || !viewOrigins) {
      return;
    }
    updateViewOriginValues(viewOriginValues, sourceOrigins, modelViewMatrix);
    writeArrowPathViewOriginGPUVector(viewOrigins, viewOriginValues);
  };

  return {
    id,
    paths,
    ...(colors ? {colors} : {}),
    ...(widths ? {widths} : {}),
    ...(timestamps ? {timestamps} : {}),
    ...(viewOrigins ? {viewOrigins} : {}),
    rowIndexBase: options.rowIndexBase,
    ...(sourceOrigins ? {sourceOrigins} : {}),
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

function getArrowPathColorFormat(type: ArrowPathColorType): 'unorm8x4' | 'vertex-list<unorm8x4>' {
  return isArrowPathVertexColorType(type) ? 'vertex-list<unorm8x4>' : 'unorm8x4';
}

function assertPathStorageSourceVectorTypes(sourceVectors: ArrowPathSourceVectors): void {
  assertPathStorageSourceCoordinateType(sourceVectors.paths.type, 'paths');
  if (sourceVectors.colors && !isArrowPathColorType(sourceVectors.colors.type)) {
    throw new Error(
      'convertArrowPathStorageToGPUVectors colors must be Vector<FixedSizeList<Uint8>[4]> or Vector<List<FixedSizeList<Uint8>[4]>>'
    );
  }
  if (sourceVectors.widths && !(sourceVectors.widths.type instanceof Float32)) {
    throw new Error('convertArrowPathStorageToGPUVectors widths must be Vector<Float32>');
  }
  if (sourceVectors.closed && !(sourceVectors.closed.type instanceof Bool)) {
    throw new Error('convertArrowPathStorageToGPUVectors closed flags must be Vector<Bool>');
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
      'convertArrowPathStorageToGPUVectors timestamps must be Vector<List<Date|Time|Timestamp|Duration>>'
    );
  }
}

function assertPathStorageSourceVectorRows(sourceVectors: ArrowPathSourceVectors): void {
  const rowInputs: Array<[string, Vector | undefined]> = [
    ['colors', sourceVectors.colors],
    ['widths', sourceVectors.widths],
    ['closed', sourceVectors.closed],
    ['timestamps', sourceVectors.timestamps]
  ];
  for (const [name, vector] of rowInputs) {
    if (vector && vector.length !== sourceVectors.paths.length) {
      throw new Error(
        `convertArrowPathStorageToGPUVectors ${name} rows must match paths rows (${vector.length} !== ${sourceVectors.paths.length})`
      );
    }
  }
  if (sourceVectors.colors && isArrowPathVertexColorType(sourceVectors.colors.type)) {
    assertPathStorageSourceVertexColorAlignment(
      sourceVectors.paths,
      sourceVectors.colors as Vector<ArrowPathVertexColorType>
    );
  }
}

function assertPathStorageSourceCoordinateType(type: DataType, name: string): void {
  const coordinateValueType = getPathStorageCoordinateValueType(type);
  if (
    !isVariableLengthAttributeArrowType(type) ||
    !DataType.isFixedSizeList(type.children[0].type) ||
    type.children[0].type.listSize < 2 ||
    type.children[0].type.listSize > 4 ||
    (!(coordinateValueType instanceof Float32) && !(coordinateValueType instanceof Float64))
  ) {
    throw new Error(
      `convertArrowPathStorageToGPUVectors ${name} must be Vector<List<FixedSizeList<Float32|Float64>[2..4]>>`
    );
  }
}

function assertPathStorageSourceVertexColorAlignment(
  paths: ArrowPathSourceVectors['paths'],
  colors: Vector<ArrowPathVertexColorType>
): void {
  if (paths.data.length !== colors.data.length) {
    throw new Error('convertArrowPathStorageToGPUVectors vertex color batch count must match paths');
  }
  for (let batchIndex = 0; batchIndex < paths.data.length; batchIndex++) {
    const pathOffsets = paths.data[batchIndex]?.valueOffsets as Int32Array | undefined;
    const colorOffsets = colors.data[batchIndex]?.valueOffsets as Int32Array | undefined;
    if (!pathOffsets || !colorOffsets || !areArrowOffsetsEqual(pathOffsets, colorOffsets)) {
      throw new Error('convertArrowPathStorageToGPUVectors vertex colors must align with paths');
    }
  }
}

function areArrowOffsetsEqual(left: Int32Array, right: Int32Array): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function getPathStorageCoordinateValueType(type: DataType): DataType | undefined {
  const pathElementType = type.children[0]?.type;
  return DataType.isFixedSizeList(pathElementType) ? pathElementType.children[0]?.type : undefined;
}

async function convertPathStorageCoordinateData(
  device: Device,
  paths: ArrowPathSourceVectors['paths'],
  options: ConvertArrowPathToGPUVectorsOptions
): Promise<{
  paths: PathStorageInputProps['paths'];
  sourceOrigins?: Float64Array;
}> {
  const coordinateValueType = getPathStorageCoordinateValueType(paths.type);
  if (coordinateValueType instanceof Float32) {
    return {
      paths: makeGPUVectorFromArrow(device, paths as Vector<ArrowPathCoordinateType>, {
        name: 'paths',
        id: `${options.id || 'arrow-path-storage-model'}-paths`,
        format: getPathStorageCoordinateFormat((paths as Vector<ArrowPathCoordinateType>).type),
        preserveDataChunks: true
      })
    };
  }
  if (!(coordinateValueType instanceof Float64)) {
    throw new Error('convertArrowPathStorageToGPUVectors paths must contain Float32 or Float64');
  }
  return convertArrowPathFloat64ToGPUVector(
    device,
    paths as Vector<ArrowPathFloat64CoordinateType>,
    options
  );
}

function getPathStorageCoordinateFormat(
  type: ArrowPathCoordinateType
): VertexList<'float32x2' | 'float32x3' | 'float32x4'> {
  const componentCount = getPathStorageSourceCoordinateComponentCount(type);
  switch (componentCount) {
    case 2:
      return 'vertex-list<float32x2>';
    case 3:
      return 'vertex-list<float32x3>';
    case 4:
      return 'vertex-list<float32x4>';
    default:
      throw new Error('convertArrowPathStorageToGPUVectors paths require 2, 3, or 4 components');
  }
}

function getPathStorageSourceCoordinateComponentCount(type: DataType): number {
  const pathElementType = type.children[0]?.type;
  if (!pathElementType || !DataType.isFixedSizeList(pathElementType)) {
    throw new Error('convertArrowPathStorageToGPUVectors paths require FixedSizeList coordinates');
  }
  return pathElementType.listSize;
}
