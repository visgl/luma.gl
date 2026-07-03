// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Data,
  DataType,
  DenseUnion,
  FixedSizeList,
  Float32,
  Float64,
  List,
  Precision,
  Struct,
  Table,
  Uint8,
  Vector
} from 'apache-arrow';
import {dehydrateArrowTable, type DehydratedArrowTable} from './arrow-table-transport';
import {convertGeoArrowVectorToInterleaved} from './geoarrow-interleaving';
import {triangulatePolygon} from './optimized-earcut';

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
  | ArrowPolygonRowColorType
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

type PolygonTessellationWorkerRequest = {
  id: number;
  sourceTable: DehydratedArrowTable;
  hasColors: boolean;
  options: ArrowPolygonTessellationOptions;
};

type PolygonTessellationWorkerResponse =
  | {
      id: number;
      result: ArrowPolygonTessellationResult;
      error?: never;
    }
  | {
      id: number;
      result?: never;
      error: {
        message: string;
        stack?: string;
      };
    };

const pendingWorkerRequests = new Map<
  number,
  {
    resolve: (result: ArrowPolygonTessellationResult) => void;
    reject: (error: Error) => void;
  }
>();

let polygonTessellationWorker: Worker | null | undefined;
let nextWorkerRequestId = 1;

type PolygonTypeInfo = {
  nesting: 1 | 2 | 3 | 'dense-union';
  sourceDimension: 2 | 3 | 4;
};

type ListPolygonTypeInfo = {
  nesting: 1 | 2 | 3;
  sourceDimension: 2 | 3 | 4;
};

type GeoArrowGeometryKind =
  | 'Point'
  | 'LineString'
  | 'Polygon'
  | 'MultiPoint'
  | 'MultiLineString'
  | 'MultiPolygon'
  | 'GeometryCollection';

type ColorKind = 'constant' | 'row' | 'vertex';

const OUTPUT_POSITION_COMPONENTS = 4;
const DEFAULT_POLYGON_COLOR: [number, number, number, number] = [0, 96, 255, 255];

/** Tessellates Arrow polygon rows and expands row/vertex colors to generated vertices. */
export function tessellateArrowPolygons(
  sourceVectors: ArrowPolygonSourceVectors,
  options: ArrowPolygonTessellationOptions = {}
): ArrowPolygonTessellationResult {
  const polygons = convertGeoArrowVectorToInterleaved(
    sourceVectors.polygons
  ) as Vector<ArrowPolygonInputType>;
  const polygonInfo = getPolygonTypeInfo(polygons.type);
  if (options.tessellated && polygonInfo.nesting !== 1) {
    throw new Error('tessellated ArrowPolygonRenderer input must be List<FixedSizeList<...>>');
  }
  if (!options.tessellated && polygonInfo.nesting === 1) {
    throw new Error(
      'ArrowPolygonRenderer requires polygon or multipolygon nesting unless tessellated is true'
    );
  }

  const colorReader = createColorReader(
    sourceVectors.colors,
    polygonInfo.nesting,
    options.color ?? DEFAULT_POLYGON_COLOR
  );
  const positions: number[] = [];
  const colors: number[] = [];
  const rowIndices: number[] = [];
  const indices: number[] = [];
  const rowIndexOffset = options.rowIndexOffset ?? 0;
  let rowIndex = 0;
  let polygonCount = 0;

  for (const data of polygons.data) {
    if (options.tessellated) {
      polygonCount += appendTessellatedRows({
        data: data as Data<ArrowTessellatedPolygonType>,
        rowIndex,
        rowIndexOffset,
        sourceDimension: polygonInfo.sourceDimension,
        colorReader,
        positions,
        colors,
        rowIndices,
        indices
      });
    } else if (polygonInfo.nesting === 2) {
      polygonCount += appendPolygonRows({
        data: data as Data<ArrowPolygonType>,
        rowIndex,
        rowIndexOffset,
        sourceDimension: polygonInfo.sourceDimension,
        colorReader,
        positions,
        colors,
        rowIndices,
        indices
      });
    } else if (polygonInfo.nesting === 3) {
      polygonCount += appendMultiPolygonRows({
        data: data as Data<ArrowMultiPolygonType>,
        rowIndex,
        rowIndexOffset,
        sourceDimension: polygonInfo.sourceDimension,
        colorReader,
        positions,
        colors,
        rowIndices,
        indices
      });
    } else {
      polygonCount += appendDenseUnionGeometryRows({
        data: data as Data<ArrowGeoArrowGeometryType>,
        rowIndex,
        rowIndexOffset,
        sourceDimension: polygonInfo.sourceDimension,
        colorReader,
        positions,
        colors,
        rowIndices,
        indices
      });
    }
    rowIndex += data.length;
  }

  const vertexCount = positions.length / OUTPUT_POSITION_COMPONENTS;
  const indexArray = makeIndexArray(indices, vertexCount);

  return {
    positions: Float32Array.from(positions),
    colors: Uint8Array.from(colors),
    rowIndices: Uint32Array.from(rowIndices),
    indices: indexArray,
    sourceDimension: polygonInfo.sourceDimension,
    vertexCount,
    triangleCount: indexArray.length / 3,
    rowCount: polygons.length,
    polygonCount
  };
}

/** Async tessellation entrypoint for callers that need to keep render/update paths awaitable. */
export async function tesselateAsync(
  sourceVectors: ArrowPolygonSourceVectors,
  options: ArrowPolygonTessellationOptions = {}
): Promise<ArrowPolygonTessellationResult> {
  const worker = getPolygonTessellationWorker();
  if (worker) {
    return await tessellateArrowPolygonsWithWorker(worker, sourceVectors, options);
  }

  await Promise.resolve();
  return tessellateArrowPolygons(sourceVectors, options);
}

function getPolygonTessellationWorker(): Worker | null {
  if (polygonTessellationWorker !== undefined) {
    return polygonTessellationWorker;
  }
  if (typeof Worker === 'undefined') {
    polygonTessellationWorker = null;
    return polygonTessellationWorker;
  }

  try {
    polygonTessellationWorker = new Worker(
      new URL('./arrow-polygon-tessellation-worker.js', import.meta.url),
      {type: 'module'}
    );
    polygonTessellationWorker.addEventListener('message', handleWorkerMessage);
    polygonTessellationWorker.addEventListener('error', handleWorkerError);
  } catch {
    polygonTessellationWorker = null;
  }

  return polygonTessellationWorker;
}

function tessellateArrowPolygonsWithWorker(
  worker: Worker,
  sourceVectors: ArrowPolygonSourceVectors,
  options: ArrowPolygonTessellationOptions
): Promise<ArrowPolygonTessellationResult> {
  const id = nextWorkerRequestId++;
  const sourceTable = dehydrateArrowTable(
    new Table({
      polygons: sourceVectors.polygons,
      ...(sourceVectors.colors ? {colors: sourceVectors.colors} : {})
    })
  );
  const request: PolygonTessellationWorkerRequest = {
    id,
    sourceTable,
    hasColors: Boolean(sourceVectors.colors),
    options
  };

  return new Promise((resolve, reject) => {
    pendingWorkerRequests.set(id, {resolve, reject});
    worker.postMessage(request);
  });
}

function handleWorkerMessage(event: MessageEvent<PolygonTessellationWorkerResponse>): void {
  const {id, result, error} = event.data;
  const pendingRequest = pendingWorkerRequests.get(id);
  if (!pendingRequest) {
    return;
  }
  pendingWorkerRequests.delete(id);
  if (error) {
    const workerError = new Error(error.message);
    workerError.stack = error.stack;
    pendingRequest.reject(workerError);
    return;
  }
  pendingRequest.resolve(result);
}

function handleWorkerError(event: ErrorEvent): void {
  const error = new Error(event.message);
  for (const pendingRequest of pendingWorkerRequests.values()) {
    pendingRequest.reject(error);
  }
  pendingWorkerRequests.clear();
  polygonTessellationWorker?.terminate();
  polygonTessellationWorker = null;
}

function appendTessellatedRows(props: {
  data: Data<ArrowTessellatedPolygonType>;
  rowIndex: number;
  rowIndexOffset: number;
  sourceDimension: 2 | 3 | 4;
  colorReader: ReturnType<typeof createColorReader>;
  positions: number[];
  colors: number[];
  rowIndices: number[];
  indices: number[];
}): number {
  const {
    data,
    rowIndex,
    rowIndexOffset,
    sourceDimension,
    colorReader,
    positions,
    colors,
    rowIndices,
    indices
  } = props;
  const coordinateData = data.children[0] as Data<ArrowPolygonCoordinateType>;
  const values = getCoordinateValues(coordinateData);
  let polygonCount = 0;

  for (let localRowIndex = 0; localRowIndex < data.length; localRowIndex++) {
    const coordinateStart = data.valueOffsets[localRowIndex];
    const coordinateEnd = data.valueOffsets[localRowIndex + 1];
    const coordinateCount = coordinateEnd - coordinateStart;
    if (coordinateCount % 3 !== 0) {
      throw new Error(
        'tessellated ArrowPolygonRenderer rows must contain a multiple of 3 vertices'
      );
    }
    const outputBase = positions.length / OUTPUT_POSITION_COMPONENTS;
    const sourceRowIndex = rowIndex + localRowIndex;
    const outputRowIndex = rowIndexOffset + sourceRowIndex;
    for (
      let coordinateIndex = coordinateStart;
      coordinateIndex < coordinateEnd;
      coordinateIndex++
    ) {
      appendVertex({
        sourceDimension,
        values,
        coordinateIndex,
        sourceRowIndex,
        outputRowIndex,
        rowCoordinateStart: coordinateStart,
        colorReader,
        positions,
        colors,
        rowIndices
      });
      indices.push(outputBase + coordinateIndex - coordinateStart);
    }
    polygonCount++;
  }
  return polygonCount;
}

function appendPolygonRows(props: {
  data: Data<ArrowPolygonType>;
  rowIndex: number;
  rowIndexOffset: number;
  sourceDimension: 2 | 3 | 4;
  colorReader: ReturnType<typeof createColorReader>;
  positions: number[];
  colors: number[];
  rowIndices: number[];
  indices: number[];
}): number {
  const {
    data,
    rowIndex,
    rowIndexOffset,
    sourceDimension,
    colorReader,
    positions,
    colors,
    rowIndices,
    indices
  } = props;
  const ringData = data.children[0] as Data<List<ArrowPolygonCoordinateType>>;
  const coordinateData = ringData.children[0] as Data<ArrowPolygonCoordinateType>;
  const values = getCoordinateValues(coordinateData);
  let polygonCount = 0;

  for (let localRowIndex = 0; localRowIndex < data.length; localRowIndex++) {
    const sourceRowIndex = rowIndex + localRowIndex;
    const outputRowIndex = rowIndexOffset + sourceRowIndex;
    polygonCount += appendPolygonRow({
      data,
      ringData,
      values,
      localRowIndex,
      sourceRowIndex,
      outputRowIndex,
      sourceDimension,
      colorReader,
      positions,
      colors,
      rowIndices,
      indices
    });
  }
  return polygonCount;
}

function appendMultiPolygonRows(props: {
  data: Data<ArrowMultiPolygonType>;
  rowIndex: number;
  rowIndexOffset: number;
  sourceDimension: 2 | 3 | 4;
  colorReader: ReturnType<typeof createColorReader>;
  positions: number[];
  colors: number[];
  rowIndices: number[];
  indices: number[];
}): number {
  const {
    data,
    rowIndex,
    rowIndexOffset,
    sourceDimension,
    colorReader,
    positions,
    colors,
    rowIndices,
    indices
  } = props;
  const polygonData = data.children[0] as Data<ArrowPolygonType>;
  const ringData = polygonData.children[0] as Data<List<ArrowPolygonCoordinateType>>;
  const coordinateData = ringData.children[0] as Data<ArrowPolygonCoordinateType>;
  const values = getCoordinateValues(coordinateData);
  let polygonCount = 0;

  for (let localRowIndex = 0; localRowIndex < data.length; localRowIndex++) {
    const sourceRowIndex = rowIndex + localRowIndex;
    const outputRowIndex = rowIndexOffset + sourceRowIndex;
    polygonCount += appendMultiPolygonRow({
      data,
      polygonData,
      ringData,
      values,
      localRowIndex,
      sourceRowIndex,
      outputRowIndex,
      sourceDimension,
      colorReader,
      positions,
      colors,
      rowIndices,
      indices
    });
  }
  return polygonCount;
}

function appendDenseUnionGeometryRows(props: {
  data: Data<ArrowGeoArrowGeometryType>;
  rowIndex: number;
  rowIndexOffset: number;
  sourceDimension: 2 | 3 | 4;
  colorReader: ReturnType<typeof createColorReader>;
  positions: number[];
  colors: number[];
  rowIndices: number[];
  indices: number[];
}): number {
  const {
    data,
    rowIndex,
    rowIndexOffset,
    sourceDimension,
    colorReader,
    positions,
    colors,
    rowIndices,
    indices
  } = props;
  let polygonCount = 0;

  for (let localRowIndex = 0; localRowIndex < data.length; localRowIndex++) {
    const typeId = data.typeIds[localRowIndex];
    const geometryKind = getGeoArrowGeometryKindFromTypeId(typeId);
    if (geometryKind !== 'Polygon' && geometryKind !== 'MultiPolygon') {
      continue;
    }

    const childIndex = data.type.typeIdToChildIndex[typeId];
    const childData = data.children[childIndex];
    const childRowIndex = data.valueOffsets[localRowIndex];
    const sourceRowIndex = rowIndex + localRowIndex;
    const outputRowIndex = rowIndexOffset + sourceRowIndex;
    if (!childData.getValid(childRowIndex)) {
      continue;
    }

    if (geometryKind === 'Polygon') {
      const polygonData = childData as Data<ArrowPolygonType>;
      const ringData = polygonData.children[0] as Data<List<ArrowPolygonCoordinateType>>;
      const coordinateData = ringData.children[0] as Data<ArrowPolygonCoordinateType>;
      polygonCount += appendPolygonRow({
        data: polygonData,
        ringData,
        values: getCoordinateValues(coordinateData),
        localRowIndex: childRowIndex,
        sourceRowIndex,
        outputRowIndex,
        sourceDimension,
        colorReader,
        positions,
        colors,
        rowIndices,
        indices
      });
    } else {
      const multiPolygonData = childData as Data<ArrowMultiPolygonType>;
      const polygonData = multiPolygonData.children[0] as Data<ArrowPolygonType>;
      const ringData = polygonData.children[0] as Data<List<ArrowPolygonCoordinateType>>;
      const coordinateData = ringData.children[0] as Data<ArrowPolygonCoordinateType>;
      polygonCount += appendMultiPolygonRow({
        data: multiPolygonData,
        polygonData,
        ringData,
        values: getCoordinateValues(coordinateData),
        localRowIndex: childRowIndex,
        sourceRowIndex,
        outputRowIndex,
        sourceDimension,
        colorReader,
        positions,
        colors,
        rowIndices,
        indices
      });
    }
  }

  return polygonCount;
}

function appendPolygonRow(props: {
  data: Data<ArrowPolygonType>;
  ringData: Data<List<ArrowPolygonCoordinateType>>;
  values: Float32Array | Float64Array;
  localRowIndex: number;
  sourceRowIndex: number;
  outputRowIndex: number;
  sourceDimension: 2 | 3 | 4;
  colorReader: ReturnType<typeof createColorReader>;
  positions: number[];
  colors: number[];
  rowIndices: number[];
  indices: number[];
}): number {
  const {
    data,
    ringData,
    values,
    localRowIndex,
    sourceRowIndex,
    outputRowIndex,
    sourceDimension,
    colorReader,
    positions,
    colors,
    rowIndices,
    indices
  } = props;
  if (!data.getValid(localRowIndex)) {
    return 0;
  }

  const ringStart = data.valueOffsets[localRowIndex];
  const ringEnd = data.valueOffsets[localRowIndex + 1];
  appendEarcutPolygon({
    ringStart,
    ringEnd,
    rowCoordinateStart: ringData.valueOffsets[ringStart],
    sourceRowIndex,
    outputRowIndex,
    sourceDimension,
    ringOffsets: ringData.valueOffsets,
    values,
    colorReader,
    positions,
    colors,
    rowIndices,
    indices
  });
  return 1;
}

function appendMultiPolygonRow(props: {
  data: Data<ArrowMultiPolygonType>;
  polygonData: Data<ArrowPolygonType>;
  ringData: Data<List<ArrowPolygonCoordinateType>>;
  values: Float32Array | Float64Array;
  localRowIndex: number;
  sourceRowIndex: number;
  outputRowIndex: number;
  sourceDimension: 2 | 3 | 4;
  colorReader: ReturnType<typeof createColorReader>;
  positions: number[];
  colors: number[];
  rowIndices: number[];
  indices: number[];
}): number {
  const {
    data,
    polygonData,
    ringData,
    values,
    localRowIndex,
    sourceRowIndex,
    outputRowIndex,
    sourceDimension,
    colorReader,
    positions,
    colors,
    rowIndices,
    indices
  } = props;
  if (!data.getValid(localRowIndex)) {
    return 0;
  }

  const polygonStart = data.valueOffsets[localRowIndex];
  const polygonEnd = data.valueOffsets[localRowIndex + 1];
  const rowCoordinateStart = ringData.valueOffsets[polygonData.valueOffsets[polygonStart]];
  let polygonCount = 0;
  for (let polygonIndex = polygonStart; polygonIndex < polygonEnd; polygonIndex++) {
    appendEarcutPolygon({
      ringStart: polygonData.valueOffsets[polygonIndex],
      ringEnd: polygonData.valueOffsets[polygonIndex + 1],
      rowCoordinateStart,
      sourceRowIndex,
      outputRowIndex,
      sourceDimension,
      ringOffsets: ringData.valueOffsets,
      values,
      colorReader,
      positions,
      colors,
      rowIndices,
      indices
    });
    polygonCount++;
  }
  return polygonCount;
}

function appendEarcutPolygon(props: {
  ringStart: number;
  ringEnd: number;
  rowCoordinateStart: number;
  sourceRowIndex: number;
  outputRowIndex: number;
  sourceDimension: 2 | 3 | 4;
  ringOffsets: Int32Array;
  values: Float32Array | Float64Array;
  colorReader: ReturnType<typeof createColorReader>;
  positions: number[];
  colors: number[];
  rowIndices: number[];
  indices: number[];
}): void {
  const {
    ringStart,
    ringEnd,
    rowCoordinateStart,
    sourceRowIndex,
    outputRowIndex,
    sourceDimension,
    ringOffsets,
    values,
    colorReader,
    positions,
    colors,
    rowIndices,
    indices
  } = props;
  if (ringEnd <= ringStart) {
    return;
  }

  const coordinateStart = ringOffsets[ringStart];
  const coordinateEnd = ringOffsets[ringEnd];
  const outputBase = positions.length / OUTPUT_POSITION_COMPONENTS;
  for (let coordinateIndex = coordinateStart; coordinateIndex < coordinateEnd; coordinateIndex++) {
    appendVertex({
      sourceDimension,
      values,
      coordinateIndex,
      sourceRowIndex,
      outputRowIndex,
      rowCoordinateStart,
      colorReader,
      positions,
      colors,
      rowIndices
    });
  }

  const triangleIndexStart = indices.length;
  triangulatePolygon({
    values,
    sourceDimension,
    ringOffsets,
    ringStart,
    ringEnd,
    outputBase,
    indices
  });
  if (indices.length === triangleIndexStart && coordinateEnd - coordinateStart >= 3) {
    throw new Error('ArrowPolygonRenderer earcut failed, possibly due to an invalid polygon');
  }
}

function appendVertex(props: {
  sourceDimension: 2 | 3 | 4;
  values: Float32Array | Float64Array;
  coordinateIndex: number;
  sourceRowIndex: number;
  outputRowIndex: number;
  rowCoordinateStart: number;
  colorReader: ReturnType<typeof createColorReader>;
  positions: number[];
  colors: number[];
  rowIndices: number[];
}): void {
  const {
    sourceDimension,
    values,
    coordinateIndex,
    sourceRowIndex,
    outputRowIndex,
    rowCoordinateStart,
    colorReader,
    positions,
    colors,
    rowIndices
  } = props;
  const sourceOffset = coordinateIndex * sourceDimension;
  for (let componentIndex = 0; componentIndex < OUTPUT_POSITION_COMPONENTS; componentIndex++) {
    positions.push(
      componentIndex < sourceDimension ? Number(values[sourceOffset + componentIndex]) : 0
    );
  }
  const color = colorReader.getColor(sourceRowIndex, coordinateIndex - rowCoordinateStart);
  colors.push(color[0], color[1], color[2], color[3]);
  rowIndices.push(outputRowIndex);
}

function createColorReader(
  colors: Vector<ArrowPolygonColorType> | undefined,
  polygonNesting: PolygonTypeInfo['nesting'],
  constantColor: [number, number, number, number]
): {
  kind: ColorKind;
  getColor: (rowIndex: number, coordinateIndex: number) => [number, number, number, number];
} {
  if (!colors) {
    return {
      kind: 'constant',
      getColor: () => constantColor
    };
  }

  const colorInfo = getColorTypeInfo(colors.type, polygonNesting);
  if (colorInfo === 'row') {
    return {
      kind: 'row',
      getColor: rowIndex => getRowColor(colors, rowIndex, constantColor)
    };
  }

  const rowCache = new Map<number, Uint8Array>();
  return {
    kind: 'vertex',
    getColor: (rowIndex, coordinateIndex) => {
      let rowColors = rowCache.get(rowIndex);
      if (!rowColors) {
        const row = colors.get(rowIndex);
        if (!row) {
          return constantColor;
        }
        rowColors = flattenVertexColors(row, constantColor);
        rowCache.set(rowIndex, rowColors);
      }
      const colorOffset = coordinateIndex * 4;
      if (colorOffset + 3 >= rowColors.length) {
        throw new Error('ArrowPolygonRenderer vertex colors must align with polygon coordinates');
      }
      return [
        rowColors[colorOffset],
        rowColors[colorOffset + 1],
        rowColors[colorOffset + 2],
        rowColors[colorOffset + 3]
      ];
    }
  };
}

function flattenVertexColors(
  value: unknown,
  fallback: [number, number, number, number]
): Uint8Array {
  const colors: number[] = [];
  appendFlattenedColors(value, colors, fallback);
  return Uint8Array.from(colors);
}

function appendFlattenedColors(
  value: unknown,
  colors: number[],
  fallback: [number, number, number, number]
): void {
  if (!isVectorLike(value)) {
    colors.push(...fallback);
    return;
  }
  if (isUint8Type(value.type) && value.length === 4) {
    colors.push(
      Number(value.get(0)),
      Number(value.get(1)),
      Number(value.get(2)),
      Number(value.get(3))
    );
    return;
  }
  for (let index = 0; index < value.length; index++) {
    appendFlattenedColors(value.get(index), colors, fallback);
  }
}

function getRowColor(
  colors: Vector<ArrowPolygonColorType>,
  rowIndex: number,
  fallback: [number, number, number, number]
): [number, number, number, number] {
  const value = colors.get(rowIndex);
  if (!value) {
    return fallback;
  }
  if (!isVectorLike(value) || value.length !== 4) {
    throw new Error('ArrowPolygonRenderer row colors must be FixedSizeList<Uint8, 4>');
  }
  return [Number(value.get(0)), Number(value.get(1)), Number(value.get(2)), Number(value.get(3))];
}

function getPolygonTypeInfo(type: ArrowPolygonInputType): PolygonTypeInfo {
  if (type instanceof DenseUnion || DataType.isDenseUnion(type)) {
    return getDenseUnionPolygonTypeInfo(type as ArrowGeoArrowGeometryType);
  }

  return getListPolygonTypeInfo(type);
}

function getListPolygonTypeInfo(type: unknown): ListPolygonTypeInfo {
  let nesting = 0;
  let childType: unknown = type;
  while (childType instanceof List) {
    nesting++;
    childType = childType.children[0].type;
  }
  if (!(childType instanceof FixedSizeList)) {
    throw new Error('ArrowPolygonRenderer polygons must contain FixedSizeList coordinates');
  }
  if (childType.listSize < 2 || childType.listSize > 4) {
    throw new Error('ArrowPolygonRenderer polygon coordinates must have 2, 3, or 4 components');
  }
  const valueType = childType.children[0].type;
  if (!DataType.isFloat(valueType)) {
    throw new Error(
      'ArrowPolygonRenderer polygon coordinates must contain Float32 or Float64 values'
    );
  }
  if (valueType.precision !== Precision.SINGLE && valueType.precision !== Precision.DOUBLE) {
    throw new Error(
      'ArrowPolygonRenderer polygon coordinates must contain Float32 or Float64 values'
    );
  }
  if (nesting < 1 || nesting > 3) {
    throw new Error('ArrowPolygonRenderer polygons must be List, List<List>, or List<List<List>>');
  }
  return {
    nesting: nesting as 1 | 2 | 3,
    sourceDimension: childType.listSize as 2 | 3 | 4
  };
}

function getDenseUnionPolygonTypeInfo(type: ArrowGeoArrowGeometryType): PolygonTypeInfo {
  let sourceDimension: 2 | 3 | 4 | null = null;

  for (const typeId of type.typeIds) {
    const geometryKind = getGeoArrowGeometryKindFromTypeId(typeId);
    if (geometryKind !== 'Polygon' && geometryKind !== 'MultiPolygon') {
      continue;
    }

    const childIndex = type.typeIdToChildIndex[typeId];
    const childField = type.children[childIndex];
    const childInfo = getListPolygonTypeInfo(childField.type);
    const expectedNesting = geometryKind === 'Polygon' ? 2 : 3;
    if (childInfo.nesting !== expectedNesting) {
      throw new Error(
        `GeoArrow DenseUnion ${geometryKind} child must use ${getPolygonNestingLabel(expectedNesting)} nesting`
      );
    }
    if (sourceDimension !== null && sourceDimension !== childInfo.sourceDimension) {
      throw new Error('GeoArrow DenseUnion polygon children must use one coordinate dimension');
    }
    sourceDimension = childInfo.sourceDimension;
  }

  if (sourceDimension === null) {
    throw new Error('GeoArrow DenseUnion polygons must include Polygon or MultiPolygon children');
  }

  return {nesting: 'dense-union', sourceDimension};
}

function getColorTypeInfo(
  type: ArrowPolygonColorType,
  polygonNesting: PolygonTypeInfo['nesting']
): 'row' | 'vertex' {
  let nesting = 0;
  let childType: unknown = type;
  while (childType instanceof List) {
    nesting++;
    childType = childType.children[0].type;
  }
  if (!(childType instanceof FixedSizeList)) {
    throw new Error('ArrowPolygonRenderer colors must contain FixedSizeList<Uint8, 4> values');
  }
  if (childType.listSize !== 4 || !isUint8Type(childType.children[0].type)) {
    throw new Error('ArrowPolygonRenderer colors must contain FixedSizeList<Uint8, 4> values');
  }
  if (nesting === 0) {
    return 'row';
  }
  if (polygonNesting === 'dense-union') {
    throw new Error('GeoArrow DenseUnion polygon rows only support constant or per-row colors');
  }
  if (nesting === polygonNesting) {
    return 'vertex';
  }
  throw new Error('ArrowPolygonRenderer vertex colors must use the same list nesting as polygons');
}

function getPolygonNestingLabel(nesting: 2 | 3): string {
  return nesting === 2 ? 'List<List<FixedSizeList<...>>>' : 'List<List<List<FixedSizeList<...>>>>';
}

function isUint8Type(type: unknown): type is Uint8 {
  if (type instanceof Uint8) {
    return true;
  }
  if (!DataType.isInt(type)) {
    return false;
  }
  return type.bitWidth === 8 && type.isSigned === false;
}

function getGeoArrowGeometryKindFromTypeId(typeId: number): GeoArrowGeometryKind {
  switch (typeId % 10) {
    case 1:
      return 'Point';
    case 2:
      return 'LineString';
    case 3:
      return 'Polygon';
    case 4:
      return 'MultiPoint';
    case 5:
      return 'MultiLineString';
    case 6:
      return 'MultiPolygon';
    case 7:
      return 'GeometryCollection';
    default:
      throw new Error(`Unsupported GeoArrow DenseUnion geometry type id ${typeId}`);
  }
}

function getCoordinateValues(data: Data<ArrowPolygonCoordinateType>): Float32Array | Float64Array {
  const values = data.children[0]?.values;
  if (!(values instanceof Float32Array) && !(values instanceof Float64Array)) {
    throw new Error(
      'ArrowPolygonRenderer coordinates must be backed by Float32Array or Float64Array'
    );
  }
  return values;
}

function makeIndexArray(indices: number[], vertexCount: number): Uint16Array | Uint32Array {
  if (vertexCount <= 65535) {
    return Uint16Array.from(indices);
  }
  return Uint32Array.from(indices);
}

function isVectorLike(value: unknown): value is {
  type: unknown;
  length: number;
  get: (index: number) => unknown;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'length' in value &&
    'get' in value &&
    typeof (value as {get?: unknown}).get === 'function'
  );
}
