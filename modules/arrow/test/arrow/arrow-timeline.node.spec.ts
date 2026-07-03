// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  ArrowTimeline,
  getArrowTimelineDataTypeMismatch,
  getArrowTimelineUnitsPerSecond
} from '@luma.gl/arrow';
import {Timeline} from '@luma.gl/engine';
import * as arrow from 'apache-arrow';

test('ArrowTimeline derives scales from Arrow temporal DataTypes', t => {
  const cases: Array<[arrow.Date_ | arrow.Time | arrow.Timestamp | arrow.Duration, number]> = [
    [new arrow.DateDay(), 1 / 86_400],
    [new arrow.DateMillisecond(), 1_000],
    [new arrow.TimeSecond(), 1],
    [new arrow.TimeMillisecond(), 1_000],
    [new arrow.TimeMicrosecond(), 1_000_000],
    [new arrow.TimeNanosecond(), 1_000_000_000],
    [new arrow.TimestampSecond(), 1],
    [new arrow.TimestampMillisecond(), 1_000],
    [new arrow.TimestampMicrosecond(), 1_000_000],
    [new arrow.TimestampNanosecond(), 1_000_000_000],
    [new arrow.DurationSecond(), 1],
    [new arrow.DurationMillisecond(), 1_000],
    [new arrow.DurationMicrosecond(), 1_000_000],
    [new arrow.DurationNanosecond(), 1_000_000_000]
  ];
  for (const [dataType, unitsPerSecond] of cases) {
    t.equal(
      getArrowTimelineUnitsPerSecond(dataType),
      unitsPerSecond,
      `${dataType} derives ${unitsPerSecond} units per second`
    );
  }
  t.end();
});

test('ArrowTimeline validates DataType-specific construction options', t => {
  t.throws(
    () =>
      new ArrowTimeline({
        dataType: new arrow.Float32() as unknown as arrow.Timestamp
      }),
    /Date, Time, Timestamp, or Duration/,
    'numeric Arrow DataTypes are rejected'
  );
  t.throws(
    () => new ArrowTimeline({dataType: new arrow.DurationSecond(), loop: true}),
    /loop requires a range/,
    'looping requires an absolute interval'
  );
  t.throws(
    () =>
      new ArrowTimeline({
        dataType: new arrow.DurationSecond(),
        range: [2n, 2n]
      }),
    /range end must be greater/,
    'range must be increasing'
  );
  t.throws(
    () =>
      new ArrowTimeline({
        dataType: new arrow.TimestampNanosecond(),
        initialTime: Number.MAX_SAFE_INTEGER + 1
      }),
    /bigint or safe integer/,
    'unsafe 64-bit numbers are rejected'
  );
  t.end();
});

test('ArrowTimeline plays, pauses, seeks, scales, wraps, and cleans up', t => {
  const deckTimeline = new Timeline();
  const timeline = new ArrowTimeline({
    dataType: new arrow.DurationSecond(),
    initialTime: 2n,
    range: [0n, 10n],
    playbackRate: 2
  });
  const updates: string[] = [];
  const detach = timeline.attach(deckTimeline, update => updates.push(update.type));

  timeline.play();
  deckTimeline.setTime(2_000);
  t.equal(timeline.getTime(deckTimeline), 6n, 'play advances in Arrow duration units');

  timeline.pause();
  deckTimeline.setTime(4_000);
  t.equal(timeline.getTime(deckTimeline), 6n, 'pause freezes time');

  timeline.setTime(9n);
  timeline.setPlaybackRate(2);
  timeline.play();
  deckTimeline.setTime(5_000);
  t.equal(timeline.getTime(deckTimeline), 1n, 'seek, rate, and explicit range wrap are applied');
  t.ok(updates.includes('time'), 'timeline advancement invalidates subscribers');
  t.ok(updates.includes('mapping'), 'control changes invalidate subscribers');

  detach();
  detach();
  t.equal(deckTimeline.animations.size, 0, 'cleanup detaches from the Deck timeline once');
  t.end();
});

test('ArrowTimeline preserves absolute bigint precision until origin subtraction', t => {
  const origin = 9_007_199_254_740_993_000n;
  const deckTimeline = new Timeline();
  const timeline = new ArrowTimeline({
    dataType: new arrow.TimestampNanosecond(),
    initialTime: origin + 900_000n,
    range: [origin, origin + 1_000_000n]
  });
  timeline.attach(deckTimeline, () => {});

  timeline.setTime(origin + 125n);
  t.equal(timeline.getTime(), origin + 125n, 'absolute timestamp remains a bigint');
  t.equal(timeline.getRelativeTime(origin), 125, 'origin is subtracted before number conversion');

  timeline.setTime(origin + 900_000n);
  timeline.play();
  deckTimeline.setTime(0.2);
  t.equal(
    timeline.getTime(deckTimeline),
    origin + 100_000n,
    'bigint advancement wraps within the absolute half-open range'
  );
  t.equal(
    timeline.getRelativeTime(origin, deckTimeline),
    100_000,
    'wrapped timestamp converts to a relative GPU value'
  );
  t.end();
});

test('ArrowTimeline reports Arrow DataType compatibility differences', t => {
  t.equal(
    getArrowTimelineDataTypeMismatch(
      new arrow.TimestampMillisecond(),
      new arrow.TimestampMillisecond()
    ),
    null,
    'matching temporal types are compatible'
  );
  t.ok(
    getArrowTimelineDataTypeMismatch(
      new arrow.TimestampMillisecond(),
      new arrow.TimestampMicrosecond()
    )?.includes('unit'),
    'temporal unit mismatch is described'
  );
  t.ok(
    getArrowTimelineDataTypeMismatch(
      new arrow.TimestampMillisecond('UTC'),
      new arrow.TimestampMillisecond('America/New_York')
    )?.includes('timezone'),
    'timestamp timezone mismatch is described'
  );
  t.ok(
    getArrowTimelineDataTypeMismatch(new arrow.TimestampMillisecond(), new arrow.Float32()),
    'temporal and numeric domains are incompatible'
  );
  t.end();
});

test('ArrowTimeline supports absolute manual time without an attached timeline', t => {
  const timeline = new ArrowTimeline({
    dataType: new arrow.TimestampMicrosecond(),
    initialTime: 1_700_000_000_000_000n
  });
  timeline.setTime(1_700_000_000_000_125n);
  t.equal(timeline.getTime(), 1_700_000_000_000_125n, 'manual absolute time is retained');
  t.equal(
    timeline.getRelativeTime(1_700_000_000_000_000n),
    125,
    'manual absolute time converts relative to a column origin'
  );
  t.end();
});
