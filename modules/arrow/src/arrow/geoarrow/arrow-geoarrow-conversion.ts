// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  convertGeoArrowColumn,
  interleaveGeoArrowCoordinates,
  isGeoArrowValueValid,
  sliceGeoArrowColumn,
  type GeoArrowColumn,
  type GeoArrowDimension,
  type GeoArrowEncoding,
  type GeoArrowSerialized
} from '@math.gl/geoarrow';
import {decodeGeoArrowWKB, decodeGeoArrowWKT} from '@math.gl/geoarrow/wkb';
import {parseWKB} from '@math.gl/wkb';
import {
  Data,
  DataType,
  Field,
  RecordBatch,
  Schema,
  Struct,
  Table,
  Vector,
  type DataType as ArrowDataType,
  type TypeMap
} from 'apache-arrow';
import {
  makeArrowVectorFromGeoArrowColumn,
  makeGeoArrowColumnFromArrowVector
} from './arrow-geoarrow-adapter';

export type GeoArrowNativeEncoding =
  | 'geoarrow.geometry'
  | 'geoarrow.point'
  | 'geoarrow.linestring'
  | 'geoarrow.polygon'
  | 'geoarrow.multipoint'
  | 'geoarrow.multilinestring'
  | 'geoarrow.multipolygon';

export type GeoArrowSerializedEncoding = 'geoarrow.wkb' | 'geoarrow.wkt';

export type GeoArrowInterleaveOptions = {
  /** Optional single geometry column to convert. Defaults to native GeoArrow metadata columns. */
  geometryColumn?: string;
  /** Optional geometry columns to convert. Defaults to native GeoArrow metadata columns. */
  geometryColumns?: string[];
};

export type GeoArrowDenseUnionVectorOptions = {
  /** Source encoding. Defaults to Binary -> geoarrow.wkb and Utf8 -> geoarrow.wkt. */
  encoding?: GeoArrowSerializedEncoding;
};

export type GeoArrowDenseUnionTableOptions = GeoArrowDenseUnionVectorOptions & {
  /** Optional single geometry column to convert. Defaults to GeoArrow WKB/WKT metadata columns. */
  geometryColumn?: string;
  /** Optional geometry columns to convert. Defaults to GeoArrow WKB/WKT metadata columns. */
  geometryColumns?: string[];
};

const GEOARROW_EXTENSION_NAME_KEY = 'ARROW:extension:name';
const GEOARROW_EXTENSION_METADATA_KEY = 'ARROW:extension:metadata';
const GEOARROW_GEOMETRY_EXTENSION_NAME = 'geoarrow.geometry';
const NATIVE_GEOARROW_ENCODINGS = new Set<GeoArrowNativeEncoding>([
  'geoarrow.geometry',
  'geoarrow.point',
  'geoarrow.linestring',
  'geoarrow.polygon',
  'geoarrow.multipoint',
  'geoarrow.multilinestring',
  'geoarrow.multipolygon'
]);
const GEOARROW_SERIALIZED_ENCODINGS = new Set<GeoArrowSerializedEncoding>([
  'geoarrow.wkb',
  'geoarrow.wkt'
]);
const textDecoder = new TextDecoder();

/** Converts separated GeoArrow Struct coordinates in a vector to interleaved FixedSizeList rows. */
export function convertGeoArrowVectorToInterleaved<T extends ArrowDataType>(
  vector: Vector<T>,
  options: {encoding?: GeoArrowNativeEncoding} = {}
): Vector {
  const column = makeGeoArrowColumnFromArrowVector(vector, {encoding: options.encoding});
  const interleavedColumn = interleaveGeoArrowCoordinates(column);
  return interleavedColumn === column
    ? vector
    : makeArrowVectorFromGeoArrowColumn(interleavedColumn);
}

/** Converts selected native GeoArrow table geometry columns to interleaved coordinates. */
export function convertGeoArrowTableToInterleaved<T extends TypeMap>(
  table: Table<T>,
  options: GeoArrowInterleaveOptions = {}
): Table {
  const geometryColumns = resolveGeoArrowColumns(table, options, 'native');
  if (geometryColumns.length === 0) return table;

  const convertedVectors = new Map<string, Vector>();
  const convertedFields = new Map<string, Field>();
  for (const geometryColumn of geometryColumns) {
    const field = getTableField(table, geometryColumn);
    const vector = table.getChild(geometryColumn);
    if (!field || !vector) {
      throw new Error(`GeoArrow interleaving could not resolve column "${geometryColumn}"`);
    }
    const encoding = getFieldEncoding(field) as GeoArrowNativeEncoding | null;
    const column = makeGeoArrowColumnFromArrowVector(vector, {
      encoding: encoding ?? undefined,
      metadata: getFieldExtensionMetadata(field)
    });
    const interleavedColumn = interleaveGeoArrowCoordinates(column);
    const convertedVector =
      interleavedColumn === column ? vector : makeArrowVectorFromGeoArrowColumn(interleavedColumn);
    convertedVectors.set(geometryColumn, convertedVector);
    convertedFields.set(
      geometryColumn,
      new Field(field.name, convertedVector.type, field.nullable, field.metadata)
    );
  }
  if ([...convertedVectors].every(([name, vector]) => vector === table.getChild(name))) {
    return table;
  }
  return makeTableWithConvertedVectors(table, convertedVectors, convertedFields, 'interleaving');
}

/** Async compatibility entrypoint. Worker scheduling is now an explicit application concern. */
export async function convertGeoArrowTableToInterleavedAsync<T extends TypeMap>(
  table: Table<T>,
  options: GeoArrowInterleaveOptions = {}
): Promise<Table> {
  await Promise.resolve();
  return convertGeoArrowTableToInterleaved(table, options);
}

/** Converts one GeoArrow WKB/WKT vector into a native GeoArrow DenseUnion vector. */
export function convertGeoArrowVectorToDenseUnion<T extends ArrowDataType>(
  vector: Vector<T>,
  options: GeoArrowDenseUnionVectorOptions = {}
): Vector {
  if (DataType.isDenseUnion(vector.type)) return vector;
  const encoding = resolveSerializedEncoding(vector, options);
  const dimension = inferSerializedGeoArrowDimension(vector, encoding);
  const sourceColumn = makeGeoArrowColumnFromArrowVector(vector, {
    encoding,
    dimension,
    coordinateLayout: null
  });
  const decodedColumn =
    encoding === 'geoarrow.wkb' ? decodeGeoArrowWKB(sourceColumn) : decodeGeoArrowWKT(sourceColumn);
  assertNoGeometryCollections(decodedColumn);
  const unionColumn = convertGeoArrowColumn(decodedColumn, {encoding: 'geoarrow.geometry'});
  const chunkedColumn = splitGeoArrowColumn(
    unionColumn,
    vector.data.map(data => data.length)
  );
  return makeArrowVectorFromGeoArrowColumn(chunkedColumn);
}

/** Converts selected GeoArrow WKB/WKT table geometry columns to native GeoArrow DenseUnion. */
export function convertGeoArrowTableToDenseUnion<T extends TypeMap>(
  table: Table<T>,
  options: GeoArrowDenseUnionTableOptions = {}
): Table {
  const geometryColumns = resolveGeoArrowColumns(table, options, 'serialized');
  if (geometryColumns.length === 0) return table;

  const convertedVectors = new Map<string, Vector>();
  const convertedFields = new Map<string, Field>();
  for (const geometryColumn of geometryColumns) {
    const field = getTableField(table, geometryColumn);
    const vector = table.getChild(geometryColumn);
    if (!field || !vector) {
      throw new Error(
        `GeoArrow dense-union conversion could not resolve column "${geometryColumn}"`
      );
    }
    const encoding =
      (getFieldEncoding(field) as GeoArrowSerializedEncoding | null) ?? options.encoding;
    const convertedVector = convertGeoArrowVectorToDenseUnion(vector, {encoding});
    const metadata = new Map(field.metadata);
    metadata.set(GEOARROW_EXTENSION_NAME_KEY, GEOARROW_GEOMETRY_EXTENSION_NAME);
    convertedVectors.set(geometryColumn, convertedVector);
    convertedFields.set(
      geometryColumn,
      new Field(field.name, convertedVector.type, field.nullable, metadata)
    );
  }
  return makeTableWithConvertedVectors(table, convertedVectors, convertedFields, 'dense-union');
}

function resolveSerializedEncoding<T extends ArrowDataType>(
  vector: Vector<T>,
  options: GeoArrowDenseUnionVectorOptions
): GeoArrowSerializedEncoding {
  if (options.encoding) return options.encoding;
  if (DataType.isBinary(vector.type)) return 'geoarrow.wkb';
  if (DataType.isUtf8(vector.type)) return 'geoarrow.wkt';
  throw new Error('GeoArrow dense-union conversion requires Binary WKB or Utf8 WKT input');
}

function inferSerializedGeoArrowDimension(
  vector: Vector,
  encoding: GeoArrowSerializedEncoding
): GeoArrowDimension {
  const column = makeGeoArrowColumnFromArrowVector(vector, {
    encoding,
    dimension: 'xy',
    coordinateLayout: null
  });
  let dimension: GeoArrowDimension = 'xy';
  for (const chunk of column.chunks) {
    const serialized = chunk as GeoArrowSerialized;
    for (let rowIndex = 0; rowIndex < serialized.length; rowIndex++) {
      if (!isGeoArrowValueValid(serialized.validity, rowIndex)) continue;
      const bytes = getSerializedBytes(serialized, rowIndex);
      const rowDimension =
        encoding === 'geoarrow.wkb'
          ? (parseWKB(bytes).dimension as GeoArrowDimension)
          : inferWKTDimension(textDecoder.decode(bytes));
      dimension = mergeGeoArrowDimensions(dimension, rowDimension);
    }
  }
  return dimension;
}

function getSerializedBytes(array: GeoArrowSerialized, rowIndex: number): Uint8Array {
  const offsetIndex = (array.offset ?? 0) + rowIndex;
  const offsetBase = Number(array.offsetBase ?? 0);
  const first = Number(array.offsets[offsetIndex]) - offsetBase;
  const last = Number(array.offsets[offsetIndex + 1]) - offsetBase;
  return array.values.subarray(first, last);
}

function inferWKTDimension(wkt: string): GeoArrowDimension {
  const dimensionToken = /^\s*[a-z]+\s+(ZM|Z|M)\b/i.exec(wkt)?.[1]?.toUpperCase();
  if (dimensionToken === 'ZM') return 'xyzm';
  if (dimensionToken === 'M') return 'xym';
  if (dimensionToken === 'Z') return 'xyz';
  return 'xy';
}

function mergeGeoArrowDimensions(
  left: GeoArrowDimension,
  right: GeoArrowDimension
): GeoArrowDimension {
  if (left === right) return left;
  if (left === 'xy') return right;
  if (right === 'xy') return left;
  if (left === 'xyzm' || right === 'xyzm') return 'xyzm';
  return left === 'xym' && right === 'xym' ? 'xym' : 'xyzm';
}

function assertNoGeometryCollections(column: GeoArrowColumn): void {
  if (
    column.encoding === 'geoarrow.geometrycollection' ||
    column.chunks.some(
      chunk =>
        chunk.kind === 'dense-union' &&
        chunk.children.some(child => child.encoding === 'geoarrow.geometrycollection')
    )
  ) {
    throw new Error(
      'GeoArrow WKB/WKT GeometryCollection conversion requires geoarrow.geometrycollection output, not geoarrow.geometry DenseUnion output.'
    );
  }
}

function splitGeoArrowColumn(column: GeoArrowColumn, chunkLengths: number[]): GeoArrowColumn {
  if (chunkLengths.length === column.chunks.length) return column;
  const chunks = [];
  let rowOffset = 0;
  for (const chunkLength of chunkLengths) {
    const slicedColumn = sliceGeoArrowColumn(column, rowOffset, rowOffset + chunkLength);
    if (slicedColumn.chunks.length !== 1) {
      throw new Error('GeoArrow conversion could not preserve Arrow chunk boundaries');
    }
    chunks.push(slicedColumn.chunks[0]);
    rowOffset += chunkLength;
  }
  return {...column, chunks};
}

function resolveGeoArrowColumns<T extends TypeMap>(
  table: Table<T>,
  options: GeoArrowInterleaveOptions | GeoArrowDenseUnionTableOptions,
  kind: 'native' | 'serialized'
): string[] {
  if (options.geometryColumn && options.geometryColumns?.length) {
    throw new Error('Specify only one of geometryColumn or geometryColumns');
  }
  if (options.geometryColumn) {
    assertTableColumnExists(table, options.geometryColumn, kind);
    return [options.geometryColumn];
  }
  if (options.geometryColumns?.length) {
    for (const column of options.geometryColumns) assertTableColumnExists(table, column, kind);
    return options.geometryColumns;
  }
  return table.schema.fields
    .filter(field => {
      const encoding = getFieldEncoding(field);
      return kind === 'native'
        ? NATIVE_GEOARROW_ENCODINGS.has(encoding as GeoArrowNativeEncoding)
        : GEOARROW_SERIALIZED_ENCODINGS.has(encoding as GeoArrowSerializedEncoding);
    })
    .map(field => field.name);
}

function assertTableColumnExists<T extends TypeMap>(
  table: Table<T>,
  columnName: string,
  kind: 'native' | 'serialized'
): void {
  if (!table.getChild(columnName)) {
    const operation = kind === 'native' ? 'interleaving' : 'dense-union conversion';
    throw new Error(`GeoArrow ${operation} could not find column "${columnName}"`);
  }
}

function getFieldEncoding(field: Field): GeoArrowEncoding | null {
  const extensionName = field.metadata.get(GEOARROW_EXTENSION_NAME_KEY)?.toLowerCase();
  return extensionName?.startsWith('geoarrow.') ? (extensionName as GeoArrowEncoding) : null;
}

function getFieldExtensionMetadata(field: Field): Readonly<Record<string, unknown>> | undefined {
  const metadata = field.metadata.get(GEOARROW_EXTENSION_METADATA_KEY);
  if (!metadata) return undefined;
  try {
    return JSON.parse(metadata) as Record<string, unknown>;
  } catch {
    return {raw: metadata};
  }
}

function getTableField<T extends TypeMap>(table: Table<T>, columnName: string): Field | null {
  return table.schema.fields.find(field => field.name === columnName) ?? null;
}

function makeTableWithConvertedVectors<T extends TypeMap>(
  table: Table<T>,
  convertedVectors: Map<string, Vector>,
  convertedFields: Map<string, Field>,
  operation: string
): Table {
  const nextFields = table.schema.fields.map(field => convertedFields.get(field.name) ?? field);
  const nextSchema = new Schema(nextFields, table.schema.metadata);
  const nextBatches = table.batches.map((recordBatch, batchIndex) => {
    const children = nextFields.map((field, fieldIndex) => {
      const convertedVector = convertedVectors.get(field.name);
      if (!convertedVector) return recordBatch.data.children[fieldIndex];
      const convertedData = convertedVector.data[batchIndex];
      if (!convertedData) {
        throw new Error(`GeoArrow ${operation} chunk mismatch for column "${field.name}"`);
      }
      return convertedData;
    });
    const recordBatchData = new Data(
      new Struct(nextFields),
      recordBatch.data.offset,
      recordBatch.numRows,
      recordBatch.data.nullCount,
      recordBatch.data.buffers,
      children
    );
    return new RecordBatch(nextSchema, recordBatchData);
  });
  return new Table(nextSchema, nextBatches);
}
