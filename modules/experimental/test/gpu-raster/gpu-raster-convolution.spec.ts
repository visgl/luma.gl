// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test, {type Test} from '../../../../test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {
  GPURasterBoxBlur,
  GPURasterConvolution,
  GPURasterGaussianBlur,
  type GPURasterBorderMode,
  type GPURasterBufferBand,
  type GPURasterNoDataPolicy,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/gpu-raster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

type ConvolutionFixture = {
  width: number;
  height: number;
  values: Float32Array;
  validity?: Uint32Array;
  noDataValue?: number;
  kernel: readonly number[];
  radius: readonly [number, number];
  borderMode: GPURasterBorderMode;
  borderValue?: number;
  noDataPolicy?: GPURasterNoDataPolicy;
  normalize?: boolean;
};

test('GPURasterConvolution preserves signed impulse responses and rectangular ramp derivatives', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const impulse = new Float32Array(25);
  impulse[12] = 1;
  await assertOperatorMatchesOracle(
    testCase,
    device,
    'signed-impulse',
    {
      width: 5,
      height: 5,
      values: impulse,
      kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0],
      radius: [1, 1],
      borderMode: 'clamp'
    },
    'convolution'
  );

  const ramp = Float32Array.from(
    Array.from({length: 9 * 7}, (_, index) => (index % 9) * 3 + Math.floor(index / 9))
  );
  await assertOperatorMatchesOracle(
    testCase,
    device,
    'rectangular-ramp-derivative',
    {
      width: 9,
      height: 7,
      values: ramp,
      kernel: [-1, 0, 1],
      radius: [1, 0],
      borderMode: 'reflect'
    },
    'convolution'
  );
  testCase.end();
});

test('GPURasterGaussianBlur matches the full normalized outer-product CPU reference', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const width = 11;
  const height = 9;
  const radius = 2;
  const sigma = 1.15;
  const values = Float32Array.from(
    Array.from(
      {length: width * height},
      (_, index) => Math.sin((index % width) * 0.37) * 4 + Math.floor(index / width) * 0.25
    )
  );
  values[4 * width + 5] += 3;
  const oneDimensionalKernel = Array.from({length: radius * 2 + 1}, (_, index) => {
    const distance = index - radius;
    return Math.exp(-(distance * distance) / (2 * sigma * sigma));
  });
  const fullKernel = oneDimensionalKernel.flatMap(vertical =>
    oneDimensionalKernel.map(horizontal => horizontal * vertical)
  );
  const fixture: ConvolutionFixture = {
    width,
    height,
    values,
    kernel: fullKernel,
    radius: [radius, radius],
    borderMode: 'reflect',
    normalize: true
  };
  const execution = await executeOperator(
    device,
    'gaussian-separability',
    fixture,
    'gaussian',
    sigma
  );
  assertResultsMatch(
    testCase,
    execution,
    calculateConvolutionOracle(fixture),
    'Gaussian separability'
  );
  testCase.deepEqual(
    execution.stats.nodeOrder,
    ['gaussian-separability-horizontal', 'gaussian-separability-vertical'],
    'separable Gaussian contributes two dependency-ordered passes'
  );
  testCase.equal(execution.stats.logicalTransientBufferCount, 2, 'sample and validity scratch');
  testCase.equal(
    execution.stats.logicalTransientBytes,
    width * height * 8,
    'scratch stores one float32 sample and one uint32 validity per pixel'
  );
  testCase.end();
});

test('GPURasterBoxBlur preserves constant scenes and matches odd-size bordered ramp averages', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const constantFixture: ConvolutionFixture = {
    width: 11,
    height: 9,
    values: Float32Array.from(Array.from({length: 99}, () => 7.5)),
    kernel: Array.from({length: 49}, () => 1),
    radius: [3, 3],
    borderMode: 'clamp',
    normalize: true
  };
  await assertOperatorMatchesOracle(
    testCase,
    device,
    'box-constant-odd-size',
    constantFixture,
    'box'
  );

  const rampFixture: ConvolutionFixture = {
    width: 9,
    height: 7,
    values: Float32Array.from(
      Array.from({length: 63}, (_, index) => (index % 9) * 0.5 + Math.floor(index / 9))
    ),
    kernel: Array.from({length: 25}, () => 1),
    radius: [2, 2],
    borderMode: 'constant',
    borderValue: 4,
    normalize: true
  };
  await assertOperatorMatchesOracle(
    testCase,
    device,
    'box-constant-border-ramp',
    rampFixture,
    'box'
  );
  testCase.end();
});

test('GPURaster separable smoothing propagates or renormalizes nodata without reviving invalid centers', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const width = 7;
  const height = 5;
  const values = Float32Array.from(Array.from({length: width * height}, (_, index) => index + 1));
  values[9] = -999;
  values[24] = Number.NaN;
  const validity = Uint32Array.from(Array.from({length: values.length}, () => 1));
  validity[17] = 0;

  for (const noDataPolicy of ['propagate', 'ignore-renormalize'] as const) {
    const fixture: ConvolutionFixture = {
      width,
      height,
      values,
      validity,
      noDataValue: -999,
      kernel: Array.from({length: 9}, () => 1),
      radius: [1, 1],
      borderMode: 'reflect',
      noDataPolicy,
      normalize: true
    };
    const horizontalFixture = {...fixture, radius: [1, 0] as const, kernel: [1, 1, 1]};
    const horizontal = calculateConvolutionOracle(horizontalFixture);
    const vertical = calculateConvolutionOracle({
      ...fixture,
      values: Float32Array.from(horizontal.values),
      validity: Uint32Array.from(horizontal.validity),
      noDataValue: undefined,
      radius: [0, 1],
      kernel: [1, 1, 1]
    });
    const execution = await executeOperator(device, `box-nodata-${noDataPolicy}`, fixture, 'box');
    assertResultsMatch(testCase, execution, vertical, `${noDataPolicy} per-axis smoothing`);
    for (const invalidCenter of [9, 17, 24]) {
      testCase.equal(
        execution.validity[invalidCenter],
        0,
        `${noDataPolicy}: center remains invalid`
      );
    }
  }
  testCase.end();
});

test('GPURaster smoothing reuses graph-planned scratch across chained reusable operators', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'smoothing-scratch-reuse'});
  const sourceBuffer = makeInputBuffer(device, Float32Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  const boxBuffer = makeOutputBuffer(device, 9);
  const boxValidityBuffer = makeOutputBuffer(device, 9);
  const gaussianBuffer = makeOutputBuffer(device, 9);
  const gaussianValidityBuffer = makeOutputBuffer(device, 9);
  const source: GPURasterBufferBand<'float32'> = {
    id: 'source',
    format: 'float32',
    storage: {kind: 'buffer', values: importView(graph, 'source', sourceBuffer, 'float32', 9)}
  };
  const boxValues = importView(graph, 'box-values', boxBuffer, 'float32', 9);
  const boxValidity = importView(graph, 'box-validity', boxValidityBuffer, 'uint32', 9);
  new GPURasterBoxBlur({
    id: 'box',
    width: 3,
    height: 3,
    input: source,
    output: boxValues,
    outputValidity: boxValidity,
    radius: 1
  }).addToGraph(graph);
  new GPURasterGaussianBlur({
    id: 'gaussian',
    width: 3,
    height: 3,
    input: {
      id: 'box-output',
      format: 'float32',
      storage: {kind: 'buffer', values: boxValues},
      validity: boxValidity
    },
    output: importView(graph, 'gaussian-values', gaussianBuffer, 'float32', 9),
    outputValidity: importView(graph, 'gaussian-validity', gaussianValidityBuffer, 'uint32', 9),
    radius: 1,
    sigma: 0.8
  }).addToGraph(graph);

  const compiled = graph.compile();
  testCase.deepEqual(
    compiled.stats.nodeOrder,
    ['box-horizontal', 'box-vertical', 'gaussian-horizontal', 'gaussian-vertical'],
    'all four pass dependencies remain visible to the graph scheduler'
  );
  testCase.equal(
    compiled.stats.logicalTransientBufferCount,
    4,
    'two logical scratch buffers/filter'
  );
  testCase.equal(
    compiled.stats.physicalTransientBufferCount,
    2,
    'graph reuses two physical buffers'
  );
  testCase.equal(
    compiled.stats.reusedTransientBytes,
    72,
    'scratch reuse avoids 72 duplicate bytes'
  );
  submitGraph(device, compiled, 'smoothing-first-encoding');
  const firstValues = await readFloat32(gaussianBuffer, 9);
  sourceBuffer.write(Float32Array.from(Array.from({length: 9}, () => 4)));
  submitGraph(device, compiled, 'smoothing-second-encoding');
  const secondValues = await readFloat32(gaussianBuffer, 9);
  testCase.ok(
    firstValues.some(value => Math.abs(value - 4) > 0.01),
    'first scene is nonconstant'
  );
  testCase.ok(
    secondValues.every(value => Math.abs(value - 4) < 0.00001),
    'compiled graph recomputes the replacement scene without rebuilding scratch'
  );

  compiled.destroy();
  for (const buffer of [
    sourceBuffer,
    boxBuffer,
    boxValidityBuffer,
    gaussianBuffer,
    gaussianValidityBuffer
  ]) {
    testCase.notOk(buffer.destroyed, 'imported storage remains caller-owned');
    buffer.destroy();
  }
  testCase.end();
});

async function assertOperatorMatchesOracle(
  testCase: Test,
  device: Device,
  id: string,
  fixture: ConvolutionFixture,
  operator: 'convolution' | 'box' | 'gaussian'
): Promise<void> {
  const execution = await executeOperator(device, id, fixture, operator);
  assertResultsMatch(testCase, execution, calculateConvolutionOracle(fixture), id);
}

async function executeOperator(
  device: Device,
  id: string,
  fixture: ConvolutionFixture,
  operator: 'convolution' | 'box' | 'gaussian',
  sigma?: number
): Promise<{
  values: number[];
  validity: number[];
  stats: ReturnType<GPUCommandGraph['compile']>['stats'];
}> {
  const graph = new GPUCommandGraph(device, {id});
  const sourceBuffer = makeInputBuffer(device, fixture.values);
  const sourceValidityBuffer = fixture.validity
    ? makeInputBuffer(device, fixture.validity)
    : undefined;
  const outputBuffer = makeOutputBuffer(device, fixture.values.length);
  const outputValidityBuffer = makeOutputBuffer(device, fixture.values.length);
  const input: GPURasterBufferBand<'float32'> = {
    id: `${id}-input`,
    format: 'float32',
    storage: {
      kind: 'buffer',
      values: importView(
        graph,
        `${id}-input-values`,
        sourceBuffer,
        'float32',
        fixture.values.length
      )
    },
    ...(sourceValidityBuffer && fixture.validity
      ? {
          validity: importView(
            graph,
            `${id}-input-validity`,
            sourceValidityBuffer,
            'uint32',
            fixture.validity.length
          )
        }
      : {}),
    ...(fixture.noDataValue !== undefined ? {noDataValue: fixture.noDataValue} : {})
  };
  const props = {
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
    borderMode: fixture.borderMode,
    borderValue: fixture.borderValue,
    noDataPolicy: fixture.noDataPolicy
  };
  switch (operator) {
    case 'convolution':
      new GPURasterConvolution({
        ...props,
        kernel: fixture.kernel,
        kernelWidth: fixture.radius[0] * 2 + 1,
        kernelHeight: fixture.radius[1] * 2 + 1,
        normalize: fixture.normalize
      }).addToGraph(graph);
      break;
    case 'box':
      new GPURasterBoxBlur({...props, radius: fixture.radius[0]}).addToGraph(graph);
      break;
    case 'gaussian':
      new GPURasterGaussianBlur({...props, radius: fixture.radius[0], sigma}).addToGraph(graph);
      break;
  }
  const compiled = graph.compile();
  submitGraph(device, compiled, `${id}-encode`);
  const result = {
    values: await readFloat32(outputBuffer, fixture.values.length),
    validity: await readUint32(outputValidityBuffer, fixture.values.length),
    stats: compiled.stats
  };
  compiled.destroy();
  sourceBuffer.destroy();
  sourceValidityBuffer?.destroy();
  outputBuffer.destroy();
  outputValidityBuffer.destroy();
  return result;
}

function assertResultsMatch(
  testCase: Test,
  actual: {values: number[]; validity: number[]},
  expected: {values: number[]; validity: number[]},
  label: string
): void {
  testCase.deepEqual(actual.validity, expected.validity, `${label}: validity matches CPU`);
  for (const [index, expectedValue] of expected.values.entries()) {
    if (Number.isNaN(expectedValue)) {
      testCase.ok(Number.isNaN(actual.values[index]), `${label}: invalid pixel ${index} is NaN`);
    } else {
      testCase.ok(
        Math.abs(actual.values[index] - expectedValue) <= 0.00003,
        `${label}: pixel ${index} matches CPU (${actual.values[index]} versus ${expectedValue})`
      );
    }
  }
}

function calculateConvolutionOracle(fixture: ConvolutionFixture): {
  values: number[];
  validity: number[];
} {
  const values: number[] = [];
  const validity: number[] = [];
  const kernelSum = fixture.kernel.reduce((sum, coefficient) => sum + coefficient, 0);
  for (let row = 0; row < fixture.height; row++) {
    for (let column = 0; column < fixture.width; column++) {
      let valid = sampleFixture(fixture, column, row).valid;
      let weightedSum = 0;
      let weight = 0;
      for (let vertical = -fixture.radius[1]; vertical <= fixture.radius[1]; vertical++) {
        for (let horizontal = -fixture.radius[0]; horizontal <= fixture.radius[0]; horizontal++) {
          const coefficient =
            fixture.kernel[
              (vertical + fixture.radius[1]) * (fixture.radius[0] * 2 + 1) +
                horizontal +
                fixture.radius[0]
            ];
          if (coefficient === 0) continue;
          const sample = sampleFixture(fixture, column + horizontal, row + vertical);
          if (sample.valid) {
            weightedSum += sample.value * coefficient;
            weight += coefficient;
          } else if ((fixture.noDataPolicy ?? 'propagate') === 'propagate') {
            valid = false;
          }
        }
      }
      const result = fixture.normalize
        ? weightedSum / weight
        : fixture.noDataPolicy === 'ignore-renormalize'
          ? (weightedSum * kernelSum) / weight
          : weightedSum;
      valid = valid && Number.isFinite(result);
      values.push(valid ? result : Number.NaN);
      validity.push(valid ? 1 : 0);
    }
  }
  return {values, validity};
}

function sampleFixture(
  fixture: ConvolutionFixture,
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
  const index = row * fixture.width + column;
  const value = fixture.values[index];
  return {
    value,
    valid:
      Number.isFinite(value) &&
      fixture.validity?.[index] !== 0 &&
      (fixture.noDataValue === undefined || value !== fixture.noDataValue)
  };
}

function reflectCoordinate(coordinate: number, length: number): number {
  if (length <= 1) return 0;
  const period = (length - 1) * 2;
  const reflected = ((coordinate % period) + period) % period;
  return reflected >= length ? period - reflected : reflected;
}

function makeInputBuffer(device: Device, data: Float32Array | Uint32Array): Buffer {
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
  length: number
): GraphDataView<Format> {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length});
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
