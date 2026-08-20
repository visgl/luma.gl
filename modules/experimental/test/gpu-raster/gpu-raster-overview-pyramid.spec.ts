// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {
  GPURasterCategoricalOverview,
  GPURasterOverview,
  makeRasterOverviewMetadata,
  type GPURasterBufferBand,
  type GPURasterMetadata,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/gpu-raster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from '../../../../test/utils/vitest-tape';

type FloatOverviewOutputs = {
  values: GraphDataView<'float32'>;
  validity: GraphDataView<'uint32'>;
  sum: GraphDataView<'float32'>;
  count: GraphDataView<'uint32'>;
};

const PYRAMID_METADATA: GPURasterMetadata = {
  width: 5,
  height: 7,
  affine: [2, 0.25, 552400, -0.5, -3, 4187600],
  pixelInterpretation: 'area',
  coordinateReferenceSystem: {authority: 'EPSG:32610'},
  levelZeroOrigin: [0, 0],
  level: 0
};

test('GPURaster analytical pyramids merge uneven masked coverage instead of averaging overview means', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'weighted-ragged-overview-pyramid'});
  const ownedBuffers: Buffer[] = [];
  const values = Float32Array.from(
    Array.from({length: 35}, (_, index) => (index % 5) * 11 + Math.floor(index / 5) * 3)
  );
  values[3] = Number.NaN;
  values[12] = -999;
  values[23] = Number.POSITIVE_INFINITY;
  const validity = Uint32Array.from(Array.from({length: 35}, () => 1));
  validity[1] = 0;
  validity[7] = 0;
  validity[29] = 0;
  const source = makeFloatSource(graph, device, ownedBuffers, 'source', values, validity, {
    scale: 0.5,
    offset: 2,
    noDataValue: -999
  });
  const firstOutputs = makeFloatOutputs(graph, device, ownedBuffers, 'first', 9);
  const first = new GPURasterOverview({
    id: 'overview-2x3',
    metadata: PYRAMID_METADATA,
    scale: [2, 3],
    input: source,
    output: firstOutputs.values,
    outputValidity: firstOutputs.validity,
    sum: firstOutputs.sum,
    validCount: firstOutputs.count
  });
  first.addToGraph(graph);

  const aggregatedSource: GPURasterBufferBand<'float32'> = {
    id: 'first-level-means',
    format: 'float32',
    storage: {kind: 'buffer', values: firstOutputs.values},
    validity: firstOutputs.validity
  };
  const chainedOutputs = makeFloatOutputs(graph, device, ownedBuffers, 'chained', 4);
  new GPURasterOverview({
    id: 'overview-weighted-4x6',
    metadata: first.metadata,
    scale: 2,
    input: aggregatedSource,
    inputSum: firstOutputs.sum,
    inputValidCount: firstOutputs.count,
    maximumInputValidCount: 6,
    output: chainedOutputs.values,
    outputValidity: chainedOutputs.validity,
    sum: chainedOutputs.sum,
    validCount: chainedOutputs.count
  }).addToGraph(graph);

  const directOutputs = makeFloatOutputs(graph, device, ownedBuffers, 'direct', 4);
  new GPURasterOverview({
    id: 'overview-direct-4x6',
    metadata: PYRAMID_METADATA,
    scale: [4, 6],
    input: source,
    output: directOutputs.values,
    outputValidity: directOutputs.validity,
    sum: directOutputs.sum,
    validCount: directOutputs.count
  }).addToGraph(graph);

  const compiled = graph.compile();
  testCase.ok(
    compiled.stats.nodeOrder.indexOf('overview-2x3') <
      compiled.stats.nodeOrder.indexOf('overview-weighted-4x6'),
    'graph hazards order child sums and valid counts before parent aggregation'
  );
  submitGraph(device, compiled, 'submit-weighted-overview-pyramid');

  const directValues = await readFloat(directOutputs.values, ownedBuffers);
  const weightedValues = await readFloat(chainedOutputs.values, ownedBuffers);
  const directSums = await readFloat(directOutputs.sum, ownedBuffers);
  const weightedSums = await readFloat(chainedOutputs.sum, ownedBuffers);
  const directCounts = await readUnsigned(directOutputs.count, ownedBuffers);
  const weightedCounts = await readUnsigned(chainedOutputs.count, ownedBuffers);
  testCase.deepEqual(
    Array.from(weightedCounts),
    Array.from(directCounts),
    'chained levels preserve exact unequal source coverage and odd boundary footprints'
  );
  assertApproximateArray(
    testCase,
    weightedSums,
    directSums,
    'weighted sums match direct reduction'
  );
  assertApproximateArray(
    testCase,
    weightedValues,
    directValues,
    'weighted means match direct 4×6 aggregation rather than averaging child means'
  );
  testCase.deepEqual(
    Array.from(await readUnsigned(chainedOutputs.validity, ownedBuffers)),
    Array.from(await readUnsigned(directOutputs.validity, ownedBuffers)),
    'invalid parent coverage remains separate from aggregate sample values'
  );
  testCase.deepEqual(
    first.metadata.affine,
    [4, 0.75, 552400, -1, -9, 4187600],
    'anisotropic child metadata preserves affine rotation, shear, and origin'
  );
  testCase.deepEqual(
    makeRasterOverviewMetadata(first.metadata, 2).affine,
    [8, 1.5, 552400, -2, -18, 4187600],
    'chained overview transforms retain the same world coordinate frame'
  );

  compiled.destroy();
  for (const buffer of ownedBuffers) buffer.destroy();
  testCase.end();
});

test('GPURaster categorical overview policies preserve exact labels and expose valid alternatives', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'categorical-overview-policy-composition'});
  const ownedBuffers: Buffer[] = [];
  const labels = Uint32Array.from([
    16777217, 16777218, 9, 9, 16777218, 16777218, 7, 9, 42, 42, 4294967295, 11, 24, 42, 11, 12
  ]);
  const validity = Uint32Array.from([0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  const metadata: GPURasterMetadata = {
    width: 4,
    height: 4,
    affine: [1, 0, 0, 0, 1, 0],
    pixelInterpretation: 'point',
    level: 0,
    levelZeroOrigin: [0, 0]
  };
  const labelValues = makeInputView(
    graph,
    device,
    ownedBuffers,
    'category-source',
    'uint32',
    labels
  );
  const labelValidity = makeInputView(
    graph,
    device,
    ownedBuffers,
    'category-source-validity',
    'uint32',
    validity
  );
  const input: GPURasterBufferBand<'uint32'> = {
    id: 'land-cover',
    format: 'uint32',
    storage: {kind: 'buffer', values: labelValues},
    validity: labelValidity,
    noDataValue: 4294967295
  };
  const nearestValues = makeOutputView(graph, device, ownedBuffers, 'nearest-values', 'uint32', 4);
  const nearestValidity = makeOutputView(
    graph,
    device,
    ownedBuffers,
    'nearest-validity',
    'uint32',
    4
  );
  const nearestCount = makeOutputView(graph, device, ownedBuffers, 'nearest-count', 'uint32', 4);
  const modeValues = makeOutputView(graph, device, ownedBuffers, 'mode-values', 'uint32', 4);
  const modeValidity = makeOutputView(graph, device, ownedBuffers, 'mode-validity', 'uint32', 4);
  const modeCount = makeOutputView(graph, device, ownedBuffers, 'mode-count', 'uint32', 4);

  new GPURasterCategoricalOverview({
    id: 'exact-nearest-categories',
    metadata,
    scale: 2,
    input,
    policy: 'nearest',
    output: nearestValues,
    outputValidity: nearestValidity,
    validCount: nearestCount
  }).addToGraph(graph);
  new GPURasterCategoricalOverview({
    id: 'exact-mode-categories',
    metadata,
    scale: 2,
    input,
    policy: 'mode',
    output: modeValues,
    outputValidity: modeValidity,
    validCount: modeCount
  }).addToGraph(graph);

  const compiled = graph.compile();
  submitGraph(device, compiled, 'submit-categorical-policy-comparison');
  testCase.deepEqual(
    Array.from(await readUnsigned(nearestValues, ownedBuffers)),
    [0, 9, 42, 0],
    'nearest preserves invalid center/nodata while retaining exact valid integer categories'
  );
  testCase.deepEqual(
    Array.from(await readUnsigned(nearestValidity, ownedBuffers)),
    [0, 1, 1, 0],
    'nearest validity describes the selected sample rather than any valid alternative'
  );
  testCase.deepEqual(
    Array.from(await readUnsigned(modeValues, ownedBuffers)),
    [16777218, 9, 42, 11],
    'mode keeps labels above float32 precision and resolves ties to the smallest native label'
  );
  testCase.deepEqual(Array.from(await readUnsigned(modeValidity, ownedBuffers)), [1, 1, 1, 1]);
  testCase.deepEqual(
    Array.from(await readUnsigned(nearestCount, ownedBuffers)),
    [3, 4, 4, 3],
    'coverage counts all valid alternatives even when the nearest selected sample is invalid'
  );
  testCase.deepEqual(
    Array.from(await readUnsigned(modeCount, ownedBuffers)),
    [3, 4, 4, 3],
    'mode shares the same exact valid footprint population'
  );

  compiled.destroy();
  for (const buffer of ownedBuffers) buffer.destroy();
  testCase.end();
});

function makeFloatSource(
  graph: GPUCommandGraph,
  device: Device,
  ownedBuffers: Buffer[],
  id: string,
  samples: Float32Array,
  validity: Uint32Array,
  metadata: {scale: number; offset: number; noDataValue: number}
): GPURasterBufferBand<'float32'> {
  return {
    id,
    format: 'float32',
    storage: {
      kind: 'buffer',
      values: makeInputView(graph, device, ownedBuffers, `${id}-values`, 'float32', samples)
    },
    validity: makeInputView(graph, device, ownedBuffers, `${id}-validity`, 'uint32', validity),
    ...metadata
  };
}

function makeFloatOutputs(
  graph: GPUCommandGraph,
  device: Device,
  ownedBuffers: Buffer[],
  id: string,
  length: number
): FloatOverviewOutputs {
  return {
    values: makeOutputView(graph, device, ownedBuffers, `${id}-values`, 'float32', length),
    validity: makeOutputView(graph, device, ownedBuffers, `${id}-validity`, 'uint32', length),
    sum: makeOutputView(graph, device, ownedBuffers, `${id}-sum`, 'float32', length),
    count: makeOutputView(graph, device, ownedBuffers, `${id}-count`, 'uint32', length)
  };
}

function makeInputView<Format extends GPURasterScalarFormat>(
  graph: GPUCommandGraph,
  device: Device,
  ownedBuffers: Buffer[],
  id: string,
  format: Format,
  data: Float32Array | Uint32Array
): GraphDataView<Format> {
  const buffer = device.createBuffer({id, data, usage: Buffer.STORAGE | Buffer.COPY_DST});
  ownedBuffers.push(buffer);
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length: data.length});
}

function makeOutputView<Format extends GPURasterScalarFormat>(
  graph: GPUCommandGraph,
  device: Device,
  ownedBuffers: Buffer[],
  id: string,
  format: Format,
  length: number
): GraphDataView<Format> {
  const buffer = device.createBuffer({
    id,
    byteLength: length * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  ownedBuffers.push(buffer);
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length});
}

async function readFloat(
  view: GraphDataView<'float32'>,
  ownedBuffers: readonly Buffer[]
): Promise<Float32Array> {
  const buffer = ownedBuffers.find(candidate => candidate.id === view.buffer.id);
  if (!buffer) throw new Error(`Missing caller-owned float output ${view.buffer.id}`);
  const bytes = await buffer.readAsync();
  return Float32Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, view.length));
}

async function readUnsigned(
  view: GraphDataView<'uint32'>,
  ownedBuffers: readonly Buffer[]
): Promise<Uint32Array> {
  const buffer = ownedBuffers.find(candidate => candidate.id === view.buffer.id);
  if (!buffer) throw new Error(`Missing caller-owned count output ${view.buffer.id}`);
  const bytes = await buffer.readAsync();
  return Uint32Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, view.length));
}

function submitGraph(
  device: Device,
  graph: ReturnType<GPUCommandGraph['compile']>,
  id: string
): void {
  const encoder = device.createCommandEncoder({id});
  graph.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
}

function assertApproximateArray(
  testCase: Test,
  actual: Float32Array,
  expected: Float32Array,
  label: string
): void {
  testCase.equal(actual.length, expected.length, `${label}: equal pixel counts`);
  for (let index = 0; index < actual.length; index++) {
    if (Number.isNaN(expected[index])) {
      testCase.ok(Number.isNaN(actual[index]), `${label}: invalid parent ${index}`);
    } else {
      testCase.ok(
        Math.abs(actual[index]! - expected[index]!) < 0.0001,
        `${label}: parent ${index}`
      );
    }
  }
}
