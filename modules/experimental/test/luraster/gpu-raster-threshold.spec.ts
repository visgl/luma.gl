// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from '../../../../test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/experimental';
import {
  GPURasterOtsuThreshold,
  GPURasterThreshold,
  type GPURasterBufferBand,
  type GPURasterScalarFormat,
  type GPURasterThresholdOperation
} from '@luma.gl/experimental/luraster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('LuRasterThreshold evaluates inclusive and exclusive above, below, and range policies', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const cases: Array<{
    operation: GPURasterThresholdOperation;
    threshold: number | readonly [number, number];
    inclusive: boolean;
    expected: number[];
  }> = [
    {operation: 'above', threshold: 0.5, inclusive: true, expected: [0, 0, 1, 1, 1]},
    {operation: 'above', threshold: 0.5, inclusive: false, expected: [0, 0, 0, 1, 1]},
    {operation: 'below', threshold: 0.5, inclusive: true, expected: [1, 1, 1, 0, 0]},
    {operation: 'below', threshold: 0.5, inclusive: false, expected: [1, 1, 0, 0, 0]},
    {operation: 'range', threshold: [0.25, 0.75], inclusive: true, expected: [0, 1, 1, 1, 0]},
    {operation: 'range', threshold: [0.25, 0.75], inclusive: false, expected: [0, 0, 1, 0, 0]}
  ];

  for (const [index, options] of cases.entries()) {
    const values = await runThreshold({
      device,
      id: `threshold-operation-${index}`,
      format: 'float32',
      values: Float32Array.from([0, 0.25, 0.5, 0.75, 1]),
      threshold: options.threshold,
      operation: options.operation,
      inclusive: options.inclusive
    });
    testCase.deepEqual(
      values,
      options.expected,
      `${options.inclusive ? 'inclusive' : 'exclusive'} ${options.operation} classification`
    );
  }
  testCase.end();
});

test('LuRasterThreshold intersects offset-aligned validity, nodata, finite samples, and calibration', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'threshold-offset-validity'});
  const sourceBuffer = makeInputBuffer(
    device,
    Float32Array.from([77, -999, Number.NaN, -1, 0.25, 0.5, 0.75, Number.POSITIVE_INFINITY, 1])
  );
  const validityBuffer = makeInputBuffer(device, Uint32Array.from([88, 1, 1, 1, 1, 1, 0, 1, 1]));
  const outputBuffer = makeOutputBuffer(device, 9);
  const input: GPURasterBufferBand<'float32'> = {
    id: 'calibrated-reflectance',
    format: 'float32',
    storage: {kind: 'buffer', values: importView(graph, 'source', sourceBuffer, 'float32', 8, 4)},
    validity: importView(graph, 'source-validity', validityBuffer, 'uint32', 8, 4),
    noDataValue: -999,
    scale: 2
  };
  new GPURasterThreshold({
    width: 4,
    height: 2,
    input,
    output: importView(graph, 'selection', outputBuffer, 'uint32', 8, 4),
    threshold: 1
  }).addToGraph(graph);

  const compiled = graph.compile();
  submitGraph(device, compiled, 'threshold-offset-validity');
  testCase.deepEqual(
    (await readUint32(outputBuffer, 9)).slice(1),
    [0, 0, 0, 0, 1, 0, 0, 1],
    'offset masks, finite nodata, NaN/infinity, and calibrated comparisons intersect'
  );
  compiled.destroy();
  sourceBuffer.destroy();
  validityBuffer.destroy();
  outputBuffer.destroy();
  testCase.end();
});

test('LuRasterThreshold retains native signed and unsigned nodata sentinels', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const signed = await runThreshold({
    device,
    id: 'threshold-signed-nodata',
    format: 'sint32',
    values: Int32Array.from([-2147483648, -1, 0, 2]),
    noDataValue: -2147483648,
    threshold: 0
  });
  const unsigned = await runThreshold({
    device,
    id: 'threshold-unsigned-nodata',
    format: 'uint32',
    values: Uint32Array.from([4294967295, 0, 1, 2]),
    noDataValue: 4294967295,
    threshold: 1
  });

  testCase.deepEqual(signed, [0, 0, 1, 1], 'signed minimum nodata is rejected in raw i32');
  testCase.deepEqual(unsigned, [0, 0, 1, 1], 'unsigned maximum nodata is rejected in raw u32');
  testCase.end();
});

test('LuRasterThreshold reuses an offset GPU range and rejects invalid dynamic boundaries', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'threshold-dynamic-range'});
  const sourceBuffer = makeInputBuffer(device, Float32Array.from([0, 0.25, 0.5, 0.75]));
  const thresholdBuffer = makeInputBuffer(device, Float32Array.from([99, 0, 0.5]));
  const outputBuffer = makeOutputBuffer(device, 4);
  const input: GPURasterBufferBand<'float32'> = {
    id: 'dynamic-input',
    format: 'float32',
    storage: {kind: 'buffer', values: importView(graph, 'source', sourceBuffer, 'float32', 4)}
  };
  new GPURasterThreshold({
    width: 4,
    height: 1,
    input,
    output: importView(graph, 'output', outputBuffer, 'uint32', 4),
    threshold: importView(graph, 'threshold', thresholdBuffer, 'float32', 2, 4),
    operation: 'range',
    inclusive: false
  }).addToGraph(graph);
  const compiled = graph.compile();

  submitGraph(device, compiled, 'threshold-first-range');
  testCase.deepEqual(await readUint32(outputBuffer, 4), [0, 1, 0, 0], 'initial GPU range applies');

  thresholdBuffer.write(Float32Array.from([99, 0.25, 0.75]));
  submitGraph(device, compiled, 'threshold-updated-range');
  testCase.deepEqual(
    await readUint32(outputBuffer, 4),
    [0, 0, 1, 0],
    'GPU range updates without recompiling the graph'
  );

  thresholdBuffer.write(Float32Array.from([99, Number.NaN, 0.75]));
  submitGraph(device, compiled, 'threshold-nonfinite-range');
  testCase.deepEqual(
    await readUint32(outputBuffer, 4),
    [0, 0, 0, 0],
    'nonfinite GPU threshold rejects every sample'
  );

  thresholdBuffer.write(Float32Array.from([99, 1, 0]));
  submitGraph(device, compiled, 'threshold-reversed-range');
  testCase.deepEqual(
    await readUint32(outputBuffer, 4),
    [0, 0, 0, 0],
    'reversed GPU boundaries reject every sample'
  );

  compiled.destroy();
  testCase.notOk(sourceBuffer.destroyed, 'borrowed source survives compiled graph destruction');
  sourceBuffer.destroy();
  thresholdBuffer.destroy();
  outputBuffer.destroy();
  testCase.end();
});

test('LuRasterOtsuThreshold preserves uint32 minority counts and feeds a GPU threshold mask', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'threshold-otsu-gpu-chain'});
  const histogramBuffer = makeInputBuffer(device, Uint32Array.from([77, 16777216, 1]));
  const domainBuffer = makeInputBuffer(device, Float32Array.from([88, 0, 1]));
  const thresholdBuffer = makeOutputBuffer(device, 2);
  const sourceBuffer = makeInputBuffer(device, Float32Array.from([0, 0.25, 0.5, 0.75]));
  const outputBuffer = makeOutputBuffer(device, 4);
  const threshold = importView(graph, 'otsu-threshold', thresholdBuffer, 'float32', 1, 4);

  new GPURasterOtsuThreshold({
    id: 'otsu-analysis',
    histogram: importView(graph, 'histogram', histogramBuffer, 'uint32', 2, 4),
    domain: importView(graph, 'domain', domainBuffer, 'float32', 2, 4),
    output: threshold
  }).addToGraph(graph);
  new GPURasterThreshold({
    id: 'otsu-selection',
    width: 4,
    height: 1,
    input: {
      id: 'source',
      format: 'float32',
      storage: {kind: 'buffer', values: importView(graph, 'source', sourceBuffer, 'float32', 4)}
    },
    output: importView(graph, 'output', outputBuffer, 'uint32', 4),
    threshold
  }).addToGraph(graph);

  const compiled = graph.compile();
  testCase.ok(
    compiled.stats.nodeOrder.indexOf('otsu-analysis') <
      compiled.stats.nodeOrder.indexOf('otsu-selection'),
    'GPU threshold dependency orders Otsu analysis before classification'
  );
  submitGraph(device, compiled, 'threshold-otsu-minority');
  testCase.equal(
    (await readFloat32(thresholdBuffer, 2))[1],
    0.5,
    'exact uint32 class counts retain a one-pixel minority above float32 precision'
  );
  testCase.deepEqual(
    await readUint32(outputBuffer, 4),
    [0, 0, 1, 1],
    'Otsu GPU scalar feeds the downstream threshold without CPU synchronization'
  );

  histogramBuffer.write(Uint32Array.from([77, 0, 0]));
  submitGraph(device, compiled, 'threshold-otsu-empty');
  testCase.equal((await readFloat32(thresholdBuffer, 2))[1], 0, 'empty histogram publishes zero');
  testCase.deepEqual(
    await readUint32(outputBuffer, 4),
    [1, 1, 1, 1],
    'reused compiled graph consumes the newly published zero threshold'
  );

  compiled.destroy();
  histogramBuffer.destroy();
  domainBuffer.destroy();
  thresholdBuffer.destroy();
  sourceBuffer.destroy();
  outputBuffer.destroy();
  testCase.end();
});

test('LuRasterOtsuThreshold chooses the lowest tied sample boundary deterministically', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'threshold-otsu-tie'});
  const histogramBuffer = makeInputBuffer(device, Uint32Array.from([10, 0, 0, 10]));
  const outputBuffer = makeOutputBuffer(device, 1);
  new GPURasterOtsuThreshold({
    histogram: importView(graph, 'histogram', histogramBuffer, 'uint32', 4),
    domain: [0, 1],
    output: importView(graph, 'output', outputBuffer, 'float32', 1)
  }).addToGraph(graph);
  const compiled = graph.compile();
  submitGraph(device, compiled, 'threshold-otsu-tie');

  testCase.equal((await readFloat32(outputBuffer, 1))[0], 0.25, 'lowest tied boundary wins');
  compiled.destroy();
  histogramBuffer.destroy();
  outputBuffer.destroy();
  testCase.end();
});

async function runThreshold<Format extends GPURasterScalarFormat>(options: {
  device: Device;
  id: string;
  format: Format;
  values: Float32Array | Uint32Array | Int32Array;
  threshold: number | readonly [number, number];
  operation?: GPURasterThresholdOperation;
  inclusive?: boolean;
  noDataValue?: number;
}): Promise<number[]> {
  const {device, id, format, values, threshold, operation, inclusive, noDataValue} = options;
  const graph = new GPUCommandGraph(device, {id});
  const sourceBuffer = makeInputBuffer(device, values);
  const outputBuffer = makeOutputBuffer(device, values.length);
  const input = {
    id: `${id}-source`,
    format,
    storage: {
      kind: 'buffer',
      values: importView(graph, `${id}-values`, sourceBuffer, format, values.length)
    },
    noDataValue
  } as GPURasterBufferBand<Format>;
  new GPURasterThreshold({
    width: values.length,
    height: 1,
    input,
    output: importView(graph, `${id}-output`, outputBuffer, 'uint32', values.length),
    threshold,
    operation,
    inclusive
  }).addToGraph(graph);
  const compiled = graph.compile();
  submitGraph(device, compiled, id);
  const result = await readUint32(outputBuffer, values.length);
  compiled.destroy();
  sourceBuffer.destroy();
  outputBuffer.destroy();
  return result;
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

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}

async function readFloat32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
}
