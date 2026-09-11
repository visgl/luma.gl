// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {Kernel} from '../../src/compute/kernel';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

const source = /* WGSL */ `
@group(0) @binding(0) var<storage, read_write> data: array<i32>;
@compute @workgroup_size(1) fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  data[id.x] = 2 * data[id.x];
}`;

it('Kernel dispatches with per-dispatch bindings', async () => {
  const device = await getWebGPUTestDevice();
  if (!device || isSoftwareBackedDevice(device)) return;

  const kernel = new Kernel(device, {
    id: 'double-kernel',
    source,
    shaderLayout: {
      bindings: [{name: 'data', type: 'storage', group: 0, location: 0}]
    }
  });
  const buffer = device.createBuffer({
    data: new Int32Array([2]),
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });

  const pass = device.beginComputePass({});
  kernel.dispatch(pass, {bindings: {data: buffer}, x: 1});
  pass.end();
  device.submit();

  expect(new Int32Array(await buffer.readAsync())[0]).toBe(4);
  kernel.destroy();
  buffer.destroy();
});

it('Kernel.createAsync prepares a compute pipeline', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const kernel = await Kernel.createAsync(device, {source});
  expect(kernel.pipeline).toBeDefined();
  kernel.destroy();
});

it('Kernel dispatchIndirect consumes GPU dispatch dimensions', async () => {
  const device = await getWebGPUTestDevice();
  if (!device || isSoftwareBackedDevice(device)) return;

  const kernel = new Kernel(device, {
    source,
    shaderLayout: {
      bindings: [{name: 'data', type: 'storage', group: 0, location: 0}]
    }
  });
  const buffer = device.createBuffer({
    data: new Int32Array([1, 2, 3, 4]),
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const indirectBuffer = device.createBuffer({
    data: new Uint32Array([4, 1, 1]),
    usage: Buffer.INDIRECT
  });

  const pass = device.beginComputePass({});
  kernel.dispatchIndirect(pass, {
    bindings: {data: buffer},
    indirectBuffer
  });
  pass.end();
  device.submit();

  const bytes = await buffer.readAsync();
  expect(Array.from(new Int32Array(bytes.buffer, bytes.byteOffset, 4))).toEqual([2, 4, 6, 8]);
  kernel.destroy();
  buffer.destroy();
  indirectBuffer.destroy();
});

function isSoftwareBackedDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}
