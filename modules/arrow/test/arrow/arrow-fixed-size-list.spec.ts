// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  GPUData,
  GPUVector,
  getArrowFixedSizeListValues,
  getArrowVectorBufferSource,
  isArrowFixedSizeListVector,
  makeArrowFixedSizeListVector
} from '@luma.gl/arrow';
import {DynamicBuffer} from '@luma.gl/engine';
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

test('GPUVector creates a GPU buffer from an Arrow vector', t => {
  const device = new NullDevice({});
  const vector = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([1, 2, 3, 4])
  );
  const gpuVector = new GPUVector(device, vector);

  t.notOk('vector' in gpuVector, 'does not retain the source Arrow vector');
  t.equal(gpuVector.type, vector.type, 'exposes the Arrow vector type');
  t.equal(gpuVector.length, 2, 'exposes the Arrow vector length');
  t.equal(gpuVector.stride, 2, 'exposes the FixedSizeList stride');
  t.equal(gpuVector.buffer.byteLength, 16, 'creates a buffer from the vector values');

  gpuVector.destroy();
  t.end();
});

test('GPUVector readAsync round-trips scalar numeric vectors', async t => {
  const device = new NullDevice({});
  const sourceVector = arrow.makeVector(new Int32Array([1, -2, 3]));
  const gpuVector = new GPUVector(device, sourceVector);

  const result = await gpuVector.readAsync();

  t.ok(arrow.util.compareTypes(result.type, sourceVector.type), 'preserves Arrow dynamic type');
  t.equal(result.length, sourceVector.length, 'preserves row count');
  t.deepEqual(Array.from(result.toArray()), [1, -2, 3], 'reads scalar values from GPU buffer');

  gpuVector.destroy();
  t.end();
});

test('GPUVector preserves Arrow Data chunk boundaries over one packed GPU buffer', async t => {
  const device = new NullDevice({});
  const type = new arrow.Float32();
  const sourceVector = new arrow.Vector([
    arrow.makeData({type, length: 2, data: new Float32Array([1, 2])}),
    arrow.makeData({type, length: 1, data: new Float32Array([3])})
  ]);
  const gpuVector = new GPUVector(device, sourceVector);

  const vectorResult = await gpuVector.readAsync();
  const firstChunkResult = await gpuVector.data[0].readAsync();

  t.equal(gpuVector.buffer.byteLength, 12, 'uploads every vector chunk into one GPU buffer');
  t.equal(gpuVector.data.length, 2, 'exposes one GPUData view per source chunk');
  t.ok(gpuVector.data[0] instanceof GPUData, 'uses GPUData chunk views');
  t.equal(gpuVector.data[1].byteOffset, 8, 'tracks packed byte offsets across chunks');
  t.deepEqual(Array.from(vectorResult.toArray()), [1, 2, 3], 'reads every packed row');
  t.deepEqual(
    Array.from(arrow.makeVector(firstChunkResult).toArray()),
    [1, 2],
    'reads one GPU data chunk through its view'
  );

  gpuVector.destroy();
  t.end();
});

test('GPUVector readAsync round-trips FixedSizeList vectors', async t => {
  const device = new NullDevice({});
  const sourceVector = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([1, 2, 3, 4])
  );
  const gpuVector = new GPUVector(device, sourceVector);

  const result = await gpuVector.readAsync();

  t.ok(arrow.util.compareTypes(result.type, sourceVector.type), 'preserves FixedSizeList type');
  t.equal(result.length, sourceVector.length, 'preserves FixedSizeList row count');
  t.deepEqual(
    getArrowFixedSizeListValues(result),
    new Float32Array([1, 2, 3, 4]),
    'reads child values from GPU buffer'
  );

  gpuVector.destroy();
  t.end();
});

test('GPUVector supports discriminated Arrow-vector construction', t => {
  const device = new NullDevice({});
  const vector = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([1, 2, 3, 4])
  );
  const gpuVector = new GPUVector({
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

test('GPUVector wraps existing typed buffers', t => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({byteLength: 16});
  const gpuVector = new GPUVector({
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
  t.equal(gpuVector.data.length, 1, 'exposes one GPU data view for the wrapped buffer');
  t.ok(gpuVector.data[0].buffer instanceof DynamicBuffer, 'data view keeps a dynamic wrapper');
  t.equal(gpuVector.data[0].buffer.buffer, buffer, 'data view resolves to the wrapped buffer');

  gpuVector.destroy();
  t.equal(destroyed, false, 'does not destroy non-owned buffers');
  buffer.destroy();
  t.end();
});

test('GPUVector readAsync respects wrapped-buffer byteOffset and padded byteStride', async t => {
  const device = new NullDevice({});
  const bytes = new Uint8Array(20);
  new Float32Array(bytes.buffer, 4, 1)[0] = 1.5;
  new Float32Array(bytes.buffer, 12, 1)[0] = 2.5;
  const buffer = device.createBuffer({data: bytes});
  const gpuVector = new GPUVector({
    type: 'buffer',
    name: 'weights',
    buffer,
    arrowType: new arrow.Float32(),
    length: 2,
    byteOffset: 4,
    byteStride: 8,
    ownsBuffer: false
  });

  const result = await gpuVector.readAsync();

  t.deepEqual(Array.from(result.toArray()), [1.5, 2.5], 'compacts padded rows');

  gpuVector.destroy();
  buffer.destroy();
  t.end();
});

test('GPUVector wraps interleaved buffers', t => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({byteLength: 32});
  const gpuVector = new GPUVector({
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
  t.equal(gpuVector.data.length, 1, 'exposes one opaque GPU data view');
  t.ok(arrow.DataType.isBinary(gpuVector.data[0].type), 'data view uses Arrow Binary');
  t.ok(gpuVector.data[0].buffer instanceof DynamicBuffer, 'data view keeps a dynamic wrapper');
  t.equal(gpuVector.data[0].buffer.buffer, buffer, 'data view resolves to the interleaved buffer');
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

test('GPUVector readAsync rejects interleaved vectors', async t => {
  const device = new NullDevice({});
  const gpuVector = new GPUVector({
    type: 'interleaved',
    name: 'instances',
    buffer: device.createBuffer({byteLength: 32}),
    length: 2,
    byteStride: 16,
    attributes: [
      {attribute: 'positions', format: 'float32x3', byteOffset: 0},
      {attribute: 'colors', format: 'uint8x4', byteOffset: 12}
    ],
    ownsBuffer: true
  });

  try {
    await gpuVector.readAsync();
    t.fail('readAsync should reject interleaved vectors');
  } catch (error) {
    t.ok(
      error instanceof Error && /does not support interleaved vectors/.test(error.message),
      'throws a clear unsupported error'
    );
  }

  gpuVector.destroy();
  t.end();
});

test('GPUVector transfers buffer ownership between same-buffer views', t => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({byteLength: 16});
  const source = new GPUVector({
    type: 'buffer',
    name: 'source',
    buffer,
    arrowType: new arrow.Float32(),
    length: 4,
    ownsBuffer: true
  });
  const target = new GPUVector({
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

test('GPUVector addData aggregates GPU chunks without adopting their buffers', t => {
  const device = new NullDevice({});
  const firstBuffer = device.createBuffer({byteLength: 8});
  const secondBuffer = device.createBuffer({byteLength: 8});
  const firstData = new GPUData({
    buffer: new DynamicBuffer(device, {buffer: firstBuffer, ownsBuffer: false}),
    arrowType: new arrow.Float32(),
    length: 2
  });
  const secondData = new GPUData({
    buffer: new DynamicBuffer(device, {buffer: secondBuffer, ownsBuffer: false}),
    arrowType: new arrow.Float32(),
    length: 2
  });
  const gpuVector = new GPUVector({
    type: 'data',
    name: 'values',
    arrowType: new arrow.Float32(),
    data: [firstData]
  });

  gpuVector.addData(secondData);

  t.equal(gpuVector.length, 4, 'updates aggregate row count');
  t.equal(gpuVector.data.length, 2, 'preserves each appended GPU data chunk');
  t.throws(
    () => gpuVector.buffer,
    /multi-buffer vectors/,
    'does not expose a misleading single direct buffer'
  );

  gpuVector.destroy();
  t.notOk(firstBuffer.destroyed, 'does not adopt ownership of the first data buffer');
  t.notOk(secondBuffer.destroyed, 'does not adopt ownership of the appended data buffer');
  firstBuffer.destroy();
  secondBuffer.destroy();
  t.end();
});

test('GPUVector addToLastData appends Arrow data into appendable vector storage', t => {
  const device = new NullDevice({});
  const firstData = arrow.makeVector(new Float32Array([1, 2])).data[0];
  const secondData = arrow.makeVector(new Float32Array([3, 4])).data[0];
  const gpuVector = new GPUVector({
    type: 'appendable',
    name: 'values',
    device,
    arrowType: new arrow.Float32(),
    initialCapacityRows: 1
  });

  gpuVector.addToLastData(firstData);
  gpuVector.addToLastData(secondData);

  t.ok(gpuVector.buffer instanceof DynamicBuffer, 'uses stable DynamicBuffer storage');
  t.equal(gpuVector.length, 4, 'tracks rows appended into the final mutable batch');
  t.equal(gpuVector.data.length, 2, 'exposes one GPU data range per appended Arrow chunk');
  t.equal(gpuVector.data[1].byteOffset, 8, 'tracks the later append byte offset');
  t.ok((gpuVector.capacityRows ?? 0) >= 4, 'grows appendable capacity as needed');

  gpuVector.resetLastBatch();
  t.equal(gpuVector.length, 0, 'clears logical rows without dropping the allocation');
  gpuVector.destroy();
  t.end();
});

test('GPUVector exposes primitive vector length and stride', t => {
  const device = new NullDevice({});
  const vector = arrow.makeVector(new Float32Array([1, 2, 3]));
  const gpuVector = new GPUVector(device, vector);

  t.equal(gpuVector.length, 3, 'exposes the primitive vector length');
  t.equal(gpuVector.stride, 1, 'exposes primitive vector stride as 1');

  gpuVector.destroy();
  t.end();
});
