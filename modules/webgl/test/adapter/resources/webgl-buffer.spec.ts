// luma.gl, MIT license

import {Buffer} from '@luma.gl/core';
import test from 'tape-promise/tape';

import {getWebGLTestDevices} from '@luma.gl/test-utils';

test('Buffer#constructor/delete', t => {
  for (const device of getWebGLTestDevices()) {
    const buffer = device.createBuffer({usage: Buffer.VERTEX});
    t.ok(buffer.handle, `${device.info.type} Buffer construction successful`);

    buffer.destroy();
    t.ok(!buffer.handle, `${device.info.type} Buffer.destroy() successful`);

    buffer.destroy();
    t.ok(!buffer.handle, `${device.info.type} repeated Buffer.destroy() successful`);
  } 
  t.end();
});

test('Buffer#constructor offset and size', t => {
  const data = new Float32Array([1, 2, 3]);

  for (const device of getWebGLTestDevices()) {
    let buffer = device.createBuffer({data, byteOffset: 8});
    let expectedData = new Float32Array([0, 0, 1, 2, 3]);
    t.equal(buffer.byteLength, expectedData.byteLength, `${device.info.type} Buffer byteLength set properly`);

    if (device.isWebGL2) {
      const receivedData = buffer.getData();
      t.deepEqual(receivedData, expectedData, `${device.info.type} Buffer constructor offsets data`);
    }

    buffer = device.createBuffer({data, byteLength: data.byteLength + 12});
    expectedData = new Float32Array([1, 2, 3, 0, 0, 0]);
    t.equal(buffer.byteLength, expectedData.byteLength, `${device.info.type} Buffer byteLength set properly`);
    if (device.isWebGL2) {
      const receivedData = buffer.getData();
      t.deepEqual(receivedData, expectedData, `${device.info.type} Buffer constructor sets buffer data`);
    }

    buffer = device.createBuffer({data, byteOffset: 8, byteLength: data.byteLength + 12});
    expectedData = new Float32Array([0, 0, 1, 2, 3, 0]);
    t.equal(buffer.byteLength, expectedData.byteLength, `${device.info.type} Buffer byteLength set properly`);
    
    if (device.isWebGL2) {      
      const receivedData = buffer.getData();
      t.deepEqual(
        receivedData,
        expectedData,
        `${device.info.type} Buffer constructor sets buffer byteLength and offsets data`
      );
    }
  }
  t.end();
});

test('Buffer#bind/unbind', t => {
  for (const device of getWebGLTestDevices()) {
    const buffer = device.createBuffer({usage: Buffer.VERTEX});
    device.gl.bindBuffer(buffer.glTarget, buffer.handle);
    t.ok(buffer instanceof Buffer, `${device.info.type} Buffer bind/unbind successful`);
    device.gl.bindBuffer(buffer.glTarget, null);
    buffer.destroy();
  }
  t.end();
});

/*
test('Buffer#bind/unbind with index', t => {
  for (const device of getWebGLTestDevices()) {
    if (!device.isWebGL2) {
      t.comment('WebGL2 not available, skipping tests');
      t.end();
      return;
    }

    const buffer = device.createBuffer({usage: Buffer.UNIFORM, index: 0});
    device.gl.bindBuffer(buffer.glTarget, buffer.handle);
    t.ok(buffer instanceof Buffer, `${device.info.type} Buffer bind/unbind with index successful`);
    device.gl.bindBuffer(buffer.glTarget, null);
    buffer.destroy();
  }

  t.end();
});

test('Buffer#construction', t => {
  for (const device of getWebGLTestDevices()) {

    let buffer;

    buffer = device
      .createBuffer({usage: Buffer.VERTEX, data: new Float32Array([1, 2, 3])})
      .bind()
      .unbind();
    t.ok(buffer instanceof Buffer, `${device.info.type} Buffer(ARRAY_BUFFER) successful`);
    buffer.destroy();

    // TODO - buffer could check for integer ELEMENT_ARRAY_BUFFER types
    buffer = device
      .createBuffer({
        usage: Buffer.INDEX,
        data: new Float32Array([1, 2, 3])
      })
      .bind()
      .unbind();
    t.ok(buffer instanceof Buffer, `${device.info.type} Buffer(ELEMENT_ARRAY_BUFFER) successful`);
    buffer.destroy();
  }

  t.end();
});

test('Buffer#initialize/subData', t => {
  for (const device of getWebGLTestDevices()) {
  let buffer;

  buffer = device
    .createBuffer({usage: Buffer.VERTEX})
    .initialize({data: new Float32Array([1, 2, 3])})
    .bind()
    .unbind();
  t.ok(buffer instanceof Buffer, `${device.info.type} Buffer.subData(ARRAY_BUFFER) successful`);
  buffer.destroy();

  buffer = device
    .createBuffer({usage: Buffer.VERTEX, data: new Float32Array([1, 2, 3])})
    .initialize({data: new Float32Array([1, 2, 3])})
    .bind()
    .unbind();
  t.ok(buffer instanceof Buffer, `${device.info.type} Buffer.subData(ARRAY_BUFFER) successful`);
  buffer.destroy();

  buffer = device
    .createBuffer({usage: Buffer.INDEX})
    .initialize({data: new Float32Array([1, 2, 3])})
    .bind()
    .unbind();
  t.ok(buffer instanceof Buffer, `${device.info.type} buffer.initialize(ELEMENT_ARRAY_BUFFER) successful`);
  buffer.destroy();

  buffer = device
    .createBuffer({usage: Buffer.INDEX})
    .initialize({data: new Float32Array([1, 2, 3])})
    .subData({data: new Float32Array([1, 1, 1])})
    .bind()
    .unbind();
  t.ok(buffer instanceof Buffer, `${device.info.type} Buffer.subData(ARRAY_ELEMENT_BUFFER) successful`);
  buffer.destroy();
  }
  t.end();
});

test('Buffer#copyData', t => {
  for (const device of getWebGLTestDevices()) {
    if (!device.isWebGL2) {
      t.comment('WebGL2 not available, skipping tests');
      t.end();
      return;
    }

    const sourceData = new Float32Array([1, 2, 3]);
    const sourceBuffer = device.createBuffer({data: sourceData});
    const destinationData = new Float32Array([4, 5, 6]);
    const destinationBuffer = device.createBuffer({data: destinationData});

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
  }
  t.end();
});

test('Buffer#getData', t => {
  for (const device of getWebGLTestDevices()) {
    if (!gl2) {
      t.comment('WebGL2 not available, skipping tests');
      t.end();
      return;
    }

    let data = new Float32Array([1, 2, 3]);
    let buffer = device.createBuffer({data});

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

    // @ts-expect-error
    data = new Uint8Array([128, 255, 1]);
    buffer = device.createBuffer({data});

    receivedData = buffer.getData();
    t.deepEqual(data, receivedData, 'Buffer.getData: Uint8Array + default parameters successful');
    }
  t.end();
});

test('Buffer#getElementCount', t => {
  for (const device of getWebGLTestDevices()) {
    let vertexCount;

    const buffer1 = device.createBuffer({data: new Float32Array([1, 2, 3])});
    vertexCount = buffer1.getElementCount();
    t.equal(vertexCount, 3, 'Vertex count should match');

    let buffer2 = device.createBuffer({data: new Int32Array([1, 2, 3, 4]), accessor: {divisor: 1}});
    vertexCount = buffer2.getElementCount();
    t.equal(vertexCount, 4, 'Vertex count should match');

    const {byteLength, usage, accessor} = buffer1;
    buffer2 = device.createBuffer({byteLength, usage, accessor});
    vertexCount = buffer2.getElementCount();
    t.equal(vertexCount, 3, 'Vertex count should match');
  }
  t.end();
});

test('Buffer#reallocate', t => {
  for (const device of getWebGLTestDevices()) {
    const buffer = device.createBuffer({byteLength: 100});
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
  }

  t.end();
});
*/
