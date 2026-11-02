// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {
  GPUGraph,
  gpuGraph,
  GPUUploadOperation,
  GPUCopyOperation,
  GPUCompactionOperation,
  GPUExpressionOperation
} from '@luma.gl/graph';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';

async function read(vector: GPUVector): Promise<number[]> {
  return (
    await Promise.all(
      vector.data.map(async chunk => {
        if (!chunk.length) return [];
        const bytes = await chunk.buffer.readAsync(
          chunk.byteOffset,
          chunk.length * chunk.rowByteLength
        );
        const ValueType = vector.format.startsWith('float32') ? Float32Array : Uint32Array;
        return Array.from(new ValueType(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
      })
    )
  ).flat();
}

for (const backend of ['webgpu', 'webgpu-simple', 'webgl-simple']) {
  test(`shared upload/copy compose with expressions (${backend})`, async ({skip}) => {
    const device = await (backend === 'webgl-simple'
      ? getWebGLTestDevice()
      : getWebGPUTestDevice());
    if (!device) return skip();
    const graph = backend === 'webgpu' ? new GPUGraph() : new GPUSimpleGraph();
    graph.add([
      new GPUUploadOperation({
        output: 'uploaded',
        format: 'float32x2',
        data: [new Float32Array([1, 2, 3, 4]), new Float32Array(0), new Float32Array([5, 6])]
      }),
      new GPUCopyOperation({input: 'uploaded', output: 'copied'}),
      new GPUExpressionOperation({output: 'scaled', expression: 'copied * 2'}),
      new GPUCopyOperation({input: 'scaled', output: 'result'})
    ]);
    const compiled = graph.compile(device, {outputs: ['uploaded', 'result']});
    try {
      for (let iteration = 0; iteration < 2; iteration++) {
        const outputs = await compiled.run({});
        try {
          expect(outputs.result.data.map(chunk => chunk.length)).toEqual([2, 0, 1]);
          expect(await read(outputs.result)).toEqual([2, 4, 6, 8, 10, 12]);
          expect(await read(outputs.uploaded)).toEqual([1, 2, 3, 4, 5, 6]);
          expect(outputs.result.data[0].buffer).not.toBe(outputs.uploaded.data[0].buffer);
        } finally {
          Object.values(outputs).forEach(output => output.destroy());
        }
      }
    } finally {
      compiled.destroy();
    }
  });
}

for (const backend of ['webgpu', 'webgpu-simple', 'webgl-simple']) {
  test(`copy respects borrowed input/output offsets (${backend})`, async ({skip}) => {
    const device = await (backend === 'webgl-simple'
      ? getWebGLTestDevice()
      : getWebGPUTestDevice());
    if (!device) return skip();
    const makeVector = (values: number[]) =>
      new GPUVector({
        type: 'data',
        format: 'uint32',
        ownsData: true,
        data: [
          new GPUData({
            format: 'uint32',
            length: 2,
            byteOffset: 4,
            ownsBuffer: true,
            buffer: device.createBuffer({
              data: new Uint32Array(values),
              usage: Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_SRC | Buffer.COPY_DST
            })
          })
        ]
      });
    const input = makeVector([99, 7, 8, 99]);
    const target = makeVector([88, 0, 0, 88]);
    const graph = backend === 'webgpu' ? new GPUGraph() : new GPUSimpleGraph();
    graph.addInput('input', gpuGraph.vector('uint32'));
    graph.add(new GPUCopyOperation({input: 'input', output: 'result'}));
    const compiled = graph.compile(device);
    try {
      const outputs = await compiled.run({inputs: {input}, outputTargets: {result: target}});
      expect(outputs.result).toBe(target);
      expect(await read(target)).toEqual([7, 8]);
      const bytes = await target.data[0].buffer.readAsync();
      expect(Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, 4))).toEqual([
        88, 7, 8, 88
      ]);
      expect(await read(input)).toEqual([7, 8]);
      await expect(compiled.run({inputs: {input}, outputTargets: {result: input}})).rejects.toThrow(
        'alias'
      );
      compiled.destroy();
      expect(input.data[0].buffer.destroyed).toBe(false);
      expect(target.data[0].buffer.destroyed).toBe(false);
    } finally {
      compiled.destroy();
      input.destroy();
      target.destroy();
    }
  });
}

for (const flags of [[0, 2, 0, 7, 1], [0, 0, 0, 0, 0], [1, 1, 1, 1, 1], []]) {
  test(`GPU compaction capacity/count with flags ${flags}`, async ({skip}) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    const graph = new GPUGraph();
    const input = flags.map((_, index) => index + 10);
    const split = (values: number[]) => [
      new Uint32Array(values.slice(0, 2)),
      new Uint32Array(0),
      new Uint32Array(values.slice(2))
    ];
    graph.add([
      new GPUUploadOperation({output: 'input', format: 'uint32', data: split(input)}),
      new GPUUploadOperation({output: 'flags', format: 'uint32', data: split(flags)}),
      new GPUCompactionOperation({
        input: 'input',
        flags: 'flags',
        output: 'selected',
        count: 'count'
      }),
      new GPUCopyOperation({input: 'selected', output: 'copied'}),
      new GPUExpressionOperation({output: 'twiceCount', expression: 'float32(count) * 2'})
    ]);
    const compiled = graph.compile(device, {outputs: ['copied', 'count', 'twiceCount']});
    const submit = vi.spyOn(device, 'submit');
    const execution = compiled.prepare({});
    const encoder = device.createCommandEncoder();
    try {
      expect(submit).not.toHaveBeenCalled();
      execution.encode(encoder);
      expect(submit).not.toHaveBeenCalled();
      device.submit(encoder.finish());
      execution.destroy();
      const accepted = input.filter((_, index) => flags[index] !== 0);
      expect(execution.outputs.copied.length).toBe(input.length);
      expect(execution.outputs.copied.data.map(chunk => chunk.length)).toEqual(
        split(input).map(chunk => chunk.length)
      );
      expect(await read(execution.outputs.count)).toEqual([accepted.length]);
      expect(await read(execution.outputs.twiceCount)).toEqual([accepted.length * 2]);
      expect((await read(execution.outputs.copied)).slice(0, accepted.length)).toEqual(accepted);
    } finally {
      submit.mockRestore();
      execution.destroy();
      encoder.destroy();
      Object.values(execution.outputs).forEach(output => output.destroy());
      compiled.destroy();
    }
  });
}
