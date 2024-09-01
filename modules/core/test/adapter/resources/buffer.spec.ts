// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable no-continue */

import test from 'tape-promise/tape';
import {getTestDevices, webglDevice} from '@luma.gl/test-utils';

import {TypedArray} from '@math.gl/types';
import {Buffer} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';

test('Buffer#constructor/delete', async t => {
  for (const device of await getTestDevices()) {
    const buffer = device.createBuffer({usage: Buffer.VERTEX});
    // @ts-ignore handle
    t.ok(buffer.handle, `${device.type} Buffer construction successful`);

    buffer.destroy();
    // @ts-ignore handle
    t.ok(!buffer.handle, `${device.type} Buffer.destroy() successful`);

    buffer.destroy();
    // @ts-ignore handle
    t.ok(!buffer.handle, `${device.type} repeated Buffer.destroy() successful`);
  }
  t.end();
});

test('Buffer#constructor offset and size', async t => {
  const data = new Float32Array([1, 2, 3]);

  for (const device of await getTestDevices()) {
    if (device.type === 'webgpu') {
      continue;
    }
    let buffer = device.createBuffer({data, byteOffset: 8});
    let expectedData = new Float32Array([0, 0, 1, 2, 3]);
    t.equal(
      buffer.byteLength,
      expectedData.byteLength,
      `${device.type} Buffer byteLength set properly`
    );

    let receivedData = await buffer.readAsync();
    t.deepEqual(
      new Float32Array(receivedData.buffer),
      expectedData,
      `${device.type} Buffer constructor offsets data`
    );

    buffer = device.createBuffer({data, byteLength: data.byteLength + 12});
    expectedData = new Float32Array([1, 2, 3, 0, 0, 0]);
    t.equal(
      buffer.byteLength,
      expectedData.byteLength,
      `${device.type} Buffer byteLength set properly`
    );

    receivedData = await buffer.readAsync();
    t.deepEqual(
      new Float32Array(receivedData.buffer),
      expectedData,
      `${device.type} Buffer constructor sets buffer data`
    );

    buffer = device.createBuffer({data, byteOffset: 8, byteLength: data.byteLength + 12});
    expectedData = new Float32Array([0, 0, 1, 2, 3, 0]);
    t.equal(
      buffer.byteLength,
      expectedData.byteLength,
      `${device.type} Buffer byteLength set properly`
    );

    receivedData = await buffer.readAsync();
    t.deepEqual(
      new Float32Array(receivedData.buffer),
      expectedData,
      `${device.type} Buffer constructor sets buffer byteLength and offsets data`
    );
  }
  t.end();
});

/*
test('Buffer#bind/unbind', async t => {
  for (const device of await getTestDevices()) {
    const buffer = device.createBuffer({usage: Buffer.VERTEX});
    device.gl.bindBuffer(buffer.glTarget, buffer.handle);
    t.ok(buffer instanceof Buffer, `${device.type} Buffer bind/unbind successful`);
    device.gl.bindBuffer(buffer.glTarget, null);
    buffer.destroy();
  }
  t.end();
});
*/

test('Buffer#write', async t => {
  const expectedData = new Float32Array([1, 2, 3]);
  for (const device of await getTestDevices()) {
    if (device.type === 'webgpu') {
      continue;
    }
    const buffer = device.createBuffer({usage: Buffer.VERTEX, byteLength: 12});
    buffer.write(expectedData);
    const receivedData = await buffer.readAsync();
    t.deepEqual(
      new Float32Array(receivedData.buffer),
      expectedData,
      `${device.type} Buffer.subData(ARRAY_BUFFER) stores correct bytes`
    );
    buffer.destroy();

    // TODO - this seems to be testing that usage is correctly observed, move up
    // buffer = device.createBuffer({usage: Buffer.VERTEX, data: new Float32Array([1, 2, 3])});
    // buffer.write(new Float32Array([1, 2, 3]));
    // t.ok(buffer instanceof Buffer, `${device.type} Buffer.subData(ARRAY_BUFFER) successful`);
    // buffer.destroy();

    // buffer = device.createBuffer({usage: Buffer.INDEX}).write(new Float32Array([1, 2, 3]));
    // t.ok(
    //   buffer instanceof Buffer,
    //   `${device.type} buffer.initialize(ELEMENT_ARRAY_BUFFER) successful`
    // );
    // buffer.destroy();
  }
  t.end();
});

test('Buffer#readAsync', async t => {
  for (const device of await getTestDevices()) {
    if (device.type === 'webgpu') {
      continue;
    }
    let data: TypedArray = new Float32Array([1, 2, 3]);
    let buffer = device.createBuffer({data});

    let receivedData = await buffer.readAsync();
    let f32Data = new Float32Array(receivedData.buffer);
    let expectedData = new Float32Array([1, 2, 3]);
    t.deepEqual(f32Data, expectedData, 'Buffer.readAsync: default parameters successful');

    receivedData = await buffer.readAsync(Float32Array.BYTES_PER_ELEMENT);
    f32Data = new Float32Array(receivedData.buffer);
    expectedData = new Float32Array([2, 3]);
    t.deepEqual(f32Data, expectedData, 'Buffer.readAsync: with dstData parameter successful');

    // receivedData = await buffer.readAsync({
    //   Float32Array.BYTES_PER_ELEMENT,
    //   dstOffset: 2
    // });
    // expectedData = new Float32Array([0, 0, 2, 3]);
    // t.deepEqual(expectedData, receivedData, 'Buffer.readAsync: with src/dst offsets successful');

    // // NOTE: when source and dst offsets are specified, 'length' needs to be set so that
    // // source buffer access is not outof bounds, otherwise 'getBufferSubData' will throw exception.
    // receivedData = buffer.readAsync({
    //   srcByteOffset: Float32Array.BYTES_PER_ELEMENT * 2,
    //   dstOffset: 1,
    //   length: 1
    // });
    // expectedData = new Float32Array([0, 3]);
    // t.deepEqual(
    //   expectedData,
    //   receivedData,
    //   'Buffer.readAsync: with src/dst offsets and length successful'
    // );

    data = new Uint8Array([128, 255, 1]);
    buffer = device.createBuffer({data});
    receivedData = await buffer.readAsync();
    t.deepEqual(data, receivedData, 'Buffer.readAsync: Uint8Array + default parameters successful');
  }

  t.end();
});

test('Buffer#debugData', async t => {
  for (const device of await getTestDevices()) {
    if (device.type === 'webgpu') {
      continue;
    }
    const buffer = device.createBuffer({usage: Buffer.VERTEX, byteLength: 24});
    t.equal(buffer.debugData.byteLength, 24, 'Buffer.debugData is not null before write');

    const expectedData = new Float32Array([0, 0, 1, 2, 3]);
    buffer.write(expectedData);
    const f32Data = new Float32Array(buffer.debugData);
    t.deepEqual(f32Data, expectedData, 'Buffer.debugData is null after write');

    // TODO - not a very useful test, should test that debugData is updated after read
    await buffer.readAsync();
    t.equal(buffer.debugData.byteLength, 24, 'Buffer.debugData is valid after read');

    buffer.destroy();
  }

  t.end();
});

// WEBGL specific tests

test('WEBGLBuffer#construction', async t => {
  await getTestDevices();

  let buffer;

  buffer = webglDevice.createBuffer({usage: Buffer.VERTEX, data: new Float32Array([1, 2, 3])});
  t.ok(
    buffer.glTarget === GL.ARRAY_BUFFER,
    `${webglDevice.info.type} Buffer(ARRAY_BUFFER) successful`
  );
  buffer.destroy();

  // TODO - buffer could check for integer ELEMENT_ARRAY_BUFFER types
  buffer = webglDevice.createBuffer({usage: Buffer.INDEX, data: new Uint32Array([1, 2, 3])});
  t.ok(
    buffer.glTarget === GL.ELEMENT_ARRAY_BUFFER,
    `${webglDevice.info.type} Buffer(ELEMENT_ARRAY_BUFFER) successful`
  );

  buffer.destroy();

  t.end();
});
