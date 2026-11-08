// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {
  GPUDataEvaluator,
  convertColorData,
  GPUEvaluationScope
} from '@luma.gl/graph/gpu-simple-graph';
import {fromHalfFloat} from '@luma.gl/shaders';
import {
  convertArrowColors,
  makeArrowFixedSizeListVector,
  planArrowGPUConversion,
  convertArrowToGPUVector
} from '@luma.gl/graph/arrow';
import * as arrow from 'apache-arrow';

for (const format of ['unorm8x4', 'float16x4', 'float32x4'] as const) {
  test(`scoped color conversion writes ${format} with one caller submission and no readback`, async ({
    skip
  }) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    const source = GPUDataEvaluator.fromArray(new Float32Array([-2, 4, 0.5, 0, 1, 2]), {size: 3});
    const result = convertColorData(source, {format});
    const scope = new GPUEvaluationScope(device);
    const submit = vi.spyOn(device, 'submit');
    try {
      const vector = await scope.evaluate(result);
      expect(vector.format).toBe(format);
      expect(vector.data[0].byteStride).toBe(
        format === 'unorm8x4' ? 4 : format === 'float16x4' ? 8 : 16
      );
      expect(submit).not.toHaveBeenCalled();
      scope.submit();
      expect(submit).toHaveBeenCalledTimes(1);
      const values = await result.readValue();
      expect(
        format === 'float16x4'
          ? Array.from(
              new Uint16Array(values.buffer, values.byteOffset, values.byteLength / 2),
              fromHalfFloat
            )
          : Array.from(values)
      ).toEqual(
        format === 'unorm8x4' ? [0, 255, 128, 255, 0, 255, 255, 255] : [-2, 4, 0.5, 1, 0, 1, 2, 1]
      );
    } finally {
      scope.cancel();
      submit.mockRestore();
      result.destroy();
      source.destroy();
    }
  });
}

test('Arrow prefer-cpu performs only output upload even on WebGPU', async ({skip}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const source = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    3,
    new Float32Array([-2, 3, 0.5])
  );
  const plan = planArrowGPUConversion(device, source, {
    semantic: 'color',
    format: 'float16x4',
    policy: 'prefer-cpu'
  });
  expect(plan.backend).toBe('cpu');
  expect(plan.cost.gpuPassCount).toBe(0);
  const submit = vi.spyOn(device, 'submit');
  const allocate = vi.spyOn(device, 'createBuffer');
  const prepared = await convertArrowToGPUVector(device, source, {
    semantic: 'color',
    format: 'float16x4',
    policy: 'prefer-cpu'
  });
  try {
    expect(submit).not.toHaveBeenCalled();
    expect(allocate).toHaveBeenCalledTimes(1);
    const bytes = await prepared.vector.data[0].buffer.readAsync();
    expect(Array.from(new Uint16Array(bytes.buffer, bytes.byteOffset, 4), fromHalfFloat)).toEqual([
      -2, 3, 0.5, 1
    ]);
  } finally {
    submit.mockRestore();
    allocate.mockRestore();
    prepared.destroy();
  }
});

for (const format of ['float16x4', 'float32x4'] as const) {
  test(`Arrow GPU conversion produces ${format} without a source readback`, async ({skip}) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    const source = makeArrowFixedSizeListVector(
      new arrow.Uint8(),
      3,
      new Uint8Array([255, 0, 255])
    );
    const output = await convertArrowColors(device, source, {format});
    try {
      const bytes = await output.data[0].buffer.readAsync();
      expect(
        format === 'float16x4'
          ? Array.from(new Uint16Array(bytes.buffer, bytes.byteOffset, 4), fromHalfFloat)
          : Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 4))
      ).toEqual([1, 0, 1, 1]);
    } finally {
      output.destroy();
    }
  });
}
