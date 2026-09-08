import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUA5CellProjection} from '@luma.gl/gpgpu/gpu-a5';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

const A5_CELLS = [
  0x0200000000000000n,
  0x0500000000000000n,
  0x1a38000000000000n,
  0x2628000000000000n,
  0x35bd75e8fee1100dn
];

it('GPUA5CellProjection projects representative A5 resolutions to geographic centers', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const longitudeLatitudes = await runA5Projection(device, A5_CELLS, 'lnglat');
  const unitVectors = await runA5Projection(device, A5_CELLS, 'unit-vector');
  for (let cellIndex = 0; cellIndex < A5_CELLS.length; cellIndex++) {
    const longitude = longitudeLatitudes.values[cellIndex * 2];
    const latitude = longitudeLatitudes.values[cellIndex * 2 + 1];
    expect(
      Boolean(Number.isFinite(longitude) && longitude >= -180 && longitude <= 180),
      `cell ${A5_CELLS[cellIndex].toString(16)} longitude ${longitude} is finite`
    ).toBe(true);
    expect(
      Boolean(Number.isFinite(latitude) && latitude >= -90 && latitude <= 90),
      `cell ${A5_CELLS[cellIndex].toString(16)} latitude ${latitude} is finite`
    ).toBe(true);
    expect(longitudeLatitudes.validity[cellIndex], 'valid A5 cell sets the validity mask').toBe(1);

    const x = unitVectors.values[cellIndex * 3];
    const y = unitVectors.values[cellIndex * 3 + 1];
    const z = unitVectors.values[cellIndex * 3 + 2];
    expect(
      Boolean(Math.abs(Math.hypot(x, y, z) - 1) < 0.001),
      'unit-vector output is normalized'
    ).toBe(true);
    expect(unitVectors.validity[cellIndex], 'unit-vector projection preserves validity').toBe(1);
  }
});

it('GPUA5CellProjection rejects the reserved zero index', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const result = await runA5Projection(device, [0n], 'lnglat');
  expect(Array.from(result.values), 'invalid rows produce zero coordinates').toEqual([0, 0]);
  expect(Array.from(result.validity), 'invalid rows clear the validity mask').toEqual([0]);
});

type A5ProjectionKind = 'lnglat' | 'unit-vector';

async function runA5Projection(
  device: Device,
  cells: bigint[],
  projection: A5ProjectionKind
): Promise<{values: Float32Array; validity: Uint32Array}> {
  const componentCount = projection === 'lnglat' ? 2 : 3;
  const inputBuffer = device.createBuffer({
    data: new Uint32Array(BigUint64Array.from(cells).buffer),
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const outputBuffer = device.createBuffer({
    byteLength: cells.length * componentCount * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const validityBuffer = device.createBuffer({
    byteLength: cells.length * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device);
  const inputHandle = graph.importBuffer(
    {id: 'cells', byteLength: inputBuffer.byteLength, usage: inputBuffer.usage},
    inputBuffer
  );
  const outputHandle = graph.importBuffer(
    {id: 'output', byteLength: outputBuffer.byteLength, usage: outputBuffer.usage},
    outputBuffer
  );
  const validityHandle = graph.importBuffer(
    {id: 'validity', byteLength: validityBuffer.byteLength, usage: validityBuffer.usage},
    validityBuffer
  );
  const input = graph.createDataView(inputHandle, {format: 'uint32x2', length: cells.length});
  const output = graph.createDataView(outputHandle, {
    format: projection === 'lnglat' ? 'float32x2' : 'float32x3',
    length: cells.length
  });
  const validity = graph.createDataView(validityHandle, {format: 'uint32', length: cells.length});
  new GPUA5CellProjection({cells: input, output, validity, projection}).addToGraph(graph);
  const compiled = graph.compile();

  try {
    const commandEncoder = device.createCommandEncoder({id: `gpu-a5-${projection}-test`});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const [valueBytes, validityBytes] = await Promise.all([
      outputBuffer.readAsync(),
      validityBuffer.readAsync()
    ]);
    return {
      values: new Float32Array(
        valueBytes.buffer,
        valueBytes.byteOffset,
        cells.length * componentCount
      ),
      validity: new Uint32Array(validityBytes.buffer, validityBytes.byteOffset, cells.length)
    };
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    outputBuffer.destroy();
    validityBuffer.destroy();
  }
}
