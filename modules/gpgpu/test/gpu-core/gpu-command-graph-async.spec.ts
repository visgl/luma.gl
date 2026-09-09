// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ComputePipelineProps} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, test} from 'vitest';

test('GPUCommandGraph#compileAsync starts graph-owned pipelines in parallel', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const originalCreateComputePipelineAsync = device.createComputePipelineAsync.bind(device);
  let startedPipelineCount = 0;
  let releasePipelines!: () => void;
  const pipelineGate = new Promise<void>(resolve => {
    releasePipelines = resolve;
  });
  device.createComputePipelineAsync = async (props: ComputePipelineProps) => {
    startedPipelineCount++;
    await pipelineGate;
    return await originalCreateComputePipelineAsync(props);
  };

  const graph = new GPUCommandGraph(device, {id: 'async-pipeline-compilation'});
  for (const suffix of ['first', 'second']) {
    graph.addComputePass({
      id: suffix,
      compile: ({device: compileDevice}) => {
        const computation = new Computation(compileDevice, {
          id: `async-${suffix}`,
          source: `@compute @workgroup_size(1) fn main() { let ${suffix} = 1u; }`
        });
        return {
          encode: ({computePass}) => computation.dispatch(computePass, 1),
          destroy: () => computation.destroy()
        };
      }
    });
  }

  try {
    const compilationPromise = graph.compileAsync();
    await Promise.resolve();
    expect(startedPipelineCount).toBe(2);
    releasePipelines();
    const compiled = await compilationPromise;
    compiled.destroy();
  } finally {
    device.createComputePipelineAsync = originalCreateComputePipelineAsync;
  }
});
