// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type VertexFormat} from '@luma.gl/core';
import {
  getGPUVectorFormatInfo,
  isValueListGPUVectorFormat,
  isVertexListGPUVectorFormat,
  type GPUVectorFormat
} from '@luma.gl/tables';
import {GPUCommandGraph, GraphVectorView, type GraphDataView} from './gpu-command-graph';

const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const STORAGE_BINDING_ALIGNMENT = 256;

/** Aligned buffer range that can be bound for a logical graph data view. */
export type GraphDataViewBinding = {buffer: Buffer; offset: number; size: number};

/** Packed 32-bit scalar formats supported by graph-native analysis primitives. @internal */
export type GPUScalarFormat = 'uint32' | 'sint32' | 'float32';

/**
 * Validates that a view has one of the requested formats and a packed, uint32-aligned layout.
 *
 * Packed primitive shaders index storage buffers in 32-bit components, so they cannot consume
 * interleaved rows or arbitrary byte offsets.
 *
 * @internal
 */
export function validatePackedView<T extends GPUVectorFormat>(
  view: GraphDataView,
  formats: readonly T[],
  name: string
): asserts view is GraphDataView<T> {
  const formatInfo = getGPUVectorFormatInfo(view.format);
  if (
    !formats.includes(view.format as T) ||
    view.byteStride !== formatInfo.byteLength ||
    view.rowByteLength !== formatInfo.byteLength ||
    view.byteOffset % UINT32_BYTE_LENGTH !== 0
  ) {
    throw new Error(`${name} must be packed, uint32-aligned ${formats.join(' or ')} GPU data`);
  }
}

/** Validates a packed `uint32` view used for flags, counts, or indices. @internal */
export function validatePackedUint32View(view: GraphDataView, name: string): void {
  validatePackedView(view, ['uint32'], name);
}

/**
 * Returns the aligned storage-buffer binding that contains a logical data view.
 *
 * WebGPU storage bindings begin at 256-byte-aligned offsets. Generated shaders add the component
 * offset from {@link getViewElementOffset} to reach the view's actual first row.
 */
export function getViewBinding(
  view: GraphDataView,
  getBuffer: (view: GraphDataView) => Buffer
): GraphDataViewBinding {
  const alignedByteOffset =
    Math.floor(view.byteOffset / STORAGE_BINDING_ALIGNMENT) * STORAGE_BINDING_ALIGNMENT;
  const prefixByteLength = view.byteOffset - alignedByteOffset;
  const viewByteLength =
    view.length === 0
      ? view.rowByteLength
      : (view.length - 1) * view.byteStride + view.rowByteLength;
  const binding = {
    buffer: getBuffer(view),
    offset: alignedByteOffset,
    size: prefixByteLength + Math.max(viewByteLength, view.rowByteLength)
  };
  if (binding.offset + binding.size > view.buffer.byteLength) {
    throw new Error('GraphDataView storage binding exceeds its logical buffer');
  }
  return binding;
}

/** Returns the view offset in 32-bit components from its aligned storage binding. */
export function getViewElementOffset(view: GraphDataView): number {
  if (view.byteOffset % UINT32_BYTE_LENGTH !== 0) {
    throw new Error('GraphDataView storage binding must be uint32-aligned');
  }
  return (view.byteOffset % STORAGE_BINDING_ALIGNMENT) / UINT32_BYTE_LENGTH;
}

/** Returns whether two logical views touch any of the same bytes. @internal */
export function doGraphDataViewsOverlap(first: GraphDataView, second: GraphDataView): boolean {
  if (first.buffer !== second.buffer || first.length === 0 || second.length === 0) {
    return false;
  }
  const firstEnd = first.byteOffset + (first.length - 1) * first.byteStride + first.rowByteLength;
  const secondEnd =
    second.byteOffset + (second.length - 1) * second.byteStride + second.rowByteLength;
  return first.byteOffset < secondEnd && second.byteOffset < firstEnd;
}

/** Creates a packed, fixed-width graph-owned transient buffer and a typed view spanning it. */
export function createTransientView<T extends VertexFormat, Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  format: T,
  length: number,
  usage: number = Buffer.STORAGE
): GraphDataView<T> {
  if (!Number.isSafeInteger(length) || length < 0) {
    throw new Error('Transient GraphDataView length must be a non-negative safe integer');
  }
  if ((usage & Buffer.STORAGE) === 0) {
    throw new Error('Transient GraphDataView usage must include Buffer.STORAGE');
  }
  if (isVertexListGPUVectorFormat(format) || isValueListGPUVectorFormat(format)) {
    throw new Error('Transient GraphDataView requires a fixed-width GPUVector format');
  }
  const formatInfo = getGPUVectorFormatInfo(format);
  const buffer = graph.createTransientBuffer({
    id,
    byteLength: Math.max(length, 1) * formatInfo.byteLength,
    usage
  });
  return graph.createDataView(buffer, {format, length});
}

/** Creates graph-owned scratch storage with the same chunk topology as a vector. @internal */
export function createTransientVectorView<T extends VertexFormat, Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  template: GraphVectorView<T>
): GraphVectorView<T> {
  let emptyChunk: GraphDataView<T> | undefined;
  const data = template.data.map((chunk, chunkIndex) => {
    if (chunk.length === 0) {
      emptyChunk ??= createTransientView(graph, `${id}-empty`, template.format, 0);
      return emptyChunk;
    }
    return createTransientView(graph, `${id}-chunk-${chunkIndex}`, template.format, chunk.length);
  });
  return new GraphVectorView({
    id,
    name: id,
    format: template.format,
    length: template.length,
    valueLength: template.valueLength,
    stride: template.stride,
    byteStride: template.byteStride,
    rowByteLength: template.rowByteLength,
    data
  });
}

/** Validates that two vectors have identical ordered chunk lengths. @internal */
export function validateMatchingVectorTopology(
  first: GraphVectorView,
  second: GraphVectorView,
  name: string
): void {
  if (
    first.length !== second.length ||
    first.data.length !== second.data.length ||
    first.data.some((chunk, chunkIndex) => chunk.length !== second.data[chunkIndex].length)
  ) {
    throw new Error(`${name} must preserve the same chunk topology`);
  }
}
