import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUGroupAggregation,
  GPUHistogram,
  GPUReduction,
  GPUScan
} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUProgram} from '../../src/gpu-core/gpu-program';
import {GPUProgramCompiler} from '../../src/gpu-core/gpu-program-compiler';

it('GPUProgram directly accepts reusable graph-native primitives', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const graph = new GPUCommandGraph(device, {id: 'mixed-program-primitives'});

  const inputBuffer = device.createBuffer({
    id: 'program-primitives-input',
    data: Uint32Array.from([0, 1, 1, 2]),
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const maskBuffer = device.createBuffer({
    id: 'program-primitives-mask',
    data: Uint32Array.from([1, 1, 0, 1]),
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const scanBuffer = device.createBuffer({
    id: 'program-primitives-scan',
    byteLength: 16,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const reductionBuffer = device.createBuffer({
    id: 'program-primitives-reduction',
    byteLength: 4,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const histogramBuffer = device.createBuffer({
    id: 'program-primitives-histogram',
    byteLength: 12,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const groupsBuffer = device.createBuffer({
    id: 'program-primitives-groups',
    byteLength: 12,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });

  const importView = (id: string, buffer: typeof inputBuffer, length: number) => {
    const handle = graph.importBuffer(
      {id, byteLength: buffer.byteLength, usage: buffer.usage},
      buffer
    );
    return graph.createDataView(handle, {format: 'uint32', length});
  };

  const input = importView('input', inputBuffer, 4);
  const mask = importView('mask', maskBuffer, 4);
  const scanOutput = importView('scan-output', scanBuffer, 4);
  const reductionOutput = importView('reduction-output', reductionBuffer, 1);
  const histogramOutput = importView('histogram-output', histogramBuffer, 3);
  const groupOutput = importView('group-output', groupsBuffer, 3);

  const program = new GPUProgram({id: 'primitive-program'});
  program.add([
    new GPUScan({input, output: scanOutput}),
    new GPUReduction({input, mask, output: reductionOutput, operation: 'sum'}),
    new GPUHistogram({input, mask, output: histogramOutput, domain: [0, 2]}),
    new GPUGroupAggregation({keys: input, mask, output: groupOutput, operation: 'count'})
  ]);

  const compiler = new GPUProgramCompiler(device);
  const result = compiler.transform(program, graph);

  expect(result.program.operations).toHaveLength(4);
  expect(result.graph).toBe(graph);
  expect(result.lowering.decisions.map(decision => decision.operationType)).toEqual([
    'legacy-contributor',
    'legacy-contributor',
    'legacy-contributor',
    'legacy-contributor'
  ]);
  expect(graph.nodes.length).toBeGreaterThan(4);

  inputBuffer.destroy();
  maskBuffer.destroy();
  scanBuffer.destroy();
  reductionBuffer.destroy();
  histogramBuffer.destroy();
  groupsBuffer.destroy();
});
