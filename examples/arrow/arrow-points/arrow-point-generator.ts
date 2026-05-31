// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';

export type ArrowPointRowCountKind = '10k-stream' | '100k-stream';
export type ArrowPointSourceKind = 'xy' | 'xym' | 'xyzm' | 'dense-union';
export type ArrowPointTimeKind = 'none' | 'm' | 'timestamp';
export type ArrowPointColorKind = 'constant' | 'row-colors';

export type ArrowPointDataset = {
  rowCount: number;
  rowsPerChunk: number;
  label: string;
};

export type ArrowPointExampleData = {
  recordBatches: arrow.RecordBatch[];
  rowCount: number;
  batchCount: number;
  label: string;
  timeOriginMilliseconds: number;
};

const COLOR_COMPONENTS = 4;
const STREAMING_BATCH_DELAY_MS = 620;
const POINT_AREA_RADIUS = 0.93;
const GEOARROW_POINT_XY_TYPE_ID = 1;
const GEOARROW_POINT_XYM_TYPE_ID = 11;
const GEOARROW_POINT_XYZM_TYPE_ID = 13;

export const POINT_SWEEP_MILLISECONDS = 64_000;
export const POINT_TRAIL_LENGTH_MILLISECONDS = 13_500;
export const CURRENT_TIME_RATE_MILLISECONDS_PER_SECOND = 3_800;
export const SOURCE_TIMESTAMP_ORIGIN_MILLISECONDS = Date.UTC(2026, 4, 22, 12);

export const POINT_DATASETS: Record<ArrowPointRowCountKind, ArrowPointDataset> = {
  '10k-stream': {
    rowCount: 10_000,
    rowsPerChunk: 1000,
    label: '10K point rows, 10 batches'
  },
  '100k-stream': {
    rowCount: 100_000,
    rowsPerChunk: 5000,
    label: '100K point rows, 20 batches'
  }
};

export function makeArrowPointExampleData(
  rowCountKind: ArrowPointRowCountKind,
  sourceKind: ArrowPointSourceKind,
  timeKind: ArrowPointTimeKind,
  colorKind: ArrowPointColorKind
): ArrowPointExampleData {
  const dataset = POINT_DATASETS[rowCountKind];
  const positionDataChunks: arrow.Data[] = [];
  const sizeDataChunks: arrow.Data[] = [];
  const colorDataChunks: arrow.Data[] = [];
  const timeDataChunks: arrow.Data[] = [];

  forEachPointBatch(dataset, (rowIndices, batchIndex) => {
    positionDataChunks.push(makePositionDataChunk(sourceKind, rowIndices, dataset.rowCount));
    sizeDataChunks.push(makePointSizeDataChunk(rowIndices));
    if (colorKind === 'row-colors') {
      colorDataChunks.push(makeRowColorDataChunk(rowIndices, batchIndex));
    }
    if (timeKind === 'timestamp') {
      timeDataChunks.push(makeTimestampDataChunk(rowIndices, dataset.rowCount));
    }
  });

  const positions = new arrow.Vector(positionDataChunks) as arrow.Vector<any>;
  const pointSizes = new arrow.Vector(sizeDataChunks) as arrow.Vector<arrow.Float32>;
  const colors =
    colorDataChunks.length > 0
      ? (new arrow.Vector(colorDataChunks) as arrow.Vector<arrow.FixedSizeList<arrow.Uint8>>)
      : null;
  const eventTimes =
    timeDataChunks.length > 0
      ? (new arrow.Vector(timeDataChunks) as arrow.Vector<arrow.TimestampMillisecond>)
      : null;
  const table = new arrow.Table({
    positions,
    pointSizes,
    ...(colors ? {colors} : {}),
    ...(eventTimes ? {eventTimes} : {})
  });
  const recordBatches = table.batches;

  return {
    recordBatches,
    rowCount: dataset.rowCount,
    batchCount: recordBatches.length,
    label: `${dataset.label} - ${getSourceLabel(sourceKind)}`,
    timeOriginMilliseconds: SOURCE_TIMESTAMP_ORIGIN_MILLISECONDS
  };
}

export async function* createStreamingPointRecordBatchIterator(
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

export function getEffectivePointTimeKind(
  sourceKind: ArrowPointSourceKind,
  timeKind: ArrowPointTimeKind
): ArrowPointTimeKind {
  return sourceKind === 'xy' && timeKind === 'm' ? 'timestamp' : timeKind;
}

export function getPointTimeColumn(timeKind: ArrowPointTimeKind): 'm' | 'eventTimes' | null {
  switch (timeKind) {
    case 'm':
      return 'm';
    case 'timestamp':
      return 'eventTimes';
    case 'none':
      return null;
  }
}

export function formatPointCurrentTimeLabel(currentTimeMilliseconds: number): string {
  const timestampMilliseconds = SOURCE_TIMESTAMP_ORIGIN_MILLISECONDS + currentTimeMilliseconds;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short'
  }).format(timestampMilliseconds);
}

function forEachPointBatch(
  dataset: ArrowPointDataset,
  visitor: (rowIndices: number[], batchIndex: number) => void
): void {
  const batchCount = Math.ceil(dataset.rowCount / dataset.rowsPerChunk);
  for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
    const rowStart = batchIndex * dataset.rowsPerChunk;
    const rowEnd = Math.min(rowStart + dataset.rowsPerChunk, dataset.rowCount);
    const rowIndices: number[] = [];
    for (let rowIndex = rowStart; rowIndex < rowEnd; rowIndex++) {
      rowIndices.push(rowIndex);
    }
    visitor(rowIndices, batchIndex);
  }
}

function makePositionDataChunk(
  sourceKind: ArrowPointSourceKind,
  rowIndices: number[],
  totalRowCount: number
): arrow.Data {
  switch (sourceKind) {
    case 'xy':
      return makeFixedSizeListPointDataChunk(rowIndices, totalRowCount, 2);
    case 'xym':
      return makeFixedSizeListPointDataChunk(rowIndices, totalRowCount, 3);
    case 'xyzm':
      return makeFixedSizeListPointDataChunk(rowIndices, totalRowCount, 4);
    case 'dense-union':
      return makeDenseUnionPointDataChunk(rowIndices, totalRowCount);
  }
}

function makeFixedSizeListPointDataChunk(
  rowIndices: number[],
  totalRowCount: number,
  dimension: 2 | 3 | 4
): arrow.Data<arrow.FixedSizeList<arrow.Float32>> {
  const values = new Float32Array(rowIndices.length * dimension);
  for (let localRowIndex = 0; localRowIndex < rowIndices.length; localRowIndex++) {
    writePoint(
      values,
      localRowIndex * dimension,
      rowIndices[localRowIndex],
      totalRowCount,
      dimension
    );
  }
  return makeArrowFixedSizeListVector(new arrow.Float32(), dimension, values).data[0];
}

function makeDenseUnionPointDataChunk(
  rowIndices: number[],
  totalRowCount: number
): arrow.Data<arrow.DenseUnion> {
  const typeIds = new Int8Array(rowIndices.length);
  const valueOffsets = new Int32Array(rowIndices.length);
  const pointXYRowIndices: number[] = [];
  const pointXYMRowIndices: number[] = [];
  const pointXYZMRowIndices: number[] = [];

  for (let localRowIndex = 0; localRowIndex < rowIndices.length; localRowIndex++) {
    const rowIndex = rowIndices[localRowIndex];
    const childKind = rowIndex % 3;
    if (childKind === 0) {
      typeIds[localRowIndex] = GEOARROW_POINT_XY_TYPE_ID;
      valueOffsets[localRowIndex] = pointXYRowIndices.length;
      pointXYRowIndices.push(rowIndex);
    } else if (childKind === 1) {
      typeIds[localRowIndex] = GEOARROW_POINT_XYM_TYPE_ID;
      valueOffsets[localRowIndex] = pointXYMRowIndices.length;
      pointXYMRowIndices.push(rowIndex);
    } else {
      typeIds[localRowIndex] = GEOARROW_POINT_XYZM_TYPE_ID;
      valueOffsets[localRowIndex] = pointXYZMRowIndices.length;
      pointXYZMRowIndices.push(rowIndex);
    }
  }

  const pointXYData = makeFixedSizeListPointDataChunk(pointXYRowIndices, totalRowCount, 2);
  const pointXYMData = makeFixedSizeListPointDataChunk(pointXYMRowIndices, totalRowCount, 3);
  const pointXYZMData = makeFixedSizeListPointDataChunk(pointXYZMRowIndices, totalRowCount, 4);
  const unionType = new arrow.DenseUnion(
    [GEOARROW_POINT_XY_TYPE_ID, GEOARROW_POINT_XYM_TYPE_ID, GEOARROW_POINT_XYZM_TYPE_ID],
    [
      new arrow.Field('PointXY', pointXYData.type, true),
      new arrow.Field('PointXYM', pointXYMData.type, true),
      new arrow.Field('PointXYZM', pointXYZMData.type, true)
    ]
  );

  return arrow.makeData({
    type: unionType,
    length: rowIndices.length,
    nullCount: 0,
    typeIds,
    valueOffsets,
    children: [pointXYData, pointXYMData, pointXYZMData]
  }) as arrow.Data<arrow.DenseUnion>;
}

function makePointSizeDataChunk(rowIndices: number[]): arrow.Data<arrow.Float32> {
  const values = new Float32Array(rowIndices.length);
  for (let localRowIndex = 0; localRowIndex < rowIndices.length; localRowIndex++) {
    const rowIndex = rowIndices[localRowIndex];
    values[localRowIndex] = 0.0046 + getDeterministicUnit(rowIndex, 6) * 0.0074;
  }
  return makeFloat32Data(values);
}

function makeTimestampDataChunk(
  rowIndices: number[],
  totalRowCount: number
): arrow.Data<arrow.TimestampMillisecond> {
  const values = new BigInt64Array(rowIndices.length);
  for (let localRowIndex = 0; localRowIndex < rowIndices.length; localRowIndex++) {
    const rowIndex = rowIndices[localRowIndex];
    values[localRowIndex] = BigInt(
      SOURCE_TIMESTAMP_ORIGIN_MILLISECONDS + Math.floor(getPointMeasure(rowIndex, totalRowCount))
    );
  }
  return new arrow.Data(new arrow.TimestampMillisecond(), 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  }) as unknown as arrow.Data<arrow.TimestampMillisecond>;
}

function makeRowColorDataChunk(rowIndices: number[], batchIndex: number): arrow.Data {
  const values = new Uint8Array(rowIndices.length * COLOR_COMPONENTS);
  for (let localRowIndex = 0; localRowIndex < rowIndices.length; localRowIndex++) {
    writePaletteColor(values, localRowIndex, rowIndices[localRowIndex], batchIndex);
  }
  return makeArrowFixedSizeListVector(new arrow.Uint8(), 4, values).data[0];
}

function writePoint(
  values: Float32Array,
  targetOffset: number,
  rowIndex: number,
  totalRowCount: number,
  dimension: 2 | 3 | 4
): void {
  const angle = rowIndex * 2.399963229728653 + getDeterministicUnit(rowIndex, 0) * 0.22;
  const normalizedIndex = (rowIndex + 0.5) / Math.max(totalRowCount, 1);
  const radialProgress = Math.sqrt(normalizedIndex);
  const radius =
    POINT_AREA_RADIUS * radialProgress * (0.93 + getDeterministicUnit(rowIndex, 1) * 0.11);
  const orbit = getDeterministicUnit(rowIndex, 2) * 0.035;
  values[targetOffset] = Math.cos(angle) * radius + Math.cos(angle * 2.7) * orbit;
  values[targetOffset + 1] = Math.sin(angle) * radius + Math.sin(angle * 2.3) * orbit;

  if (dimension === 3) {
    values[targetOffset + 2] = getPointMeasure(rowIndex, totalRowCount);
  } else if (dimension === 4) {
    values[targetOffset + 2] = (getDeterministicUnit(rowIndex, 5) - 0.5) * 0.22;
    values[targetOffset + 3] = getPointMeasure(rowIndex, totalRowCount);
  }
}

function writePaletteColor(
  values: Uint8Array,
  localRowIndex: number,
  rowIndex: number,
  batchIndex: number
): void {
  const phase = getDeterministicUnit(rowIndex, 7);
  const red = Math.round(82 + Math.sin(phase * Math.PI * 2 + batchIndex * 0.17) * 48 + phase * 68);
  const green = Math.round(145 + Math.sin(phase * Math.PI * 2 + 2.1) * 58);
  const blue = Math.round(205 + Math.cos(phase * Math.PI * 2 + batchIndex * 0.11) * 42);
  const targetOffset = localRowIndex * COLOR_COMPONENTS;
  values[targetOffset] = clampColorChannel(red);
  values[targetOffset + 1] = clampColorChannel(green);
  values[targetOffset + 2] = clampColorChannel(blue);
  values[targetOffset + 3] = 220;
}

function getPointMeasure(rowIndex: number, totalRowCount: number): number {
  const sweep =
    (rowIndex * 37 + Math.floor(getDeterministicUnit(rowIndex, 4) * 2600)) %
    POINT_SWEEP_MILLISECONDS;
  const radialLead = ((rowIndex / Math.max(totalRowCount, 1)) * 11_000) % POINT_SWEEP_MILLISECONDS;
  return (sweep + radialLead) % POINT_SWEEP_MILLISECONDS;
}

function makeFloat32Data(values: Float32Array): arrow.Data<arrow.Float32> {
  return new arrow.Data(new arrow.Float32(), 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  }) as unknown as arrow.Data<arrow.Float32>;
}

function getSourceLabel(sourceKind: ArrowPointSourceKind): string {
  switch (sourceKind) {
    case 'xy':
      return 'FixedSizeList<Float32, 2>';
    case 'xym':
      return 'FixedSizeList<Float32, 3> (XYM)';
    case 'xyzm':
      return 'FixedSizeList<Float32, 4> (XYZM)';
    case 'dense-union':
      return 'DenseUnion Point XY/XYM/XYZM';
  }
}

function waitForStreamingBatchDelay(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, STREAMING_BATCH_DELAY_MS);
  });
}

function getDeterministicUnit(rowIndex: number, salt: number): number {
  const value = Math.sin(rowIndex * 12.9898 + salt * 78.233) * 43_758.5453;
  return value - Math.floor(value);
}

function clampColorChannel(value: number): number {
  return Math.max(0, Math.min(255, value));
}
