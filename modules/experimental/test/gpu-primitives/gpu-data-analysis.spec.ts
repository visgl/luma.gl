// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUGridBinning,
  GPUHistogram,
  GPUReduction,
  type GPUReductionOperation
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUData, GPUVector, type GPUVectorFormat} from '@luma.gl/tables';

test('GPUReduction handles operations, formats, hierarchy, and invalid floats', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  t.deepEqual(await runReduction(device, Uint32Array.from([0xffffffff, 2]), 'uint32', 'sum'), [1]);
  t.deepEqual(await runReduction(device, Uint32Array.from([7, 3, 9, 3]), 'uint32', 'min'), [3]);
  t.deepEqual(await runReduction(device, Uint32Array.from([7, 3, 9, 3]), 'uint32', 'max'), [9]);
  t.deepEqual(
    await runReduction(device, Uint32Array.from([7, 3, 9, 3]), 'uint32', 'extent'),
    [3, 9]
  );
  t.deepEqual(await runReduction(device, Int32Array.from([-7, 3, -2]), 'sint32', 'sum'), [-6]);
  t.deepEqual(await runReduction(device, Int32Array.from([-7, 3, -2]), 'sint32', 'min'), [-7]);
  t.deepEqual(await runReduction(device, Int32Array.from([-7, 3, -2]), 'sint32', 'max'), [3]);
  t.deepEqual(
    await runReduction(device, Int32Array.from([-7, 3, -2]), 'sint32', 'extent'),
    [-7, 3]
  );
  const hierarchical = Uint32Array.from({length: 513}, (_, index) => index % 11);
  t.deepEqual(await runReduction(device, hierarchical, 'uint32', 'sum'), [2551]);

  const invalidFloats = Float32Array.from([Number.NaN, 4, Number.POSITIVE_INFINITY, -2]);
  const floatSum = await runReduction(device, Float32Array.from([0.1, 0.2, 0.3]), 'float32', 'sum');
  t.ok(Math.abs(floatSum[0] - 0.6) < 1e-6, 'float sum uses the fixed reduction tree');
  t.deepEqual(await runReduction(device, invalidFloats, 'float32', 'min'), [-2]);
  t.deepEqual(await runReduction(device, invalidFloats, 'float32', 'max'), [4]);
  t.deepEqual(await runReduction(device, invalidFloats, 'float32', 'extent'), [-2, 4]);
  t.deepEqual(
    await runReduction(
      device,
      Float32Array.from([Number.NaN, Number.NEGATIVE_INFINITY]),
      'float32',
      'min'
    ),
    [0]
  );
  t.deepEqual(await runReduction(device, new Float32Array(0), 'float32', 'extent'), [0, 0]);
  t.end();
});

test('GPUReduction combines fixed-width GPUVector chunks', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  t.deepEqual(
    await runVectorReduction(
      device,
      [Uint32Array.from([7, 3]), new Uint32Array(0), Uint32Array.from([9, 4])],
      'uint32',
      'sum'
    ),
    [23],
    'sum combines non-empty chunks and skips empty chunks'
  );
  t.deepEqual(
    await runVectorReduction(
      device,
      [Uint32Array.from([7, 3]), Uint32Array.from([9, 4])],
      'uint32',
      'extent'
    ),
    [3, 9],
    'extent combines per-chunk minima and maxima'
  );
  t.deepEqual(
    await runVectorReduction(
      device,
      [Float32Array.from([Number.NaN, Number.POSITIVE_INFINITY]), Float32Array.from([4, -2])],
      'float32',
      'min'
    ),
    [-2],
    'invalid-only chunks do not inject zero into a valid floating reduction'
  );
  t.deepEqual(
    await runVectorReduction(
      device,
      [Float32Array.from([Number.NaN]), Float32Array.from([Number.NEGATIVE_INFINITY])],
      'float32',
      'max'
    ),
    [0],
    'all-invalid floating chunks produce zero'
  );
  t.deepEqual(
    await runVectorReduction(device, [new Int32Array(0), new Int32Array(0)], 'sint32', 'extent'),
    [0, 0],
    'an all-empty vector produces zero'
  );
  t.end();
});

test('GPUHistogram supports literal, GPU, and automatic domains', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  t.deepEqual(
    await runHistogram(device, Uint32Array.from([0, 1, 2, 3, 4, 4, 5]), 'uint32', 4, [0, 4]),
    [1, 1, 1, 3],
    'literal uint32 domain includes exact maximum in final bin'
  );
  t.deepEqual(
    await runHistogram(
      device,
      Uint32Array.from([0, 0x7fffffff, 0x80000000, 0xffffffff]),
      'uint32',
      2,
      [0, 0xffffffff]
    ),
    [2, 2],
    'full-range uint32 bin boundaries stay in integer space'
  );
  t.deepEqual(
    await runHistogram(
      device,
      Int32Array.from([-0x80000000, -1, 0, 0x7fffffff]),
      'sint32',
      2,
      [-0x80000000, 0x7fffffff]
    ),
    [2, 2],
    'full-range sint32 bin boundaries stay in integer space'
  );
  let randomState = 0x1234abcd;
  const fullRangeValues = Uint32Array.from({length: 1025}, (_, index) => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return index === 1024 ? 0xffffffff : randomState;
  });
  const fullRangeBinCount = 257;
  const expectedFullRangeCounts = Array.from({length: fullRangeBinCount}, () => 0);
  for (const value of fullRangeValues) {
    const binIndex =
      value === 0xffffffff
        ? fullRangeBinCount - 1
        : Number((BigInt(value) * BigInt(fullRangeBinCount)) / 0xffffffffn);
    expectedFullRangeCounts[binIndex]++;
  }
  t.deepEqual(
    await runHistogram(device, fullRangeValues, 'uint32', fullRangeBinCount, [0, 0xffffffff]),
    expectedFullRangeCounts,
    'wide integer multiply/divide matches an exact BigInt reference above 256 bins'
  );
  t.deepEqual(
    await runHistogram(device, Int32Array.from([-2, -1, 0, 1, 2]), 'sint32', 2, [-2, 2], true),
    [2, 3],
    'GPU sint32 domain is accepted'
  );
  t.deepEqual(
    await runHistogram(
      device,
      Float32Array.from([Number.NaN, -1, 0, 1, Number.POSITIVE_INFINITY]),
      'float32',
      2,
      'auto'
    ),
    [1, 2],
    'automatic float domain ignores non-finite values'
  );
  t.deepEqual(
    await runHistogram(device, Uint32Array.from([7, 7, 8]), 'uint32', 3, [7, 7]),
    [2, 0, 0],
    'degenerate domain counts matching values in bin zero'
  );
  t.deepEqual(
    await runHistogram(device, new Float32Array(0), 'float32', 4, 'auto'),
    [0, 0, 0, 0],
    'empty automatic histogram is cleared'
  );
  const globalValues = Uint32Array.from({length: 300}, (_, index) => index);
  t.deepEqual(
    await runHistogram(device, globalValues, 'uint32', 300, [0, 299]),
    Array.from({length: 300}, () => 1),
    'more than 256 bins uses the global atomic path'
  );
  t.end();
});

test('GPUHistogram accumulates fixed-width GPUVector chunks after one clear', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const literal = await runVectorHistogram(
    device,
    [Uint32Array.from([0, 1]), new Uint32Array(0), Uint32Array.from([2, 3, 3])],
    'uint32',
    4,
    [0, 3]
  );
  t.deepEqual(literal.counts, [1, 1, 1, 2], 'every non-empty chunk contributes counts');
  t.deepEqual(
    literal.nodeOrder,
    ['gpu-histogram-clear', 'gpu-histogram-chunk-0-local', 'gpu-histogram-chunk-2-local'],
    'one clear precedes ordered per-chunk accumulation and empty chunks keep their source index'
  );
  t.equal(
    literal.logicalTransientBufferCount,
    0,
    'a literal-domain histogram does not pack or concatenate input chunks'
  );

  const automatic = await runVectorHistogram(
    device,
    [
      Float32Array.from([Number.NaN, Number.POSITIVE_INFINITY]),
      Float32Array.from([-2, 0]),
      Float32Array.from([4, 6])
    ],
    'float32',
    4,
    'auto'
  );
  t.deepEqual(
    automatic.counts,
    [1, 1, 0, 2],
    'automatic domain reduction spans all chunks and ignores non-finite values'
  );

  const globalValues = [
    Uint32Array.from({length: 150}, (_, index) => index),
    Uint32Array.from({length: 150}, (_, index) => index + 150)
  ];
  const global = await runVectorHistogram(device, globalValues, 'uint32', 300, [0, 299]);
  t.deepEqual(
    global.counts,
    Array.from({length: 300}, () => 1),
    'the global atomic path accumulates every chunk'
  );
  t.end();
});

test('GPUHistogram clears counts for every graph encoding and composes with reduction', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const values = Uint32Array.from([0, 1, 1, 2, 3, 3, 3]);
  const inputBuffer = createInputBuffer(device, values);
  const countsBuffer = createOutputBuffer(device, 4);
  const totalBuffer = createOutputBuffer(device, 1);
  const graph = new GPUCommandGraph(device, {id: 'histogram-composition'});
  const input = importView(graph, 'values', inputBuffer, 'uint32', values.length);
  const counts = importView(graph, 'counts', countsBuffer, 'uint32', 4);
  const total = importView(graph, 'total', totalBuffer, 'uint32', 1);
  new GPUHistogram({input, output: counts, domain: [0, 3]}).addToGraph(graph);
  new GPUReduction({input: counts, output: total, operation: 'sum'}).addToGraph(graph);
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'histogram-repeat'});
  compiled.encode(commandEncoder, {parameters: undefined});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  t.deepEqual(await readUint32(countsBuffer, 4), [1, 2, 1, 3], 'second encoding resets output');
  t.deepEqual(await readUint32(totalBuffer, 1), [7], 'reduced count equals accepted rows');
  compiled.destroy();
  t.notOk(inputBuffer.destroyed, 'compiled graph preserves imported input');
  t.notOk(countsBuffer.destroyed, 'compiled graph preserves imported output');
  inputBuffer.destroy();
  countsBuffer.destroy();
  totalBuffer.destroy();
  t.end();
});

test('GPUGridBinning handles literal/GPU bounds, boundaries, and both atomic paths', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const positions = Float32Array.from([0, 0, 1, 0, 0, 1, 2, 2, 2, 2, -1, 0, Number.NaN, 1]);
  t.deepEqual(
    await runGrid(device, positions, [2, 2], [0, 0, 2, 2]),
    [1, 1, 1, 2],
    'row-major cells include exact maximum boundaries'
  );
  t.deepEqual(
    await runGrid(device, positions, [2, 2], [0, 0, 2, 2], true),
    [1, 1, 1, 2],
    'GPU bounds view is accepted'
  );
  const globalPositions = new Float32Array(17 * 17 * 2);
  for (let row = 0; row < 17; row++) {
    for (let column = 0; column < 17; column++) {
      const index = row * 17 + column;
      globalPositions[index * 2] = column;
      globalPositions[index * 2 + 1] = row;
    }
  }
  t.deepEqual(
    await runGrid(device, globalPositions, [17, 17], [0, 0, 16, 16]),
    Array.from({length: 289}, () => 1),
    'more than 256 cells uses the global atomic path'
  );
  t.deepEqual(
    await runGrid(device, new Float32Array(0), [2, 2], [0, 0, 1, 1]),
    [0, 0, 0, 0],
    'empty grid is cleared'
  );
  t.end();
});

test('GPUGridBinning clears once and accumulates GPUVector chunks in order', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const result = await runVectorGrid(
    device,
    [Float32Array.from([0, 0, 1, 0]), new Float32Array(0), Float32Array.from([0, 1, 2, 2, 2, 2])],
    [2, 2],
    [0, 0, 2, 2]
  );
  t.deepEqual(result.counts, [1, 1, 1, 2], 'every non-empty position chunk contributes');
  t.deepEqual(
    result.nodeOrder,
    ['gpu-grid-binning-clear', 'gpu-grid-binning-chunk-0-local', 'gpu-grid-binning-chunk-2-local'],
    'one clear precedes ordered accumulation and empty chunks keep their source index'
  );
  t.equal(result.logicalTransientBufferCount, 0, 'position chunks are not packed or concatenated');
  t.end();
});

test('GPU data analysis primitives validate layouts and ownership', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const graph = new GPUCommandGraph(device);
  const inputHandle = graph.createTransientBuffer({
    id: 'input',
    byteLength: 64,
    usage: Buffer.STORAGE
  });
  const outputHandle = graph.createTransientBuffer({
    id: 'output',
    byteLength: 64,
    usage: Buffer.STORAGE
  });
  const input = graph.createDataView(inputHandle, {format: 'uint32', length: 4});
  const one = graph.createDataView(outputHandle, {format: 'uint32', length: 1});
  const two = graph.createDataView(outputHandle, {format: 'uint32', length: 2});
  t.throws(
    () => new GPUReduction({input, output: two, operation: 'sum'}),
    /must contain 1 row/,
    'scalar reduction requires one output row'
  );
  t.throws(
    () => new GPUReduction({input, output: one, operation: 'extent'}),
    /must contain 2 row/,
    'extent requires two output rows'
  );
  t.throws(
    () => new GPUHistogram({input, output: two, domain: [2, 1]}),
    /finite \[min, max\]/,
    'inverted literal histogram domain is rejected'
  );
  const positions = graph.createDataView(inputHandle, {format: 'float32x2', length: 4});
  t.throws(
    () => new GPUGridBinning({positions, output: two, gridSize: [2, 2], bounds: [0, 0, 1, 1]}),
    /output.length/,
    'grid output layout is validated'
  );
  t.end();
});

type ScalarFormat = 'uint32' | 'sint32' | 'float32';
type ScalarArray = Uint32Array | Int32Array | Float32Array;

async function runReduction(
  device: Device,
  values: ScalarArray,
  format: ScalarFormat,
  operation: GPUReductionOperation
): Promise<number[]> {
  const outputLength = operation === 'extent' ? 2 : 1;
  const inputBuffer = createInputBuffer(device, values);
  const outputBuffer = createOutputBuffer(device, outputLength);
  const graph = new GPUCommandGraph(device);
  const input = importView(graph, 'input', inputBuffer, format, values.length);
  const output = importView(graph, 'output', outputBuffer, format, outputLength);
  new GPUReduction({input, output, operation}).addToGraph(graph);
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'reduction-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const bytes = await outputBuffer.readAsync();
  const ResultArray =
    format === 'uint32' ? Uint32Array : format === 'sint32' ? Int32Array : Float32Array;
  const result = Array.from(new ResultArray(bytes.buffer, bytes.byteOffset, outputLength));
  compiled.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
  return result;
}

async function runVectorReduction(
  device: Device,
  chunks: ScalarArray[],
  format: ScalarFormat,
  operation: GPUReductionOperation
): Promise<number[]> {
  const outputLength = operation === 'extent' ? 2 : 1;
  const inputBuffers = chunks.map(chunk => createInputBuffer(device, chunk));
  const vector = new GPUVector({
    type: 'data',
    name: 'input',
    format,
    data: chunks.map(
      (chunk, index) =>
        new GPUData({buffer: inputBuffers[index], format, length: chunk.length, ownsBuffer: false})
    ),
    ownsData: false
  });
  const outputBuffer = createOutputBuffer(device, outputLength);
  const graph = new GPUCommandGraph(device);
  const input = graph.importGPUVector('input', vector);
  const output = importView(graph, 'output', outputBuffer, format, outputLength);
  new GPUReduction({input, output, operation}).addToGraph(graph);
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'vector-reduction-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const bytes = await outputBuffer.readAsync();
  const ResultArray =
    format === 'uint32' ? Uint32Array : format === 'sint32' ? Int32Array : Float32Array;
  const result = Array.from(new ResultArray(bytes.buffer, bytes.byteOffset, outputLength));
  compiled.destroy();
  vector.destroy();
  for (const buffer of inputBuffers) buffer.destroy();
  outputBuffer.destroy();
  return result;
}

async function runHistogram(
  device: Device,
  values: ScalarArray,
  format: ScalarFormat,
  binCount: number,
  domain: readonly [number, number] | 'auto',
  gpuDomain = false
): Promise<number[]> {
  const inputBuffer = createInputBuffer(device, values);
  const outputBuffer = createOutputBuffer(device, binCount);
  const graph = new GPUCommandGraph(device);
  const input = importView(graph, 'input', inputBuffer, format, values.length);
  const output = importView(graph, 'output', outputBuffer, 'uint32', binCount);
  let histogramDomain: typeof domain | ReturnType<typeof importView> = domain;
  let domainBuffer: Buffer | undefined;
  if (gpuDomain && domain !== 'auto') {
    const DomainArray =
      format === 'uint32' ? Uint32Array : format === 'sint32' ? Int32Array : Float32Array;
    domainBuffer = createInputBuffer(device, DomainArray.from(domain));
    histogramDomain = importView(graph, 'domain', domainBuffer, format, 2);
  }
  new GPUHistogram({input, output, domain: histogramDomain as never}).addToGraph(graph);
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'histogram-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const result = await readUint32(outputBuffer, binCount);
  compiled.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
  domainBuffer?.destroy();
  return result;
}

async function runVectorHistogram(
  device: Device,
  chunks: ScalarArray[],
  format: ScalarFormat,
  binCount: number,
  domain: readonly [number, number] | 'auto'
): Promise<{counts: number[]; nodeOrder: string[]; logicalTransientBufferCount: number}> {
  const inputBuffers = chunks.map(chunk => createInputBuffer(device, chunk));
  const vector = new GPUVector({
    type: 'data',
    name: 'input',
    format,
    data: chunks.map(
      (chunk, index) =>
        new GPUData({buffer: inputBuffers[index], format, length: chunk.length, ownsBuffer: false})
    ),
    ownsData: false
  });
  const outputBuffer = createOutputBuffer(device, binCount);
  const graph = new GPUCommandGraph(device);
  const input = graph.importGPUVector('input', vector);
  const output = importView(graph, 'output', outputBuffer, 'uint32', binCount);
  new GPUHistogram({input, output, domain}).addToGraph(graph);
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'vector-histogram-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const counts = await readUint32(outputBuffer, binCount);
  const {nodeOrder, logicalTransientBufferCount} = compiled.stats;
  compiled.destroy();
  vector.destroy();
  for (const buffer of inputBuffers) buffer.destroy();
  outputBuffer.destroy();
  return {counts, nodeOrder, logicalTransientBufferCount};
}

async function runGrid(
  device: Device,
  positions: Float32Array,
  gridSize: readonly [number, number],
  bounds: readonly [number, number, number, number],
  gpuBounds = false
): Promise<number[]> {
  const positionsBuffer = createInputBuffer(device, positions);
  const outputBuffer = createOutputBuffer(device, gridSize[0] * gridSize[1]);
  const graph = new GPUCommandGraph(device);
  const positionsView = importView(
    graph,
    'positions',
    positionsBuffer,
    'float32x2',
    positions.length / 2
  );
  const output = importView(graph, 'output', outputBuffer, 'uint32', gridSize[0] * gridSize[1]);
  let gridBounds: typeof bounds | ReturnType<typeof importView> = bounds;
  let boundsBuffer: Buffer | undefined;
  if (gpuBounds) {
    boundsBuffer = createInputBuffer(device, Float32Array.from(bounds));
    gridBounds = importView(graph, 'bounds', boundsBuffer, 'float32x4', 1);
  }
  new GPUGridBinning({
    positions: positionsView as never,
    output,
    gridSize,
    bounds: gridBounds as never
  }).addToGraph(graph);
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'grid-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const result = await readUint32(outputBuffer, output.length);
  compiled.destroy();
  positionsBuffer.destroy();
  outputBuffer.destroy();
  boundsBuffer?.destroy();
  return result;
}

async function runVectorGrid(
  device: Device,
  chunks: Float32Array[],
  gridSize: readonly [number, number],
  bounds: readonly [number, number, number, number]
): Promise<{counts: number[]; nodeOrder: string[]; logicalTransientBufferCount: number}> {
  const positionBuffers = chunks.map(chunk => createInputBuffer(device, chunk));
  const vector = new GPUVector({
    type: 'data',
    name: 'positions',
    format: 'float32x2',
    data: chunks.map(
      (chunk, chunkIndex) =>
        new GPUData({
          buffer: positionBuffers[chunkIndex],
          format: 'float32x2',
          length: chunk.length / 2,
          ownsBuffer: false
        })
    ),
    ownsData: false
  });
  const outputBuffer = createOutputBuffer(device, gridSize[0] * gridSize[1]);
  const graph = new GPUCommandGraph(device);
  const positions = graph.importGPUVector('positions', vector);
  const output = importView(graph, 'output', outputBuffer, 'uint32', gridSize[0] * gridSize[1]);
  new GPUGridBinning({positions, output, gridSize, bounds}).addToGraph(graph);
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'vector-grid-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const counts = await readUint32(outputBuffer, output.length);
  const {nodeOrder, logicalTransientBufferCount} = compiled.stats;
  compiled.destroy();
  vector.destroy();
  for (const buffer of positionBuffers) buffer.destroy();
  outputBuffer.destroy();
  return {counts, nodeOrder, logicalTransientBufferCount};
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

function importView<T extends GPUVectorFormat>(
  graph: GPUCommandGraph,
  id: string,
  buffer: Buffer,
  format: T,
  length: number
) {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length});
}

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}
