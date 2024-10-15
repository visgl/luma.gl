// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
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
    throw new Error(message);
  }
}

export function findGeometryColumnIndex(
  schema: arrow.Schema,
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

function isDataInterleavedCoords(
  data: arrow.Data
): data is arrow.Data<arrow.FixedSizeList<arrow.Float64>> {
  // TODO: also check 2 or 3d? Float64?
  return data.type instanceof arrow.FixedSizeList;
}

function isDataSeparatedCoords(
  data: arrow.Data
): data is arrow.Data<arrow.Struct<{x: arrow.Float64; y: arrow.Float64}>> {
  // TODO: also check child names? Float64?
  return data.type instanceof arrow.Struct;
}

/**
 * Convert geoarrow Struct coordinates to FixedSizeList coords
 *
 * The GeoArrow spec allows for either separated or interleaved coords, but at
 * this time deck.gl only supports interleaved.
 */
// TODO: this hasn't been tested yet
export function convertStructToFixedSizeList(
  coords:
    | arrow.Data<arrow.FixedSizeList<arrow.Float64>>
    | arrow.Data<arrow.Struct<{x: arrow.Float64; y: arrow.Float64}>>
): arrow.Data<arrow.FixedSizeList<arrow.Float64>> {
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

    const childDataType = new arrow.Float64();
    const dataType = new arrow.FixedSizeList(2, new arrow.Field('coords', childDataType));

    const interleavedCoordsData = arrow.makeData({
      type: childDataType,
      length: interleavedCoords.length
    });

    const data = arrow.makeData({
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
export function getGeometryVector(
  table: arrow.Table,
  geoarrowTypeName: string
): arrow.Vector | null {
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
export function validateVectorAccessors(table: arrow.Table, vectorAccessors: arrow.Vector[]) {
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

export function validateColorVector(vector: arrow.Vector) {
  // Assert the color vector is a FixedSizeList
  assert(arrow.DataType.isFixedSizeList(vector.type));

  // Assert it has 3 or 4 values
  assert(vector.type.listSize === 3 || vector.type.listSize === 4);

  // Assert the child type is an integer
  assert(arrow.DataType.isInt(vector.type.children[0]));

  // Assert the child type is a Uint8
  // @ts-ignore
  // Property 'type' does not exist on type 'Int_<Ints>'. Did you mean 'TType'?
  assert(vector.type.children[0].type.bitWidth === 8);
}

export function isPointVector(vector: arrow.Vector): vector is arrow.Vector<ArrowPoint> {
  // Check FixedSizeList
  if (!arrow.DataType.isFixedSizeList(vector.type)) {
    return false;
  }

  // Check list size of 2 or 3
  if (vector.type.listSize !== 2 && vector.type.listSize !== 3) {
    return false;
  }

  // Check child of FixedSizeList is floating type
  if (!arrow.DataType.isFloat(vector.type.children[0])) {
    return false;
  }

  return true;
}

export function isLineStringVector(vector: arrow.Vector): vector is arrow.Vector<ArrowLineString> {
  // Check the outer vector is a List
  if (!arrow.DataType.isList(vector.type)) {
    return false;
  }

  // Check the child is a point vector
  if (!isPointVector(vector.getChildAt(0)!)) {
    return false;
  }

  return true;
}

export function isPolygonVector(vector: arrow.Vector): vector is arrow.Vector<ArrowPolygon> {
  // Check the outer vector is a List
  if (!arrow.DataType.isList(vector.type)) {
    return false;
  }

  // Check the child is a linestring vector
  if (!isLineStringVector(vector.getChildAt(0)!)) {
    return false;
  }

  return true;
}

export function isMultiPointVector(vector: arrow.Vector): vector is arrow.Vector<ArrowMultiPoint> {
  // Check the outer vector is a List
  if (!arrow.DataType.isList(vector.type)) {
    return false;
  }

  // Check the child is a point vector
  if (!isPointVector(vector.getChildAt(0)!)) {
    return false;
  }

  return true;
}

export function isMultiLineStringVector(vector: arrow.Vector): vector is arrow.Vector<ArrowMultiLineString> {
  // Check the outer vector is a List
  if (!arrow.DataType.isList(vector.type)) {
    return false;
  }

  // Check the child is a linestring vector
  if (!isLineStringVector(vector.getChildAt(0)!)) {
    return false;
  }

  return true;
}

export function isMultiPolygonVector(vector: arrow.Vector): vector is arrow.Vector<ArrowMultiPolygon> {
  // Check the outer vector is a List
  if (!arrow.DataType.isList(vector.type)) {
    return false;
  }

  // Check the child is a polygon vector
  if (!isPolygonVector(vector.getChildAt(0)!)) {
    return false;
  }

  return true;
}

export function validatePointType(type: arrow.DataType): type is ArrowPoint {
  // Assert the point vector is a FixedSizeList
  // TODO: support struct
  assert(arrow.DataType.isFixedSizeList(type));

  // Assert it has 2 or 3 values
  assert(type.listSize === 2 || type.listSize === 3);

  // Assert the child type is a float
  assert(arrow.DataType.isFloat(type.children[0]));

  return true;
}

export function validateLineStringType(type: arrow.DataType): type is ArrowLineString {
  // Assert the outer vector is a List
  assert(arrow.DataType.isList(type));

  // Assert its inner vector is a point layout
  validatePointType(type.children[0].type);

  return true;
}

export function validatePolygonType(type: arrow.DataType): type is ArrowPolygon {
  // Assert the outer vector is a List
  assert(arrow.DataType.isList(type));

  // Assert its inner vector is a linestring layout
  validateLineStringType(type.children[0].type);

  return true;
}

// Note: this is the same as validateLineStringType
export function validateMultiPointType(type: arrow.DataType): type is ArrowMultiPoint {
  // Assert the outer vector is a List
  assert(arrow.DataType.isList(type));

  // Assert its inner vector is a point layout
  validatePointType(type.children[0].type);

  return true;
}

export function validateMultiLineStringType(type: arrow.DataType): type is ArrowPolygon {
  // Assert the outer vector is a List
  assert(arrow.DataType.isList(type));

  // Assert its inner vector is a linestring layout
  validateLineStringType(type.children[0].type);

  return true;
}

export function validateMultiPolygonType(type: arrow.DataType): type is ArrowMultiPolygon {
  // Assert the outer vector is a List
  assert(arrow.DataType.isList(type));

  // Assert its inner vector is a linestring layout
  validatePolygonType(type.children[0].type);

  return true;
}

export function getPointChild(data: arrow.Data<ArrowPoint>): arrow.Data<arrow.Float> {
  // @ts-expect-error
  return data.children[0];
}

export function getLineStringChild(data: arrow.Data<ArrowLineString>): arrow.Data<ArrowPoint> {
  // @ts-expect-error
  return data.children[0];
}

export function getPolygonChild(data: arrow.Data<ArrowPolygon>): arrow.Data<ArrowLineString> {
  // @ts-expect-error
  return data.children[0];
}

export function getMultiPointChild(data: arrow.Data<ArrowMultiPoint>): arrow.Data<ArrowPoint> {
  // @ts-expect-error
  return data.children[0];
}

export function getMultiLineStringChild(data: arrow.Data<ArrowMultiLineString>): arrow.Data<ArrowLineString> {
  // @ts-expect-error
  return data.children[0];
}

export function getMultiPolygonChild(data: arrow.Data<ArrowMultiPolygon>): arrow.Data<ArrowPolygon> {
  // @ts-expect-error
  return data.children[0];
}
