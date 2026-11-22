// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/core/test-utils';
import {GPUGraph, GPUCommandGraph, gpuGraph, type GPUOperationLowering} from '@luma.gl/graph';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';

function makeFixture(splitPasses = false, outputs = ['result']) {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const input = new GPUVector({
    type: 'data',
    format: 'float32',
    ownsData: true,
    data: [
      new GPUData({
        format: 'float32',
        length: 4,
        ownsBuffer: true,
        buffer: device.createBuffer({
          byteLength: 16,
          usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
        })
      })
    ]
  });
  const graph = new GPUGraph();
  graph.addInput('input', gpuGraph.vector('float32'));
  const buffers = new Map<string, Buffer[]>();
  const lowerings: GPUOperationLowering[] = [];
  for (const [source, destination] of [
    ['input', 'first'],
    ['first', 'second'],
    ['second', 'third'],
    ['third', 'result']
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
        const middle = splitPasses
          ? context.graph.createDataView(
              context.graph.createTransientBuffer({
                id: `${destination}-private`,
                byteLength: 16,
                usage: Buffer.COPY_SRC | Buffer.COPY_DST
              }),
              {format: 'float32', length: 4}
            )
          : undefined;
        const pairs = middle
          ? [
              [inputView, middle],
              [middle, outputView]
            ]
          : [[inputView, outputView]];
        pairs.forEach(([from, to], index) =>
          context.graph.addCopyPass({
            id: `${destination}-${index}`,
            resources: [
              {buffer: from, usage: 'copy-source'},
              {buffer: to, usage: 'copy-destination'}
            ],
            compile: () => ({
              encode: ({commandEncoder, getBuffer}) => {
                const sourceBuffer = getBuffer(from);
                const destinationBuffer = getBuffer(to);
                if (index === 0)
                  buffers.set(source, [...(buffers.get(source) ?? []), sourceBuffer]);
                if (index === pairs.length - 1)
                  buffers.set(destination, [
                    ...(buffers.get(destination) ?? []),
                    destinationBuffer
                  ]);
                commandEncoder.copyBufferToBuffer({sourceBuffer, destinationBuffer, size: 16});
              }
            })
          })
        );
      }
    });
  }
  const compiled = graph.compile(device, {outputs, lowerings});
  return {device, input, compiled, buffers};
}

for (const splitPasses of [false, true]) {
  test(`logical results reuse storage after their last operation (split passes: ${splitPasses})`, () => {
    const {device, input, compiled, buffers} = makeFixture(splitPasses);
    const createBuffer = vi.spyOn(device, 'createBuffer');
    const execution = compiled.prepare({inputs: {input}});
    const encoder = device.createCommandEncoder();
    execution.encode(encoder);
    expect(buffers.get('first')![0]).toBe(buffers.get('third')![0]);
    expect(buffers.get('first')![0].usage & Buffer.VERTEX).toBe(Buffer.VERTEX);
    expect(buffers.get('first')![0]).not.toBe(buffers.get('second')![0]);
    expect(buffers.get('second')![0]).not.toBe(buffers.get('third')![0]);
    expect(buffers.get('third')![0]).not.toBe(execution.outputs.result.data[0].buffer);
    expect(buffers.get('first')![0]).not.toBe(input.data[0].buffer);
    if (!splitPasses) expect(createBuffer).toHaveBeenCalledTimes(3); // Two scratch buffers and one escaping result.
    device.submit(encoder.finish());
    execution.destroy();
    expect(buffers.get('first')![0].destroyed).toBe(true);
    expect(execution.outputs.result.data[0].buffer.destroyed).toBe(false);
    expect(input.data[0].buffer.destroyed).toBe(false);
    execution.outputs.result.destroy();
    encoder.destroy();
    compiled.destroy();
    input.destroy();
    device.destroy();
  });
}

test('selected intermediate outputs do not enter the transient pool', () => {
  const {device, input, compiled, buffers} = makeFixture(false, ['first', 'result']);
  const execution = compiled.prepare({inputs: {input}});
  const encoder = device.createCommandEncoder();
  execution.encode(encoder);
  expect(buffers.get('first')![0]).toBe(execution.outputs.first.data[0].buffer);
  expect(buffers.get('first')![0]).not.toBe(buffers.get('third')![0]);
  device.submit(encoder.finish());
  execution.destroy();
  expect(execution.outputs.first.data[0].buffer.destroyed).toBe(false);
  for (const output of Object.values(execution.outputs)) output.destroy();
  encoder.destroy();
  compiled.destroy();
  input.destroy();
  device.destroy();
});

test('simultaneously prepared executions own independent transient pools', () => {
  const {device, input, compiled, buffers} = makeFixture();
  const first = compiled.prepare({inputs: {input}});
  const second = compiled.prepare({inputs: {input}});
  const encoder = device.createCommandEncoder();
  first.encode(encoder);
  const firstScratch = buffers.get('first')![0];
  buffers.clear();
  second.encode(encoder);
  const secondScratch = buffers.get('first')![0];
  expect(firstScratch).not.toBe(secondScratch);
  device.submit(encoder.finish());
  first.destroy();
  expect(secondScratch.destroyed).toBe(false);
  second.destroy();
  first.outputs.result.destroy();
  second.outputs.result.destroy();
  encoder.destroy();
  compiled.destroy();
  input.destroy();
  device.destroy();
});

for (const mapping of [Buffer.MAP_READ, Buffer.MAP_WRITE]) {
  test(`mapped staging usage stays separate from intermediate storage (${mapping})`, () => {
    const device = new NullDevice({});
    Object.defineProperty(device, 'type', {value: 'webgpu'});
    const graph = new GPUCommandGraph(device);
    const staging = graph.createTransientBuffer({
      id: 'staging',
      byteLength: 16,
      usage: mapping | (mapping === Buffer.MAP_READ ? Buffer.COPY_DST : Buffer.COPY_SRC)
    });
    const intermediate = graph.createTransientBuffer({
      id: 'intermediate',
      byteLength: 16,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    const buffers: Buffer[] = [];
    for (const buffer of [staging, intermediate])
      graph.addCopyPass({
        id: buffer.id,
        resources: [
          {
            buffer,
            usage:
              buffer === staging && mapping === Buffer.MAP_WRITE
                ? 'copy-source'
                : 'copy-destination'
          }
        ],
        compile: () => ({
          encode: ({getBuffer}) => {
            buffers.push(getBuffer(buffer));
          }
        })
      });
    const compiled = graph.compile();
    const encoder = device.createCommandEncoder();
    compiled.encode(encoder, {parameters: undefined});
    expect(buffers[0]).not.toBe(buffers[1]);
    expect(buffers[0].usage).toBe(staging.usage);
    expect(buffers[1].usage).toBe(intermediate.usage);
    encoder.destroy();
    compiled.destroy();
    device.destroy();
  });
}
