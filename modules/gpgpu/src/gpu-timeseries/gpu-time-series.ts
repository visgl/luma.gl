// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import type {GPUVector} from '../gpu-data/gpu-vector';

export type GPUTimeSeriesProps = {
  /** Borrowed uniformly sampled values; source row indices are stable sample identities. */
  values: GPUVector<'float32'>;
  /** Optional nonzero validity, with exactly the same ordered chunk lengths. */
  validity?: GPUVector<'uint32'>;
  /** CPU metadata only. Time of sample zero, in caller-selected units. Defaults to zero. */
  origin?: number;
  /** Positive time between samples in the same units. Defaults to one. */
  interval?: number;
};

/** Uniform samples over borrowed chunks. No allocation, packing, upload or ownership transfer. */
export class GPUTimeSeries {
  readonly values: GPUVector<'float32'>;
  readonly validity?: GPUVector<'uint32'>;
  readonly origin: number;
  readonly interval: number;

  constructor(props: GPUTimeSeriesProps) {
    this.values = props.values;
    this.validity = props.validity;
    this.origin = props.origin ?? 0;
    this.interval = props.interval ?? 1;
    // Reserve the uint32 sentinel for absent source IDs and avoid index addition overflow.
    assert(this.values.length <= 0xfffffffe);
    assert(Number.isFinite(this.origin) && Number.isFinite(this.interval) && this.interval > 0);
    validateTimeSeriesVector(this.values, 'float32', 4);
    if (this.validity) {
      validateTimeSeriesVector(this.validity, 'uint32', 4);
      // Validity retains the source's batch topology, including empty chunks.
      assert(this.validity.data.length === this.values.data.length);
      assert(
        this.validity.data.every((chunk, index) => chunk.length === this.values.data[index].length)
      );
    }
  }

  get length(): number {
    return this.values.length;
  }
}

/** Packed layout validation shared by the time-series contributors. @internal */
export function validateTimeSeriesVector(
  vector: GPUVector,
  format: 'float32' | 'uint32' | 'float32x4' | 'uint32x4' | 'uint32x2',
  byteStride: number
): void {
  assert(vector.format === format && vector.byteStride === byteStride && !vector.bufferLayout);
  assert(vector.rowByteLength === byteStride);
  for (const chunk of vector.data) {
    assert(chunk.format === format && chunk.byteStride === byteStride);
    assert(chunk.rowByteLength === byteStride && chunk.byteOffset % 4 === 0);
  }
}
