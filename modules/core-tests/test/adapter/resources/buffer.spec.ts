// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';
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

test('Buffer#constructor offset and size', async (t) => {
  const data = new Float32Array([1, 2, 3]);

  for (const device of getWebGLTestDevices()) {
    let buffer = device.createBuffer({data, byteOffset: 8});
    let expectedData = new Float32Array([0, 0, 1, 2, 3]);
    t.equal(
      buffer.byteLength,
      expectedData.byteLength,
      `${device.info.type} Buffer byteLength set properly`
    );

    if (device.isWebGL2) {
      const receivedData = await buffer.readAsync();
      t.deepEqual(
        new Float32Array(receivedData.buffer),
        expectedData,
        `${device.info.type} Buffer constructor offsets data`
      );
    }

    buffer = device.createBuffer({data, byteLength: data.byteLength + 12});
    expectedData = new Float32Array([1, 2, 3, 0, 0, 0]);
    t.equal(
      buffer.byteLength,
      expectedData.byteLength,
      `${device.info.type} Buffer byteLength set properly`
    );
    if (device.isWebGL2) {
      const receivedData = await buffer.readAsync();
      t.deepEqual(
        new Float32Array(receivedData.buffer),
        expectedData,
        `${device.info.type} Buffer constructor sets buffer data`
      );
    }

    buffer = device.createBuffer({data, byteOffset: 8, byteLength: data.byteLength + 12});
    expectedData = new Float32Array([0, 0, 1, 2, 3, 0]);
    t.equal(
      buffer.byteLength,
      expectedData.byteLength,
      `${device.info.type} Buffer byteLength set properly`
    );

    if (device.isWebGL2) {
      const receivedData = await buffer.readAsync();
      t.deepEqual(
        new Float32Array(receivedData.buffer),
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

test('Buffer#construction', t => {
  for (const device of getWebGLTestDevices()) {
    let buffer;

    buffer = device.createBuffer({usage: Buffer.VERTEX, data: new Float32Array([1, 2, 3])});
    t.ok(
      buffer.glTarget === GL.ARRAY_BUFFER,
      `${device.info.type} Buffer(ARRAY_BUFFER) successful`
    );
    buffer.destroy();

    // TODO - buffer could check for integer ELEMENT_ARRAY_BUFFER types
    buffer = device.createBuffer({usage: Buffer.INDEX, data: new Float32Array([1, 2, 3])});
    t.ok(
      buffer.glTarget === GL.ELEMENT_ARRAY_BUFFER,
      `${device.info.type} Buffer(ELEMENT_ARRAY_BUFFER) successful`
    );

    buffer.destroy();
  }

  t.end();
});

test('Buffer#write', async (t) => {
  const expectedData = new Float32Array([1, 2, 3]);
  for (const device of getWebGLTestDevices()) {
    const buffer = device.createBuffer({usage: Buffer.VERTEX, byteLength: 12});
    buffer.write(expectedData);
    if (device.isWebGL2) {
      const receivedData = await buffer.readAsync();
      t.deepEqual(
        new Float32Array(receivedData.buffer),
        expectedData,
        `${device.info.type} Buffer.subData(ARRAY_BUFFER) stores correct bytes`
      );
    } else {
      t.ok(buffer instanceof Buffer, `${device.info.type} Buffer.subData(ARRAY_BUFFER) successful`);
    }
    buffer.destroy();

    // TODO - this seems to be testing that usage is correctly observed, move up
    // buffer = device.createBuffer({usage: Buffer.VERTEX, data: new Float32Array([1, 2, 3])});
    // buffer.write(new Float32Array([1, 2, 3]));
    // t.ok(buffer instanceof Buffer, `${device.info.type} Buffer.subData(ARRAY_BUFFER) successful`);
    // buffer.destroy();

    // buffer = device.createBuffer({usage: Buffer.INDEX}).write(new Float32Array([1, 2, 3]));
    // t.ok(
    //   buffer instanceof Buffer,
    //   `${device.info.type} buffer.initialize(ELEMENT_ARRAY_BUFFER) successful`
    // );
    // buffer.destroy();
  }
  t.end();
});

/*
test('Buffer#getData', async (t) => {
  for (const device of getWebGLTestDevices()) {
    if (!gl2) {
      t.comment('WebGL2 not available, skipping tests');
      t.end();
      return;
    }

    let data = new Float32Array([1, 2, 3]);
    let buffer = device.createBuffer({data});

    let receivedData = await buffer.readAsync();
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

    receivedData = await buffer.readAsync();
    t.deepEqual(data, receivedData, 'Buffer.getData: Uint8Array + default parameters successful');
  }
  t.end();
});
*/
