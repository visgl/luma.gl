// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {evaluateSimpleGraphExpression} from '../../../../examples/v10/gpgpu/src/simple-graph-expression';
import {expect, it} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {GPUDataEvaluator} from '@luma.gl/gpgpu';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {
  GPUSimpleGraph,
  GPUSimpleGraphValue,
  simpleGraphOperations
} from '@luma.gl/graph/gpu-simple-graph';

for (const [backend, getDevice] of [
  ['webgl', getWebGLTestDevice],
  ['webgpu', getWebGPUTestDevice]
] as const) {
  it(`preserves wide expression output readback in the example on ${backend}`, async ({skip}) => {
    const device = await getDevice();
    if (!device) return skip();
    const coordinates = GPUDataEvaluator.fromArray(new Float32Array([1, 2, 3, 4, 5, 6]), {size: 3});
    const result = await evaluateSimpleGraphExpression(
      device,
      'interleave(coordinates, coordinates)',
      {coordinates}
    );
    try {
      expect(result.output.size).toBe(6);
      expect(Array.from(await result.output.readValue())).toEqual([
        1, 2, 3, 1, 2, 3, 4, 5, 6, 4, 5, 6
      ]);
    } finally {
      result.destroy();
      coordinates.destroy();
    }
  });
  it(`composes graph values, uploads, and borrowed GPU inputs on ${backend}`, async ({skip}) => {
    const device = await getDevice();
    if (!device) return skip();
    const buffer = device.createBuffer({
      data: new Float32Array([2, 4, 8]),
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
    const source = GPUSimpleGraphValue.fromGPUData(
      new GPUData({buffer, format: 'float32', length: 3})
    );
    const indices = GPUSimpleGraphValue.upload(new Uint32Array([2, 0]));
    const graph = new GPUSimpleGraph(device);
    graph.addValue(
      'output',
      simpleGraphOperations.add(simpleGraphOperations.gather(indices, source), 1)
    );
    const compiled = graph.compile();
    try {
      const results = await compiled.run();
      expect(results.output.length).toBe(2);
      const reader = GPUDataEvaluator.fromGPUData(results.output.data[0]);
      expect(Array.from(await reader.readValue())).toEqual([9, 3]);
      reader.destroy();
      expect((await compiled.run()).output).toBe(results.output);
    } finally {
      compiled.destroy();
      expect(buffer.destroyed).toBe(false);
      buffer.destroy();
    }
  });
}
