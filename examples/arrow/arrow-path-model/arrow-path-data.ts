// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getArrowVectorByteLength, makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';
import type {
  ArrowPathRendererModel,
  ArrowPathRendererSourceData,
  ArrowPathRendererTimeColumn,
  ArrowPathSourceCoordinateType,
  ArrowPathSourceTimestampType
} from './arrow-path-renderer';

export const TEMPORAL_EPOCH_MILLISECONDS = 1_700_000_000_000n;
export const TEMPORAL_MILLISECONDS_PER_MEASURE_UNIT = 1000;
export const MEASURE_SWEEP_DURATION = 1.48;
export const TEMPORAL_TRAIL_LENGTH_MILLISECONDS = 220;
export const STREAMING_PATH_BATCH_COUNT = 10;
export const STREAMING_PATH_BATCH_INTERVAL_MS = 1000;
export const STREAMING_PATH_ROWS_PER_CHUNK = 240;
const GEOARROW_LINESTRING_XYM_TYPE_ID = 12;
const GEOARROW_LINESTRING_XYZM_TYPE_ID = 13;

type ArrowPathVertexColorType = arrow.List<arrow.FixedSizeList<arrow.Uint8>>;
export type ArrowPathBaseRowCountKind = '240' | '960' | '2400';
export type ArrowPathRowCountKind = '240-stream' | '2400-stream';
export type ArrowPathCoordinateKind = 'float32' | 'float64' | 'dense-union';
export type ArrowPathColorKind = 'none' | 'row-colors' | 'vertex-colors';
export type ArrowPathTimeKind = ArrowPathRendererTimeColumn;
export type ArrowPathCapKind = 'square' | 'round';
export type ArrowPathJointKind = 'miter' | 'round';
export type ArrowPathDataset = {
  pathCount: number;
  pointCount: number;
  label: string;
};

export const PATH_DATASETS: Record<ArrowPathBaseRowCountKind, ArrowPathDataset> = {
  '240': {
    pathCount: 240,
    pointCount: 18,
    label: '240 paths, 4.1K segments'
  },
  '960': {
    pathCount: 960,
    pointCount: 22,
    label: '960 paths, 20K segments'
  },
  '2400': {
    pathCount: 2400,
    pointCount: 26,
    label: '2.4K paths, 60K segments'
  }
};

export function getValidPathModelKindForTimeKind(
  modelKind: ArrowPathRendererModel,
  timeKind: ArrowPathTimeKind
): ArrowPathRendererModel {
  if (timeKind === 'timestamps') {
    return modelKind === 'auto' ? 'auto' : 'trips';
  }
  return modelKind === 'trips' ? 'auto' : modelKind;
}

export function makeArrowPathSourceData(
  dataset: ArrowPathDataset,
  coordinateKind: ArrowPathCoordinateKind,
  colorKind: ArrowPathColorKind,
  timeKind: ArrowPathTimeKind,
  rowsPerChunk: number | null = null
): ArrowPathRendererSourceData {
  const buildStartTime = getNow();
  const paths = makePathVector(dataset.pathCount, dataset.pointCount, coordinateKind, rowsPerChunk);
  const timestamps =
    timeKind === 'timestamps'
      ? makePathTimestampVector(dataset.pathCount, dataset.pointCount, rowsPerChunk)
      : undefined;
  const colors =
    colorKind === 'none'
      ? undefined
      : colorKind === 'vertex-colors'
        ? makePathColorListVector(dataset.pathCount, dataset.pointCount, rowsPerChunk)
        : makePathRowColorVector(dataset.pathCount, rowsPerChunk);
  const widths = makePathWidthVector(dataset.pathCount, rowsPerChunk);
  const arrowVectorBuildTimeMs = getNow() - buildStartTime;
  const pathArrowByteLength =
    getArrowVectorByteLength(paths) + (timestamps ? getArrowVectorByteLength(timestamps) : 0);
  const styleArrowByteLength =
    (colors ? getArrowVectorByteLength(colors) : 0) + getArrowVectorByteLength(widths);
  return {
    sourceVectors: {
      paths,
      ...(colors ? {colors} : {}),
      widths,
      ...(timestamps ? {timestamps} : {})
    },
    pathArrowByteLength,
    styleArrowByteLength,
    arrowVectorBuildTimeMs
  };
}

export function makeArrowPathRecordBatches(
  sourceData: ArrowPathRendererSourceData
): arrow.RecordBatch[] {
  return new arrow.Table(sourceData.sourceVectors).batches;
}

export async function* createStreamingPathRecordBatchIterator(
  recordBatches: arrow.RecordBatch[]
): AsyncGenerator<arrow.RecordBatch> {
  for (let batchIndex = 0; batchIndex < recordBatches.length; batchIndex++) {
    if (batchIndex > 0) {
      await waitForStreamingBatchDelay();
    }
    const recordBatch = recordBatches[batchIndex];
    if (recordBatch) {
      yield recordBatch;
    }
  }
}

function waitForStreamingBatchDelay(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, STREAMING_PATH_BATCH_INTERVAL_MS);
  });
}

function makePathVector(
  pathCount: number,
  pointCount: number,
  coordinateKind: ArrowPathCoordinateKind,
  rowsPerChunk: number | null = null
): arrow.Vector<ArrowPathSourceCoordinateType> {
  if (coordinateKind === 'dense-union') {
    return makeDenseUnionPathVector(pathCount, pointCount, rowsPerChunk);
  }

  const coordinateValueType =
    coordinateKind === 'float64' ? new arrow.Float64() : new arrow.Float32();
  const dataChunks: arrow.Data<ArrowPathSourceCoordinateType>[] = [];
  forEachPathChunk(pathCount, rowsPerChunk, (pathStart, chunkPathCount) => {
    dataChunks.push(
      makePathListDataChunk(
        makePathIndexRange(pathStart, chunkPathCount),
        pathCount,
        pointCount,
        coordinateValueType,
        4
      )
    );
  });
  return new arrow.Vector(dataChunks) as arrow.Vector<ArrowPathSourceCoordinateType>;
}

function makeDenseUnionPathVector(
  pathCount: number,
  pointCount: number,
  rowsPerChunk: number | null = null
): arrow.Vector<ArrowPathSourceCoordinateType> {
  const dataChunks: arrow.Data<arrow.DenseUnion>[] = [];
  forEachPathChunk(pathCount, rowsPerChunk, (pathStart, chunkPathCount) => {
    const typeIds = new Int8Array(chunkPathCount);
    const valueOffsets = new Int32Array(chunkPathCount);
    const lineStringXYMPathIndices: number[] = [];
    const lineStringXYZMPathIndices: number[] = [];

    for (let localPathIndex = 0; localPathIndex < chunkPathCount; localPathIndex++) {
      const pathIndex = pathStart + localPathIndex;
      if (pathIndex % 2 === 0) {
        typeIds[localPathIndex] = GEOARROW_LINESTRING_XYM_TYPE_ID;
        valueOffsets[localPathIndex] = lineStringXYMPathIndices.length;
        lineStringXYMPathIndices.push(pathIndex);
      } else {
        typeIds[localPathIndex] = GEOARROW_LINESTRING_XYZM_TYPE_ID;
        valueOffsets[localPathIndex] = lineStringXYZMPathIndices.length;
        lineStringXYZMPathIndices.push(pathIndex);
      }
    }

    const lineStringXYMData = makePathListDataChunk(
      lineStringXYMPathIndices,
      pathCount,
      pointCount,
      new arrow.Float32(),
      3
    );
    const lineStringXYZMData = makePathListDataChunk(
      lineStringXYZMPathIndices,
      pathCount,
      pointCount,
      new arrow.Float64(),
      4
    );
    const unionType = new arrow.DenseUnion(
      [GEOARROW_LINESTRING_XYM_TYPE_ID, GEOARROW_LINESTRING_XYZM_TYPE_ID],
      [
        new arrow.Field('LineStringXYM', lineStringXYMData.type, true),
        new arrow.Field('LineStringXYZM', lineStringXYZMData.type, true)
      ]
    );

    dataChunks.push(
      arrow.makeData({
        type: unionType,
        length: chunkPathCount,
        nullCount: 0,
        typeIds,
        valueOffsets,
        children: [lineStringXYMData, lineStringXYZMData]
      }) as arrow.Data<arrow.DenseUnion>
    );
  });
  return new arrow.Vector(dataChunks) as arrow.Vector<ArrowPathSourceCoordinateType>;
}

function makePathListDataChunk(
  pathIndices: number[],
  pathCount: number,
  pointCount: number,
  coordinateValueType: arrow.Float32 | arrow.Float64,
  coordinateComponentCount: 3 | 4
): arrow.Data<ArrowPathSourceCoordinateType> {
  const coordinateType = new arrow.FixedSizeList(
    coordinateComponentCount,
    new arrow.Field('values', coordinateValueType, false)
  );
  const pathType = new arrow.List(new arrow.Field('coordinates', coordinateType, false));
  const valueOffsets = new Int32Array(pathIndices.length + 1);
  const values =
    coordinateValueType instanceof arrow.Float64
      ? new Float64Array(pathIndices.length * pointCount * coordinateComponentCount)
      : new Float32Array(pathIndices.length * pointCount * coordinateComponentCount);

  for (let localPathIndex = 0; localPathIndex < pathIndices.length; localPathIndex++) {
    const pathIndex = pathIndices[localPathIndex];
    valueOffsets[localPathIndex] = localPathIndex * pointCount;
    for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
      writePathCoordinate(
        values,
        (localPathIndex * pointCount + pointIndex) * coordinateComponentCount,
        pathIndex,
        pathCount,
        pointIndex,
        pointCount,
        coordinateComponentCount
      );
    }
  }

  valueOffsets[pathIndices.length] = pathIndices.length * pointCount;
  const coordinateValueData = new arrow.Data(coordinateValueType, 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  });
  const coordinateData = new arrow.Data(
    coordinateType,
    0,
    values.length / coordinateComponentCount,
    0,
    {},
    [coordinateValueData]
  );
  return new arrow.Data(
    pathType,
    0,
    pathIndices.length,
    0,
    {[arrow.BufferType.OFFSET]: valueOffsets},
    [coordinateData]
  ) as arrow.Data<ArrowPathSourceCoordinateType>;
}

function makePathIndexRange(pathStart: number, pathCount: number): number[] {
  const pathIndices: number[] = [];
  for (let localPathIndex = 0; localPathIndex < pathCount; localPathIndex++) {
    pathIndices.push(pathStart + localPathIndex);
  }
  return pathIndices;
}

function makePathTimestampVector(
  pathCount: number,
  pointCount: number,
  rowsPerChunk: number | null = null
): arrow.Vector<ArrowPathSourceTimestampType> {
  const timestampType = new arrow.TimestampMillisecond();
  const pathTimestampType = new arrow.List(new arrow.Field('timestamps', timestampType, false));
  const dataChunks: arrow.Data<ArrowPathSourceTimestampType>[] = [];
  forEachPathChunk(pathCount, rowsPerChunk, (pathStart, chunkPathCount) => {
    const valueOffsets = new Int32Array(chunkPathCount + 1);
    const timestamps = new BigInt64Array(chunkPathCount * pointCount);
    for (let localPathIndex = 0; localPathIndex < chunkPathCount; localPathIndex++) {
      const pathIndex = pathStart + localPathIndex;
      valueOffsets[localPathIndex] = localPathIndex * pointCount;
      for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
        const timestampIndex = localPathIndex * pointCount + pointIndex;
        timestamps[timestampIndex] =
          TEMPORAL_EPOCH_MILLISECONDS +
          BigInt(
            Math.round(
              getPathMeasure(pathIndex, pointIndex, pointCount) *
                TEMPORAL_MILLISECONDS_PER_MEASURE_UNIT
            )
          );
      }
    }
    valueOffsets[chunkPathCount] = chunkPathCount * pointCount;
    const timestampData = new arrow.Data(timestampType, 0, timestamps.length, 0, {
      [arrow.BufferType.DATA]: timestamps
    });
    dataChunks.push(
      new arrow.Data(
        pathTimestampType,
        0,
        chunkPathCount,
        0,
        {[arrow.BufferType.OFFSET]: valueOffsets},
        [timestampData]
      ) as arrow.Data<ArrowPathSourceTimestampType>
    );
  });
  return new arrow.Vector(dataChunks) as arrow.Vector<ArrowPathSourceTimestampType>;
}

function makePathColorListVector(
  pathCount: number,
  pointCount: number,
  rowsPerChunk: number | null = null
): arrow.Vector<ArrowPathVertexColorType> {
  const colorType = new arrow.FixedSizeList(4, new arrow.Field('values', new arrow.Uint8(), false));
  const pathColorType = new arrow.List(new arrow.Field('colors', colorType, false));
  const dataChunks: arrow.Data<ArrowPathVertexColorType>[] = [];
  forEachPathChunk(pathCount, rowsPerChunk, (pathStart, chunkPathCount) => {
    const valueOffsets = new Int32Array(chunkPathCount + 1);
    const colors = makePathVertexColors(pathStart, chunkPathCount, pointCount);
    for (let localPathIndex = 0; localPathIndex < chunkPathCount; localPathIndex++) {
      valueOffsets[localPathIndex] = localPathIndex * pointCount;
    }
    valueOffsets[chunkPathCount] = chunkPathCount * pointCount;
    const colorValueData = new arrow.Data(new arrow.Uint8(), 0, colors.length, 0, {
      [arrow.BufferType.DATA]: colors
    });
    const colorData = new arrow.Data(colorType, 0, colors.length / 4, 0, {}, [colorValueData]);
    dataChunks.push(
      new arrow.Data(
        pathColorType,
        0,
        chunkPathCount,
        0,
        {[arrow.BufferType.OFFSET]: valueOffsets},
        [colorData]
      ) as arrow.Data<ArrowPathVertexColorType>
    );
  });
  return new arrow.Vector(dataChunks) as arrow.Vector<ArrowPathVertexColorType>;
}

function makePathRowColorVector(
  pathCount: number,
  rowsPerChunk: number | null = null
): arrow.Vector<arrow.FixedSizeList<arrow.Uint8>> {
  const dataChunks: arrow.Data<arrow.FixedSizeList<arrow.Uint8>>[] = [];
  forEachPathChunk(pathCount, rowsPerChunk, (pathStart, chunkPathCount) => {
    dataChunks.push(
      makeArrowFixedSizeListVector(
        new arrow.Uint8(),
        4,
        makePathRowColors(pathStart, chunkPathCount)
      ).data[0] as arrow.Data<arrow.FixedSizeList<arrow.Uint8>>
    );
  });
  return new arrow.Vector(dataChunks) as arrow.Vector<arrow.FixedSizeList<arrow.Uint8>>;
}

function makePathWidthVector(
  pathCount: number,
  rowsPerChunk: number | null = null
): arrow.Vector<arrow.Float32> {
  const dataChunks: arrow.Data<arrow.Float32>[] = [];
  forEachPathChunk(pathCount, rowsPerChunk, (pathStart, chunkPathCount) => {
    const values = makePathWidths(pathStart, chunkPathCount);
    dataChunks.push(
      arrow.makeData({
        type: new arrow.Float32(),
        length: values.length,
        data: values
      }) as arrow.Data<arrow.Float32>
    );
  });
  return new arrow.Vector(dataChunks);
}

function forEachPathChunk(
  pathCount: number,
  rowsPerChunk: number | null,
  visitor: (pathStart: number, chunkPathCount: number) => void
): void {
  const safeRowsPerChunk =
    rowsPerChunk && rowsPerChunk > 0 && rowsPerChunk < pathCount ? rowsPerChunk : pathCount;
  for (let pathStart = 0; pathStart < pathCount; pathStart += safeRowsPerChunk) {
    visitor(pathStart, Math.min(safeRowsPerChunk, pathCount - pathStart));
  }
}

function writePathCoordinate(
  values: Float32Array | Float64Array,
  targetOffset: number,
  pathIndex: number,
  pathCount: number,
  pointIndex: number,
  pointCount: number,
  coordinateComponentCount: 3 | 4
): void {
  const pathProgress = pointCount <= 1 ? 0 : pointIndex / (pointCount - 1);
  const normalizedPathIndex = pathCount <= 1 ? 0 : pathIndex / (pathCount - 1);
  const baseY = -0.92 + normalizedPathIndex * 1.84;
  const phase = pathIndex * 0.13;
  values[targetOffset] = -1.24 + pathProgress * 2.48;
  values[targetOffset + 1] =
    baseY +
    Math.sin(pathProgress * 11.5 + phase) * 0.028 +
    Math.cos(pathProgress * 4.2 - phase * 0.55) * 0.014;
  if (coordinateComponentCount === 3) {
    values[targetOffset + 2] = getPathMeasure(pathIndex, pointIndex, pointCount);
    return;
  }
  values[targetOffset + 2] = 0;
  values[targetOffset + 3] = getPathMeasure(pathIndex, pointIndex, pointCount);
}

function getPathMeasure(pathIndex: number, pointIndex: number, pointCount: number): number {
  const pathProgress = pointCount <= 1 ? 0 : pointIndex / (pointCount - 1);
  const pathClusterIndex = pathIndex % 5;
  const pathMeasureRate = 0.58 + pathClusterIndex * 0.16;
  const pathMeasurePhase = (Math.floor(pathIndex / 5) % 4) * 0.08;
  return pathProgress * pathMeasureRate + pathMeasurePhase;
}

export function getTemporalCurrentTimeMilliseconds(measureTime: number): number {
  return Math.round(measureTime * TEMPORAL_MILLISECONDS_PER_MEASURE_UNIT);
}

function makePathVertexColors(
  pathStart: number,
  pathCount: number,
  pointCount: number
): Uint8Array {
  const colors = new Uint8Array(pathCount * pointCount * 4);
  for (let localPathIndex = 0; localPathIndex < pathCount; localPathIndex++) {
    const pathIndex = pathStart + localPathIndex;
    const evenColor = getPathPaletteColor(pathIndex);
    const oddColor = getPathPaletteColor(pathIndex + 2);
    const accentColor = getPathPaletteColor(pathIndex + 4);
    const blueTarget: [number, number, number] = [42, 116, 255];
    for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
      const pathProgress = pointCount <= 1 ? 0 : pointIndex / (pointCount - 1);
      const alternatingColor = pointIndex % 2 === 0 ? evenColor : oddColor;
      const pulseColor = pointIndex % 4 === 0 ? accentColor : alternatingColor;
      const blueFade = Math.min(1, Math.max(0, (pathProgress - 0.18) / 0.72));
      const bandBoost = pointIndex % 2 === 0 ? 72 : -28;
      const colorOffset = (localPathIndex * pointCount + pointIndex) * 4;
      colors[colorOffset] = clampColor(
        pulseColor[0] * (1 - blueFade) + blueTarget[0] * blueFade + bandBoost
      );
      colors[colorOffset + 1] = clampColor(
        pulseColor[1] * (1 - blueFade) + blueTarget[1] * blueFade + bandBoost
      );
      colors[colorOffset + 2] = clampColor(
        pulseColor[2] * (1 - blueFade) + blueTarget[2] * blueFade + bandBoost
      );
      colors[colorOffset + 3] = pointIndex % 2 === 0 ? 242 : 202;
    }
  }
  return colors;
}

function makePathRowColors(pathStart: number, pathCount: number): Uint8Array {
  const colors = new Uint8Array(pathCount * 4);
  for (let localPathIndex = 0; localPathIndex < pathCount; localPathIndex++) {
    const pathIndex = pathStart + localPathIndex;
    const paletteColor = getPathPaletteColor(pathIndex);
    const colorOffset = localPathIndex * 4;
    colors[colorOffset] = paletteColor[0];
    colors[colorOffset + 1] = paletteColor[1];
    colors[colorOffset + 2] = paletteColor[2];
    colors[colorOffset + 3] = 220;
  }
  return colors;
}

function makePathWidths(pathStart: number, pathCount: number): Float32Array {
  return Float32Array.from(
    {length: pathCount},
    (_, localPathIndex) => 0.0022 + ((pathStart + localPathIndex) % 7) * 0.00072
  );
}

function getPathPaletteColor(pathIndex: number): [number, number, number] {
  switch (pathIndex % 5) {
    case 0:
      return [72, 205, 217];
    case 1:
      return [255, 186, 73];
    case 2:
      return [255, 111, 97];
    case 3:
      return [120, 177, 255];
    default:
      return [152, 221, 132];
  }
}

function clampColor(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function getNow(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}
