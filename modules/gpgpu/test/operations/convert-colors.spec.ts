// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device, type SignedDataType} from '@luma.gl/core';
import {convertColors, getArrowFixedSizeListValues, readArrowGPUVectorAsync} from '@luma.gl/arrow';
import type {TypedArray} from '@math.gl/types';
import {GPUVector, getArrowDataType} from '@luma.gl/tables';
import {describe, beforeEach, expect, test} from 'vitest';
import {getTestDevice} from './fixtures';

type ConvertColorsTestCase = {
  name: string;
  source: (device: Device) => Promise<GPUVector>;
  expected: number[];
};

for (const deviceType of ['cpu', 'webgpu'] as const) {
  describe(`GPGPU#convertColors#execute:${deviceType}`, () => {
    let device: Device | null;

    beforeEach(async () => {
      device = await getTestDevice(deviceType);
    });

    const TEST_CASES: ConvertColorsTestCase[] = [
      {
        name: 'uint8x3 expands alpha',
        source: device =>
          makeMappedGPUVector(device, new Uint8Array([255, 128, 0, 1, 2, 3]), {
            type: 'uint8',
            size: 3
          }),
        expected: [255, 128, 0, 255, 1, 2, 3, 255]
      },
      {
        name: 'uint8x4 preserves alpha',
        source: device =>
          makeMappedGPUVector(device, new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]), {
            type: 'uint8',
            size: 4
          }),
        expected: [10, 20, 30, 40, 50, 60, 70, 80]
      },
      {
        name: 'float32x3 clips and expands alpha',
        source: device =>
          makeMappedGPUVector(device, new Float32Array([-1, 0, 0.5, 0.25, 0.75, 1.5]), {
            size: 3
          }),
        expected: [0, 0, 128, 255, 64, 191, 255, 255]
      },
      {
        name: 'float32x4 clips and preserves alpha',
        source: device =>
          makeMappedGPUVector(device, new Float32Array([-1, 0, 0.5, 1, 0.25, 0.75, 1.5, 0.1]), {
            size: 4
          }),
        expected: [0, 0, 128, 255, 64, 191, 255, 26]
      },
      {
        name: 'float16x3 decodes, clips, and expands alpha',
        source: device =>
          makeMappedGPUVector(
            device,
            new Uint16Array([
              0xbc00, // -1
              0x0000, // 0
              0x3800, // 0.5
              0x3c00, // 1
              0x3e00, // 1.5
              0x2e66 // ~0.1
            ]),
            {type: 'float16', size: 3}
          ),
        expected: [0, 0, 128, 255, 255, 255, 25, 255]
      },
      {
        name: 'float16x4 decodes, clips, and preserves alpha',
        source: device =>
          makeMappedGPUVector(
            device,
            new Uint16Array([
              0xbc00, // -1
              0x0000, // 0
              0x3800, // 0.5
              0x3c00, // 1
              0x3400, // 0.25
              0x3a00, // 0.75
              0x3e00, // 1.5
              0x2e66 // ~0.1
            ]),
            {type: 'float16', size: 4}
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

        const source = await testCase.source(device);
        const result = await convertColors(device, source);
        const bytes = getArrowFixedSizeListValues(await readArrowGPUVectorAsync(result));

        expect(Array.from(bytes)).toEqual(testCase.expected);
        expect(result.stride).toBe(4);
        expect(result.byteStride).toBe(4);
        expect(result.rowByteLength).toBe(4);

        result.destroy();
        source.destroy();
      });
    }
  });
}

async function makeMappedGPUVector(
  device: Device,
  values: TypedArray,
  props: {type?: SignedDataType; size: number}
): Promise<GPUVector> {
  const buffer = device.createBuffer({
    usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
    byteLength: values.byteLength
  });
  await buffer.mapAndWriteAsync(arrayBuffer => {
    new Uint8Array(arrayBuffer).set(
      new Uint8Array(values.buffer as ArrayBuffer, values.byteOffset, values.byteLength)
    );
  });

  return new GPUVector({
    type: 'buffer',
    name: 'colors',
    buffer,
    dataType: getArrowDataType(props.type ?? 'float32', props.size),
    length: values.length / props.size,
    stride: props.size,
    byteStride: values.BYTES_PER_ELEMENT * props.size,
    rowByteLength: values.BYTES_PER_ELEMENT * props.size,
    ownsBuffer: true
  });
}
