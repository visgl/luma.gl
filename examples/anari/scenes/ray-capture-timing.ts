// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';

/** Available slots for compute and render passes in one capture frame. */
const TIMESTAMP_SLOT_COUNT = 128;

/** Result of rendering one frame with optional GPU timestamp collection. */
type TimedCaptureFrame<Result> = {
  /** Result of the original frame render. */
  result: Result;
  /** Sum of the timestamped passes in milliseconds, or null when unavailable. */
  gpuTime: Promise<number | null>;
};

/** Profiles the encoded scene passes and submits them before resolving their timestamps. */
export function timeCaptureFrame<Result>(
  device: Device,
  render: () => Result
): TimedCaptureFrame<Result> {
  const encoder = device.commandEncoder;
  if (
    !device.features.has('timestamp-query') ||
    !encoder.withTimeProfilingQuerySet ||
    !encoder.captureTimestampQuerySet
  ) {
    return {result: render(), gpuTime: Promise.resolve(null)};
  }
  const queries = device.createQuerySet({type: 'timestamp', count: TIMESTAMP_SLOT_COUNT});
  try {
    const {result, count, snapshot} = encoder.withTimeProfilingQuerySet(queries, () => {
      const result = render();
      const count = encoder.getTimeProfilingSlotCount();
      return {result, count, snapshot: count ? encoder.captureTimestampQuerySet!(queries) : null};
    });
    device.submit();
    if (!snapshot || count === TIMESTAMP_SLOT_COUNT) {
      queries.destroy();
      return {result, gpuTime: Promise.resolve(null)};
    }
    const gpuTime = snapshot
      .readResults({queryCount: count})
      .then(
        timestamps => {
          let nanoseconds = 0n;
          for (let index = 0; index < timestamps.length; index += 2) {
            const begin = timestamps[index];
            const end = timestamps[index + 1];
            // Empty passes may leave both slots zero. Populated pairs must be ordered.
            if (end < begin) return null;
            nanoseconds += end - begin;
          }
          return nanoseconds > 0n ? Number(nanoseconds) / 1e6 : null;
        },
        () => null
      )
      .finally(() => queries.destroy());
    return {result, gpuTime};
  } catch (error) {
    queries.destroy();
    throw error;
  }
}
