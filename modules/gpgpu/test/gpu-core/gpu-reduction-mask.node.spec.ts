import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPUReduction,
  GraphBufferHandle,
  GraphDataView,
  GraphVectorView,
  type GPUReductionMask
} from '@luma.gl/gpgpu/gpu-core';

type ScalarFormat = 'float32' | 'sint32' | 'uint32';

it('GPUReduction accepts packed, source-aligned optional selection masks', () => {
  const input = createView('input', 'float32', 4);
  const output = createView('output', 'float32', 2);
  const mask: GPUReductionMask = createView('mask', 'uint32', 4, {byteOffset: 4});
  const reduction = new GPUReduction({input, output, mask, operation: 'extent'});

  expect(reduction.mask, 'retains the caller-owned public selection mask').toBe(mask);
  expect(mask.byteOffset, 'accepts packed uint32-aligned nonzero view offsets').toBe(4);
});

it('GPUReduction rejects invalid selection mask formats, layouts, lengths, and aliases', () => {
  const input = createView('input', 'uint32', 4);
  const output = createView('output', 'uint32', 1);
  const shortMask = createView('short-mask', 'uint32', 3);
  const floatMask = createView('float-mask', 'float32', 4);
  const stridedMask = createView('strided-mask', 'uint32', 4, {byteStride: 8});
  const unalignedMask = createView('unaligned-mask', 'uint32', 4, {byteOffset: 2});

  expect(
    () => new GPUReduction({input, output, mask: shortMask, operation: 'sum'}),
    'scalar masks require one selection row per input value'
  ).toThrow(/input and mask lengths must match/);
  expect(
    () => new GPUReduction({input, output, mask: floatMask as never, operation: 'sum'}),
    'floating-point views cannot be consumed as selection flags'
  ).toThrow(/packed, uint32-aligned uint32/);
  expect(
    () => new GPUReduction({input, output, mask: stridedMask, operation: 'sum'}),
    'interleaved selections cannot be consumed by packed shaders'
  ).toThrow(/packed, uint32-aligned uint32/);
  expect(
    () => new GPUReduction({input, output, mask: unalignedMask, operation: 'sum'}),
    'selection views must begin at a uint32-aligned byte offset'
  ).toThrow(/packed, uint32-aligned uint32/);
  expect(
    () => new GPUReduction({input, output, mask: output, operation: 'sum'}),
    'selection flags cannot alias the caller-owned output'
  ).toThrow(/mask and output must use separate buffers/);
});

it('GPUReduction requires selection masks to preserve ordered vector topology', () => {
  const input = createVector('input', 'sint32', [2, 0, 3]);
  const matchingMask = createVector('matching-mask', 'uint32', [2, 0, 3]);
  const mismatchedMask = createVector('mismatched-mask', 'uint32', [1, 0, 4]);
  const differentChunkCountMask = createVector('different-chunk-count-mask', 'uint32', [2, 3]);
  const atomicMask = createView('atomic-mask', 'uint32', 5);
  const output = createView('output', 'sint32', 1);

  const reduction = new GPUReduction({input, output, mask: matchingMask, operation: 'min'});
  expect(reduction.mask, 'preserves empty chunks at their source positions').toBe(matchingMask);
  expect(
    () => new GPUReduction({input, output, mask: atomicMask, operation: 'min'}),
    'vector inputs cannot silently concatenate an atomic selection'
  ).toThrow(/same view kind/);
  expect(
    () => new GPUReduction({input, output, mask: mismatchedMask, operation: 'min'}),
    'equal total row counts cannot replace matching ordered chunk sizes'
  ).toThrow(/same chunk topology/);
  expect(
    () => new GPUReduction({input, output, mask: differentChunkCountMask, operation: 'min'}),
    'vector selections must preserve the complete source chunk count'
  ).toThrow(/same chunk topology/);
});

function createView<T extends ScalarFormat>(
  id: string,
  format: T,
  length: number,
  props: {byteOffset?: number; byteStride?: number} = {}
): GraphDataView<T> {
  const byteOffset = props.byteOffset ?? 0;
  const byteStride = props.byteStride ?? Uint32Array.BYTES_PER_ELEMENT;
  const buffer = new GraphBufferHandle(
    {id: 'reduction-mask-validation'},
    {
      id,
      byteLength: Math.max(byteOffset + Math.max(length, 1) * byteStride, 4),
      usage: 0
    },
    false
  );
  return new GraphDataView(buffer, {
    format,
    length,
    byteOffset,
    byteStride,
    rowByteLength: Uint32Array.BYTES_PER_ELEMENT
  });
}

function createVector<T extends ScalarFormat>(
  id: string,
  format: T,
  chunkLengths: readonly number[]
): GraphVectorView<T> {
  const data = chunkLengths.map((length, index) => createView(`${id}-${index}`, format, length));
  const length = chunkLengths.reduce((total, chunkLength) => total + chunkLength, 0);
  return new GraphVectorView({
    id,
    name: id,
    format,
    length,
    valueLength: length,
    stride: 1,
    byteStride: Uint32Array.BYTES_PER_ELEMENT,
    rowByteLength: Uint32Array.BYTES_PER_ELEMENT,
    data
  });
}
