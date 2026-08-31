import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {GPUH3CellProjection} from '@luma.gl/gpgpu/gpu-h3';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {cellToLatLng, getPentagons, getRes0Cells, gridDisk, latLngToCell} from 'h3-js';

const GEOGRAPHIC_TOLERANCE_DEGREES = 0.03;
const UNIT_VECTOR_TOLERANCE = 0.0006;

it('GPUH3CellProjection matches h3-js for global, pentagon, and high-resolution cells', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const cells = makeH3Cells();
  const longitudeLatitudes = await runH3Projection(device, cells, 'lnglat');
  const unitVectors = await runH3Projection(device, cells, 'unit-vector');

  for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
    const [latitude, longitude] = cellToLatLng(cells[cellIndex]);
    const longitudeError = Math.abs(
      normalizeLongitude(longitudeLatitudes.values[cellIndex * 2] - longitude)
    );
    const latitudeError = Math.abs(longitudeLatitudes.values[cellIndex * 2 + 1] - latitude);
    expect(
      Boolean(
        longitudeError <= GEOGRAPHIC_TOLERANCE_DEGREES &&
          latitudeError <= GEOGRAPHIC_TOLERANCE_DEGREES
      ),
      `cell ${cells[cellIndex]} center agrees with h3-js (GPU ${longitudeLatitudes.values[cellIndex * 2]}, ${longitudeLatitudes.values[cellIndex * 2 + 1]}; CPU ${longitude}, ${latitude})`
    ).toBe(true);
    expect(longitudeLatitudes.validity[cellIndex], 'valid cell sets the validity mask').toBe(1);

    const expectedUnitVector = makeUnitVector(longitude, latitude);
    for (let component = 0; component < 3; component++) {
      expect(
        Boolean(
          Math.abs(unitVectors.values[cellIndex * 3 + component] - expectedUnitVector[component]) <=
            UNIT_VECTOR_TOLERANCE
        ),
        `cell ${cells[cellIndex]} unit-vector component ${component} agrees with h3-js`
      ).toBe(true);
    }
    expect(unitVectors.validity[cellIndex], 'unit-vector projection preserves validity').toBe(1);
  }
});

it('GPUH3CellProjection rejects invalid split-uint64 rows', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const validCell = latLngToCell(37.775, -122.418, 9);
  const invalidCells = [0n, BigInt(`0x${validCell}`) | (1n << 63n)];
  const result = await runH3Projection(device, invalidCells, 'lnglat');
  expect(Array.from(result.values), 'invalid rows produce zero coordinates').toEqual([0, 0, 0, 0]);
  expect(Array.from(result.validity), 'invalid rows clear the validity mask').toEqual([0, 0]);
});

type H3ProjectionKind = 'lnglat' | 'unit-vector';

async function runH3Projection(
  device: Device,
  cells: Array<string | bigint>,
  projection: H3ProjectionKind
): Promise<{values: Float32Array; validity: Uint32Array}> {
  const cellWords = makeLittleEndianWords(cells);
  const componentCount = projection === 'lnglat' ? 2 : 3;
  const inputBuffer = device.createBuffer({
    data: cellWords,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const outputBuffer = device.createBuffer({
    byteLength: Math.max(cells.length, 1) * componentCount * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const validityBuffer = device.createBuffer({
    byteLength: Math.max(cells.length, 1) * Uint32Array.BYTES_PER_ELEMENT,
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
  new GPUH3CellProjection({cells: input, output, validity, projection}).addToGraph(graph);
  const compiled = graph.compile();

  try {
    const commandEncoder = device.createCommandEncoder({id: `gpu-h3-${projection}-test`});
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

function makeH3Cells(): string[] {
  const cells = new Set<string>(getRes0Cells());
  const resolutions = Array.from({length: 16}, (_, resolution) => resolution);
  for (let sample = 0; sample < 128; sample++) {
    const latitude = -88 + (176 * sample) / 127;
    const longitude = normalizeLongitude(sample * 137.50776405003785);
    for (const resolution of resolutions) {
      cells.add(latLngToCell(latitude, longitude, resolution));
    }
  }
  for (const resolution of [0, 1, 5, 9, 15]) {
    for (const pentagon of getPentagons(resolution)) {
      for (const nearbyCell of gridDisk(pentagon, 1)) {
        cells.add(nearbyCell);
      }
    }
  }
  return Array.from(cells);
}

function makeLittleEndianWords(cells: Array<string | bigint>): Uint32Array {
  const indexes = BigUint64Array.from(
    cells,
    cell => (typeof cell === 'bigint' ? cell : BigInt(`0x${cell}`)) & 0xffffffffffffffffn
  );
  return new Uint32Array(indexes.buffer);
}

function makeUnitVector(longitude: number, latitude: number): [number, number, number] {
  const radians = Math.PI / 180;
  const longitudeRadians = longitude * radians;
  const latitudeRadians = latitude * radians;
  const cosLatitude = Math.cos(latitudeRadians);
  return [
    cosLatitude * Math.cos(longitudeRadians),
    cosLatitude * Math.sin(longitudeRadians),
    Math.sin(latitudeRadians)
  ];
}

function normalizeLongitude(longitude: number): number {
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}
