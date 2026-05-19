// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  appendArrowDataToGPUVector,
  expandArrowVector,
  getArrowFixedSizeListValues,
  getArrowMatrixVectorInfo,
  getArrowVectorBufferSource,
  isArrowFixedSizeListVector,
  makeAppendableArrowGPUVector,
  makeArrowVectorFromArray,
  makeArrowMatrix3x3Vector,
  makeArrowMatrixVector,
  makeArrowFixedSizeListVector,
  makeArrowGPUVector,
  readArrowGPUDataAsync,
  readArrowGPUVectorAsync
} from '@luma.gl/arrow';
import {DynamicBuffer} from '@luma.gl/engine';
import {GPUData, GPUVector} from '@luma.gl/tables';
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

test('makeArrowVectorFromArray creates flat FixedSizeList rows from JS numeric arrays', t => {
  const vector = makeArrowVectorFromArray([1, 2, 3, 4], new arrow.Float32(), 2);

  t.ok(arrow.DataType.isFixedSizeList(vector.type), 'creates a FixedSizeList vector');
  t.equal(vector.type.listSize, 2, 'retains the requested row width');
  t.deepEqual(
    getArrowFixedSizeListValues(vector),
    new Float32Array([1, 2, 3, 4]),
    'materializes typed child values'
  );

  t.end();
});

test('makeArrowVectorFromArray mirrors scalar Apache Arrow array construction', t => {
  const vector = makeArrowVectorFromArray(['hello', 'luma.gl'], new arrow.Utf8());

  t.equal(vector.length, 2, 'creates one Arrow row per string');
  t.equal(vector.get(0), 'hello', 'retains scalar row values');

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

test('makeArrowMatrix3x3Vector emits WGSL-storage column-major rows', t => {
  const vector = makeArrowMatrix3x3Vector(new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]), {
    order: 'row-major'
  });

  t.equal(vector.type.listSize, 12, 'pads each vec3 matrix column to four floats');
  t.equal(vector.length, 1, 'creates one matrix row');
  t.deepEqual(
    getArrowFixedSizeListValues(vector),
    new Float32Array([1, 4, 7, 0, 2, 5, 8, 0, 3, 6, 9, 0]),
    'normalizes row-major logical values into WGSL-storage column-major layout'
  );

  t.end();
});

test('makeArrowMatrixVector describes every supported WGSL floating-point matrix shape', t => {
  const matrixCases = [
    {shape: 'mat2x2', columns: 2, rows: 2, physicalComponentCount: 4},
    {shape: 'mat2x3', columns: 2, rows: 3, physicalComponentCount: 8},
    {shape: 'mat3x2', columns: 3, rows: 2, physicalComponentCount: 6},
    {shape: 'mat3x3', columns: 3, rows: 3, physicalComponentCount: 12},
    {shape: 'mat4x3', columns: 4, rows: 3, physicalComponentCount: 16},
    {shape: 'mat3x4', columns: 3, rows: 4, physicalComponentCount: 12},
    {shape: 'mat4x4', columns: 4, rows: 4, physicalComponentCount: 16}
  ] as const;

  for (const matrixCase of matrixCases) {
    const logicalComponentCount = matrixCase.columns * matrixCase.rows;
    const vector = makeArrowMatrixVector(
      matrixCase.shape,
      Float32Array.from({length: logicalComponentCount}, (_, index) => index + 1)
    );
    const matrixInfo = getArrowMatrixVectorInfo(vector);

    t.deepEqual(
      matrixInfo,
      {
        shape: matrixCase.shape,
        columns: matrixCase.columns,
        rows: matrixCase.rows,
        layout: 'wgsl-storage',
        logicalComponentCount,
        physicalComponentCount: matrixCase.physicalComponentCount,
        columnStride: matrixCase.rows === 3 ? 4 : matrixCase.rows,
        byteStride: matrixCase.physicalComponentCount * Float32Array.BYTES_PER_ELEMENT
      },
      `${matrixCase.shape} retains explicit shape and physical layout metadata`
    );
    t.equal(
      vector.type.listSize,
      matrixCase.physicalComponentCount,
      `${matrixCase.shape} materializes the expected FixedSizeList width`
    );
  }

  t.end();
});

test('makeArrowMatrixVector validates logical matrix lengths', t => {
  t.throws(
    () => makeArrowMatrixVector('mat4x4', new Float32Array(15)),
    /must be divisible by 16/,
    'rejects incomplete matrix rows'
  );

  t.end();
});

test('expandArrowVector gathers FixedSizeList rows from typed row mappings', t => {
  const sourceVector = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    4,
    new Float32Array([1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1])
  );

  const expandedVector = expandArrowVector(sourceVector, new Uint32Array([2, 0, 2, 1]));

  t.ok(
    arrow.util.compareTypes(expandedVector.type, sourceVector.type),
    'preserves FixedSizeList type'
  );
  t.equal(expandedVector.length, 4, 'creates one row per mapping entry');
  t.deepEqual(
    getArrowFixedSizeListValues(expandedVector),
    new Float32Array([0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1]),
    'repeats source rows in mapping order'
  );

  t.end();
});

test('expandArrowVector accepts Arrow integer row mappings', t => {
  const sourceVector = makeArrowFixedSizeListVector(
    new arrow.Uint8(),
    2,
    new Uint8Array([10, 11, 20, 21, 30, 31])
  );
  const expandedVector = expandArrowVector(
    sourceVector,
    arrow.makeVector(new Int32Array([1, 2, 0]))
  );

  t.deepEqual(
    getArrowFixedSizeListValues(expandedVector),
    new Uint8Array([20, 21, 30, 31, 10, 11]),
    'expands rows from Arrow mapping vectors'
  );

  t.end();
});

test('expandArrowVector gathers scalar numeric vectors', t => {
  const sourceVector = arrow.makeVector(new Int32Array([10, 20, 30]));
  const expandedVector = expandArrowVector(sourceVector, new Uint16Array([2, 2, 0]));

  t.ok(
    arrow.util.compareTypes(expandedVector.type, sourceVector.type),
    'preserves scalar numeric type'
  );
  t.deepEqual(Array.from(expandedVector.toArray()), [30, 30, 10], 'gathers scalar rows');

  t.end();
});

test('expandArrowVector rejects invalid mappings and unsupported vectors', t => {
  const sourceVector = arrow.makeVector(new Float32Array([10, 20]));

  t.throws(
    () => expandArrowVector(sourceVector, new Int32Array([-1])),
    /cannot contain negative indices/,
    'rejects negative row indices'
  );
  t.throws(
    () => expandArrowVector(sourceVector, new Uint32Array([2])),
    /outside vector length 2/,
    'rejects out-of-range row indices'
  );
  t.throws(
    () =>
      expandArrowVector(
        sourceVector,
        arrow.makeVector(new Float32Array([0])) as unknown as arrow.Vector<arrow.Int>
      ),
    /row mapping must use 8, 16, or 32-bit integers/,
    'rejects non-integer Arrow row mappings'
  );
  t.throws(
    () =>
      expandArrowVector(
        arrow.vectorFromArray(['alpha'], new arrow.Utf8()) as never,
        new Uint32Array([0])
      ),
    /does not support Arrow type/,
    'rejects unsupported source vector types'
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
  const gpuVector = makeArrowGPUVector(device, vector);

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
  const gpuVector = makeArrowGPUVector(device, sourceVector);

  const result = await readArrowGPUVectorAsync(gpuVector);

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
  const gpuVector = makeArrowGPUVector(device, sourceVector);

  const vectorResult = await readArrowGPUVectorAsync(gpuVector);
  const firstChunkResult = await readArrowGPUDataAsync(gpuVector.data[0]);

  t.equal(gpuVector.buffer.byteLength, 12, 'uploads every vector chunk into one GPU buffer');
  t.equal(gpuVector.data.length, 2, 'exposes one GPUData view per source chunk');
  t.ok(gpuVector.data[0] instanceof GPUData, 'uses GPUData chunk views');
  t.notOk(
    gpuVector.data[0].readbackMetadata,
    'fixed-width chunks do not retain extra readback metadata'
  );
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

test('GPUVector preserves UTF-8 chunk boundaries and readAsync rows', async t => {
  const device = new NullDevice({});
  const firstChunk = arrow.vectorFromArray(['alpha', null], new arrow.Utf8());
  const secondChunk = arrow.vectorFromArray(['beta'], new arrow.Utf8());
  const sourceVector = new arrow.Vector([...firstChunk.data, ...secondChunk.data]);
  const gpuVector = makeArrowGPUVector(device, sourceVector);

  const vectorResult = await readArrowGPUVectorAsync(gpuVector);
  const firstChunkResult = await readArrowGPUDataAsync(gpuVector.data[0]);

  t.equal(gpuVector.data.length, 2, 'keeps one GPUData object per UTF-8 source chunk');
  t.equal(
    gpuVector.data[0].readbackMetadata?.kind,
    'utf8',
    'retains compact UTF-8 readback metadata'
  );
  t.deepEqual(
    Array.from(vectorResult.toArray()),
    ['alpha', null, 'beta'],
    'reads UTF-8 rows back across chunk boundaries'
  );
  t.deepEqual(
    Array.from(arrow.makeVector(firstChunkResult).toArray()),
    ['alpha', null],
    'reads an individual UTF-8 GPUData chunk'
  );

  gpuVector.destroy();
  t.end();
});

test('GPUVector UTF-8 readAsync normalizes sliced offsets without retaining source data', async t => {
  const device = new NullDevice({});
  const sourceVector = arrow.vectorFromArray(['skip', null, 'kept'], new arrow.Utf8());
  const slicedVector = sourceVector.slice(1) as arrow.Vector<arrow.Utf8>;
  const gpuVector = makeArrowGPUVector(device, slicedVector);

  const result = await readArrowGPUVectorAsync(gpuVector);

  t.deepEqual(Array.from(result.toArray()), [null, 'kept'], 'reads sliced UTF-8 rows');
  t.deepEqual(
    Array.from(result.data[0].valueOffsets as Int32Array),
    [0, 0, 4],
    'reconstructs local compact UTF-8 offsets'
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
  const gpuVector = makeArrowGPUVector(device, sourceVector);

  const result = await readArrowGPUVectorAsync(gpuVector);

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

test('GPUVector infers Arrow-vector object construction from vector props', t => {
  const device = new NullDevice({});
  const vector = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([1, 2, 3, 4])
  );
  const gpuVector = makeArrowGPUVector(device, vector, {name: 'positions'});

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
    dataType: new arrow.Float32(),
    length: 4,
    byteStride: 4,
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
    dataType: new arrow.Float32(),
    length: 2,
    byteOffset: 4,
    byteStride: 8,
    ownsBuffer: false
  });

  const result = await readArrowGPUVectorAsync(gpuVector);

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
    dataType: new arrow.Binary(),
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
    dataType: new arrow.Binary(),
    length: 2,
    byteStride: 16,
    attributes: [
      {attribute: 'positions', format: 'float32x3', byteOffset: 0},
      {attribute: 'colors', format: 'uint8x4', byteOffset: 12}
    ],
    ownsBuffer: true
  });

  try {
    await readArrowGPUVectorAsync(gpuVector);
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
    dataType: new arrow.Float32(),
    length: 4,
    byteStride: 4,
    ownsBuffer: true
  });
  const target = new GPUVector({
    type: 'buffer',
    name: 'target',
    buffer,
    dataType: new arrow.Float32(),
    length: 4,
    byteStride: 4,
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
    dataType: new arrow.Float32(),
    length: 2,
    byteStride: 4
  });
  const secondData = new GPUData({
    buffer: new DynamicBuffer(device, {buffer: secondBuffer, ownsBuffer: false}),
    dataType: new arrow.Float32(),
    length: 2,
    byteStride: 4
  });
  const gpuVector = new GPUVector({
    type: 'data',
    name: 'values',
    dataType: new arrow.Float32(),
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

test('appendArrowDataToGPUVector appends Arrow data into appendable vector storage', t => {
  const device = new NullDevice({});
  const firstData = arrow.makeVector(new Float32Array([1, 2])).data[0];
  const secondData = arrow.makeVector(new Float32Array([3, 4])).data[0];
  const gpuVector = makeAppendableArrowGPUVector(device, new arrow.Float32(), {
    name: 'values',
    initialCapacityRows: 1
  });

  appendArrowDataToGPUVector(gpuVector, firstData);
  appendArrowDataToGPUVector(gpuVector, secondData);

  t.ok(gpuVector.buffer instanceof DynamicBuffer, 'uses stable DynamicBuffer storage');
  t.equal(gpuVector.length, 4, 'tracks rows appended into the final mutable batch');
  t.equal(gpuVector.data.length, 2, 'exposes one GPU data range per appended Arrow chunk');
  t.equal(gpuVector.data[1].byteOffset, 8, 'tracks the later append byte offset');
  t.notOk(
    gpuVector.data[0].readbackMetadata,
    'fixed-width append chunks do not retain reconstruction metadata'
  );
  t.ok((gpuVector.capacityRows ?? 0) >= 4, 'grows appendable capacity as needed');

  gpuVector.resetLastBatch();
  t.equal(gpuVector.length, 0, 'clears logical rows without dropping the allocation');
  gpuVector.destroy();
  t.end();
});

test('appendArrowDataToGPUVector appends UTF-8 Arrow data into appendable vector storage', t => {
  const device = new NullDevice({});
  const firstData = arrow.vectorFromArray(['alpha'], new arrow.Utf8()).data[0];
  const secondData = arrow.vectorFromArray(['beta', 'g'], new arrow.Utf8()).data[0];
  const gpuVector = makeAppendableArrowGPUVector(device, new arrow.Utf8(), {
    name: 'texts',
    initialCapacityRows: 1
  });

  appendArrowDataToGPUVector(gpuVector, firstData);
  appendArrowDataToGPUVector(gpuVector, secondData);

  t.equal(gpuVector.length, 3, 'tracks UTF-8 logical rows across appends');
  t.equal(gpuVector.data.length, 2, 'preserves UTF-8 append chunk boundaries');
  t.equal(
    gpuVector.data[0].readbackMetadata?.kind,
    'utf8',
    'retains copied UTF-8 offsets for the first append chunk'
  );
  t.equal(
    gpuVector.data[1].readbackMetadata?.kind,
    'utf8',
    'retains copied UTF-8 offsets for the later append chunk'
  );
  t.ok(gpuVector.data[1].byteOffset > 0, 'writes later UTF-8 bytes after earlier bytes');
  t.equal(
    gpuVector.data[1].byteOffset % 4,
    0,
    'aligns later UTF-8 chunk offsets for WebGPU buffer writes'
  );

  gpuVector.destroy();
  t.end();
});

test('GPUVector exposes primitive vector length and stride', t => {
  const device = new NullDevice({});
  const vector = arrow.makeVector(new Float32Array([1, 2, 3]));
  const gpuVector = makeArrowGPUVector(device, vector);

  t.equal(gpuVector.length, 3, 'exposes the primitive vector length');
  t.equal(gpuVector.stride, 1, 'exposes primitive vector stride as 1');

  gpuVector.destroy();
  t.end();
});
