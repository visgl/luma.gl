// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable no-continue */

import test from 'tape-promise/tape';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/test-utils';

import {TypedArray} from '@math.gl/types';
import {Buffer} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';

const DEVICE_TYPES = ['webgpu', 'webgl', 'null'] as const;

test('Buffer#constructor/delete', async t => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
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

  for (const device of await getTestDevices(DEVICE_TYPES)) {
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
    buffer.destroy();

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
    buffer.destroy();

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
    buffer.destroy();
  }
  t.end();
});

test('Buffer#write', async t => {
  const expectedData = new Float32Array([1, 2, 3]);
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const buffer = device.createBuffer({
      usage: Buffer.VERTEX | Buffer.COPY_DST | Buffer.COPY_SRC,
      byteLength: 12
    });
    buffer.write(expectedData);
    const receivedData = await buffer.readAsync();
    t.deepEqual(
      new Float32Array(receivedData.buffer),
      expectedData,
      `${device.type} Buffer.write(ARRAY_BUFFER) stores correct bytes`
    );
    buffer.destroy();
  }
  t.end();
});

test('Buffer#readAsync', async t => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    let data: TypedArray = new Float32Array([1, 2, 3, 4]);

    let buffer = device.createBuffer({data, usage: Buffer.COPY_SRC | Buffer.COPY_DST});

    // Full read
    let receivedData = await buffer.readAsync();
    let f32Data = new Float32Array(receivedData.buffer);
    let expectedData = new Float32Array([1, 2, 3, 4]);
    t.deepEqual(
      f32Data,
      expectedData,
      `${device.type} Buffer.readAsync: default parameters successful`
    );

    // Read with byteOffset (skip 1 float = 4 bytes)
    receivedData = await buffer.readAsync(8);
    f32Data = new Float32Array(receivedData.buffer);
    expectedData = new Float32Array([3, 4]);
    t.deepEqual(
      f32Data,
      expectedData,
      `${device.type} Buffer.readAsync: with byteOffset successful`
    );

    // Read with byteOffset and byteLength (read 2 floats = 8 bytes starting from offset 4)
    receivedData = await buffer.readAsync(8, 8);
    f32Data = new Float32Array(receivedData.buffer);
    expectedData = new Float32Array([3, 4]);
    t.deepEqual(
      f32Data,
      expectedData,
      `${device.type} Buffer.readAsync: with byteOffset + byteLength successful`
    );

    // Read 1 float starting at third float (offset 8)
    receivedData = await buffer.readAsync(8, 4);
    f32Data = new Float32Array(receivedData.buffer);
    expectedData = new Float32Array([3]);
    t.deepEqual(f32Data, expectedData, `${device.type} Buffer.readAsync: partial range successful`);

    // Uint8Array test
    data = new Uint8Array([128, 255, 1, 0]);
    buffer = device.createBuffer({data, usage: Buffer.COPY_SRC | Buffer.COPY_DST});
    receivedData = await buffer.readAsync();
    t.deepEqual(
      receivedData,
      data,
      `${device.type} Buffer.readAsync: Uint8Array input works correctly`
    );
  }

  t.end();
});

test('Buffer#mapAndWriteAsync (full and partial)', async t => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const isWebGPU = device.type === 'webgpu';
    const mapped = isWebGPU ? 'mapped' : 'copied';

    // Full write test
    const buffer = device.createBuffer({byteLength: 16, usage: Buffer.COPY_DST | Buffer.COPY_SRC});

    await buffer.mapAndWriteAsync((arrayBuffer, lifetime) => {
      t.ok(
        arrayBuffer instanceof ArrayBuffer,
        `${device.type} mapAndWriteAsync calls with ArrayBuffer`
      );
      t.equal(
        arrayBuffer.byteLength,
        16,
        `${device.type} mapAndWriteAsync calls with correct byteLength`
      );
      t.equal(lifetime, mapped, `${device.type} mapAndWriteAsync calls with correct lifetime`);
      new Float32Array(arrayBuffer).set([1, 2, 3, 4]);
    });

    const result = await buffer.readAsync(0, 16);
    t.deepEqual(
      new Float32Array(result.buffer),
      new Float32Array([1, 2, 3, 4]),
      `${device.type} full mapAndWriteAsync writes correct data`
    );

    // Partial write test (8 bytes = two floats)
    await buffer.mapAndWriteAsync(
      (arrayBuffer, lifetime) => {
        t.equal(arrayBuffer.byteLength, 8, `${device.type} partial buffer is correct size`);
        new Float32Array(arrayBuffer).set([9, 10]);
      },
      8,
      8
    );

    const partial = await buffer.readAsync();
    t.deepEqual(
      new Float32Array(partial.buffer),
      new Float32Array([1, 2, 9, 10]),
      `${device.type} partial mapAndWriteAsync writes correct slice`
    );

    buffer.destroy();
  }

  t.end();
});

test('Buffer#mapAndReadAsync (full and partial)', async t => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const isWebGPU = device.type === 'webgpu';
    const initialData = new Float32Array([10, 20, 30, 40]);
    const buffer = device.createBuffer({
      data: initialData,
      usage: Buffer.COPY_DST | Buffer.COPY_SRC
    });

    // Test full map
    const fullResult = await buffer.mapAndReadAsync((arrayBuffer, lifetime) => {
      t.ok(
        arrayBuffer instanceof ArrayBuffer,
        `${device.type} full mapAndReadAsync returns ArrayBuffer`
      );
      t.equal(
        lifetime,
        isWebGPU ? 'mapped' : 'copied',
        `${device.type} full mapAndReadAsync returns correct lifetime`
      );
      return new Float32Array(arrayBuffer.slice());
    });
    t.deepEqual(fullResult, initialData, `${device.type} full mapAndReadAsync correct`);

    // Test partial map (byteOffset: 8 bytes, byteLength: 8 bytes = [20, 30])
    const expected = new Float32Array([30, 40]);
    const result = await buffer.mapAndReadAsync(
      arrayBuffer => new Float32Array(arrayBuffer.slice()),
      8,
      8
    );
    t.deepEqual(result, expected, `${device.type} partial mapAndReadAsync correct`);

    buffer.destroy();
  }

  t.end();
});

test('Buffer#debugData', async t => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    // TODO - debugData not updated on WebGPU
    if (device.type !== 'webgl') {
      continue;
    }
    const buffer = device.createBuffer({usage: Buffer.VERTEX, byteLength: 24});
    t.equal(
      buffer.debugData.byteLength,
      24,
      `${device.type} Buffer.debugData is not null before write`
    );

    const expectedData = new Float32Array([0, 0, 1, 2, 3]);
    buffer.write(expectedData);
    const f32Data = new Float32Array(buffer.debugData);
    t.deepEqual(f32Data, expectedData, `${device.type} Buffer.debugData is null after write`);

    // TODO - not a very useful test, should test that debugData is updated after read
    await buffer.readAsync();
    t.equal(buffer.debugData.byteLength, 24, `${device.type} Buffer.debugData is valid after read`);

    buffer.destroy();
  }

  t.end();
});

// WEBGL specific tests

test('WEBGLBuffer#construction', async t => {
  const webglDevice = await getWebGLTestDevice();

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
