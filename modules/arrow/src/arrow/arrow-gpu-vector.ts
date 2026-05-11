// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Device, type BufferProps} from '@luma.gl/core';
import * as arrow from 'apache-arrow';
import type {AttributeArrowType} from './arrow-types';
import {getArrowVectorBufferSource} from './arrow-fixed-size-list';

/** Buffer creation props forwarded when uploading Arrow vector memory to the GPU. */
export type ArrowGPUVectorProps = Omit<BufferProps, 'byteLength' | 'data'>;

/**
 * GPU memory and Arrow type metadata derived from one Arrow vector.
 *
 * The Arrow vector is a construction input only. ArrowGPUVector does not retain
 * the source vector; it owns a GPU buffer plus the type, length, and stride that
 * describe the uploaded memory.
 */
export class ArrowGPUVector<T extends AttributeArrowType = AttributeArrowType> {
  /** GPU buffer containing the Arrow vector's attribute-compatible value memory. */
  readonly buffer: Buffer;
  /** Arrow type that describes the uploaded vector memory. */
  readonly type: T;
  /** Number of logical Arrow vector rows uploaded into the GPU buffer. */
  readonly length: number;
  /** Number of scalar values per logical vector row. */
  readonly stride: number;

  /** Creates a GPU representation from an Arrow vector without retaining the source vector. */
  constructor(device: Device, vector: arrow.Vector<T>, props: ArrowGPUVectorProps = {}) {
    this.type = vector.type;
    this.length = vector.length;
    this.stride = getArrowVectorStride(vector);
    this.buffer = device.createBuffer({
      ...props,
      data: getArrowVectorBufferSource(vector as any)
    });
  }

  destroy(): void {
    this.buffer.destroy();
  }
}

function getArrowVectorStride(vector: arrow.Vector<AttributeArrowType>): number {
  return arrow.DataType.isFixedSizeList(vector.type) ? vector.type.listSize : 1;
}
