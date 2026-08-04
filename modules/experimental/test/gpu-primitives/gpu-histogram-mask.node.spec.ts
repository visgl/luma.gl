// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  GPUHistogram,
  GraphBufferHandle,
  GraphDataView,
  GraphVectorView,
  type GPUHistogramMask
} from '@luma.gl/experimental';

type ScalarFormat = 'float32' | 'uint32';

test('GPUHistogram accepts aligned masks and preserves public selection metadata', testCase => {
  const input = createView('input', 'float32', 4);
  const output = createView('output', 'uint32', 4);
  const mask: GPUHistogramMask = createView('mask', 'uint32', 4, {
    byteOffset: Uint32Array.BYTES_PER_ELEMENT
  });
  const histogram = new GPUHistogram({input, output, mask, domain: [0, 3]});

  testCase.equal(histogram.mask, mask, 'retains the caller-owned public selection mask');
  testCase.equal(mask.byteOffset, 4, 'accepts packed uint32-aligned nonzero view offsets');
  testCase.end();
});

test('GPUHistogram rejects invalid atomic mask formats, layouts, lengths, and aliases', testCase => {
  const input = createView('input', 'float32', 4);
  const output = createView('output', 'uint32', 4);
  const shortMask = createView('short-mask', 'uint32', 3);
  const floatMask = createView('float-mask', 'float32', 4);
  const stridedMask = createView('strided-mask', 'uint32', 4, {byteStride: 8});
  const unalignedMask = createView('unaligned-mask', 'uint32', 4, {byteOffset: 2});

  testCase.throws(
    () => new GPUHistogram({input, output, mask: shortMask, domain: [0, 3]}),
    /input and mask lengths must match/,
    'atomic masks require one source-aligned row per input value'
  );
  testCase.throws(
    () => new GPUHistogram({input, output, mask: floatMask as never, domain: [0, 3]}),
    /packed, uint32-aligned uint32/,
    'floating-point masks cannot be reinterpreted as selection flags'
  );
  testCase.throws(
    () => new GPUHistogram({input, output, mask: stridedMask, domain: [0, 3]}),
    /packed, uint32-aligned uint32/,
    'strided selections cannot be consumed by packed mask shaders'
  );
  testCase.throws(
    () => new GPUHistogram({input, output, mask: unalignedMask, domain: [0, 3]}),
    /packed, uint32-aligned uint32/,
    'selection views must start at uint32-aligned byte offsets'
  );
  testCase.throws(
    () => new GPUHistogram({input, output, mask: output, domain: [0, 3]}),
    /mask and output must use separate buffers/,
    'selection flags cannot alias the cleared and accumulated output'
  );
  testCase.end();
});

test('GPUHistogram requires identical mask view kind and ordered vector topology', testCase => {
  const input = createVector('input', 'float32', [2, 0, 3]);
  const matchingMask = createVector('matching-mask', 'uint32', [2, 0, 3]);
  const mismatchedMask = createVector('mismatched-mask', 'uint32', [1, 0, 4]);
  const differentChunkCountMask = createVector('different-chunk-count-mask', 'uint32', [2, 3]);
  const atomicMask = createView('atomic-mask', 'uint32', 5);
  const output = createView('output', 'uint32', 4);

  const histogram = new GPUHistogram({input, output, mask: matchingMask, domain: [0, 4]});
  testCase.equal(histogram.mask, matchingMask, 'accepts empty chunks at matching source indices');
  testCase.throws(
    () => new GPUHistogram({input, output, mask: atomicMask, domain: [0, 4]}),
    /same view kind/,
    'vector inputs cannot silently concatenate an atomic selection'
  );
  testCase.throws(
    () => new GPUHistogram({input, output, mask: mismatchedMask, domain: [0, 4]}),
    /same chunk topology/,
    'equal total row counts do not permit different ordered chunk sizes'
  );
  testCase.throws(
    () => new GPUHistogram({input, output, mask: differentChunkCountMask, domain: [0, 4]}),
    /same chunk topology/,
    'vector masks must preserve the complete source chunk count'
  );
  testCase.end();
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
    {id: 'histogram-mask-validation'},
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
