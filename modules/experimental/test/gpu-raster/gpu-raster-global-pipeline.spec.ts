// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {
  GPURasterGlobalHistogramMerge,
  GPURasterGlobalInitialize,
  GPURasterGlobalPercentile,
  GPURasterGlobalStatisticsMerge,
  GPURasterHistogram,
  GPURasterOtsuThreshold,
  GPURasterStatistics,
  type GPURasterBufferBand,
  type GPURasterGlobalAccumulator
} from '@luma.gl/experimental/gpu-raster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from '../../../../test/utils/vitest-tape';

type TiledFixture = {
  id: string;
  width: number;
  height: number;
  values: Float32Array;
  validity: Uint32Array;
  noDataValue: number;
  scale: number;
  offset: number;
};

type AccumulatorBuffers = {
  extent: Buffer;
  count: Buffer;
  sum: Buffer;
  histogram: Buffer;
  overflow: Buffer;
};

type GlobalOutputs = {
  extent: number[];
  count: number;
  sum: number;
  histogram: number[];
  overflow: number;
  percentile: number;
  percentileValidity: number;
  threshold: number;
  referenceExtent: number[];
  referenceCount: number;
  referenceSum: number;
  referenceHistogram: number[];
  referenceThreshold: number;
};

const TILED_FIXTURES: readonly TiledFixture[] = [
  {
    id: 'western-observations',
    width: 3,
    height: 2,
    values: Float32Array.from([-999, -6, 2, 5, Number.NaN, 4]),
    validity: Uint32Array.from([1, 1, 1, 0, 1, 1]),
    noDataValue: -999,
    scale: 0.5,
    offset: 1
  },
  {
    id: 'eastern-observations',
    width: 3,
    height: 2,
    values: Float32Array.from([10, -777, 18, 4, Number.POSITIVE_INFINITY, -2]),
    validity: Uint32Array.from([1, 1, 1, 1, 1, 0]),
    noDataValue: -777,
    scale: 0.25,
    offset: -1
  },
  {
    id: 'fully-obscured-observations',
    width: 3,
    height: 2,
    values: Float32Array.from([-222, Number.NaN, Number.POSITIVE_INFINITY, 6, 8, -222]),
    validity: Uint32Array.from([1, 1, 1, 0, 0, 1]),
    noDataValue: -222,
    scale: 3,
    offset: 10
  }
];

test('GPURaster global replay preserves calibrated monolithic statistics and Otsu under tile reordering', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const forward = await runGlobalAnalysis(device, [0, 1, 2]);
  const reverse = await runGlobalAnalysis(device, [2, 1, 0]);

  testCase.deepEqual(forward.extent, [-2, 3.5], 'masked calibrated tile extrema share one domain');
  testCase.equal(
    forward.count,
    6,
    'raw nodata, explicit masks, NaN, and infinity never contribute'
  );
  testCase.equal(forward.sum, 8, 'distinct per-tile calibrations apply exactly once');
  testCase.equal(forward.overflow, 0, 'ordinary tiled populations do not publish overflow');
  testCase.deepEqual(
    forward.histogram,
    makeExpectedHistogram([-2, 2, 3, 1.5, 3.5, 0], [-2, 3.5], 8),
    'replayed local partials merge only after the complete global extent is known'
  );
  testCase.deepEqual(
    forward.extent,
    forward.referenceExtent,
    'global extent matches one GPU raster'
  );
  testCase.equal(forward.count, forward.referenceCount, 'global count matches one GPU raster');
  testCase.equal(forward.sum, forward.referenceSum, 'global sum matches one GPU raster');
  testCase.deepEqual(
    forward.histogram,
    forward.referenceHistogram,
    'global replay matches monolithic GPU histogram bins exactly'
  );
  testCase.equal(
    forward.threshold,
    forward.referenceThreshold,
    'global Otsu consumes the same stable histogram/domain as monolithic analysis'
  );
  testCase.equal(forward.percentileValidity, 1, 'non-overflowed percentiles remain valid');
  testCase.ok(
    forward.percentile >= forward.extent[0]! && forward.percentile <= forward.extent[1]!,
    'global percentile remains inside its calibrated GPU domain'
  );
  testCase.deepEqual(
    reverse,
    forward,
    'reverse traversal, all-invalid tiles, and mixed nodata preserve global outputs'
  );
  testCase.end();
});

test('GPURaster merge-only re-encoding retains global history and saturates sticky overflow safely', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const buffers = makeAccumulatorBuffers(device, 'persistent-accumulator', 4);
  const initializer = new GPUCommandGraph(device, {id: 'explicit-global-reset'});
  new GPURasterGlobalInitialize({
    id: 'reset-global-accumulator',
    accumulator: importAccumulator(initializer, buffers)
  }).addToGraph(initializer);
  const compiledInitializer = initializer.compile();
  submitGraph(device, compiledInitializer, 'initialize-persistent-accumulator');

  const replay = new GPUCommandGraph(device, {id: 'replay-without-implicit-clear'});
  const ownedBuffers: Buffer[] = [];
  const accumulator = importAccumulator(replay, buffers);
  const source = makeBand(replay, device, ownedBuffers, {
    id: 'replayed-tile',
    width: 3,
    height: 1,
    values: Float32Array.from([2, 2, 2]),
    validity: Uint32Array.from([1, 1, 1]),
    noDataValue: -999,
    scale: 1,
    offset: 0
  });
  new GPURasterGlobalStatisticsMerge({
    id: 'merge-replayed-tile-statistics',
    width: 3,
    height: 1,
    input: source,
    accumulator
  }).addToGraph(replay);
  new GPURasterGlobalHistogramMerge({
    id: 'merge-replayed-tile-histogram',
    width: 3,
    height: 1,
    input: source,
    accumulator
  }).addToGraph(replay);
  const percentile = makeOutputView(
    replay,
    device,
    ownedBuffers,
    'replayed-percentile',
    'float32',
    1
  );
  const percentileValidity = makeOutputView(
    replay,
    device,
    ownedBuffers,
    'replayed-percentile-validity',
    'uint32',
    1
  );
  new GPURasterGlobalPercentile({
    id: 'reject-overflowed-percentile',
    accumulator,
    percentile: 0.5,
    output: percentile,
    outputValidity: percentileValidity
  }).addToGraph(replay);
  const compiledReplay = replay.compile();

  submitGraph(device, compiledReplay, 'first-replay');
  testCase.equal((await readUnsigned(buffers.count))[0], 3, 'first replay publishes three samples');
  testCase.deepEqual(
    await readUnsigned(buffers.histogram),
    [3, 0, 0, 0],
    'equal-valued samples occupy the first stable-domain bin'
  );

  submitGraph(device, compiledReplay, 'second-replay');
  testCase.equal(
    (await readUnsigned(buffers.count))[0],
    6,
    're-encoding a merge-only graph retains previously merged population'
  );
  testCase.deepEqual(
    await readUnsigned(buffers.histogram),
    [6, 0, 0, 0],
    'only per-tile scratch is cleared; persistent histogram bins remain cumulative'
  );

  buffers.count.write(Uint32Array.from([0xfffffffe]));
  buffers.histogram.write(Uint32Array.from([0xfffffffe, 0, 0, 0]));
  buffers.overflow.write(Uint32Array.from([0]));
  submitGraph(device, compiledReplay, 'overflowing-replay');

  testCase.equal(
    (await readUnsigned(buffers.count))[0],
    0xffffffff,
    'global population saturates instead of wrapping beyond uint32'
  );
  testCase.equal(
    (await readUnsigned(buffers.histogram))[0],
    0xffffffff,
    'global histogram bins saturate instead of silently wrapping'
  );
  testCase.equal(
    (await readUnsigned(buffers.overflow))[0]! & 0b11,
    0b11,
    'count and histogram saturation publish independently sticky overflow bits'
  );
  testCase.equal(
    (await readViewUnsigned(percentileValidity, ownedBuffers))[0],
    0,
    'overflowed global populations cannot produce a falsely precise percentile'
  );
  testCase.ok(
    Number.isNaN((await readViewFloat(percentile, ownedBuffers))[0]),
    'overflowed percentile values publish an explicit invalid floating result'
  );

  submitGraph(device, compiledInitializer, 'explicit-global-reinitialization');
  testCase.equal((await readUnsigned(buffers.count))[0], 0, 'only explicit reset clears totals');
  testCase.deepEqual(
    await readUnsigned(buffers.histogram),
    [0, 0, 0, 0],
    'explicit reset clears all caller-owned global histogram bins'
  );
  testCase.equal(
    (await readUnsigned(buffers.overflow))[0],
    0,
    'explicit reset clears sticky flags'
  );

  compiledReplay.destroy();
  compiledInitializer.destroy();
  for (const buffer of [...Object.values(buffers), ...ownedBuffers]) {
    testCase.notOk(buffer.destroyed, 'compiled graphs never own borrowed persistent storage');
    buffer.destroy();
  }
  testCase.end();
});

async function runGlobalAnalysis(device: Device, order: readonly number[]): Promise<GlobalOutputs> {
  const graph = new GPUCommandGraph(device, {id: `global-order-${order.join('-')}`});
  const ownedBuffers: Buffer[] = [];
  const accumulatorBuffers = makeAccumulatorBuffers(device, `global-${order.join('-')}`, 8);
  const accumulator = importAccumulator(graph, accumulatorBuffers);
  new GPURasterGlobalInitialize({id: 'initialize-global-analysis', accumulator}).addToGraph(graph);

  const sources = order.map(index => {
    const fixture = TILED_FIXTURES[index]!;
    return {fixture, band: makeBand(graph, device, ownedBuffers, fixture)};
  });

  for (const {fixture, band} of sources) {
    new GPURasterGlobalStatisticsMerge({
      id: `${fixture.id}-global-statistics`,
      width: fixture.width,
      height: fixture.height,
      input: band,
      accumulator
    }).addToGraph(graph);
  }
  for (const {fixture, band} of sources) {
    new GPURasterGlobalHistogramMerge({
      id: `${fixture.id}-global-histogram`,
      width: fixture.width,
      height: fixture.height,
      input: band,
      accumulator
    }).addToGraph(graph);
  }

  const percentile = makeOutputView(graph, device, ownedBuffers, 'global-percentile', 'float32', 1);
  const percentileValidity = makeOutputView(
    graph,
    device,
    ownedBuffers,
    'global-percentile-validity',
    'uint32',
    1
  );
  new GPURasterGlobalPercentile({
    id: 'global-median',
    accumulator,
    percentile: 0.5,
    output: percentile,
    outputValidity: percentileValidity
  }).addToGraph(graph);

  const threshold = makeOutputView(graph, device, ownedBuffers, 'global-otsu', 'float32', 1);
  new GPURasterOtsuThreshold({
    id: 'global-otsu-selection',
    histogram: accumulator.histogram,
    domain: accumulator.extent,
    output: threshold
  }).addToGraph(graph);

  const reference = makeMonolithicReference(graph, device, ownedBuffers);
  const compiled = graph.compile();
  submitGraph(device, compiled, `submit-global-order-${order.join('-')}`);

  const result: GlobalOutputs = {
    extent: await readFloat(accumulatorBuffers.extent),
    count: (await readUnsigned(accumulatorBuffers.count))[0]!,
    sum: (await readFloat(accumulatorBuffers.sum))[0]!,
    histogram: await readUnsigned(accumulatorBuffers.histogram),
    overflow: (await readUnsigned(accumulatorBuffers.overflow))[0]!,
    percentile: (await readViewFloat(percentile, ownedBuffers))[0]!,
    percentileValidity: (await readViewUnsigned(percentileValidity, ownedBuffers))[0]!,
    threshold: (await readViewFloat(threshold, ownedBuffers))[0]!,
    referenceExtent: await readViewFloat(reference.extent, ownedBuffers),
    referenceCount: (await readViewUnsigned(reference.count, ownedBuffers))[0]!,
    referenceSum: (await readViewFloat(reference.sum, ownedBuffers))[0]!,
    referenceHistogram: await readViewUnsigned(reference.histogram, ownedBuffers),
    referenceThreshold: (await readViewFloat(reference.threshold, ownedBuffers))[0]!
  };

  compiled.destroy();
  for (const buffer of [...Object.values(accumulatorBuffers), ...ownedBuffers]) buffer.destroy();
  return result;
}

function makeMonolithicReference(
  graph: GPUCommandGraph,
  device: Device,
  ownedBuffers: Buffer[]
): {
  extent: GraphDataView<'float32'>;
  count: GraphDataView<'uint32'>;
  sum: GraphDataView<'float32'>;
  histogram: GraphDataView<'uint32'>;
  threshold: GraphDataView<'float32'>;
} {
  const values: number[] = [];
  const validity: number[] = [];
  for (const fixture of TILED_FIXTURES) {
    for (let index = 0; index < fixture.values.length; index++) {
      const sample = fixture.values[index]!;
      const valid =
        fixture.validity[index] !== 0 && sample !== fixture.noDataValue && Number.isFinite(sample);
      values.push(valid ? sample * fixture.scale + fixture.offset : 0);
      validity.push(Number(valid));
    }
  }
  const source = makeBand(graph, device, ownedBuffers, {
    id: 'monolithic-calibrated-reference',
    width: values.length,
    height: 1,
    values: Float32Array.from(values),
    validity: Uint32Array.from(validity),
    noDataValue: -999999,
    scale: 1,
    offset: 0
  });
  const count = makeOutputView(graph, device, ownedBuffers, 'reference-count', 'uint32', 1);
  const sum = makeOutputView(graph, device, ownedBuffers, 'reference-sum', 'float32', 1);
  const mean = makeOutputView(graph, device, ownedBuffers, 'reference-mean', 'float32', 1);
  const extent = makeOutputView(graph, device, ownedBuffers, 'reference-extent', 'float32', 2);
  const histogram = makeOutputView(graph, device, ownedBuffers, 'reference-histogram', 'uint32', 8);
  const threshold = makeOutputView(graph, device, ownedBuffers, 'reference-otsu', 'float32', 1);

  new GPURasterStatistics({
    id: 'monolithic-reference-statistics',
    width: values.length,
    height: 1,
    input: source,
    count,
    sum,
    mean,
    extent
  }).addToGraph(graph);
  new GPURasterHistogram({
    id: 'monolithic-reference-histogram',
    input: source,
    output: histogram,
    domain: extent
  }).addToGraph(graph);
  new GPURasterOtsuThreshold({
    id: 'monolithic-reference-otsu',
    histogram,
    domain: extent,
    output: threshold
  }).addToGraph(graph);

  return {extent, count, sum, histogram, threshold};
}

function makeBand(
  graph: GPUCommandGraph,
  device: Device,
  ownedBuffers: Buffer[],
  fixture: TiledFixture
): GPURasterBufferBand<'float32'> {
  return {
    id: fixture.id,
    format: 'float32',
    storage: {
      kind: 'buffer',
      values: makeInputView(
        graph,
        device,
        ownedBuffers,
        `${fixture.id}-values`,
        'float32',
        fixture.values
      )
    },
    validity: makeInputView(
      graph,
      device,
      ownedBuffers,
      `${fixture.id}-validity`,
      'uint32',
      fixture.validity
    ),
    noDataValue: fixture.noDataValue,
    scale: fixture.scale,
    offset: fixture.offset
  };
}

function makeAccumulatorBuffers(device: Device, id: string, binCount: number): AccumulatorBuffers {
  return {
    extent: makePersistentBuffer(device, `${id}-extent`, 2),
    count: makePersistentBuffer(device, `${id}-count`, 1),
    sum: makePersistentBuffer(device, `${id}-sum`, 1),
    histogram: makePersistentBuffer(device, `${id}-histogram`, binCount),
    overflow: makePersistentBuffer(device, `${id}-overflow`, 1)
  };
}

function makePersistentBuffer(device: Device, id: string, length: number): Buffer {
  return device.createBuffer({
    id,
    byteLength: length * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
}

function importAccumulator(
  graph: GPUCommandGraph,
  buffers: AccumulatorBuffers
): GPURasterGlobalAccumulator {
  return {
    extent: importBuffer(graph, buffers.extent, 'float32', 2),
    count: importBuffer(graph, buffers.count, 'uint32', 1),
    sum: importBuffer(graph, buffers.sum, 'float32', 1),
    histogram: importBuffer(
      graph,
      buffers.histogram,
      'uint32',
      buffers.histogram.byteLength / Uint32Array.BYTES_PER_ELEMENT
    ),
    overflow: importBuffer(graph, buffers.overflow, 'uint32', 1)
  };
}

function makeInputView<Format extends 'float32' | 'uint32'>(
  graph: GPUCommandGraph,
  device: Device,
  ownedBuffers: Buffer[],
  id: string,
  format: Format,
  data: Float32Array | Uint32Array
): GraphDataView<Format> {
  const buffer = device.createBuffer({id, data, usage: Buffer.STORAGE | Buffer.COPY_DST});
  ownedBuffers.push(buffer);
  return importBuffer(graph, buffer, format, data.length);
}

function makeOutputView<Format extends 'float32' | 'uint32'>(
  graph: GPUCommandGraph,
  device: Device,
  ownedBuffers: Buffer[],
  id: string,
  format: Format,
  length: number
): GraphDataView<Format> {
  const buffer = makePersistentBuffer(device, id, length);
  ownedBuffers.push(buffer);
  return importBuffer(graph, buffer, format, length);
}

function importBuffer<Format extends 'float32' | 'uint32'>(
  graph: GPUCommandGraph,
  buffer: Buffer,
  format: Format,
  length: number
): GraphDataView<Format> {
  const handle = graph.importBuffer(
    {id: buffer.id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length});
}

async function readUnsigned(buffer: Buffer): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
}

async function readFloat(buffer: Buffer): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
}

async function readViewUnsigned(
  view: GraphDataView<'uint32'>,
  buffers: readonly Buffer[]
): Promise<number[]> {
  const buffer = buffers.find(candidate => candidate.id === view.buffer.id);
  if (!buffer) throw new Error(`Missing caller-owned global count ${view.buffer.id}`);
  return await readUnsigned(buffer);
}

async function readViewFloat(
  view: GraphDataView<'float32'>,
  buffers: readonly Buffer[]
): Promise<number[]> {
  const buffer = buffers.find(candidate => candidate.id === view.buffer.id);
  if (!buffer) throw new Error(`Missing caller-owned global value ${view.buffer.id}`);
  return await readFloat(buffer);
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

function makeExpectedHistogram(
  values: readonly number[],
  domain: readonly [number, number],
  binCount: number
): number[] {
  const bins = Array.from({length: binCount}, () => 0);
  for (const value of values) {
    const index =
      domain[0] === domain[1]
        ? 0
        : Math.min(
            Math.floor(((value - domain[0]) / (domain[1] - domain[0])) * binCount),
            binCount - 1
          );
    bins[index] = bins[index]! + 1;
  }
  return bins;
}
