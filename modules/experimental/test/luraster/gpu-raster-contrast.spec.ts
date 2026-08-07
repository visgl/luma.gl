// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test, {type Test} from '../../../../test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/experimental';
import {
  GPURasterContrast,
  GPURasterHistogram,
  type GPURasterBufferBand,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/luraster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('LuRasterContrast preserves calibrated domains, validity, and offset-aligned GPU ranges', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'raster-gpu-domain-contrast'});
  const sourceBuffer = makeInputBuffer(
    device,
    Float32Array.from([77, -1, -0.5, 0, 0.5, 1, -999, Number.NaN, 0.25])
  );
  const sourceValidityBuffer = makeInputBuffer(
    device,
    Uint32Array.from([88, 1, 1, 1, 1, 1, 1, 1, 0])
  );
  const domainBuffer = makeInputBuffer(device, Float32Array.from([55, -1, 1]));
  const stretchedBuffer = makeOutputBuffer(device, 9);
  const stretchedValidityBuffer = makeOutputBuffer(device, 9);
  const gammaBuffer = makeOutputBuffer(device, 9);
  const gammaValidityBuffer = makeOutputBuffer(device, 9);
  const source: GPURasterBufferBand<'float32'> = {
    id: 'vegetation-index',
    format: 'float32',
    storage: {kind: 'buffer', values: importView(graph, 'source', sourceBuffer, 'float32', 8, 4)},
    validity: importView(graph, 'source-validity', sourceValidityBuffer, 'uint32', 8, 4),
    noDataValue: -999
  };
  const domain = importView(graph, 'domain', domainBuffer, 'float32', 2, 4);
  const stretchedValues = importView(graph, 'stretched', stretchedBuffer, 'float32', 8, 4);
  const stretchedValidity = importView(
    graph,
    'stretched-validity',
    stretchedValidityBuffer,
    'uint32',
    8,
    4
  );
  const gammaValues = importView(graph, 'gamma', gammaBuffer, 'float32', 8, 4);
  const gammaValidity = importView(graph, 'gamma-validity', gammaValidityBuffer, 'uint32', 8, 4);

  new GPURasterContrast({
    id: 'midpoint-stretch',
    width: 4,
    height: 2,
    input: source,
    output: stretchedValues,
    outputValidity: stretchedValidity,
    domain,
    contrast: 2
  }).addToGraph(graph);
  new GPURasterContrast({
    id: 'gamma-stretch',
    width: 4,
    height: 2,
    input: source,
    output: gammaValues,
    outputValidity: gammaValidity,
    domain: [-1, 1],
    gamma: 2,
    mode: 'gamma'
  }).addToGraph(graph);

  const compiled = graph.compile();
  submitGraph(device, compiled, 'first-contrast-transform');

  const stretched = await readFloat32(stretchedBuffer, 9);
  const stretchedFlags = await readUint32(stretchedValidityBuffer, 9);
  testCase.equal(stretched[0], 0, 'nonzero output byte offsets preserve the untouched prefix');
  testCase.equal(
    stretchedFlags[0],
    0,
    'nonzero validity byte offsets preserve the untouched prefix'
  );
  assertApproximateValues(testCase, stretched.slice(1), [
    -1,
    -1,
    0,
    1,
    1,
    Number.NaN,
    Number.NaN,
    Number.NaN
  ]);
  testCase.deepEqual(
    stretchedFlags.slice(1),
    [1, 1, 1, 1, 1, 0, 0, 0],
    'raw finite nodata, nonfinite samples, and source validity stay separate from values'
  );
  assertApproximateValues(testCase, (await readFloat32(gammaBuffer, 9)).slice(1), [
    -1,
    0,
    Math.SQRT2 - 1,
    Math.sqrt(3) - 1,
    1,
    Number.NaN,
    Number.NaN,
    Number.NaN
  ]);
  testCase.deepEqual(
    (await readUint32(gammaValidityBuffer, 9)).slice(1),
    [1, 1, 1, 1, 1, 0, 0, 0],
    'gamma correction preserves caller-visible validity flags'
  );

  domainBuffer.write(Float32Array.from([55, -2, 2]));
  submitGraph(device, compiled, 'second-contrast-transform');
  assertApproximateValues(testCase, (await readFloat32(stretchedBuffer, 9)).slice(1), [
    -2,
    -1,
    0,
    1,
    2,
    Number.NaN,
    Number.NaN,
    Number.NaN
  ]);

  domainBuffer.write(Float32Array.from([55, 1, -1]));
  submitGraph(device, compiled, 'invalid-gpu-contrast-domain');
  testCase.deepEqual(
    (await readUint32(stretchedValidityBuffer, 9)).slice(1),
    [0, 0, 0, 0, 0, 0, 0, 0],
    'runtime-inverted GPU domains reject every sample without CPU validation or readback'
  );

  compiled.destroy();
  for (const buffer of [
    sourceBuffer,
    sourceValidityBuffer,
    domainBuffer,
    stretchedBuffer,
    stretchedValidityBuffer,
    gammaBuffer,
    gammaValidityBuffer
  ]) {
    testCase.notOk(buffer.destroyed, 'compiled graphs never own imported transform buffers');
    buffer.destroy();
  }
  testCase.end();
});

test('LuRasterContrast applies gamma only when gamma mode is explicitly selected', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'raster-explicit-gamma-mode'});
  const sourceBuffer = makeInputBuffer(
    device,
    Float32Array.from([-1, -0.5, 0, 0.5, 1, Number.NaN])
  );
  const linearOutput = makeOutputBuffer(device, 6);
  const linearValidity = makeOutputBuffer(device, 6);
  const gammaOutput = makeOutputBuffer(device, 6);
  const gammaValidity = makeOutputBuffer(device, 6);
  const input: GPURasterBufferBand<'float32'> = {
    id: 'source',
    format: 'float32',
    storage: {kind: 'buffer', values: importView(graph, 'source', sourceBuffer, 'float32', 6)}
  };

  new GPURasterContrast({
    id: 'linear-ignores-gamma',
    width: 3,
    height: 2,
    input,
    output: importView(graph, 'linear-output', linearOutput, 'float32', 6),
    outputValidity: importView(graph, 'linear-validity', linearValidity, 'uint32', 6),
    domain: [-1, 1],
    contrast: 1.5,
    gamma: 2,
    mode: 'linear'
  }).addToGraph(graph);
  new GPURasterContrast({
    id: 'gamma-applies-correction',
    width: 3,
    height: 2,
    input,
    output: importView(graph, 'gamma-output', gammaOutput, 'float32', 6),
    outputValidity: importView(graph, 'gamma-validity', gammaValidity, 'uint32', 6),
    domain: [-1, 1],
    contrast: 1.5,
    gamma: 2,
    mode: 'gamma'
  }).addToGraph(graph);

  const compiled = graph.compile();
  submitGraph(device, compiled, 'explicit-gamma-mode');
  assertApproximateValues(testCase, await readFloat32(linearOutput, 6), [
    -1,
    -0.75,
    0,
    0.75,
    1,
    Number.NaN
  ]);
  assertApproximateValues(testCase, await readFloat32(gammaOutput, 6), [
    -1,
    2 * Math.sqrt(0.125) - 1,
    Math.SQRT2 - 1,
    2 * Math.sqrt(0.875) - 1,
    1,
    Number.NaN
  ]);
  testCase.deepEqual(await readUint32(linearValidity, 6), [1, 1, 1, 1, 1, 0]);
  testCase.deepEqual(await readUint32(gammaValidity, 6), [1, 1, 1, 1, 1, 0]);

  compiled.destroy();
  for (const buffer of [sourceBuffer, linearOutput, linearValidity, gammaOutput, gammaValidity]) {
    buffer.destroy();
  }
  testCase.end();
});

test('LuRasterContrast compares native signed and unsigned nodata before float32 calibration', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'raster-native-contrast-nodata'});
  const unsignedSource = device.createBuffer({
    data: Uint32Array.from([0, 10, 20, 4294967295]),
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const signedSource = device.createBuffer({
    data: Int32Array.from([-2147483648, -2, 0, 2]),
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const unsignedOutput = makeOutputBuffer(device, 4);
  const unsignedValidity = makeOutputBuffer(device, 4);
  const signedOutput = makeOutputBuffer(device, 4);
  const signedValidity = makeOutputBuffer(device, 4);

  new GPURasterContrast({
    id: 'unsigned-contrast',
    width: 2,
    height: 2,
    input: {
      id: 'unsigned-source',
      format: 'uint32',
      storage: {
        kind: 'buffer',
        values: importView(graph, 'unsigned-source', unsignedSource, 'uint32', 4)
      },
      noDataValue: 4294967295,
      scale: 0.05
    },
    output: importView(graph, 'unsigned-output', unsignedOutput, 'float32', 4),
    outputValidity: importView(graph, 'unsigned-validity', unsignedValidity, 'uint32', 4)
  }).addToGraph(graph);
  new GPURasterContrast({
    id: 'signed-contrast',
    width: 2,
    height: 2,
    input: {
      id: 'signed-source',
      format: 'sint32',
      storage: {
        kind: 'buffer',
        values: importView(graph, 'signed-source', signedSource, 'sint32', 4)
      },
      noDataValue: -2147483648,
      scale: 0.25,
      offset: 0.5
    },
    output: importView(graph, 'signed-output', signedOutput, 'float32', 4),
    outputValidity: importView(graph, 'signed-validity', signedValidity, 'uint32', 4)
  }).addToGraph(graph);

  const compiled = graph.compile();
  submitGraph(device, compiled, 'native-raster-contrast');
  assertApproximateValues(testCase, await readFloat32(unsignedOutput, 4), [0, 0.5, 1, Number.NaN]);
  testCase.deepEqual(
    await readUint32(unsignedValidity, 4),
    [1, 1, 1, 0],
    'maximum uint32 nodata is rejected before precision-losing float32 conversion'
  );
  assertApproximateValues(testCase, await readFloat32(signedOutput, 4), [Number.NaN, 0, 0.5, 1]);
  testCase.deepEqual(
    await readUint32(signedValidity, 4),
    [0, 1, 1, 1],
    'minimum sint32 nodata is rejected before independent scale and offset calibration'
  );

  compiled.destroy();
  for (const buffer of [
    unsignedSource,
    signedSource,
    unsignedOutput,
    unsignedValidity,
    signedOutput,
    signedValidity
  ]) {
    buffer.destroy();
  }
  testCase.end();
});

test('LuRasterContrast composes histogram equalization, inclusive CDF, and downstream counts', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'raster-histogram-equalization'});
  const sourceBuffer = makeInputBuffer(
    device,
    Float32Array.from([0.2, 0.2, 0.2, 0.5, 0.8, Number.NaN])
  );
  const sourceValidityBuffer = makeInputBuffer(device, Uint32Array.from([1, 1, 1, 1, 1, 1]));
  const inputHistogramBuffer = makeOutputBuffer(device, 5);
  const equalizedBuffer = makeOutputBuffer(device, 6);
  const equalizedValidityBuffer = makeOutputBuffer(device, 6);
  const outputHistogramBuffer = makeOutputBuffer(device, 5);
  const source: GPURasterBufferBand<'float32'> = {
    id: 'source',
    format: 'float32',
    storage: {kind: 'buffer', values: importView(graph, 'source', sourceBuffer, 'float32', 6)},
    validity: importView(graph, 'source-validity', sourceValidityBuffer, 'uint32', 6)
  };
  const sourceHistogram = importView(graph, 'source-histogram', inputHistogramBuffer, 'uint32', 5);
  const equalizedValues = importView(graph, 'equalized', equalizedBuffer, 'float32', 6);
  const equalizedValidity = importView(
    graph,
    'equalized-validity',
    equalizedValidityBuffer,
    'uint32',
    6
  );
  const equalizedHistogram = importView(
    graph,
    'equalized-histogram',
    outputHistogramBuffer,
    'uint32',
    5
  );

  new GPURasterHistogram({
    id: 'input-distribution',
    input: source,
    domain: [0, 1],
    output: sourceHistogram
  }).addToGraph(graph);
  new GPURasterContrast({
    id: 'equalized-contrast',
    width: 3,
    height: 2,
    input: source,
    domain: [0, 1],
    mode: 'equalize',
    histogram: sourceHistogram,
    output: equalizedValues,
    outputValidity: equalizedValidity
  }).addToGraph(graph);
  new GPURasterHistogram({
    id: 'output-distribution',
    input: {
      id: 'equalized',
      format: 'float32',
      storage: {kind: 'buffer', values: equalizedValues},
      validity: equalizedValidity
    },
    domain: [0, 1],
    output: equalizedHistogram
  }).addToGraph(graph);

  const compiled = graph.compile();
  const inputIndex = compiled.stats.nodeOrder.indexOf('input-distribution-bins-local');
  const cumulativeIndex = compiled.stats.nodeOrder.findIndex(node =>
    node.startsWith('equalized-contrast-histogram-cdf')
  );
  const summaryIndex = compiled.stats.nodeOrder.indexOf('equalized-contrast-histogram-summary');
  const contrastIndex = compiled.stats.nodeOrder.indexOf('equalized-contrast');
  const outputIndex = compiled.stats.nodeOrder.indexOf('output-distribution-bins-local');
  testCase.ok(
    inputIndex !== -1 &&
      cumulativeIndex > inputIndex &&
      summaryIndex > cumulativeIndex &&
      contrastIndex > summaryIndex &&
      outputIndex > contrastIndex,
    'graph hazards order histogram, inclusive CDF, first nonzero CDF, transform, and output bins'
  );

  submitGraph(device, compiled, 'first-histogram-equalization');
  testCase.deepEqual(
    await readUint32(inputHistogramBuffer, 5),
    [0, 3, 1, 0, 1],
    'source histogram retains leading empty bins'
  );
  assertApproximateValues(testCase, await readFloat32(equalizedBuffer, 6), [
    0,
    0,
    0,
    0.5,
    1,
    Number.NaN
  ]);
  testCase.deepEqual(await readUint32(equalizedValidityBuffer, 6), [1, 1, 1, 1, 1, 0]);
  testCase.deepEqual(
    await readUint32(outputHistogramBuffer, 5),
    [3, 0, 1, 0, 1],
    'equalized values actually reshape downstream GPU histogram counts'
  );

  sourceBuffer.write(
    Float32Array.from([Number.NaN, Number.NaN, Number.NaN, Number.NaN, Number.NaN, Number.NaN])
  );
  submitGraph(device, compiled, 'all-invalid-histogram-equalization');
  testCase.deepEqual(await readUint32(inputHistogramBuffer, 5), [0, 0, 0, 0, 0]);
  testCase.deepEqual(await readUint32(equalizedValidityBuffer, 6), [0, 0, 0, 0, 0, 0]);
  testCase.deepEqual(
    await readUint32(outputHistogramBuffer, 5),
    [0, 0, 0, 0, 0],
    'all-invalid inputs clear both histograms without CPU fallback'
  );

  sourceBuffer.write(Float32Array.from([0.2, 0.2, 0.2, 0.2, 0.2, 0.2]));
  submitGraph(device, compiled, 'constant-histogram-equalization');
  assertApproximateValues(
    testCase,
    await readFloat32(equalizedBuffer, 6),
    [0.2, 0.2, 0.2, 0.2, 0.2, 0.2]
  );
  testCase.deepEqual(
    await readUint32(outputHistogramBuffer, 5),
    [0, 6, 0, 0, 0],
    'constant distributions remain unchanged instead of dividing by a zero CDF range'
  );

  compiled.destroy();
  for (const buffer of [
    sourceBuffer,
    sourceValidityBuffer,
    inputHistogramBuffer,
    equalizedBuffer,
    equalizedValidityBuffer,
    outputHistogramBuffer
  ]) {
    buffer.destroy();
  }
  testCase.end();
});

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
  const commandEncoder = device.createCommandEncoder({id});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
}

function assertApproximateValues(testCase: Test, actual: number[], expected: number[]): void {
  testCase.equal(actual.length, expected.length);
  for (let index = 0; index < expected.length; index++) {
    if (Number.isNaN(expected[index])) {
      testCase.ok(Number.isNaN(actual[index]), `sample ${index} is invalid`);
    } else {
      testCase.ok(
        Math.abs(actual[index] - expected[index]) < 0.0001,
        `sample ${index} is ${expected[index]}`
      );
    }
  }
}

async function readFloat32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
}

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}
