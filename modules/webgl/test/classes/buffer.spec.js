import GL from '@luma.gl/constants';
import {Buffer, isWebGL} from '@luma.gl/webgl';
import test from 'tape-catch';

import {fixture} from 'test/setup';

test('Buffer#constructor/delete', t => {
  const {gl} = fixture;
  t.ok(isWebGL(gl), 'Created gl context');

  t.throws(() => new Buffer(), /.*WebGLRenderingContext.*/, 'Buffer throws on missing gl context');

  const buffer = new Buffer(gl, {target: GL.ARRAY_BUFFER});
  t.ok(buffer instanceof Buffer, 'Buffer construction successful');

  buffer.delete();
  t.ok(buffer instanceof Buffer, 'Buffer delete successful');

  buffer.delete();
  t.ok(buffer instanceof Buffer, 'Buffer repeated delete successful');

  t.end();
});

test('Buffer#bind/unbind', t => {
  const {gl} = fixture;

  const buffer = new Buffer(gl, {target: GL.ARRAY_BUFFER})
    .bind()
    .unbind()
    .delete();
  t.ok(buffer instanceof Buffer, 'Buffer bind/unbind successful');

  t.end();
});

test('Buffer#bind/unbind with index', t => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const buffer = new Buffer(gl2, {target: GL.UNIFORM_BUFFER, index: 0})
    .bind()
    .unbind()
    .delete();
  t.ok(buffer instanceof Buffer, 'Buffer bind/unbind with index successful');

  t.end();
});

test('Buffer#construction', t => {
  const {gl} = fixture;

  let buffer;

  buffer = new Buffer(gl, {target: GL.ARRAY_BUFFER, data: new Float32Array([1, 2, 3])})
    .bind()
    .unbind()
    .delete();
  t.ok(buffer instanceof Buffer, 'Buffer(ARRAY_BUFFER) successful');

  // TODO - buffer could check for integer ELEMENT_ARRAY_BUFFER types
  buffer = new Buffer(gl, {
    target: GL.ELEMENT_ARRAY_BUFFER,
    data: new Float32Array([1, 2, 3])
  })
    .bind()
    .unbind()
    .delete();
  t.ok(buffer instanceof Buffer, 'Buffer(ELEMENT_ARRAY_BUFFER) successful');

  t.end();
});

test('Buffer#initialize/subData', t => {
  const {gl} = fixture;

  let buffer;

  buffer = new Buffer(gl, {target: GL.ARRAY_BUFFER})
    .initialize({data: new Float32Array([1, 2, 3])})
    .bind()
    .unbind()
    .delete();
  t.ok(buffer instanceof Buffer, 'Buffer.subData(ARRAY_BUFFER) successful');

  buffer = new Buffer(gl, {target: GL.ARRAY_BUFFER, data: new Float32Array([1, 2, 3])})
    .initialize({data: new Float32Array([1, 2, 3])})
    .bind()
    .unbind()
    .delete();
  t.ok(buffer instanceof Buffer, 'Buffer.subData(ARRAY_BUFFER) successful');

  buffer = new Buffer(gl, {target: GL.ELEMENT_ARRAY_BUFFER})
    .initialize({data: new Float32Array([1, 2, 3])})
    .bind()
    .unbind()
    .delete();
  t.ok(buffer instanceof Buffer, 'buffer.initialize(ELEMENT_ARRAY_BUFFER) successful');

  buffer = new Buffer(gl, {target: GL.ELEMENT_ARRAY_BUFFER})
    .initialize({data: new Float32Array([1, 2, 3])})
    .subData({data: new Float32Array([1, 1, 1])})
    .bind()
    .unbind()
    .delete();
  t.ok(buffer instanceof Buffer, 'Buffer.subData(ARRAY_ELEMENT_BUFFER) successful');

  t.end();
});

test('Buffer#copyData', t => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  const sourceData = new Float32Array([1, 2, 3]);
  const sourceBuffer = new Buffer(gl2, {data: sourceData});
  const destinationData = new Float32Array([4, 5, 6]);
  const destinationBuffer = new Buffer(gl2, {data: destinationData});

  let receivedData = destinationBuffer.getData();
  let expectedData = new Float32Array([4, 5, 6]);
  t.deepEqual(receivedData, expectedData, 'Buffer.getData: default parameters successful');

  destinationBuffer.copyData({sourceBuffer, size: 2 * Float32Array.BYTES_PER_ELEMENT});
  receivedData = destinationBuffer.getData();
  expectedData = new Float32Array([1, 2, 6]);
  t.deepEqual(receivedData, expectedData, 'Buffer.copyData: with size successful');

  destinationBuffer.copyData({
    sourceBuffer,
    readOffset: Float32Array.BYTES_PER_ELEMENT,
    writeOffset: 2 * Float32Array.BYTES_PER_ELEMENT,
    size: Float32Array.BYTES_PER_ELEMENT
  });
  receivedData = destinationBuffer.getData();
  expectedData = new Float32Array([1, 2, 2]);
  t.deepEqual(receivedData, expectedData, 'Buffer.copyData: with size and offsets successful');

  t.end();
});

test('Buffer#getData', t => {
  const {gl2} = fixture;
  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  let data = new Float32Array([1, 2, 3]);
  let buffer = new Buffer(gl2, {data});

  let receivedData = buffer.getData();
  let expectedData = new Float32Array([1, 2, 3]);
  t.deepEqual(data, receivedData, 'Buffer.getData: default parameters successful');

  receivedData = buffer.getData({
    dstData: new Float32Array(2),
    srcByteOffset: Float32Array.BYTES_PER_ELEMENT
  });
  expectedData = new Float32Array([2, 3]);
  t.deepEqual(expectedData, receivedData, "Buffer.getData: with 'dstData' parameter successful");

  receivedData = buffer.getData({
    srcByteOffset: Float32Array.BYTES_PER_ELEMENT,
    dstOffset: 2
  });
  expectedData = new Float32Array([0, 0, 2, 3]);
  t.deepEqual(expectedData, receivedData, 'Buffer.getData: with src/dst offsets successful');

  // NOTE: when source and dst offsets are specified, 'length' needs to be set so that
  // source buffer access is not outof bounds, otherwise 'getBufferSubData' will throw exception.
  receivedData = buffer.getData({
    srcByteOffset: Float32Array.BYTES_PER_ELEMENT * 2,
    dstOffset: 1,
    length: 1
  });
  expectedData = new Float32Array([0, 3]);
  t.deepEqual(
    expectedData,
    receivedData,
    'Buffer.getData: with src/dst offsets and length successful'
  );

  data = new Uint8Array([128, 255, 1]);
  buffer = new Buffer(gl2, {data});

  receivedData = buffer.getData();
  t.deepEqual(data, receivedData, 'Buffer.getData: Uint8Array + default parameters successful');

  t.end();
});

test('Buffer#getElementCount', t => {
  const {gl} = fixture;

  let vertexCount;

  const buffer1 = new Buffer(gl, {data: new Float32Array([1, 2, 3])});
  vertexCount = buffer1.getElementCount();
  t.equal(vertexCount, 3, 'Vertex count should match');

  let buffer2 = new Buffer(gl, {data: new Int32Array([1, 2, 3, 4]), acessor: {divisor: 1}});
  vertexCount = buffer2.getElementCount();
  t.equal(vertexCount, 4, 'Vertex count should match');

  const {byteLength, usage, accessor} = buffer1;
  buffer2 = new Buffer(gl, {byteLength, usage, accessor});
  vertexCount = buffer2.getElementCount();
  t.equal(vertexCount, 3, 'Vertex count should match');

  t.end();
});

test('Buffer#reallocate', t => {
  const {gl} = fixture;

  const buffer = new Buffer(gl, {byteLength: 100});
  t.equal(buffer.byteLength, 100, 'byteLength should match');
  t.equal(buffer.bytesUsed, 100, 'bytesUsed should match');

  let didRealloc = buffer.reallocate(90);
  t.equal(didRealloc, false, 'Should not reallocate');
  t.equal(buffer.byteLength, 100, 'byteLength should be unchanged');
  t.equal(buffer.bytesUsed, 90, 'bytesUsed should have changed');

  didRealloc = buffer.reallocate(110);
  t.equal(didRealloc, true, 'Should reallocate');
  t.equal(buffer.byteLength, 110, 'byteLength should have changed');
  t.equal(buffer.byteLength, 110, 'bytesUsed should have changed');

  t.end();
});
