// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {Buffer} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {makeGPUAnalyticsTableFromArrowTable} from '@luma.gl/graph/arrow';
import {
  GPUDataFrame,
  column,
  vector,
  getGPUExpressionLayout,
  type GPUDataFrameQueryParameters
} from '@luma.gl/graph/gpu-dataframe';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {expect, test} from 'vitest';

for (const rowCount of [100_000, 1_000_000]) {
  test(`packed vec3 projection benchmark (${rowCount} rows)`, async () => {
    const device = await getWebGPUTestDevice();
    if (!device) return;
    const input = arrow.tableFromArrays({
      x: new Float32Array(rowCount).fill(1),
      y: new Float32Array(rowCount).fill(2),
      z: new Float32Array(rowCount).fill(3)
    });
    const frame = new GPUDataFrame({
      ...makeGPUAnalyticsTableFromArrowTable(device, input),
      ownership: 'owned'
    });
    const compiled = frame
      .withColumn('position', vector('float32x3', [column('x'), column('y'), column('z')]), {
        format: 'float32x3'
      })
      .select(['position'])
      .compile(new GPUCommandGraph<GPUDataFrameQueryParameters>(device));
    try {
      const chunk = compiled.table.gpuVectors['position'].data[0];
      if (!(chunk.buffer instanceof Buffer)) throw new Error('Expected owned output storage');
      const buffer = chunk.buffer;
      const samples: number[] = [];
      for (let iteration = 0; iteration < 8; iteration++) {
        const start = performance.now();
        const encoder = device.createCommandEncoder();
        compiled.encode(encoder);
        device.submit(encoder.finish());
        // A one-row readback fences this submission. Samples include dispatch and fence overhead.
        const bytes = await buffer.readAsync((rowCount - 1) * 12, 12);
        if (iteration >= 3) samples.push(performance.now() - start);
        expect(Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 3))).toEqual([1, 2, 3]);
      }
      samples.sort((left, right) => left - right);
      const layout = getGPUExpressionLayout('float32x3');
      console.log(
        JSON.stringify({
          rowCount,
          medianEncodeSubmitAndFenceMs: samples[2],
          packedValueBytes: rowCount * layout.packedByteStride,
          equivalentNativeArrayBytes: rowCount * layout.nativeArrayByteStride
        })
      );
    } finally {
      compiled.destroy();
      frame.destroy();
    }
  });
}
