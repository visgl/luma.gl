// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUDataEvaluator, add, multiply} from '@luma.gl/gpgpu';
import {GPUSimpleGraph} from '@luma.gl/gpu-graph/gpu-simple-graph';

for (const [backend, getDevice] of [
  ['webgl', getWebGLTestDevice],
  ['webgpu', getWebGPUTestDevice]
] as const) {
  it(`GPUSimpleGraph executes a row map on ${backend} without graph-managed readback`, async () => {
    const device = await getDevice();
    const graph = new GPUSimpleGraph(device);
    const source = graph.add(
      'source',
      GPUDataEvaluator.fromArray(new Float32Array([1, 2, 3]), {size: 1})
    );
    const output = graph.add('output', add(multiply(source, 2), 1));
    const compiled = graph.compile();
    try {
      const result = await compiled.run();
      expect(result.output.length).toBe(3);
      expect(output.value).toBeUndefined();
      expect(Array.from(await output.readValue())).toEqual([3, 5, 7]);
    } finally {
      output.destroy();
      source.destroy();
    }
  });
}
