// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Data,
  DataType,
  Field,
  FixedSizeList,
  Float,
  Float64,
  Schema,
  Struct,
  Table,
  Vector,
  makeData
} from 'apache-arrow';
import {
  ArrowPoint,
  ArrowMultiPoint,
  ArrowLineString,
  ArrowMultiLineString,
  ArrowPolygon,
  ArrowMultiPolygon
} from './geoarrow-types';

function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    const error = new Error(message);
    Error.captureStackTrace?.(error, assert);
    throw error;
  }
}

export function findGeometryColumnIndex(
  schema: Schema,
  extensionName: string,
  geometryColumnName?: string | null
): number | null {
  const index = schema.fields.findIndex(
    field =>
      field.name === geometryColumnName ||
      field.metadata.get('ARROW:extension:name') === extensionName
  );
  return index !== -1 ? index : null;
}

/**
 * Returns `true` if the input is a reference to a column in the table
 */
export function isColumnReference(input: any): input is string {
  return typeof input === 'string';
}

function isDataInterleavedCoords(data: Data): data is Data<FixedSizeList<Float64>> {
  // TODO: also check 2 or 3d? Float64?
  return data.type instanceof FixedSizeList;
}

function isDataSeparatedCoords(data: Data): data is Data<Struct<{x: Float64; y: Float64}>> {
  // TODO: also check child names? Float64?
  return data.type instanceof Struct;
}

/**
 * Convert geoarrow Struct coordinates to FixedSizeList coords
 *
 * The GeoArrow spec allows for either separated or interleaved coords, but at
 * this time deck.gl only supports interleaved.
 */
// TODO: this hasn't been tested yet
export function convertStructToFixedSizeList(
  coords: Data<FixedSizeList<Float64>> | Data<Struct<{x: Float64; y: Float64}>>
): Data<FixedSizeList<Float64>> {
  if (isDataInterleavedCoords(coords)) {
    return coords;
  }
  if (isDataSeparatedCoords(coords)) {
    // TODO: support 3d
    const interleavedCoords = new Float64Array(coords.length * 2);
    const [xChild, yChild] = coords.children;
    for (let i = 0; i < coords.length; i++) {
      interleavedCoords[i * 2] = xChild.values[i];
      interleavedCoords[i * 2 + 1] = yChild.values[i];
    }

    const childDataType = new Float64();
    const dataType = new FixedSizeList(2, new Field('coords', childDataType));

    const interleavedCoordsData = makeData({
      type: childDataType,
      length: interleavedCoords.length
    });

    const data = makeData({
      type: dataType,
      length: coords.length,
      nullCount: coords.nullCount,
      nullBitmap: coords.nullBitmap,
      child: interleavedCoordsData
    });
    return data;
  }

  throw new Error('data');
}

/**
 * Get a geometry vector with the specified extension type name from the table.
 */
export function getGeometryVector(table: Table, geoarrowTypeName: string): Vector | null {
  const geometryColumnIdx = findGeometryColumnIndex(table.schema, geoarrowTypeName);

  if (geometryColumnIdx === null) {
    return null;
    // throw new Error(`No column found with extension type ${geoarrowTypeName}`);
  }

  return table.getChildAt(geometryColumnIdx);
}

/**
 * Provide validation for accessors provided
 *
 * - Assert that all vectors have the same number of chunks as the main table
 * - Assert that all chunks in each vector have the same number of rows as the
 *   relevant batch in the main table.
 *
 */
export function validateVectorAccessors(table: Table, vectorAccessors: Vector[]) {
  // Check the same number of chunks as the table's batches
  for (const vectorAccessor of vectorAccessors) {
    assert(table.batches.length === vectorAccessor.data.length);
  }

  // Check that each table batch/vector data has the same number of rows
  for (const vectorAccessor of vectorAccessors) {
    for (let i = 0; i < table.batches.length; i++) {
      assert(table.batches[i].numRows === vectorAccessor.data[i].length);
    }
  }
}

export function validateColorVector(vector: Vector) {
  // Assert the color vector is a FixedSizeList
  assert(DataType.isFixedSizeList(vector.type));

  // Assert it has 3 or 4 values
  assert(vector.type.listSize === 3 || vector.type.listSize === 4);

  // Assert the child type is an integer
  assert(DataType.isInt(vector.type.children[0]));

  // Assert the child type is a Uint8
  // @ts-ignore
  // Property 'type' does not exist on type 'Int_<Ints>'. Did you mean 'TType'?
  assert(vector.type.children[0].type.bitWidth === 8);
}

export function isPointVector(vector: Vector): vector is Vector<ArrowPoint> {
  // Check FixedSizeList
  if (!DataType.isFixedSizeList(vector.type)) {
    return false;
  }

  // Check list size of 2 or 3
  if (vector.type.listSize !== 2 && vector.type.listSize !== 3) {
    return false;
  }

  // Check child of FixedSizeList is floating type
  if (!DataType.isFloat(vector.type.children[0])) {
    return false;
  }

  return true;
}

export function isLineStringVector(vector: Vector): vector is Vector<ArrowLineString> {
  // Check the outer vector is a List
  if (!DataType.isList(vector.type)) {
    return false;
  }

  // Check the child is a point vector
  if (!isPointVector(vector.getChildAt(0)!)) {
    return false;
  }

  return true;
}

export function isPolygonVector(vector: Vector): vector is Vector<ArrowPolygon> {
  // Check the outer vector is a List
  if (!DataType.isList(vector.type)) {
    return false;
  }

  // Check the child is a linestring vector
  if (!isLineStringVector(vector.getChildAt(0)!)) {
    return false;
  }

  return true;
}

export function isMultiPointVector(vector: Vector): vector is Vector<ArrowMultiPoint> {
  // Check the outer vector is a List
  if (!DataType.isList(vector.type)) {
    return false;
  }

  // Check the child is a point vector
  if (!isPointVector(vector.getChildAt(0)!)) {
    return false;
  }

  return true;
}

export function isMultiLineStringVector(vector: Vector): vector is Vector<ArrowMultiLineString> {
  // Check the outer vector is a List
  if (!DataType.isList(vector.type)) {
    return false;
  }

  // Check the child is a linestring vector
  if (!isLineStringVector(vector.getChildAt(0)!)) {
    return false;
  }

  return true;
}

export function isMultiPolygonVector(vector: Vector): vector is Vector<ArrowMultiPolygon> {
  // Check the outer vector is a List
  if (!DataType.isList(vector.type)) {
    return false;
  }

  // Check the child is a polygon vector
  if (!isPolygonVector(vector.getChildAt(0)!)) {
    return false;
  }

  return true;
}

export function validatePointType(type: DataType): type is ArrowPoint {
  // Assert the point vector is a FixedSizeList
  // TODO: support struct
  assert(DataType.isFixedSizeList(type));

  // Assert it has 2 or 3 values
  assert(type.listSize === 2 || type.listSize === 3);

  // Assert the child type is a float
  assert(DataType.isFloat(type.children[0]));

  return true;
}

export function validateLineStringType(type: DataType): type is ArrowLineString {
  // Assert the outer vector is a List
  assert(DataType.isList(type));

  // Assert its inner vector is a point layout
  validatePointType(type.children[0].type);

  return true;
}

export function validatePolygonType(type: DataType): type is ArrowPolygon {
  // Assert the outer vector is a List
  assert(DataType.isList(type));

  // Assert its inner vector is a linestring layout
  validateLineStringType(type.children[0].type);

  return true;
}

// Note: this is the same as validateLineStringType
export function validateMultiPointType(type: DataType): type is ArrowMultiPoint {
  // Assert the outer vector is a List
  assert(DataType.isList(type));

  // Assert its inner vector is a point layout
  validatePointType(type.children[0].type);

  return true;
}

export function validateMultiLineStringType(type: DataType): type is ArrowPolygon {
  // Assert the outer vector is a List
  assert(DataType.isList(type));

  // Assert its inner vector is a linestring layout
  validateLineStringType(type.children[0].type);

  return true;
}

export function validateMultiPolygonType(type: DataType): type is ArrowMultiPolygon {
  // Assert the outer vector is a List
  assert(DataType.isList(type));

  // Assert its inner vector is a linestring layout
  validatePolygonType(type.children[0].type);

  return true;
}

export function getPointChild(data: Data<ArrowPoint>): Data<Float> {
  // @ts-expect-error
  return data.children[0];
}

export function getLineStringChild(data: Data<ArrowLineString>): Data<ArrowPoint> {
  // @ts-expect-error
  return data.children[0];
}

export function getPolygonChild(data: Data<ArrowPolygon>): Data<ArrowLineString> {
  // @ts-expect-error
  return data.children[0];
}

export function getMultiPointChild(data: Data<ArrowMultiPoint>): Data<ArrowPoint> {
  // @ts-expect-error
  return data.children[0];
}

export function getMultiLineStringChild(data: Data<ArrowMultiLineString>): Data<ArrowLineString> {
  // @ts-expect-error
  return data.children[0];
}

export function getMultiPolygonChild(data: Data<ArrowMultiPolygon>): Data<ArrowPolygon> {
  // @ts-expect-error
  return data.children[0];
}
