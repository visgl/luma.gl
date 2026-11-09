// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/core/test-utils';
import {GPUGraph, GPUGraphCompiler, gpuGraph, type GPUOperationLowering} from '@luma.gl/graph';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';

function setup() {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const input = new GPUVector({
    type: 'data',
    format: 'float32',
    ownsData: true,
    data: [
      new GPUData({
        format: 'float32',
        length: 2,
        ownsBuffer: true,
        buffer: device.createBuffer({
          byteLength: 8,
          usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
        })
      })
    ]
  });
  const graph = new GPUGraph();
  graph.addInput('input', gpuGraph.vector('float32'));
  const lowerings: GPUOperationLowering[] = [];
  for (const [source, destination] of [
    ['input', 'scratch'],
    ['scratch', 'result']
  ]) {
    graph.add({
      id: destination,
      type: destination,
      contract: {
        outputs: {[destination]: gpuGraph.vector('float32')},
        values: [
          {value: source, access: 'read'},
          {value: destination, access: 'write', shape: {like: source}}
        ]
      }
    });
    lowerings.push({
      type: destination,
      lower: (_operation, context) => {
        const inputView = context.resolveVector(source).data[0];
        const outputView = context.resolveVector(destination).data[0];
        context.graph.addCopyPass({
          id: destination,
          resources: [
            {buffer: inputView, usage: 'copy-source'},
            {buffer: outputView, usage: 'copy-destination'}
          ],
          compile: () => ({
            encode: ({commandEncoder, getBuffer}) =>
              commandEncoder.copyBufferToBuffer({
                sourceBuffer: getBuffer(inputView),
                destinationBuffer: getBuffer(outputView),
                size: 8
              })
          })
        });
      }
    });
  }
  const compiled = graph.compile(device, {lowerings});
  return {device, input, compiled};
}

test('prepared executions retain scratch, borrow encoders, and preserve outputs', () => {
  const {device, input, compiled} = setup();
  const createBuffer = vi.spyOn(device, 'createBuffer');
  const submit = vi.spyOn(device, 'submit');
  const execution = compiled.prepare({inputs: {input}});
  const buffers = createBuffer.mock.results.map(result => result.value);
  const outputBuffer = execution.outputs.result.data[0].buffer;
  expect(buffers.length).toBeGreaterThan(1);
  expect(buffers.every(buffer => !buffer.destroyed)).toBe(true);
  expect(submit).not.toHaveBeenCalled();
  const encoder = device.createCommandEncoder();
  const finish = vi.spyOn(encoder, 'finish');
  const destroy = vi.spyOn(encoder, 'destroy');
  execution.encode(encoder);
  expect(finish).not.toHaveBeenCalled();
  expect(submit).not.toHaveBeenCalled();
  expect(() => execution.encode(encoder)).toThrow();
  expect(destroy).not.toHaveBeenCalled();
  device.submit(encoder.finish());
  destroy.mockClear();
  execution.destroy();
  execution.destroy();
  expect(destroy).not.toHaveBeenCalled();
  expect(outputBuffer.destroyed).toBe(false);
  expect(buffers.filter(buffer => buffer !== outputBuffer).every(buffer => buffer.destroyed)).toBe(
    true
  );
  expect(input.data[0].buffer.destroyed).toBe(false);
  expect(() => execution.encode(encoder)).toThrow();
  execution.outputs.result.destroy();
  encoder.destroy();
  compiled.destroy();
  input.destroy();
  device.destroy();
});

test('cancellation preserves allocated outputs and rejects destroyed programs or foreign encoders', () => {
  const {device, input, compiled} = setup();
  const execution = compiled.prepare({inputs: {input}});
  const otherDevice = new NullDevice({});
  const foreignEncoder = otherDevice.createCommandEncoder();
  expect(() => execution.encode(foreignEncoder)).toThrow();
  compiled.destroy();
  const encoder = device.createCommandEncoder();
  expect(() => execution.encode(encoder)).toThrow();
  execution.destroy();
  expect(execution.outputs.result.data[0].buffer.destroyed).toBe(false);
  expect(() => compiled.prepare({inputs: {input}})).toThrow();
  execution.outputs.result.destroy();
  encoder.destroy();
  foreignEncoder.destroy();
  otherDevice.destroy();
  input.destroy();
  device.destroy();
});

for (const failure of ['createCommandEncoder', 'submit'] as const) {
  test(`run cleans allocated results after ${failure} failure without destroying borrowed targets`, async () => {
    const {device, input, compiled} = setup();
    const createBuffer = vi.spyOn(device, 'createBuffer');
    const fail = vi.spyOn(device, failure).mockImplementation(() => {
      throw new Error('injected failure');
    });
    await expect(compiled.run({inputs: {input}})).rejects.toThrow('injected failure');
    expect(createBuffer.mock.results.every(result => result.value.destroyed)).toBe(true);
    expect(input.data[0].buffer.destroyed).toBe(false);
    const target = new GPUVector({
      type: 'data',
      format: 'float32',
      ownsData: true,
      data: [
        new GPUData({
          format: 'float32',
          length: 2,
          ownsBuffer: true,
          buffer: device.createBuffer({
            byteLength: 8,
            usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
          })
        })
      ]
    });
    await expect(compiled.run({inputs: {input}, outputTargets: {result: target}})).rejects.toThrow(
      'injected failure'
    );
    expect(target.data[0].buffer.destroyed).toBe(false);
    fail.mockRestore();
    compiled.destroy();
    input.destroy();
    target.destroy();
    device.destroy();
  });
}

test('failed encoding is not retried and explicit cleanup preserves outputs', () => {
  const {device, input, compiled} = setup();
  const execution = compiled.prepare({inputs: {input}});
  const encoder = device.createCommandEncoder();
  const begin = vi.spyOn(encoder, 'copyBufferToBuffer').mockImplementation(() => {
    throw new Error('encode failure');
  });
  expect(() => execution.encode(encoder)).toThrow('encode failure');
  begin.mockRestore();
  expect(() => execution.encode(encoder)).toThrow();
  encoder.destroy();
  execution.destroy();
  expect(execution.outputs.result.data[0].buffer.destroyed).toBe(false);
  execution.outputs.result.destroy();
  compiled.destroy();
  input.destroy();
  device.destroy();
});

test('preparation failure releases allocations and preserves borrowed input', () => {
  const {device, input, compiled} = setup();
  const createBuffer = vi.spyOn(device, 'createBuffer');
  const compile = vi.spyOn(GPUGraphCompiler.prototype, 'compile').mockImplementation(() => {
    throw new Error('lowering failure');
  });
  try {
    expect(() => compiled.prepare({inputs: {input}})).toThrow('lowering failure');
    expect(createBuffer.mock.results.length).toBeGreaterThan(0);
    expect(createBuffer.mock.results.every(result => result.value.destroyed)).toBe(true);
    expect(input.data[0].buffer.destroyed).toBe(false);
  } finally {
    compile.mockRestore();
    compiled.destroy();
    input.destroy();
    device.destroy();
  }
});
