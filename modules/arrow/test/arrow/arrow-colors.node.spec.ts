// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  canConvertColors,
  convertArrowColors,
  convertColors,
  getArrowFixedSizeListValues,
  makeArrowFixedSizeListVector,
  makeGPUVectorFromArrow,
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
  t.ok(
    arrow.DataType.isFixedSizeList(rgbResult.dataType),
    'returns FixedSizeList data type metadata'
  );
  const resultDataType = rgbResult.dataType as arrow.FixedSizeList<arrow.Uint8>;
  t.equal(resultDataType.listSize, 4, 'returns four-channel rows');
  t.ok(resultDataType.children[0].type instanceof arrow.Uint8, 'returns Uint8 child values');
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

test('convertArrowColors preserves chunk boundaries and nullable row validity', async t => {
  const device = new NullDevice({});
  const colorType = new arrow.FixedSizeList(4, new arrow.Field('value', new arrow.Float32(), true));
  const firstChunk = arrow.vectorFromArray([[1, 0.5, 0, 1], null], colorType);
  const secondChunk = arrow.vectorFromArray([[0.25, 0.75, 1, 0.1]], colorType);
  const colors = new arrow.Vector([firstChunk.data[0], secondChunk.data[0]]);

  const result = await convertArrowColors(device, colors);
  const roundTrip = await readArrowGPUVectorAsync(result);

  t.equal(result.data.length, 2, 'preserves Arrow chunk boundaries');
  t.equal(roundTrip.data.length, 2, 'preserves chunks through GPU readback');
  t.deepEqual(Array.from(roundTrip.get(0) as Iterable<number>), [255, 128, 0, 255]);
  t.equal(roundTrip.get(1), null, 'preserves nullable parent rows');
  t.deepEqual(Array.from(roundTrip.get(2) as Iterable<number>), [64, 191, 255, 26]);

  result.destroy();
  device.destroy();
  t.end();
});

test('convertColors borrows sources and transfers output buffers to the returned vector', async t => {
  const device = new NullDevice({});
  const source = makeGPUVectorFromArrow(
    device,
    makeArrowFixedSizeListVector(new arrow.Float32(), 4, new Float32Array([1, 0.5, 0, 1])),
    {format: 'float32x4'}
  );
  const sourceBuffer = source.data[0].buffer;
  const result = await convertColors(device, source);
  const resultBuffer = result.data[0].buffer;

  t.notEqual(resultBuffer, sourceBuffer, 'materializes converted bytes in a distinct allocation');
  t.notOk(sourceBuffer.destroyed, 'does not destroy the caller-owned source buffer');
  t.ok(result.data[0].ownsBuffer, 'returned GPUData is the sole owner of its output buffer');

  result.destroy();
  t.ok(resultBuffer.destroyed, 'destroying the result releases the converted output');
  t.notOk(sourceBuffer.destroyed, 'result destruction leaves the source alive');
  source.destroy();
  t.ok(sourceBuffer.destroyed, 'the source owner can release its buffer independently');
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
