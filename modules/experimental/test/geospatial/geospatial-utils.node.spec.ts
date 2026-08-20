// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {describe, expect, it} from 'vitest';
import {
  GraphBufferHandle,
  GraphDataView,
  GraphVectorView,
  type GraphImportedBuffer
} from '@luma.gl/gpgpu/gpu-core';
import {validateDisjointGeospatialViews} from '../../src/geospatial/geospatial-utils';

const BUFFER_BYTE_LENGTH = 1024;

describe('validateDisjointGeospatialViews', () => {
  it('rejects logical and aligned binding-range overlap', () => {
    const handle = makeHandle('shared');
    const output = makeView(handle, 0);
    const logicalAlias = makeView(handle, 0);
    const alignedBindingAlias = makeView(handle, Uint32Array.BYTES_PER_ELEMENT);

    expect(() =>
      validateDisjointGeospatialViews(
        'logical-alias',
        [['positions', logicalAlias]],
        [['ids', output]]
      )
    ).toThrow('logical-alias output ids and positions must not overlap');
    expect(() =>
      validateDisjointGeospatialViews(
        'binding-alias',
        [['positions', alignedBindingAlias]],
        [['ids', output]]
      )
    ).toThrow('binding-alias output ids and positions must not overlap');
  });

  it('preserves disjoint aligned ranges and permits read-only aliases', () => {
    const handle = makeHandle('aligned');
    const first = makeView(handle, 0);
    const second = makeView(handle, 256);

    expect(() =>
      validateDisjointGeospatialViews(
        'aligned-ranges',
        [
          ['firstInput', first],
          ['aliasedInput', first]
        ],
        [['result', second]]
      )
    ).not.toThrow();
  });

  it('treats zero-length views as one-row storage bindings', () => {
    const handle = makeHandle('empty');
    const emptyOutput = makeView(handle, 0, 0);
    const input = makeView(handle, Uint32Array.BYTES_PER_ELEMENT);

    expect(() =>
      validateDisjointGeospatialViews(
        'empty-binding',
        [['positions', input]],
        [['ids', emptyOutput]]
      )
    ).toThrow('empty-binding output ids and positions must not overlap');
  });

  it('rejects distinct graph handles with the same core default buffer', () => {
    const coreBuffer = makeCoreBuffer();
    const input = makeView(makeHandle('input', coreBuffer), 256);
    const output = makeView(makeHandle('output', coreBuffer), 0);

    expect(() =>
      validateDisjointGeospatialViews('physical-alias', [['positions', input]], [['ids', output]])
    ).toThrow('physical-alias output ids and positions must not overlap');
  });

  it('unwraps DynamicBuffer defaults before comparing physical identity', () => {
    const coreBuffer = makeCoreBuffer();
    const dynamicBuffer = makeDynamicBuffer(coreBuffer);
    const input = makeView(makeHandle('dynamic-input', dynamicBuffer), 0);
    const output = makeView(makeHandle('core-output', coreBuffer), 256);

    expect(() =>
      validateDisjointGeospatialViews('dynamic-alias', [['positions', input]], [['ids', output]])
    ).toThrow('dynamic-alias output ids and positions must not overlap');
  });

  it('checks vector chunks and every output pair without conflating separate handles', () => {
    const inputHandle = makeHandle('input', makeCoreBuffer());
    const outputHandle = makeHandle('output', makeCoreBuffer());
    const inputVector = makeVector([makeView(inputHandle, 0), makeView(inputHandle, 256)]);
    const aliasingInputVector = makeVector([
      makeView(inputHandle, 0),
      makeView(outputHandle, Uint32Array.BYTES_PER_ELEMENT)
    ]);
    const firstOutput = makeView(outputHandle, 0);
    const secondOutput = makeView(outputHandle, Uint32Array.BYTES_PER_ELEMENT);

    expect(() =>
      validateDisjointGeospatialViews(
        'vector-alias',
        [['positions', aliasingInputVector]],
        [['ids', firstOutput]]
      )
    ).toThrow('vector-alias output ids and positions must not overlap');

    expect(() =>
      validateDisjointGeospatialViews(
        'output-alias',
        [['positions', inputVector]],
        [
          ['ids', firstOutput],
          ['count', secondOutput]
        ]
      )
    ).toThrow('output-alias output count and output ids must not overlap');

    expect(() =>
      validateDisjointGeospatialViews(
        'separate-defaults',
        [['positions', inputVector]],
        [['ids', firstOutput]]
      )
    ).not.toThrow();
  });
});

function makeHandle(id: string, defaultBuffer?: GraphImportedBuffer): GraphBufferHandle {
  return new GraphBufferHandle(
    {id: 'geospatial-utils-test'},
    {id, byteLength: BUFFER_BYTE_LENGTH, usage: 0},
    false,
    defaultBuffer
  );
}

function makeView(
  buffer: GraphBufferHandle,
  byteOffset: number,
  length: number = 1
): GraphDataView<'uint32'> {
  return new GraphDataView(buffer, {
    format: 'uint32',
    length,
    byteOffset,
    byteStride: Uint32Array.BYTES_PER_ELEMENT,
    rowByteLength: Uint32Array.BYTES_PER_ELEMENT
  });
}

function makeVector(data: readonly GraphDataView<'uint32'>[]): GraphVectorView<'uint32'> {
  return new GraphVectorView({
    id: 'test-vector',
    name: 'test-vector',
    format: 'uint32',
    length: data.reduce((length, view) => length + view.length, 0),
    valueLength: data.reduce((length, view) => length + view.length, 0),
    stride: 1,
    byteStride: Uint32Array.BYTES_PER_ELEMENT,
    rowByteLength: Uint32Array.BYTES_PER_ELEMENT,
    data
  });
}

function makeCoreBuffer(): Buffer {
  return {} as Buffer;
}

function makeDynamicBuffer(buffer: Buffer): DynamicBuffer {
  const dynamicBuffer = Object.create(DynamicBuffer.prototype) as DynamicBuffer;
  Object.defineProperty(dynamicBuffer, '_buffer', {value: buffer});
  return dynamicBuffer;
}
