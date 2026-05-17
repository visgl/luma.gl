// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

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

/** Options for Arrow matrix vector construction. */
export type ArrowMatrixVectorOptions = {
  /** Storage order of the supplied logical matrix values. Defaults to `column-major`. */
  order?: ArrowMatrixOrder;
  /** Physical buffer layout of the materialized Arrow rows. Defaults to `wgsl-storage`. */
  layout?: ArrowMatrixLayout;
};

/** Matrix metadata retained in the Arrow type so attribute-layout synthesis can stay explicit. */
export type ArrowMatrixVectorInfo = {
  shape: ArrowMatrixShape;
  columns: 2 | 3 | 4;
  rows: 2 | 3 | 4;
  layout: ArrowMatrixLayout;
  logicalComponentCount: number;
  physicalComponentCount: number;
  columnStride: number;
  byteStride: number;
};

/** Arrow row type used for one `mat2x2<f32>` value. */
export type ArrowFloat32Matrix2x2 = arrow.FixedSizeList<arrow.Float32>;
/** Arrow row type used for one `mat2x3<f32>` value. */
export type ArrowFloat32Matrix2x3 = arrow.FixedSizeList<arrow.Float32>;
/** Arrow row type used for one `mat3x2<f32>` value. */
export type ArrowFloat32Matrix3x2 = arrow.FixedSizeList<arrow.Float32>;
/** Arrow row type used for one `mat3x3<f32>` value. */
export type ArrowFloat32Matrix3x3 = arrow.FixedSizeList<arrow.Float32>;
/** Arrow row type used for one `mat4x3<f32>` value. */
export type ArrowFloat32Matrix4x3 = arrow.FixedSizeList<arrow.Float32>;
/** Arrow row type used for one `mat3x4<f32>` value. */
export type ArrowFloat32Matrix3x4 = arrow.FixedSizeList<arrow.Float32>;
/** Arrow row type used for one `mat4x4<f32>` value. */
export type ArrowFloat32Matrix4x4 = arrow.FixedSizeList<arrow.Float32>;

const MATRIX_SHAPE_METADATA_KEY = 'luma.gl:matrix-shape';
const MATRIX_LAYOUT_METADATA_KEY = 'luma.gl:matrix-layout';

const makeFloat32Data = arrow.makeData as (props: {
  type: arrow.Float32;
  length: number;
  data: Float32Array;
}) => arrow.Data<arrow.Float32>;

const makeFloat32FixedSizeListData = arrow.makeData as (props: {
  type: arrow.FixedSizeList<arrow.Float32>;
  length: number;
  nullCount: number;
  nullBitmap: null;
  child: arrow.Data<arrow.Float32>;
}) => arrow.Data<arrow.FixedSizeList<arrow.Float32>>;

/** Create a matrix Arrow vector for one supported WGSL `matCxR<f32>` shape. */
export function makeArrowMatrixVector(
  shape: ArrowMatrixShape,
  values: Float32Array,
  options?: ArrowMatrixVectorOptions
): arrow.Vector<arrow.FixedSizeList<arrow.Float32>> {
  const matrixInfo = getMatrixShapeInfo(shape, options?.layout || 'wgsl-storage');
  if (values.length % matrixInfo.logicalComponentCount !== 0) {
    throw new Error(
      `Matrix values length ${values.length} must be divisible by ${matrixInfo.logicalComponentCount}`
    );
  }

  const columnMajorValues =
    options?.order === 'row-major'
      ? transposeRowMajorMatrices(values, matrixInfo)
      : new Float32Array(values);
  const physicalValues = materializeMatrixValues(columnMajorValues, matrixInfo);
  const childType = new arrow.Float32();
  const childData = makeFloat32Data({
    type: childType,
    length: physicalValues.length,
    data: physicalValues
  });
  const valueField = new arrow.Field(
    'value',
    childType,
    false,
    new Map([
      [MATRIX_SHAPE_METADATA_KEY, matrixInfo.shape],
      [MATRIX_LAYOUT_METADATA_KEY, matrixInfo.layout]
    ])
  );
  const matrixType = new arrow.FixedSizeList(matrixInfo.physicalComponentCount, valueField);
  const matrixData = makeFloat32FixedSizeListData({
    type: matrixType,
    length: physicalValues.length / matrixInfo.physicalComponentCount,
    nullCount: 0,
    nullBitmap: null,
    child: childData
  });

  return arrow.makeVector(matrixData);
}

/** Create a matrix vector for `mat2x2<f32>`. */
export function makeArrowMatrix2x2Vector(
  values: Float32Array,
  options?: ArrowMatrixVectorOptions
): arrow.Vector<ArrowFloat32Matrix2x2> {
  return makeArrowMatrixVector('mat2x2', values, options);
}

/** Create a matrix vector for `mat2x3<f32>`. */
export function makeArrowMatrix2x3Vector(
  values: Float32Array,
  options?: ArrowMatrixVectorOptions
): arrow.Vector<ArrowFloat32Matrix2x3> {
  return makeArrowMatrixVector('mat2x3', values, options);
}

/** Create a matrix vector for `mat3x2<f32>`. */
export function makeArrowMatrix3x2Vector(
  values: Float32Array,
  options?: ArrowMatrixVectorOptions
): arrow.Vector<ArrowFloat32Matrix3x2> {
  return makeArrowMatrixVector('mat3x2', values, options);
}

/** Create a matrix vector for `mat3x3<f32>`. */
export function makeArrowMatrix3x3Vector(
  values: Float32Array,
  options?: ArrowMatrixVectorOptions
): arrow.Vector<ArrowFloat32Matrix3x3> {
  return makeArrowMatrixVector('mat3x3', values, options);
}

/** Create a matrix vector for `mat4x3<f32>`. */
export function makeArrowMatrix4x3Vector(
  values: Float32Array,
  options?: ArrowMatrixVectorOptions
): arrow.Vector<ArrowFloat32Matrix4x3> {
  return makeArrowMatrixVector('mat4x3', values, options);
}

/** Create a matrix vector for `mat3x4<f32>`. */
export function makeArrowMatrix3x4Vector(
  values: Float32Array,
  options?: ArrowMatrixVectorOptions
): arrow.Vector<ArrowFloat32Matrix3x4> {
  return makeArrowMatrixVector('mat3x4', values, options);
}

/** Create a matrix vector for `mat4x4<f32>`. */
export function makeArrowMatrix4x4Vector(
  values: Float32Array,
  options?: ArrowMatrixVectorOptions
): arrow.Vector<ArrowFloat32Matrix4x4> {
  return makeArrowMatrixVector('mat4x4', values, options);
}

/** Recover matrix metadata from an Arrow vector type produced by this helper. */
export function getArrowMatrixVectorInfo(vector: arrow.Vector): ArrowMatrixVectorInfo | null {
  if (!arrow.DataType.isFixedSizeList(vector.type)) {
    return null;
  }
  const metadata = vector.type.children[0]?.metadata;
  const shape = metadata?.get(MATRIX_SHAPE_METADATA_KEY) as ArrowMatrixShape | undefined;
  const layout = metadata?.get(MATRIX_LAYOUT_METADATA_KEY) as ArrowMatrixLayout | undefined;
  if (!shape || !layout) {
    return null;
  }

  const matrixInfo = getMatrixShapeInfo(shape, layout);
  return vector.type.listSize === matrixInfo.physicalComponentCount ? matrixInfo : null;
}

function getMatrixShapeInfo(
  shape: ArrowMatrixShape,
  layout: ArrowMatrixLayout
): ArrowMatrixVectorInfo {
  const [columns, rows] = getMatrixDimensions(shape);
  const logicalComponentCount = columns * rows;
  const columnStride = layout === 'wgsl-storage' && rows === 3 ? 4 : rows;
  const physicalComponentCount = columns * columnStride;

  return {
    shape,
    columns,
    rows,
    layout,
    logicalComponentCount,
    physicalComponentCount,
    columnStride,
    byteStride: physicalComponentCount * Float32Array.BYTES_PER_ELEMENT
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
  values: Float32Array,
  matrixInfo: ArrowMatrixVectorInfo
): Float32Array {
  const columnMajorValues = new Float32Array(values.length);

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
  columnMajorValues: Float32Array,
  matrixInfo: ArrowMatrixVectorInfo
): Float32Array {
  if (matrixInfo.columnStride === matrixInfo.rows) {
    return columnMajorValues;
  }

  const physicalValues = new Float32Array(
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
