// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Binding} from '@luma.gl/core';
import {getGPUVectorFormatInfo, type GPUVectorFormat} from '@luma.gl/tables';
import {GPUCommandGraph, GraphVectorView, type GraphDataView} from './gpu-command-graph';

const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const STORAGE_BINDING_ALIGNMENT = 256;

/** @internal */
export type GPUScalarFormat = 'uint32' | 'sint32' | 'float32';

/** @internal */
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

/** @internal */
export function validatePackedUint32View(view: GraphDataView, name: string): void {
  validatePackedView(view, ['uint32'], name);
}

/** @internal */
export function getViewBinding(
  view: GraphDataView,
  getBuffer: (view: GraphDataView) => Buffer
): Binding {
  const alignedByteOffset =
    Math.floor(view.byteOffset / STORAGE_BINDING_ALIGNMENT) * STORAGE_BINDING_ALIGNMENT;
  const prefixByteLength = view.byteOffset - alignedByteOffset;
  const viewByteLength =
    view.length === 0
      ? view.rowByteLength
      : (view.length - 1) * view.byteStride + view.rowByteLength;
  return {
    buffer: getBuffer(view),
    offset: alignedByteOffset,
    size: prefixByteLength + Math.max(viewByteLength, view.rowByteLength)
  };
}

/** Offset in 32-bit components from the aligned storage binding. @internal */
export function getViewElementOffset(view: GraphDataView): number {
  return (view.byteOffset % STORAGE_BINDING_ALIGNMENT) / UINT32_BYTE_LENGTH;
}

/** @internal */
export function createTransientView<T extends GPUVectorFormat, Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  format: T,
  length: number
): GraphDataView<T> {
  const formatInfo = getGPUVectorFormatInfo(format);
  const buffer = graph.createTransientBuffer({
    id,
    byteLength: Math.max(length, 1) * formatInfo.byteLength,
    usage: Buffer.STORAGE
  });
  return graph.createDataView(buffer, {format, length});
}

/** Creates graph-owned scratch storage with the same chunk topology as a vector. @internal */
export function createTransientVectorView<T extends GPUVectorFormat, Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  template: GraphVectorView<T>
): GraphVectorView<T> {
  return new GraphVectorView({
    id,
    name: id,
    format: template.format,
    length: template.length,
    valueLength: template.valueLength,
    stride: template.stride,
    byteStride: template.byteStride,
    rowByteLength: template.rowByteLength,
    data: template.data.map((chunk, chunkIndex) =>
      createTransientView(graph, `${id}-chunk-${chunkIndex}`, template.format, chunk.length)
    )
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
