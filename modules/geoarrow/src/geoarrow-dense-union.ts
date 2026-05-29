// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Data,
  DataType,
  DenseUnion,
  Field,
  FixedSizeList,
  Float64,
  List,
  RecordBatch,
  Schema,
  Struct,
  Table,
  Vector,
  makeData,
  vectorFromArray,
  type TypeMap
} from 'apache-arrow';

export type GeoArrowSerializedEncoding = 'geoarrow.wkb' | 'geoarrow.wkt';

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

type GeoArrowGeometryKind =
  | 'Point'
  | 'LineString'
  | 'Polygon'
  | 'MultiPoint'
  | 'MultiLineString'
  | 'MultiPolygon'
  | 'GeometryCollection';

type GeoArrowPosition = number[];
type GeoArrowPointGeometry = {type: 'Point'; coordinates: GeoArrowPosition};
type GeoArrowLineStringGeometry = {type: 'LineString'; coordinates: GeoArrowPosition[]};
type GeoArrowPolygonGeometry = {type: 'Polygon'; coordinates: GeoArrowPosition[][]};
type GeoArrowMultiPointGeometry = {type: 'MultiPoint'; coordinates: GeoArrowPosition[]};
type GeoArrowMultiLineStringGeometry = {
  type: 'MultiLineString';
  coordinates: GeoArrowPosition[][];
};
type GeoArrowMultiPolygonGeometry = {
  type: 'MultiPolygon';
  coordinates: GeoArrowPosition[][][];
};
type GeoArrowGeometryCollectionGeometry = {
  type: 'GeometryCollection';
  geometries: GeoArrowGeometry[];
};

type GeoArrowGeometry =
  | GeoArrowPointGeometry
  | GeoArrowLineStringGeometry
  | GeoArrowPolygonGeometry
  | GeoArrowMultiPointGeometry
  | GeoArrowMultiLineStringGeometry
  | GeoArrowMultiPolygonGeometry
  | GeoArrowGeometryCollectionGeometry;

type DenseUnionChildValue = number[] | number[][] | number[][][] | number[][][][] | null;

type DenseUnionConversionPlan = {
  encoding: GeoArrowSerializedEncoding;
  chunkGeometries: (GeoArrowGeometry | null)[][];
  targetDimension: 2 | 3 | 4;
  orderedGeometryKinds: Exclude<GeoArrowGeometryKind, 'GeometryCollection'>[];
  nullCarrierKind: Exclude<GeoArrowGeometryKind, 'GeometryCollection'>;
};

type ParsedWKBGeometry = {
  geometry: GeoArrowGeometry;
  byteOffset: number;
};

type WKBHeader = {
  geometryType: WKBGeometryType;
  dimensions: 2 | 3 | 4;
  littleEndian: boolean;
  byteOffset: number;
};

enum WKBGeometryType {
  Point = 1,
  LineString = 2,
  Polygon = 3,
  MultiPoint = 4,
  MultiLineString = 5,
  MultiPolygon = 6,
  GeometryCollection = 7
}

const GEOARROW_EXTENSION_NAME_KEY = 'ARROW:extension:name';
const GEOARROW_GEOMETRY_EXTENSION_NAME = 'geoarrow.geometry';
const GEOARROW_SERIALIZED_ENCODINGS = new Set<GeoArrowSerializedEncoding>([
  'geoarrow.wkb',
  'geoarrow.wkt'
]);

const EWKB_FLAG_Z = 0x80000000;
const EWKB_FLAG_M = 0x40000000;
const EWKB_FLAG_SRID = 0x20000000;

const WKT_NUMBER_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/;

const textDecoder = new TextDecoder();

/** Converts one GeoArrow WKB/WKT vector into a native GeoArrow DenseUnion vector. */
export function convertGeoArrowVectorToDenseUnion<T extends DataType>(
  vector: Vector<T>,
  options: GeoArrowDenseUnionVectorOptions = {}
): Vector {
  if (DataType.isDenseUnion(vector.type)) {
    return vector;
  }

  const conversionPlan = createDenseUnionConversionPlan(vector, options);
  const unionType = buildGeometryUnionType(
    conversionPlan.targetDimension,
    conversionPlan.orderedGeometryKinds
  );
  const convertedData = conversionPlan.chunkGeometries.map(geometries =>
    createGeometryUnionData(geometries, unionType, conversionPlan)
  );

  return new Vector(convertedData);
}

/** Converts selected GeoArrow WKB/WKT table geometry columns to native GeoArrow DenseUnion. */
export function convertGeoArrowTableToDenseUnion<T extends TypeMap>(
  table: Table<T>,
  options: GeoArrowDenseUnionTableOptions = {}
): Table {
  const geometryColumns = resolveGeoArrowSerializedGeometryColumns(table, options);
  if (geometryColumns.length === 0) {
    return table;
  }

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

    const encoding = getFieldSerializedEncoding(field) || options.encoding;
    const convertedVector = convertGeoArrowVectorToDenseUnion(vector, {encoding});
    convertedVectors.set(geometryColumn, convertedVector);
    convertedFields.set(geometryColumn, createDenseUnionField(field, convertedVector.type));
  }

  return makeTableWithConvertedVectors(table, convertedVectors, convertedFields);
}

function createDenseUnionConversionPlan<T extends DataType>(
  vector: Vector<T>,
  options: GeoArrowDenseUnionVectorOptions
): DenseUnionConversionPlan {
  const encoding = resolveVectorSerializedEncoding(vector, options);
  const chunkGeometries: (GeoArrowGeometry | null)[][] = [];
  const usedGeometryKinds = new Set<Exclude<GeoArrowGeometryKind, 'GeometryCollection'>>();
  let nullCarrierKind: Exclude<GeoArrowGeometryKind, 'GeometryCollection'> | null = null;
  let targetDimension: 2 | 3 | 4 = 2;

  for (const data of vector.data) {
    const chunkVector = new Vector([data]);
    const geometries: (GeoArrowGeometry | null)[] = [];

    for (let rowIndex = 0; rowIndex < chunkVector.length; rowIndex++) {
      const geometry = parseGeoArrowSerializedGeometryValue(chunkVector.get(rowIndex), encoding);
      if (geometry?.type === 'GeometryCollection') {
        throw new Error(
          'GeoArrow WKB/WKT GeometryCollection conversion requires geoarrow.geometrycollection output, not geoarrow.geometry DenseUnion output.'
        );
      }

      geometries.push(geometry);
      if (geometry) {
        usedGeometryKinds.add(geometry.type);
        nullCarrierKind ||= geometry.type;
        targetDimension = getMaxCoordinateDimension(
          targetDimension,
          getGeometryCoordinateDimension(geometry)
        );
      }
    }

    chunkGeometries.push(geometries);
  }

  nullCarrierKind ||= 'Point';
  usedGeometryKinds.add(nullCarrierKind);

  return {
    encoding,
    chunkGeometries,
    targetDimension,
    orderedGeometryKinds: [...usedGeometryKinds].sort(
      (leftGeometryKind, rightGeometryKind) =>
        getUnionTypeId(leftGeometryKind, targetDimension) -
        getUnionTypeId(rightGeometryKind, targetDimension)
    ),
    nullCarrierKind
  };
}

function createGeometryUnionData(
  geometries: (GeoArrowGeometry | null)[],
  unionType: DenseUnion,
  conversionPlan: DenseUnionConversionPlan
): Data<DenseUnion> {
  const typeIds: number[] = [];
  const valueOffsets: number[] = [];
  const childValues = new Map<GeoArrowGeometryKind, DenseUnionChildValue[]>();

  for (const geometryKind of conversionPlan.orderedGeometryKinds) {
    childValues.set(geometryKind, []);
  }

  for (const geometry of geometries) {
    if (geometry?.type === 'GeometryCollection') {
      throw new Error(
        'GeoArrow WKB/WKT GeometryCollection conversion requires geoarrow.geometrycollection output, not geoarrow.geometry DenseUnion output.'
      );
    }
    const geometryKind = geometry?.type || conversionPlan.nullCarrierKind;
    const values = childValues.get(geometryKind);
    if (!values) {
      throw new Error(`GeoArrow dense-union conversion could not resolve ${geometryKind} child`);
    }

    typeIds.push(getUnionTypeId(geometryKind, conversionPlan.targetDimension));
    valueOffsets.push(values.length);
    values.push(
      geometry ? convertGeometryToUnionChildValue(geometry, conversionPlan.targetDimension) : null
    );
  }

  return makeData({
    type: unionType,
    length: geometries.length,
    nullCount: 0,
    typeIds: Int8Array.from(typeIds),
    valueOffsets: Int32Array.from(valueOffsets),
    children: conversionPlan.orderedGeometryKinds.map(
      geometryKind =>
        vectorFromArray(
          childValues.get(geometryKind) || [],
          getUnionChildType(geometryKind, conversionPlan.targetDimension)
        ).data[0]
    )
  });
}

function parseGeoArrowSerializedGeometryValue(
  value: unknown,
  encoding: GeoArrowSerializedEncoding
): GeoArrowGeometry | null {
  if (value === null || value === undefined) {
    return null;
  }

  switch (encoding) {
    case 'geoarrow.wkb':
      return parseWKBGeometry(value);
    case 'geoarrow.wkt':
      return parseWKTGeometry(value);
  }
}

function parseWKBGeometry(value: unknown): GeoArrowGeometry {
  const dataView = createDataView(value);
  const parsedGeometry = parseWKBGeometryAt(dataView, 0);
  return parsedGeometry.geometry;
}

function parseWKBGeometryAt(dataView: DataView, byteOffset: number): ParsedWKBGeometry {
  const header = parseWKBHeader(dataView, byteOffset);
  return parseWKBGeometryBody(dataView, header.byteOffset, header);
}

function parseWKBHeader(dataView: DataView, byteOffset: number): WKBHeader {
  if (byteOffset + 5 > dataView.byteLength) {
    throw new Error('WKB: Geometry header is truncated');
  }

  const endianness = dataView.getUint8(byteOffset);
  if (endianness !== 0 && endianness !== 1) {
    throw new Error(`WKB: Invalid byte order ${endianness}`);
  }
  const littleEndian = endianness === 1;
  byteOffset++;

  const geometryCode = dataView.getUint32(byteOffset, littleEndian);
  byteOffset += 4;

  const hasEWKBZ = (geometryCode & EWKB_FLAG_Z) !== 0;
  const hasEWKBM = (geometryCode & EWKB_FLAG_M) !== 0;
  const hasEWKBSRID = (geometryCode & EWKB_FLAG_SRID) !== 0;
  const hasEWKBFlags = hasEWKBZ || hasEWKBM || hasEWKBSRID;

  let geometryType: WKBGeometryType;
  let dimensions: 2 | 3 | 4 = 2;

  if (hasEWKBFlags) {
    geometryType = validateWKBGeometryType(geometryCode & 0xff);
    dimensions = hasEWKBZ && hasEWKBM ? 4 : hasEWKBZ || hasEWKBM ? 3 : 2;
    if (hasEWKBSRID) {
      byteOffset += 4;
    }
  } else {
    geometryType = validateWKBGeometryType(geometryCode % 1000);
    const dimensionalType = (geometryCode - geometryType) / 1000;
    switch (dimensionalType) {
      case 0:
        dimensions = 2;
        break;
      case 1:
      case 2:
        dimensions = 3;
        break;
      case 3:
        dimensions = 4;
        break;
      default:
        throw new Error(`WKB: Unsupported ISO geometry type ${geometryCode}`);
    }
  }

  return {geometryType, dimensions, littleEndian, byteOffset};
}

function parseWKBGeometryBody(
  dataView: DataView,
  byteOffset: number,
  header: WKBHeader
): ParsedWKBGeometry {
  switch (header.geometryType) {
    case WKBGeometryType.Point:
      return parseWKBPointGeometry(dataView, byteOffset, header.dimensions, header.littleEndian);
    case WKBGeometryType.LineString:
      return parseWKBLineStringGeometry(
        dataView,
        byteOffset,
        header.dimensions,
        header.littleEndian
      );
    case WKBGeometryType.Polygon:
      return parseWKBPolygonGeometry(dataView, byteOffset, header.dimensions, header.littleEndian);
    case WKBGeometryType.MultiPoint:
      return parseWKBMultiPointGeometry(dataView, byteOffset, header.littleEndian);
    case WKBGeometryType.MultiLineString:
      return parseWKBMultiLineStringGeometry(dataView, byteOffset, header.littleEndian);
    case WKBGeometryType.MultiPolygon:
      return parseWKBMultiPolygonGeometry(dataView, byteOffset, header.littleEndian);
    case WKBGeometryType.GeometryCollection:
      return parseWKBGeometryCollectionGeometry(dataView, byteOffset, header.littleEndian);
  }
}

function parseWKBPosition(
  dataView: DataView,
  byteOffset: number,
  dimensions: 2 | 3 | 4,
  littleEndian: boolean
): {position: GeoArrowPosition; byteOffset: number} {
  const position: GeoArrowPosition = [];
  for (let coordinateIndex = 0; coordinateIndex < dimensions; coordinateIndex++) {
    position.push(dataView.getFloat64(byteOffset, littleEndian));
    byteOffset += 8;
  }
  return {position, byteOffset};
}

function parseWKBCoordinateSequence(
  dataView: DataView,
  byteOffset: number,
  dimensions: 2 | 3 | 4,
  littleEndian: boolean
): {coordinates: GeoArrowPosition[]; byteOffset: number} {
  const positionCount = dataView.getUint32(byteOffset, littleEndian);
  byteOffset += 4;

  const coordinates: GeoArrowPosition[] = [];
  for (let positionIndex = 0; positionIndex < positionCount; positionIndex++) {
    const parsedPosition = parseWKBPosition(dataView, byteOffset, dimensions, littleEndian);
    coordinates.push(parsedPosition.position);
    byteOffset = parsedPosition.byteOffset;
  }
  return {coordinates, byteOffset};
}

function parseWKBPointGeometry(
  dataView: DataView,
  byteOffset: number,
  dimensions: 2 | 3 | 4,
  littleEndian: boolean
): ParsedWKBGeometry {
  const parsedPosition = parseWKBPosition(dataView, byteOffset, dimensions, littleEndian);
  return {
    geometry: {type: 'Point', coordinates: parsedPosition.position},
    byteOffset: parsedPosition.byteOffset
  };
}

function parseWKBLineStringGeometry(
  dataView: DataView,
  byteOffset: number,
  dimensions: 2 | 3 | 4,
  littleEndian: boolean
): ParsedWKBGeometry {
  const parsedCoordinates = parseWKBCoordinateSequence(
    dataView,
    byteOffset,
    dimensions,
    littleEndian
  );
  return {
    geometry: {type: 'LineString', coordinates: parsedCoordinates.coordinates},
    byteOffset: parsedCoordinates.byteOffset
  };
}

function parseWKBPolygonGeometry(
  dataView: DataView,
  byteOffset: number,
  dimensions: 2 | 3 | 4,
  littleEndian: boolean
): ParsedWKBGeometry {
  const ringCount = dataView.getUint32(byteOffset, littleEndian);
  byteOffset += 4;

  const coordinates: GeoArrowPosition[][] = [];
  for (let ringIndex = 0; ringIndex < ringCount; ringIndex++) {
    const parsedRing = parseWKBCoordinateSequence(dataView, byteOffset, dimensions, littleEndian);
    coordinates.push(parsedRing.coordinates);
    byteOffset = parsedRing.byteOffset;
  }
  return {geometry: {type: 'Polygon', coordinates}, byteOffset};
}

function parseWKBMultiPointGeometry(
  dataView: DataView,
  byteOffset: number,
  littleEndian: boolean
): ParsedWKBGeometry {
  const geometryCount = dataView.getUint32(byteOffset, littleEndian);
  byteOffset += 4;

  const coordinates: GeoArrowPosition[] = [];
  for (let geometryIndex = 0; geometryIndex < geometryCount; geometryIndex++) {
    const parsedGeometry = parseWKBGeometryAt(dataView, byteOffset);
    if (parsedGeometry.geometry.type !== 'Point') {
      throw new Error('WKB: MultiPoint members must be Point geometries');
    }
    coordinates.push(parsedGeometry.geometry.coordinates);
    byteOffset = parsedGeometry.byteOffset;
  }
  return {geometry: {type: 'MultiPoint', coordinates}, byteOffset};
}

function parseWKBMultiLineStringGeometry(
  dataView: DataView,
  byteOffset: number,
  littleEndian: boolean
): ParsedWKBGeometry {
  const geometryCount = dataView.getUint32(byteOffset, littleEndian);
  byteOffset += 4;

  const coordinates: GeoArrowPosition[][] = [];
  for (let geometryIndex = 0; geometryIndex < geometryCount; geometryIndex++) {
    const parsedGeometry = parseWKBGeometryAt(dataView, byteOffset);
    if (parsedGeometry.geometry.type !== 'LineString') {
      throw new Error('WKB: MultiLineString members must be LineString geometries');
    }
    coordinates.push(parsedGeometry.geometry.coordinates);
    byteOffset = parsedGeometry.byteOffset;
  }
  return {geometry: {type: 'MultiLineString', coordinates}, byteOffset};
}

function parseWKBMultiPolygonGeometry(
  dataView: DataView,
  byteOffset: number,
  littleEndian: boolean
): ParsedWKBGeometry {
  const geometryCount = dataView.getUint32(byteOffset, littleEndian);
  byteOffset += 4;

  const coordinates: GeoArrowPosition[][][] = [];
  for (let geometryIndex = 0; geometryIndex < geometryCount; geometryIndex++) {
    const parsedGeometry = parseWKBGeometryAt(dataView, byteOffset);
    if (parsedGeometry.geometry.type !== 'Polygon') {
      throw new Error('WKB: MultiPolygon members must be Polygon geometries');
    }
    coordinates.push(parsedGeometry.geometry.coordinates);
    byteOffset = parsedGeometry.byteOffset;
  }
  return {geometry: {type: 'MultiPolygon', coordinates}, byteOffset};
}

function parseWKBGeometryCollectionGeometry(
  dataView: DataView,
  byteOffset: number,
  littleEndian: boolean
): ParsedWKBGeometry {
  const geometryCount = dataView.getUint32(byteOffset, littleEndian);
  byteOffset += 4;

  const geometries: GeoArrowGeometry[] = [];
  for (let geometryIndex = 0; geometryIndex < geometryCount; geometryIndex++) {
    const parsedGeometry = parseWKBGeometryAt(dataView, byteOffset);
    geometries.push(parsedGeometry.geometry);
    byteOffset = parsedGeometry.byteOffset;
  }
  return {geometry: {type: 'GeometryCollection', geometries}, byteOffset};
}

function parseWKTGeometry(value: unknown): GeoArrowGeometry {
  const text =
    typeof value === 'string'
      ? value
      : ArrayBuffer.isView(value)
        ? textDecoder.decode(value as ArrayBufferView)
        : null;
  if (text === null) {
    throw new Error('GeoArrow WKT values must be strings or UTF-8 byte arrays');
  }
  return new WKTParser(text).parse();
}

class WKTParser {
  private readonly text: string;
  private index = 0;

  constructor(text: string) {
    this.text = text.replace(/^\s*SRID\s*=\s*\d+\s*;/i, '');
  }

  parse(): GeoArrowGeometry {
    const geometry = this.parseGeometry();
    this.skipWhitespace();
    if (this.index !== this.text.length) {
      throw new Error(`WKT: Unexpected trailing text at offset ${this.index}`);
    }
    return geometry;
  }

  private parseGeometry(): GeoArrowGeometry {
    const geometryType = this.readWord().toUpperCase();
    const coordinateDimension = this.readOptionalDimensionToken();
    this.skipWhitespace();

    if (this.readOptionalWord('EMPTY')) {
      return createEmptyWKTGeometry(geometryType, coordinateDimension);
    }

    switch (geometryType) {
      case 'POINT':
        return {type: 'Point', coordinates: this.parsePointCoordinates()};
      case 'LINESTRING':
        return {type: 'LineString', coordinates: this.parsePositionList()};
      case 'POLYGON':
        return {type: 'Polygon', coordinates: this.parseNestedPositionList(2)};
      case 'MULTIPOINT':
        return {type: 'MultiPoint', coordinates: this.parseMultiPointCoordinates()};
      case 'MULTILINESTRING':
        return {type: 'MultiLineString', coordinates: this.parseNestedPositionList(2)};
      case 'MULTIPOLYGON':
        return {type: 'MultiPolygon', coordinates: this.parseNestedPositionList(3)};
      case 'GEOMETRYCOLLECTION':
        return {type: 'GeometryCollection', geometries: this.parseGeometryCollectionMembers()};
      default:
        throw new Error(`WKT: Unsupported geometry type "${geometryType}"`);
    }
  }

  private parsePointCoordinates(): GeoArrowPosition {
    this.expectCharacter('(');
    const position = this.parsePosition();
    this.expectCharacter(')');
    return position;
  }

  private parsePositionList(): GeoArrowPosition[] {
    return this.parseNestedPositionList(1);
  }

  private parseNestedPositionList(nesting: 1): GeoArrowPosition[];
  private parseNestedPositionList(nesting: 2): GeoArrowPosition[][];
  private parseNestedPositionList(nesting: 3): GeoArrowPosition[][][];
  private parseNestedPositionList(
    nesting: 1 | 2 | 3
  ): GeoArrowPosition[] | GeoArrowPosition[][] | GeoArrowPosition[][][] {
    this.expectCharacter('(');
    const values: unknown[] = [];
    this.skipWhitespace();
    if (this.readOptionalCharacter(')')) {
      return values as GeoArrowPosition[] | GeoArrowPosition[][] | GeoArrowPosition[][][];
    }

    while (true) {
      if (nesting === 1) {
        values.push(this.parsePosition());
      } else if (nesting === 2) {
        values.push(this.parseNestedPositionList(1));
      } else {
        values.push(this.parseNestedPositionList(2));
      }
      this.skipWhitespace();
      if (this.readOptionalCharacter(',')) {
        continue;
      }
      this.expectCharacter(')');
      return values as GeoArrowPosition[] | GeoArrowPosition[][] | GeoArrowPosition[][][];
    }
  }

  private parseMultiPointCoordinates(): GeoArrowPosition[] {
    this.expectCharacter('(');
    const coordinates: GeoArrowPosition[] = [];
    this.skipWhitespace();
    if (this.readOptionalCharacter(')')) {
      return coordinates;
    }

    while (true) {
      if (this.readOptionalCharacter('(')) {
        coordinates.push(this.parsePosition());
        this.expectCharacter(')');
      } else {
        coordinates.push(this.parsePosition());
      }

      this.skipWhitespace();
      if (this.readOptionalCharacter(',')) {
        continue;
      }
      this.expectCharacter(')');
      return coordinates;
    }
  }

  private parseGeometryCollectionMembers(): GeoArrowGeometry[] {
    this.expectCharacter('(');
    const geometries: GeoArrowGeometry[] = [];
    this.skipWhitespace();
    if (this.readOptionalCharacter(')')) {
      return geometries;
    }

    while (true) {
      geometries.push(this.parseGeometry());
      this.skipWhitespace();
      if (this.readOptionalCharacter(',')) {
        continue;
      }
      this.expectCharacter(')');
      return geometries;
    }
  }

  private parsePosition(): GeoArrowPosition {
    const position: GeoArrowPosition = [];
    while (true) {
      this.skipWhitespace();
      const number = this.readOptionalNumber();
      if (number === null) {
        break;
      }
      position.push(number);
    }

    if (position.length < 2 || position.length > 4) {
      throw new Error(`WKT: Coordinates must contain 2, 3, or 4 values at offset ${this.index}`);
    }
    return position;
  }

  private readOptionalDimensionToken(): 2 | 3 | 4 {
    const word = this.peekWord()?.toUpperCase();
    if (word === 'Z' || word === 'M' || word === 'ZM') {
      this.readWord();
      return word === 'ZM' ? 4 : 3;
    }
    return 2;
  }

  private readWord(): string {
    this.skipWhitespace();
    const startIndex = this.index;
    while (this.index < this.text.length && /[A-Za-z]/.test(this.text[this.index])) {
      this.index++;
    }
    if (this.index === startIndex) {
      throw new Error(`WKT: Expected word at offset ${this.index}`);
    }
    return this.text.slice(startIndex, this.index);
  }

  private peekWord(): string | null {
    const savedIndex = this.index;
    try {
      return this.readWord();
    } catch {
      return null;
    } finally {
      this.index = savedIndex;
    }
  }

  private readOptionalWord(word: string): boolean {
    const savedIndex = this.index;
    const nextWord = this.peekWord();
    if (nextWord?.toUpperCase() === word) {
      this.readWord();
      return true;
    }
    this.index = savedIndex;
    return false;
  }

  private readOptionalNumber(): number | null {
    const match = this.text.slice(this.index).match(WKT_NUMBER_PATTERN);
    if (!match) {
      return null;
    }
    this.index += match[0].length;
    return Number(match[0]);
  }

  private expectCharacter(character: string): void {
    this.skipWhitespace();
    if (!this.readOptionalCharacter(character)) {
      throw new Error(`WKT: Expected "${character}" at offset ${this.index}`);
    }
  }

  private readOptionalCharacter(character: string): boolean {
    this.skipWhitespace();
    if (this.text[this.index] !== character) {
      return false;
    }
    this.index++;
    return true;
  }

  private skipWhitespace(): void {
    while (this.index < this.text.length && /\s/.test(this.text[this.index])) {
      this.index++;
    }
  }
}

function createEmptyWKTGeometry(
  geometryType: string,
  coordinateDimension: 2 | 3 | 4
): GeoArrowGeometry {
  switch (geometryType) {
    case 'POINT':
      return {type: 'Point', coordinates: new Array(coordinateDimension).fill(Number.NaN)};
    case 'LINESTRING':
      return {type: 'LineString', coordinates: []};
    case 'POLYGON':
      return {type: 'Polygon', coordinates: []};
    case 'MULTIPOINT':
      return {type: 'MultiPoint', coordinates: []};
    case 'MULTILINESTRING':
      return {type: 'MultiLineString', coordinates: []};
    case 'MULTIPOLYGON':
      return {type: 'MultiPolygon', coordinates: []};
    case 'GEOMETRYCOLLECTION':
      return {type: 'GeometryCollection', geometries: []};
    default:
      throw new Error(`WKT: Unsupported empty geometry type "${geometryType}"`);
  }
}

function convertGeometryToUnionChildValue(
  geometry: GeoArrowGeometry,
  targetDimension: 2 | 3 | 4
): DenseUnionChildValue {
  switch (geometry.type) {
    case 'Point':
      return normalizePosition(geometry.coordinates, targetDimension);
    case 'LineString':
      return normalizePositionList(geometry.coordinates, targetDimension);
    case 'Polygon':
      return normalizeNestedPositions(geometry.coordinates, targetDimension, 2);
    case 'MultiPoint':
      return normalizePositionList(geometry.coordinates, targetDimension);
    case 'MultiLineString':
      return normalizeNestedPositions(geometry.coordinates, targetDimension, 2);
    case 'MultiPolygon':
      return normalizeNestedPositions(geometry.coordinates, targetDimension, 3);
    case 'GeometryCollection':
      throw new Error(
        'GeoArrow WKB/WKT GeometryCollection conversion requires geoarrow.geometrycollection output, not geoarrow.geometry DenseUnion output.'
      );
  }
}

function normalizeNestedPositions(
  coordinates: unknown[],
  targetDimension: 2 | 3 | 4,
  nesting: 2 | 3
): number[][] | number[][][] {
  return coordinates.map(value =>
    nesting === 2
      ? normalizePositionList(value as GeoArrowPosition[], targetDimension)
      : normalizeNestedPositions(value as unknown[], targetDimension, 2)
  ) as number[][] | number[][][];
}

function normalizePositionList(
  positions: GeoArrowPosition[],
  targetDimension: 2 | 3 | 4
): number[][] {
  return positions.map(position => normalizePosition(position, targetDimension));
}

function normalizePosition(position: GeoArrowPosition, targetDimension: 2 | 3 | 4): number[] {
  if (position.length < 2 || position.length > 4) {
    throw new Error('GeoArrow coordinates must contain 2, 3, or 4 values');
  }
  const normalizedPosition = new Array<number>(targetDimension);
  for (let coordinateIndex = 0; coordinateIndex < targetDimension; coordinateIndex++) {
    normalizedPosition[coordinateIndex] = position[coordinateIndex] ?? 0;
  }
  return normalizedPosition;
}

function getGeometryCoordinateDimension(geometry: GeoArrowGeometry): 2 | 3 | 4 {
  switch (geometry.type) {
    case 'Point':
      return validateCoordinateDimension(geometry.coordinates.length);
    case 'LineString':
    case 'MultiPoint':
      return getPositionListCoordinateDimension(geometry.coordinates);
    case 'Polygon':
    case 'MultiLineString':
      return getNestedCoordinateDimension(geometry.coordinates, 2);
    case 'MultiPolygon':
      return getNestedCoordinateDimension(geometry.coordinates, 3);
    case 'GeometryCollection': {
      let dimension: 2 | 3 | 4 = 2;
      for (const memberGeometry of geometry.geometries) {
        dimension = getMaxCoordinateDimension(
          dimension,
          getGeometryCoordinateDimension(memberGeometry)
        );
      }
      return dimension;
    }
  }
}

function getNestedCoordinateDimension(coordinates: unknown[], nesting: 2 | 3): 2 | 3 | 4 {
  let dimension: 2 | 3 | 4 = 2;
  for (const value of coordinates) {
    dimension = getMaxCoordinateDimension(
      dimension,
      nesting === 2
        ? getPositionListCoordinateDimension(value as GeoArrowPosition[])
        : getNestedCoordinateDimension(value as unknown[], 2)
    );
  }
  return dimension;
}

function getPositionListCoordinateDimension(positions: GeoArrowPosition[]): 2 | 3 | 4 {
  let dimension: 2 | 3 | 4 = 2;
  for (const position of positions) {
    dimension = getMaxCoordinateDimension(dimension, validateCoordinateDimension(position.length));
  }
  return dimension;
}

function getMaxCoordinateDimension(leftDimension: 2 | 3 | 4, rightDimension: 2 | 3 | 4): 2 | 3 | 4 {
  return Math.max(leftDimension, rightDimension) as 2 | 3 | 4;
}

function validateCoordinateDimension(dimension: number): 2 | 3 | 4 {
  if (dimension < 2 || dimension > 4) {
    throw new Error('GeoArrow coordinates must contain 2, 3, or 4 values');
  }
  return dimension as 2 | 3 | 4;
}

function buildGeometryUnionType(
  targetDimension: 2 | 3 | 4,
  geometryKinds: Exclude<GeoArrowGeometryKind, 'GeometryCollection'>[]
): DenseUnion {
  return new DenseUnion(
    Int32Array.from(
      geometryKinds.map(geometryKind => getUnionTypeId(geometryKind, targetDimension))
    ),
    geometryKinds.map(
      geometryKind =>
        new Field(
          getUnionFieldName(geometryKind, targetDimension),
          getUnionChildType(geometryKind, targetDimension),
          true
        )
    )
  );
}

function getUnionChildType(
  geometryKind: Exclude<GeoArrowGeometryKind, 'GeometryCollection'>,
  targetDimension: 2 | 3 | 4
): DataType {
  const coordinateType = new FixedSizeList(
    targetDimension,
    new Field('value', new Float64(), false)
  );

  switch (geometryKind) {
    case 'Point':
      return coordinateType;
    case 'LineString':
    case 'MultiPoint':
      return new List(new Field('value', coordinateType, true));
    case 'Polygon':
    case 'MultiLineString':
      return new List(new Field('value', new List(new Field('value', coordinateType, true)), true));
    case 'MultiPolygon':
      return new List(
        new Field(
          'value',
          new List(new Field('value', new List(new Field('value', coordinateType, true)), true)),
          true
        )
      );
  }
}

function getUnionTypeId(
  geometryKind: Exclude<GeoArrowGeometryKind, 'GeometryCollection'>,
  targetDimension: 2 | 3 | 4
): number {
  const baseTypeId = getUnionBaseTypeId(geometryKind);
  switch (targetDimension) {
    case 2:
      return baseTypeId;
    case 3:
      return 10 + baseTypeId;
    case 4:
      return 30 + baseTypeId;
  }
}

function getUnionBaseTypeId(
  geometryKind: Exclude<GeoArrowGeometryKind, 'GeometryCollection'>
): number {
  switch (geometryKind) {
    case 'Point':
      return 1;
    case 'LineString':
      return 2;
    case 'Polygon':
      return 3;
    case 'MultiPoint':
      return 4;
    case 'MultiLineString':
      return 5;
    case 'MultiPolygon':
      return 6;
  }
}

function getUnionFieldName(
  geometryKind: Exclude<GeoArrowGeometryKind, 'GeometryCollection'>,
  targetDimension: 2 | 3 | 4
): string {
  switch (targetDimension) {
    case 2:
      return geometryKind;
    case 3:
      return `${geometryKind} Z`;
    case 4:
      return `${geometryKind} ZM`;
  }
}

function resolveVectorSerializedEncoding<T extends DataType>(
  vector: Vector<T>,
  options: GeoArrowDenseUnionVectorOptions
): GeoArrowSerializedEncoding {
  if (options.encoding) {
    return options.encoding;
  }
  if (DataType.isBinary(vector.type)) {
    return 'geoarrow.wkb';
  }
  if (DataType.isUtf8(vector.type)) {
    return 'geoarrow.wkt';
  }
  throw new Error('GeoArrow dense-union conversion requires Binary WKB or Utf8 WKT input');
}

function resolveGeoArrowSerializedGeometryColumns<T extends TypeMap>(
  table: Table<T>,
  options: GeoArrowDenseUnionTableOptions
): string[] {
  if (options.geometryColumn && options.geometryColumns?.length) {
    throw new Error('Specify only one of geometryColumn or geometryColumns');
  }

  if (options.geometryColumn) {
    assertTableColumnExists(table, options.geometryColumn);
    return [options.geometryColumn];
  }

  if (options.geometryColumns?.length) {
    for (const geometryColumn of options.geometryColumns) {
      assertTableColumnExists(table, geometryColumn);
    }
    return options.geometryColumns;
  }

  return table.schema.fields
    .filter(field => Boolean(getFieldSerializedEncoding(field)))
    .map(field => field.name);
}

function getFieldSerializedEncoding(field: Field): GeoArrowSerializedEncoding | null {
  const extensionName = field.metadata.get(GEOARROW_EXTENSION_NAME_KEY)?.toLowerCase();
  return GEOARROW_SERIALIZED_ENCODINGS.has(extensionName as GeoArrowSerializedEncoding)
    ? (extensionName as GeoArrowSerializedEncoding)
    : null;
}

function assertTableColumnExists<T extends TypeMap>(table: Table<T>, columnName: string): void {
  if (!table.getChild(columnName)) {
    throw new Error(`GeoArrow dense-union conversion could not find column "${columnName}"`);
  }
}

function getTableField<T extends TypeMap>(table: Table<T>, columnName: string): Field | null {
  return table.schema.fields.find(field => field.name === columnName) || null;
}

function createDenseUnionField(field: Field, type: DataType): Field {
  const metadata = new Map(field.metadata);
  metadata.set(GEOARROW_EXTENSION_NAME_KEY, GEOARROW_GEOMETRY_EXTENSION_NAME);
  return new Field(field.name, type, field.nullable, metadata);
}

function makeTableWithConvertedVectors<T extends TypeMap>(
  table: Table<T>,
  convertedVectors: Map<string, Vector>,
  convertedFields: Map<string, Field>
): Table {
  const nextFields = table.schema.fields.map(field => convertedFields.get(field.name) || field);
  const nextSchema = new Schema(nextFields, table.schema.metadata);
  const nextBatches = table.batches.map((recordBatch, batchIndex) => {
    const children = nextFields.map((field, fieldIndex) => {
      const convertedVector = convertedVectors.get(field.name);
      if (!convertedVector) {
        return recordBatch.data.children[fieldIndex];
      }
      const convertedData = convertedVector.data[batchIndex];
      if (!convertedData) {
        throw new Error(`GeoArrow dense-union conversion chunk mismatch for "${field.name}"`);
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

function validateWKBGeometryType(geometryType: number): WKBGeometryType {
  if (geometryType < WKBGeometryType.Point || geometryType > WKBGeometryType.GeometryCollection) {
    throw new Error(`WKB: Unsupported geometry type ${geometryType}`);
  }
  return geometryType as WKBGeometryType;
}

function createDataView(value: unknown): DataView {
  if (value instanceof DataView) {
    return value;
  }
  if (ArrayBuffer.isView(value)) {
    return new DataView(value.buffer, value.byteOffset, value.byteLength);
  }
  if (value instanceof ArrayBuffer) {
    return new DataView(value);
  }
  throw new Error('GeoArrow WKB values must be ArrayBuffer or ArrayBufferView instances');
}
