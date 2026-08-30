// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test, {type Test} from '../../../../test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {
  GPURasterBandMath,
  GPURasterHistogram,
  GPURasterNDVI,
  type GPURasterBandMathOperation,
  type GPURasterBufferBand,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/gpu-raster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

type ScalarArray = Float32Array | Uint32Array | Int32Array;

test('GPURaster composes calibrated NDVI, masked extent, and histogram without intermediate readback', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'ndvi-histogram-pipeline'});
  const nearInfraredBuffer = createInputBuffer(device, Uint32Array.from([1, 3, 1, 7, 9, 1, 5, 4]));
  const redBuffer = createInputBuffer(device, Int32Array.from([1, 1, 0, 1, 1, -2147483648, 1, 2]));
  const nearInfraredMaskBuffer = createInputBuffer(
    device,
    Uint32Array.from([1, 1, 1, 0, 1, 1, 1, 1])
  );
  const redMaskBuffer = createInputBuffer(device, Uint32Array.from([1, 1, 1, 1, 1, 1, 0, 1]));
  const indexBuffer = createOutputBuffer(device, 8);
  const indexMaskBuffer = createOutputBuffer(device, 8);
  const extentBuffer = createOutputBuffer(device, 2);
  const histogramBuffer = createOutputBuffer(device, 3);
  const nearInfrared = makeBufferBand(graph, 'near-infrared', nearInfraredBuffer, 'uint32', 8, {
    validity: importView(graph, 'near-infrared-mask', nearInfraredMaskBuffer, 'uint32', 8),
    noDataValue: 9,
    scale: 2
  });
  const red = makeBufferBand(graph, 'red', redBuffer, 'sint32', 8, {
    validity: importView(graph, 'red-mask', redMaskBuffer, 'uint32', 8),
    noDataValue: -2147483648,
    scale: 1
  });
  const vegetationIndex = importView(graph, 'vegetation-index-output', indexBuffer, 'float32', 8);
  const vegetationValidity = importView(
    graph,
    'vegetation-index-validity',
    indexMaskBuffer,
    'uint32',
    8
  );
  const validExtent = importView(graph, 'vegetation-valid-extent', extentBuffer, 'float32', 2);
  const histogram = importView(graph, 'vegetation-histogram', histogramBuffer, 'uint32', 3);

  new GPURasterNDVI({
    id: 'vegetation-index',
    width: 4,
    height: 2,
    nearInfrared,
    red,
    output: vegetationIndex,
    outputValidity: vegetationValidity
  }).addToGraph(graph);
  new GPURasterHistogram({
    id: 'vegetation-distribution',
    input: {
      id: 'vegetation-index',
      format: 'float32',
      storage: {kind: 'buffer', values: vegetationIndex},
      validity: vegetationValidity
    },
    output: histogram,
    domainOutput: validExtent
  }).addToGraph(graph);

  const compiled = graph.compile();
  const ndviIndex = compiled.stats.nodeOrder.indexOf('vegetation-index');
  const extentIndex = compiled.stats.nodeOrder.indexOf(
    'vegetation-distribution-valid-extent-finalize'
  );
  const histogramIndex = compiled.stats.nodeOrder.indexOf('vegetation-distribution-bins-local');
  testCase.ok(
    ndviIndex !== -1 && extentIndex > ndviIndex && histogramIndex > extentIndex,
    'declared hazards order NDVI, masked GPU extent, and explicit-domain histogram'
  );

  submitGraph(device, compiled, 'first-ndvi-histogram');
  assertApproximateValues(testCase, await readFloat32(indexBuffer, 8), [
    1 / 3,
    5 / 7,
    1,
    Number.NaN,
    Number.NaN,
    Number.NaN,
    Number.NaN,
    0.6
  ]);
  testCase.deepEqual(
    await readUint32(indexMaskBuffer, 8),
    [1, 1, 1, 0, 0, 0, 0, 1],
    'independent source masks and exact native nodata sentinels intersect before calibration'
  );
  assertApproximateValues(testCase, await readFloat32(extentBuffer, 2), [1 / 3, 1]);
  testCase.deepEqual(
    await readUint32(histogramBuffer, 3),
    [1, 2, 1],
    'only valid NDVI values contribute to the explicitly inferred GPU domain'
  );

  nearInfraredBuffer.write(Uint32Array.from([2, 2, 2, 7, 9, 1, 5, 4]));
  submitGraph(device, compiled, 'second-ndvi-histogram');
  assertApproximateValues(testCase, await readFloat32(extentBuffer, 2), [0.6, 1]);
  testCase.deepEqual(
    await readUint32(histogramBuffer, 3),
    [3, 0, 1],
    're-encoding the same graph recomputes its domain and clears stale histogram counts'
  );

  compiled.destroy();
  for (const buffer of [
    nearInfraredBuffer,
    redBuffer,
    nearInfraredMaskBuffer,
    redMaskBuffer,
    indexBuffer,
    indexMaskBuffer,
    extentBuffer,
    histogramBuffer
  ]) {
    testCase.notOk(buffer.destroyed, 'compiled graphs do not own imported raster buffers');
    buffer.destroy();
  }
  testCase.end();
});

test('GPURaster band math evaluates every calibrated operation, honors offsets, and reuses graphs', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'all-raster-band-operations'});
  const leftBuffer = createInputBuffer(
    device,
    Float32Array.from([1234, 6, -6, 2, -2, 3, Number.NaN])
  );
  const rightBuffer = createInputBuffer(device, Float32Array.from([5678, 2, 2, 0, 0, -3, 1]));
  const leftMaskBuffer = createInputBuffer(device, Uint32Array.from([99, 1, 2, 1, 1, 1, 1]));
  const rightMaskBuffer = createInputBuffer(device, Uint32Array.from([88, 1, 1, 7, 1, 1, 1]));
  const left = makeBufferBand(
    graph,
    'left',
    leftBuffer,
    'float32',
    6,
    {
      validity: importView(graph, 'left-mask', leftMaskBuffer, 'uint32', 6, 4),
      scale: 0.5,
      offset: 1
    },
    4
  );
  const right = makeBufferBand(
    graph,
    'right',
    rightBuffer,
    'float32',
    6,
    {
      validity: importView(graph, 'right-mask', rightMaskBuffer, 'uint32', 6, 4),
      scale: 2,
      offset: 0
    },
    4
  );
  const fixtures: Array<{
    operation: GPURasterBandMathOperation;
    clamp?: readonly [number, number];
    expected: number[];
    validity: number[];
  }> = [
    {
      operation: 'add',
      expected: [8, 2, 2, 0, -3.5, Number.NaN],
      validity: [1, 1, 1, 1, 1, 0]
    },
    {
      operation: 'subtract',
      expected: [0, -6, 2, 0, 8.5, Number.NaN],
      validity: [1, 1, 1, 1, 1, 0]
    },
    {
      operation: 'multiply',
      expected: [16, -8, 0, 0, -15, Number.NaN],
      validity: [1, 1, 1, 1, 1, 0]
    },
    {
      operation: 'divide',
      expected: [1, -0.5, Number.NaN, Number.NaN, -5 / 12, Number.NaN],
      validity: [1, 1, 0, 0, 1, 0]
    },
    {
      operation: 'normalized-difference',
      expected: [0, -3, 1, Number.NaN, -17 / 7, Number.NaN],
      validity: [1, 1, 1, 0, 1, 0]
    },
    {
      operation: 'add',
      clamp: [-1, 1],
      expected: [1, 1, 1, 0, -1, Number.NaN],
      validity: [1, 1, 1, 1, 1, 0]
    }
  ];
  const results = fixtures.map((fixture, fixtureIndex) => {
    const outputBuffer = createOutputBuffer(device, 7);
    const validityBuffer = createOutputBuffer(device, 7);
    const output = importView(graph, `operation-${fixtureIndex}`, outputBuffer, 'float32', 6, 4);
    const outputValidity = importView(
      graph,
      `operation-validity-${fixtureIndex}`,
      validityBuffer,
      'uint32',
      6,
      4
    );
    new GPURasterBandMath({
      id: `operation-${fixture.operation}-${fixtureIndex}`,
      width: 3,
      height: 2,
      left,
      right,
      operation: fixture.operation,
      output,
      outputValidity,
      clamp: fixture.clamp
    }).addToGraph(graph);
    return {fixture, outputBuffer, validityBuffer};
  });

  const compiled = graph.compile();
  submitGraph(device, compiled, 'first-band-math-operations');
  for (const {fixture, outputBuffer, validityBuffer} of results) {
    const values = await readFloat32(outputBuffer, 7);
    const validity = await readUint32(validityBuffer, 7);
    testCase.equal(values[0], 0, `${fixture.operation} leaves its output prefix untouched`);
    testCase.equal(validity[0], 0, `${fixture.operation} leaves its validity prefix untouched`);
    assertApproximateValues(testCase, values.slice(1), fixture.expected);
    testCase.deepEqual(
      validity.slice(1),
      fixture.validity,
      `${fixture.operation} canonicalizes source selection and denominator validity`
    );
  }

  leftBuffer.write(Float32Array.from([1234, 2, 4, 6, 8, 10, 12]));
  rightBuffer.write(Float32Array.from([5678, 1, 2, 3, 4, 5, 6]));
  submitGraph(device, compiled, 'second-band-math-operations');
  assertApproximateValues(
    testCase,
    (await readFloat32(results[0].outputBuffer, 7)).slice(1),
    [4, 7, 10, 13, 16, 19]
  );
  assertApproximateValues(testCase, (await readFloat32(results[3].outputBuffer, 7)).slice(1), [
    1,
    3 / 4,
    2 / 3,
    5 / 8,
    3 / 5,
    7 / 12
  ]);
  testCase.deepEqual(
    (await readUint32(results[3].validityBuffer, 7)).slice(1),
    [1, 1, 1, 1, 1, 1],
    're-encoding replaces previously invalid division output without recompilation'
  );

  compiled.destroy();
  for (const buffer of [leftBuffer, rightBuffer, leftMaskBuffer, rightMaskBuffer]) {
    buffer.destroy();
  }
  for (const {outputBuffer, validityBuffer} of results) {
    outputBuffer.destroy();
    validityBuffer.destroy();
  }
  testCase.end();
});

test('GPURaster NDVI rejects nonfinite and epsilon-sized denominators without implicit clamping', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const largestFloat = 3.4028234663852886e38;
  const graph = new GPUCommandGraph(device, {id: 'raster-ndvi-boundary-values'});
  const nearInfraredBuffer = createInputBuffer(
    device,
    Float32Array.from([
      1,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      0.1,
      1,
      1,
      1,
      largestFloat,
      largestFloat,
      0.1875,
      0.25
    ])
  );
  const redBuffer = createInputBuffer(
    device,
    Float32Array.from([0, 1, 1, 1, -0.08, -1, -0.9, -0.8, largestFloat, 1, -0.0625, -0.0625])
  );
  const outputBuffer = createOutputBuffer(device, 12);
  const outputValidityBuffer = createOutputBuffer(device, 12);
  const clampedBuffer = createOutputBuffer(device, 12);
  const clampedValidityBuffer = createOutputBuffer(device, 12);
  const overflowBuffer = createOutputBuffer(device, 12);
  const overflowValidityBuffer = createOutputBuffer(device, 12);
  const nearInfrared = makeBufferBand(
    graph,
    'near-infrared-boundary',
    nearInfraredBuffer,
    'float32',
    12
  );
  const red = makeBufferBand(graph, 'red-boundary', redBuffer, 'float32', 12);

  new GPURasterNDVI({
    id: 'unclamped-index',
    width: 4,
    height: 3,
    nearInfrared,
    red,
    output: importView(graph, 'unclamped-values', outputBuffer, 'float32', 12),
    outputValidity: importView(graph, 'unclamped-validity', outputValidityBuffer, 'uint32', 12),
    epsilon: 0.125
  }).addToGraph(graph);
  new GPURasterNDVI({
    id: 'explicitly-clamped-index',
    width: 4,
    height: 3,
    nearInfrared,
    red,
    output: importView(graph, 'clamped-values', clampedBuffer, 'float32', 12),
    outputValidity: importView(graph, 'clamped-validity', clampedValidityBuffer, 'uint32', 12),
    epsilon: 0.125,
    clamp: [-1, 1]
  }).addToGraph(graph);
  new GPURasterBandMath({
    id: 'calibration-overflow',
    width: 4,
    height: 3,
    left: {...nearInfrared, scale: 2},
    right: red,
    operation: 'add',
    output: importView(graph, 'overflow-values', overflowBuffer, 'float32', 12),
    outputValidity: importView(graph, 'overflow-validity', overflowValidityBuffer, 'uint32', 12)
  }).addToGraph(graph);

  const compiled = graph.compile();
  submitGraph(device, compiled, 'raster-ndvi-boundary-values');
  const expectedValidity = [1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1];
  const outputValues = await readFloat32(outputBuffer, 12);
  testCase.deepEqual(
    await readUint32(outputValidityBuffer, 12),
    expectedValidity,
    'NaN, infinities, zero denominators, epsilon equality, and overflowing denominators are invalid'
  );
  assertApproximateValues(testCase, outputValues, [
    1,
    Number.NaN,
    Number.NaN,
    Number.NaN,
    Number.NaN,
    Number.NaN,
    Number.NaN,
    9,
    Number.NaN,
    1,
    Number.NaN,
    5 / 3
  ]);
  testCase.ok(outputValues[7] > 1, 'negative reflectance can yield valid NDVI above one');
  testCase.ok(outputValues[11] > 1, 'valid values are not clamped by default');

  const clampedValues = await readFloat32(clampedBuffer, 12);
  testCase.equal(clampedValues[7], 1, 'an explicitly requested display clamp limits large NDVI');
  testCase.equal(clampedValues[11], 1, 'the same clamp applies to every valid output pixel');
  testCase.deepEqual(
    await readUint32(clampedValidityBuffer, 12),
    expectedValidity,
    'explicit clamping does not resurrect invalid pixels'
  );

  const overflowValues = await readFloat32(overflowBuffer, 12);
  const overflowValidity = await readUint32(overflowValidityBuffer, 12);
  testCase.deepEqual(
    overflowValidity.slice(8, 10),
    [0, 0],
    'finite raw values that overflow during independent calibration become invalid'
  );
  testCase.ok(Number.isNaN(overflowValues[8]), 'overflowing calibrated source writes NaN');
  testCase.ok(Number.isNaN(overflowValues[9]), 'overflowing source cannot produce a finite sum');

  compiled.destroy();
  for (const buffer of [
    nearInfraredBuffer,
    redBuffer,
    outputBuffer,
    outputValidityBuffer,
    clampedBuffer,
    clampedValidityBuffer,
    overflowBuffer,
    overflowValidityBuffer
  ]) {
    buffer.destroy();
  }
  testCase.end();
});

test('GPURaster pointwise contributors reject incompatible grids, ownership, output aliases, and options', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'raster-band-validation'});
  const foreignGraph = new GPUCommandGraph(device, {id: 'foreign-raster-band-validation'});
  const leftBuffer = createInputBuffer(device, Float32Array.from([1, 2, 3, 4]));
  const rightBuffer = createInputBuffer(device, Float32Array.from([4, 3, 2, 1]));
  const sourceMaskBuffer = createInputBuffer(device, Uint32Array.from([1, 1, 1, 1]));
  const outputBuffer = createOutputBuffer(device, 4);
  const outputValidityBuffer = createOutputBuffer(device, 4);
  const foreignOutputBuffer = createOutputBuffer(device, 4);
  const sourceMask = importView(graph, 'source-mask', sourceMaskBuffer, 'uint32', 4);
  const left = makeBufferBand(graph, 'left-validation', leftBuffer, 'float32', 4, {
    validity: sourceMask
  });
  const right = makeBufferBand(graph, 'right-validation', rightBuffer, 'float32', 4);
  const output = importView(graph, 'validated-output', outputBuffer, 'float32', 4);
  const outputValidity = importView(
    graph,
    'validated-output-mask',
    outputValidityBuffer,
    'uint32',
    4
  );
  const properties = {
    width: 2,
    height: 2,
    nearInfrared: left,
    red: right,
    output,
    outputValidity
  };

  testCase.throws(
    () => new GPURasterNDVI({...properties, width: 3}),
    /one sample per pixel/,
    'both source grids must exactly match the declared output extent'
  );
  testCase.throws(
    () => new GPURasterNDVI({...properties, height: 0}),
    /positive integers/,
    'empty raster grids are rejected before graph encoding'
  );
  testCase.throws(
    () => new GPURasterNDVI({...properties, epsilon: Number.NaN}),
    /finite and non-negative/,
    'epsilon cannot introduce non-finite comparisons'
  );
  testCase.throws(
    () => new GPURasterNDVI({...properties, epsilon: -1}),
    /finite and non-negative/,
    'negative denominator tolerances are rejected'
  );
  testCase.throws(
    () => new GPURasterNDVI({...properties, clamp: [2, 1]}),
    /ordered finite range/,
    'clamp ranges must be ordered'
  );
  testCase.throws(
    () =>
      new GPURasterNDVI({
        ...properties,
        output: graph.createDataView(left.storage.values.buffer, {format: 'float32', length: 4})
      }),
    /separate buffers/,
    'output values cannot overwrite either borrowed input band'
  );
  testCase.throws(
    () => new GPURasterNDVI({...properties, outputValidity: sourceMask}),
    /separate buffers/,
    'output validity cannot overwrite either source selection mask'
  );
  testCase.throws(
    () =>
      new GPURasterNDVI({
        ...properties,
        outputValidity: graph.createDataView(output.buffer, {format: 'uint32', length: 4})
      }),
    /separate buffers/,
    'output values and output validity require separate storage'
  );
  testCase.throws(
    () =>
      new GPURasterNDVI({
        ...properties,
        output: importView(foreignGraph, 'foreign-output', foreignOutputBuffer, 'float32', 4)
      }),
    /same graph/,
    'every source and destination must belong to the same graph'
  );
  testCase.throws(
    () => new GPURasterNDVI(properties).addToGraph(foreignGraph),
    /target graph/,
    'contributors cannot be added to a foreign command graph'
  );

  for (const buffer of [
    leftBuffer,
    rightBuffer,
    sourceMaskBuffer,
    outputBuffer,
    outputValidityBuffer,
    foreignOutputBuffer
  ]) {
    buffer.destroy();
  }
  testCase.end();
});

function createInputBuffer(device: Device, data: ScalarArray): Buffer {
  return device.createBuffer({data, usage: Buffer.STORAGE | Buffer.COPY_DST});
}

function createOutputBuffer(device: Device, length: number): Buffer {
  return device.createBuffer({
    byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
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

function makeBufferBand<Format extends GPURasterScalarFormat>(
  graph: GPUCommandGraph,
  id: string,
  buffer: Buffer,
  format: Format,
  length: number,
  options: {
    validity?: GraphDataView<'uint32'>;
    noDataValue?: number;
    scale?: number;
    offset?: number;
  } = {},
  byteOffset: number = 0
): GPURasterBufferBand<Format> {
  return {
    id,
    format,
    storage: {
      kind: 'buffer',
      values: importView(graph, `${id}-values`, buffer, format, length, byteOffset)
    },
    ...options
  } as GPURasterBufferBand<Format>;
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

function assertApproximateValues(testCase: Test, actual: number[], expected: number[]): void {
  testCase.equal(actual.length, expected.length, 'the output retains every raster row');
  for (let index = 0; index < expected.length; index++) {
    const expectedValue = expected[index];
    const actualValue = actual[index];
    if (Number.isNaN(expectedValue)) {
      testCase.ok(Number.isNaN(actualValue), `pixel ${index} is canonically invalid`);
    } else {
      testCase.ok(
        Math.abs(actualValue - expectedValue) <= 0.000002 * Math.max(1, Math.abs(expectedValue)),
        `pixel ${index} matches ${expectedValue} within float32 tolerance; received ${actualValue}`
      );
    }
  }
}
