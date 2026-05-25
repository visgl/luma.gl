// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device, type VertexFormat} from '@luma.gl/core';
import {convertColorData, type ColorInputFormat} from '@luma.gl/gpgpu';
import {GPUData, GPUDataView} from '@luma.gl/tables';
import type {TypedArray} from '@math.gl/types';
import {beforeEach, describe, expect, test} from 'vitest';
import {getTestDevice} from './fixtures';

type ColorSource = {
  input: GPUData | GPUDataView;
  destroy: () => void;
};

type ConvertColorsTestCase = {
  name: string;
  source: (device: Device) => ColorSource;
  inputFormat?: ColorInputFormat;
  expected: number[];
};

for (const deviceType of ['cpu', 'webgpu'] as const) {
  describe(`GPGPU#convertColorData#execute:${deviceType}`, () => {
    let device: Device | null;

    beforeEach(async () => {
      device = await getTestDevice(deviceType);
    });

    const TEST_CASES: ConvertColorsTestCase[] = [
      {
        name: 'GPUData uint8x3 expands alpha',
        source: device =>
          makeGPUDataSource(device, new Uint8Array([255, 128, 0, 1, 2, 3]), 'uint8x3-webgl'),
        expected: [255, 128, 0, 255, 1, 2, 3, 255]
      },
      {
        name: 'GPUData uint8x4 preserves alpha',
        source: device =>
          makeGPUDataSource(device, new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]), 'uint8x4'),
        expected: [10, 20, 30, 40, 50, 60, 70, 80]
      },
      {
        name: 'GPUDataView float32x3 clips and expands alpha',
        source: device =>
          makeStridedGPUDataViewSource(
            device,
            new Float32Array([99, -1, 0, 0.5, 99, 0.25, 0.75, 1.5]),
            'float32x3',
            4,
            16
          ),
        expected: [0, 0, 128, 255, 64, 191, 255, 255]
      },
      {
        name: 'GPUData float32x4 clips and preserves alpha',
        source: device =>
          makeGPUDataSource(
            device,
            new Float32Array([-1, 0, 0.5, 1, 0.25, 0.75, 1.5, 0.1]),
            'float32x4'
          ),
        expected: [0, 0, 128, 255, 64, 191, 255, 26]
      },
      {
        name: 'GPUData float16x3 storage decodes, clips, and expands alpha',
        source: device =>
          makeGPUDataSource(
            device,
            new Uint16Array([0xbc00, 0x0000, 0x3800, 0x3c00, 0x3e00, 0x2e66]),
            'uint16x3-webgl'
          ),
        inputFormat: 'float16x3',
        expected: [0, 0, 128, 255, 255, 255, 25, 255]
      },
      {
        name: 'GPUData float16x4 decodes, clips, and preserves alpha',
        source: device =>
          makeGPUDataSource(
            device,
            new Uint16Array([
              0xbc00,
              0x0000,
              0x3800,
              0x3c00,
              0x3400,
              0x3a00,
              0x3e00,
              0x2e66
            ]),
            'float16x4'
          ),
        expected: [0, 0, 128, 255, 64, 191, 255, 25]
      }
    ];

    for (const testCase of TEST_CASES) {
      test(testCase.name, async t => {
        if (!device) {
          t.skip(`${deviceType} not available`);
          return;
        }

        const source = testCase.source(device);
        const result = convertColorData(source.input, {inputFormat: testCase.inputFormat});
        await result.evaluate(device);

        expect(Array.from(await result.readValue())).toEqual(testCase.expected);
        expect(result.format).toBe('unorm8x4');
        expect(result.size).toBe(4);
        expect(result.stride).toBe(4);

        result.destroy();
        source.destroy();
      });
    }
  });
}

function makeGPUDataSource(
  device: Device,
  values: TypedArray,
  format: VertexFormat
): ColorSource {
  const buffer = device.createBuffer({
    usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
    data: values
  });
  const data = new GPUData({
    buffer,
    format,
    length: values.byteLength / getFormatByteLength(format),
    ownsBuffer: true
  });
  return {input: data, destroy: () => data.destroy()};
}

function makeStridedGPUDataViewSource(
  device: Device,
  values: TypedArray,
  format: VertexFormat,
  byteOffset: number,
  byteStride: number
): ColorSource {
  const buffer = device.createBuffer({
    usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
    data: values
  });
  const view = new GPUDataView({buffer, format, length: 2, byteOffset, byteStride});
  return {input: view, destroy: () => buffer.destroy()};
}

function getFormatByteLength(format: VertexFormat): number {
  switch (format) {
    case 'uint8x3-webgl':
      return 3;
    case 'uint8x4':
      return 4;
    case 'uint16x3-webgl':
      return 6;
    case 'float16x4':
      return 8;
    case 'float32x4':
      return 16;
    default:
      throw new Error(`Unhandled test format ${format}`);
  }
}
