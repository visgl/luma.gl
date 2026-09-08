import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUReduction,
  type GPUReductionOperation,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

type ScalarFormat = 'uint32' | 'sint32' | 'float32';
type ScalarArray = Uint32Array | Int32Array | Float32Array;

it('GPUReduction filters sums and extrema across every scalar format', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const unsignedValues = Uint32Array.from([0xffffffff, 5, 7, 2]);
  const selection = Uint32Array.from([0, 1, 3, 0]);
  expect(
    await runMaskedReduction(device, unsignedValues, selection, 'uint32', 'sum'),
    'unsigned sums accept every nonzero selection and ignore excluded rows'
  ).toEqual([12]);
  expect(
    await runMaskedReduction(device, unsignedValues, selection, 'uint32', 'min'),
    'unsigned minima do not treat excluded rows as zeros'
  ).toEqual([5]);
  expect(
    await runMaskedReduction(device, unsignedValues, selection, 'uint32', 'max'),
    'unsigned maxima omit excluded high values'
  ).toEqual([7]);
  expect(
    await runMaskedReduction(device, unsignedValues, selection, 'uint32', 'extent'),
    'unsigned extents span selected values only'
  ).toEqual([5, 7]);

  const signedValues = Int32Array.from([-30, -9, -4, 90]);
  expect(
    await runMaskedReduction(device, signedValues, selection, 'sint32', 'sum'),
    'signed sums preserve negative selected values'
  ).toEqual([-13]);
  expect(
    await runMaskedReduction(device, signedValues, selection, 'sint32', 'extent'),
    'signed extrema do not inject excluded zero values'
  ).toEqual([-9, -4]);

  const floatingValues = Float32Array.from([Number.NaN, -1.5, 4.5, Number.POSITIVE_INFINITY]);
  expect(
    await runMaskedReduction(device, floatingValues, selection, 'float32', 'sum'),
    'excluded floating NaN and infinities cannot contaminate selected sums'
  ).toEqual([3]);
  expect(
    await runMaskedReduction(
      device,
      Float32Array.from([Number.NaN, Number.POSITIVE_INFINITY, 2]),
      Uint32Array.from([1, 1, 1]),
      'float32',
      'sum'
    ),
    'masked floating sums also ignore selected non-finite samples'
  ).toEqual([2]);
  expect(
    await runMaskedReduction(device, floatingValues, selection, 'float32', 'extent'),
    'floating extrema combine source selection with finite-value filtering'
  ).toEqual([-1.5, 4.5]);
});

it('GPUReduction returns zero for fully excluded rows and preserves hierarchical validity', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const values = Uint32Array.from([9, 13, 21]);
  const excluded = new Uint32Array(values.length);
  for (const operation of ['sum', 'min', 'max', 'extent'] as const) {
    expect(
      await runMaskedReduction(device, values, excluded, 'uint32', operation),
      `fully excluded unsigned ${operation} results use the documented zero sentinel`
    ).toEqual(operation === 'extent' ? [0, 0] : [0]);
  }

  const hierarchicalValues = Int32Array.from({length: 769}, (_, index) => index - 900);
  const hierarchicalSelection = new Uint32Array(hierarchicalValues.length);
  hierarchicalSelection[512] = 1;
  hierarchicalSelection[768] = 9;
  expect(
    await runMaskedReduction(device, hierarchicalValues, hierarchicalSelection, 'sint32', 'extent'),
    'invalid workgroups cannot inject zeros while merging later selected negative values'
  ).toEqual([-388, -132]);

  const floatingValues = Float32Array.from([Number.NaN, Number.POSITIVE_INFINITY, 12]);
  const floatingSelection = Uint32Array.from([1, 1, 0]);
  expect(
    await runMaskedReduction(device, floatingValues, floatingSelection, 'float32', 'max'),
    'selected nonfinite floating values do not produce valid extrema'
  ).toEqual([0]);
});

it('GPUReduction preserves aligned masks across empty and fully excluded vector chunks', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const signedChunks = [
    Int32Array.from([100, 200]),
    new Int32Array(0),
    Int32Array.from([-8, -3, -1])
  ];
  const maskChunks = [Uint32Array.from([0, 0]), new Uint32Array(0), Uint32Array.from([1, 7, 0])];
  expect(
    await runMaskedVectorReduction(device, signedChunks, maskChunks, 'sint32', 'sum'),
    'masked chunk sums preserve source positions across empty chunks'
  ).toEqual([-11]);
  expect(
    await runMaskedVectorReduction(device, signedChunks, maskChunks, 'sint32', 'min'),
    'fully excluded first chunks do not introduce zero minima'
  ).toEqual([-8]);
  expect(
    await runMaskedVectorReduction(device, signedChunks, maskChunks, 'sint32', 'max'),
    'fully excluded first chunks do not introduce zero maxima'
  ).toEqual([-3]);
  expect(
    await runMaskedVectorReduction(device, signedChunks, maskChunks, 'sint32', 'extent'),
    'chunk validity propagates through the final signed extent merge'
  ).toEqual([-8, -3]);

  const floatingChunks = [
    Float32Array.from([Number.NaN, Number.POSITIVE_INFINITY]),
    Float32Array.from([3.5, -2.5])
  ];
  const floatingMasks = [Uint32Array.from([1, 1]), Uint32Array.from([0, 1])];
  expect(
    await runMaskedVectorReduction(device, floatingChunks, floatingMasks, 'float32', 'extent'),
    'invalid-only floating chunks preserve the selected finite chunk extent'
  ).toEqual([-2.5, -2.5]);
});

async function runMaskedReduction(
  device: Device,
  values: ScalarArray,
  selection: Uint32Array,
  format: ScalarFormat,
  operation: GPUReductionOperation
): Promise<number[]> {
  const outputLength = operation === 'extent' ? 2 : 1;
  const inputBuffer = createInputBuffer(device, values);
  const selectionBuffer = createInputBuffer(device, selection);
  const outputBuffer = createOutputBuffer(device, outputLength);
  const graph = new GPUCommandGraph(device);
  const input = importView(graph, 'input', inputBuffer, format, values.length);
  const mask = importView(graph, 'selection', selectionBuffer, 'uint32', selection.length);
  const output = importView(graph, 'output', outputBuffer, format, outputLength);
  new GPUReduction({input, output, mask, operation}).addToGraph(graph);

  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'masked-reduction-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const result = await readReductionOutput(outputBuffer, format, outputLength);

  compiled.destroy();
  inputBuffer.destroy();
  selectionBuffer.destroy();
  outputBuffer.destroy();
  return result;
}

async function runMaskedVectorReduction(
  device: Device,
  valueChunks: ScalarArray[],
  maskChunks: Uint32Array[],
  format: ScalarFormat,
  operation: GPUReductionOperation
): Promise<number[]> {
  const outputLength = operation === 'extent' ? 2 : 1;
  const valueBuffers = valueChunks.map(chunk => createInputBuffer(device, chunk));
  const maskBuffers = maskChunks.map(chunk => createInputBuffer(device, chunk));
  const values = new GPUVector({
    type: 'data',
    name: 'values',
    format,
    data: valueChunks.map(
      (chunk, chunkIndex) =>
        new GPUData({
          buffer: valueBuffers[chunkIndex],
          format,
          length: chunk.length,
          ownsBuffer: false
        })
    ),
    ownsData: false
  });
  const selection = new GPUVector({
    type: 'data',
    name: 'selection',
    format: 'uint32',
    data: maskChunks.map(
      (chunk, chunkIndex) =>
        new GPUData({
          buffer: maskBuffers[chunkIndex],
          format: 'uint32',
          length: chunk.length,
          ownsBuffer: false
        })
    ),
    ownsData: false
  });
  const outputBuffer = createOutputBuffer(device, outputLength);
  const graph = new GPUCommandGraph(device);
  const input = graph.importGPUVector('values', values);
  const mask = graph.importGPUVector('selection', selection);
  const output = importView(graph, 'output', outputBuffer, format, outputLength);
  new GPUReduction({input, output, mask, operation}).addToGraph(graph);

  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'masked-vector-reduction-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const result = await readReductionOutput(outputBuffer, format, outputLength);

  compiled.destroy();
  values.destroy();
  selection.destroy();
  for (const buffer of [...valueBuffers, ...maskBuffers]) {
    buffer.destroy();
  }
  outputBuffer.destroy();
  return result;
}

function createInputBuffer(device: Device, values: ScalarArray): Buffer {
  const data = values.length > 0 ? values : new Uint32Array(1);
  return device.createBuffer({data, usage: Buffer.STORAGE | Buffer.COPY_DST});
}

function createOutputBuffer(device: Device, length: number): Buffer {
  return device.createBuffer({
    byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function importView<T extends ScalarFormat>(
  graph: GPUCommandGraph,
  id: string,
  buffer: Buffer,
  format: T,
  length: number
): GraphDataView<T> {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length});
}

async function readReductionOutput(
  buffer: Buffer,
  format: ScalarFormat,
  length: number
): Promise<number[]> {
  const bytes = await buffer.readAsync();
  const ResultArray =
    format === 'uint32' ? Uint32Array : format === 'sint32' ? Int32Array : Float32Array;
  return Array.from(new ResultArray(bytes.buffer, bytes.byteOffset, length));
}
