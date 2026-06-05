// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';

export const DAY_COUNT = 3;
export const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
export const HOUR_MILLISECONDS = 60 * 60 * 1000;
export const MINUTE_MILLISECONDS = 60 * 1000;
export const SCHEDULE_START_TIME_MILLISECONDS = 8 * HOUR_MILLISECONDS;
export const SCHEDULE_SPAN_MILLISECONDS = 8 * HOUR_MILLISECONDS;
export const SCHEDULE_SWEEP_MILLISECONDS = DAY_COUNT * SCHEDULE_SPAN_MILLISECONDS;
export const CURRENT_TIME_RATE_MILLISECONDS_PER_SECOND = 3 * HOUR_MILLISECONDS;
const SOURCE_DATE_ORIGIN_MILLISECONDS = Date.UTC(2026, 4, 22);
const SOURCE_DATE_ORIGIN_DAYS = SOURCE_DATE_ORIGIN_MILLISECONDS / DAY_MILLISECONDS;
const SOURCE_TIMESTAMP_ORIGIN_MILLISECONDS = Date.UTC(2026, 4, 22, 8);
export const EVENT_COUNT = 12;

export type TimeColumnsTemporalColumnName =
  | 'eventDates'
  | 'eventTimes'
  | 'eventStarts'
  | 'eventDurations';

export type TimeColumnsTemporalSourceVectors = {
  eventDates: arrow.Vector<arrow.DateDay>;
  eventTimes: arrow.Vector<arrow.TimeMillisecond>;
  eventStarts: arrow.Vector<arrow.TimestampMillisecond>;
  eventDurations: arrow.Vector<arrow.DurationMillisecond>;
};

type TimeColumnsEventSpec = {
  dayIndex: number;
  startMinute: number;
  durationMinute: number;
  color: [number, number, number, number];
};

const EVENT_SPECS: TimeColumnsEventSpec[] = [
  {dayIndex: 0, startMinute: 0, durationMinute: 72, color: [52, 211, 153, 255]},
  {dayIndex: 0, startMinute: 105, durationMinute: 58, color: [56, 189, 248, 255]},
  {dayIndex: 0, startMinute: 210, durationMinute: 92, color: [251, 191, 36, 255]},
  {dayIndex: 0, startMinute: 340, durationMinute: 64, color: [244, 114, 182, 255]},
  {dayIndex: 1, startMinute: 20, durationMinute: 80, color: [129, 140, 248, 255]},
  {dayIndex: 1, startMinute: 140, durationMinute: 46, color: [45, 212, 191, 255]},
  {dayIndex: 1, startMinute: 230, durationMinute: 110, color: [251, 146, 60, 255]},
  {dayIndex: 1, startMinute: 375, durationMinute: 44, color: [248, 113, 113, 255]},
  {dayIndex: 2, startMinute: 35, durationMinute: 55, color: [96, 165, 250, 255]},
  {dayIndex: 2, startMinute: 125, durationMinute: 88, color: [167, 139, 250, 255]},
  {dayIndex: 2, startMinute: 255, durationMinute: 72, color: [74, 222, 128, 255]},
  {dayIndex: 2, startMinute: 365, durationMinute: 82, color: [250, 204, 21, 255]}
];

export function makeTimeColumnsTemporalSourceVectors(): TimeColumnsTemporalSourceVectors {
  const eventDates = new Int32Array(EVENT_COUNT);
  const eventTimes = new Int32Array(EVENT_COUNT);
  const eventStarts = new BigInt64Array(EVENT_COUNT);
  const eventDurations = new BigInt64Array(EVENT_COUNT);

  for (const [eventIndex, eventSpec] of EVENT_SPECS.entries()) {
    const eventStartOffsetMilliseconds = eventSpec.startMinute * MINUTE_MILLISECONDS;
    const eventDurationMilliseconds = eventSpec.durationMinute * MINUTE_MILLISECONDS;
    eventDates[eventIndex] = SOURCE_DATE_ORIGIN_DAYS + eventSpec.dayIndex;
    eventTimes[eventIndex] = SCHEDULE_START_TIME_MILLISECONDS + eventStartOffsetMilliseconds;
    eventStarts[eventIndex] = BigInt(
      SOURCE_TIMESTAMP_ORIGIN_MILLISECONDS +
        eventSpec.dayIndex * DAY_MILLISECONDS +
        eventStartOffsetMilliseconds
    );
    eventDurations[eventIndex] = BigInt(eventDurationMilliseconds);
  }

  return {
    eventDates: makeTemporalVector(new arrow.DateDay(), eventDates),
    eventTimes: makeTemporalVector(new arrow.TimeMillisecond(), eventTimes),
    eventStarts: makeTemporalVector(new arrow.TimestampMillisecond(), eventStarts),
    eventDurations: makeTemporalVector(new arrow.DurationMillisecond(), eventDurations)
  };
}

export function makeTimeColumnsEventColorValues(): Uint8Array {
  const eventColors = new Uint8Array(EVENT_COUNT * 4);
  for (const [eventIndex, eventSpec] of EVENT_SPECS.entries()) {
    eventColors.set(eventSpec.color, eventIndex * 4);
  }
  return eventColors;
}

export function makeTimeColumnsSourceTable(): arrow.Table {
  const temporalSourceVectors = makeTimeColumnsTemporalSourceVectors();
  return new arrow.Table({
    ...temporalSourceVectors,
    eventColors: makeArrowFixedSizeListVector(
      new arrow.Uint8(),
      4,
      makeTimeColumnsEventColorValues()
    )
  });
}

function makeTemporalVector<T extends arrow.Date_ | arrow.Time | arrow.Timestamp | arrow.Duration>(
  type: T,
  values: Int32Array | BigInt64Array
): arrow.Vector<T> {
  const data = new arrow.Data(type, 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  }) as unknown as arrow.Data<T>;
  return new arrow.Vector([data]);
}
