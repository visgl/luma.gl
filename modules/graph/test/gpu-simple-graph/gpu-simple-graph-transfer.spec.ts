// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {GPUDataEvaluator, GPUEvaluationScope} from '@luma.gl/gpgpu';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {
  GPUSimpleGraph,
  GPUSimpleGraphUploadOperation,
  GPUSimpleGraphCopyOperation
} from '@luma.gl/graph/gpu-simple-graph';

for (const [backend, getDevice] of [
  ['webgl', getWebGLTestDevice],
  ['webgpu', getWebGPUTestDevice]
] as const) {
  it(`uploads and copies into borrowed strided storage on ${backend}`, async ({skip}) => {
    const device = await getDevice();
    if (!device) return skip();
    const target = device.createBuffer({
      data: new Float32Array(10).fill(-1),
      usage: Buffer.COPY_SRC | Buffer.COPY_DST
    });
    const upload = new GPUSimpleGraphUploadOperation({
      id: 'input',
      data: new Float32Array([-1, 1, -1, 2, -1, 3]),
      size: 1,
      offset: 4,
      stride: 8
    });
    const graph = new GPUSimpleGraph(device).add([
      upload,
      new GPUSimpleGraphCopyOperation({id: 'copy', input: 'input'})
    ]);
    const compiled = graph.compile({
      outputs: ['input', 'copy'],
      outputTargets: {copy: {buffer: target, byteOffset: 4, byteStride: 12}}
    });
    try {
      const result = await compiled.run();
      expect(result.copy.data[0].buffer).toBe(target);
      expect(result.input.data[0].buffer).not.toBe(target);
      const bytes = await target.readAsync();
      expect(Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 10))).toEqual([
        -1, 1, -1, -1, 2, -1, -1, 3, -1, -1
      ]);
      const reader = GPUDataEvaluator.fromGPUData(result.copy.data[0]);
      expect(Array.from(await reader.readValue())).toEqual([1, 2, 3]);
      reader.destroy();
      expect((await compiled.run()).copy).toBe(result.copy);
      expect(new Set(compiled.nodes.map(node => node.id)).size).toBe(compiled.nodes.length);
      expect(compiled.nodes.find(node => node.id === compiled.outputNodes.copy)?.operation).toBe(
        'copy'
      );
    } finally {
      compiled.destroy();
      expect(target.destroyed).toBe(false);
      target.destroy();
    }
  });
}

it('records multiple SimpleGraphs and output copies into one scope and rolls back cancellation', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const target = device.createBuffer({
    data: new Float32Array([0, 0]),
    usage: Buffer.COPY_SRC | Buffer.COPY_DST
  });
  const compiled = new GPUSimpleGraph(device)
    .add(new GPUSimpleGraphUploadOperation({id: 'value', data: new Float32Array([5, 6])}))
    .compile({outputTargets: {value: {buffer: target}}});
  const otherGraph = new GPUSimpleGraph(device);
  otherGraph.addEvaluator('shared', compiled.outputs.value);
  const other = otherGraph
    .add(new GPUSimpleGraphCopyOperation({id: 'other', input: 'shared'}))
    .compile();
  const submit = vi.spyOn(device, 'submit');
  let scope = new GPUEvaluationScope(device);
  try {
    await compiled.run({scope});
    expect(submit).not.toHaveBeenCalled();
    expect(() => compiled.destroy()).toThrow();
    await expect(compiled.run()).rejects.toThrow();
    scope.cancel();
    expect(compiled.outputs.value.evaluated).toBe(false);
    const cancelledBytes = await target.readAsync();
    expect(
      Array.from(new Float32Array(cancelledBytes.buffer, cancelledBytes.byteOffset, 2))
    ).toEqual([0, 0]);
    submit.mockClear();
    scope = new GPUEvaluationScope(device);
    await compiled.run({scope});
    const otherResult = await other.run({scope});
    expect(submit).not.toHaveBeenCalled();
    scope.submit();
    expect(submit).toHaveBeenCalledTimes(1);
    const otherReader = GPUDataEvaluator.fromGPUData(otherResult.other.data[0]);
    expect(Array.from(await otherReader.readValue())).toEqual([5, 6]);
    otherReader.destroy();
    const bytes = await target.readAsync();
    expect(Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 2))).toEqual([5, 6]);
    expect((await compiled.run()).value.data[0].buffer).toBe(target);
  } finally {
    scope.cancel();
    submit.mockRestore();
    compiled.destroy();
    other.destroy();
    target.destroy();
  }
});
