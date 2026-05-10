// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Device, type BufferProps} from '@luma.gl/core';
import * as arrow from 'apache-arrow';
import type {AttributeArrowType} from './arrow-types';
import {getArrowVectorBufferSource} from './arrow-fixed-size-list';

export type ArrowGPUVectorProps = Omit<BufferProps, 'byteLength' | 'data'>;

/** A GPU buffer backed by one Arrow vector. */
export class ArrowGPUVector<T extends AttributeArrowType = AttributeArrowType> {
  readonly vector: arrow.Vector<T>;
  readonly buffer: Buffer;

  constructor(device: Device, vector: arrow.Vector<T>, props?: ArrowGPUVectorProps) {
    this.vector = vector;
    this.buffer = device.createBuffer({
      ...props,
      data: getArrowVectorBufferSource(vector as any)
    });
  }

  destroy(): void {
    this.buffer.destroy();
  }
}
