// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUClockCorrelation, TimestampQuerySnapshot} from '../../../index';
import type {WebGPUDevice} from '../webgpu-device';
import type {WebGPUQuerySet} from './webgpu-query-set';

/** One encoder's immutable readback, resolved in the same command buffer as the timestamps. */
export class WebGPUTimestampSnapshot implements TimestampQuerySnapshot {
  clockCorrelation?: GPUClockCorrelation;
  private readonly pairs: [number, number][] = [];
  private resolveBuffer?: GPUBuffer;
  private readBuffer?: GPUBuffer;
  private submitted = false;
  private resolveResults!: (results: bigint[]) => void;
  private rejectResults!: (error: unknown) => void;
  private readonly results = new Promise<bigint[]>((resolve, reject) => {
    this.resolveResults = resolve;
    this.rejectResults = reject;
  });

  constructor(
    private readonly device: WebGPUDevice,
    private readonly querySet: WebGPUQuerySet
  ) {
    // A discarded encoder need not have a readback consumer.
    void this.results.catch(() => {});
  }

  addPair(beginIndex: number, endIndex: number): void {
    this.pairs.push([beginIndex, endIndex]);
  }

  encodeResolve(encoder: GPUCommandEncoder): void {
    const size = this.querySet.props.count * 8;
    this.resolveBuffer = this.device.handle.createBuffer({
      size,
      usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC
    });
    this.readBuffer = this.device.handle.createBuffer({
      size,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
    encoder.resolveQuerySet(
      this.querySet.handle,
      0,
      this.querySet.props.count,
      this.resolveBuffer,
      0
    );
    encoder.copyBufferToBuffer(this.resolveBuffer, 0, this.readBuffer, 0, size);
  }

  submit(submissionTime: number, completion: Promise<number>): void {
    this.submitted = true;
    void this.collect(submissionTime, completion).then(this.resolveResults, this.rejectResults);
  }

  async readResults(options?: {firstQuery?: number; queryCount?: number}): Promise<bigint[]> {
    const firstQuery = options?.firstQuery ?? 0;
    const queryCount = options?.queryCount ?? this.querySet.props.count - firstQuery;
    const results = await this.results;
    return results.slice(firstQuery, firstQuery + queryCount);
  }

  destroy(): void {
    if (!this.submitted) {
      this.rejectResults(new Error('Timestamp encoding was discarded before submission'));
      this.resolveBuffer?.destroy();
      this.readBuffer?.destroy();
    }
  }

  private async collect(submissionTime: number, completion: Promise<number>): Promise<bigint[]> {
    try {
      const [completionTime] = await Promise.all([
        completion,
        this.readBuffer!.mapAsync(GPUMapMode.READ)
      ]);
      const results = Array.from(new BigUint64Array(this.readBuffer!.getMappedRange()));
      this.readBuffer!.unmap();
      const pairs = this.pairs.filter(
        ([begin, end]) => results[end] >= results[begin] && results[end] > 0n
      );
      if (pairs.length) {
        this.clockCorrelation = this.device.clockCorrelator.correlate(
          submissionTime,
          completionTime,
          Math.min(...pairs.map(([begin]) => Number(results[begin]) / 1e6)),
          Math.max(...pairs.map(([, end]) => Number(results[end]) / 1e6))
        );
      }
      return results;
    } finally {
      this.resolveBuffer?.destroy();
      this.readBuffer?.destroy();
    }
  }
}
