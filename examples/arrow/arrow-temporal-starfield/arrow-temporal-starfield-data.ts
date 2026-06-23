// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';

export const STAR_COUNT = 520;
export const STREAMING_STARFIELD_BATCH_COUNT = 8;
export const STREAMING_STARFIELD_BATCH_INTERVAL_MS = 650;
export const STREAMING_STARFIELD_ROWS_PER_BATCH = STAR_COUNT / STREAMING_STARFIELD_BATCH_COUNT;
export const STARFIELD_CYCLE_MILLISECONDS = 72_000;
export const CURRENT_TIME_RATE_MILLISECONDS_PER_SECOND = 3_200;
export const SOURCE_TIMESTAMP_ORIGIN_MILLISECONDS = Date.UTC(2026, 4, 22, 21);
export const TAU = Math.PI * 2;

export type TemporalStarfieldStyleKind = 'constant' | 'column';

export type TemporalStarfieldSourceVectors = {
  eventStarts: arrow.Vector<arrow.TimestampMillisecond>;
  eventDurations: arrow.Vector<arrow.DurationMillisecond>;
  pulsePeriods: arrow.Vector<arrow.DurationMillisecond>;
};

export type TemporalStarfieldRows = {
  positions: Float32Array;
  eventStarts: BigInt64Array;
  eventDurations: BigInt64Array;
  pulsePeriods: BigInt64Array;
  starSizes: Float32Array;
  eventColors: Uint8Array;
};

const STAR_COLORS: readonly [number, number, number, number][] = [
  [104, 168, 255, 255],
  [255, 96, 86, 255],
  [255, 166, 62, 255],
  [255, 252, 236, 255],
  [72, 134, 255, 255],
  [255, 126, 104, 255],
  [255, 204, 118, 255],
  [232, 242, 255, 255]
];

export function makeTemporalStarfieldRows(
  starStart = 0,
  starCount = STAR_COUNT
): TemporalStarfieldRows {
  const positions = new Float32Array(starCount * 2);
  const eventStarts = new BigInt64Array(starCount);
  const eventDurations = new BigInt64Array(starCount);
  const pulsePeriods = new BigInt64Array(starCount);
  const starSizes = new Float32Array(starCount);
  const eventColors = new Uint8Array(starCount * 4);

  for (let localStarIndex = 0; localStarIndex < starCount; localStarIndex++) {
    const starIndex = starStart + localStarIndex;
    const angle = getDeterministicUnit(starIndex, 0) * TAU;
    const radius = Math.sqrt(getDeterministicUnit(starIndex, 1));
    positions[localStarIndex * 2] =
      Math.cos(angle) * radius * 0.94 + (getDeterministicUnit(starIndex, 2) - 0.5) * 0.08;
    positions[localStarIndex * 2 + 1] =
      Math.sin(angle) * radius * 0.9 + (getDeterministicUnit(starIndex, 3) - 0.5) * 0.08;

    const eventStartOffsetMilliseconds =
      starIndex === 0
        ? 0
        : Math.floor(getDeterministicUnit(starIndex, 4) * (STARFIELD_CYCLE_MILLISECONDS - 18_000));
    eventStarts[localStarIndex] = BigInt(
      SOURCE_TIMESTAMP_ORIGIN_MILLISECONDS + eventStartOffsetMilliseconds
    );
    eventDurations[localStarIndex] = BigInt(
      10_000 + Math.floor(getDeterministicUnit(starIndex, 5) * 18_000)
    );
    pulsePeriods[localStarIndex] = BigInt(
      2_600 + Math.floor(getDeterministicUnit(starIndex, 6) * 5_200)
    );
    starSizes[localStarIndex] = 0.005 + getDeterministicUnit(starIndex, 7) * 0.012;

    const eventColor =
      STAR_COLORS[Math.floor(getDeterministicUnit(starIndex, 8) * STAR_COLORS.length)];
    eventColors.set(eventColor, localStarIndex * 4);
  }

  return {
    positions,
    eventStarts,
    eventDurations,
    pulsePeriods,
    starSizes,
    eventColors
  };
}

export function makeTemporalStarfieldTable(
  starRows: TemporalStarfieldRows = makeTemporalStarfieldRows(),
  timeColumn: 'timestamp' | 'xyzm' = 'timestamp',
  starSizeKind: TemporalStarfieldStyleKind = 'column',
  eventColorKind: TemporalStarfieldStyleKind = 'column'
): arrow.Table {
  const columns: Record<string, arrow.Vector> = {
    positions:
      timeColumn === 'xyzm'
        ? makeArrowFixedSizeListVector(
            new arrow.Float32(),
            4,
            makeTemporalStarfieldXYZMPositions(starRows)
          )
        : makeArrowFixedSizeListVector(new arrow.Float32(), 2, starRows.positions),
    eventDurations: makeTemporalVector(new arrow.DurationMillisecond(), starRows.eventDurations),
    pulsePeriods: makeTemporalVector(new arrow.DurationMillisecond(), starRows.pulsePeriods)
  };
  if (timeColumn === 'timestamp') {
    columns.eventStarts = makeTemporalVector(
      new arrow.TimestampMillisecond(),
      starRows.eventStarts
    );
  }
  if (starSizeKind === 'column') {
    columns.starSizes = makeFloat32Vector(starRows.starSizes);
  }
  if (eventColorKind === 'column') {
    columns.eventColors = makeArrowFixedSizeListVector(new arrow.Uint8(), 4, starRows.eventColors);
  }
  return new arrow.Table(columns);
}

export function makeTemporalStarfieldRecordBatches(
  starCount = STAR_COUNT,
  rowsPerBatch = starCount,
  timeColumn: 'timestamp' | 'xyzm' = 'timestamp',
  starSizeKind: TemporalStarfieldStyleKind = 'column',
  eventColorKind: TemporalStarfieldStyleKind = 'column'
): arrow.RecordBatch[] {
  const recordBatches: arrow.RecordBatch[] = [];
  for (let starStart = 0; starStart < starCount; starStart += rowsPerBatch) {
    const batchStarCount = Math.min(rowsPerBatch, starCount - starStart);
    const recordBatch = makeTemporalStarfieldTable(
      makeTemporalStarfieldRows(starStart, batchStarCount),
      timeColumn,
      starSizeKind,
      eventColorKind
    ).batches[0];
    if (recordBatch) {
      recordBatches.push(recordBatch);
    }
  }
  return recordBatches;
}

export async function* createStreamingTemporalStarfieldRecordBatchIterator(
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

export function makeTemporalStarfieldSourceVectors(
  starRows: TemporalStarfieldRows
): TemporalStarfieldSourceVectors {
  return {
    eventStarts: makeTemporalVector(new arrow.TimestampMillisecond(), starRows.eventStarts),
    eventDurations: makeTemporalVector(new arrow.DurationMillisecond(), starRows.eventDurations),
    pulsePeriods: makeTemporalVector(new arrow.DurationMillisecond(), starRows.pulsePeriods)
  };
}

export function makeFloat32Vector(values: Float32Array): arrow.Vector<arrow.Float32> {
  const data = new arrow.Data(new arrow.Float32(), 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  }) as unknown as arrow.Data<arrow.Float32>;
  return new arrow.Vector([data]);
}

function makeTemporalStarfieldXYZMPositions(starRows: TemporalStarfieldRows): Float32Array {
  const starCount = starRows.positions.length / 2;
  const positions = new Float32Array(starCount * 4);
  for (let starIndex = 0; starIndex < starCount; starIndex++) {
    positions[starIndex * 4] = starRows.positions[starIndex * 2];
    positions[starIndex * 4 + 1] = starRows.positions[starIndex * 2 + 1];
    positions[starIndex * 4 + 2] = 0;
    const eventStart = starRows.eventStarts[starIndex];
    if (eventStart === undefined) {
      throw new Error(`Temporal starfield row ${starIndex} is missing eventStarts`);
    }
    positions[starIndex * 4 + 3] = Number(eventStart) - SOURCE_TIMESTAMP_ORIGIN_MILLISECONDS;
  }
  return positions;
}

function makeTemporalVector<T extends arrow.Timestamp | arrow.Duration>(
  type: T,
  values: BigInt64Array
): arrow.Vector<T> {
  const data = new arrow.Data(type, 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  }) as unknown as arrow.Data<T>;
  return new arrow.Vector([data]);
}

function waitForStreamingBatchDelay(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, STREAMING_STARFIELD_BATCH_INTERVAL_MS);
  });
}

function getDeterministicUnit(starIndex: number, salt: number): number {
  const value = Math.sin(starIndex * 12.9898 + salt * 78.233) * 43_758.5453;
  return value - Math.floor(value);
}
