// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeEach, describe, expect, test} from 'vitest';
import type {Device} from '@luma.gl/core';
import {GPUTableEvaluator, pickInterleaved, scatterInterleaved} from '@luma.gl/gpgpu';
import {GPUTable, makeInterleavedGPUVector} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import {getTestDevice} from './fixtures';

for (const deviceType of ['cpu', 'webgl'] as const) {
  describe(`GPGPU#scatterInterleaved#execute:${deviceType}`, () => {
    let device: Device | null;

    beforeEach(async () => {
      device = await getTestDevice(deviceType);
    });

    test('scatters primitive columns into mixed-format interleaved bytes', async t => {
      if (!device) {
        t.skip(`${deviceType} not available`);
        return;
      }

      const colors = GPUTableEvaluator.fromArray(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]), {
        type: 'uint8',
        size: 4
      });
      const positions = GPUTableEvaluator.fromArray(new Float32Array([0, 1, 2, 3, 4, 5]), {
        type: 'float32',
        size: 3
      });
      const vertices = scatterInterleaved(
        {colors, positions},
        {
          name: 'vertices',
          fields: {
            colors: 'unorm8x4',
            positions: 'float32x3'
          }
        }
      );

      const vector = await vertices.evaluate(device);
      const bytes = await vector.data[0].buffer.readAsync(0, vector.length * vector.byteStride);

      expect(vector.interleavedFields).toEqual({colors: 'unorm8x4', positions: 'float32x3'});
      expect(vector.bufferLayout).toEqual({
        name: 'vertices',
        byteStride: 16,
        attributes: [
          {attribute: 'colors', format: 'unorm8x4', byteOffset: 0},
          {attribute: 'positions', format: 'float32x3', byteOffset: 4}
        ]
      });
      expect(Array.from(bytes)).toEqual(Array.from(getExpectedInterleavedBytes()));

      const table = new GPUTable({vectors: {vertices: vector}});
      expect(table.attributes.vertices).toBe(vector.data[0].buffer);

      table.destroy();
      vertices.destroy();
      colors.destroy();
      positions.destroy();
    });
  });
}

describe('GPGPU#scatterInterleaved#pickInterleaved', () => {
  test('returns original primitive source for unevaluated scatter outputs', () => {
    const colors = GPUTableEvaluator.fromArray(new Uint8Array([1, 2, 3, 4]), {
      type: 'uint8',
      size: 4
    });
    const positions = GPUTableEvaluator.fromArray(new Float32Array([0, 1, 2]), {
      type: 'float32',
      size: 3
    });
    const vertices = scatterInterleaved(
      {colors, positions},
      {
        name: 'vertices',
        fields: {
          colors: 'unorm8x4',
          positions: 'float32x3'
        }
      }
    );

    expect(pickInterleaved(vertices, 'positions')).toBe(positions);

    vertices.destroy();
    colors.destroy();
    positions.destroy();
  });

  test('creates zero-copy primitive views over existing interleaved vectors', () => {
    const device = new NullDevice({});
    const vertices = makeInterleavedGPUVector({
      name: 'vertices',
      buffer: device.createBuffer({byteLength: 32}),
      length: 2,
      fields: {
        colors: 'unorm8x4',
        positions: 'float32x3'
      },
      ownsBuffer: true
    });
    const positions = pickInterleaved(vertices, 'positions');

    expect(positions.type).toBe('float32');
    expect(positions.size).toBe(3);
    expect(positions.offset).toBe(4);
    expect(positions.stride).toBe(16);
    expect(positions.format).toBe('float32x3');

    vertices.destroy();
  });
});

describe('GPGPU#scatterInterleaved#execute:webgpu', () => {
  let device: Device | null;

  beforeEach(async () => {
    device = await getTestDevice('webgpu');
  });

  test('throws a targeted unsupported-backend error', async t => {
    if (!device) {
      t.skip('webgpu not available');
      return;
    }

    const colors = GPUTableEvaluator.fromArray(new Uint8Array([1, 2, 3, 4]), {
      type: 'uint8',
      size: 4
    });
    const positions = GPUTableEvaluator.fromArray(new Float32Array([0, 1, 2]), {
      type: 'float32',
      size: 3
    });
    const vertices = scatterInterleaved(
      {colors, positions},
      {
        name: 'vertices',
        fields: {
          colors: 'unorm8x4',
          positions: 'float32x3'
        }
      }
    );

    await expect(vertices.evaluate(device)).rejects.toThrow(/WebGPU scatterInterleaved/);

    vertices.destroy();
    colors.destroy();
    positions.destroy();
  });
});

function getExpectedInterleavedBytes(): Uint8Array {
  const bytes = new Uint8Array(32);
  bytes.set([1, 2, 3, 4], 0);
  new Float32Array(bytes.buffer, 4, 3).set([0, 1, 2]);
  bytes.set([5, 6, 7, 8], 16);
  new Float32Array(bytes.buffer, 20, 3).set([3, 4, 5]);
  return bytes;
}
