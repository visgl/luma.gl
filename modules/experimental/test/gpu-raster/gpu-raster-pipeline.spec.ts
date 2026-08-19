// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from '../../../../test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/experimental';
import {
  GPURasterContrast,
  GPURasterHistogram,
  GPURasterStatistics,
  GPURasterThreshold,
  type GPURasterBufferBand
} from '@luma.gl/experimental/gpu-raster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('GPURaster contrast and threshold controls change actual GPU histogram bins and scalar statistics', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'raster-interactive-analysis'});
  const sourceBuffer = createInputBuffer(device, Float32Array.from([0, 0.2, 0.5, 0.8, 1, -999]));
  const sourceValidityBuffer = createInputBuffer(device, Uint32Array.from([1, 1, 1, 1, 1, 1]));
  const contrastedBuffer = createOutputBuffer(device, 6);
  const contrastedValidityBuffer = createOutputBuffer(device, 6);
  const selectedValidityBuffer = createOutputBuffer(device, 6);
  const originalHistogramBuffer = createOutputBuffer(device, 4);
  const selectedHistogramBuffer = createOutputBuffer(device, 4);
  const selectedCountBuffer = createOutputBuffer(device, 1);
  const selectedSumBuffer = createOutputBuffer(device, 1);
  const selectedMeanBuffer = createOutputBuffer(device, 1);
  const selectedExtentBuffer = createOutputBuffer(device, 2);

  const source: GPURasterBufferBand<'float32'> = {
    id: 'reflectance',
    format: 'float32',
    storage: {
      kind: 'buffer',
      values: importView(graph, 'source-values', sourceBuffer, 'float32', 6)
    },
    validity: importView(graph, 'source-validity', sourceValidityBuffer, 'uint32', 6),
    noDataValue: -999
  };
  const contrastedValues = importView(graph, 'contrasted', contrastedBuffer, 'float32', 6);
  const contrastedValidity = importView(
    graph,
    'contrasted-validity',
    contrastedValidityBuffer,
    'uint32',
    6
  );
  new GPURasterContrast({
    id: 'linear-contrast',
    width: 3,
    height: 2,
    input: source,
    domain: [0, 1],
    contrast: 2,
    output: contrastedValues,
    outputValidity: contrastedValidity
  }).addToGraph(graph);

  const contrasted: GPURasterBufferBand<'float32'> = {
    id: 'contrast-adjusted',
    format: 'float32',
    storage: {kind: 'buffer', values: contrastedValues},
    validity: contrastedValidity
  };
  new GPURasterHistogram({
    id: 'all-adjusted-pixels',
    input: contrasted,
    domain: [0, 1],
    output: importView(graph, 'original-histogram', originalHistogramBuffer, 'uint32', 4)
  }).addToGraph(graph);

  const selectedValidity = importView(
    graph,
    'selected-validity',
    selectedValidityBuffer,
    'uint32',
    6
  );
  new GPURasterThreshold({
    id: 'actual-threshold',
    width: 3,
    height: 2,
    input: contrasted,
    threshold: 0.6,
    operation: 'above',
    output: selectedValidity
  }).addToGraph(graph);

  const selected: GPURasterBufferBand<'float32'> = {
    id: 'selected-pixels',
    format: 'float32',
    storage: {kind: 'buffer', values: contrastedValues},
    validity: selectedValidity
  };
  new GPURasterHistogram({
    id: 'selected-adjusted-pixels',
    input: selected,
    domain: [0, 1],
    output: importView(graph, 'selected-histogram', selectedHistogramBuffer, 'uint32', 4)
  }).addToGraph(graph);
  new GPURasterStatistics({
    id: 'selected-statistics',
    width: 3,
    height: 2,
    input: selected,
    count: importView(graph, 'selected-count', selectedCountBuffer, 'uint32', 1),
    sum: importView(graph, 'selected-sum', selectedSumBuffer, 'float32', 1),
    mean: importView(graph, 'selected-mean', selectedMeanBuffer, 'float32', 1),
    extent: importView(graph, 'selected-extent', selectedExtentBuffer, 'float32', 2)
  }).addToGraph(graph);

  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'raster-interactive-analysis'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());

  testCase.deepEqual(
    await readUint32(originalHistogramBuffer),
    [2, 0, 1, 2],
    'contrast changes actual source values before GPU binning'
  );
  testCase.deepEqual(
    await readUint32(selectedValidityBuffer),
    [0, 0, 0, 1, 1, 0],
    'thresholding publishes a real nodata-aware selection mask'
  );
  testCase.deepEqual(
    await readUint32(selectedHistogramBuffer),
    [0, 0, 0, 2],
    'thresholding removes rejected samples from the GPU histogram'
  );
  testCase.deepEqual(await readUint32(selectedCountBuffer), [2], 'valid count reflects selection');
  testCase.deepEqual(await readFloat32(selectedSumBuffer), [2], 'valid sum reflects selection');
  testCase.deepEqual(await readFloat32(selectedMeanBuffer), [1], 'valid mean reflects selection');
  testCase.deepEqual(
    await readFloat32(selectedExtentBuffer),
    [1, 1],
    'valid extent reflects selection'
  );

  compiled.destroy();
  for (const buffer of [
    sourceBuffer,
    sourceValidityBuffer,
    contrastedBuffer,
    contrastedValidityBuffer,
    selectedValidityBuffer,
    originalHistogramBuffer,
    selectedHistogramBuffer,
    selectedCountBuffer,
    selectedSumBuffer,
    selectedMeanBuffer,
    selectedExtentBuffer
  ]) {
    testCase.notOk(buffer.destroyed, 'the graph does not own caller-provided analysis storage');
    buffer.destroy();
  }
  testCase.end();
});

function createInputBuffer(device: Device, values: Float32Array | Uint32Array): Buffer {
  return device.createBuffer({data: values, usage: Buffer.STORAGE | Buffer.COPY_DST});
}

function createOutputBuffer(device: Device, length: number): Buffer {
  return device.createBuffer({
    byteLength: length * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function importView<Format extends 'float32' | 'uint32'>(
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

async function readUint32(buffer: Buffer): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
}

async function readFloat32(buffer: Buffer): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
}
