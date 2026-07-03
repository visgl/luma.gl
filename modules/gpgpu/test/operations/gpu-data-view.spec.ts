// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeEach, describe, expect, test} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {add, gather} from '@luma.gl/gpgpu';
import {GPUDataView, makeGPUDataViewFromAttribute} from '@luma.gl/tables';
import {getTestDevice, verifyTableValue} from './fixtures';

for (const deviceType of ['webgl', 'webgpu'] as const) {
  describe(`GPGPU#GPUDataView#execute:${deviceType}`, () => {
    let device: Device | null;

    beforeEach(async () => {
      device = await getTestDevice(deviceType);
    });

    test('arithmetic reads two strided views sharing one interleaved buffer', async t => {
      if (!device) {
        t.skip(`${deviceType} not available`);
        return;
      }

      const source = new Float32Array([1, 2, 10, 20, 3, 4, 30, 40, 5, 6, 50, 60]);
      const buffer = device.createBuffer({
        data: source,
        usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
      });
      const bufferLayout = {
        name: 'pairs',
        byteStride: 16,
        attributes: [
          {attribute: 'left', format: 'float32x2' as const, byteOffset: 0},
          {attribute: 'right', format: 'float32x2' as const, byteOffset: 8}
        ]
      };
      const left = makeGPUDataViewFromAttribute({
        buffer,
        bufferLayout,
        attributeName: 'left',
        length: 3
      });
      const right = makeGPUDataViewFromAttribute({
        buffer,
        bufferLayout,
        attributeName: 'right',
        length: 3
      });
      const result = add(left, right);

      await result.evaluate(device);
      expect(result.offset).toBe(0);
      expect(result.stride).toBe(8);
      expect(result.byteLength).toBe(24);
      expect(
        await verifyTableValue(result, {
          value: [11, 22, 33, 44, 55, 66],
          type: 'float32',
          size: 2
        })
      ).toBe(null);
      expect(Array.from(await buffer.readAsync())).toEqual(
        Array.from(new Uint8Array(source.buffer, source.byteOffset, source.byteLength))
      );

      result.destroy();
      buffer.destroy();
    });

    test('gather reads strided indices and values from one interleaved buffer', async t => {
      if (!device) {
        t.skip(`${deviceType} not available`);
        return;
      }

      const bytes = new ArrayBuffer(48);
      const values = [
        [10, 11],
        [20, 21],
        [30, 31],
        [40, 41]
      ];
      const indices = [2, 0, 3, 1];
      const dataView = new DataView(bytes);
      for (let rowIndex = 0; rowIndex < values.length; rowIndex++) {
        const rowByteOffset = rowIndex * 12;
        dataView.setFloat32(rowByteOffset, values[rowIndex][0], true);
        dataView.setFloat32(rowByteOffset + 4, values[rowIndex][1], true);
        dataView.setUint32(rowByteOffset + 8, indices[rowIndex], true);
      }
      const buffer = device.createBuffer({
        data: new Uint8Array(bytes),
        usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
      });
      const bufferLayout = {
        name: 'indexed-values',
        byteStride: 12,
        attributes: [
          {attribute: 'values', format: 'float32x2' as const, byteOffset: 0},
          {attribute: 'indices', format: 'uint32' as const, byteOffset: 8}
        ]
      };
      const valuesView = makeGPUDataViewFromAttribute({
        buffer,
        bufferLayout,
        attributeName: 'values',
        length: 4
      });
      const indicesView = makeGPUDataViewFromAttribute({
        buffer,
        bufferLayout,
        attributeName: 'indices',
        length: 4
      });
      const result = gather(indicesView, valuesView);

      await result.evaluate(device);
      expect(
        await verifyTableValue(result, {
          value: [30, 31, 10, 11, 40, 41, 20, 21],
          type: 'float32',
          size: 2
        })
      ).toBe(null);

      result.destroy();
      buffer.destroy();
    });
  });
}

describe('GPGPU#GPUDataView', () => {
  test.each([
    'uint8x2',
    'unorm8x4'
  ] as const)('WebGPU reports unsupported %s storage formats', async (format, t) => {
    const device = await getTestDevice('webgpu');
    if (!device) {
      t.skip('webgpu not available');
      return;
    }

    const buffer = device.createBuffer({
      data: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    const result = add(new GPUDataView({buffer, format, length: 2}), 1);

    await expect(result.evaluate(device)).rejects.toThrow(/only support 32-bit/);

    result.destroy();
    buffer.destroy();
  });
});
