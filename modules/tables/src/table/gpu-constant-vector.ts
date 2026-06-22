// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device, type VertexFormat} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {GPUVector, type GPUVectorBufferProps} from './gpu-vector';
import {getGPUVectorFormatInfo} from './gpu-vector-format';

/** Props for wrapping one fixed-width GPU value as a logical constant vector. */
export type GPUConstantVectorProps<T extends VertexFormat = VertexFormat> = {
  /** Stable vector name. */
  name: string;
  /** Existing buffer containing one complete value at byte offset zero. */
  buffer: Buffer | DynamicBuffer;
  /** Fixed-width memory format of the constant value. */
  format: T;
  /** Number of logical rows across which the value is broadcast. */
  length: number;
  /** Whether this vector should destroy the wrapped buffer. */
  ownsBuffer?: boolean;
  /** Optional adapter-owned metadata; core tables do not inspect this value. */
  dataType?: unknown;
};

/** Props for allocating an owned constant vector from one typed value. */
export type GPUConstantVectorFromValueProps<T extends VertexFormat = VertexFormat> = Omit<
  GPUVectorBufferProps,
  'byteOffset' | 'indexType'
> & {
  /** Stable vector name. */
  name: string;
  /** Fixed-width memory format of the constant value. */
  format: T;
  /** Number of logical rows across which the value is broadcast. */
  length: number;
  /** Exactly one encoded value matching `format`. */
  value: ArrayBufferView;
  /** Optional adapter-owned metadata; core tables do not inspect this value. */
  dataType?: unknown;
};

/**
 * One fixed-width GPU value broadcast across a logical vector row range.
 *
 * The backing buffer stores one payload row. A zero byte stride publishes that
 * row as a constant vertex attribute on backends that support zero-stride input.
 */
export class GPUConstantVector<T extends VertexFormat = VertexFormat> extends GPUVector<T> {
  /** Identifies this vector as a broadcast constant. */
  readonly isConstant = true;

  constructor(props: GPUConstantVectorProps<T>) {
    const formatInfo = validateConstantVectorProps(props);
    super({
      type: 'buffer',
      name: props.name,
      buffer: props.buffer,
      format: props.format,
      length: props.length,
      valueLength: props.length,
      stride: formatInfo.components,
      byteStride: 0,
      rowByteLength: formatInfo.byteLength,
      ownsBuffer: props.ownsBuffer,
      dataType: props.dataType
    });
  }

  /** Allocates and owns a one-value vertex buffer for a broadcast constant. */
  static fromValue<T extends VertexFormat>(
    device: Device,
    props: GPUConstantVectorFromValueProps<T>
  ): GPUConstantVector<T> {
    const {name, format, length, value, dataType, usage = 0, ...bufferProps} = props;
    const formatInfo = validateConstantFormat(format, length);
    if (value.byteLength !== formatInfo.byteLength) {
      throw new Error(
        `GPUConstantVector value byteLength ${value.byteLength} must match ${format} byteLength ${formatInfo.byteLength}`
      );
    }

    const buffer = device.createBuffer({
      ...bufferProps,
      usage: usage | Buffer.VERTEX | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: value
    });
    return new GPUConstantVector({
      name,
      buffer,
      format,
      length,
      ownsBuffer: true,
      dataType
    });
  }
}

function validateConstantVectorProps<T extends VertexFormat>(
  props: GPUConstantVectorProps<T>
): ReturnType<typeof getGPUVectorFormatInfo> {
  const formatInfo = validateConstantFormat(props.format, props.length);
  if (props.buffer.byteLength < formatInfo.byteLength) {
    throw new Error(
      `GPUConstantVector buffer byteLength ${props.buffer.byteLength} must contain one ${props.format} value (${formatInfo.byteLength} bytes)`
    );
  }
  return formatInfo;
}

function validateConstantFormat<T extends VertexFormat>(
  format: T,
  length: number
): ReturnType<typeof getGPUVectorFormatInfo> {
  if (!Number.isInteger(length) || length < 0) {
    throw new Error('GPUConstantVector length must be a non-negative integer');
  }
  const formatInfo = getGPUVectorFormatInfo(format);
  if (formatInfo.vertexList || formatInfo.valueList) {
    throw new Error('GPUConstantVector requires a fixed-width vertex format');
  }
  return formatInfo;
}
