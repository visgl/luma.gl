// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Data,
  DataType,
  Field,
  FixedSizeList,
  Float32,
  Float64,
  Vector,
  makeData,
  makeVector
} from 'apache-arrow';
import type {GPUVector} from '@luma.gl/tables';
import {getRequiredArrowGPUVectorDataType} from '../gpu/arrow-gpu-data';

/** WGSL floating-point matrix shapes currently exposed through Arrow helpers. */
export type ArrowMatrixShape =
  | 'mat2x2'
  | 'mat2x3'
  | 'mat3x2'
  | 'mat3x3'
  | 'mat4x3'
  | 'mat3x4'
  | 'mat4x4';

/** Storage order accepted by the Arrow matrix helpers. GPU-facing vectors are column-major. */
export type ArrowMatrixOrder = 'column-major' | 'row-major';

/**
 * Physical matrix row layout.
 *
 * `wgsl-storage` pads three-row matrix columns to four floats, matching WGSL storage-buffer
 * layout rules and keeping the same Arrow vector usable for interleaved attributes.
 */
export type ArrowMatrixLayout = 'wgsl-storage' | 'packed';

/** Floating-point Arrow child types accepted by matrix helpers. */
export type ArrowMatrixValueType = Float32 | Float64;

/** Options for Arrow matrix vector construction. */
export type ArrowMatrixVectorOptions = {
  /** Storage order of the supplied logical matrix values. Defaults to `column-major`. */
  order?: ArrowMatrixOrder;
  /** Physical buffer layout of the materialized Arrow rows. Defaults to `wgsl-storage`. */
  layout?: ArrowMatrixLayout;
};

/** Matrix metadata retained in the Arrow type so attribute-layout synthesis can stay explicit. */
export type ArrowMatrixVectorInfo = {
  /** Logical WGSL matrix shape. */
  shape: ArrowMatrixShape;
  /** Logical matrix column count. */
  columns: 2 | 3 | 4;
  /** Logical matrix row count. */
  rows: 2 | 3 | 4;
  /** Stored logical value order before GPU conversion. */
  order: ArrowMatrixOrder;
  /** Stored physical row layout before GPU conversion. */
  layout: ArrowMatrixLayout;
  /** Stored Arrow child scalar precision. */
  valueType: 'float32' | 'float64';
  /** Number of unpadded logical matrix scalars per row. */
  logicalComponentCount: number;
  /** Number of physically materialized matrix scalars per row. */
  physicalComponentCount: number;
  /** Physical scalar stride between adjacent matrix columns. */
  columnStride: number;
  /** Physical bytes occupied by one Arrow matrix row. */
  byteStride: number;
};

/** Arrow row type used for one `mat2x2<f32>` value. */
export type ArrowFloat32Matrix2x2 = FixedSizeList<Float32>;
/** Arrow row type used for one `mat2x3<f32>` value. */
export type ArrowFloat32Matrix2x3 = FixedSizeList<Float32>;
/** Arrow row type used for one `mat3x2<f32>` value. */
export type ArrowFloat32Matrix3x2 = FixedSizeList<Float32>;
/** Arrow row type used for one `mat3x3<f32>` value. */
export type ArrowFloat32Matrix3x3 = FixedSizeList<Float32>;
/** Arrow row type used for one `mat4x3<f32>` value. */
export type ArrowFloat32Matrix4x3 = FixedSizeList<Float32>;
/** Arrow row type used for one `mat3x4<f32>` value. */
export type ArrowFloat32Matrix3x4 = FixedSizeList<Float32>;
/** Arrow row type used for one `mat4x4<f32>` value. */
export type ArrowFloat32Matrix4x4 = FixedSizeList<Float32>;

/** Arrow field metadata key for the logical WGSL matrix shape. */
export const MATRIX_SHAPE_METADATA_KEY = 'visgl:matrix-shape';
/** Arrow field metadata key for the stored logical matrix order. */
export const MATRIX_ORDER_METADATA_KEY = 'visgl:matrix-order';
/** Arrow field metadata key for the stored physical matrix row layout. */
export const MATRIX_LAYOUT_METADATA_KEY = 'visgl:matrix-layout';

const makeMatrixData = makeData as <T extends ArrowMatrixValueType>(props: {
  type: T;
  length: number;
  data: T['TArray'];
}) => Data<T>;

const makeMatrixFixedSizeListData = makeData as <T extends ArrowMatrixValueType>(props: {
  type: FixedSizeList<T>;
  length: number;
  nullCount: number;
  nullBitmap: null;
  child: Data<T>;
}) => Data<FixedSizeList<T>>;

/** Create a matrix Arrow vector for one supported WGSL `matCxR<f32>` shape. */
export function makeArrowMatrixVector(
  shape: ArrowMatrixShape,
  values: Float32Array,
  options?: ArrowMatrixVectorOptions
): Vector<FixedSizeList<Float32>>;
export function makeArrowMatrixVector(
  shape: ArrowMatrixShape,
  values: Float64Array,
  options?: ArrowMatrixVectorOptions
): Vector<FixedSizeList<Float64>>;
export function makeArrowMatrixVector(
  shape: ArrowMatrixShape,
  values: Float32Array | Float64Array,
  options?: ArrowMatrixVectorOptions
): Vector<FixedSizeList<ArrowMatrixValueType>> {
  return values instanceof Float64Array
    ? makeArrowTypedMatrixVector(shape, values, new Float64(), options)
    : makeArrowTypedMatrixVector(shape, values, new Float32(), options);
}

function makeArrowTypedMatrixVector<T extends ArrowMatrixValueType>(
  shape: ArrowMatrixShape,
  values: T['TArray'],
  childType: T,
  options?: ArrowMatrixVectorOptions
): Vector<FixedSizeList<T>> {
  const matrixInfo = getMatrixShapeInfo(shape, options?.layout || 'wgsl-storage');
  if (values.length % matrixInfo.logicalComponentCount !== 0) {
    throw new Error(
      `Matrix values length ${values.length} must be divisible by ${matrixInfo.logicalComponentCount}`
    );
  }

  const columnMajorValues =
    options?.order === 'row-major'
      ? transposeRowMajorMatrices(values, matrixInfo)
      : copyMatrixValues(values);
  const physicalValues = materializeMatrixValues(columnMajorValues, matrixInfo);
  const childData = makeMatrixData({
    type: childType,
    length: physicalValues.length,
    data: physicalValues
  });
  const valueField = new Field(
    'value',
    childType,
    false,
    new Map([
      [MATRIX_SHAPE_METADATA_KEY, matrixInfo.shape],
      [MATRIX_ORDER_METADATA_KEY, 'column-major'],
      [MATRIX_LAYOUT_METADATA_KEY, matrixInfo.layout]
    ])
  );
  const matrixType = new FixedSizeList(matrixInfo.physicalComponentCount, valueField);
  const matrixData = makeMatrixFixedSizeListData({
    type: matrixType,
    length: physicalValues.length / matrixInfo.physicalComponentCount,
    nullCount: 0,
    nullBitmap: null,
    child: childData
  });

  return makeVector(matrixData);
}

/** Create a matrix vector for `mat2x2<f32>`. */
export function makeArrowMatrix2x2Vector(
  values: Float32Array,
  options?: ArrowMatrixVectorOptions
): Vector<ArrowFloat32Matrix2x2> {
  return makeArrowMatrixVector('mat2x2', values, options);
}

/** Create a matrix vector for `mat2x3<f32>`. */
export function makeArrowMatrix2x3Vector(
  values: Float32Array,
  options?: ArrowMatrixVectorOptions
): Vector<ArrowFloat32Matrix2x3> {
  return makeArrowMatrixVector('mat2x3', values, options);
}

/** Create a matrix vector for `mat3x2<f32>`. */
export function makeArrowMatrix3x2Vector(
  values: Float32Array,
  options?: ArrowMatrixVectorOptions
): Vector<ArrowFloat32Matrix3x2> {
  return makeArrowMatrixVector('mat3x2', values, options);
}

/** Create a matrix vector for `mat3x3<f32>`. */
export function makeArrowMatrix3x3Vector(
  values: Float32Array,
  options?: ArrowMatrixVectorOptions
): Vector<ArrowFloat32Matrix3x3> {
  return makeArrowMatrixVector('mat3x3', values, options);
}

/** Create a matrix vector for `mat4x3<f32>`. */
export function makeArrowMatrix4x3Vector(
  values: Float32Array,
  options?: ArrowMatrixVectorOptions
): Vector<ArrowFloat32Matrix4x3> {
  return makeArrowMatrixVector('mat4x3', values, options);
}

/** Create a matrix vector for `mat3x4<f32>`. */
export function makeArrowMatrix3x4Vector(
  values: Float32Array,
  options?: ArrowMatrixVectorOptions
): Vector<ArrowFloat32Matrix3x4> {
  return makeArrowMatrixVector('mat3x4', values, options);
}

/** Create a matrix vector for `mat4x4<f32>`. */
export function makeArrowMatrix4x4Vector(
  values: Float32Array,
  options?: ArrowMatrixVectorOptions
): Vector<ArrowFloat32Matrix4x4> {
  return makeArrowMatrixVector('mat4x4', values, options);
}

/** Recover matrix metadata from an Arrow vector type produced by this helper. */
export function getArrowMatrixVectorInfo(
  vector: Pick<Vector, 'type'> | Pick<GPUVector, 'dataType'>
): ArrowMatrixVectorInfo | null {
  const type = 'type' in vector ? vector.type : getRequiredArrowGPUVectorDataType(vector);
  if (!DataType.isFixedSizeList(type)) {
    return null;
  }
  const metadata = type.children[0]?.metadata;
  const shape = metadata?.get(MATRIX_SHAPE_METADATA_KEY) as ArrowMatrixShape | undefined;
  const order =
    (metadata?.get(MATRIX_ORDER_METADATA_KEY) as ArrowMatrixOrder | undefined) || 'column-major';
  const layout = metadata?.get(MATRIX_LAYOUT_METADATA_KEY) as ArrowMatrixLayout | undefined;
  const childType = type.children[0]?.type;
  if (!shape || !layout || !(childType instanceof Float32 || childType instanceof Float64)) {
    return null;
  }

  const matrixInfo = getMatrixShapeInfo(shape, layout, order, childType);
  return type.listSize === matrixInfo.physicalComponentCount ? matrixInfo : null;
}

function getMatrixShapeInfo(
  shape: ArrowMatrixShape,
  layout: ArrowMatrixLayout,
  order: ArrowMatrixOrder = 'column-major',
  childType: ArrowMatrixValueType = new Float32()
): ArrowMatrixVectorInfo {
  const [columns, rows] = getMatrixDimensions(shape);
  const logicalComponentCount = columns * rows;
  const columnStride = layout === 'wgsl-storage' && rows === 3 ? 4 : rows;
  const physicalComponentCount = columns * columnStride;

  return {
    shape,
    columns,
    rows,
    order,
    layout,
    valueType: childType instanceof Float64 ? 'float64' : 'float32',
    logicalComponentCount,
    physicalComponentCount,
    columnStride,
    byteStride:
      physicalComponentCount *
      (childType instanceof Float64
        ? Float64Array.BYTES_PER_ELEMENT
        : Float32Array.BYTES_PER_ELEMENT)
  };
}

function getMatrixDimensions(shape: ArrowMatrixShape): [2 | 3 | 4, 2 | 3 | 4] {
  switch (shape) {
    case 'mat2x2':
      return [2, 2];
    case 'mat2x3':
      return [2, 3];
    case 'mat3x2':
      return [3, 2];
    case 'mat3x3':
      return [3, 3];
    case 'mat4x3':
      return [4, 3];
    case 'mat3x4':
      return [3, 4];
    case 'mat4x4':
      return [4, 4];
    default:
      throw new Error(`Unsupported Arrow matrix shape ${shape}`);
  }
}

function transposeRowMajorMatrices(
  values: Float32Array | Float64Array,
  matrixInfo: ArrowMatrixVectorInfo
): Float32Array | Float64Array {
  const columnMajorValues = createMatrixValuesArray(values, values.length);

  for (
    let matrixOffset = 0;
    matrixOffset < values.length;
    matrixOffset += matrixInfo.logicalComponentCount
  ) {
    for (let rowIndex = 0; rowIndex < matrixInfo.rows; rowIndex++) {
      for (let columnIndex = 0; columnIndex < matrixInfo.columns; columnIndex++) {
        columnMajorValues[matrixOffset + columnIndex * matrixInfo.rows + rowIndex] =
          values[matrixOffset + rowIndex * matrixInfo.columns + columnIndex];
      }
    }
  }

  return columnMajorValues;
}

function materializeMatrixValues(
  columnMajorValues: Float32Array | Float64Array,
  matrixInfo: ArrowMatrixVectorInfo
): Float32Array | Float64Array {
  if (matrixInfo.columnStride === matrixInfo.rows) {
    return columnMajorValues;
  }

  const physicalValues = createMatrixValuesArray(
    columnMajorValues,
    (columnMajorValues.length / matrixInfo.logicalComponentCount) *
      matrixInfo.physicalComponentCount
  );
  let sourceOffset = 0;
  let targetOffset = 0;

  while (sourceOffset < columnMajorValues.length) {
    for (let columnIndex = 0; columnIndex < matrixInfo.columns; columnIndex++) {
      physicalValues.set(
        columnMajorValues.subarray(sourceOffset, sourceOffset + matrixInfo.rows),
        targetOffset
      );
      sourceOffset += matrixInfo.rows;
      targetOffset += matrixInfo.columnStride;
    }
  }

  return physicalValues;
}

function copyMatrixValues<T extends Float32Array | Float64Array>(values: T): T {
  return (
    values instanceof Float64Array ? new Float64Array(values) : new Float32Array(values)
  ) as T;
}

function createMatrixValuesArray<T extends Float32Array | Float64Array>(
  values: T,
  length: number
): T {
  return (
    values instanceof Float64Array ? new Float64Array(length) : new Float32Array(length)
  ) as T;
}
