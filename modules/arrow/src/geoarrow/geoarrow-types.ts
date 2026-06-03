// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {FixedSizeList, Float64, List, Struct, StructRowProxy} from 'apache-arrow';

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

export type ArrowInterleavedCoord = FixedSizeList<Float64>;
export type ArrowSeparatedCoord = Struct<{
  x: Float64;
  y: Float64;
}>;
// TODO: support separated coords
export type ArrowCoord = ArrowInterleavedCoord; // | SeparatedCoord;
export type ArrowPoint = ArrowCoord;
export type ArrowLineString = List<ArrowCoord>;
export type ArrowPolygon = List<List<ArrowCoord>>;
export type ArrowMultiPoint = List<ArrowCoord>;
export type ArrowMultiLineString = List<List<ArrowCoord>>;
export type ArrowMultiPolygon = List<List<List<ArrowCoord>>>;

// export type PointVector = Vector<ArrowCoord>;
// export type LineStringVector = Vector<ArrowLineString>;
// export type PolygonVector = Vector<ArrowPolygon>;
// export type MultiPointVector = Vector<ArrowMultiPoint>;
// export type MultiLineStringVector = Vector<ArrowMultiLineString>;
// export type MultiPolygonVector = Vector<ArrowMultiPolygon>;

// export type PointData = Data<Point>;
// export type LineStringData = Data<LineString>;
// export type PolygonData = Data<Polygon>;
// export type MultiPointData = Data<MultiPoint>;
// export type MultiLineStringData = Data<MultiLineString>;
// export type MultiPolygonData = Data<MultiPolygon>;

export type GeoArrowPickingInfo = {
  object: StructRowProxy;
};
