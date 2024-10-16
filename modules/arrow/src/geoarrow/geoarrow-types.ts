// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

/**
 * Enum holding GeoArrow extension type names
 */
export enum EXTENSION_NAME {
  POINT = 'geoarrow.point',
  LINESTRING = 'geoarrow.linestring',
  POLYGON = 'geoarrow.polygon',
  MULTIPOINT = 'geoarrow.multipoint',
  MULTILINESTRING = 'geoarrow.multilinestring',
  MULTIPOLYGON = 'geoarrow.multipolygon'
}

export type ArrowInterleavedCoord = arrow.FixedSizeList<arrow.Float64>;
export type ArrowSeparatedCoord = arrow.Struct<{
  x: arrow.Float64;
  y: arrow.Float64;
}>;
// TODO: support separated coords
export type ArrowCoord = ArrowInterleavedCoord; // | SeparatedCoord;
export type ArrowPoint = ArrowCoord;
export type ArrowLineString = arrow.List<ArrowCoord>;
export type ArrowPolygon = arrow.List<arrow.List<ArrowCoord>>;
export type ArrowMultiPoint = arrow.List<ArrowCoord>;
export type ArrowMultiLineString = arrow.List<arrow.List<ArrowCoord>>;
export type ArrowMultiPolygon = arrow.List<arrow.List<arrow.List<ArrowCoord>>>;

// export type PointVector = arrow.Vector<ArrowCoord>;
// export type LineStringVector = arrow.Vector<ArrowLineString>;
// export type PolygonVector = arrow.Vector<ArrowPolygon>;
// export type MultiPointVector = arrow.Vector<ArrowMultiPoint>;
// export type MultiLineStringVector = arrow.Vector<ArrowMultiLineString>;
// export type MultiPolygonVector = arrow.Vector<ArrowMultiPolygon>;

// export type PointData = arrow.Data<Point>;
// export type LineStringData = arrow.Data<LineString>;
// export type PolygonData = arrow.Data<Polygon>;
// export type MultiPointData = arrow.Data<MultiPoint>;
// export type MultiLineStringData = arrow.Data<MultiLineString>;
// export type MultiPolygonData = arrow.Data<MultiPolygon>;

export type GeoArrowPickingInfo = {
  object: arrow.StructRowProxy;
};
