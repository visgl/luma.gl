// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {add, backendRegistry, GPUDataEvaluator} from '@luma.gl/gpgpu';
import * as cpuBackend from '@luma.gl/gpgpu/operations/cpu';
import {GPUData, GPUDataView} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';

backendRegistry.add('null', cpuBackend);

test('GPUDataEvaluator rejects packed vertex formats', () => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({byteLength: 4});
  const view = new GPUDataView({
    buffer,
    format: 'unorm10-10-10-2',
    length: 1
  });

  expect(() => GPUDataEvaluator.fromGPUDataView(view)).toThrow(
    /does not support packed vertex format unorm10-10-10-2/
  );

  buffer.destroy();
  device.destroy();
});

test('GPUDataEvaluator preserves GPUDataView and DynamicBuffer strided layouts', async () => {
  const device = new NullDevice({});
  const source = new Float32Array([1, 2, 99, 3, 4, 99]);
  const dynamicBuffer = new DynamicBuffer(device, {
    data: source,
    usage: Buffer.VERTEX | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  const view = new GPUDataView({
    buffer: dynamicBuffer,
    format: 'float32x2',
    length: 2,
    byteStride: 12
  });
  const viewEvaluator = GPUDataEvaluator.fromGPUDataView(view);
  const dataEvaluator = GPUDataEvaluator.fromGPUData(
    new GPUData({
      buffer: dynamicBuffer,
      format: 'float32x2',
      length: 2,
      byteStride: 12,
      rowByteLength: 8
    })
  );
  const misalignedView = new GPUDataView({
    buffer: dynamicBuffer,
    format: 'float32',
    length: 1,
    byteOffset: 2
  });

  expect(Array.from(await viewEvaluator.readValue())).toEqual([1, 2, 3, 4]);
  expect(Array.from(await dataEvaluator.readValue())).toEqual([1, 2, 3, 4]);
  expect(() => GPUDataEvaluator.fromGPUDataView(misalignedView)).toThrow(/aligned to 4 bytes/);

  const firstBuffer = dynamicBuffer.buffer;
  const replacementSource = new Float32Array([5, 6, 99, 7, 8, 99]);
  dynamicBuffer.resize({byteLength: 32});
  dynamicBuffer.write(replacementSource);
  expect(dynamicBuffer.buffer).not.toBe(firstBuffer);

  const result = add(view, 10);
  await result.evaluate(device);
  expect(Array.from(await result.readValue())).toEqual([15, 16, 17, 18]);

  viewEvaluator.destroy();
  dataEvaluator.destroy();
  result.destroy();
  dynamicBuffer.destroy();
});
