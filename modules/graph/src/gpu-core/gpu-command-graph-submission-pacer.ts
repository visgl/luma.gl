// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

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
  private readonly dutyCycle: number;
  private readonly minimumCooldown: number;
  private readonly maximumCooldown: number;
  private readonly now: () => number;
  private pending = false;
  private nextSubmissionTime = -Infinity;

  /** Creates a pacer. The caller retains command encoding and submission ownership. */
  constructor(props: GPUCommandGraphSubmissionPacerProps = {}) {
    this.dutyCycle = props.dutyCycle ?? 0.5;
    this.minimumCooldown = props.minimumCooldownMilliseconds ?? 8;
    this.maximumCooldown = props.maximumCooldownMilliseconds ?? 250;
    this.now = props.now ?? (() => performance.now());
    if (
      !(this.dutyCycle > 0 && this.dutyCycle <= 1) ||
      !Number.isFinite(this.minimumCooldown) ||
      this.minimumCooldown < 0 ||
      !Number.isFinite(this.maximumCooldown) ||
      this.maximumCooldown < this.minimumCooldown
    ) {
      throw new Error('Invalid GPU graph submission pacing bounds');
    }
  }

  /** Reports whether a caller may encode and submit its next batch. */
  isReady(): boolean {
    return !this.pending && this.now() >= this.nextSubmissionTime;
  }

  /** Tracks completion of a submitted batch and preserves rejection for the caller. */
  async trackSubmission(completion: Promise<unknown>): Promise<void> {
    if (this.pending) throw new Error('A GPU graph submission is already being tracked');
    this.pending = true;
    const startedAt = this.now();
    try {
      await completion;
      const finishedAt = this.now();
      const duration = Math.max(0, finishedAt - startedAt);
      const cooldown = duration / this.dutyCycle - duration;
      this.nextSubmissionTime =
        finishedAt + Math.max(this.minimumCooldown, Math.min(this.maximumCooldown, cooldown));
    } catch (error) {
      this.nextSubmissionTime = this.now() + this.minimumCooldown;
      throw error;
    } finally {
      this.pending = false;
    }
  }
}
