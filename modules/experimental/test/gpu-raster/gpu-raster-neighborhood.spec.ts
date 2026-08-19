// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test, {type Test} from '../../../../test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/experimental';
import {
  GPURasterNeighborhood,
  type GPURasterBorderMode,
  type GPURasterBufferBand,
  type GPURasterNoDataPolicy,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/gpu-raster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

type NeighborhoodFixture = {
  width: number;
  height: number;
  values: Float32Array | Uint32Array | Int32Array;
  format: GPURasterScalarFormat;
  radius: readonly [number, number];
  kernel: readonly number[];
  borderMode: GPURasterBorderMode;
  borderValue?: number;
  noDataPolicy?: GPURasterNoDataPolicy;
  normalize?: boolean;
  validity?: Uint32Array;
  noDataValue?: number;
  scale?: number;
  offset?: number;
};

test('GPURasterNeighborhood matches edge/corner/one-pixel CPU oracles for every border mode', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const modes: GPURasterBorderMode[] = ['clamp', 'reflect', 'constant', 'nodata'];
  for (const borderMode of modes) {
    for (const sideLength of [1, 3]) {
      const fixture: NeighborhoodFixture = {
        width: sideLength,
        height: sideLength,
        values: Float32Array.from(
          Array.from({length: sideLength * sideLength}, (_, index) => index + 1)
        ),
        format: 'float32',
        radius: [1, 1],
        kernel: Array.from({length: 9}, () => 1),
        borderMode,
        borderValue: 10,
        noDataPolicy:
          borderMode === 'nodata' && sideLength === 1 ? 'ignore-renormalize' : 'propagate',
        normalize: true
      };
      await assertMatchesOracle(
        testCase,
        device,
        fixture,
        `neighborhood-border-${borderMode}-${sideLength}`
      );
    }
  }

  await assertMatchesOracle(
    testCase,
    device,
    {
      width: 1,
      height: 1,
      values: Float32Array.from([3]),
      format: 'float32',
      radius: [0, 0],
      kernel: [2],
      borderMode: 'nodata',
      scale: 2,
      offset: 1
    },
    'neighborhood-radius-zero'
  );
  testCase.end();
});

test('GPURasterNeighborhood handles odd workgroups, nodata, calibrated samples, and strict/renormalized policies', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const width = 11;
  const height = 9;
  const values = Float32Array.from(
    Array.from({length: width * height}, (_, index) => (index % width) + Math.floor(index / width))
  );
  values[12] = -999;
  values[35] = Number.NaN;
  values[67] = Number.POSITIVE_INFINITY;
  const validity = Uint32Array.from(Array.from({length: values.length}, () => 1));
  validity[50] = 0;
  const fixture: NeighborhoodFixture = {
    width,
    height,
    values,
    format: 'float32',
    radius: [2, 1],
    kernel: [0, 1, 2, 1, 0, 1, 2, 4, 2, 1, 0, 1, 2, 1, 0],
    borderMode: 'reflect',
    validity,
    noDataValue: -999,
    scale: 0.5,
    offset: 2,
    normalize: true
  };

  await assertMatchesOracle(testCase, device, {...fixture, noDataPolicy: 'propagate'}, 'strict');
  const renormalized = await assertMatchesOracle(
    testCase,
    device,
    {...fixture, noDataPolicy: 'ignore-renormalize'},
    'renormalized'
  );
  for (const index of [12, 35, 50, 67]) {
    testCase.equal(renormalized.validity[index], 0, `invalid center ${index} remains invalid`);
    testCase.ok(Number.isNaN(renormalized.values[index]), `invalid center ${index} publishes NaN`);
  }

  await assertMatchesOracle(
    testCase,
    device,
    {...fixture, borderMode: 'nodata', noDataPolicy: 'ignore-renormalize'},
    'nodata-border-renormalized'
  );
  testCase.end();
});

test('GPURasterNeighborhood preserves raw signed/unsigned nodata and reusable borrowed buffers', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  await assertMatchesOracle(
    testCase,
    device,
    {
      width: 3,
      height: 1,
      values: Uint32Array.from([4294967295, 2, 4]),
      format: 'uint32',
      radius: [1, 0],
      kernel: [1, 2, 1],
      borderMode: 'clamp',
      noDataPolicy: 'ignore-renormalize',
      noDataValue: 4294967295,
      scale: 0.5,
      normalize: true
    },
    'maximum-unsigned-nodata'
  );

  const graph = new GPUCommandGraph(device, {id: 'neighborhood-reuse-offsets'});
  const sourceBuffer = makeInputBuffer(device, Int32Array.from([77, -2147483648, 2, 4]));
  const outputBuffer = makeOutputBuffer(device, 4);
  const validityBuffer = makeOutputBuffer(device, 4);
  new GPURasterNeighborhood({
    width: 3,
    height: 1,
    input: {
      id: 'signed-source',
      format: 'sint32',
      storage: {kind: 'buffer', values: importView(graph, 'source', sourceBuffer, 'sint32', 3, 4)},
      noDataValue: -2147483648,
      scale: 2,
      offset: 1
    },
    output: importView(graph, 'output', outputBuffer, 'float32', 3, 4),
    outputValidity: importView(graph, 'output-validity', validityBuffer, 'uint32', 3, 4),
    radius: 0,
    kernel: [2]
  }).addToGraph(graph);
  const compiled = graph.compile();
  submitGraph(device, compiled, 'neighborhood-first-encoding');
  const firstValues = await readFloat32(outputBuffer, 4);
  testCase.equal(firstValues[0], 0, 'output offset preserves the untouched prefix');
  testCase.ok(Number.isNaN(firstValues[1]), 'signed minimum nodata is rejected exactly');
  testCase.deepEqual(firstValues.slice(2), [10, 18], 'calibration precedes weighted convolution');
  testCase.deepEqual(await readUint32(validityBuffer, 4), [0, 0, 1, 1], 'validity offset matches');

  sourceBuffer.write(Int32Array.from([77, 1, -2147483648, 3]));
  submitGraph(device, compiled, 'neighborhood-second-encoding');
  const secondValues = await readFloat32(outputBuffer, 4);
  testCase.equal(secondValues[1], 6, 'compiled graph consumes updated borrowed source');
  testCase.ok(Number.isNaN(secondValues[2]), 'updated raw nodata remains invalid');
  testCase.equal(secondValues[3], 14, 'updated valid sample is recomputed');

  compiled.destroy();
  testCase.notOk(sourceBuffer.destroyed, 'compiled graph never destroys borrowed input');
  testCase.notOk(outputBuffer.destroyed, 'compiled graph never destroys caller-owned output');
  sourceBuffer.destroy();
  outputBuffer.destroy();
  validityBuffer.destroy();
  testCase.end();
});

async function assertMatchesOracle(
  testCase: Test,
  device: Device,
  fixture: NeighborhoodFixture,
  id: string
): Promise<{values: number[]; validity: number[]}> {
  const graph = new GPUCommandGraph(device, {id});
  const sourceBuffer = makeInputBuffer(device, fixture.values);
  const outputBuffer = makeOutputBuffer(device, fixture.values.length);
  const outputValidityBuffer = makeOutputBuffer(device, fixture.values.length);
  const sourceValidityBuffer = fixture.validity
    ? makeInputBuffer(device, fixture.validity)
    : undefined;
  const input = {
    id: `${id}-input`,
    format: fixture.format,
    storage: {
      kind: 'buffer',
      values: importView(graph, `${id}-source`, sourceBuffer, fixture.format, fixture.values.length)
    },
    ...(sourceValidityBuffer && fixture.validity
      ? {
          validity: importView(
            graph,
            `${id}-source-validity`,
            sourceValidityBuffer,
            'uint32',
            fixture.validity.length
          )
        }
      : {}),
    ...(fixture.noDataValue !== undefined ? {noDataValue: fixture.noDataValue} : {}),
    ...(fixture.scale !== undefined ? {scale: fixture.scale} : {}),
    ...(fixture.offset !== undefined ? {offset: fixture.offset} : {})
  } as GPURasterBufferBand;
  new GPURasterNeighborhood({
    id,
    width: fixture.width,
    height: fixture.height,
    input,
    output: importView(graph, `${id}-output`, outputBuffer, 'float32', fixture.values.length),
    outputValidity: importView(
      graph,
      `${id}-output-validity`,
      outputValidityBuffer,
      'uint32',
      fixture.values.length
    ),
    radius: fixture.radius,
    kernel: fixture.kernel,
    borderMode: fixture.borderMode,
    borderValue: fixture.borderValue,
    noDataPolicy: fixture.noDataPolicy,
    normalize: fixture.normalize
  }).addToGraph(graph);

  const compiled = graph.compile();
  submitGraph(device, compiled, `${id}-encode`);
  const result = {
    values: await readFloat32(outputBuffer, fixture.values.length),
    validity: await readUint32(outputValidityBuffer, fixture.values.length)
  };
  const expected = calculateNeighborhoodOracle(fixture);
  testCase.deepEqual(result.validity, expected.validity, `${id}: validity matches CPU stencil`);
  for (const [index, expectedValue] of expected.values.entries()) {
    if (Number.isNaN(expectedValue)) {
      testCase.ok(Number.isNaN(result.values[index]), `${id}: pixel ${index} remains invalid`);
    } else {
      testCase.ok(
        Math.abs(result.values[index] - expectedValue) <= 0.00002,
        `${id}: pixel ${index} matches CPU stencil (${result.values[index]} versus ${expectedValue})`
      );
    }
  }
  compiled.destroy();
  sourceBuffer.destroy();
  outputBuffer.destroy();
  outputValidityBuffer.destroy();
  sourceValidityBuffer?.destroy();
  return result;
}

function calculateNeighborhoodOracle(fixture: NeighborhoodFixture): {
  values: number[];
  validity: number[];
} {
  const values: number[] = [];
  const validity: number[] = [];
  const kernelSum = fixture.kernel.reduce((sum, coefficient) => sum + coefficient, 0);
  for (let row = 0; row < fixture.height; row++) {
    for (let column = 0; column < fixture.width; column++) {
      const center = sampleFixture(fixture, column, row);
      let valid = center.valid;
      let weightedSum = 0;
      let participatingWeight = 0;
      for (let kernelRow = -fixture.radius[1]; kernelRow <= fixture.radius[1]; kernelRow++) {
        for (
          let kernelColumn = -fixture.radius[0];
          kernelColumn <= fixture.radius[0];
          kernelColumn++
        ) {
          const coefficient =
            fixture.kernel[
              (kernelRow + fixture.radius[1]) * (fixture.radius[0] * 2 + 1) +
                kernelColumn +
                fixture.radius[0]
            ];
          if (coefficient === 0) continue;
          const sample = sampleFixture(fixture, column + kernelColumn, row + kernelRow);
          if (sample.valid) {
            weightedSum += sample.value * coefficient;
            participatingWeight += coefficient;
          } else if ((fixture.noDataPolicy ?? 'propagate') === 'propagate') {
            valid = false;
          }
        }
      }
      const normalize = fixture.normalize ?? false;
      if (
        (normalize || fixture.noDataPolicy === 'ignore-renormalize') &&
        participatingWeight === 0
      ) {
        valid = false;
      }
      const result = normalize
        ? weightedSum / participatingWeight
        : fixture.noDataPolicy === 'ignore-renormalize'
          ? (weightedSum * kernelSum) / participatingWeight
          : weightedSum;
      valid = valid && Number.isFinite(result);
      values.push(valid ? result : Number.NaN);
      validity.push(valid ? 1 : 0);
    }
  }
  return {values, validity};
}

function sampleFixture(
  fixture: NeighborhoodFixture,
  column: number,
  row: number
): {value: number; valid: boolean} {
  if (column < 0 || column >= fixture.width || row < 0 || row >= fixture.height) {
    switch (fixture.borderMode) {
      case 'clamp':
        column = Math.min(Math.max(column, 0), fixture.width - 1);
        row = Math.min(Math.max(row, 0), fixture.height - 1);
        break;
      case 'reflect':
        column = reflectCoordinate(column, fixture.width);
        row = reflectCoordinate(row, fixture.height);
        break;
      case 'constant':
        return {value: fixture.borderValue ?? 0, valid: true};
      case 'nodata':
        return {value: 0, valid: false};
    }
  }
  const pixelIndex = row * fixture.width + column;
  const rawValue = fixture.values[pixelIndex];
  const value = rawValue * (fixture.scale ?? 1) + (fixture.offset ?? 0);
  const valid =
    Number.isFinite(rawValue) &&
    Number.isFinite(value) &&
    fixture.validity?.[pixelIndex] !== 0 &&
    (fixture.noDataValue === undefined || rawValue !== fixture.noDataValue);
  return {value, valid};
}

function reflectCoordinate(coordinate: number, length: number): number {
  if (length <= 1) return 0;
  const period = (length - 1) * 2;
  const reflected = ((coordinate % period) + period) % period;
  return reflected >= length ? period - reflected : reflected;
}

function makeInputBuffer(device: Device, data: Float32Array | Uint32Array | Int32Array): Buffer {
  return device.createBuffer({data, usage: Buffer.STORAGE | Buffer.COPY_DST});
}

function makeOutputBuffer(device: Device, length: number): Buffer {
  return device.createBuffer({
    byteLength: Math.max(length, 1) * 4,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function importView<Format extends GPURasterScalarFormat>(
  graph: GPUCommandGraph,
  id: string,
  buffer: Buffer,
  format: Format,
  length: number,
  byteOffset: number = 0
): GraphDataView<Format> {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length, byteOffset});
}

function submitGraph(
  device: Device,
  compiled: ReturnType<GPUCommandGraph['compile']>,
  id: string
): void {
  const encoder = device.createCommandEncoder({id});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
}

async function readFloat32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
}

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}
