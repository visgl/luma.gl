// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer} from '@luma.gl/core';
import {getTestDevices} from '@luma.gl/test-utils';
import {DynamicBuffer} from '../../src';

const DEVICE_TYPES = ['webgpu', 'webgl', 'null'] as const;

test('DynamicBuffer#write/read/debugData', async t => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const dynamicBuffer = new DynamicBuffer(device, {
      byteLength: 4,
      usage: Buffer.COPY_DST | Buffer.COPY_SRC | Buffer.VERTEX,
      debugData: true
    });

    const initialTimestamp = dynamicBuffer.updateTimestamp;
    dynamicBuffer.write(new Uint8Array([1, 2, 3, 4]));

    const result = await dynamicBuffer.readAsync();
    t.deepEqual(Array.from(result), [1, 2, 3, 4], `${device.type} write/read round-trips data`);
    t.deepEqual(
      Array.from(new Uint8Array(dynamicBuffer.debugData)),
      [1, 2, 3, 4],
      `${device.type} debugData mirrors writes`
    );
    t.ok(
      dynamicBuffer.updateTimestamp > initialTimestamp,
      `${device.type} write bumps update timestamp`
    );

    dynamicBuffer.destroy();
  }

  t.end();
});

test('DynamicBuffer#resize without preserveData replaces the backing buffer', async t => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const dynamicBuffer = new DynamicBuffer(device, {
      data: new Uint8Array([1, 2, 3, 4, 5, 6]),
      byteOffset: 1,
      usage: Buffer.COPY_DST | Buffer.COPY_SRC | Buffer.VERTEX,
      debugData: true
    });

    const initialBuffer = dynamicBuffer.buffer;
    const initialTimestamp = dynamicBuffer.updateTimestamp;

    t.ok(dynamicBuffer.resize({byteLength: 4}), `${device.type} resize reports change`);
    t.equal(dynamicBuffer.byteLength, 4, `${device.type} resize updates byteLength`);
    t.ok(dynamicBuffer.buffer !== initialBuffer, `${device.type} resize replaces buffer handle`);
    t.equal(dynamicBuffer.generation, 1, `${device.type} resize increments generation`);
    t.ok(
      dynamicBuffer.updateTimestamp > initialTimestamp,
      `${device.type} resize bumps update timestamp`
    );
    t.equal(
      dynamicBuffer.ensureSize(4),
      false,
      `${device.type} ensureSize is a no-op when current buffer is large enough`
    );
    t.deepEqual(
      Array.from(new Uint8Array(dynamicBuffer.debugData)),
      [0, 0, 0, 0],
      `${device.type} resize without preserveData does not retain constructor upload data`
    );

    dynamicBuffer.destroy();
  }

  t.end();
});

test('DynamicBuffer#resize preserveData keeps bytes on WebGL and WebGPU', async t => {
  for (const device of await getTestDevices(['webgpu', 'webgl'])) {
    const dynamicBuffer = new DynamicBuffer(device, {
      data: new Uint8Array([9, 8, 7, 6]),
      usage: Buffer.COPY_DST | Buffer.COPY_SRC | Buffer.VERTEX,
      debugData: true
    });

    const initialBuffer = dynamicBuffer.buffer;
    t.ok(
      dynamicBuffer.resize({byteLength: 8, preserveData: true}),
      `${device.type} preserve resize reports change`
    );

    const result = await dynamicBuffer.readAsync(0, 4);
    t.deepEqual(
      Array.from(result),
      [9, 8, 7, 6],
      `${device.type} preserve resize copies previous contents`
    );
    t.ok(
      dynamicBuffer.buffer !== initialBuffer,
      `${device.type} preserve resize still replaces the backing buffer`
    );

    dynamicBuffer.destroy();
  }

  t.end();
});
