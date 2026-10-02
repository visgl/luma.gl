// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {Computation, Kernel} from '@luma.gl/engine';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {GPUCommandGraph, GPUElementwise} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, test, vi} from 'vitest';

test('graph kernels share pipelines without retaining bindings across graphs or encodings', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return;
  const buffers = [2, 7, 0, 0].map(value =>
    device.createBuffer({
      data: new Uint32Array(4).fill(value),
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    })
  );
  const [firstInput, secondInput, firstOutput, secondOutput] = buffers;
  const first = await makeGraph(device, firstInput, firstOutput).compileAsync();
  const second = makeGraph(device, secondInput, secondOutput).compile();
  const dispatch = vi.spyOn(Kernel.prototype, 'dispatch');
  try {
    const encoder = device.createCommandEncoder();
    first.encode(encoder, {parameters: undefined});
    second.encode(encoder, {parameters: undefined});
    // Rebind both imported buffers without recompiling the first graph.
    first.encode(encoder, {
      parameters: undefined,
      buffers: {input: secondInput, output: firstOutput}
    });
    device.submit(encoder.finish());
    expect(await readValues(firstOutput)).toEqual([7, 7, 7, 7]);
    expect(await readValues(secondOutput)).toEqual([7, 7, 7, 7]);
    expect(dispatch.mock.instances).toHaveLength(3);
    const firstKernel = dispatch.mock.instances[0];
    const secondKernel = dispatch.mock.instances[1];
    expect(firstKernel).not.toBe(secondKernel);
    expect(firstKernel.pipeline).toBe(secondKernel.pipeline);

    first.destroy();
    expect(secondKernel.pipeline.destroyed).toBe(false);
    firstInput.write(new Uint32Array([3, 4, 5, 6]));
    const nextEncoder = device.createCommandEncoder();
    second.encode(nextEncoder, {parameters: undefined, buffers: {input: firstInput}});
    device.submit(nextEncoder.finish());
    expect(await readValues(secondOutput)).toEqual([3, 4, 5, 6]);
    expect(await readValues(firstOutput)).toEqual([7, 7, 7, 7]);
    second.destroy();
    expect(buffers.every(buffer => !buffer.destroyed)).toBe(true);
  } finally {
    dispatch.mockRestore();
    first.destroy();
    second.destroy();
    for (const buffer of buffers) buffer.destroy();
  }
});

function makeGraph(device: Device, inputBuffer: Buffer, outputBuffer: Buffer): GPUCommandGraph {
  const graph = new GPUCommandGraph(device);
  const input = graph.importGPUData(
    'input',
    new GPUData({
      buffer: inputBuffer,
      format: 'uint32',
      length: 4,
      ownsBuffer: false
    })
  );
  const output = graph.importGPUData(
    'output',
    new GPUData({
      buffer: outputBuffer,
      format: 'uint32',
      length: 4,
      ownsBuffer: false
    })
  );
  graph.add(new GPUElementwise({input, output, operation: 'copy'}));
  return graph;
}

async function readValues(buffer: Buffer): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, 4));
}

test('Kernel and Computation keep differently named bindings isolated in one compute pass', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return;
  const buffers = ['assembledValues', 'kernelValues'].map(name =>
    device.createBuffer({
      id: name,
      data: new Uint32Array([1]),
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    })
  );
  const makeProps = (name: string) => ({
    source: `
@group(0) @binding(0) var<storage, read_write> ${name}: array<u32>;
@compute @workgroup_size(1)
fn main() {
  ${name}[0] *= 2u;
}`,
    shaderLayout: {bindings: [{name, type: 'storage' as const, group: 0, location: 0}]}
  });
  const computation = new Computation(device, makeProps('assembledValues'));
  const kernel = new Kernel(device, makeProps('kernelValues'));
  try {
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    computation.setBindings({assembledValues: buffers[0]});
    computation.dispatch(pass, 1);
    kernel.dispatch(pass, {bindings: {kernelValues: buffers[1]}, x: 1});
    computation.dispatch(pass, 1);
    pass.end();
    device.submit(encoder.finish());
    const first = await buffers[0].readAsync();
    const second = await buffers[1].readAsync();
    expect(new Uint32Array(first.buffer, first.byteOffset, 1)[0]).toBe(4);
    expect(new Uint32Array(second.buffer, second.byteOffset, 1)[0]).toBe(2);
  } finally {
    computation.destroy();
    kernel.destroy();
    for (const buffer of buffers) buffer.destroy();
  }
});
