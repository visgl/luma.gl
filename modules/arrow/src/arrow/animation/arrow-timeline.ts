// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Timeline} from '@luma.gl/engine';
import {DataType, type Date_, type Duration, type Time, type Timestamp} from 'apache-arrow';
import {
  getArrowTemporalVectorInfo,
  type ArrowTemporalUnit
} from '../vectors/arrow-temporal-gpu-vector';

/** Arrow temporal scalar types supported as timeline value domains. */
export type ArrowTimelineDataType = Date_ | Time | Timestamp | Duration;

/** Exact Arrow-domain values accepted by timeline controls. */
export type ArrowTimelineTime = number | bigint;

/** Construction options for an Arrow timeline. */
export type ArrowTimelineProps<DataTypeT extends ArrowTimelineDataType = ArrowTimelineDataType> = {
  /** Arrow temporal scalar type used by the values compared with this timeline. */
  dataType: DataTypeT;
  /** Initial absolute Arrow-domain value. Defaults to zero in the type's value representation. */
  initialTime?: ArrowTimelineTime;
  /** Optional absolute half-open interval used for wrapping. */
  range?: readonly [ArrowTimelineTime, ArrowTimelineTime];
  /** Whether to wrap within `range`. Defaults to true when a range is supplied. */
  loop?: boolean;
  /** Initial playback multiplier. */
  playbackRate?: number;
};

/** Timeline notifications distinguish frame invalidation from mapping changes. */
export type ArrowTimelineUpdate = {
  type: 'time' | 'mapping';
};

type TimelineAttachment = {
  animationHandle: number;
  timelineTimeSeconds: number;
  anchorTimelineTimeSeconds: number;
  anchorCurrentTime: ArrowTimelineTime;
  subscribers: Set<(update: ArrowTimelineUpdate) => void>;
};

type ArrowTimelineDataTypeInfo = {
  unitsPerSecond: number;
  usesBigInt: boolean;
};

const UNIT_SCALES: Record<ArrowTemporalUnit, number> = {
  day: 1 / 86_400,
  second: 1,
  millisecond: 1_000,
  microsecond: 1_000_000,
  nanosecond: 1_000_000_000
};

/**
 * Returns the number of values advanced per second for an Arrow temporal type.
 *
 * @param dataType - Scalar Arrow `Date`, `Time`, `Timestamp`, or `Duration` type.
 * @returns Arrow-domain units advanced by one second at playback rate `1`.
 * @throws If `dataType` is not a supported scalar temporal type.
 */
export function getArrowTimelineUnitsPerSecond(dataType: ArrowTimelineDataType): number {
  return getArrowTimelineDataTypeInfo(dataType).unitsPerSecond;
}

/**
 * Returns a description when two Arrow value domains are incompatible, otherwise `null`.
 * List temporal columns are compared using their scalar leaf type.
 *
 * @param timelineDataType - Scalar temporal type configured on the timeline.
 * @param columnDataType - Scalar or list-wrapped Arrow type used by the consuming column.
 * @returns A mismatch description, or `null` when the temporal domains are compatible.
 */
export function getArrowTimelineDataTypeMismatch(
  timelineDataType: ArrowTimelineDataType,
  columnDataType: DataType
): string | null {
  const timelineTemporalInfo = getArrowTemporalVectorInfo({type: timelineDataType});
  const columnTemporalInfo = getArrowTemporalVectorInfo({type: columnDataType});
  if (timelineTemporalInfo || columnTemporalInfo) {
    if (!timelineTemporalInfo || !columnTemporalInfo) {
      return `${timelineDataType} is not compatible with ${columnDataType}`;
    }
    const mismatchFields: string[] = [];
    if (timelineTemporalInfo.kind !== columnTemporalInfo.kind) mismatchFields.push('kind');
    if (timelineTemporalInfo.unit !== columnTemporalInfo.unit) mismatchFields.push('unit');
    if (timelineTemporalInfo.bitWidth !== columnTemporalInfo.bitWidth) {
      mismatchFields.push('bit width');
    }
    if (
      timelineTemporalInfo.kind === 'timestamp' &&
      (timelineTemporalInfo.timezone ?? null) !== (columnTemporalInfo.timezone ?? null)
    ) {
      mismatchFields.push('timezone');
    }
    return mismatchFields.length > 0
      ? `${timelineDataType} and ${columnDataType} differ in ${mismatchFields.join(', ')}`
      : null;
  }

  return `${timelineDataType} is not compatible with ${columnDataType}`;
}

/**
 * Device-independent playback state and mapping for Arrow temporal layers.
 *
 * Absolute Arrow values stay as numbers or bigints until a consuming layer subtracts its
 * prepared column origin. The timeline owns no data sources, layers, Deck instances, or GPU
 * resources.
 *
 * @example Timestamp playback with an absolute looping range
 * ```ts
 * const timeline = new ArrowTimeline({
 *   dataType: new arrow.TimestampMillisecond(),
 *   initialTime: 1_700_000_000_000n,
 *   range: [1_700_000_000_000n, 1_700_000_010_000n]
 * });
 * ```
 */
export class ArrowTimeline<DataTypeT extends ArrowTimelineDataType = ArrowTimelineDataType> {
  readonly dataType: DataTypeT;
  readonly unitsPerSecond: number;
  readonly range?: readonly [ArrowTimelineTime, ArrowTimelineTime];
  readonly loop: boolean;

  private readonly usesBigInt: boolean;
  private playbackRate: number;
  private playing = false;
  private currentTime: ArrowTimelineTime;
  private readonly attachments = new Map<Timeline, TimelineAttachment>();

  /**
   * Creates temporal playback state without allocating GPU or layer resources.
   *
   * @param props - Temporal domain, initial value, optional looping range, and playback rate.
   * @throws If the data type is not temporal, the range is invalid, or a 64-bit value is unsafe.
   */
  constructor(props: ArrowTimelineProps<DataTypeT>) {
    const dataTypeInfo = getArrowTimelineDataTypeInfo(props.dataType);
    this.dataType = props.dataType;
    this.unitsPerSecond = dataTypeInfo.unitsPerSecond;
    this.usesBigInt = dataTypeInfo.usesBigInt;
    this.currentTime = this.normalizeTime(
      props.initialTime ?? (this.usesBigInt ? 0n : 0),
      'initialTime'
    );
    this.range = props.range
      ? [
          this.normalizeTime(props.range[0], 'range start'),
          this.normalizeTime(props.range[1], 'range end')
        ]
      : undefined;
    if (this.range && compareTimelineTimes(this.range[1], this.range[0]) <= 0) {
      throw new Error('ArrowTimeline range end must be greater than range start');
    }
    this.loop = props.loop ?? this.range !== undefined;
    if (this.loop && !this.range) {
      throw new Error('ArrowTimeline loop requires a range');
    }
    this.playbackRate = validatePlaybackRate(props.playbackRate ?? 1);
  }

  /** Starts advancing against attached Deck timelines. */
  play(): void {
    if (!this.playing) {
      this.playing = true;
      this.notify({type: 'mapping'});
    }
  }

  /** Freezes the current absolute Arrow-domain value. */
  pause(): void {
    if (this.playing) {
      this.captureAttachmentTimes();
      this.playing = false;
      this.notify({type: 'mapping'});
    }
  }

  /** Seeks to an absolute Arrow-domain value. */
  setTime(time: ArrowTimelineTime): void {
    const normalizedTime = this.normalizeTime(time, 'time');
    this.currentTime = normalizedTime;
    for (const attachment of this.attachments.values()) {
      attachment.anchorCurrentTime = normalizedTime;
      attachment.anchorTimelineTimeSeconds = attachment.timelineTimeSeconds;
    }
    this.notify({type: 'mapping'});
  }

  /** Changes the playback multiplier without discontinuity. */
  setPlaybackRate(playbackRate: number): void {
    const validatedRate = validatePlaybackRate(playbackRate);
    if (validatedRate !== this.playbackRate) {
      this.captureAttachmentTimes();
      this.playbackRate = validatedRate;
      this.notify({type: 'mapping'});
    }
  }

  /**
   * Returns the current absolute Arrow-domain value.
   *
   * @param timeline - Attached luma.gl timeline to sample. The first attachment is used by default.
   */
  getTime(timeline?: Timeline): ArrowTimelineTime {
    const attachment = timeline
      ? this.attachments.get(timeline)
      : this.attachments.values().next().value;
    const time = attachment ? this.getAttachmentTime(attachment) : this.currentTime;
    return this.wrapTime(time);
  }

  /**
   * Returns a GPU-ready value relative to a prepared Arrow column origin.
   *
   * Bigint subtraction happens before number conversion so epoch-scale values retain their exact
   * offset. The caller remains responsible for ensuring the relative value has sufficient `f32`
   * precision for rendering.
   *
   * @param origin - Absolute origin persisted for the consuming temporal column.
   * @param timeline - Attached luma.gl timeline to sample. The first attachment is used by default.
   * @returns Timeline time relative to `origin`, in the Arrow type's native unit.
   * @throws If the relative value cannot be represented as a finite JavaScript number.
   */
  getRelativeTime(origin: ArrowTimelineTime, timeline?: Timeline): number {
    const normalizedOrigin = this.normalizeTime(origin, 'origin');
    const time = this.getTime(timeline);
    const relativeTime =
      typeof time === 'bigint'
        ? Number(time - (normalizedOrigin as bigint))
        : time - (normalizedOrigin as number);
    if (!Number.isFinite(relativeTime)) {
      throw new Error('ArrowTimeline relative time cannot be represented as a finite number');
    }
    return relativeTime;
  }

  /**
   * Attaches to an existing luma.gl timeline.
   *
   * @param timeline - Deck's existing luma.gl timeline.
   * @param subscriber - Callback invoked when time or playback mapping changes.
   * @returns An idempotent callback that removes this subscription.
   */
  attach(timeline: Timeline, subscriber: (update: ArrowTimelineUpdate) => void): () => void {
    let attachment = this.attachments.get(timeline);
    if (!attachment) {
      const initialTimeSeconds = timeline.getTime() / 1000;
      const initialCurrentTime = this.getTime();
      attachment = {
        animationHandle: -1,
        timelineTimeSeconds: initialTimeSeconds,
        anchorTimelineTimeSeconds: initialTimeSeconds,
        anchorCurrentTime: initialCurrentTime,
        subscribers: new Set()
      };
      this.attachments.set(timeline, attachment);
      attachment.animationHandle = timeline.attachAnimation({
        setTime: timeMilliseconds => {
          attachment!.timelineTimeSeconds = timeMilliseconds / 1000;
          if (this.playing) {
            for (const callback of attachment!.subscribers) callback({type: 'time'});
          }
        }
      });
    }
    attachment.subscribers.add(subscriber);
    subscriber({type: 'mapping'});

    let detached = false;
    return () => {
      if (detached) return;
      detached = true;
      const activeAttachment = this.attachments.get(timeline);
      if (!activeAttachment) return;
      activeAttachment.subscribers.delete(subscriber);
      if (activeAttachment.subscribers.size === 0) {
        this.currentTime = this.wrapTime(this.getAttachmentTime(activeAttachment));
        timeline.detachAnimation(activeAttachment.animationHandle);
        this.attachments.delete(timeline);
      }
    };
  }

  private captureAttachmentTimes(): void {
    let capturedTime: ArrowTimelineTime | undefined;
    for (const attachment of this.attachments.values()) {
      const time = this.wrapTime(this.getAttachmentTime(attachment));
      attachment.anchorCurrentTime = time;
      attachment.anchorTimelineTimeSeconds = attachment.timelineTimeSeconds;
      capturedTime ??= time;
    }
    if (capturedTime !== undefined) this.currentTime = capturedTime;
  }

  private getAttachmentTime(attachment: TimelineAttachment): ArrowTimelineTime {
    if (!this.playing) return attachment.anchorCurrentTime;
    const elapsedUnits =
      (attachment.timelineTimeSeconds - attachment.anchorTimelineTimeSeconds) *
      this.unitsPerSecond *
      this.playbackRate;
    if (!Number.isFinite(elapsedUnits)) {
      throw new Error('ArrowTimeline elapsed time must be finite');
    }
    return typeof attachment.anchorCurrentTime === 'bigint'
      ? attachment.anchorCurrentTime + BigInt(Math.trunc(elapsedUnits))
      : attachment.anchorCurrentTime + elapsedUnits;
  }

  private wrapTime(time: ArrowTimelineTime): ArrowTimelineTime {
    if (!this.loop || !this.range) return time;
    const [start, end] = this.range;
    if (typeof time === 'bigint') {
      const bigintStart = start as bigint;
      const duration = (end as bigint) - bigintStart;
      return bigintStart + ((((time - bigintStart) % duration) + duration) % duration);
    }
    const numberStart = start as number;
    const duration = (end as number) - numberStart;
    return numberStart + ((((time - numberStart) % duration) + duration) % duration);
  }

  private normalizeTime(time: ArrowTimelineTime, name: string): ArrowTimelineTime {
    if (this.usesBigInt) {
      if (typeof time === 'bigint') return time;
      if (!Number.isSafeInteger(time)) {
        throw new Error(`ArrowTimeline ${name} must be a bigint or safe integer`);
      }
      return BigInt(time);
    }
    if (typeof time === 'bigint') {
      const numberTime = Number(time);
      if (!Number.isSafeInteger(numberTime)) {
        throw new Error(`ArrowTimeline ${name} bigint cannot be represented safely as a number`);
      }
      return numberTime;
    }
    if (!Number.isFinite(time)) {
      throw new Error(`ArrowTimeline ${name} must be finite`);
    }
    return time;
  }

  private notify(update: ArrowTimelineUpdate): void {
    for (const attachment of this.attachments.values()) {
      for (const subscriber of attachment.subscribers) subscriber(update);
    }
  }
}

function getArrowTimelineDataTypeInfo(dataType: ArrowTimelineDataType): ArrowTimelineDataTypeInfo {
  if (DataType.isList(dataType)) {
    throw new Error('ArrowTimeline dataType must be a scalar Arrow DataType');
  }
  const temporalInfo = getArrowTemporalVectorInfo({type: dataType});
  if (!temporalInfo) {
    throw new Error('ArrowTimeline dataType must be Date, Time, Timestamp, or Duration');
  }
  return {
    unitsPerSecond: UNIT_SCALES[temporalInfo.unit],
    usesBigInt: temporalInfo.bitWidth === 64
  };
}

function compareTimelineTimes(left: ArrowTimelineTime, right: ArrowTimelineTime): number {
  if (typeof left === 'bigint') {
    return left < (right as bigint) ? -1 : left > (right as bigint) ? 1 : 0;
  }
  return left < (right as number) ? -1 : left > (right as number) ? 1 : 0;
}

function validatePlaybackRate(playbackRate: number): number {
  if (!Number.isFinite(playbackRate)) {
    throw new Error('ArrowTimeline playbackRate must be finite');
  }
  return playbackRate;
}
