// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, Buffer, type CommandEncoder, type Device} from '@luma.gl/core';

/** A retained frame in chronological order. Particle identity is its index within the frame. */
export type FlowTrajectoryFrame = {
  /** Application-provided simulation time, in seconds. */
  time: number;
  /** Byte offset in the history buffer. */
  byteOffset: number;
  /** Monotonic capture number, including overwritten frames. */
  sequence: number;
};

/** Explicit CPU readback of one retained frame. The particle array is independent of GPU storage. */
export type FlowTrajectorySnapshot = FlowTrajectoryFrame & {
  /** Interleaved four-float records in stable particle-index order; xy/age/generation or spherical xyz/age. */
  particles: Float32Array;
};

/** Fixed-memory GPU ring of four-float particle snapshots; record layout is preserved unchanged. */
export class FlowTrajectoryHistory {
  /** Owned storage buffer; renderers may borrow it until destroy(). */
  readonly buffer: Buffer;
  /** Number of retained frames before the oldest is overwritten. */
  readonly capacity: number;
  /** Bytes copied for each frame. */
  readonly frameByteLength: number;
  /** CPU metadata only; particle data never leaves the GPU implicitly. */
  private readonly retainedFrames: FlowTrajectoryFrame[] = [];
  /** Next capture sequence. */
  private sequence = 0;
  /** Outstanding explicit readbacks that must complete before destruction. */
  private pendingReadbacks = 0;

  /** Allocate capacity * particleCount * 16 bytes, without allocating particle arrays on the CPU. */
  constructor(device: Device, props: {particleCount: number; capacity: number}) {
    assert(device.type === 'webgpu'); // Scientific particle storage and copies require WebGPU.
    assert(Number.isSafeInteger(props.particleCount) && props.particleCount > 0);
    assert(Number.isSafeInteger(props.capacity) && props.capacity > 0);
    this.capacity = props.capacity;
    this.frameByteLength = props.particleCount * 16;
    const byteLength = this.frameByteLength * this.capacity;
    // The public buffer can be bound as one storage resource, without caller-side slicing.
    assert(
      Number.isSafeInteger(byteLength) &&
        byteLength <= device.limits.maxBufferSize &&
        byteLength <= device.limits.maxStorageBufferBindingSize
    );
    this.buffer = device.createBuffer({
      id: 'flow-trajectory-history',
      byteLength,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
  }

  /** Chronological metadata for commands recorded so far; submit those commands before reading data. */
  get frames(): readonly FlowTrajectoryFrame[] {
    return this.retainedFrames.map(frame => ({...frame}));
  }

  /**
   * Append a GPU copy without submission or readback. Submit encoders in recording order;
   * do not discard recorded commands. Capture RK45 only after a completed horizon when
   * a common time across particles is required. The source buffer remains caller-owned.
   */
  record(commandEncoder: CommandEncoder, source: Buffer, time: number): void {
    assert(!this.buffer.destroyed && !source.destroyed && source !== this.buffer);
    assert(source.byteLength >= this.frameByteLength && (source.usage & Buffer.COPY_SRC) !== 0);
    assert(Number.isFinite(time));
    const last = this.retainedFrames.at(-1);
    assert(!last || time >= last.time); // Reset history before starting a new release or clock.
    const byteOffset = (this.sequence % this.capacity) * this.frameByteLength;
    commandEncoder.copyBufferToBuffer({
      sourceBuffer: source,
      destinationBuffer: this.buffer,
      destinationOffset: byteOffset,
      size: this.frameByteLength
    });
    if (this.retainedFrames.length === this.capacity) this.retainedFrames.shift();
    this.retainedFrames.push({time, byteOffset, sequence: this.sequence++});
  }

  /**
   * Explicitly read retained frames in chronological order. Reads only populated slots,
   * in at most two contiguous ranges. Submit recorded commands before calling this.
   * Subsequent captures/reset do not change this snapshot; await it before destroy().
   */
  async readFrames(): Promise<FlowTrajectorySnapshot[]> {
    assert(!this.buffer.destroyed);
    const frames = this.frames;
    if (frames.length === 0) return [];
    const firstOffset = frames[0].byteOffset;
    const firstCount = Math.min(frames.length, this.capacity - firstOffset / this.frameByteLength);
    const ranges = [{byteOffset: firstOffset, count: firstCount}];
    if (firstCount < frames.length) ranges.push({byteOffset: 0, count: frames.length - firstCount});
    this.pendingReadbacks++;
    try {
      // Queue both copies before yielding, so later captures cannot overwrite one range
      // between readbacks. Returned views share CPU allocations but never overlap.
      const bytes = await Promise.all(
        ranges.map(range =>
          this.buffer.readAsync(range.byteOffset, range.count * this.frameByteLength)
        )
      );
      const snapshots: FlowTrajectorySnapshot[] = [];
      for (let rangeIndex = 0; rangeIndex < ranges.length; rangeIndex++) {
        for (let frameIndex = 0; frameIndex < ranges[rangeIndex].count; frameIndex++) {
          snapshots.push({
            ...frames[snapshots.length],
            particles: new Float32Array(
              bytes[rangeIndex].buffer,
              bytes[rangeIndex].byteOffset + frameIndex * this.frameByteLength,
              this.frameByteLength / 4
            )
          });
        }
      }
      return snapshots;
    } finally {
      this.pendingReadbacks--;
    }
  }

  /** Forget retained metadata, without clearing GPU bytes or submitting commands. */
  reset(): void {
    assert(!this.buffer.destroyed);
    this.retainedFrames.length = 0;
    this.sequence = 0;
  }

  /** Release only the owned history buffer, never captured source buffers. */
  destroy(): void {
    assert(this.pendingReadbacks === 0); // Await explicit readbacks before releasing history.
    this.buffer.destroy();
    this.retainedFrames.length = 0;
  }
}
