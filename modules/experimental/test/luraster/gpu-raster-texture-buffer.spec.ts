// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from '../../../../test/utils/vitest-tape';
import {Buffer, Texture, type Device, type TextureFormat} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUHistogram,
  GPUReduction,
  type GraphDataView,
  type GraphTextureView
} from '@luma.gl/experimental';
import {
  GPURasterBufferToTexture,
  GPURasterTextureToBuffer,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/luraster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('LuRaster gathers odd-width float textures with nodata, masks, offsets, and calibration', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const width = 3;
  const height = 2;
  const graph = new GPUCommandGraph(device, {id: 'raster-float-gather'});
  const inputTexture = createTexture(device, 'input', 'r32float', width, height, Texture.SAMPLE);
  inputTexture.writeData(Float32Array.from([1, -999, Number.NaN, 4, 5, 6]));
  const inputMaskBuffer = createInputBuffer(device, Uint32Array.from([90, 1, 1, 1, 0, 1, 1]));
  const outputBuffer = createOutputBuffer(device, 7);
  const outputMaskBuffer = createOutputBuffer(device, 7);

  const input = {
    id: 'reflectance',
    format: 'float32' as const,
    storage: {kind: 'texture' as const, view: importTexture(graph, 'input-texture', inputTexture)},
    validity: importView(graph, 'input-mask', inputMaskBuffer, 'uint32', 6, 4),
    noDataValue: -999,
    scale: 2,
    offset: 1
  };
  const output = importView(graph, 'output', outputBuffer, 'float32', 6, 4);
  const outputValidity = importView(graph, 'output-mask', outputMaskBuffer, 'uint32', 6, 4);
  new GPURasterTextureToBuffer({
    input,
    output,
    outputValidity,
    applyCalibration: true
  }).addToGraph(graph);

  const compiled = graph.compile();
  submitGraph(device, compiled, 'raster-float-gather');
  const values = await readFloat32(outputBuffer, 7);
  const validity = await readUint32(outputMaskBuffer, 7);
  testCase.deepEqual(
    validity.slice(1),
    [1, 0, 0, 0, 1, 1],
    'raw nodata, NaN, and input mask intersect'
  );
  testCase.equal(values[1], 3, 'the first valid pixel is calibrated once');
  testCase.ok(Number.isNaN(values[2]), 'finite nodata becomes a canonical invalid float');
  testCase.ok(Number.isNaN(values[3]), 'non-finite input is rejected');
  testCase.ok(Number.isNaN(values[4]), 'masked pixels are rejected');
  testCase.deepEqual(values.slice(5), [11, 13], 'odd-width rows remain tightly packed');

  compiled.destroy();
  testCase.notOk(inputTexture.destroyed, 'compiled graph leaves borrowed input textures alive');
  testCase.notOk(outputBuffer.destroyed, 'compiled graph leaves borrowed output buffers alive');
  inputTexture.destroy();
  inputMaskBuffer.destroy();
  outputBuffer.destroy();
  outputMaskBuffer.destroy();
  testCase.end();
});

test('LuRaster preserves exact uint32 values and extracts one selected RGBA texture channel', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'raster-uint-gather'});
  const texture = createTexture(device, 'rgba-uint', 'rgba32uint', 3, 1, Texture.SAMPLE);
  texture.writeData(
    Uint32Array.from([0, 0, 16777217, 0, 0, 0, 4294967295, 0, 0, 0, 4294967294, 0])
  );
  const outputBuffer = createOutputBuffer(device, 3);
  const outputMaskBuffer = createOutputBuffer(device, 3);
  new GPURasterTextureToBuffer({
    input: {
      id: 'classification',
      format: 'uint32',
      storage: {kind: 'texture', view: importTexture(graph, 'uint-texture', texture), channel: 2},
      noDataValue: 4294967295
    },
    output: importView(graph, 'uint-output', outputBuffer, 'uint32', 3),
    outputValidity: importView(graph, 'uint-validity', outputMaskBuffer, 'uint32', 3)
  }).addToGraph(graph);

  const compiled = graph.compile();
  submitGraph(device, compiled, 'raster-uint-gather');
  testCase.deepEqual(
    await readUint32(outputBuffer, 3),
    [16777217, 0, 4294967294],
    'uint32 samples above float32 precision survive without implicit conversion'
  );
  testCase.deepEqual(
    await readUint32(outputMaskBuffer, 3),
    [1, 0, 1],
    'maximum uint32 nodata is exact'
  );

  compiled.destroy();
  texture.destroy();
  outputBuffer.destroy();
  outputMaskBuffer.destroy();
  testCase.end();
});

test('LuRaster preserves signed integer samples and the exact minimum signed nodata sentinel', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'raster-signed-gather'});
  const texture = createTexture(device, 'signed-input', 'r32sint', 4, 1, Texture.SAMPLE);
  texture.writeData(Int32Array.from([-2147483648, -7, 0, 2147483647]));
  const outputBuffer = createOutputBuffer(device, 4);
  const outputMaskBuffer = createOutputBuffer(device, 4);
  new GPURasterTextureToBuffer({
    input: {
      id: 'elevation',
      format: 'sint32',
      storage: {kind: 'texture', view: importTexture(graph, 'signed-texture', texture)},
      noDataValue: -2147483648
    },
    output: importView(graph, 'signed-output', outputBuffer, 'sint32', 4),
    outputValidity: importView(graph, 'signed-validity', outputMaskBuffer, 'uint32', 4)
  }).addToGraph(graph);

  const compiled = graph.compile();
  submitGraph(device, compiled, 'raster-signed-gather');
  testCase.deepEqual(
    await readInt32(outputBuffer, 4),
    [0, -7, 0, 2147483647],
    'negative and maximum signed samples retain their exact integer representation'
  );
  testCase.deepEqual(
    await readUint32(outputMaskBuffer, 4),
    [0, 1, 1, 1],
    'the minimum signed nodata sentinel is rejected without an overflowing WGSL literal'
  );

  compiled.destroy();
  texture.destroy();
  outputBuffer.destroy();
  outputMaskBuffer.destroy();
  testCase.end();
});

test('LuRaster composes gathered validity with a GPU-resident masked extent and histogram', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'raster-masked-histogram'});
  const texture = createTexture(device, 'source', 'r32float', 3, 2, Texture.SAMPLE);
  texture.writeData(Float32Array.from([1, -999, 3, 5, Number.NaN, 7]));
  const sourceMaskBuffer = createInputBuffer(device, Uint32Array.from([1, 1, 1, 0, 1, 1]));
  const valuesBuffer = createOutputBuffer(device, 6);
  const validityBuffer = createOutputBuffer(device, 6);
  const extentBuffer = createOutputBuffer(device, 2);
  const histogramBuffer = createOutputBuffer(device, 3);
  const values = importView(graph, 'values', valuesBuffer, 'float32', 6);
  const validity = importView(graph, 'validity', validityBuffer, 'uint32', 6);
  const extent = importView(graph, 'extent', extentBuffer, 'float32', 2);
  const histogram = importView(graph, 'histogram', histogramBuffer, 'uint32', 3);

  new GPURasterTextureToBuffer({
    id: 'raster-gather',
    input: {
      id: 'reflectance',
      format: 'float32',
      storage: {kind: 'texture', view: importTexture(graph, 'source-texture', texture)},
      validity: importView(graph, 'source-validity', sourceMaskBuffer, 'uint32', 6),
      noDataValue: -999
    },
    output: values,
    outputValidity: validity
  }).addToGraph(graph);
  new GPUReduction({
    id: 'valid-extent',
    input: values,
    mask: validity,
    output: extent,
    operation: 'extent'
  }).addToGraph(graph);
  new GPUHistogram({
    id: 'valid-histogram',
    input: values,
    mask: validity,
    domain: extent,
    output: histogram
  }).addToGraph(graph);

  const compiled = graph.compile();
  const gatherIndex = compiled.stats.nodeOrder.indexOf('raster-gather');
  const extentIndex = compiled.stats.nodeOrder.indexOf('valid-extent-finalize');
  const histogramIndex = compiled.stats.nodeOrder.indexOf('valid-histogram-local');
  testCase.ok(
    gatherIndex !== -1 && extentIndex > gatherIndex && histogramIndex > extentIndex,
    'declared hazards order gathering, masked extent, and GPU-domain histogram accumulation'
  );

  submitGraph(device, compiled, 'raster-masked-histogram');
  testCase.deepEqual(
    await readUint32(validityBuffer, 6),
    [1, 0, 1, 0, 0, 1],
    'finite nodata, source masks, and NaNs produce one shared canonical validity domain'
  );
  testCase.deepEqual(
    await readFloat32(extentBuffer, 2),
    [1, 7],
    'the masked GPU extent excludes the finite nodata outlier'
  );
  testCase.deepEqual(
    await readUint32(histogramBuffer, 3),
    [1, 1, 1],
    'GPU-resident domain and shared mask count only valid raster samples'
  );

  compiled.destroy();
  texture.destroy();
  sourceMaskBuffer.destroy();
  valuesBuffer.destroy();
  validityBuffer.destroy();
  extentBuffer.destroy();
  histogramBuffer.destroy();
  testCase.end();
});

test('LuRaster reads an explicitly selected 2D-array texture layer', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'raster-array-layer'});
  const texture = device.createTexture({
    id: 'array',
    dimension: '2d-array',
    width: 1,
    height: 1,
    depth: 2,
    format: 'r32float',
    usage: Texture.SAMPLE | Texture.COPY_DST
  });
  texture.writeData(Float32Array.from([7]), {z: 0, depthOrArrayLayers: 1});
  texture.writeData(Float32Array.from([13]), {z: 1, depthOrArrayLayers: 1});
  const handle = graph.importTexture(
    {
      id: 'layered-input',
      format: 'r32float',
      width: 1,
      height: 1,
      dimension: '2d-array',
      depth: 2,
      usage: texture.props.usage
    },
    texture
  );
  const selectedLayer = graph.createTextureView(handle, {
    dimension: '2d',
    baseArrayLayer: 1,
    arrayLayerCount: 1,
    mipLevelCount: 1
  });
  const outputBuffer = createOutputBuffer(device, 1);
  const outputMaskBuffer = createOutputBuffer(device, 1);
  new GPURasterTextureToBuffer({
    input: {id: 'layer', format: 'float32', storage: {kind: 'texture', view: selectedLayer}},
    output: importView(graph, 'layer-output', outputBuffer, 'float32', 1),
    outputValidity: importView(graph, 'layer-validity', outputMaskBuffer, 'uint32', 1)
  }).addToGraph(graph);

  const compiled = graph.compile();
  submitGraph(device, compiled, 'raster-array-layer');
  testCase.deepEqual(
    await readFloat32(outputBuffer, 1),
    [13],
    'the selected array layer is sampled'
  );
  testCase.deepEqual(await readUint32(outputMaskBuffer, 1), [1], 'selected layers retain validity');

  compiled.destroy();
  texture.destroy();
  outputBuffer.destroy();
  outputMaskBuffer.destroy();
  testCase.end();
});

test('LuRaster composes packed buffer-to-texture and texture-to-buffer passes in one graph', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }
  if (!device.getTextureFormatCapabilities('r32float').store) {
    testCase.comment('r32float storage textures are unavailable');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'raster-round-trip'});
  const sourceBuffer = createInputBuffer(device, Uint32Array.from([1, 99, 3, 4, 5, 6]));
  const sourceMaskBuffer = createInputBuffer(device, Uint32Array.from([1, 1, 0, 1, 1, 1]));
  const intermediateMaskBuffer = createOutputBuffer(device, 6);
  const outputBuffer = createOutputBuffer(device, 6);
  const outputMaskBuffer = createOutputBuffer(device, 6);
  const texture = createTexture(
    device,
    'intermediate',
    'r32float',
    3,
    2,
    Texture.SAMPLE | Texture.STORAGE
  );
  const textureView = importTexture(graph, 'intermediate-texture', texture);
  const intermediateValidity = importView(
    graph,
    'intermediate-validity',
    intermediateMaskBuffer,
    'uint32',
    6
  );
  new GPURasterBufferToTexture({
    id: 'scatter',
    input: {
      id: 'source',
      format: 'uint32',
      storage: {kind: 'buffer', values: importView(graph, 'source', sourceBuffer, 'uint32', 6)},
      validity: importView(graph, 'source-validity', sourceMaskBuffer, 'uint32', 6),
      noDataValue: 99,
      scale: 0.5,
      offset: 2
    },
    output: textureView,
    outputValidity: intermediateValidity,
    applyCalibration: true
  }).addToGraph(graph);
  new GPURasterTextureToBuffer({
    id: 'gather',
    input: {
      id: 'calibrated',
      format: 'float32',
      storage: {kind: 'texture', view: textureView},
      validity: intermediateValidity
    },
    output: importView(graph, 'result', outputBuffer, 'float32', 6),
    outputValidity: importView(graph, 'result-validity', outputMaskBuffer, 'uint32', 6)
  }).addToGraph(graph);

  const compiled = graph.compile();
  testCase.deepEqual(
    compiled.stats.nodeOrder,
    ['scatter', 'gather'],
    'texture hazards order both passes'
  );
  submitGraph(device, compiled, 'raster-round-trip');
  const values = await readFloat32(outputBuffer, 6);
  testCase.equal(values[0], 2.5, 'integer calibration explicitly produces float32 samples');
  testCase.ok(Number.isNaN(values[1]), 'raw integer nodata is rejected before calibration');
  testCase.ok(Number.isNaN(values[2]), 'the source validity mask survives both passes');
  testCase.deepEqual(values.slice(3), [4, 4.5, 5], 'all odd-width rows retain their order');
  testCase.deepEqual(
    await readUint32(outputMaskBuffer, 6),
    [1, 0, 0, 1, 1, 1],
    'masks stay aligned'
  );

  compiled.destroy();
  testCase.notOk(
    texture.destroyed,
    'caller-owned storage texture survives compiled graph destruction'
  );
  texture.destroy();
  sourceBuffer.destroy();
  sourceMaskBuffer.destroy();
  intermediateMaskBuffer.destroy();
  outputBuffer.destroy();
  outputMaskBuffer.destroy();
  testCase.end();
});

function createTexture<Format extends TextureFormat>(
  device: Device,
  id: string,
  format: Format,
  width: number,
  height: number,
  usage: number
): Texture & {format: Format} {
  return device.createTexture({
    id,
    format,
    width,
    height,
    usage: usage | Texture.COPY_DST
  }) as Texture & {format: Format};
}

function createInputBuffer(device: Device, data: Float32Array | Uint32Array): Buffer {
  return device.createBuffer({data, usage: Buffer.STORAGE | Buffer.COPY_DST});
}

function createOutputBuffer(device: Device, length: number): Buffer {
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

function importTexture<Format extends TextureFormat>(
  graph: GPUCommandGraph,
  id: string,
  texture: Texture & {format: Format}
): GraphTextureView<Format> {
  const handle = graph.importTexture(
    {
      id,
      format: texture.format,
      width: texture.width,
      height: texture.height,
      usage: texture.props.usage
    },
    texture
  );
  return graph.createTextureView(handle, {mipLevelCount: 1});
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
