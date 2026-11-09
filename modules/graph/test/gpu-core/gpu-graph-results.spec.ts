// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {
  GPUGraph,
  GPUExpressionOperation,
  gpuGraph,
  type GPUOperationLowering
} from '@luma.gl/graph';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';

function makeVector(device: Device, values: number[][], prefixLength = 0): GPUVector<'float32'> {
  return new GPUVector({
    type: 'data',
    name: 'test',
    format: 'float32',
    ownsData: true,
    data: values.map(
      chunk =>
        new GPUData({
          buffer: device.createBuffer({
            data: new Float32Array([
              ...Array<number>(prefixLength).fill(99),
              ...(chunk.length ? chunk : [0])
            ]),
            usage: Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_SRC | Buffer.COPY_DST
          }),
          format: 'float32',
          length: chunk.length,
          byteOffset: prefixLength * 4,
          ownsBuffer: true
        })
    )
  });
}

async function readVector(vector: GPUVector): Promise<number[]> {
  const values = await Promise.all(
    vector.data.map(async chunk => {
      if (!chunk.length) return [];
      const count = (chunk.length * chunk.rowByteLength) / 4;
      const bytes = await chunk.buffer.readAsync(chunk.byteOffset, count * 4);
      return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, count));
    })
  );
  return values.flat();
}

for (const [backend, getDevice] of [
  ['webgl', getWebGLTestDevice],
  ['webgpu', getWebGPUTestDevice]
] as const) {
  for (const kind of ['simple', 'full'] as const) {
    if (backend === 'webgl' && kind === 'full') continue;
    test(`${kind} infers scalar results and constant typed rows on ${backend}`, async ({skip}) => {
      const device = await getDevice();
      if (!device) return skip();
      const graph = kind === 'simple' ? new GPUSimpleGraph() : new GPUGraph();
      graph.addInput('scale', gpuGraph.scalar('float32'));
      graph.add([
        new GPUExpressionOperation({output: 'computed', expression: 'scale * 2'}),
        new GPUExpressionOperation({output: 'row', expression: 'vec3(scale, computed, 1)'})
      ]);
      const compiled = graph.compile(device);
      try {
        const results = await compiled.run({inputs: {scale: 3}});
        try {
          expect(results.row.format).toBe('float32x3');
          expect(results.row.length).toBe(1);
          expect(await readVector(results.row)).toEqual([3, 6, 1]);
        } finally {
          results.row.destroy();
        }
      } finally {
        compiled.destroy();
      }
    });
    test(`${kind} operation-defined results execute on ${backend}`, async ({skip}) => {
      const device = await getDevice();
      if (!device) return skip();
      const graph = kind === 'simple' ? new GPUSimpleGraph() : new GPUGraph();
      graph.addInput('input', gpuGraph.vector('float32'));
      graph.addInput('factor', gpuGraph.scalar('float32'));
      graph.add([
        new GPUExpressionOperation({output: 'scratch', expression: 'input * factor'}),
        new GPUExpressionOperation({output: 'result', expression: 'scratch + 1'})
      ]);
      const compiled = graph.compile(device);
      try {
        for (const chunks of [[[1, 2], [], [3]], [[4]], [[]], []]) {
          const input = makeVector(device, chunks, 1);
          const target = makeVector(
            device,
            chunks.map(chunk => chunk.map(() => 0))
          );
          try {
            const outputs = await compiled.run({inputs: {input, factor: 2}});
            expect(Object.keys(outputs)).toEqual(['result']);
            expect(await readVector(outputs.result)).toEqual(
              chunks.flat().map(value => value * 2 + 1)
            );
            expect(outputs.result.data.map(chunk => chunk.length)).toEqual(
              chunks.map(chunk => chunk.length)
            );
            outputs.result.destroy();
            const targeted = await compiled.run({
              inputs: {input, factor: 3},
              outputTargets: {result: target}
            });
            expect(targeted.result).toBe(target);
            expect(await readVector(target)).toEqual(chunks.flat().map(value => value * 3 + 1));
            expect(await readVector(input)).toEqual(chunks.flat());
          } finally {
            input.destroy();
            target.destroy();
          }
        }
      } finally {
        compiled.destroy();
      }
    });
  }
}

test('borrowed state persists across runs while operation-owned scratch is private', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const graph = new GPUGraph();
  graph.addState('positions', gpuGraph.vector('float32'));
  graph.addInput('factor', gpuGraph.scalar('float32'));
  graph.add(
    new GPUExpressionOperation({output: 'nextPositions', expression: 'positions * factor'})
  );
  graph.add({
    id: 'commit',
    type: 'commit-state',
    contract: {
      values: [
        {value: 'nextPositions', access: 'read'},
        {value: 'positions', access: 'write'}
      ]
    }
  });
  const lowerings: GPUOperationLowering[] = [
    {
      type: 'commit-state',
      lower: (_operation, context) => {
        const input = context.resolveVector('nextPositions');
        const output = context.resolveVector('positions');
        input.data.forEach((chunk, index) => {
          if (!chunk.length) return;
          const destination = output.data[index];
          context.graph.addCopyPass({
            id: `commit-${index}`,
            resources: [
              {buffer: chunk, usage: 'copy-source'},
              {buffer: destination, usage: 'copy-destination'}
            ],
            compile: () => ({
              encode: ({commandEncoder, getBuffer}) =>
                commandEncoder.copyBufferToBuffer({
                  sourceBuffer: getBuffer(chunk),
                  sourceOffset: chunk.byteOffset,
                  destinationBuffer: getBuffer(destination),
                  destinationOffset: destination.byteOffset,
                  size: chunk.length * 4
                })
            })
          });
        });
      }
    }
  ];
  const compiled = graph.compile(device, {lowerings});
  const positions = makeVector(device, [[1, 2], [], [3]]);
  const submit = vi.spyOn(device, 'submit');
  try {
    await expect(compiled.run({inputs: {factor: 2}})).rejects.toThrow('Missing state binding');
    for (const multiplier of [2, 4]) {
      submit.mockClear();
      const result = await compiled.run({inputs: {factor: 2}, state: {positions}});
      expect(result).toEqual({});
      expect(submit).toHaveBeenCalledTimes(1);
      expect(await readVector(positions)).toEqual([1, 2, 3].map(value => value * multiplier));
    }
    compiled.destroy();
    expect(positions.data[0].buffer.destroyed).toBe(false);
  } finally {
    submit.mockRestore();
    compiled.destroy();
    positions.destroy();
  }
});
