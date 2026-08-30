// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUFiniteDifference3D,
  type GPUFiniteDifference3DOperator
} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

const RESOLUTION = 5;
const SPACING = 0.4;

test('GPUFiniteDifference3D matches analytic gradient and Laplacian', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const values = Float32Array.from({length: RESOLUTION ** 3}, (_, index) => {
    const [x, y, z] = getCoordinates(index);
    return 1 + 2 * x - 3 * y + 4 * z + x * x + 1.5 * y * y + 2 * z * z;
  });
  const gradient = await runOperator(device, 'gradient', values);
  const laplacian = await runOperator(device, 'laplacian', values);
  for (let index = 0; index < RESOLUTION ** 3; index++) {
    const [x, y, z] = getCoordinates(index);
    close(t, gradient[index * 4], 2 + 2 * x, 0.0002);
    close(t, gradient[index * 4 + 1], -3 + 3 * y, 0.0002);
    close(t, gradient[index * 4 + 2], 4 + 4 * z, 0.0002);
    close(t, laplacian[index], 9, 0.0004);
  }
  t.end();
});

test('GPUFiniteDifference3D matches divergence and curl identities', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const values = new Float32Array(RESOLUTION ** 3 * 4);
  for (let index = 0; index < RESOLUTION ** 3; index++) {
    const [x, y, z] = getCoordinates(index);
    values.set([-y, x, z * 0.5, 0], index * 4);
  }
  const divergence = await runOperator(device, 'divergence', values);
  const curl = await runOperator(device, 'curl', values);
  for (let index = 0; index < RESOLUTION ** 3; index++) {
    close(t, divergence[index], 0.5, 0.0001);
    close(t, curl[index * 4], 0, 0.0001);
    close(t, curl[index * 4 + 1], 0, 0.0001);
    close(t, curl[index * 4 + 2], 2, 0.0001);
  }
  t.end();
});

async function runOperator(
  device: Device,
  operator: GPUFiniteDifference3DOperator,
  values: Float32Array
): Promise<Float32Array> {
  const inputComponents = operator === 'gradient' || operator === 'laplacian' ? 1 : 4;
  const outputComponents = operator === 'gradient' || operator === 'curl' ? 4 : 1;
  const inputBuffer = device.createBuffer({data: values, usage: Buffer.STORAGE});
  const outputBuffer = device.createBuffer({
    byteLength: RESOLUTION ** 3 * outputComponents * 4,
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
    format: inputComponents === 1 ? 'float32' : 'float32x4',
    length: RESOLUTION ** 3
  });
  const output = graph.createDataView(outputHandle, {
    format: outputComponents === 1 ? 'float32' : 'float32x4',
    length: RESOLUTION ** 3
  });
  new GPUFiniteDifference3D({
    input,
    output,
    width: RESOLUTION,
    height: RESOLUTION,
    depth: RESOLUTION,
    spacing: [SPACING, SPACING, SPACING],
    operator
  }).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const encoder = device.createCommandEncoder({id: `${operator}-3d-test`});
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    return new Float32Array((await outputBuffer.readAsync()).slice().buffer);
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    outputBuffer.destroy();
  }
}

function getCoordinates(index: number): [number, number, number] {
  return [
    (index % RESOLUTION) * SPACING,
    (Math.floor(index / RESOLUTION) % RESOLUTION) * SPACING,
    Math.floor(index / RESOLUTION ** 2) * SPACING
  ];
}

function close(
  t: {ok(value: unknown, message?: string): void},
  actual: number,
  expected: number,
  epsilon: number
): void {
  t.ok(Math.abs(actual - expected) <= epsilon, `${actual} ~= ${expected}`);
}
