// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {getGPUVectorFormatInfo, type GPUVectorFormat} from './gpu-vector-format';

export type CPUDataProps<T extends GPUVectorFormat = GPUVectorFormat> = {
  buffer: ArrayBuffer | ArrayBufferView;
  format: T;
  length: number;
  valueLength?: number;
  /** Byte offset relative to the supplied buffer or view. */
  byteOffset?: number;
  byteStride?: number;
  rowByteLength?: number;
  valueOffsets?: Int32Array;
  nullBitmap?: Uint8Array;
};

/** Borrowed CPU storage for fixed rows or one level of list elements. No allocation or copying. */
export class CPUData<T extends GPUVectorFormat = GPUVectorFormat> {
  readonly buffer: ArrayBufferLike;
  readonly format: T;
  readonly length: number;
  readonly valueLength: number;
  /** Absolute offset into buffer. */
  readonly byteOffset: number;
  readonly byteStride: number;
  readonly rowByteLength: number;
  readonly valueOffsets?: Int32Array;
  readonly nullBitmap?: Uint8Array;

  constructor(props: CPUDataProps<T>) {
    const info = getGPUVectorFormatInfo(props.format);
    const view = ArrayBuffer.isView(props.buffer) ? props.buffer : undefined;
    this.buffer = view ? view.buffer : (props.buffer as ArrayBuffer);
    this.format = props.format;
    this.length = props.length;
    this.valueLength = props.valueLength ?? props.length * (info.listSize ?? 1);
    const offset = props.byteOffset ?? 0;
    this.byteOffset = (view?.byteOffset ?? 0) + offset;
    this.rowByteLength = props.rowByteLength ?? info.byteLength;
    this.byteStride = props.byteStride ?? this.rowByteLength;
    this.valueOffsets = props.valueOffsets;
    this.nullBitmap = props.nullBitmap;
    const variable = info.vertexList || info.valueList;
    const count = variable ? this.valueLength : this.length;
    // Layouts must describe complete rows within the supplied view, including empty ranges.
    assert(
      [this.length, this.valueLength, offset, this.rowByteLength, this.byteStride].every(
        value => Number.isSafeInteger(value) && value >= 0
      )
    );
    assert(this.rowByteLength >= info.byteLength && this.byteStride >= this.rowByteLength);
    assert(variable || this.valueLength === this.length * (info.listSize ?? 1));
    assert(
      offset + (count ? (count - 1) * this.byteStride + this.rowByteLength : 0) <=
        props.buffer.byteLength
    );
  }
}
