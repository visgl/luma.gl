// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  ArrowGPUVector,
  getArrowFixedSizeListValues,
  getArrowVectorBufferSource,
  isArrowFixedSizeListVector,
  makeArrowFixedSizeListVector
} from '@luma.gl/arrow';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

test('makeArrowFixedSizeListVector creates FixedSizeList vectors from typed arrays', t => {
  const vector = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([1, 2, 3, 4])
  );

  t.ok(arrow.DataType.isFixedSizeList(vector.type), 'creates a FixedSizeList vector');
  t.equal(vector.type.listSize, 2, 'sets the list size');
  t.equal(vector.length, 2, 'sets the row count');
  t.deepEqual(
    getArrowFixedSizeListValues(vector),
    new Float32Array([1, 2, 3, 4]),
    'exposes the child values'
  );
  t.deepEqual(
    getArrowVectorBufferSource(vector),
    new Float32Array([1, 2, 3, 4]),
    'returns a buffer source for FixedSizeList vectors'
  );

  t.end();
});

test('isArrowFixedSizeListVector validates FixedSizeList vector shape', t => {
  const vector = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([1, 2, 3, 4])
  );
  const primitiveVector = arrow.makeVector(new Float32Array([1, 2, 3, 4]));

  t.ok(
    isArrowFixedSizeListVector(vector, new arrow.Float32(), 2),
    'accepts matching FixedSizeList vectors'
  );
  t.notOk(
    isArrowFixedSizeListVector(vector, new arrow.Float32(), 3),
    'rejects FixedSizeList vectors with the wrong list size'
  );
  t.notOk(
    isArrowFixedSizeListVector(vector, new arrow.Uint8(), 2),
    'rejects FixedSizeList vectors with the wrong child type'
  );
  t.notOk(
    isArrowFixedSizeListVector(primitiveVector, new arrow.Float32(), 2),
    'rejects primitive vectors'
  );

  t.end();
});

test('getArrowVectorBufferSource returns primitive vector values', t => {
  const vector = arrow.makeVector(new Uint32Array([1, 2, 3]));

  t.deepEqual(
    getArrowVectorBufferSource(vector),
    new Uint32Array([1, 2, 3]),
    'returns primitive vector values'
  );

  t.end();
});

test('makeArrowFixedSizeListVector validates typed array length', t => {
  t.throws(
    () => makeArrowFixedSizeListVector(new arrow.Uint8(), 4, new Uint8Array([1, 2, 3])),
    /must be divisible/,
    'throws if values cannot be divided into fixed-size rows'
  );

  t.end();
});

test('ArrowGPUVector creates a GPU buffer from an Arrow vector', t => {
  const device = new NullDevice({});
  const vector = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([1, 2, 3, 4])
  );
  const gpuVector = new ArrowGPUVector(device, vector);

  t.equal(gpuVector.vector, vector, 'stores the Arrow vector');
  t.equal(gpuVector.buffer.byteLength, 16, 'creates a buffer from the vector values');

  gpuVector.destroy();
  t.end();
});
