// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  canConvertColors,
  convertArrowColors,
  getArrowFixedSizeListValues,
  makeArrowFixedSizeListVector,
  readArrowGPUVectorAsync
} from '@luma.gl/arrow';
import {backendRegistry} from '@luma.gl/gpgpu';
import * as cpuBackend from '@luma.gl/gpgpu/operations/cpu';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

backendRegistry.add('null', cpuBackend);

test('convertArrowColors uploads Uint8 RGB/RGBA rows and returns a Uint8 RGBA GPUVector', async t => {
  const device = new NullDevice({});
  const rgb = makeArrowFixedSizeListVector(
    new arrow.Uint8(),
    3,
    new Uint8Array([255, 128, 0, 1, 2, 3])
  );
  const rgba = makeArrowFixedSizeListVector(
    new arrow.Uint8(),
    4,
    new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80])
  );

  const rgbResult = await convertArrowColors(device, rgb, {name: 'rgb-colors'});
  const rgbaResult = await convertArrowColors(device, rgba, {name: 'rgba-colors'});

  t.equal(rgbResult.name, 'rgb-colors', 'sets requested vector name');
  t.equal(rgbResult.stride, 4, 'returns RGBA stride');
  t.equal(rgbResult.byteStride, 4, 'returns tightly packed byte stride');
  t.equal(rgbResult.rowByteLength, 4, 'returns tightly packed row byte length');
  const rgbResultType = rgbResult.dataType as arrow.FixedSizeList<arrow.Uint8>;
  t.ok(arrow.DataType.isFixedSizeList(rgbResultType), 'returns FixedSizeList type');
  t.equal(rgbResultType.listSize, 4, 'returns four-channel rows');
  t.ok(rgbResultType.children[0].type instanceof arrow.Uint8, 'returns Uint8 child values');
  t.deepEqual(
    getArrowFixedSizeListValues(await readArrowGPUVectorAsync(rgbResult)),
    new Uint8Array([255, 128, 0, 255, 1, 2, 3, 255]),
    'expands Uint8 RGB alpha to 255'
  );
  t.deepEqual(
    getArrowFixedSizeListValues(await readArrowGPUVectorAsync(rgbaResult)),
    new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]),
    'preserves Uint8 RGBA values'
  );

  rgbResult.destroy();
  rgbaResult.destroy();
  device.destroy();
  t.end();
});

test('convertArrowColors clips Float32 rows and returns a Uint8 RGBA GPUVector', async t => {
  const device = new NullDevice({});
  const colors = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    4,
    new Float32Array([-1, 0, 0.5, 1, 0.25, 0.75, 1.5, 0.1])
  );

  const result = await convertArrowColors(device, colors);

  t.deepEqual(
    getArrowFixedSizeListValues(await readArrowGPUVectorAsync(result)),
    new Uint8Array([0, 0, 128, 255, 64, 191, 255, 26]),
    'clips to [0, 1], scales by 255, and rounds'
  );

  result.destroy();
  device.destroy();
  t.end();
});

test('convertArrowColors decodes Float16 RGB rows and returns a Uint8 RGBA GPUVector', async t => {
  const device = new NullDevice({});
  const colors = makeArrowFixedSizeListVector(
    new arrow.Float16(),
    3,
    new Uint16Array([
      0xbc00, // -1
      0x0000, // 0
      0x3800, // 0.5
      0x3c00, // 1
      0x3e00, // 1.5
      0x2e66 // ~0.1
    ])
  );

  const result = await convertArrowColors(device, colors);

  t.deepEqual(
    getArrowFixedSizeListValues(await readArrowGPUVectorAsync(result)),
    new Uint8Array([0, 0, 128, 255, 255, 255, 25, 255]),
    'decodes Float16 values, clips, scales, and expands alpha'
  );

  result.destroy();
  device.destroy();
  t.end();
});

test('convertArrowColors rejects unsupported color vectors', async t => {
  const device = new NullDevice({});
  const createBuffer = device.createBuffer.bind(device);
  let createBufferCallCount = 0;
  device.createBuffer = (props => {
    createBufferCallCount++;
    return createBuffer(props);
  }) as typeof device.createBuffer;
  const badSize = makeArrowFixedSizeListVector(new arrow.Float32(), 2, new Float32Array([0, 1]));
  const badType = makeArrowFixedSizeListVector(new arrow.Uint16(), 4, new Uint16Array(4));
  const goodType = makeArrowFixedSizeListVector(new arrow.Float32(), 3, new Float32Array(3));

  t.ok(canConvertColors(goodType), 'accepts supported color vectors');
  t.notOk(canConvertColors(badSize), 'rejects unsupported color vector sizes');
  t.notOk(canConvertColors(badType), 'rejects unsupported color vector scalar types');
  await expectRejects(t, convertArrowColors(device, badSize), /not supported/);
  await expectRejects(t, convertArrowColors(device, badType), /not supported/);
  t.equal(createBufferCallCount, 0, 'rejects invalid vectors before uploading');

  device.destroy();
  t.end();
});

async function expectRejects(
  t: {ok: (value: boolean, message?: string) => void},
  promise: Promise<unknown>,
  pattern: RegExp
): Promise<void> {
  try {
    await promise;
    t.ok(false, `Expected rejection matching ${pattern}`);
  } catch (error) {
    t.ok(error instanceof Error && pattern.test(error.message), `Rejects with ${pattern}`);
  }
}
