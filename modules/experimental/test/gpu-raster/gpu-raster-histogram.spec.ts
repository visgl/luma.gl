// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {
  GPURasterHistogram,
  type GPURasterBufferBand,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/gpu-raster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

it('GPURasterHistogram excludes finite raw nodata and preserves offset-aligned source masks', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'raster-offset-histogram'});
  const valuesBuffer = makeInputBuffer(
    device,
    Float32Array.from([77, -999, 1, 3, 5, Number.NaN, 7])
  );
  const sourceValidityBuffer = makeInputBuffer(device, Uint32Array.from([88, 1, 1, 1, 0, 1, 1]));
  const extentBuffer = makeOutputBuffer(device, 3);
  const histogramBuffer = makeOutputBuffer(device, 4);
  const input: GPURasterBufferBand<'float32'> = {
    id: 'reflectance',
    format: 'float32',
    storage: {
      kind: 'buffer',
      values: importView(graph, 'source-values', valuesBuffer, 'float32', 6, 4)
    },
    validity: importView(graph, 'source-validity', sourceValidityBuffer, 'uint32', 6, 4),
    noDataValue: -999
  };
  new GPURasterHistogram({
    id: 'masked-histogram',
    input,
    domainOutput: importView(graph, 'extent', extentBuffer, 'float32', 2, 4),
    output: importView(graph, 'bins', histogramBuffer, 'uint32', 3, 4)
  }).addToGraph(graph);

  const compiled = graph.compile();
  const validityIndex = compiled.stats.nodeOrder.indexOf('masked-histogram-resolve-validity');
  const extentIndex = compiled.stats.nodeOrder.indexOf('masked-histogram-valid-extent-finalize');
  const histogramIndex = compiled.stats.nodeOrder.indexOf('masked-histogram-bins-local');
  expect(
    Boolean(validityIndex !== -1 && extentIndex > validityIndex && histogramIndex > extentIndex),
    'declared graph hazards order raw validity, masked extent, and histogram accumulation'
  ).toBe(true);

  submitGraph(device, compiled, 'raster-offset-histogram');
  const extent = await readFloat32(extentBuffer, 3);
  const histogram = await readUint32(histogramBuffer, 4);
  expect(extent.slice(1), 'finite nodata and invalid pixels do not affect extent').toEqual([1, 7]);
  expect(histogram.slice(1), 'only offset-aligned valid pixels enter bins').toEqual([1, 1, 1]);

  compiled.destroy();
  valuesBuffer.destroy();
  sourceValidityBuffer.destroy();
  extentBuffer.destroy();
  histogramBuffer.destroy();
  void 0;
});

it('GPURasterHistogram retains exact signed and unsigned integer nodata sentinels', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const signed = await runIntegerHistogram({
    device,
    id: 'signed-raster-histogram',
    format: 'sint32',
    values: Int32Array.from([-2147483648, -7, 0, 7]),
    noDataValue: -2147483648
  });
  expect(signed.domain, 'minimum signed integer nodata is excluded exactly').toEqual([-7, 7]);
  expect(signed.bins, 'signed raw-domain values retain their exact bins').toEqual([1, 1, 1]);

  const unsigned = await runIntegerHistogram({
    device,
    id: 'unsigned-raster-histogram',
    format: 'uint32',
    values: Uint32Array.from([4294967295, 16777217, 16777218, 16777219]),
    noDataValue: 4294967295
  });
  expect(
    unsigned.domain,
    'uint32 values above float32 precision retain their exact automatic domain'
  ).toEqual([16777217, 16777219]);
  expect(
    unsigned.bins,
    'maximum uint32 nodata and nearby integer bins never round through float32'
  ).toEqual([1, 1, 1]);
  void 0;
});

it('GPURasterHistogram clears all-invalid outputs and reuses one compiled graph', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'raster-reusable-histogram'});
  const valuesBuffer = makeInputBuffer(device, Float32Array.from([-999, -999]));
  const extentBuffer = makeOutputBuffer(device, 2);
  const histogramBuffer = makeOutputBuffer(device, 2);
  new GPURasterHistogram({
    input: {
      id: 'reflectance',
      format: 'float32',
      storage: {
        kind: 'buffer',
        values: importView(graph, 'values', valuesBuffer, 'float32', 2)
      },
      noDataValue: -999
    },
    domainOutput: importView(graph, 'extent', extentBuffer, 'float32', 2),
    output: importView(graph, 'histogram', histogramBuffer, 'uint32', 2)
  }).addToGraph(graph);

  const compiled = graph.compile();
  submitGraph(device, compiled, 'raster-histogram-all-invalid');
  expect(await readFloat32(extentBuffer, 2), 'all-invalid extent becomes zero').toEqual([0, 0]);
  expect(await readUint32(histogramBuffer, 2), 'all-invalid bins are cleared').toEqual([0, 0]);

  valuesBuffer.write(Float32Array.from([2, 6]));
  submitGraph(device, compiled, 'raster-histogram-updated');
  expect(await readFloat32(extentBuffer, 2), 'domain updates without compiling').toEqual([2, 6]);
  expect(await readUint32(histogramBuffer, 2), 'updated valid samples are binned').toEqual([1, 1]);

  compiled.destroy();
  expect(
    Boolean(valuesBuffer.destroyed),
    'borrowed source storage survives graph destruction'
  ).toBe(false);
  valuesBuffer.destroy();
  extentBuffer.destroy();
  histogramBuffer.destroy();
  void 0;
});

async function runIntegerHistogram<Format extends 'uint32' | 'sint32'>(options: {
  device: Device;
  id: string;
  format: Format;
  values: Uint32Array | Int32Array;
  noDataValue: number;
}): Promise<{domain: number[]; bins: number[]}> {
  const {device, id, format, values, noDataValue} = options;
  const graph = new GPUCommandGraph(device, {id});
  const valuesBuffer = makeInputBuffer(device, values);
  const domainBuffer = makeOutputBuffer(device, 2);
  const histogramBuffer = makeOutputBuffer(device, 3);
  const input = {
    id,
    format,
    storage: {
      kind: 'buffer',
      values: importView(graph, `${id}-values`, valuesBuffer, format, values.length)
    },
    noDataValue
  } as GPURasterBufferBand<Format>;

  new GPURasterHistogram({
    id,
    input,
    domainOutput: importView(graph, `${id}-domain`, domainBuffer, format, 2),
    output: importView(graph, `${id}-bins`, histogramBuffer, 'uint32', 3)
  }).addToGraph(graph);

  const compiled = graph.compile();
  submitGraph(device, compiled, id);
  const domain =
    format === 'sint32' ? await readInt32(domainBuffer, 2) : await readUint32(domainBuffer, 2);
  const bins = await readUint32(histogramBuffer, 3);
  compiled.destroy();
  valuesBuffer.destroy();
  domainBuffer.destroy();
  histogramBuffer.destroy();
  return {domain, bins};
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
  const commandEncoder = device.createCommandEncoder({id});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
}

async function readFloat32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
}

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}

async function readInt32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Int32Array(bytes.buffer, bytes.byteOffset, length));
}
