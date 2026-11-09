// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {convertArrowColumnToGPUVector} from '@luma.gl/graph/arrow';
import * as arrow from 'apache-arrow';

for (const backend of ['webgl', 'webgpu'] as const) {
  test(`Arrow column uploads validity and transformed values on ${backend}`, async ({skip}) => {
    const device = backend === 'webgpu' ? await getWebGPUTestDevice() : await getWebGLTestDevice();
    if (!device) {
      skip();
      return;
    }
    const source = arrow.vectorFromArray([1.00000001, null], new arrow.Float64());
    const result = convertArrowColumnToGPUVector(device, source, {
      name: 'positions',
      format: 'float32',
      color: false,
      preserveNulls: true,
      fp64: true,
      transform: value => [value[0] + 1]
    });
    try {
      const read = async (vector: typeof result.vector) => {
        const chunk = vector.data[0];
        const bytes = await chunk.buffer.readAsync();
        return bytes;
      };
      const highBytes = await read(result.vector);
      const lowBytes = await read(result.residualVector!);
      const validBytes = await read(result.validityVector!);
      expect(
        new Float32Array(highBytes.buffer, highBytes.byteOffset, 2)[0] +
          new Float32Array(lowBytes.buffer, lowBytes.byteOffset, 2)[0]
      ).toBeCloseTo(2.00000001, 14);
      expect(Array.from(new Uint32Array(validBytes.buffer, validBytes.byteOffset, 2))).toEqual([
        1, 0
      ]);
    } finally {
      result.destroy();
    }
  });
}
