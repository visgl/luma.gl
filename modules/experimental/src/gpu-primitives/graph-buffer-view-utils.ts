// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Binding} from '@luma.gl/core';
import {getGPUVectorFormatInfo, type GPUVectorFormat} from '@luma.gl/tables';
import {GPUCommandGraph, type GraphBufferView} from './gpu-command-graph';

const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const STORAGE_BINDING_ALIGNMENT = 256;

/** @internal */
export type GPUScalarFormat = 'uint32' | 'sint32' | 'float32';

/** @internal */
export function validatePackedView<T extends GPUVectorFormat>(
  view: GraphBufferView,
  formats: readonly T[],
  name: string
): asserts view is GraphBufferView<T> {
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
export function validatePackedUint32View(view: GraphBufferView, name: string): void {
  validatePackedView(view, ['uint32'], name);
}

/** @internal */
export function getViewBinding(
  view: GraphBufferView,
  getBuffer: (view: GraphBufferView) => Buffer
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
export function getViewElementOffset(view: GraphBufferView): number {
  return (view.byteOffset % STORAGE_BINDING_ALIGNMENT) / UINT32_BYTE_LENGTH;
}

/** @internal */
export function createTransientView<T extends GPUVectorFormat, Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  format: T,
  length: number
): GraphBufferView<T> {
  const formatInfo = getGPUVectorFormatInfo(format);
  const buffer = graph.createTransientBuffer({
    id,
    byteLength: Math.max(length, 1) * formatInfo.byteLength,
    usage: Buffer.STORAGE
  });
  return graph.createBufferView(buffer, {format, length});
}
