// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import * as arrow from 'apache-arrow';
import {NullDevice} from '@luma.gl/core/test-utils';
import {CPUData, CPUVector, convertCPUColors} from '@luma.gl/graph/gpu-data';
import {fromHalfFloat} from '@luma.gl/shaders';
import {
  convertArrowColors,
  convertColors,
  convertArrowToGPUVector,
  makeArrowFixedSizeListVector,
  makeGPUVectorFromArrow,
  planArrowGPUConversion,
  readArrowGPUVectorAsync,
  getArrowFixedSizeListValues
} from '@luma.gl/graph/arrow';
import {GPUDataEvaluator, convertColorData, backendRegistry} from '@luma.gl/graph/gpu-simple-graph';
import * as cpuBackend from '@luma.gl/graph/gpu-simple-graph/cpu';

backendRegistry.add('null', cpuBackend);

const acceptedFormats = ['unorm8x4', 'float16x4', 'float32x4'] as const;

test('preservation borrows compatible GPU storage and rejects implicit lossy fallback', async () => {
  const device = new NullDevice({});
  const input = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    4,
    new Float32Array([-2, 3, 0.5, 1])
  );
  const source = makeGPUVectorFromArrow(device, input);
  const allocate = vi.spyOn(device, 'createBuffer');
  const readback = vi.spyOn(source.data[0].buffer, 'readAsync');
  const plan = planArrowGPUConversion(device, source, {
    semantic: 'color',
    format: 'preserve',
    acceptedFormats
  });
  expect(plan.strategy).toBe('borrow');
  expect(plan.cost.targetByteLength).toBe(16);
  const prepared = await convertArrowToGPUVector(device, source, {
    semantic: 'color',
    format: 'preserve',
    acceptedFormats
  });
  expect(prepared.vector).toBe(source);
  prepared.destroy();
  const wrapper = await convertColors(device, source, {format: 'preserve', acceptedFormats});
  expect(wrapper.data[0].buffer).toBe(source.data[0].buffer);
  wrapper.destroy();
  expect(allocate).not.toHaveBeenCalled();
  expect(readback).not.toHaveBeenCalled();
  expect(source.data[0].buffer.destroyed).toBe(false);
  expect(() =>
    planArrowGPUConversion(device, source, {
      semantic: 'color',
      format: 'preserve',
      acceptedFormats: ['unorm8x4']
    })
  ).toThrow('not accepted');
  expect(
    planArrowGPUConversion(device, source, {
      semantic: 'color',
      format: 'preserve',
      acceptedFormats: ['float16x4'],
      fallbackFormat: 'float16x4'
    }).targetFormat
  ).toBe('float16x4');
  allocate.mockRestore();
  readback.mockRestore();
  source.destroy();
  device.destroy();
});

test('CPUVector conversion preserves chunks, offsets, validity and HDR; half rounding is ties-to-even', () => {
  const values = new Float32Array([99, -2, 3, 1.00048828125, 99, 0, 1.00146484375, 65504]);
  const source = new CPUVector({
    format: 'float32x3',
    data: [
      new CPUData({
        buffer: values,
        format: 'float32x3',
        length: 2,
        byteOffset: 4,
        byteStride: 16,
        nullBitmap: new Uint8Array([1])
      }),
      new CPUData({buffer: new Float32Array(0), format: 'float32x3', length: 0})
    ]
  });
  const result = convertCPUColors(source, {format: 'float16x4'});
  expect(result.format).toBe('float16x4');
  expect(result.data.map(chunk => chunk.length)).toEqual([2, 0]);
  expect(Array.from(new Uint16Array(result.data[0].buffer), fromHalfFloat)).toEqual([
    -2, 3, 1, 1, 0, 1.001953125, 65504, 1
  ]);
  expect(result.data[0].nullBitmap).toEqual(new Uint8Array([1]));
  expect(result.data[0].nullBitmap).not.toBe(source.data[0].nullBitmap);
  expect(Array.from(values)).toEqual([99, -2, 3, 1.00048828125, 99, 0, 1.00146484375, 65504]);
  const preserved = convertCPUColors(result, {format: 'preserve', acceptedFormats});
  expect(preserved.data[0]).toBe(result.data[0]);
});

for (const format of ['float16x4', 'float32x4'] as const) {
  test(`Arrow RGB to ${format} preserves HDR with one output upload per chunk`, async () => {
    const device = new NullDevice({});
    const source = new arrow.Vector([
      makeArrowFixedSizeListVector(new arrow.Float32(), 3, new Float32Array([-2, 4, 0.5])).data[0],
      makeArrowFixedSizeListVector(new arrow.Float32(), 3, new Float32Array([1, 2, 3])).data[0]
    ]);
    const allocate = vi.spyOn(device, 'createBuffer');
    const result = await convertArrowColors(device, source, {format});
    expect(result.data.map(chunk => chunk.length)).toEqual([1, 1]);
    expect(result.byteStride).toBe(format === 'float16x4' ? 8 : 16);
    expect(allocate).toHaveBeenCalledTimes(2);
    const bytes = await result.data[0].buffer.readAsync();
    expect(
      format === 'float16x4'
        ? Array.from(new Uint16Array(bytes.buffer, bytes.byteOffset, 4), fromHalfFloat)
        : Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 4))
    ).toEqual([-2, 4, 0.5, 1]);
    expect((await readArrowGPUVectorAsync(result)).type.children[0].type).toBeInstanceOf(
      format === 'float16x4' ? arrow.Float16 : arrow.Float32
    );
    result.destroy();
    allocate.mockRestore();
    device.destroy();
  });
}

test('Uint8 colors normalize into Float16 and Float16 preserves/uploads without conversion', async () => {
  const device = new NullDevice({});
  const rgb = makeArrowFixedSizeListVector(new arrow.Uint8(), 3, new Uint8Array([255, 0, 255]));
  const converted = await convertArrowColors(device, rgb, {format: 'float16x4'});
  const half = await readArrowGPUVectorAsync<arrow.FixedSizeList<arrow.Float16>>(converted);
  expect(Array.from(getArrowFixedSizeListValues(half), fromHalfFloat)).toEqual([1, 0, 1, 1]);
  const plan = planArrowGPUConversion(device, half, {
    semantic: 'color',
    format: 'preserve',
    acceptedFormats
  });
  expect(plan.targetFormat).toBe('float16x4');
  expect(plan.strategy).toBe('upload');
  const compact = planArrowGPUConversion(
    device,
    makeArrowFixedSizeListVector(new arrow.Float32(), 4, new Float32Array(8)),
    {semantic: 'color', format: 'float16x4'}
  );
  expect(compact.cost.targetByteLength).toBe(16);
  expect(compact.cost.sourceByteLength).toBe(32);
  expect(compact.warnings.join(' ')).toContain('binary16');
  converted.destroy();
  device.destroy();
});

test('Float16 RGB preserve expands alpha without quantization and nullable slices retain validity', async () => {
  const device = new NullDevice({});
  const halfRGB = makeArrowFixedSizeListVector(
    new arrow.Float16(),
    3,
    new Uint16Array([0xc000, 0x4400, 0x3800])
  );
  const result = await convertArrowColors(device, halfRGB, {format: 'preserve', acceptedFormats});
  expect(result.format).toBe('float16x4');
  expect(
    Array.from(
      getArrowFixedSizeListValues(
        await readArrowGPUVectorAsync<arrow.FixedSizeList<arrow.Float16>>(result)
      ),
      fromHalfFloat
    )
  ).toEqual([-2, 4, 0.5, 1]);
  expect(
    planArrowGPUConversion(device, halfRGB, {
      semantic: 'color',
      format: 'preserve',
      acceptedFormats
    }).targetFormat
  ).toBe('float16x4');
  const nullable = arrow
    .vectorFromArray(
      [[0, 0, 0, 1], null, [-2, 4, 0.5, 1]],
      new arrow.FixedSizeList(4, new arrow.Field('value', new arrow.Float32(), true))
    )
    .slice(1);
  const converted = await convertArrowColors(device, nullable, {format: 'float16x4'});
  const readback = await readArrowGPUVectorAsync(converted);
  expect(readback.length).toBe(2);
  expect(readback.isValid(0)).toBe(false);
  expect(readback.isValid(1)).toBe(true);
  result.destroy();
  converted.destroy();
  device.destroy();
});

test('GPU conversion releases prior output allocations when a later allocation fails', async () => {
  const device = new NullDevice({});
  const input = new arrow.Vector([
    makeArrowFixedSizeListVector(new arrow.Float32(), 3, new Float32Array([1, 2, 3])).data[0],
    makeArrowFixedSizeListVector(new arrow.Float32(), 3, new Float32Array([4, 5, 6])).data[0]
  ]);
  const source = makeGPUVectorFromArrow(device, input);
  const create = device.createBuffer.bind(device);
  let first: ReturnType<typeof create> | undefined;
  const allocate = vi
    .spyOn(device, 'createBuffer')
    .mockImplementationOnce(props => {
      first = create(props);
      return first;
    })
    .mockImplementationOnce(() => {
      throw new Error('injected allocation failure');
    });
  await expect(convertColors(device, source, {format: 'float16x4'})).rejects.toThrow(
    'injected allocation failure'
  );
  expect(first!.destroyed).toBe(true);
  expect(source.data.every(chunk => !chunk.buffer.destroyed)).toBe(true);
  allocate.mockRestore();
  source.destroy();
  device.destroy();
});

test('binary16 storage handles subnormals, signed zero, infinities and overflow without display clamping', () => {
  const source = new CPUVector({
    format: 'float32x4',
    data: [
      new CPUData({
        format: 'float32x4',
        length: 3,
        buffer: new Float32Array([
          2 ** -24,
          2 ** -25,
          -(2 ** -24),
          -0,
          65504,
          65520,
          -65520,
          Infinity,
          -Infinity,
          NaN,
          1,
          1.00048828125
        ])
      })
    ]
  });
  const result = convertCPUColors(source, {format: 'float16x4'});
  expect(Array.from(new Uint16Array(result.data[0].buffer))).toEqual([
    1, 0, 0x8001, 0x8000, 0x7bff, 0x7c00, 0xfc00, 0x7c00, 0xfc00, 0x7e00, 0x3c00, 0x3c00
  ]);
});

test('CPU color conversion folds null channels into invalid output rows like the GPU path', async () => {
  const device = new NullDevice({});
  const source = arrow.vectorFromArray(
    [
      [1, null, 0.5, 1],
      [2, 3, 4, 1]
    ],
    new arrow.FixedSizeList(4, new arrow.Field('value', new arrow.Float32(), true))
  );
  for (const format of ['unorm8x4', 'float16x4', 'float32x4'] as const) {
    const result = await convertArrowColors(device, source, {format});
    const readback = await readArrowGPUVectorAsync(result);
    expect(readback.isValid(0)).toBe(false);
    expect(readback.isValid(1)).toBe(true);
    result.destroy();
  }
  device.destroy();
});

test('array-backed and constant colors derive storage formats on CPU, including RGB aliases', async () => {
  const device = new NullDevice({});
  const sources = [
    GPUDataEvaluator.fromArray(new Float32Array([1, 0.5, 0]), {size: 3}),
    GPUDataEvaluator.fromConstant([1, 0.5, 0]),
    GPUDataEvaluator.fromArray(new Uint8Array([255, 128, 0]), {size: 3}),
    GPUDataEvaluator.fromArray(new Uint16Array([0x3c00, 0x3800, 0]), {size: 3, type: 'float16'})
  ];
  for (let index = 0; index < sources.length; index++) {
    const source = sources[index];
    expect(source.format).toBeUndefined();
    const output = convertColorData(source, {format: 'float32x4'});
    await output.evaluate(device);
    expect(Array.from(await output.readValue())).toEqual([
      1,
      index === 2 ? Math.fround(128 / 255) : 0.5,
      0,
      1
    ]);
    output.destroy();
    source.destroy();
  }
  device.destroy();
});
