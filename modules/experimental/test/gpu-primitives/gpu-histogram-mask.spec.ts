// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUHistogram,
  type GPUHistogramMask,
  type GraphDataView
} from '@luma.gl/experimental';
import {GPUData, GPUVector, type GPUVectorFormat} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

type ScalarFormat = 'uint32' | 'sint32' | 'float32';
type ScalarArray = Uint32Array | Int32Array | Float32Array;
type HistogramOptions =
  | {domain: readonly [number, number] | 'auto'}
  | {edges: readonly number[]; gpuEdges?: boolean};

type VectorFixture<T extends ScalarFormat> = {
  vector: GPUVector<T>;
  buffers: Buffer[];
};

test('GPUHistogram filters equal-width bins with reusable GPU-resident masks', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const local = await runMaskedHistogram({
    device,
    values: Uint32Array.from([0, 1, 2, 3, 4, 4, 5]),
    mask: Uint32Array.from([1, 0, 7, 1, 0, 3, 1]),
    updatedMask: Uint32Array.from([0, 1, 0, 0, 1, 0, 0]),
    format: 'uint32',
    binCount: 4,
    options: {domain: [0, 4]}
  });
  testCase.deepEqual(
    local.counts,
    [1, 0, 1, 2],
    'the local atomic path accepts every nonzero in-range mask row'
  );
  testCase.deepEqual(
    local.updatedCounts,
    [0, 1, 0, 1],
    'rewriting the mask updates counts without recompiling the graph'
  );
  testCase.deepEqual(
    local.nodeOrder,
    ['gpu-histogram-clear', 'gpu-histogram-local'],
    'masking does not introduce extra dispatches'
  );

  const globalValues = Uint32Array.from({length: 301}, (_, index) => index);
  const globalMask = Uint32Array.from(globalValues, value => Number(value % 2 === 0));
  const global = await runMaskedHistogram({
    device,
    values: globalValues,
    mask: globalMask,
    format: 'uint32',
    binCount: 300,
    options: {domain: [0, 299]}
  });
  testCase.deepEqual(
    global.counts,
    Array.from({length: 300}, (_, index) => Number(index % 2 === 0)),
    'the global atomic path ignores rejected and out-of-domain rows'
  );

  const automatic = await runMaskedHistogram({
    device,
    values: Float32Array.from([0, 5, 10]),
    mask: Uint32Array.from([0, 1, 0]),
    format: 'float32',
    binCount: 2,
    options: {domain: 'auto'}
  });
  testCase.deepEqual(
    automatic.counts,
    [0, 1],
    'automatic domains retain the full unfiltered input extent'
  );
  testCase.end();
});

test('GPUHistogram filters irregular literal and GPU-resident edges', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const local = await runMaskedHistogram({
    device,
    values: Float32Array.from([-1, 0, 0.5, 1, 9.5, 10, 100, 101, Number.NaN]),
    mask: Uint32Array.from([1, 1, 0, 1, 0, 1, 3, 1, 1]),
    format: 'float32',
    binCount: 3,
    options: {edges: [0, 1, 10, 100]}
  });
  testCase.deepEqual(
    local.counts,
    [1, 1, 2],
    'literal-edge local accumulation applies the source-aligned mask'
  );

  const globalValues = Uint32Array.from({length: 301}, (_, index) => index);
  const global = await runMaskedHistogram({
    device,
    values: globalValues,
    mask: Uint32Array.from(globalValues, value => Number(value % 3 === 0)),
    format: 'uint32',
    binCount: 300,
    options: {
      edges: Array.from({length: 301}, (_, index) => index),
      gpuEdges: true
    }
  });
  testCase.deepEqual(
    global.counts,
    Array.from({length: 300}, (_, index) => Number(index % 3 === 0 || index === 299)),
    'GPU-edge global accumulation includes only selected rows and the exact final edge'
  );
  testCase.deepEqual(
    global.nodeOrder,
    ['gpu-histogram-validate-edges', 'gpu-histogram-clear', 'gpu-histogram-edges-global'],
    'GPU edge validation remains upstream of masked global accumulation'
  );
  testCase.end();
});

test('GPUHistogram preserves source-aligned masked vector chunks', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const valueChunks = [
    Float32Array.from([0, 1]),
    new Float32Array(0),
    Float32Array.from([2, 3, 3])
  ];
  const maskChunks = [Uint32Array.from([1, 0]), new Uint32Array(0), Uint32Array.from([0, 1, 7])];
  const values = createVectorFixture(device, 'values', 'float32', valueChunks);
  const masks = createVectorFixture(device, 'masks', 'uint32', maskChunks);
  const outputBuffer = createOutputBuffer(device, 4);
  const graph = new GPUCommandGraph(device, {id: 'masked-vector-histogram'});
  const input = graph.importGPUVector('values', values.vector);
  const mask = graph.importGPUVector('masks', masks.vector);
  const output = importView(graph, 'counts', outputBuffer, 'uint32', 4);
  new GPUHistogram({input, mask, output, domain: [0, 3]}).addToGraph(graph);
  const compiled = graph.compile();

  submitGraph(device, compiled, 'masked-vector-histogram-initial');
  testCase.deepEqual(
    await readUint32(outputBuffer, 4),
    [1, 0, 0, 2],
    'each nonempty source chunk uses its matching mask chunk'
  );
  testCase.deepEqual(
    compiled.stats.nodeOrder,
    ['gpu-histogram-clear', 'gpu-histogram-chunk-0-local', 'gpu-histogram-chunk-2-local'],
    'empty aligned chunks retain their index without a dispatch'
  );
  testCase.equal(
    compiled.stats.logicalTransientBufferCount,
    0,
    'masked vector accumulation does not concatenate chunks or allocate scratch buffers'
  );

  masks.buffers[0].write(Uint32Array.from([0, 1]));
  masks.buffers[2].write(Uint32Array.from([1, 0, 0]));
  submitGraph(device, compiled, 'masked-vector-histogram-updated');
  testCase.deepEqual(
    await readUint32(outputBuffer, 4),
    [0, 1, 1, 0],
    'updating individual mask chunks changes one reusable graph encoding'
  );

  compiled.destroy();

  const irregularGraph = new GPUCommandGraph(device, {id: 'masked-irregular-vector-histogram'});
  const irregularInput = irregularGraph.importGPUVector('values', values.vector);
  const irregularMask = irregularGraph.importGPUVector('masks', masks.vector);
  const irregularOutput = importView(irregularGraph, 'counts', outputBuffer, 'uint32', 3);
  new GPUHistogram({
    input: irregularInput,
    mask: irregularMask,
    output: irregularOutput,
    edges: [0, 1, 3, 4]
  }).addToGraph(irregularGraph);
  const irregularCompiled = irregularGraph.compile();
  submitGraph(device, irregularCompiled, 'masked-irregular-vector-histogram');
  testCase.deepEqual(
    await readUint32(outputBuffer, 3),
    [0, 2, 0],
    'irregular-edge accumulation preserves the same updated mask chunk boundaries'
  );
  testCase.deepEqual(
    irregularCompiled.stats.nodeOrder,
    [
      'gpu-histogram-clear',
      'gpu-histogram-chunk-0-edges-local',
      'gpu-histogram-chunk-2-edges-local'
    ],
    'irregular-edge vector passes skip empty aligned chunks'
  );
  irregularCompiled.destroy();

  destroyVectorFixture(values);
  destroyVectorFixture(masks);
  outputBuffer.destroy();
  testCase.end();
});

test('GPUHistogram shares offset selection views across independently binned outputs', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const inputBuffer = createInputBuffer(device, Float32Array.from([0, 1, 2, 3]));
  const maskBuffer = createInputBuffer(device, Uint32Array.from([99, 0, 1, 0, 9, 99]));
  const regularOutputBuffer = createOutputBuffer(device, 4);
  const irregularOutputBuffer = createOutputBuffer(device, 3);
  const graph = new GPUCommandGraph(device, {id: 'offset-masked-histograms'});
  const input = importView(graph, 'values', inputBuffer, 'float32', 4);
  const maskHandle = graph.importBuffer(
    {id: 'mask', byteLength: maskBuffer.byteLength, usage: maskBuffer.usage},
    maskBuffer
  );
  const mask: GPUHistogramMask = graph.createDataView(maskHandle, {
    format: 'uint32',
    length: 4,
    byteOffset: Uint32Array.BYTES_PER_ELEMENT
  });
  const regularOutput = importView(graph, 'regular-counts', regularOutputBuffer, 'uint32', 4);
  const irregularOutput = importView(graph, 'irregular-counts', irregularOutputBuffer, 'uint32', 3);

  new GPUHistogram({
    id: 'offset-regular-histogram',
    input,
    mask,
    output: regularOutput,
    domain: [0, 3]
  }).addToGraph(graph);
  new GPUHistogram({
    id: 'offset-irregular-histogram',
    input,
    mask,
    output: irregularOutput,
    edges: [0, 1, 3, 4]
  }).addToGraph(graph);
  const compiled = graph.compile();
  submitGraph(device, compiled, 'offset-masked-histograms');

  testCase.deepEqual(
    await readUint32(regularOutputBuffer, 4),
    [0, 1, 0, 1],
    'equal-width accumulation reads from the logical selection byte offset'
  );
  testCase.deepEqual(
    await readUint32(irregularOutputBuffer, 3),
    [0, 1, 1],
    'irregular accumulation reuses the same offset GPU selection without readback'
  );

  compiled.destroy();
  inputBuffer.destroy();
  maskBuffer.destroy();
  regularOutputBuffer.destroy();
  irregularOutputBuffer.destroy();
  testCase.end();
});

test('GPUHistogram validates mask layout, topology, ownership, and aliases', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'masked-histogram-validation'});
  const inputBuffer = createInputBuffer(device, Float32Array.from([0, 1, 2, 3]));
  const maskBuffer = createInputBuffer(device, Uint32Array.from([1, 0, 1, 0]));
  const outputBuffer = createOutputBuffer(device, 4);
  const input = importView(graph, 'input', inputBuffer, 'float32', 4);
  const output = importView(graph, 'output', outputBuffer, 'uint32', 4);
  const maskHandle = graph.importBuffer(
    {id: 'mask', byteLength: maskBuffer.byteLength, usage: maskBuffer.usage},
    maskBuffer
  );
  const shortMask = graph.createDataView(maskHandle, {format: 'uint32', length: 3});
  const floatMask = graph.createDataView(maskHandle, {format: 'float32', length: 4});
  const stridedMask = graph.createDataView(maskHandle, {
    format: 'uint32',
    length: 2,
    byteStride: Uint32Array.BYTES_PER_ELEMENT * 2
  });
  const shortInput = graph.createDataView(input.buffer, {format: 'float32', length: 2});

  testCase.throws(
    () => new GPUHistogram({input, mask: shortMask, output, domain: [0, 3]}),
    /input and mask lengths must match/,
    'atomic masks require one selection row per input value'
  );
  testCase.throws(
    () => new GPUHistogram({input, mask: floatMask as never, output, domain: [0, 3]}),
    /must be packed, uint32-aligned uint32 GPU data/,
    'mask rows must use packed uint32 storage'
  );
  testCase.throws(
    () => new GPUHistogram({input: shortInput, mask: stridedMask, output, domain: [0, 3]}),
    /must be packed, uint32-aligned uint32 GPU data/,
    'interleaved selection rows cannot be consumed as packed histogram masks'
  );
  testCase.throws(
    () => new GPUHistogram({input, mask: output, output, domain: [0, 3]}),
    /mask and output must use separate buffers/,
    'selection masks cannot alias histogram counts'
  );

  const vectorValues = createVectorFixture(device, 'vector-values', 'float32', [
    Float32Array.from([0, 1]),
    Float32Array.from([2, 3])
  ]);
  const vectorMasks = createVectorFixture(device, 'vector-masks', 'uint32', [
    Uint32Array.from([1]),
    Uint32Array.from([0, 1, 0])
  ]);
  const vectorInput = graph.importGPUVector('vector-values', vectorValues.vector);
  const vectorMask = graph.importGPUVector('vector-masks', vectorMasks.vector);
  testCase.throws(
    () => new GPUHistogram({input: vectorInput, mask: shortMask, output, domain: [0, 3]}),
    /same view kind/,
    'vector input cannot use a single atomic mask view'
  );
  testCase.throws(
    () => new GPUHistogram({input: vectorInput, mask: vectorMask, output, domain: [0, 3]}),
    /same chunk topology/,
    'vector masks must preserve every source chunk boundary'
  );

  const foreignGraph = new GPUCommandGraph(device, {id: 'foreign-histogram-mask'});
  const foreignMask = importView(foreignGraph, 'foreign-mask', maskBuffer, 'uint32', 4);
  testCase.throws(
    () => new GPUHistogram({input, mask: foreignMask, output, domain: [0, 3]}).addToGraph(graph),
    /views must belong to the target graph/,
    'mask storage must belong to the encoded command graph'
  );

  destroyVectorFixture(vectorValues);
  destroyVectorFixture(vectorMasks);
  inputBuffer.destroy();
  maskBuffer.destroy();
  outputBuffer.destroy();
  testCase.end();
});

async function runMaskedHistogram(props: {
  device: Device;
  values: ScalarArray;
  mask: Uint32Array;
  updatedMask?: Uint32Array;
  format: ScalarFormat;
  binCount: number;
  options: HistogramOptions;
}): Promise<{counts: number[]; updatedCounts?: number[]; nodeOrder: string[]}> {
  const inputBuffer = createInputBuffer(props.device, props.values);
  const maskBuffer = createInputBuffer(props.device, props.mask);
  const outputBuffer = createOutputBuffer(props.device, props.binCount);
  const graph = new GPUCommandGraph(props.device, {id: 'masked-histogram'});
  const input = importView(graph, 'values', inputBuffer, props.format, props.values.length);
  const mask = importView(graph, 'mask', maskBuffer, 'uint32', props.mask.length);
  const output = importView(graph, 'counts', outputBuffer, 'uint32', props.binCount);
  let edgesBuffer: Buffer | undefined;

  if ('edges' in props.options) {
    let edges: readonly number[] | GraphDataView<ScalarFormat> = props.options.edges;
    if (props.options.gpuEdges) {
      const EdgeArray =
        props.format === 'uint32'
          ? Uint32Array
          : props.format === 'sint32'
            ? Int32Array
            : Float32Array;
      edgesBuffer = createInputBuffer(props.device, EdgeArray.from(props.options.edges));
      edges = importView(graph, 'edges', edgesBuffer, props.format, props.options.edges.length);
    }
    new GPUHistogram({input, mask, output, edges}).addToGraph(graph);
  } else {
    new GPUHistogram({input, mask, output, domain: props.options.domain}).addToGraph(graph);
  }

  const compiled = graph.compile();
  submitGraph(props.device, compiled, 'masked-histogram-initial');
  const counts = await readUint32(outputBuffer, props.binCount);
  let updatedCounts: number[] | undefined;
  if (props.updatedMask) {
    maskBuffer.write(props.updatedMask);
    submitGraph(props.device, compiled, 'masked-histogram-updated');
    updatedCounts = await readUint32(outputBuffer, props.binCount);
  }
  const nodeOrder = compiled.stats.nodeOrder;
  compiled.destroy();
  inputBuffer.destroy();
  maskBuffer.destroy();
  outputBuffer.destroy();
  edgesBuffer?.destroy();
  return {counts, updatedCounts, nodeOrder};
}

function createVectorFixture<T extends ScalarFormat>(
  device: Device,
  name: string,
  format: T,
  chunks: ScalarArray[]
): VectorFixture<T> {
  const buffers = chunks.map(chunk => createInputBuffer(device, chunk));
  return {
    vector: new GPUVector({
      type: 'data',
      name,
      format,
      data: chunks.map(
        (chunk, chunkIndex) =>
          new GPUData({
            buffer: buffers[chunkIndex],
            format,
            length: chunk.length,
            ownsBuffer: false
          })
      ),
      ownsData: false
    }),
    buffers
  };
}

function destroyVectorFixture<T extends ScalarFormat>(fixture: VectorFixture<T>): void {
  fixture.vector.destroy();
  for (const buffer of fixture.buffers) {
    buffer.destroy();
  }
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
): GraphDataView<T> {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length});
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

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}
