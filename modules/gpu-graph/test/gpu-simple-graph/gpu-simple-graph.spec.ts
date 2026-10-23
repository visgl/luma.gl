// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {expect, it} from 'vitest';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUDataEvaluator, add, multiply} from '@luma.gl/gpgpu';
import {GPUSimpleGraph, GPUSimpleGraphOperation} from '@luma.gl/gpu-graph/gpu-simple-graph';
import {
  GPUProgram,
  GPUProgramScalarLiteral,
  GPUProgramVectorMADD,
  GPUProgramCompiler,
  composite
} from '@luma.gl/gpu-graph/gpu-core';

for (const [backend, getDevice] of [
  ['webgl', getWebGLTestDevice],
  ['webgpu', getWebGPUTestDevice]
] as const) {
  it(`GPUSimpleGraph executes a row map on ${backend} without graph-managed readback`, async () => {
    const device = await getDevice();
    const graph = new GPUSimpleGraph(device);
    const source = graph.addEvaluator(
      'source',
      GPUDataEvaluator.fromArray(new Float32Array([1, 2, 3]), {size: 1})
    );
    const output = add(multiply(source, 2), 1);
    graph.add([
      composite([new GPUSimpleGraphOperation({id: 'output', evaluator: output})], {id: 'map'})
    ]);
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

for (const [backend, getDevice] of [
  ['webgl', getWebGLTestDevice],
  ['webgpu', getWebGPUTestDevice]
] as const) {
  it(`executes unchanged semantic operations with chunked bindings on ${backend}`, async () => {
    const device = await getDevice();
    const buffers: Buffer[] = [];
    const makeChunk = (values: number[]) => {
      const buffer = device.createBuffer({
        data: new Float32Array(values),
        usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
      });
      buffers.push(buffer);
      return new GPUData({buffer, format: 'float32', length: values.length});
    };
    const bindings = {vectors: {input: [makeChunk([1, 2]), makeChunk([3, 4])]}};
    const program = new GPUProgram();
    const input = program.vector('input', 'float32', 4, {external: true, chunkLengths: [2, 2]});
    const output = program.vector('output', 'float32', 4, {chunkLengths: [2, 2]});
    const scale = program.scalar('scale', 'float32');
    program.add(
      composite([
        new GPUProgramScalarLiteral({output: scale, value: 2}),
        new GPUProgramVectorMADD({input, addend: input, output, scale})
      ])
    );
    const compiled = new GPUSimpleGraph(device)
      .add(program.operations)
      .compile({bindings, outputs: ['output']});
    try {
      expect(compiled.operationTree).toEqual(program.operationTree);
      const result = await compiled.run();
      expect(result.output.data.map(chunk => chunk.length)).toEqual([2, 2]);
      const values: number[] = [];
      for (const chunk of result.output.data) {
        const reader = GPUDataEvaluator.fromGPUData(chunk);
        values.push(...(await reader.readValue()));
        reader.destroy();
      }
      expect(values).toEqual([3, 6, 9, 12]);
      expect((await compiled.run()).output).toBe(result.output);
      if (backend === 'webgpu') {
        // The identical program and bindings are accepted by the unchanged full compiler.
        const fullCompilation = new GPUProgramCompiler(device).compile(program, bindings);
        const fullGraph = fullCompilation.graph.compile();
        try {
          const encoder = device.createCommandEncoder();
          fullGraph.encode(encoder, {parameters: undefined});
          device.submit(encoder.finish());
        } finally {
          fullGraph.destroy();
        }
      }
    } finally {
      compiled.destroy();
      for (const buffer of buffers) buffer.destroy();
    }
  });
}
