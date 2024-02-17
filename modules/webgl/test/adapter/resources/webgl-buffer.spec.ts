// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {Buffer} from '@luma.gl/core';
import {WEBGLBuffer} from '@luma.gl/webgl';

import {getWebGLTestDevices} from '@luma.gl/test-utils';

test('WEBGLBuffer#bind/unbind with index', t => {
  for (const device of getWebGLTestDevices()) {
    const buffer = device.createBuffer({usage: Buffer.UNIFORM});
    device.gl.bindBufferBase(buffer.glTarget, 0, buffer.handle);
    t.ok(buffer instanceof Buffer, `${device.info.type} Buffer bind/unbind with index successful`);
    device.gl.bindBufferBase(buffer.glTarget, 0, null);

    buffer.destroy();
  }

  t.end();
});

test('WEBGLBuffer#write', async t => {
  const initialData = new Float32Array([1, 2, 3]);
  const updateData = new Float32Array([4, 5, 6]);

  for (const device of getWebGLTestDevices()) {
    let buffer: WEBGLBuffer;

    buffer = device.createBuffer({usage: Buffer.VERTEX, data: initialData});

    t.deepEqual(
      await readAsyncF32(buffer),
      initialData,
      `${device.info.type} Device.createBuffer(ARRAY_BUFFER) successful`
    );

    buffer.write(updateData);

    t.deepEquals(
      await readAsyncF32(buffer),
      updateData,
      `${device.info.type} Buffer.write(ARRAY_BUFFER) successful`
    );

    buffer.destroy();
    buffer = device.createBuffer({usage: Buffer.INDEX, data: initialData});

    t.deepEqual(
      await readAsyncF32(buffer),
      initialData,
      `${device.info.type} Device.createBuffer(ELEMENT_ARRAY_BUFFER) successful`
    );

    buffer.write(updateData);

    t.deepEqual(
      await readAsyncF32(buffer),
      updateData,
      `${device.info.type} Buffer.write(ARRAY_ELEMENT_BUFFER) successful`
    );

    buffer.destroy();
  }
  t.end();
});

async function readAsyncF32(source: Buffer): Promise<Float32Array> {
  const {buffer, byteOffset, byteLength} = await source.readAsync();
  return new Float32Array(
    buffer,
    byteOffset,
    byteLength / Float32Array.BYTES_PER_ELEMENT
  );
}
