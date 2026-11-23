// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUGraph, GPUExpressionOperation, gpuGraph} from '@luma.gl/graph';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';

function makeInput(device: Device, chunks: number[][]): GPUVector<'float32'> {
  return new GPUVector({
    type: 'data',
    format: 'float32',
    ownsData: true,
    data: chunks.map(
      values =>
        new GPUData({
          format: 'float32',
          length: values.length,
          ownsBuffer: true,
          buffer: device.createBuffer({
            data: new Float32Array(values.length ? values : [0]),
            usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
          })
        })
    )
  });
}

async function readVector(vector: GPUVector): Promise<number[]> {
  return (
    await Promise.all(
      vector.data.map(async chunk => {
        if (!chunk.length) return [];
        const count = (chunk.length * chunk.rowByteLength) / 4;
        const bytes = await chunk.buffer.readAsync(chunk.byteOffset, count * 4);
        return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, count));
      })
    )
  ).flat();
}

for (const keepIntermediate of [false, true]) {
  test(`reused typed-row intermediates preserve chunks and concurrent results (keep intermediate: ${keepIntermediate})`, async ({
    skip
  }) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    const graph = new GPUGraph();
    graph.addInput('input', gpuGraph.vector('float32'));
    graph.add([
      new GPUExpressionOperation({output: 'first', expression: 'vec2(input, input + 1)'}),
      new GPUExpressionOperation({output: 'second', expression: 'first.x + first.y'}),
      new GPUExpressionOperation({
        output: 'third',
        expression: 'vec3(second, second + 1, second + 2)'
      }),
      new GPUExpressionOperation({output: 'result', expression: 'third * 2'})
    ]);
    const compiled = graph.compile(device, {
      outputs: keepIntermediate ? ['first', 'result'] : ['result']
    });
    try {
      for (const chunks of [[[1, 2], [], [3]], [[4]], [[]], []]) {
        const input = makeInput(device, chunks);
        const first = compiled.prepare({inputs: {input}});
        const second = compiled.prepare({inputs: {input}});
        const encoder = device.createCommandEncoder();
        try {
          first.encode(encoder);
          second.encode(encoder);
          device.submit(encoder.finish());
          first.destroy();
          second.destroy();
          for (const execution of [first, second]) {
            expect(execution.outputs.result.data.map(chunk => chunk.length)).toEqual(
              chunks.map(chunk => chunk.length)
            );
            expect(await readVector(execution.outputs.result)).toEqual(
              chunks.flat().flatMap(value => [4 * value + 2, 4 * value + 4, 4 * value + 6])
            );
            if (keepIntermediate)
              expect(await readVector(execution.outputs.first)).toEqual(
                chunks.flat().flatMap(value => [value, value + 1])
              );
          }
          expect(await readVector(input)).toEqual(chunks.flat());
        } finally {
          first.destroy();
          second.destroy();
          for (const execution of [first, second])
            for (const output of Object.values(execution.outputs)) output.destroy();
          encoder.destroy();
          input.destroy();
        }
      }
    } finally {
      compiled.destroy();
    }
  });
}
