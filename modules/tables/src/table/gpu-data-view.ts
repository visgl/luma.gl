// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  vertexFormatDecoder,
  type Buffer,
  type BufferLayout,
  type VertexFormat
} from '@luma.gl/core';
import type {DynamicBuffer} from '@luma.gl/engine';

/** Minimal backing resource required by a {@link GPUDataView}. */
export type GPUDataViewBuffer = {
  /** Number of addressable bytes in the backing resource. */
  readonly byteLength: number;
};

/** Properties for one fixed-width strided view over a GPU buffer-like resource. */
export type GPUDataViewProps<
  Format extends VertexFormat = VertexFormat,
  BufferType extends GPUDataViewBuffer = Buffer | DynamicBuffer
> = {
  /** Buffer-like resource containing the values. */
  buffer: BufferType;
  /** Canonical fixed-width memory format for one value. */
  format: Format;
  /** Number of fixed-width values in the view. */
  length: number;
  /** Byte offset of the first value. Defaults to zero. */
  byteOffset?: number;
  /** Byte distance between consecutive values. Defaults to the format byte length. */
  byteStride?: number;
};

/** Properties for deriving a fixed-width view from one buffer-layout attribute. */
export type GPUDataViewFromAttributeProps<
  BufferType extends GPUDataViewBuffer = Buffer | DynamicBuffer
> = {
  /** Buffer-like resource described by `bufferLayout`. */
  buffer: BufferType;
  /** Layout containing the requested attribute. */
  bufferLayout: BufferLayout;
  /** Attribute name to expose as a view. */
  attributeName: string;
  /** Number of attribute values in the view. */
  length: number;
  /** Additional byte offset applied before the attribute offset. Defaults to zero. */
  byteOffset?: number;
};

/**
 * Borrowed fixed-width strided view over a GPU buffer-like resource.
 *
 * A data view describes physical values only. It does not own its backing resource and carries no
 * logical list topology, validity, or adapter metadata.
 */
export class GPUDataView<
  Format extends VertexFormat = VertexFormat,
  BufferType extends GPUDataViewBuffer = Buffer | DynamicBuffer
> {
  /** Buffer-like resource containing the values. */
  readonly buffer: BufferType;
  /** Canonical fixed-width memory format for one value. */
  readonly format: Format;
  /** Number of fixed-width values in the view. */
  readonly length: number;
  /** Byte offset of the first value. */
  readonly byteOffset: number;
  /** Byte distance between consecutive values. */
  readonly byteStride: number;

  constructor(props: GPUDataViewProps<Format, BufferType>) {
    const elementByteLength = vertexFormatDecoder.getVertexFormatInfo(props.format).byteLength;
    const byteOffset = props.byteOffset ?? 0;
    const byteStride = props.byteStride ?? elementByteLength;

    validateSafeNonNegativeInteger(props.length, 'GPUDataView length');
    validateSafeNonNegativeInteger(byteOffset, 'GPUDataView byteOffset');
    validateSafeNonNegativeInteger(byteStride, 'GPUDataView byteStride');
    if (byteStride < elementByteLength) {
      throw new Error(
        `GPUDataView byteStride ${byteStride} is smaller than ${props.format} byte length ${elementByteLength}`
      );
    }

    const byteLength = props.length === 0 ? 0 : (props.length - 1) * byteStride + elementByteLength;
    const endByteOffset = byteOffset + byteLength;
    if (!Number.isSafeInteger(byteLength) || !Number.isSafeInteger(endByteOffset)) {
      throw new Error('GPUDataView byte range must use safe integers');
    }
    if (endByteOffset > props.buffer.byteLength) {
      throw new Error('GPUDataView exceeds its backing buffer byte length');
    }

    this.buffer = props.buffer;
    this.format = props.format;
    this.length = props.length;
    this.byteOffset = byteOffset;
    this.byteStride = byteStride;
  }

  /** Number of bytes occupied by one fixed-width value. */
  get elementByteLength(): number {
    return vertexFormatDecoder.getVertexFormatInfo(this.format).byteLength;
  }

  /** Number of bytes from the first value through the final value payload. */
  get byteLength(): number {
    return this.length === 0 ? 0 : (this.length - 1) * this.byteStride + this.elementByteLength;
  }
}

/**
 * Creates a borrowed fixed-width view of one attribute in a buffer layout.
 *
 * The returned view combines the caller's base offset with the attribute offset and uses the
 * layout's row stride. No GPU storage is allocated or copied.
 */
export function makeGPUDataViewFromAttribute<BufferType extends GPUDataViewBuffer>({
  buffer,
  bufferLayout,
  attributeName,
  length,
  byteOffset = 0
}: GPUDataViewFromAttributeProps<BufferType>): GPUDataView<VertexFormat, BufferType> {
  const attribute = bufferLayout.attributes?.find(
    candidate => candidate.attribute === attributeName
  );
  if (!attribute) {
    throw new Error(
      `Buffer layout "${bufferLayout.name}" does not contain attribute "${attributeName}"`
    );
  }
  if (!attribute.format) {
    throw new Error(`Buffer layout attribute "${attributeName}" requires a format`);
  }
  if (bufferLayout.byteStride === undefined) {
    throw new Error(`Buffer layout "${bufferLayout.name}" requires byteStride for attribute views`);
  }

  return new GPUDataView({
    buffer,
    format: attribute.format,
    length,
    byteOffset: byteOffset + attribute.byteOffset,
    byteStride: bufferLayout.byteStride
  });
}

function validateSafeNonNegativeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative safe integer`);
  }
}
