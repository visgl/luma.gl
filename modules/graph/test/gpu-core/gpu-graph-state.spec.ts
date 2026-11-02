// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUGraph, GPUCopyOperation, GPUExpressionOperation, gpuGraph} from '@luma.gl/graph';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';

function makeVector(device: Device) {
  return new GPUVector({
    type: 'data',
    format: 'float32x2',
    ownsData: true,
    data: [[1, 2, 3, 4], [], [5, 6]].map(
      values =>
        new GPUData({
          format: 'float32x2',
          length: values.length / 2,
          ownsBuffer: true,
          buffer: device.createBuffer({
            data: new Float32Array(values.length ? values : [0, 0]),
            usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
          })
        })
    )
  });
}
async function read(vector: GPUVector): Promise<number[]> {
  return (
    await Promise.all(
      vector.data.map(async chunk => {
        if (!chunk.length) return [];
        const bytes = await chunk.buffer.readAsync(
          chunk.byteOffset,
          chunk.length * chunk.rowByteLength
        );
        return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
      })
    )
  ).flat();
}
function makeGraph() {
  const graph = new GPUGraph();
  graph.addInput('factor', gpuGraph.scalar('float32'));
  graph.addState('positions', gpuGraph.vector('float32x2'));
  graph.add([
    new GPUExpressionOperation({output: 'next', expression: 'positions * factor'}),
    new GPUCopyOperation({input: 'next', target: 'positions'}),
    new GPUCopyOperation({input: 'positions', output: 'snapshot'})
  ]);
  return graph;
}

test('one compiled program advances independent state instances and resets without readback', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const initial = makeVector(device);
  const compiled = makeGraph().compile(device, {outputs: ['positions']});
  const first = compiled.createState({positions: initial}, {copy: true});
  const second = compiled.createState({positions: initial}, {copy: true});
  try {
    const outputs = await compiled.run({inputs: {factor: 2}, state: first});
    expect(outputs.positions).toBe(first.values.positions);
    await compiled.run({inputs: {factor: 2}, state: first});
    await compiled.run({inputs: {factor: 3}, state: second});
    expect(await read(first.values.positions)).toEqual([4, 8, 12, 16, 20, 24]);
    expect(await read(second.values.positions)).toEqual([3, 6, 9, 12, 15, 18]);
    expect(await read(initial)).toEqual([1, 2, 3, 4, 5, 6]);
    first.reset({positions: initial});
    expect(await read(first.values.positions)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(first.values.positions.data.map(chunk => chunk.length)).toEqual([2, 0, 1]);
    // Plain maps remain supported and mutate only the explicitly borrowed vector.
    await compiled.run({inputs: {factor: 5}, state: {positions: initial}});
    expect(await read(initial)).toEqual([5, 10, 15, 20, 25, 30]);
  } finally {
    compiled.destroy();
    first.destroy();
    second.destroy();
    initial.destroy();
  }
});

test('caller encoder orders initialization, execution, reset and execution with one submission', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const initial = makeVector(device);
  const compiled = makeGraph().compile(device, {outputs: ['snapshot']});
  const encoder = device.createCommandEncoder();
  const submit = vi.spyOn(device, 'submit');
  const state = compiled.createState({positions: initial}, {copy: true, commandEncoder: encoder});
  const first = compiled.prepare({inputs: {factor: 2}, state});
  const second = compiled.prepare({inputs: {factor: 3}, state});
  try {
    first.encode(encoder);
    state.encodeReset(encoder, {positions: initial});
    second.encode(encoder);
    expect(submit).not.toHaveBeenCalled();
    device.submit(encoder.finish());
    expect(submit).toHaveBeenCalledTimes(1);
    submit.mockRestore();
    expect(await read(first.outputs.snapshot)).toEqual([2, 4, 6, 8, 10, 12]);
    expect(await read(second.outputs.snapshot)).toEqual([3, 6, 9, 12, 15, 18]);
    expect(await read(state.values.positions)).toEqual([3, 6, 9, 12, 15, 18]);
  } finally {
    submit.mockRestore();
    first.destroy();
    second.destroy();
    first.outputs.snapshot.destroy();
    second.outputs.snapshot.destroy();
    encoder.destroy();
    state.destroy();
    compiled.destroy();
    initial.destroy();
  }
});

test('borrowed state reset preserves integer bits and byte offsets', async ({skip}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const makeIntegerVector = (values: number[]) =>
    new GPUVector({
      type: 'data',
      format: 'uint32x2',
      ownsData: true,
      data: [
        new GPUData({
          format: 'uint32x2',
          length: 1,
          byteOffset: 4,
          ownsBuffer: true,
          buffer: device.createBuffer({
            data: new Uint32Array(values),
            usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
          })
        })
      ]
    });
  const source = makeIntegerVector([9, 0xffffffff, 0x80000001, 9]);
  const destination = makeIntegerVector([7, 0, 0, 7]);
  const graph = new GPUGraph();
  graph.addState('bits', gpuGraph.vector('uint32x2'));
  graph.add(new GPUCopyOperation({input: 'bits', output: 'snapshot'}));
  const compiled = graph.compile(device);
  const state = compiled.createState({bits: destination});
  try {
    state.reset({bits: source});
    const bytes = await destination.data[0].buffer.readAsync();
    expect(
      Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4))
    ).toEqual([7, 0xffffffff, 0x80000001, 7]);
    state.destroy();
    expect(destination.data[0].buffer.destroyed).toBe(false);
  } finally {
    state.destroy();
    compiled.destroy();
    source.destroy();
    destination.destroy();
  }
});
