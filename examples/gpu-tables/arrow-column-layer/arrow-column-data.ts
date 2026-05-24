// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {packDggsH3CellKey} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';
import {latLngToCell} from 'h3-js';

export const DECK_HEATMAP_DATA_URL =
  'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/3d-heatmap/heatmap-data.csv';

export const H3_RESOLUTION = 5;
export const TIME_BUCKET_COUNT = 24;
export const TIME_BUCKET_DURATION_MILLISECONDS = 60 * 60 * 1000;
export const COLUMN_CYCLE_DURATION_MILLISECONDS =
  TIME_BUCKET_COUNT * TIME_BUCKET_DURATION_MILLISECONDS;
export const CURRENT_TIME_RATE_MILLISECONDS_PER_SECOND = 3 * TIME_BUCKET_DURATION_MILLISECONDS;
export const SOURCE_TIME_ORIGIN_MILLISECONDS = Date.UTC(2026, 0, 1);

const MINIMUM_COLUMN_DURATION_BUCKETS = 1.15;
const MAXIMUM_COLUMN_DURATION_BUCKETS = 4.0;

export type ArrowColumnSourceData = {
  table: arrow.Table;
  geometryTable: arrow.Table;
  sourceRowCount: number;
  aggregateRowCount: number;
  uniqueH3CellCount: number;
  h3Resolution: number;
  timeBucketCount: number;
  timeBucketDurationMilliseconds: number;
  cycleDurationMilliseconds: number;
  maxCount: number;
  arrowBuildTimeMilliseconds: number;
};

type AggregatedColumn = {
  h3Cell: string;
  h3CellKey: bigint;
  cellGeometryIndex: number;
  timeBucket: number;
  count: number;
};

type GeometryCell = {
  h3Cell: string;
  h3CellKey: bigint;
};

export async function loadArrowColumnSourceData(): Promise<ArrowColumnSourceData> {
  const startTime = performance.now();
  const response = await fetch(DECK_HEATMAP_DATA_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to load deck.gl heatmap data: ${response.status} ${response.statusText}`
    );
  }
  const csvText = await response.text();
  const {sourceRowCount, columns, geometryCells} = aggregateDeckHeatmapCsv(csvText);
  const table = makeArrowColumnTable(columns);
  const geometryTable = makeArrowColumnGeometryTable(geometryCells);

  return {
    table,
    geometryTable,
    sourceRowCount,
    aggregateRowCount: columns.length,
    uniqueH3CellCount: geometryCells.length,
    h3Resolution: H3_RESOLUTION,
    timeBucketCount: TIME_BUCKET_COUNT,
    timeBucketDurationMilliseconds: TIME_BUCKET_DURATION_MILLISECONDS,
    cycleDurationMilliseconds: COLUMN_CYCLE_DURATION_MILLISECONDS,
    maxCount: columns.reduce((maxCount, column) => Math.max(maxCount, column.count), 0),
    arrowBuildTimeMilliseconds: performance.now() - startTime
  };
}

function aggregateDeckHeatmapCsv(csvText: string): {
  sourceRowCount: number;
  columns: AggregatedColumn[];
  geometryCells: GeometryCell[];
} {
  const aggregateColumns = new Map<string, AggregatedColumn>();
  const geometryCells: GeometryCell[] = [];
  const geometryIndexByH3Cell = new Map<string, number>();
  const lines = csvText.split(/\r?\n/);
  let sourceRowCount = 0;

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]?.trim();
    if (!line) {
      continue;
    }
    const separatorIndex = line.indexOf(',');
    if (separatorIndex < 0) {
      continue;
    }

    const longitude = Number(line.slice(0, separatorIndex));
    const latitude = Number(line.slice(separatorIndex + 1));
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      continue;
    }

    const h3Cell = latLngToCell(latitude, longitude, H3_RESOLUTION);
    const h3CellKey = packDggsH3CellKey(h3Cell);
    const cellGeometryIndex = getCellGeometryIndex(
      h3Cell,
      h3CellKey,
      geometryCells,
      geometryIndexByH3Cell
    );
    const timeBucket = getSyntheticTimeBucket(longitude, latitude, lineIndex);
    const aggregateKey = `${h3Cell}:${timeBucket}`;
    const aggregateColumn = aggregateColumns.get(aggregateKey);
    if (aggregateColumn) {
      aggregateColumn.count++;
    } else {
      aggregateColumns.set(aggregateKey, {
        h3Cell,
        h3CellKey,
        cellGeometryIndex,
        timeBucket,
        count: 1
      });
    }
    sourceRowCount++;
  }

  const columns = Array.from(aggregateColumns.values()).sort(
    (leftColumn, rightColumn) =>
      leftColumn.timeBucket - rightColumn.timeBucket ||
      leftColumn.h3Cell.localeCompare(rightColumn.h3Cell)
  );
  return {sourceRowCount, columns, geometryCells};
}

function getCellGeometryIndex(
  h3Cell: string,
  h3CellKey: bigint,
  geometryCells: GeometryCell[],
  geometryIndexByH3Cell: Map<string, number>
): number {
  const existingIndex = geometryIndexByH3Cell.get(h3Cell);
  if (existingIndex !== undefined) {
    return existingIndex;
  }

  const cellGeometryIndex = geometryCells.length;
  geometryIndexByH3Cell.set(h3Cell, cellGeometryIndex);
  geometryCells.push({h3Cell, h3CellKey});
  return cellGeometryIndex;
}

function getSyntheticTimeBucket(longitude: number, latitude: number, rowIndex: number): number {
  const longitudeHash = Math.trunc((longitude + 180) * 10000);
  const latitudeHash = Math.trunc((latitude + 90) * 10000);
  const hash = (longitudeHash * 73856093) ^ (latitudeHash * 19349663) ^ (rowIndex * 83492791);
  return Math.abs(hash) % TIME_BUCKET_COUNT;
}

function makeArrowColumnTable(columns: AggregatedColumn[]): arrow.Table {
  const h3CellKeys = new BigUint64Array(columns.length);
  const cellGeometryIndices = new Uint32Array(columns.length);
  const timeStarts = new BigInt64Array(columns.length);
  const timeDurations = new BigInt64Array(columns.length);
  const counts = new Float32Array(columns.length);
  const timeBuckets = new Uint8Array(columns.length);
  const maxCount = columns.reduce((count, column) => Math.max(count, column.count), 0);

  for (const [columnIndex, column] of columns.entries()) {
    h3CellKeys[columnIndex] = BigInt.asUintN(64, column.h3CellKey);
    cellGeometryIndices[columnIndex] = column.cellGeometryIndex;
    timeStarts[columnIndex] = BigInt(
      SOURCE_TIME_ORIGIN_MILLISECONDS + column.timeBucket * TIME_BUCKET_DURATION_MILLISECONDS
    );
    timeDurations[columnIndex] = BigInt(getColumnDurationMilliseconds(column.count, maxCount));
    counts[columnIndex] = column.count;
    timeBuckets[columnIndex] = column.timeBucket;
  }

  return new arrow.Table({
    h3Cells: makeUint64Vector(h3CellKeys),
    cellGeometryIndices: makeUint32Vector(cellGeometryIndices),
    timeStarts: makeTimestampMillisecondVector(timeStarts),
    timeDurations: makeDurationMillisecondVector(timeDurations),
    counts: makeFloat32Vector(counts),
    timeBuckets: makeUint8Vector(timeBuckets)
  });
}

function getColumnDurationMilliseconds(count: number, maxCount: number): number {
  const normalizedCount = Math.sqrt(count / Math.max(maxCount, 1));
  const bucketCount =
    MINIMUM_COLUMN_DURATION_BUCKETS +
    normalizedCount * (MAXIMUM_COLUMN_DURATION_BUCKETS - MINIMUM_COLUMN_DURATION_BUCKETS);
  return Math.round(TIME_BUCKET_DURATION_MILLISECONDS * bucketCount);
}

function makeArrowColumnGeometryTable(geometryCells: GeometryCell[]): arrow.Table {
  const h3CellKeys = new BigUint64Array(geometryCells.length);
  for (const [cellIndex, geometryCell] of geometryCells.entries()) {
    h3CellKeys[cellIndex] = BigInt.asUintN(64, geometryCell.h3CellKey);
  }
  return new arrow.Table({
    h3Cells: makeUint64Vector(h3CellKeys)
  });
}

function makeUint64Vector(values: BigUint64Array): arrow.Vector<arrow.Uint64> {
  const type = new arrow.Uint64();
  const data = new arrow.Data(type, 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  });
  return new arrow.Vector([data]) as arrow.Vector<arrow.Uint64>;
}

function makeUint32Vector(values: Uint32Array): arrow.Vector<arrow.Uint32> {
  const type = new arrow.Uint32();
  const data = new arrow.Data(type, 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  });
  return new arrow.Vector([data]);
}

function makeTimestampMillisecondVector(
  values: BigInt64Array
): arrow.Vector<arrow.TimestampMillisecond> {
  const type = new arrow.TimestampMillisecond();
  const data = new arrow.Data(type, 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  }) as unknown as arrow.Data<arrow.TimestampMillisecond>;
  return new arrow.Vector([data]);
}

function makeDurationMillisecondVector(
  values: BigInt64Array
): arrow.Vector<arrow.DurationMillisecond> {
  const type = new arrow.DurationMillisecond();
  const data = new arrow.Data(type, 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  }) as unknown as arrow.Data<arrow.DurationMillisecond>;
  return new arrow.Vector([data]);
}

function makeFloat32Vector(values: Float32Array): arrow.Vector<arrow.Float32> {
  const type = new arrow.Float32();
  const data = new arrow.Data(type, 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  });
  return new arrow.Vector([data]);
}

function makeUint8Vector(values: Uint8Array): arrow.Vector<arrow.Uint8> {
  const type = new arrow.Uint8();
  const data = new arrow.Data(type, 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  });
  return new arrow.Vector([data]);
}
