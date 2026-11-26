// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/core/test-utils';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUGraph, GPUGraphCompiler, GPUCopyOperation, gpuGraph} from '@luma.gl/graph';

function makeDevice() {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  return device;
}

function makeVector(device: NullDevice, lengths = [2, 0, 1]) {
  return new GPUVector({
    type: 'data',
    format: 'float32',
    ownsData: true,
    data: lengths.map(
      length =>
        new GPUData({
          format: 'float32',
          length,
          ownsBuffer: true,
          buffer: device.createBuffer({
            byteLength: Math.max(1, length) * 4,
            usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
          })
        })
    )
  });
}

function makeGraph() {
  const graph = new GPUGraph();
  graph.addState('positions', gpuGraph.vector('float32'));
  graph.add(new GPUCopyOperation({input: 'positions', output: 'snapshot'}));
  return graph;
}

test('state borrowing is allocation-free and ownership remains with the caller', () => {
  const device = makeDevice();
  const positions = makeVector(device);
  const compiled = makeGraph().compile(device);
  const allocate = vi.spyOn(device, 'createBuffer');
  const submit = vi.spyOn(device, 'submit');
  const bindings = {positions};
  const state = compiled.createState(bindings);
  expect(state.values).not.toBe(bindings);
  expect(state.values.positions).toBe(positions);
  expect(state.ownsValues).toBe(false);
  expect(allocate).not.toHaveBeenCalled();
  expect(submit).not.toHaveBeenCalled();
  state.destroy();
  state.destroy();
  compiled.destroy();
  expect(positions.data.every(chunk => !chunk.buffer.destroyed)).toBe(true);
  expect(() => state.reset({positions})).toThrow();
  positions.destroy();
  device.destroy();
});

test('copied state owns separate chunks and outlives its compiled program', () => {
  const device = makeDevice();
  const positions = makeVector(device);
  const compiled = makeGraph().compile(device);
  const submit = vi.spyOn(device, 'submit');
  const first = compiled.createState({positions}, {copy: true});
  const second = compiled.createState({positions}, {copy: true});
  expect(submit).toHaveBeenCalledTimes(2);
  expect(first.values.positions.data.map(chunk => chunk.length)).toEqual([2, 0, 1]);
  for (const [index, chunk] of first.values.positions.data.entries()) {
    expect(chunk.buffer).not.toBe(positions.data[index].buffer);
    expect(chunk.buffer).not.toBe(second.values.positions.data[index].buffer);
  }
  compiled.destroy();
  expect(() => compiled.createState({positions})).toThrow();
  first.reset({positions});
  first.destroy();
  first.destroy();
  expect(first.values.positions.data.every(chunk => chunk.buffer.destroyed)).toBe(true);
  expect(second.values.positions.data.every(chunk => !chunk.buffer.destroyed)).toBe(true);
  expect(positions.data.every(chunk => !chunk.buffer.destroyed)).toBe(true);
  second.destroy();
  positions.destroy();
  device.destroy();
});

test('caller-owned initialization and reset encode without finishing or submitting', () => {
  const device = makeDevice();
  const positions = makeVector(device);
  const compiled = makeGraph().compile(device);
  const encoder = device.createCommandEncoder();
  const copy = vi.spyOn(encoder, 'copyBufferToBuffer');
  const finish = vi.spyOn(encoder, 'finish');
  const destroy = vi.spyOn(encoder, 'destroy');
  const submit = vi.spyOn(device, 'submit');
  const state = compiled.createState({positions}, {copy: true, commandEncoder: encoder});
  state.encodeReset(encoder, {positions});
  expect(copy).toHaveBeenCalledTimes(4);
  expect(finish).not.toHaveBeenCalled();
  expect(destroy).not.toHaveBeenCalled();
  expect(submit).not.toHaveBeenCalled();
  device.submit(encoder.finish());
  state.destroy();
  encoder.destroy();
  compiled.destroy();
  positions.destroy();
  device.destroy();
});

test('prepared executions retain state and release it on cancellation', () => {
  const device = makeDevice();
  const positions = makeVector(device);
  const compiled = makeGraph().compile(device);
  const state = compiled.createState({positions}, {copy: true});
  const first = compiled.prepare({state});
  const second = compiled.prepare({state});
  expect(() => state.destroy()).toThrow();
  expect(() => state.reset({positions})).toThrow();
  first.destroy();
  first.destroy();
  expect(() => state.destroy()).toThrow();
  second.destroy();
  state.reset({positions});
  state.destroy();
  expect(() => compiled.prepare({state})).toThrow();
  first.outputs.snapshot.destroy();
  second.outputs.snapshot.destroy();
  compiled.destroy();
  positions.destroy();
  device.destroy();
});

test('foreign programs and failed preparation cannot retain or destroy state', () => {
  const device = makeDevice();
  const positions = makeVector(device);
  const graph = makeGraph();
  const compiled = graph.compile(device);
  const other = graph.compile(device);
  const state = compiled.createState({positions}, {copy: true});
  expect(() => other.prepare({state})).toThrow();
  const fail = vi.spyOn(GPUGraphCompiler.prototype, 'compile').mockImplementation(() => {
    throw new Error('injected preparation failure');
  });
  expect(() => compiled.prepare({state})).toThrow('injected preparation failure');
  fail.mockRestore();
  state.destroy();
  expect(positions.data.every(chunk => !chunk.buffer.destroyed)).toBe(true);
  compiled.destroy();
  other.destroy();
  positions.destroy();
  device.destroy();
});

for (const failure of ['createCommandEncoder', 'submit'] as const) {
  test(`run releases state retention after ${failure} fails`, async () => {
    const device = makeDevice();
    const positions = makeVector(device);
    const compiled = makeGraph().compile(device);
    const state = compiled.createState({positions}, {copy: true});
    const fail = vi.spyOn(device, failure).mockImplementation(() => {
      throw new Error('injected run failure');
    });
    await expect(compiled.run({state})).rejects.toThrow('injected run failure');
    fail.mockRestore();
    expect(state.values.positions.data.every(chunk => !chunk.buffer.destroyed)).toBe(true);
    state.destroy();
    compiled.destroy();
    positions.destroy();
    device.destroy();
  });
}

test('reset validates all bindings, topology and aliases before encoding', () => {
  const device = makeDevice();
  const positions = makeVector(device);
  const other = makeVector(device);
  const wrongShape = makeVector(device, [3]);
  const graph = makeGraph();
  graph.addState('other', gpuGraph.vector('float32'));
  const compiled = graph.compile(device);
  const state = compiled.createState({positions, other}, {copy: true});
  const encoder = device.createCommandEncoder();
  const copy = vi.spyOn(encoder, 'copyBufferToBuffer');
  expect(() => state.encodeReset(encoder, {positions})).toThrow('Missing state binding other');
  expect(() => state.encodeReset(encoder, {positions, other, extra: positions})).toThrow(
    'Invalid state binding extra'
  );
  expect(() => state.encodeReset(encoder, {positions, other: wrongShape})).toThrow('chunks');
  expect(() => state.encodeReset(encoder, {positions, other: state.values.positions})).toThrow();
  const foreign = makeDevice();
  const foreignEncoder = foreign.createCommandEncoder();
  expect(() => state.encodeReset(foreignEncoder, {positions, other})).toThrow();
  expect(copy).not.toHaveBeenCalled();
  state.destroy();
  compiled.destroy();
  positions.destroy();
  other.destroy();
  wrongShape.destroy();
  encoder.destroy();
  foreignEncoder.destroy();
  foreign.destroy();
  device.destroy();
});

test('failed copied-state construction releases partial allocations and borrows its encoder', () => {
  const device = makeDevice();
  const positions = makeVector(device);
  const compiled = makeGraph().compile(device);
  const encoder = device.createCommandEncoder();
  const allocate = vi.spyOn(device, 'createBuffer');
  const destroy = vi.spyOn(encoder, 'destroy');
  const copy = vi.spyOn(encoder, 'copyBufferToBuffer').mockImplementation(() => {
    throw new Error('injected copy failure');
  });
  expect(() => compiled.createState({positions}, {copy: true, commandEncoder: encoder})).toThrow(
    'injected copy failure'
  );
  expect(allocate.mock.results.length).toBe(3);
  expect(allocate.mock.results.every(result => result.value.destroyed)).toBe(true);
  expect(destroy).not.toHaveBeenCalled();
  expect(positions.data.every(chunk => !chunk.buffer.destroyed)).toBe(true);
  copy.mockRestore();
  encoder.destroy();
  compiled.destroy();
  positions.destroy();
  device.destroy();
});

test('copy targets require existing compatible mutable declarations', () => {
  const device = makeDevice();
  for (const target of ['missing', 'wrongFormat']) {
    const graph = new GPUGraph();
    graph.addInput('input', gpuGraph.vector('float32'));
    graph.addState('wrongFormat', gpuGraph.vector('uint32'));
    graph.add(new GPUCopyOperation({input: 'input', target}));
    expect(() => graph.compile(device)).toThrow();
  }
  const graph = new GPUGraph();
  graph.addInput('source', gpuGraph.vector('float32'));
  graph.addInput('destination', gpuGraph.vector('float32'));
  graph.add(new GPUCopyOperation({input: 'source', target: 'destination'}));
  expect(() => graph.compile(device)).toThrow('Cannot write graph input');
  device.destroy();
});
