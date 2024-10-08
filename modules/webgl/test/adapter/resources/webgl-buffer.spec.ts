// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {Buffer} from '@luma.gl/core';
import {WEBGLBuffer} from '@luma.gl/webgl';

import {getWebGLTestDevice} from '@luma.gl/test-utils';

test('WEBGLBuffer#bind/unbind with index', async t => {
  const device = await getWebGLTestDevice();

  const buffer = device.createBuffer({usage: Buffer.UNIFORM});
  device.gl.bindBufferBase(buffer.glTarget, 0, buffer.handle);
  t.ok(buffer instanceof Buffer, `${device.type} Buffer bind/unbind with index successful`);
  device.gl.bindBufferBase(buffer.glTarget, 0, null);

  buffer.destroy();

  t.end();
});

test('WEBGLBuffer#write', async t => {
  const device = await getWebGLTestDevice();

  const initialData = new Float32Array([1, 2, 3]);
  const updateData = new Float32Array([4, 5, 6]);

  let buffer: WEBGLBuffer;

  buffer = device.createBuffer({usage: Buffer.VERTEX, data: initialData});

  t.deepEqual(
    await readAsyncF32(buffer),
    initialData,
    `${device.type} Device.createBuffer(ARRAY_BUFFER) successful`
  );

  buffer.write(updateData);

  t.deepEquals(
    await readAsyncF32(buffer),
    updateData,
    `${device.type} Buffer.write(ARRAY_BUFFER) successful`
  );

  buffer.destroy();

  const initialDataInt = new Uint32Array([1, 2, 3]);
  const updateDataInt = new Uint32Array([4, 5, 6]);

  buffer = device.createBuffer({usage: Buffer.INDEX, data: initialDataInt});

  t.deepEqual(
    await readAsyncU32(buffer),
    initialDataInt,
    `${device.type} Device.createBuffer(ELEMENT_ARRAY_BUFFER) successful`
  );

  buffer.write(updateDataInt);

  t.deepEqual(
    await readAsyncU32(buffer),
    updateDataInt,
    `${device.type} Buffer.write(ARRAY_ELEMENT_BUFFER) successful`
  );

  buffer.destroy();

  t.end();
});

async function readAsyncF32(source: Buffer): Promise<Float32Array> {
  const {buffer, byteOffset, byteLength} = await source.readAsync();
  return new Float32Array(buffer, byteOffset, byteLength / Float32Array.BYTES_PER_ELEMENT);
}

async function readAsyncU32(source: Buffer): Promise<Uint32Array> {
  const {buffer, byteOffset, byteLength} = await source.readAsync();
  return new Uint32Array(buffer, byteOffset, byteLength / Uint32Array.BYTES_PER_ELEMENT);
}
