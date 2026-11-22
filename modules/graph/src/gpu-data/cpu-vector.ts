// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {CPUData} from './cpu-data';
import type {GPUVectorFormat} from './gpu-vector-format';

export type CPUVectorProps<T extends GPUVectorFormat = GPUVectorFormat> = {
  name?: string;
  format: T;
  data: readonly CPUData<T>[];
};

/** Ordered borrowed CPU chunks. Construction preserves buffers and chunk boundaries. */
export class CPUVector<T extends GPUVectorFormat = GPUVectorFormat> {
  readonly name: string;
  readonly format: T;
  readonly data: readonly CPUData<T>[];
  readonly length: number;
  readonly valueLength: number;

  constructor(props: CPUVectorProps<T>) {
    assert(props.data.every(chunk => chunk.format === props.format));
    this.name = props.name ?? '';
    this.format = props.format;
    this.data = Object.freeze([...props.data]);
    this.length = this.data.reduce((total, chunk) => total + chunk.length, 0);
    this.valueLength = this.data.reduce((total, chunk) => total + chunk.valueLength, 0);
  }
}
