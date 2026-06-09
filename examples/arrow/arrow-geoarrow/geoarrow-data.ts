// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getArrowVectorByteLength, makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';
import type {GeoArrowRendererMetrics} from './geoarrow-renderer';

export type GeoArrowExampleData = {
  table: arrow.Table;
  metrics: GeoArrowRendererMetrics;
  arrowByteLength: number;
};

const GEOARROW_POINT_TYPE_ID = 1;
const GEOARROW_LINESTRING_TYPE_ID = 2;
const GEOARROW_POLYGON_TYPE_ID = 3;
const GEOARROW_MULTILINESTRING_TYPE_ID = 5;
const GEOARROW_MULTIPOLYGON_TYPE_ID = 6;
const ROW_COUNT = 180;
const COLUMN_COUNT = 18;
const COORDINATE_COMPONENTS = 2;
const COLOR_COMPONENTS = 4;
const ANKH_OUTER_COORDINATES: readonly [number, number][] = [
  [0, 1.1],
  [0.26, 1.03],
  [0.46, 0.82],
  [0.54, 0.58],
  [0.48, 0.34],
  [0.31, 0.12],
  [0.14, 0.02],
  [0.8, 0.09],
  [0.82, -0.18],
  [0.16, -0.1],
  [0.16, -0.86],
  [0.29, -1.1],
  [-0.29, -1.1],
  [-0.16, -0.86],
  [-0.16, -0.1],
  [-0.82, -0.18],
  [-0.8, 0.09],
  [-0.14, 0.02],
  [-0.31, 0.12],
  [-0.48, 0.34],
  [-0.54, 0.58],
  [-0.46, 0.82],
  [-0.26, 1.03]
];
const ANKH_HOLE_COORDINATES: readonly [number, number][] = [
  [0, 0.84],
  [0.15, 0.8],
  [0.26, 0.66],
  [0.29, 0.5],
  [0.23, 0.36],
  [0.12, 0.24],
  [0, 0.16],
  [-0.12, 0.24],
  [-0.23, 0.36],
  [-0.29, 0.5],
  [-0.26, 0.66],
  [-0.15, 0.8]
];
const EYE_OF_HORUS_POLYGON_RINGS: readonly (readonly (readonly [number, number][])[])[] = [
  [
    [
      [-1.02, 0.02],
      [-0.66, 0.22],
      [-0.24, 0.34],
      [0.22, 0.3],
      [0.66, 0.12],
      [1.0, -0.08],
      [0.64, -0.26],
      [0.18, -0.36],
      [-0.28, -0.32],
      [-0.68, -0.16]
    ],
    [
      [-0.72, -0.05],
      [-0.3, 0.12],
      [0.24, 0.1],
      [0.64, -0.08],
      [0.18, -0.18],
      [-0.32, -0.16]
    ]
  ],
  [
    [
      [-0.18, 0.04],
      [-0.12, 0.15],
      [0.03, 0.18],
      [0.18, 0.1],
      [0.2, -0.04],
      [0.1, -0.16],
      [-0.06, -0.16],
      [-0.18, -0.06]
    ]
  ],
  [
    [
      [-1.0, 0.42],
      [-0.55, 0.58],
      [0.08, 0.63],
      [0.7, 0.48],
      [1.04, 0.36],
      [0.96, 0.2],
      [0.56, 0.28],
      [0.04, 0.42],
      [-0.5, 0.36],
      [-0.94, 0.24]
    ]
  ],
  [
    [
      [-0.66, -0.16],
      [-0.44, -0.42],
      [-0.45, -0.92],
      [-0.66, -0.44],
      [-0.88, -0.34]
    ]
  ],
  [
    [
      [-0.3, -0.3],
      [-0.02, -0.5],
      [0.22, -0.75],
      [0.5, -0.92],
      [0.84, -0.9],
      [1.02, -0.72],
      [0.98, -0.46],
      [0.78, -0.34],
      [0.56, -0.42],
      [0.52, -0.6],
      [0.62, -0.72],
      [0.78, -0.72],
      [0.88, -0.58],
      [0.82, -0.4],
      [0.58, -0.3],
      [0.26, -0.38],
      [0.02, -0.22]
    ]
  ]
];
const EYE_OF_HORUS_POLYGON_COUNT = EYE_OF_HORUS_POLYGON_RINGS.length;
const EYE_OF_HORUS_RING_COUNT = EYE_OF_HORUS_POLYGON_RINGS.reduce(
  (total, polygon) => total + polygon.length,
  0
);
const EYE_OF_HORUS_POLYGON_COORDINATE_COUNT = EYE_OF_HORUS_POLYGON_RINGS.reduce(
  (total, polygon) => total + polygon.reduce((polygonTotal, ring) => polygonTotal + ring.length, 0),
  0
);
const REED_COORDINATES: readonly [number, number][] = [
  [0.0, -1.06],
  [-0.02, -0.72],
  [-0.13, -0.5],
  [-0.25, -0.34],
  [-0.28, 0.02],
  [-0.22, 0.42],
  [-0.13, 0.78],
  [-0.04, 1.02],
  [0.05, 1.08],
  [0.08, 0.88],
  [0.09, 0.52],
  [0.08, 0.16],
  [0.06, -0.16],
  [0.05, -0.48],
  [0.03, -0.76],
  [0.0, -1.06]
];
const MULTILINESTRING_POINT_COUNT = REED_COORDINATES.length;

type GeometryKind = 'Point' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon';

type GeometryRow = {
  sourceRowIndex: number;
  geometryKind: GeometryKind;
  centerX: number;
  centerY: number;
  radius: number;
};

export function makeGeoArrowExampleData(): GeoArrowExampleData {
  const rows = makeGeometryRows();
  const geometries = makeDenseUnionGeometryVector(rows);
  const colors = makeRowColorVector(rows);
  const widths = makeWidthVector(rows);
  const radii = makeRadiusVector(rows);
  const table = new arrow.Table({geometries, colors, widths, radii});
  const metrics = getGeometryMetrics(rows);

  return {
    table,
    metrics,
    arrowByteLength:
      getArrowVectorByteLength(geometries) +
      getArrowVectorByteLength(colors) +
      getArrowVectorByteLength(widths) +
      getArrowVectorByteLength(radii)
  };
}

function makeGeometryRows(): GeometryRow[] {
  const rows: GeometryRow[] = [];
  for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex++) {
    const geometryKind = getGeometryKind(rowIndex);
    const columnIndex = rowIndex % COLUMN_COUNT;
    const rowGridIndex = Math.floor(rowIndex / COLUMN_COUNT);
    const cellWidth = 1.86 / COLUMN_COUNT;
    const rowCount = Math.ceil(ROW_COUNT / COLUMN_COUNT);
    const cellHeight = 1.72 / rowCount;
    const jitterX = getJitter(rowIndex, 17) * cellWidth * 0.18;
    const jitterY = getJitter(rowIndex, 31) * cellHeight * 0.18;
    rows.push({
      sourceRowIndex: rowIndex,
      geometryKind,
      centerX: -0.93 + (columnIndex + 0.5) * cellWidth + jitterX,
      centerY: 0.86 - (rowGridIndex + 0.5) * cellHeight + jitterY,
      radius: Math.min(cellWidth, cellHeight) * 0.42
    });
  }
  return rows;
}

function makeDenseUnionGeometryVector(rows: GeometryRow[]): arrow.Vector<arrow.DenseUnion> {
  const pointRows = rows.filter(row => row.geometryKind === 'Point');
  const lineStringRows = rows.filter(row => row.geometryKind === 'LineString');
  const multiLineStringRows = rows.filter(row => row.geometryKind === 'MultiLineString');
  const polygonRows = rows.filter(row => row.geometryKind === 'Polygon');
  const multiPolygonRows = rows.filter(row => row.geometryKind === 'MultiPolygon');
  const typeIds = new Int8Array(rows.length);
  const valueOffsets = new Int32Array(rows.length);
  const childRowCounts: Record<GeometryKind, number> = {
    Point: 0,
    LineString: 0,
    MultiLineString: 0,
    Polygon: 0,
    MultiPolygon: 0
  };

  for (const row of rows) {
    typeIds[row.sourceRowIndex] = getGeometryTypeId(row.geometryKind);
    valueOffsets[row.sourceRowIndex] = childRowCounts[row.geometryKind]++;
  }

  const pointData = makePointData(pointRows);
  const lineStringData = makeLineStringData(lineStringRows);
  const multiLineStringData = makeMultiLineStringData(multiLineStringRows);
  const polygonData = makePolygonData(polygonRows);
  const multiPolygonData = makeMultiPolygonData(multiPolygonRows);
  const unionType = new arrow.DenseUnion(
    [
      GEOARROW_POINT_TYPE_ID,
      GEOARROW_LINESTRING_TYPE_ID,
      GEOARROW_MULTILINESTRING_TYPE_ID,
      GEOARROW_POLYGON_TYPE_ID,
      GEOARROW_MULTIPOLYGON_TYPE_ID
    ],
    [
      new arrow.Field('Point', pointData.type, true),
      new arrow.Field('LineString', lineStringData.type, true),
      new arrow.Field('MultiLineString', multiLineStringData.type, true),
      new arrow.Field('Polygon', polygonData.type, true),
      new arrow.Field('MultiPolygon', multiPolygonData.type, true)
    ]
  );

  const data = arrow.makeData({
    type: unionType,
    length: rows.length,
    nullCount: 0,
    typeIds,
    valueOffsets,
    children: [pointData, lineStringData, multiLineStringData, polygonData, multiPolygonData]
  }) as arrow.Data<arrow.DenseUnion>;
  return new arrow.Vector([data]);
}

function makePointData(rows: GeometryRow[]): arrow.Data<arrow.FixedSizeList<arrow.Float32>> {
  const values = new Float32Array(rows.length * COORDINATE_COMPONENTS);
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    values[rowIndex * COORDINATE_COMPONENTS] = row.centerX;
    values[rowIndex * COORDINATE_COMPONENTS + 1] = row.centerY;
  }
  return makeFixedSizeListData(new arrow.Float32(), COORDINATE_COMPONENTS, values);
}

function makeLineStringData(
  rows: GeometryRow[]
): arrow.Data<arrow.List<arrow.FixedSizeList<arrow.Float32>>> {
  const pointCount = 5;
  const offsets = new Int32Array(rows.length + 1);
  const values = new Float32Array(rows.length * pointCount * COORDINATE_COMPONENTS);
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    offsets[rowIndex] = rowIndex * pointCount;
    for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
      const progress = pointIndex / (pointCount - 1);
      const x = row.centerX - row.radius * 0.85 + progress * row.radius * 1.7;
      const y =
        row.centerY +
        Math.sin(progress * Math.PI * 2 + row.sourceRowIndex * 0.31) * row.radius * 0.38;
      writeCoordinate(values, rowIndex * pointCount + pointIndex, x, y);
    }
  }
  offsets[rows.length] = rows.length * pointCount;
  return makeListData(makeCoordinateData(values), offsets);
}

function makeMultiLineStringData(
  rows: GeometryRow[]
): arrow.Data<arrow.List<arrow.List<arrow.FixedSizeList<arrow.Float32>>>> {
  const lineCount = rows.length * 2;
  const pointCount = MULTILINESTRING_POINT_COUNT;
  const rowOffsets = new Int32Array(rows.length + 1);
  const lineOffsets = new Int32Array(lineCount + 1);
  const values = new Float32Array(lineCount * pointCount * COORDINATE_COMPONENTS);

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    rowOffsets[rowIndex] = rowIndex * 2;
    for (let linePartIndex = 0; linePartIndex < 2; linePartIndex++) {
      const lineIndex = rowIndex * 2 + linePartIndex;
      lineOffsets[lineIndex] = lineIndex * pointCount;
      for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
        const [x, y] = getMultiLineStringCoordinate(row, linePartIndex, pointIndex, pointCount);
        writeCoordinate(values, lineIndex * pointCount + pointIndex, x, y);
      }
    }
  }
  rowOffsets[rows.length] = lineCount;
  lineOffsets[lineCount] = lineCount * pointCount;
  return makeListData(makeListData(makeCoordinateData(values), lineOffsets), rowOffsets);
}

function getMultiLineStringCoordinate(
  row: GeometryRow,
  linePartIndex: number,
  pointIndex: number,
  pointCount: number
): [number, number] {
  if (isReedRow(row)) {
    const reedScale = row.radius * 1.28;
    const xOffset = (linePartIndex === 0 ? -0.25 : 0.25) * reedScale;
    const [reedX, reedY] = REED_COORDINATES[pointIndex];
    return [row.centerX + xOffset + reedX * reedScale, row.centerY + reedY * reedScale];
  }

  const progress = pointIndex / (pointCount - 1);
  const yOffset = linePartIndex === 0 ? -row.radius * 0.26 : row.radius * 0.26;
  return [
    row.centerX - row.radius * 0.78 + progress * row.radius * 1.56,
    row.centerY +
      yOffset +
      Math.cos(progress * Math.PI * 2 + row.sourceRowIndex * 0.17) * row.radius * 0.16
  ];
}

function isReedRow(row: GeometryRow): boolean {
  return Math.floor(row.sourceRowIndex / 5) % 2 === 0;
}

function makePolygonData(
  rows: GeometryRow[]
): arrow.Data<arrow.List<arrow.List<arrow.FixedSizeList<arrow.Float32>>>> {
  const rowOffsets = new Int32Array(rows.length + 1);
  const ringOffsets = new Int32Array(getPolygonRingCount(rows) + 1);
  const coordinateCount = rows.reduce(
    (total, row) => total + getPolygonOuterVertexCount(row) + getPolygonHoleVertexCount(row),
    0
  );
  const values = new Float32Array(coordinateCount * COORDINATE_COMPONENTS);
  let ringIndex = 0;
  let coordinateIndex = 0;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const ankhScale = row.radius * 1.28;
    rowOffsets[rowIndex] = ringIndex;
    ringOffsets[ringIndex++] = coordinateIndex;
    for (const [x, y] of ANKH_OUTER_COORDINATES) {
      writeCoordinate(
        values,
        coordinateIndex++,
        row.centerX + x * ankhScale,
        row.centerY + y * ankhScale
      );
    }
    ringOffsets[ringIndex++] = coordinateIndex;
    for (const [x, y] of ANKH_HOLE_COORDINATES) {
      writeCoordinate(
        values,
        coordinateIndex++,
        row.centerX + x * ankhScale,
        row.centerY + y * ankhScale
      );
    }
  }
  rowOffsets[rows.length] = ringIndex;
  ringOffsets[ringIndex] = coordinateIndex;
  return makeListData(makeListData(makeCoordinateData(values), ringOffsets), rowOffsets);
}

function makeMultiPolygonData(
  rows: GeometryRow[]
): arrow.Data<arrow.List<arrow.List<arrow.List<arrow.FixedSizeList<arrow.Float32>>>>> {
  const rowOffsets = new Int32Array(rows.length + 1);
  const polygonOffsets = new Int32Array(rows.length * EYE_OF_HORUS_POLYGON_COUNT + 1);
  const ringOffsets = new Int32Array(rows.length * EYE_OF_HORUS_RING_COUNT + 1);
  const coordinateCount = rows.length * EYE_OF_HORUS_POLYGON_COORDINATE_COUNT;
  const values = new Float32Array(coordinateCount * COORDINATE_COMPONENTS);
  let polygonIndex = 0;
  let ringIndex = 0;
  let coordinateIndex = 0;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const eyeScale = row.radius * 1.0;
    rowOffsets[rowIndex] = polygonIndex;
    for (const polygonRings of EYE_OF_HORUS_POLYGON_RINGS) {
      polygonOffsets[polygonIndex++] = ringIndex;
      for (const ring of polygonRings) {
        ringOffsets[ringIndex++] = coordinateIndex;
        for (const [x, y] of ring) {
          writeCoordinate(
            values,
            coordinateIndex++,
            row.centerX + x * eyeScale,
            row.centerY + y * eyeScale
          );
        }
      }
    }
  }
  rowOffsets[rows.length] = polygonIndex;
  polygonOffsets[polygonIndex] = ringIndex;
  ringOffsets[ringIndex] = coordinateIndex;
  return makeListData(
    makeListData(makeListData(makeCoordinateData(values), ringOffsets), polygonOffsets),
    rowOffsets
  );
}

function makeRowColorVector(rows: GeometryRow[]): arrow.Vector<arrow.FixedSizeList<arrow.Uint8>> {
  const values = new Uint8Array(rows.length * COLOR_COMPONENTS);
  for (const row of rows) {
    const color = getGeometryColor(row.geometryKind, row.sourceRowIndex);
    const offset = row.sourceRowIndex * COLOR_COMPONENTS;
    values[offset] = color[0];
    values[offset + 1] = color[1];
    values[offset + 2] = color[2];
    values[offset + 3] = color[3];
  }
  return makeArrowFixedSizeListVector(new arrow.Uint8(), COLOR_COMPONENTS, values);
}

function makeWidthVector(rows: GeometryRow[]): arrow.Vector<arrow.Float32> {
  return new arrow.Vector([
    arrow.makeData({
      type: new arrow.Float32(),
      length: rows.length,
      data: Float32Array.from(rows, row => 0.0022 + (row.sourceRowIndex % 4) * 0.00042)
    }) as arrow.Data<arrow.Float32>
  ]);
}

function makeRadiusVector(rows: GeometryRow[]): arrow.Vector<arrow.Float32> {
  return new arrow.Vector([
    arrow.makeData({
      type: new arrow.Float32(),
      length: rows.length,
      data: Float32Array.from(rows, row => row.radius * 0.24)
    }) as arrow.Data<arrow.Float32>
  ]);
}

function getGeometryMetrics(rows: GeometryRow[]): GeoArrowRendererMetrics {
  let pointRowCount = 0;
  let lineRowCount = 0;
  let polygonRowCount = 0;
  let skippedRowCount = 0;
  for (const row of rows) {
    switch (row.geometryKind) {
      case 'Point':
        pointRowCount++;
        break;
      case 'LineString':
        lineRowCount++;
        break;
      case 'MultiLineString':
        lineRowCount += 2;
        break;
      case 'Polygon':
        polygonRowCount++;
        break;
      case 'MultiPolygon':
        polygonRowCount += EYE_OF_HORUS_POLYGON_COUNT;
        break;
      default:
        skippedRowCount++;
    }
  }
  return {
    sourceRowCount: rows.length,
    pointRowCount,
    lineRowCount,
    polygonRowCount,
    skippedRowCount,
    conversionTimeMs: 0
  };
}

function getGeometryKind(rowIndex: number): GeometryKind {
  switch (rowIndex % 5) {
    case 0:
      return 'Polygon';
    case 1:
      return 'LineString';
    case 2:
      return 'Point';
    case 3:
      return 'MultiLineString';
    default:
      return 'MultiPolygon';
  }
}

function getGeometryTypeId(geometryKind: GeometryKind): number {
  switch (geometryKind) {
    case 'Point':
      return GEOARROW_POINT_TYPE_ID;
    case 'LineString':
      return GEOARROW_LINESTRING_TYPE_ID;
    case 'MultiLineString':
      return GEOARROW_MULTILINESTRING_TYPE_ID;
    case 'Polygon':
      return GEOARROW_POLYGON_TYPE_ID;
    case 'MultiPolygon':
      return GEOARROW_MULTIPOLYGON_TYPE_ID;
  }
}

function getPolygonRingCount(rows: GeometryRow[]): number {
  return rows.length * 2;
}

function getPolygonOuterVertexCount(_row: GeometryRow): number {
  return ANKH_OUTER_COORDINATES.length;
}

function getPolygonHoleVertexCount(_row: GeometryRow): number {
  return ANKH_HOLE_COORDINATES.length;
}

function writeCoordinate(
  values: Float32Array,
  coordinateIndex: number,
  x: number,
  y: number
): void {
  const valueOffset = coordinateIndex * COORDINATE_COMPONENTS;
  values[valueOffset] = x;
  values[valueOffset + 1] = y;
}

function makeCoordinateData(values: Float32Array): arrow.Data<arrow.FixedSizeList<arrow.Float32>> {
  return makeFixedSizeListData(new arrow.Float32(), COORDINATE_COMPONENTS, values);
}

function makeFixedSizeListData<T extends arrow.Float32 | arrow.Uint8>(
  childType: T,
  listSize: number,
  values: T['TArray']
): arrow.Data<arrow.FixedSizeList<T>> {
  const childData = new arrow.Data(childType, 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  });
  const listType = new arrow.FixedSizeList(listSize, new arrow.Field('values', childType, false));
  return new arrow.Data(listType, 0, values.length / listSize, 0, {}, [childData]);
}

function makeListData<T extends arrow.DataType>(
  childData: arrow.Data<T>,
  offsets: Int32Array
): arrow.Data<arrow.List<T>> {
  const listType = new arrow.List(new arrow.Field('values', childData.type, false));
  return new arrow.Data(listType, 0, offsets.length - 1, 0, {[arrow.BufferType.OFFSET]: offsets}, [
    childData
  ]);
}

function getGeometryColor(
  geometryKind: GeometryKind,
  rowIndex: number
): [number, number, number, number] {
  const pulse = Math.round(getJitter(rowIndex, 89) * 18);
  switch (geometryKind) {
    case 'Point':
      return [255, 206 + pulse, 82, 235];
    case 'LineString':
      return [68, 194 + pulse, 247, 235];
    case 'MultiLineString':
      return [96, 226 + pulse, 170, 235];
    case 'Polygon':
      return [72, 116 + pulse, 255, 190];
    case 'MultiPolygon':
      return [184, 112 + pulse, 255, 185];
  }
}

function getJitter(rowIndex: number, salt: number): number {
  const value = Math.sin((rowIndex + 1) * (salt + 29) * 12.9898) * 43758.5453;
  return value - Math.floor(value) - 0.5;
}
