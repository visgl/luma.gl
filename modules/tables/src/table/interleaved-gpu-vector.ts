// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Buffer} from '@luma.gl/core';
import type {DynamicBuffer} from '@luma.gl/engine';
import {GPUVector} from './gpu-vector';
import {
  getInterleavedGPUVectorLayout,
  type Interleaved,
  type InterleavedFields,
  type InterleavedGPUVectorLayoutProps
} from './gpu-vector-format';

/** Constructor props for wrapping an existing buffer as an interleaved GPUVector. */
export type MakeInterleavedGPUVectorProps<Fields extends InterleavedFields = InterleavedFields> =
  InterleavedGPUVectorLayoutProps<Fields> & {
    /** Existing interleaved GPU buffer. */
    buffer: Buffer | DynamicBuffer;
    /** Number of logical rows in the buffer. */
    length: number;
    /** Byte offset of the first logical row. */
    byteOffset?: number;
    /** Whether the returned vector owns the buffer. */
    ownsBuffer?: boolean;
  };

/** Wraps an existing buffer as an interleaved GPUVector. */
export function makeInterleavedGPUVector<Fields extends InterleavedFields = InterleavedFields>(
  options: MakeInterleavedGPUVectorProps<Fields>
): GPUVector<Interleaved<Fields>> {
  const layout = getInterleavedGPUVectorLayout(options);
  return new GPUVector<Interleaved<Fields>>({
    type: 'interleaved',
    name: options.name,
    buffer: options.buffer,
    length: options.length,
    byteOffset: options.byteOffset,
    byteStride: layout.byteStride,
    attributes: layout.attributes,
    interleavedFields: options.fields,
    ownsBuffer: options.ownsBuffer
  });
}
