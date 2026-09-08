// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {castData, backendRegistry, GPUDataEvaluator} from '@luma.gl/gpgpu';
import * as cpuBackend from '@luma.gl/gpgpu/operations/cpu';
import {NullDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';

backendRegistry.add('null', cpuBackend);

test('castData converts fixed-width numeric rows on the CPU fallback', async t => {
  const device = new NullDevice({});
  const source = GPUDataEvaluator.fromArray(new Float32Array([-1, 0.5, 0.25, 2]), {
    type: 'float32',
    size: 2
  });
  const converted = castData(source, {
    inputFormat: 'float32x2',
    outputFormat: 'unorm8x2'
  });
  const result = await converted.evaluate(device, {format: 'unorm8x2'});
  const values = await result.data[0].buffer.readAsync(0, 4);

  t.equal(result.format, 'unorm8x2', 'retains the requested output format');
  t.deepEqual(
    new Uint8Array(values.buffer, values.byteOffset, values.byteLength),
    new Uint8Array([0, 128, 64, 255]),
    'clamps, normalizes, and rounds compact output'
  );

  converted.destroy();
  source.destroy();
  device.destroy();
  t.end();
});

test('castData WebGPU matches the CPU fallback', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('Skipping castData WebGPU test without hardware WebGPU');
    t.end();
    return;
  }
  const source = GPUDataEvaluator.fromArray(new Float32Array([-1, 0.5, 0.25, 2]), {
    type: 'float32',
    size: 2
  });
  const converted = castData(source, {
    inputFormat: 'float32x2',
    outputFormat: 'unorm8x2'
  });
  const result = await converted.evaluate(device, {format: 'unorm8x2'});
  const values = await result.data[0].buffer.readAsync(0, 4);

  t.deepEqual(
    new Uint8Array(values.buffer, values.byteOffset, values.byteLength),
    new Uint8Array([0, 128, 64, 255]),
    'matches compact CPU conversion bytes'
  );

  converted.destroy();
  source.destroy();
  device.destroy();
  t.end();
});
