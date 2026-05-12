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

  t.notOk('vector' in gpuVector, 'does not retain the source Arrow vector');
  t.equal(gpuVector.type, vector.type, 'exposes the Arrow vector type');
  t.equal(gpuVector.length, 2, 'exposes the Arrow vector length');
  t.equal(gpuVector.stride, 2, 'exposes the FixedSizeList stride');
  t.equal(gpuVector.buffer.byteLength, 16, 'creates a buffer from the vector values');

  gpuVector.destroy();
  t.end();
});

test('ArrowGPUVector supports discriminated Arrow-vector construction', t => {
  const device = new NullDevice({});
  const vector = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([1, 2, 3, 4])
  );
  const gpuVector = new ArrowGPUVector({
    type: 'arrow',
    name: 'positions',
    device,
    vector
  });

  t.equal(gpuVector.name, 'positions', 'exposes vector name');
  t.equal(gpuVector.type, vector.type, 'exposes the Arrow vector type');
  t.equal(gpuVector.length, 2, 'exposes vector length');
  t.equal(gpuVector.stride, 2, 'exposes scalar stride');
  t.equal(gpuVector.byteOffset, 0, 'defaults byteOffset');
  t.equal(gpuVector.byteStride, 8, 'deduces byteStride');
  t.equal(gpuVector.ownsBuffer, true, 'uploaded vectors own their buffers');

  gpuVector.destroy();
  t.end();
});

test('ArrowGPUVector wraps existing typed buffers', t => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({byteLength: 16});
  const gpuVector = new ArrowGPUVector({
    type: 'buffer',
    name: 'weights',
    buffer,
    arrowType: new arrow.Float32(),
    length: 4,
    ownsBuffer: false
  });
  let destroyed = false;
  const destroy = buffer.destroy.bind(buffer);
  buffer.destroy = () => {
    destroyed = true;
    destroy();
  };

  t.equal(gpuVector.name, 'weights', 'exposes vector name');
  t.equal(gpuVector.type.typeId, new arrow.Float32().typeId, 'exposes supplied Arrow type');
  t.equal(gpuVector.length, 4, 'exposes supplied length');
  t.equal(gpuVector.stride, 1, 'deduces scalar stride');
  t.equal(gpuVector.byteStride, 4, 'deduces byte stride');

  gpuVector.destroy();
  t.equal(destroyed, false, 'does not destroy non-owned buffers');
  buffer.destroy();
  t.end();
});

test('ArrowGPUVector wraps interleaved buffers', t => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({byteLength: 32});
  const gpuVector = new ArrowGPUVector({
    type: 'interleaved',
    name: 'instances',
    buffer,
    length: 2,
    byteStride: 16,
    attributes: [
      {attribute: 'positions', format: 'float32x3', byteOffset: 0},
      {attribute: 'colors', format: 'uint8x4', byteOffset: 12}
    ],
    ownsBuffer: true
  });

  t.equal(gpuVector.name, 'instances', 'exposes vector name');
  t.ok(arrow.DataType.isBinary(gpuVector.type), 'uses Arrow Binary for interleaved storage');
  t.equal(gpuVector.length, 2, 'exposes row count');
  t.equal(gpuVector.stride, 16, 'uses byte stride as opaque row stride');
  t.deepEqual(
    gpuVector.bufferLayout,
    {
      name: 'instances',
      byteStride: 16,
      attributes: [
        {attribute: 'positions', format: 'float32x3', byteOffset: 0},
        {attribute: 'colors', format: 'uint8x4', byteOffset: 12}
      ]
    },
    'exposes interleaved buffer layout'
  );

  gpuVector.destroy();
  t.end();
});

test('ArrowGPUVector transfers buffer ownership between same-buffer views', t => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({byteLength: 16});
  const source = new ArrowGPUVector({
    type: 'buffer',
    name: 'source',
    buffer,
    arrowType: new arrow.Float32(),
    length: 4,
    ownsBuffer: true
  });
  const target = new ArrowGPUVector({
    type: 'buffer',
    name: 'target',
    buffer,
    arrowType: new arrow.Float32(),
    length: 4,
    ownsBuffer: false
  });

  source.transferBufferOwnership(target);

  t.equal(source.ownsBuffer, false, 'source no longer owns the buffer');
  t.equal(target.ownsBuffer, true, 'target now owns the buffer');

  source.destroy();
  target.destroy();
  t.end();
});

test('ArrowGPUVector exposes primitive vector length and stride', t => {
  const device = new NullDevice({});
  const vector = arrow.makeVector(new Float32Array([1, 2, 3]));
  const gpuVector = new ArrowGPUVector(device, vector);

  t.equal(gpuVector.length, 3, 'exposes the primitive vector length');
  t.equal(gpuVector.stride, 1, 'exposes primitive vector stride as 1');

  gpuVector.destroy();
  t.end();
});
