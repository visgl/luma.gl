// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';

/** Controls the spacing of graph submissions on an application-owned queue. */
export type GPUCommandGraphSubmissionPacerProps = {
  /** Target fraction of the submission cycle spent waiting for GPU completion. */
  dutyCycle?: number;
  /** Minimum quiet time after completion, in milliseconds. */
  minimumCooldownMilliseconds?: number;
  /** Upper bound on the quiet time, in milliseconds. */
  maximumCooldownMilliseconds?: number;
  /** Monotonic clock, in milliseconds. Defaults to performance.now. */
  now?: () => number;
};

/** Allows one tracked submission in flight and adapts the pause after it completes. */
export class GPUCommandGraphSubmissionPacer {
  /** Target completion-to-cycle ratio. */
  private readonly dutyCycle: number;
  /** Quiet time floor following completion. */
  private readonly minimumCooldown: number;
  /** Quiet time ceiling following completion. */
  private readonly maximumCooldown: number;
  /** Monotonic clock used for observations. */
  private readonly now: () => number;
  /** Whether a submitted batch is awaiting completion. */
  private pending = false;
  /** Earliest time the next batch may start. */
  private nextSubmissionTime = -Infinity;
  /** Most recent completed submission duration, excluding cooldown. */
  private lastDuration: number | null = null;
  /** Workload generation for rejecting obsolete timing and cooldown observations. */
  private generation = 0;

  /** Creates a pacer. The caller retains command encoding and submission ownership. */
  constructor(props: GPUCommandGraphSubmissionPacerProps = {}) {
    this.dutyCycle = props.dutyCycle ?? 0.5;
    this.minimumCooldown = props.minimumCooldownMilliseconds ?? 8;
    this.maximumCooldown = props.maximumCooldownMilliseconds ?? 250;
    this.now = props.now ?? (() => performance.now());
    // A valid duty cycle and finite ordered cooldown bounds are required.
    assert(
      this.dutyCycle > 0 &&
        this.dutyCycle <= 1 &&
        Number.isFinite(this.minimumCooldown) &&
        this.minimumCooldown >= 0 &&
        Number.isFinite(this.maximumCooldown) &&
        this.maximumCooldown >= this.minimumCooldown
    );
  }

  /** Queue-completion time of the last batch, before adaptive cooldown. */
  get lastSubmissionMilliseconds(): number | null {
    return this.lastDuration;
  }

  /** Reports whether a caller may encode and submit its next batch. */
  isReady(): boolean {
    return !this.pending && this.now() >= this.nextSubmissionTime;
  }

  /** Clears timing and cooldown for a changed workload while retaining in-flight backpressure. */
  resetCooldown(): void {
    this.generation++;
    this.nextSubmissionTime = -Infinity;
    this.lastDuration = null;
  }

  /** Tracks completion of a submitted batch and preserves rejection for the caller. */
  async trackSubmission(completion: Promise<unknown>): Promise<void> {
    // The caller must check readiness before submitting another batch.
    assert(!this.pending);
    this.pending = true;
    /** Timestamp immediately after the caller submitted its batch. */
    const startedAt = this.now();
    /** Workload that submitted the fenced batch. */
    const generation = this.generation;
    try {
      await completion;
      if (generation !== this.generation) return;
      /** Timestamp when the fence settled successfully. */
      const finishedAt = this.now();
      /** Queue latency of the completed batch, without intentional idle time. */
      const duration = Math.max(0, finishedAt - startedAt);
      /** Idle share required by the requested duty cycle. */
      const cooldown = duration / this.dutyCycle - duration;
      this.lastDuration = duration > 0 ? duration : null;
      this.nextSubmissionTime =
        finishedAt + Math.max(this.minimumCooldown, Math.min(this.maximumCooldown, cooldown));
    } catch (error) {
      if (generation === this.generation) {
        this.lastDuration = null;
        this.nextSubmissionTime = this.now() + this.minimumCooldown;
      }
      throw error;
    } finally {
      this.pending = false;
    }
  }
}
