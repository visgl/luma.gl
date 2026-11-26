// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {
  GPUGraph,
  GPUCPUOperation,
  GPUUploadOperation,
  GPUExpressionOperation,
  gpuGraph
} from '@luma.gl/graph';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';

for (const backend of ['webgl', 'webgpu', 'webgpu-graph']) {
  test(`GPU producer → dynamic CPU operation → GPU consumer (${backend})`, async ({skip}) => {
    const device = await (backend === 'webgl' ? getWebGLTestDevice() : getWebGPUTestDevice());
    if (!device) return skip();
    const graph = backend === 'webgpu-graph' ? new GPUGraph() : new GPUSimpleGraph();
    graph.add(
      new GPUUploadOperation({
        output: 'source',
        format: 'float32',
        data: new Float32Array([1, 2, 3])
      })
    );
    graph.add(new GPUExpressionOperation({output: 'doubled', expression: 'source * 2'}));
    graph.add(
      new GPUCPUOperation({
        id: 'expand',
        inputs: {source: 'doubled'},
        outputs: {expanded: gpuGraph.vector('float32')},
        async execute({inputs}) {
          const source = inputs.source;
          if (typeof source === 'number') throw new Error('Expected vector');
          expect(Array.from(source.pack())).toEqual([2, 4, 6]);
          return {expanded: new Float32Array([2, 4, 6, 8])};
        }
      })
    );
    graph.add(new GPUExpressionOperation({output: 'result', expression: 'expanded + 1'}));
    const compiled = graph.compile(device);
    try {
      const outputs = await compiled.run({});
      try {
        expect(outputs.result.length).toBe(4);
        const bytes = await outputs.result.data[0].buffer.readAsync(0, 16);
        expect(Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 4))).toEqual([
          3, 5, 7, 9
        ]);
      } finally {
        outputs.result.destroy();
      }
    } finally {
      compiled.destroy();
    }
  });
}

for (const backend of ['simple', 'graph']) {
  test(`GPU-produced scalar crosses CPU execution stages (${backend})`, async ({skip}) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    const graph = backend === 'graph' ? new GPUGraph() : new GPUSimpleGraph();
    graph.addInput('scale', gpuGraph.scalar('float32'));
    graph.add(new GPUExpressionOperation({output: 'factor', expression: 'scale * 2'}));
    graph.add(
      new GPUCPUOperation({
        id: 'source',
        inputs: {},
        outputs: {source: gpuGraph.vector('float32')},
        execute: () => ({source: new Float32Array([2, 3])})
      })
    );
    graph.add(new GPUExpressionOperation({output: 'result', expression: 'source * factor'}));
    const compiled = graph.compile(device);
    try {
      const outputs = await compiled.run({inputs: {scale: 3}});
      try {
        const bytes = await outputs.result.data[0].buffer.readAsync(0, 8);
        expect(Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 2))).toEqual([12, 18]);
      } finally {
        outputs.result.destroy();
      }
    } finally {
      compiled.destroy();
    }
  });
}
