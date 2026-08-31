// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {tessellateGeoArrowPolygons} from '@math.gl/geoarrow/tessellation';
import {
  DataType,
  DenseUnion,
  FixedSizeList,
  Float32,
  Float64,
  List,
  Struct,
  Uint8,
  Vector,
  type DataType as ArrowDataType
} from 'apache-arrow';
import {
  inferGeoArrowDimensionFromArrowType,
  makeGeoArrowColumnFromArrowVector
} from './arrow-geoarrow-adapter';
import type {ArrowColorType} from '../arrow-colors';

export type ArrowPolygonCoordinateType = FixedSizeList<Float32> | FixedSizeList<Float64>;
export type ArrowSeparatedPolygonCoordinateType = Struct;
export type ArrowPolygonInputCoordinateType =
  | ArrowPolygonCoordinateType
  | ArrowSeparatedPolygonCoordinateType;
export type ArrowTessellatedPolygonType = List<ArrowPolygonInputCoordinateType>;
export type ArrowPolygonType = List<List<ArrowPolygonInputCoordinateType>>;
export type ArrowMultiPolygonType = List<List<List<ArrowPolygonInputCoordinateType>>>;
export type ArrowGeoArrowGeometryType = DenseUnion;
export type ArrowPolygonInputType =
  | ArrowTessellatedPolygonType
  | ArrowPolygonType
  | ArrowMultiPolygonType
  | ArrowGeoArrowGeometryType;

export type ArrowPolygonRowColorType = FixedSizeList<Uint8>;
export type ArrowTessellatedPolygonVertexColorType = List<ArrowPolygonRowColorType>;
export type ArrowPolygonVertexColorType = List<List<ArrowPolygonRowColorType>>;
export type ArrowMultiPolygonVertexColorType = List<List<List<ArrowPolygonRowColorType>>>;
export type ArrowPolygonColorType =
  | ArrowColorType
  | ArrowTessellatedPolygonVertexColorType
  | ArrowPolygonVertexColorType
  | ArrowMultiPolygonVertexColorType;

export type ArrowPolygonSourceVectors = {
  /** Polygon, multipolygon, GeoArrow DenseUnion, or pre-tessellated triangle rows. */
  polygons: Vector<ArrowPolygonInputType>;
  /** Optional row or per-vertex packed RGBA8 fill colors. */
  colors?: Vector<ArrowPolygonColorType>;
};

export type ArrowPolygonTessellationOptions = {
  /** Treat `List<FixedSizeList<...>>` rows as already tessellated triangle vertices. */
  tessellated?: boolean;
  /** Constant fallback color used when no row/vertex color vector is supplied. */
  color?: [number, number, number, number];
  /** First source row id to write into the generated rowIndices attribute. */
  rowIndexOffset?: number;
};

export type ArrowPolygonTessellationResult = {
  /** Packed Float32 vec4 positions. XY are used for tessellation and rendering. */
  positions: Float32Array;
  /** Packed RGBA8 colors, one color per output position. */
  colors: Uint8Array;
  /** Source Arrow row index, one id per output position. */
  rowIndices: Uint32Array;
  /** Triangle index buffer. */
  indices: Uint16Array | Uint32Array;
  /** Original coordinate dimension before positions were padded to vec4. */
  sourceDimension: 2 | 3 | 4;
  /** Number of generated output vertices. */
  vertexCount: number;
  /** Number of generated triangles. */
  triangleCount: number;
  /** Number of input Arrow rows. */
  rowCount: number;
  /** Number of primitive polygons passed to earcut or accepted as tessellated rows. */
  polygonCount: number;
};

type Coordinate = number[];
type Color = [number, number, number, number];

const OUTPUT_POSITION_COMPONENTS = 4;
const DEFAULT_POLYGON_COLOR: Color = [0, 96, 255, 255];

/** Adapts Arrow polygon buffers and delegates geometry tessellation to math.gl. */
export function tessellateArrowPolygons(
  sourceVectors: ArrowPolygonSourceVectors,
  options: ArrowPolygonTessellationOptions = {}
): ArrowPolygonTessellationResult {
  const nesting = getPolygonNesting(sourceVectors.polygons.type);
  if (options.tessellated) {
    if (nesting !== 1) {
      throw new Error('tessellated ArrowPolygonRenderer input must be List<FixedSizeList<...>>');
    }
    return copyTessellatedArrowPolygonRows(sourceVectors, options);
  }
  if (nesting === 1) {
    throw new Error(
      'ArrowPolygonRenderer requires polygon or multipolygon nesting unless tessellated is true'
    );
  }

  const encoding =
    nesting === 'dense-union'
      ? 'geoarrow.geometry'
      : nesting === 2
        ? 'geoarrow.polygon'
        : 'geoarrow.multipolygon';
  const column = makeGeoArrowColumnFromArrowVector(sourceVectors.polygons, {encoding});
  const tessellation = tessellateGeoArrowPolygons(column, {
    positionSize: OUTPUT_POSITION_COMPONENTS,
    sourceRowOffset: options.rowIndexOffset ?? 0
  });
  const rowIndices = tessellation.sourceRowIndices;
  return {
    positions: tessellation.positions,
    colors: expandPolygonColors(
      sourceVectors,
      rowIndices,
      nesting,
      options.color,
      options.rowIndexOffset ?? 0
    ),
    rowIndices,
    indices: tessellation.indices,
    sourceDimension: tessellation.sourceDimension,
    vertexCount: tessellation.vertexCount,
    triangleCount: tessellation.triangleCount,
    rowCount: tessellation.rowCount,
    polygonCount: tessellation.polygonCount
  };
}

/** Async compatibility entrypoint. Worker scheduling is now an explicit application concern. */
export async function tesselateAsync(
  sourceVectors: ArrowPolygonSourceVectors,
  options: ArrowPolygonTessellationOptions = {}
): Promise<ArrowPolygonTessellationResult> {
  await Promise.resolve();
  return tessellateArrowPolygons(sourceVectors, options);
}

function copyTessellatedArrowPolygonRows(
  sourceVectors: ArrowPolygonSourceVectors,
  options: ArrowPolygonTessellationOptions
): ArrowPolygonTessellationResult {
  const sourceDimension = getDimensionSize(
    inferGeoArrowDimensionFromArrowType(sourceVectors.polygons.type)
  );
  const rowIndexOffset = options.rowIndexOffset ?? 0;
  const positions: number[] = [];
  const colors: number[] = [];
  const rowIndices: number[] = [];
  const indices: number[] = [];
  const rowColors = isRowColorVector(sourceVectors.colors);
  const fallbackColor = options.color ?? DEFAULT_POLYGON_COLOR;
  let polygonCount = 0;

  for (let rowIndex = 0; rowIndex < sourceVectors.polygons.length; rowIndex++) {
    const coordinates = materializeArrowValue(sourceVectors.polygons.get(rowIndex));
    if (coordinates === null) continue;
    const coordinateRows = coordinates as Coordinate[];
    if (coordinateRows.length % 3 !== 0) {
      throw new Error(
        'tessellated ArrowPolygonRenderer rows must contain a multiple of 3 vertices'
      );
    }
    const colorValue = sourceVectors.colors
      ? materializeArrowValue(sourceVectors.colors.get(rowIndex))
      : null;
    const rowColor = rowColors ? normalizeColor(colorValue, fallbackColor) : fallbackColor;
    const vertexColors = rowColors ? null : (colorValue as Color[] | null);
    for (let coordinateIndex = 0; coordinateIndex < coordinateRows.length; coordinateIndex++) {
      appendPosition(positions, coordinateRows[coordinateIndex]);
      appendColor(colors, vertexColors?.[coordinateIndex] ?? rowColor);
      rowIndices.push(rowIndexOffset + rowIndex);
      indices.push(indices.length);
    }
    polygonCount++;
  }

  const vertexCount = positions.length / OUTPUT_POSITION_COMPONENTS;
  const IndexArray = vertexCount <= 65535 ? Uint16Array : Uint32Array;
  return {
    positions: Float32Array.from(positions),
    colors: Uint8Array.from(colors),
    rowIndices: Uint32Array.from(rowIndices),
    indices: IndexArray.from(indices),
    sourceDimension,
    vertexCount,
    triangleCount: indices.length / 3,
    rowCount: sourceVectors.polygons.length,
    polygonCount
  };
}

function expandPolygonColors(
  sourceVectors: ArrowPolygonSourceVectors,
  rowIndices: Uint32Array,
  nesting: 2 | 3 | 'dense-union',
  fallbackColor: Color = DEFAULT_POLYGON_COLOR,
  sourceRowOffset = 0
): Uint8Array {
  const colors = new Uint8Array(rowIndices.length * 4);
  if (!sourceVectors.colors) {
    for (let index = 0; index < rowIndices.length; index++) {
      colors.set(fallbackColor, index * 4);
    }
    return colors;
  }

  if (isRowColorVector(sourceVectors.colors)) {
    for (let index = 0; index < rowIndices.length; index++) {
      const sourceRowIndex = rowIndices[index] - sourceRowOffset;
      const color = normalizeColor(
        materializeArrowValue(sourceVectors.colors.get(sourceRowIndex)),
        fallbackColor
      );
      colors.set(color, index * 4);
    }
    return colors;
  }

  if (nesting === 'dense-union') {
    throw new Error('Per-vertex colors are not supported for mixed GeoArrow DenseUnion polygons');
  }
  const rowColors = new Map<number, Color[]>();
  for (let sourceRowIndex = 0; sourceRowIndex < sourceVectors.polygons.length; sourceRowIndex++) {
    const coordinates = materializeArrowValue(sourceVectors.polygons.get(sourceRowIndex));
    const colorValues = materializeArrowValue(sourceVectors.colors.get(sourceRowIndex));
    rowColors.set(
      sourceRowIndex,
      flattenPolygonVertexColors(coordinates, colorValues, nesting, fallbackColor)
    );
  }
  const rowColorOffsets = new Map<number, number>();
  for (let index = 0; index < rowIndices.length; index++) {
    const sourceRowIndex = rowIndices[index] - sourceRowOffset;
    const rowColorOffset = rowColorOffsets.get(sourceRowIndex) ?? 0;
    const color = rowColors.get(sourceRowIndex)?.[rowColorOffset];
    if (!color) {
      throw new Error(`Arrow polygon vertex colors do not match geometry row ${sourceRowIndex}`);
    }
    colors.set(color, index * 4);
    rowColorOffsets.set(sourceRowIndex, rowColorOffset + 1);
  }
  return colors;
}

function flattenPolygonVertexColors(
  coordinates: unknown,
  colors: unknown,
  nesting: 2 | 3,
  fallbackColor: Color
): Color[] {
  if (!Array.isArray(coordinates) || !Array.isArray(colors)) return [];
  if (nesting === 3) {
    const values: Color[] = [];
    for (let polygonIndex = 0; polygonIndex < coordinates.length; polygonIndex++) {
      values.push(
        ...flattenPolygonVertexColors(
          coordinates[polygonIndex],
          colors[polygonIndex],
          2,
          fallbackColor
        )
      );
    }
    return values;
  }

  const values: Color[] = [];
  for (let ringIndex = 0; ringIndex < coordinates.length; ringIndex++) {
    const ring = coordinates[ringIndex] as Coordinate[];
    const ringColors = (colors[ringIndex] ?? []) as unknown[];
    const coordinateCount = hasClosingCoordinate(ring) ? ring.length - 1 : ring.length;
    if (coordinateCount < 3) continue;
    for (let coordinateIndex = 0; coordinateIndex < coordinateCount; coordinateIndex++) {
      values.push(normalizeColor(ringColors[coordinateIndex], fallbackColor));
    }
  }
  return values;
}

function hasClosingCoordinate(ring: Coordinate[]): boolean {
  if (ring.length < 2) return false;
  const first = ring[0];
  const last = ring[ring.length - 1];
  return first.length === last.length && first.every((value, index) => value === last[index]);
}

function isRowColorVector(
  colors: Vector<ArrowPolygonColorType> | undefined
): colors is Vector<ArrowPolygonRowColorType> {
  return Boolean(
    colors &&
      DataType.isFixedSizeList(colors.type) &&
      colors.type.listSize === 4 &&
      DataType.isInt(colors.type.children[0].type)
  );
}

function normalizeColor(value: unknown, fallbackColor: Color): Color {
  if (!Array.isArray(value) || value.length < 4) return fallbackColor;
  return [Number(value[0]), Number(value[1]), Number(value[2]), Number(value[3])];
}

function appendPosition(positions: number[], coordinate: Coordinate): void {
  for (let component = 0; component < OUTPUT_POSITION_COMPONENTS; component++) {
    positions.push(coordinate[component] ?? 0);
  }
}

function appendColor(colors: number[], color: Color): void {
  colors.push(color[0], color[1], color[2], color[3]);
}

function getPolygonNesting(type: ArrowPolygonInputType): 1 | 2 | 3 | 'dense-union' {
  if (DataType.isDenseUnion(type)) return 'dense-union';
  let nesting = 0;
  let currentType: ArrowDataType = type;
  while (DataType.isList(currentType)) {
    nesting++;
    currentType = currentType.children[0].type;
  }
  if (nesting < 1 || nesting > 3) {
    throw new Error(`Unsupported Arrow polygon type ${type.toString()}`);
  }
  return nesting as 1 | 2 | 3;
}

function getDimensionSize(dimension: 'xy' | 'xyz' | 'xym' | 'xyzm'): 2 | 3 | 4 {
  return dimension === 'xy' ? 2 : dimension === 'xyzm' ? 4 : 3;
}

function materializeArrowValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (ArrayBuffer.isView(value)) {
    return Array.from(value as unknown as ArrayLike<number>);
  }
  if (Array.isArray(value)) return value.map(materializeArrowValue);
  if (isArrowVectorLike(value)) {
    const values: unknown[] = [];
    for (let index = 0; index < value.length; index++) {
      values.push(materializeArrowValue(value.get(index)));
    }
    return values;
  }
  return value;
}

function isArrowVectorLike(
  value: unknown
): value is {length: number; get: (index: number) => unknown} {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'length' in value &&
      'get' in value &&
      typeof (value as {get?: unknown}).get === 'function'
  );
}
