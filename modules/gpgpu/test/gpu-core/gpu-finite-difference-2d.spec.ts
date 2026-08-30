// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUFiniteDifference2D,
  type GPUFiniteDifference2DOperator
} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

const WIDTH = 9;
const HEIGHT = 7;
const DX = 0.25;
const DY = 0.4;

test('GPUFiniteDifference2D matches analytic scalar derivatives including boundaries', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const scalar = sampleScalar((x, y) => 2 + 3 * x - 4 * y + 0.5 * x * x + 2 * y * y);
  const gradient = await runOperator(device, 'gradient', scalar);
  const laplacian = await runOperator(device, 'laplacian', scalar);
  for (let index = 0; index < WIDTH * HEIGHT; index++) {
    const x = (index % WIDTH) * DX;
    const y = Math.floor(index / WIDTH) * DY;
    close(t, gradient[index * 2], 3 + x, 0.0001, `gradient x ${index}`);
    close(t, gradient[index * 2 + 1], -4 + 4 * y, 0.0001, `gradient y ${index}`);
    close(t, laplacian[index], 5, 0.0002, `laplacian ${index}`);
  }
  t.end();
});

test('GPUFiniteDifference2D matches rotational divergence and curl identities', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const vector = sampleVector((x, y) => [-2 * y + 0.25 * x, 2 * x - 0.25 * y]);
  const divergence = await runOperator(device, 'divergence', vector);
  const curl = await runOperator(device, 'curl', vector);
  for (let index = 0; index < WIDTH * HEIGHT; index++) {
    close(t, divergence[index], 0, 0.00002, `divergence ${index}`);
    close(t, curl[index], 4, 0.00002, `curl ${index}`);
  }
  t.end();
});

async function runOperator(
  device: Device,
  operator: GPUFiniteDifference2DOperator,
  values: Float32Array
): Promise<Float32Array> {
  const inputComponents = operator === 'gradient' || operator === 'laplacian' ? 1 : 2;
  const outputComponents = operator === 'gradient' ? 2 : 1;
  const inputBuffer = device.createBuffer({data: values, usage: Buffer.STORAGE});
  const outputBuffer = device.createBuffer({
    byteLength: WIDTH * HEIGHT * outputComponents * 4,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device);
  const inputHandle = graph.importBuffer(
    {id: `${operator}-input`, byteLength: inputBuffer.byteLength, usage: inputBuffer.usage},
    inputBuffer
  );
  const outputHandle = graph.importBuffer(
    {id: `${operator}-output`, byteLength: outputBuffer.byteLength, usage: outputBuffer.usage},
    outputBuffer
  );
  const input = graph.createDataView(inputHandle, {
    format: inputComponents === 1 ? 'float32' : 'float32x2',
    length: WIDTH * HEIGHT
  });
  const output = graph.createDataView(outputHandle, {
    format: outputComponents === 1 ? 'float32' : 'float32x2',
    length: WIDTH * HEIGHT
  });
  const difference = new GPUFiniteDifference2D({
    input,
    output,
    width: WIDTH,
    height: HEIGHT,
    spacing: [DX, DY],
    operator
  });
  difference.addToGraph(graph);
  const compiled = graph.compile();
  try {
    const commandEncoder = device.createCommandEncoder({id: `${operator}-test`});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const bytes = await outputBuffer.readAsync();
    return new Float32Array(bytes.slice().buffer);
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    outputBuffer.destroy();
  }
}

function sampleScalar(sample: (x: number, y: number) => number): Float32Array {
  return Float32Array.from({length: WIDTH * HEIGHT}, (_, index) =>
    sample((index % WIDTH) * DX, Math.floor(index / WIDTH) * DY)
  );
}

function sampleVector(sample: (x: number, y: number) => readonly [number, number]): Float32Array {
  const values = new Float32Array(WIDTH * HEIGHT * 2);
  for (let index = 0; index < WIDTH * HEIGHT; index++) {
    values.set(sample((index % WIDTH) * DX, Math.floor(index / WIDTH) * DY), index * 2);
  }
  return values;
}

function close(
  t: {ok(value: unknown, message?: string): void},
  actual: number,
  expected: number,
  epsilon: number,
  label: string
): void {
  t.ok(Math.abs(actual - expected) <= epsilon, `${label}: ${actual} ~= ${expected}`);
}
