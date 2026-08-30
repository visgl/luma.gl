// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from '../../../../test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {
  GPURasterStatistics,
  GPURasterThreshold,
  type GPURasterBufferBand,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/gpu-raster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('GPURasterStatistics publishes calibrated, nodata-aware count, sum, mean, and extent', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'statistics-offset-calibration'});
  const sourceBuffer = makeInputBuffer(
    device,
    Float32Array.from([77, -999, Number.NaN, Number.POSITIVE_INFINITY, 1, 3, 5])
  );
  const validityBuffer = makeInputBuffer(device, Uint32Array.from([88, 1, 1, 1, 1, 0, 1]));
  const countBuffer = makeOutputBuffer(device, 2);
  const sumBuffer = makeOutputBuffer(device, 2);
  const meanBuffer = makeOutputBuffer(device, 2);
  const extentBuffer = makeOutputBuffer(device, 3);
  const input: GPURasterBufferBand<'float32'> = {
    id: 'reflectance',
    format: 'float32',
    storage: {kind: 'buffer', values: importView(graph, 'source', sourceBuffer, 'float32', 6, 4)},
    validity: importView(graph, 'validity', validityBuffer, 'uint32', 6, 4),
    noDataValue: -999,
    scale: 0.5,
    offset: 1
  };
  new GPURasterStatistics({
    id: 'masked-statistics',
    width: 3,
    height: 2,
    input,
    count: importView(graph, 'count', countBuffer, 'uint32', 1, 4),
    sum: importView(graph, 'sum', sumBuffer, 'float32', 1, 4),
    mean: importView(graph, 'mean', meanBuffer, 'float32', 1, 4),
    extent: importView(graph, 'extent', extentBuffer, 'float32', 2, 4)
  }).addToGraph(graph);

  const compiled = graph.compile();
  const nodeOrder = compiled.stats.nodeOrder;
  testCase.ok(
    nodeOrder.indexOf('masked-statistics-prepare') <
      nodeOrder.indexOf('masked-statistics-count-finalize'),
    'validity preparation precedes the count reduction'
  );
  testCase.ok(
    nodeOrder.indexOf('masked-statistics-mean') >
      nodeOrder.indexOf('masked-statistics-sum-finalize'),
    'the GPU mean reads the completed caller-owned sum'
  );
  submitGraph(device, compiled, 'statistics-offset-calibration');

  testCase.equal((await readUint32(countBuffer, 2))[1], 2, 'only two finite valid pixels remain');
  testCase.equal((await readFloat32(sumBuffer, 2))[1], 5, 'sum uses calibrated valid samples');
  testCase.equal((await readFloat32(meanBuffer, 2))[1], 2.5, 'GPU mean divides by valid count');
  testCase.deepEqual(
    (await readFloat32(extentBuffer, 3)).slice(1),
    [1.5, 3.5],
    'extent excludes nodata, nonfinite values, and masked pixels'
  );

  compiled.destroy();
  for (const buffer of [
    sourceBuffer,
    validityBuffer,
    countBuffer,
    sumBuffer,
    meanBuffer,
    extentBuffer
  ]) {
    buffer.destroy();
  }
  testCase.end();
});

test('GPURasterStatistics clears all-invalid outputs and reuses one compiled reduction graph', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'statistics-reusable-graph'});
  const sourceBuffer = makeInputBuffer(device, Float32Array.from([-999, Number.NaN, -999]));
  const validityBuffer = makeInputBuffer(device, Uint32Array.from([1, 1, 0]));
  const countBuffer = makeOutputBuffer(device, 1);
  const sumBuffer = makeOutputBuffer(device, 1);
  const meanBuffer = makeOutputBuffer(device, 1);
  const extentBuffer = makeOutputBuffer(device, 2);
  new GPURasterStatistics({
    width: 3,
    height: 1,
    input: {
      id: 'source',
      format: 'float32',
      storage: {kind: 'buffer', values: importView(graph, 'source', sourceBuffer, 'float32', 3)},
      validity: importView(graph, 'validity', validityBuffer, 'uint32', 3),
      noDataValue: -999
    },
    count: importView(graph, 'count', countBuffer, 'uint32', 1),
    sum: importView(graph, 'sum', sumBuffer, 'float32', 1),
    mean: importView(graph, 'mean', meanBuffer, 'float32', 1),
    extent: importView(graph, 'extent', extentBuffer, 'float32', 2)
  }).addToGraph(graph);

  const compiled = graph.compile();
  submitGraph(device, compiled, 'statistics-all-invalid');
  testCase.equal((await readUint32(countBuffer, 1))[0], 0, 'all-invalid count is zero');
  testCase.equal((await readFloat32(sumBuffer, 1))[0], 0, 'all-invalid sum is zero');
  testCase.equal((await readFloat32(meanBuffer, 1))[0], 0, 'all-invalid mean is zero');
  testCase.deepEqual(await readFloat32(extentBuffer, 2), [0, 0], 'all-invalid extent is cleared');

  sourceBuffer.write(Float32Array.from([2, 4, 6]));
  submitGraph(device, compiled, 'statistics-updated');
  testCase.equal((await readUint32(countBuffer, 1))[0], 2, 'updated source preserves source mask');
  testCase.equal((await readFloat32(sumBuffer, 1))[0], 6, 'updated sum reuses compiled graph');
  testCase.equal((await readFloat32(meanBuffer, 1))[0], 3, 'updated mean reuses compiled graph');
  testCase.deepEqual(await readFloat32(extentBuffer, 2), [2, 4], 'updated extent ignores mask');

  validityBuffer.write(Uint32Array.from([0, 0, 0]));
  submitGraph(device, compiled, 'statistics-remasked');
  testCase.equal((await readUint32(countBuffer, 1))[0], 0, 'updated mask clears count');
  testCase.equal((await readFloat32(meanBuffer, 1))[0], 0, 'updated mask clears mean');
  testCase.deepEqual(await readFloat32(extentBuffer, 2), [0, 0], 'updated mask clears extent');

  compiled.destroy();
  testCase.notOk(sourceBuffer.destroyed, 'borrowed source survives graph destruction');
  for (const buffer of [
    sourceBuffer,
    validityBuffer,
    countBuffer,
    sumBuffer,
    meanBuffer,
    extentBuffer
  ]) {
    buffer.destroy();
  }
  testCase.end();
});

test('GPURasterStatistics consumes threshold masks and rejects calibration overflow', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'statistics-threshold-overflow'});
  const sourceBuffer = makeInputBuffer(
    device,
    Float32Array.from([3.4028234663852886e38, 0.25, 0.5, 1])
  );
  const selectionBuffer = makeOutputBuffer(device, 4);
  const countBuffer = makeOutputBuffer(device, 1);
  const sumBuffer = makeOutputBuffer(device, 1);
  const meanBuffer = makeOutputBuffer(device, 1);
  const extentBuffer = makeOutputBuffer(device, 2);
  const source = importView(graph, 'source', sourceBuffer, 'float32', 4);
  const selection = importView(graph, 'selection', selectionBuffer, 'uint32', 4);
  const input: GPURasterBufferBand<'float32'> = {
    id: 'calibrated-source',
    format: 'float32',
    storage: {kind: 'buffer', values: source},
    scale: 2
  };

  new GPURasterThreshold({
    id: 'upstream-selection',
    width: 4,
    height: 1,
    input,
    output: selection,
    threshold: 1
  }).addToGraph(graph);
  new GPURasterStatistics({
    width: 4,
    height: 1,
    input: {...input, validity: selection},
    count: importView(graph, 'count', countBuffer, 'uint32', 1),
    sum: importView(graph, 'sum', sumBuffer, 'float32', 1),
    mean: importView(graph, 'mean', meanBuffer, 'float32', 1),
    extent: importView(graph, 'extent', extentBuffer, 'float32', 2)
  }).addToGraph(graph);
  const compiled = graph.compile();
  submitGraph(device, compiled, 'statistics-threshold-overflow');

  testCase.deepEqual(
    await readUint32(selectionBuffer, 4),
    [0, 0, 1, 1],
    'overflowed calibrated sample and below-threshold samples are rejected'
  );
  testCase.equal((await readUint32(countBuffer, 1))[0], 2, 'downstream count uses threshold mask');
  testCase.equal((await readFloat32(sumBuffer, 1))[0], 3, 'sum uses surviving calibrated values');
  testCase.equal(
    (await readFloat32(meanBuffer, 1))[0],
    1.5,
    'mean uses surviving calibrated values'
  );
  testCase.deepEqual(await readFloat32(extentBuffer, 2), [1, 2], 'extent uses the threshold mask');

  compiled.destroy();
  for (const buffer of [
    sourceBuffer,
    selectionBuffer,
    countBuffer,
    sumBuffer,
    meanBuffer,
    extentBuffer
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
