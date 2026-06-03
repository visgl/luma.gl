// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {getAttributeLayoutFromBufferSchema} from '@luma.gl/engine';

test('getAttributeLayoutFromBufferSchema resolves element offsets into one shared buffer layout', t => {
  t.deepEqual(
    getAttributeLayoutFromBufferSchema({
      name: 'instanceTransform',
      byteStride: 48,
      bytesPerElement: Float32Array.BYTES_PER_ELEMENT,
      stepMode: 'instance',
      schema: {
        instanceModelMatrixCol0: {format: 'float32x3', elementOffset: 0},
        instanceModelMatrixCol1: {format: 'float32x3', elementOffset: 3},
        instanceTranslation: {format: 'float32x3', elementOffset: 9}
      }
    }),
    {
      name: 'instanceTransform',
      byteStride: 48,
      stepMode: 'instance',
      attributes: [
        {attribute: 'instanceModelMatrixCol0', format: 'float32x3', byteOffset: 0},
        {attribute: 'instanceModelMatrixCol1', format: 'float32x3', byteOffset: 12},
        {attribute: 'instanceTranslation', format: 'float32x3', byteOffset: 36}
      ]
    },
    'splits one logical transform record into generated vertex attribute views'
  );
  t.end();
});

test('getAttributeLayoutFromBufferSchema resolves record and mixed offsets', t => {
  t.deepEqual(
    getAttributeLayoutFromBufferSchema({
      name: 'segmentRecords',
      byteStride: 16,
      bytesPerElement: Float32Array.BYTES_PER_ELEMENT,
      schema: {
        currentPositions: {format: 'float32x3', recordOffset: 0},
        nextPositions: {format: 'float32x3', recordOffset: 1},
        nextWeights: {format: 'float32', recordOffset: 1, elementOffset: 3}
      }
    }),
    {
      name: 'segmentRecords',
      byteStride: 16,
      attributes: [
        {attribute: 'currentPositions', format: 'float32x3', byteOffset: 0},
        {attribute: 'nextPositions', format: 'float32x3', byteOffset: 16},
        {attribute: 'nextWeights', format: 'float32', byteOffset: 28}
      ]
    },
    'supports neighboring record and in-record views in one declaration'
  );
  t.end();
});

test('getAttributeLayoutFromBufferSchema rejects malformed declarations', t => {
  t.throws(
    () =>
      getAttributeLayoutFromBufferSchema({
        name: 'empty',
        byteStride: 16,
        bytesPerElement: 4,
        schema: {}
      }),
    /at least one/,
    'rejects empty field maps'
  );
  t.throws(
    () =>
      getAttributeLayoutFromBufferSchema({
        name: 'negative',
        byteStride: 16,
        bytesPerElement: 4,
        schema: {
          currentValues: {format: 'float32x2', recordOffset: -1}
        }
      }),
    /non-negative integer/,
    'rejects negative offsets'
  );
  t.throws(
    () =>
      getAttributeLayoutFromBufferSchema({
        name: 'missingFormat',
        byteStride: 16,
        bytesPerElement: 4,
        schema: {
          broken: {} as never
        }
      }),
    /must declare a format/,
    'rejects fields without formats'
  );
  t.end();
});
