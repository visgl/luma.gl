// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getTypedArrayFromDataType,
  type TypedArray,
  type TypedArrayConstructor,
  type VertexFormat
} from '@luma.gl/core';
import {getGPUVectorFormatInfo} from './gpu-vector-format';

/** Constructor props for one immutable logical constant column value. */
export type GPUConstantProps<T extends VertexFormat = VertexFormat> = {
  /** Canonical fixed-width memory format of the stored value. */
  format: T;
  /** Exactly one raw value encoded with {@link format}. */
  value: TypedArray;
};

/** One immutable fixed-width value shared by every logical row in a GPU table column. */
export class GPUConstant<T extends VertexFormat = VertexFormat> {
  readonly isConstant = true;
  /** Canonical fixed-width memory format of the stored value. */
  readonly format: T;
  /** Owned copy of the one-row raw payload. */
  readonly value: TypedArray;
  /** Number of physical payload bytes retained by this constant. */
  readonly byteLength: number;

  constructor({format, value}: GPUConstantProps<T>) {
    const formatInfo = getGPUVectorFormatInfo(format);
    const expectedConstructor = getGPUConstantTypedArrayConstructor(format);
    if (value.constructor !== expectedConstructor) {
      throw new Error(
        `GPUConstant format "${format}" requires ${expectedConstructor.name}, received ${value.constructor.name}`
      );
    }
    if (value.byteLength !== formatInfo.byteLength) {
      throw new Error(
        `GPUConstant format "${format}" requires exactly ${formatInfo.byteLength} bytes, received ${value.byteLength}`
      );
    }

    const Constructor = value.constructor as TypedArrayConstructor;
    this.format = format;
    this.value = new Constructor(value as never);
    this.byteLength = this.value.byteLength;
  }
}

function getGPUConstantTypedArrayConstructor(format: VertexFormat): TypedArrayConstructor {
  if (format === 'unorm10-10-10-2') {
    return Uint32Array;
  }
  return getTypedArrayFromDataType(getGPUVectorFormatInfo(format).type);
}
