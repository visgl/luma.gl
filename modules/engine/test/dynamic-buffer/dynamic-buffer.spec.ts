// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {getTestDevices} from '@luma.gl/test-utils';
import {DynamicBuffer} from '../../src';

const DEVICE_TYPES = ['webgpu', 'webgl', 'null'] as const;

it('DynamicBuffer JSON debug output stays compact', async () => {
  for (const device of await getTestDevices(['null'])) {
    const dynamicBuffer = new DynamicBuffer(device, {
      id: 'compact-json-dynamic-buffer',
      byteLength: 4,
      usage: Buffer.VERTEX
    });

    expect(JSON.stringify(dynamicBuffer), 'dynamic buffer JSON uses toString()').toBe(
      JSON.stringify(dynamicBuffer.toString())
    );

    dynamicBuffer.destroy();
  }

  void 0;
});

it('DynamicBuffer#write/read/debugData', async () => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const dynamicBuffer = new DynamicBuffer(device, {
      byteLength: 4,
      usage: Buffer.COPY_DST | Buffer.COPY_SRC | Buffer.VERTEX,
      debugData: true
    });

    const initialTimestamp = dynamicBuffer.updateTimestamp;
    dynamicBuffer.write(new Uint8Array([1, 2, 3, 4]));

    const result = await dynamicBuffer.readAsync();
    expect(Array.from(result), `${device.type} write/read round-trips data`).toEqual([1, 2, 3, 4]);
    expect(
      Array.from(new Uint8Array(dynamicBuffer.debugData)),
      `${device.type} debugData mirrors writes`
    ).toEqual([1, 2, 3, 4]);
    expect(
      Boolean(dynamicBuffer.updateTimestamp > initialTimestamp),
      `${device.type} write bumps update timestamp`
    ).toBe(true);

    dynamicBuffer.destroy();
  }

  void 0;
});

it('DynamicBuffer#resize without preserveData replaces the backing buffer', async () => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const dynamicBuffer = new DynamicBuffer(device, {
      data: new Uint8Array([1, 2, 3, 4, 5, 6]),
      byteOffset: 1,
      usage: Buffer.COPY_DST | Buffer.COPY_SRC | Buffer.VERTEX,
      debugData: true
    });

    const initialBuffer = dynamicBuffer.buffer;
    const initialTimestamp = dynamicBuffer.updateTimestamp;

    expect(
      Boolean(dynamicBuffer.resize({byteLength: 4})),
      `${device.type} resize reports change`
    ).toBe(true);
    expect(dynamicBuffer.byteLength, `${device.type} resize updates byteLength`).toBe(4);
    expect(
      Boolean(dynamicBuffer.buffer !== initialBuffer),
      `${device.type} resize replaces buffer handle`
    ).toBe(true);
    expect(dynamicBuffer.generation, `${device.type} resize increments generation`).toBe(1);
    expect(
      Boolean(dynamicBuffer.updateTimestamp > initialTimestamp),
      `${device.type} resize bumps update timestamp`
    ).toBe(true);
    expect(
      dynamicBuffer.ensureSize(4),
      `${device.type} ensureSize is a no-op when current buffer is large enough`
    ).toBe(false);
    expect(
      Array.from(new Uint8Array(dynamicBuffer.debugData)),
      `${device.type} resize without preserveData does not retain constructor upload data`
    ).toEqual([0, 0, 0, 0]);

    dynamicBuffer.destroy();
  }

  void 0;
});

it('DynamicBuffer#resize preserveData keeps bytes on WebGL and WebGPU', async () => {
  for (const device of await getTestDevices(['webgpu', 'webgl'])) {
    const dynamicBuffer = new DynamicBuffer(device, {
      data: new Uint8Array([9, 8, 7, 6]),
      usage: Buffer.COPY_DST | Buffer.COPY_SRC | Buffer.VERTEX,
      debugData: true
    });

    const initialBuffer = dynamicBuffer.buffer;
    expect(
      Boolean(dynamicBuffer.resize({byteLength: 8, preserveData: true})),
      `${device.type} preserve resize reports change`
    ).toBe(true);

    const result = await dynamicBuffer.readAsync(0, 4);
    expect(Array.from(result), `${device.type} preserve resize copies previous contents`).toEqual([
      9, 8, 7, 6
    ]);
    expect(
      Boolean(dynamicBuffer.buffer !== initialBuffer),
      `${device.type} preserve resize still replaces the backing buffer`
    ).toBe(true);

    dynamicBuffer.destroy();
  }

  void 0;
});

it('DynamicBuffer#resize preserveData keeps unaligned byte counts on WebGL and WebGPU', async () => {
  for (const device of await getTestDevices(['webgpu', 'webgl'])) {
    const dynamicBuffer = new DynamicBuffer(device, {
      data: new Uint8Array([9, 8, 7]),
      usage: Buffer.COPY_DST | Buffer.COPY_SRC | Buffer.VERTEX,
      debugData: true
    });

    expect(
      Boolean(dynamicBuffer.resize({byteLength: 7, preserveData: true})),
      `${device.type} unaligned preserve resize reports change`
    ).toBe(true);

    const result = await dynamicBuffer.readAsync(0, 3);
    expect(
      Array.from(result),
      `${device.type} unaligned preserve resize copies previous contents`
    ).toEqual([9, 8, 7]);

    dynamicBuffer.destroy();
  }

  void 0;
});
