// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, QuerySet, QuerySetProps} from '@luma.gl/core';
import {WebGPUDevice} from '../webgpu-device';
import {WebGPUBuffer} from './webgpu-buffer';

export type QuerySetProps2 = {
  type: 'occlusion' | 'timestamp';
  count: number;
};

/**
 * Immutable
 */
export class WebGPUQuerySet extends QuerySet {
  readonly device: WebGPUDevice;
  readonly handle: GPUQuerySet;

  protected _resolveBuffer: WebGPUBuffer | null = null;
  protected _readBuffer: WebGPUBuffer | null = null;
  protected _cachedResults: bigint[] | null = null;
  protected _readResultsPromise: Promise<bigint[]> | null = null;

  constructor(device: WebGPUDevice, props: QuerySetProps) {
    super(device, props);
    this.device = device;
    this.handle =
      this.props.handle ||
      this.device.handle.createQuerySet({
        type: this.props.type,
        count: this.props.count
      });
    this.handle.label = this.props.id;
  }

  override destroy(): void {
    if (!this.destroyed) {
      this.handle?.destroy();
      this.destroyResource();
      // @ts-expect-error readonly
      this.handle = null;
    }
  }

  isResultAvailable(queryIndex?: number): boolean {
    if (!this._cachedResults) {
      return false;
    }

    return queryIndex === undefined
      ? true
      : queryIndex >= 0 && queryIndex < this._cachedResults.length;
  }

  async readResults(options?: {firstQuery?: number; queryCount?: number}): Promise<bigint[]> {
    const firstQuery = options?.firstQuery || 0;
    const queryCount = options?.queryCount || this.props.count - firstQuery;

    if (firstQuery < 0 || queryCount < 0 || firstQuery + queryCount > this.props.count) {
      throw new Error('Query read range is out of bounds');
    }

    if (!this._readResultsPromise) {
      this._readResultsPromise = this._readAllResults();
    }

    const results = await this._readResultsPromise;
    return results.slice(firstQuery, firstQuery + queryCount);
  }

  async readTimestampDuration(beginIndex: number, endIndex: number): Promise<number> {
    if (this.props.type !== 'timestamp') {
      throw new Error('Timestamp durations require a timestamp QuerySet');
    }
    if (beginIndex < 0 || endIndex <= beginIndex || endIndex >= this.props.count) {
      throw new Error('Timestamp duration range is out of bounds');
    }

    const results = await this.readResults({
      firstQuery: beginIndex,
      queryCount: endIndex - beginIndex + 1
    });
    return Number(results[results.length - 1] - results[0]) / 1e6;
  }

  /** Marks any cached query results as stale after new writes have been encoded. */
  _invalidateResults(): void {
    this._cachedResults = null;
  }

  protected async _readAllResults(): Promise<bigint[]> {
    this._ensureBuffers();

    try {
      this.device.commandEncoder.resolveQuerySet(this, this._resolveBuffer!);
      this.device.commandEncoder.copyBufferToBuffer({
        sourceBuffer: this._resolveBuffer!,
        destinationBuffer: this._readBuffer!,
        size: this._resolveBuffer!.byteLength
      });
      this.device.submit();

      const data = await this._readBuffer!.readAsync(0, this._readBuffer!.byteLength);
      const resultView = new BigUint64Array(data.buffer, data.byteOffset, this.props.count);
      this._cachedResults = Array.from(resultView, value => value);
      return this._cachedResults;
    } finally {
      this._readResultsPromise = null;
    }
  }

  protected _ensureBuffers(): void {
    if (this._resolveBuffer && this._readBuffer) {
      return;
    }

    const byteLength = this.props.count * 8;
    this._resolveBuffer = this.device.createBuffer({
      id: `${this.id}-resolve-buffer`,
      usage: Buffer.QUERY_RESOLVE | Buffer.COPY_SRC,
      byteLength
    });
    this.attachResource(this._resolveBuffer);

    this._readBuffer = this.device.createBuffer({
      id: `${this.id}-read-buffer`,
      usage: Buffer.COPY_DST | Buffer.MAP_READ,
      byteLength
    });
    this.attachResource(this._readBuffer);
  }
}
