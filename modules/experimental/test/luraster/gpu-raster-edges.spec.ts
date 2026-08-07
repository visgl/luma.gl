// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test, {type Test} from '../../../../test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/experimental';
import {
  GPURasterGradient,
  GPURasterGradientMagnitude,
  GPURasterLaplacian,
  GPURasterScharr,
  GPURasterSobel,
  type GPURasterBorderMode,
  type GPURasterBufferBand,
  type GPURasterGradientDirection,
  type GPURasterGradientOperator,
  type GPURasterLaplacianConnectivity,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/luraster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

type EdgeFixture = {
  width: number;
  height: number;
  values: Float32Array | Uint32Array | Int32Array;
  format?: GPURasterScalarFormat;
  mode: 'gradient' | 'sobel' | 'scharr' | 'laplacian' | 'magnitude';
  operator?: GPURasterGradientOperator;
  direction?: GPURasterGradientDirection;
  connectivity?: GPURasterLaplacianConnectivity;
  borderMode?: GPURasterBorderMode;
  borderValue?: number;
  scale?: number;
  inputScale?: number;
  inputOffset?: number;
  validity?: Uint32Array;
  noDataValue?: number;
  prefixLength?: number;
};

type EdgeResult = {
  values: number[];
  validity: number[];
  prefixedValues: number[];
  prefixedValidity: number[];
  stats: ReturnType<GPUCommandGraph['compile']>['stats'];
};

test('LuRaster gradients preserve signed Sobel/Scharr ramp responses, scaling, and every border mode', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const width = 9;
  const height = 7;
  const ramp = Float32Array.from(
    Array.from(
      {length: width * height},
      (_, index) => (index % width) * 2 + Math.floor(index / width) * 3
    )
  );
  const configurations = [
    {mode: 'sobel', operator: 'sobel', direction: 'x', response: 16},
    {mode: 'gradient', operator: 'sobel', direction: 'y', response: 24},
    {mode: 'scharr', operator: 'scharr', direction: 'x', response: 64},
    {mode: 'gradient', operator: 'scharr', direction: 'y', response: 96}
  ] as const;
  for (const configuration of configurations) {
    const fixture: EdgeFixture = {
      width,
      height,
      values: ramp,
      mode: configuration.mode,
      operator: configuration.operator,
      direction: configuration.direction,
      borderMode: 'clamp'
    };
    const result = await assertEdgeMatchesOracle(
      testCase,
      device,
      `${configuration.operator}-${configuration.direction}-ramp`,
      fixture
    );
    testCase.equal(
      result.values[3 * width + 4],
      configuration.response,
      `${configuration.operator} ${configuration.direction} preserves its raw signed response`
    );
  }

  const scaled = await assertEdgeMatchesOracle(testCase, device, 'scaled-sobel-ramp', {
    width,
    height,
    values: ramp,
    mode: 'sobel',
    direction: 'x',
    scale: 0.125,
    borderMode: 'clamp'
  });
  testCase.equal(scaled.values[3 * width + 4], 2, 'positive scale multiplies the signed response');

  for (const borderMode of ['clamp', 'reflect', 'constant', 'nodata'] as const) {
    await assertEdgeMatchesOracle(testCase, device, `sobel-border-${borderMode}`, {
      width: 3,
      height: 3,
      values: Float32Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9]),
      mode: 'sobel',
      direction: 'x',
      borderMode,
      borderValue: 5
    });
  }
  await assertEdgeMatchesOracle(testCase, device, 'scharr-one-pixel-reflect', {
    width: 1,
    height: 1,
    values: Float32Array.from([11]),
    mode: 'scharr',
    direction: 'y',
    borderMode: 'reflect'
  });
  testCase.end();
});

test('LuRaster Laplacians preserve signed four/eight-connected impulse responses and constant regions', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const impulse = new Float32Array(25);
  impulse[12] = 1;
  for (const connectivity of [4, 8] as const) {
    const result = await assertEdgeMatchesOracle(testCase, device, `laplacian-${connectivity}`, {
      width: 5,
      height: 5,
      values: impulse,
      mode: 'laplacian',
      connectivity,
      borderMode: 'clamp'
    });
    testCase.equal(result.values[12], -connectivity, 'positive impulse has a negative center');
    testCase.equal(
      result.values[6],
      connectivity === 8 ? 1 : 0,
      'diagonal response follows connectivity'
    );
    testCase.equal(result.values[7], 1, 'orthogonal impulse response remains positive');
  }

  const constant = await assertEdgeMatchesOracle(testCase, device, 'laplacian-constant', {
    width: 7,
    height: 5,
    values: Float32Array.from(Array.from({length: 35}, () => 17)),
    mode: 'laplacian',
    connectivity: 8,
    scale: 0.5,
    borderMode: 'reflect'
  });
  testCase.ok(
    constant.values.every(value => value === 0),
    'constant scenes have zero curvature'
  );
  testCase.end();
});

test('LuRaster edges reject native integer nodata, NaN, masks and preserve calibration/view offsets', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const unsignedValues = Uint32Array.from(
    Array.from({length: 35}, (_, index) => (index % 7) * 2 + Math.floor(index / 7))
  );
  unsignedValues[10] = 4294967295;
  const unsignedValidity = Uint32Array.from(Array.from({length: 35}, () => 1));
  unsignedValidity[24] = 0;
  const unsigned = await assertEdgeMatchesOracle(testCase, device, 'unsigned-nodata-offsets', {
    width: 7,
    height: 5,
    values: unsignedValues,
    format: 'uint32',
    mode: 'sobel',
    direction: 'x',
    noDataValue: 4294967295,
    validity: unsignedValidity,
    inputScale: 0.5,
    inputOffset: 20,
    scale: 0.25,
    prefixLength: 1,
    borderMode: 'clamp'
  });
  testCase.equal(unsigned.prefixedValues[0], 0, 'float32 output prefix remains untouched');
  testCase.equal(unsigned.prefixedValidity[0], 0, 'validity prefix remains untouched');
  testCase.equal(unsigned.validity[10], 0, 'raw maximum uint32 nodata stays invalid');
  testCase.equal(unsigned.validity[24], 0, 'explicit validity masks stay invalid');

  const signedValues = Int32Array.from(Array.from({length: 25}, (_, index) => index - 12));
  signedValues[12] = -2147483648;
  await assertEdgeMatchesOracle(testCase, device, 'signed-nodata-scharr', {
    width: 5,
    height: 5,
    values: signedValues,
    format: 'sint32',
    mode: 'scharr',
    direction: 'y',
    noDataValue: -2147483648,
    inputScale: 2,
    inputOffset: 1,
    borderMode: 'reflect'
  });

  const floatingValues = Float32Array.from(Array.from({length: 35}, (_, index) => index));
  floatingValues[9] = Number.NaN;
  floatingValues[22] = Number.POSITIVE_INFINITY;
  const floatingValidity = Uint32Array.from(Array.from({length: 35}, () => 1));
  floatingValidity[18] = 0;
  const floating = await assertEdgeMatchesOracle(testCase, device, 'floating-invalid-magnitude', {
    width: 7,
    height: 5,
    values: floatingValues,
    mode: 'magnitude',
    validity: floatingValidity,
    borderMode: 'clamp'
  });
  for (const index of [9, 18, 22]) {
    testCase.equal(floating.validity[index], 0, `invalid center ${index} remains masked`);
    testCase.ok(Number.isNaN(floating.values[index]), `invalid center ${index} publishes NaN`);
  }
  testCase.end();
});

test('LuRaster gradient magnitude uses graph-owned scratch and overflow-stable GPU hypot', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const width = 9;
  const height = 7;
  const ramp = Float32Array.from(
    Array.from(
      {length: width * height},
      (_, index) => (index % width) * 3 + Math.floor(index / width) * 4
    )
  );
  for (const operator of ['sobel', 'scharr'] as const) {
    const result = await assertEdgeMatchesOracle(testCase, device, `${operator}-magnitude`, {
      width,
      height,
      values: ramp,
      mode: 'magnitude',
      operator,
      borderMode: 'reflect'
    });
    testCase.deepEqual(
      result.stats.nodeOrder,
      [
        `${operator}-magnitude-horizontal`,
        `${operator}-magnitude-vertical`,
        `${operator}-magnitude-magnitude`
      ],
      `${operator} magnitude contributes three dependency-ordered GPU passes`
    );
    testCase.equal(result.stats.logicalTransientBufferCount, 4, 'both directions own values/masks');
    testCase.equal(result.stats.physicalTransientBufferCount, 4, 'all four live until hypot');
    testCase.equal(
      result.stats.logicalTransientBytes,
      width * height * 16,
      'four float32-width buffers'
    );
    testCase.equal(
      result.values[3 * width + 4],
      operator === 'sobel' ? 40 : 160,
      'orthogonal 3-4 ramp yields an exact 5-scaled magnitude'
    );
  }

  const hugeRamp = Float32Array.from(
    Array.from(
      {length: width * height},
      (_, index) => (index % width) * 1e20 + Math.floor(index / width) * 0.75e20
    )
  );
  const stable = await assertEdgeMatchesOracle(testCase, device, 'overflow-stable-magnitude', {
    width,
    height,
    values: hugeRamp,
    mode: 'magnitude',
    borderMode: 'clamp'
  });
  testCase.ok(
    Number.isFinite(stable.values[3 * width + 4]) && stable.values[3 * width + 4] > 1e20,
    'magnitude remains finite even though naively squaring either component overflows float32'
  );
  testCase.end();
});

test('LuRaster chained magnitudes reuse transient allocations and preserve imported buffer ownership', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const width = 5;
  const height = 5;
  const pixelCount = width * height;
  const graph = new GPUCommandGraph(device, {id: 'chained-edge-strength'});
  const sourceBuffer = makeInputBuffer(
    device,
    Float32Array.from(Array.from({length: pixelCount}, (_, index) => index))
  );
  const firstOutputBuffer = makeOutputBuffer(device, pixelCount);
  const firstValidityBuffer = makeOutputBuffer(device, pixelCount);
  const secondOutputBuffer = makeOutputBuffer(device, pixelCount);
  const secondValidityBuffer = makeOutputBuffer(device, pixelCount);
  const firstValues = importView(graph, 'first-values', firstOutputBuffer, 'float32', pixelCount);
  const firstValidity = importView(
    graph,
    'first-validity',
    firstValidityBuffer,
    'uint32',
    pixelCount
  );
  new GPURasterGradientMagnitude({
    id: 'first',
    width,
    height,
    input: {
      id: 'source',
      format: 'float32',
      storage: {
        kind: 'buffer',
        values: importView(graph, 'source', sourceBuffer, 'float32', pixelCount)
      }
    },
    output: firstValues,
    outputValidity: firstValidity
  }).addToGraph(graph);
  new GPURasterGradientMagnitude({
    id: 'second',
    width,
    height,
    input: {
      id: 'first-output',
      format: 'float32',
      storage: {kind: 'buffer', values: firstValues},
      validity: firstValidity
    },
    output: importView(graph, 'second-values', secondOutputBuffer, 'float32', pixelCount),
    outputValidity: importView(
      graph,
      'second-validity',
      secondValidityBuffer,
      'uint32',
      pixelCount
    ),
    operator: 'scharr',
    scale: 0.125
  }).addToGraph(graph);

  const compiled = graph.compile();
  testCase.equal(
    compiled.stats.logicalTransientBufferCount,
    8,
    'four logical buffers per magnitude'
  );
  testCase.equal(
    compiled.stats.physicalTransientBufferCount,
    4,
    'nonoverlapping lifetimes reuse four buffers'
  );
  testCase.equal(
    compiled.stats.reusedTransientBytes,
    pixelCount * 16,
    'scratch reuse avoids duplicate allocations'
  );
  submitGraph(device, compiled, 'first-edge-encoding');
  const initial = await readFloat32(secondOutputBuffer, pixelCount);
  testCase.ok(
    initial.some(value => value !== 0),
    'first scene produces a nonconstant edge response'
  );

  sourceBuffer.write(Float32Array.from(Array.from({length: pixelCount}, () => 7)));
  submitGraph(device, compiled, 'second-edge-encoding');
  const updated = await readFloat32(secondOutputBuffer, pixelCount);
  testCase.ok(
    updated.every(value => value === 0),
    'reusable graph recomputes replacement constant scene'
  );

  compiled.destroy();
  for (const buffer of [
    sourceBuffer,
    firstOutputBuffer,
    firstValidityBuffer,
    secondOutputBuffer,
    secondValidityBuffer
  ]) {
    testCase.notOk(buffer.destroyed, 'graph never destroys imported caller-owned storage');
    buffer.destroy();
  }
  testCase.end();
});

async function assertEdgeMatchesOracle(
  testCase: Test,
  device: Device,
  id: string,
  fixture: EdgeFixture
): Promise<EdgeResult> {
  const result = await executeEdge(device, id, fixture);
  const expected = calculateEdgeOracle(fixture);
  testCase.deepEqual(result.validity, expected.validity, `${id}: validity matches CPU oracle`);
  for (const [index, expectedValue] of expected.values.entries()) {
    if (Number.isNaN(expectedValue)) {
      testCase.ok(
        Number.isNaN(result.values[index]),
        `${id}: invalid pixel ${index} publishes NaN`
      );
    } else {
      const tolerance = Math.max(0.0001, Math.abs(expectedValue) * 0.00003);
      testCase.ok(
        Math.abs(result.values[index] - expectedValue) <= tolerance,
        `${id}: pixel ${index} matches CPU (${result.values[index]} versus ${expectedValue})`
      );
    }
  }
  return result;
}

async function executeEdge(device: Device, id: string, fixture: EdgeFixture): Promise<EdgeResult> {
  const pixelCount = fixture.width * fixture.height;
  const prefixLength = fixture.prefixLength ?? 0;
  const graph = new GPUCommandGraph(device, {id});
  const prefixedInput = makePrefixedValues(fixture.values, prefixLength);
  const sourceBuffer = makeInputBuffer(device, prefixedInput);
  const sourceValidityBuffer = fixture.validity
    ? makeInputBuffer(device, makePrefixedValues(fixture.validity, prefixLength))
    : undefined;
  const outputBuffer = makeOutputBuffer(device, pixelCount + prefixLength);
  const outputValidityBuffer = makeOutputBuffer(device, pixelCount + prefixLength);
  const format = fixture.format ?? 'float32';
  const byteOffset = prefixLength * Float32Array.BYTES_PER_ELEMENT;
  const input: GPURasterBufferBand = {
    id: `${id}-input`,
    format,
    storage: {
      kind: 'buffer',
      values: importView(graph, `${id}-source`, sourceBuffer, format, pixelCount, byteOffset)
    },
    ...(sourceValidityBuffer
      ? {
          validity: importView(
            graph,
            `${id}-source-validity`,
            sourceValidityBuffer,
            'uint32',
            pixelCount,
            byteOffset
          )
        }
      : {}),
    ...(fixture.noDataValue !== undefined ? {noDataValue: fixture.noDataValue} : {}),
    ...(fixture.inputScale !== undefined ? {scale: fixture.inputScale} : {}),
    ...(fixture.inputOffset !== undefined ? {offset: fixture.inputOffset} : {})
  } as GPURasterBufferBand;
  const props = {
    id,
    width: fixture.width,
    height: fixture.height,
    input,
    output: importView(graph, `${id}-output`, outputBuffer, 'float32', pixelCount, byteOffset),
    outputValidity: importView(
      graph,
      `${id}-output-validity`,
      outputValidityBuffer,
      'uint32',
      pixelCount,
      byteOffset
    ),
    borderMode: fixture.borderMode,
    borderValue: fixture.borderValue,
    scale: fixture.scale
  };
  switch (fixture.mode) {
    case 'gradient':
      new GPURasterGradient({
        ...props,
        operator: fixture.operator ?? 'sobel',
        direction: fixture.direction ?? 'x'
      }).addToGraph(graph);
      break;
    case 'sobel':
      new GPURasterSobel({...props, direction: fixture.direction ?? 'x'}).addToGraph(graph);
      break;
    case 'scharr':
      new GPURasterScharr({...props, direction: fixture.direction ?? 'x'}).addToGraph(graph);
      break;
    case 'laplacian':
      new GPURasterLaplacian({...props, connectivity: fixture.connectivity}).addToGraph(graph);
      break;
    case 'magnitude':
      new GPURasterGradientMagnitude({...props, operator: fixture.operator}).addToGraph(graph);
      break;
  }
  const compiled = graph.compile();
  submitGraph(device, compiled, `${id}-encode`);
  const prefixedValues = await readFloat32(outputBuffer, pixelCount + prefixLength);
  const prefixedValidity = await readUint32(outputValidityBuffer, pixelCount + prefixLength);
  const result = {
    values: prefixedValues.slice(prefixLength),
    validity: prefixedValidity.slice(prefixLength),
    prefixedValues,
    prefixedValidity,
    stats: compiled.stats
  };
  compiled.destroy();
  sourceBuffer.destroy();
  sourceValidityBuffer?.destroy();
  outputBuffer.destroy();
  outputValidityBuffer.destroy();
  return result;
}

function calculateEdgeOracle(fixture: EdgeFixture): {values: number[]; validity: number[]} {
  const operator = fixture.mode === 'scharr' ? 'scharr' : (fixture.operator ?? 'sobel');
  if (fixture.mode === 'magnitude') {
    const horizontal = calculateStencilOracle(fixture, getGradientKernel(operator, 'x'));
    const vertical = calculateStencilOracle(fixture, getGradientKernel(operator, 'y'));
    return {
      values: horizontal.values.map((value, index) =>
        horizontal.validity[index] !== 0 && vertical.validity[index] !== 0
          ? Math.hypot(value, vertical.values[index])
          : Number.NaN
      ),
      validity: horizontal.validity.map((value, index) =>
        value !== 0 && vertical.validity[index] !== 0 ? 1 : 0
      )
    };
  }
  const kernel =
    fixture.mode === 'laplacian'
      ? (fixture.connectivity ?? 4) === 4
        ? [0, 1, 0, 1, -4, 1, 0, 1, 0]
        : [1, 1, 1, 1, -8, 1, 1, 1, 1]
      : getGradientKernel(operator, fixture.direction ?? 'x');
  return calculateStencilOracle(fixture, kernel);
}

function calculateStencilOracle(
  fixture: EdgeFixture,
  kernel: readonly number[]
): {values: number[]; validity: number[]} {
  const values: number[] = [];
  const validity: number[] = [];
  for (let row = 0; row < fixture.height; row++) {
    for (let column = 0; column < fixture.width; column++) {
      let valid = sampleFixture(fixture, column, row).valid;
      let weightedSum = 0;
      for (let vertical = -1; vertical <= 1; vertical++) {
        for (let horizontal = -1; horizontal <= 1; horizontal++) {
          const coefficient = kernel[(vertical + 1) * 3 + horizontal + 1];
          if (coefficient === 0) continue;
          const sample = sampleFixture(fixture, column + horizontal, row + vertical);
          if (sample.valid) {
            weightedSum += sample.value * coefficient * (fixture.scale ?? 1);
          } else {
            valid = false;
          }
        }
      }
      valid = valid && Number.isFinite(weightedSum);
      values.push(valid ? weightedSum : Number.NaN);
      validity.push(valid ? 1 : 0);
    }
  }
  return {values, validity};
}

function sampleFixture(
  fixture: EdgeFixture,
  column: number,
  row: number
): {value: number; valid: boolean} {
  if (column < 0 || column >= fixture.width || row < 0 || row >= fixture.height) {
    switch (fixture.borderMode ?? 'clamp') {
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
  const rawValue = fixture.values[index];
  const calibratedValue = rawValue * (fixture.inputScale ?? 1) + (fixture.inputOffset ?? 0);
  return {
    value: calibratedValue,
    valid:
      Number.isFinite(rawValue) &&
      Number.isFinite(calibratedValue) &&
      fixture.validity?.[index] !== 0 &&
      (fixture.noDataValue === undefined || rawValue !== fixture.noDataValue)
  };
}

function reflectCoordinate(coordinate: number, length: number): number {
  if (length <= 1) return 0;
  const period = (length - 1) * 2;
  const reflected = ((coordinate % period) + period) % period;
  return reflected >= length ? period - reflected : reflected;
}

function getGradientKernel(
  operator: GPURasterGradientOperator,
  direction: GPURasterGradientDirection
): readonly number[] {
  if (operator === 'sobel') {
    return direction === 'x' ? [-1, 0, 1, -2, 0, 2, -1, 0, 1] : [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  }
  return direction === 'x' ? [-3, 0, 3, -10, 0, 10, -3, 0, 3] : [-3, -10, -3, 0, 0, 0, 3, 10, 3];
}

function makePrefixedValues(
  values: Float32Array | Uint32Array | Int32Array,
  prefixLength: number
): Float32Array | Uint32Array | Int32Array {
  const result =
    values instanceof Float32Array
      ? new Float32Array(values.length + prefixLength)
      : values instanceof Uint32Array
        ? new Uint32Array(values.length + prefixLength)
        : new Int32Array(values.length + prefixLength);
  result.set(values, prefixLength);
  return result;
}

function makeInputBuffer(device: Device, values: Float32Array | Uint32Array | Int32Array): Buffer {
  return device.createBuffer({data: values, usage: Buffer.STORAGE | Buffer.COPY_DST});
}

function makeOutputBuffer(device: Device, length: number): Buffer {
  return device.createBuffer({
    byteLength: Math.max(length, 1) * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function importView<Format extends GPURasterScalarFormat>(
  graph: GPUCommandGraph,
  id: string,
  buffer: Buffer,
  format: Format,
  length: number,
  byteOffset = 0
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
