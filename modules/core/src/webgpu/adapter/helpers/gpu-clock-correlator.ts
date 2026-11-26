// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUClockCorrelation} from '../../../api/adapter/resources/command-encoder';

/** Keeps a short-lived offset interval. Assumes a stable clock offset within one second. */
export class GPUClockCorrelator {
  private sample: {minimum: number; maximum: number; time: number; oldestTime: number} | undefined;

  correlate(
    submissionTime: number,
    completionTime: number,
    gpuStartTime: number,
    gpuEndTime: number
  ): GPUClockCorrelation | undefined {
    let minimum = submissionTime - gpuStartTime;
    let maximum = completionTime - gpuEndTime;
    if (
      ![minimum, maximum, submissionTime, completionTime].every(Number.isFinite) ||
      completionTime < submissionTime ||
      gpuEndTime < gpuStartTime ||
      minimum > maximum
    )
      return undefined;

    const previous = this.sample;
    let oldestTime = completionTime;
    // Out-of-order readbacks can still get a local estimate, but cannot replace newer samples.
    if (
      previous &&
      completionTime >= previous.time &&
      completionTime - previous.oldestTime <= 1000
    ) {
      const intersectionMinimum = Math.max(minimum, previous.minimum);
      const intersectionMaximum = Math.min(maximum, previous.maximum);
      if (intersectionMinimum <= intersectionMaximum) {
        minimum = intersectionMinimum;
        maximum = intersectionMaximum;
        oldestTime = previous.oldestTime;
      }
    }
    if (!previous || completionTime >= previous.time) {
      this.sample = {minimum, maximum, time: completionTime, oldestTime};
    }
    return {
      offsetMilliseconds: minimum + (maximum - minimum) / 2,
      uncertaintyMilliseconds: (maximum - minimum) / 2,
      sampledAtCpuTimeMilliseconds: completionTime,
      method: 'submission'
    };
  }
}
