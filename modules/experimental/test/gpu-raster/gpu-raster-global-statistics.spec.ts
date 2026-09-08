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
  type GPURasterBufferBand,
  type GPURasterGlobalAccumulator
} from '@luma.gl/experimental/gpu-raster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';

type GlobalFormat = 'float32' | 'uint32';
type GlobalSamples = Float32Array | Uint32Array;

type GuardedGlobalBuffer = {
  buffer: Buffer;
  format: GlobalFormat;
  length: number;
  prefixLength: number;
};

type GuardedAccumulator = {
  extent: GuardedGlobalBuffer;
  count: GuardedGlobalBuffer;
  sum: GuardedGlobalBuffer;
  histogram: GuardedGlobalBuffer;
  overflow: GuardedGlobalBuffer;
};

it('GPURaster global replay preserves offset guards, empty neutrality, and exact percentile endpoints', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const owned: GuardedGlobalBuffer[] = [];
  const persistent = makeAccumulator(device, owned, 4);
  const graph = new GPUCommandGraph(device, {id: 'offset-backed-global-replay'});
  const accumulator = importAccumulator(graph, persistent);
  new GPURasterGlobalInitialize({id: 'initialize-offset-backed-global', accumulator}).addToGraph(
    graph
  );

  const invalid = makeBand(
    graph,
    device,
    owned,
    'invalid-tile',
    [-999, Number.NaN, Number.POSITIVE_INFINITY],
    [1, 1, 1]
  );
  const valid = makeBand(
    graph,
    device,
    owned,
    'valid-tile',
    [-999, 1, 5, Number.NaN, Number.POSITIVE_INFINITY, 9],
    [1, 1, 1, 1, 1, 0],
    2,
    1
  );
  for (const input of [invalid, valid]) {
    new GPURasterGlobalStatisticsMerge({
      id: `${input.id}-statistics`,
      width: input.storage.values.length,
      height: 1,
      input,
      accumulator
    }).addToGraph(graph);
  }
  for (const input of [invalid, valid]) {
    new GPURasterGlobalHistogramMerge({
      id: `${input.id}-replay`,
      width: input.storage.values.length,
      height: 1,
      input,
      accumulator
    }).addToGraph(graph);
  }

  const percentiles = [0, 0.5, 1].map(percentile => {
    const output = makeGuardedBuffer(device, owned, `percentile-${percentile}`, 'float32', 1, 2);
    const outputValidity = makeGuardedBuffer(
      device,
      owned,
      `percentile-${percentile}-validity`,
      'uint32',
      1,
      3
    );
    new GPURasterGlobalPercentile({
      id: `global-percentile-${percentile}`,
      accumulator,
      percentile,
      output: importView(graph, output, 'float32'),
      outputValidity: importView(graph, outputValidity, 'uint32')
    }).addToGraph(graph);
    return {percentile, output, outputValidity};
  });

  const compiled = graph.compile();
  submitGraph(device, compiled, 'submit-offset-backed-global');

  expect(
    await readGuarded(persistent.extent),
    'first valid tile replaces finite empty extrema without touching neighboring bytes'
  ).toEqual([floatGuard(), floatGuard(), 3, 11, floatGuard()]);
  expect(
    await readGuarded(persistent.count),
    'only finite, unmasked, raw non-nodata observations contribute'
  ).toEqual([unsignedGuard(), 2, unsignedGuard()]);
  expect(
    await readGuarded(persistent.sum),
    'per-tile calibration contributes once and preserves offset-backed sum guards'
  ).toEqual([floatGuard(), floatGuard(), floatGuard(), 14, floatGuard()]);
  expect(
    await readGuarded(persistent.histogram),
    'replay bins calibrated observations against the final GPU-resident domain'
  ).toEqual([unsignedGuard(), unsignedGuard(), 1, 0, 0, 1, unsignedGuard()]);
  expect(
    await readGuarded(persistent.overflow),
    'ordinary graph-only replay leaves sticky overflow clear'
  ).toEqual([unsignedGuard(), 0, unsignedGuard()]);
  for (const result of percentiles) {
    const expected = result.percentile === 0 ? 3 : result.percentile === 1 ? 11 : 4;
    expect(
      (await readLogical(result.output))[0],
      'zero and one are exact extrema while interior estimates select bin centers'
    ).toBe(expected);
    expect(
      await readGuarded(result.outputValidity),
      'valid percentile flags respect their logical byte offset'
    ).toEqual([unsignedGuard(), unsignedGuard(), unsignedGuard(), 1, unsignedGuard()]);
  }

  const empty = new GPUCommandGraph(device, {id: 'empty-global-replay'});
  const emptyAccumulator = importAccumulator(empty, persistent);
  new GPURasterGlobalInitialize({accumulator: emptyAccumulator}).addToGraph(empty);
  const emptyBand = makeBand(empty, device, owned, 'empty-tile', [-999, Number.NaN, 3], [1, 1, 0]);
  new GPURasterGlobalStatisticsMerge({
    width: 3,
    height: 1,
    input: emptyBand,
    accumulator: emptyAccumulator
  }).addToGraph(empty);
  new GPURasterGlobalHistogramMerge({
    width: 3,
    height: 1,
    input: emptyBand,
    accumulator: emptyAccumulator
  }).addToGraph(empty);
  const invalidOutput = makeGuardedBuffer(device, owned, 'empty-percentile', 'float32', 1, 1);
  const invalidValidity = makeGuardedBuffer(
    device,
    owned,
    'empty-percentile-validity',
    'uint32',
    1,
    2
  );
  new GPURasterGlobalPercentile({
    accumulator: emptyAccumulator,
    percentile: 0.5,
    output: importView(empty, invalidOutput, 'float32'),
    outputValidity: importView(empty, invalidValidity, 'uint32')
  }).addToGraph(empty);
  const compiledEmpty = empty.compile();
  submitGraph(device, compiledEmpty, 'submit-empty-global');

  expect(
    await readLogical(persistent.extent),
    'all-invalid datasets preserve a finite neutral domain'
  ).toEqual([0, 0]);
  expect(
    await readLogical(persistent.histogram),
    'all-invalid replay never manufactures a histogram observation'
  ).toEqual([0, 0, 0, 0]);
  expect(
    (await readLogical(persistent.count))[0],
    'all-invalid tiles preserve an empty global population'
  ).toBe(0);
  expect(
    Boolean(Number.isNaN((await readLogical(invalidOutput))[0])),
    'empty percentiles publish an explicit floating invalid result'
  ).toBe(true);
  expect((await readLogical(invalidValidity))[0], 'empty percentiles publish zero validity').toBe(
    0
  );

  compiledEmpty.destroy();
  compiled.destroy();
  for (const {buffer} of owned) {
    expect(
      Boolean(buffer.destroyed),
      'graph destruction preserves caller-owned offset-backed storage'
    ).toBe(false);
    buffer.destroy();
  }
  void 0;
});

it('GPURaster global merges preserve independent sum/count/bin overflow flags and atomic saturation', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const owned: GuardedGlobalBuffer[] = [];
  const persistent = makeAccumulator(device, owned, 4);
  const resetGraph = new GPUCommandGraph(device, {id: 'separate-global-reset'});
  new GPURasterGlobalInitialize({
    accumulator: importAccumulator(resetGraph, persistent)
  }).addToGraph(resetGraph);
  const compiledReset = resetGraph.compile();
  submitGraph(device, compiledReset, 'initialize-overflow-contract');

  const previousSum = Math.fround(3e38);
  writeLogical(persistent.extent, [0, previousSum]);
  writeLogical(persistent.count, [1]);
  writeLogical(persistent.sum, [previousSum]);

  const sumGraph = new GPUCommandGraph(device, {id: 'global-floating-sum-overflow'});
  const sumAccumulator = importAccumulator(sumGraph, persistent);
  const largeBand = makeBand(sumGraph, device, owned, 'large-finite-sample', [1e38], [1]);
  new GPURasterGlobalStatisticsMerge({
    width: 1,
    height: 1,
    input: largeBand,
    accumulator: sumAccumulator
  }).addToGraph(sumGraph);
  const sumOutput = makeGuardedBuffer(device, owned, 'sum-overflow-percentile', 'float32', 1, 1);
  const sumValidity = makeGuardedBuffer(device, owned, 'sum-overflow-validity', 'uint32', 1, 1);
  new GPURasterGlobalPercentile({
    accumulator: sumAccumulator,
    percentile: 0.5,
    output: importView(sumGraph, sumOutput, 'float32'),
    outputValidity: importView(sumGraph, sumValidity, 'uint32')
  }).addToGraph(sumGraph);
  const compiledSum = sumGraph.compile();
  submitGraph(device, compiledSum, 'submit-floating-sum-overflow');

  expect(
    (await readLogical(persistent.overflow))[0],
    'a nonfinite floating sum publishes its independent sticky bit'
  ).toBe(4);
  expect(
    (await readLogical(persistent.sum))[0],
    'floating overflow retains the last finite caller-owned sum'
  ).toBe(previousSum);
  expect(
    (await readLogical(persistent.count))[0],
    'floating overflow does not silently corrupt the exact valid population'
  ).toBe(2);
  expect(
    (await readLogical(sumValidity))[0],
    'a floating overflow invalidates downstream percentile results'
  ).toBe(0);
  expect(
    Boolean(Number.isNaN((await readLogical(sumOutput))[0])),
    'floating overflow publishes an explicit invalid percentile'
  ).toBe(true);

  submitGraph(device, compiledReset, 'reset-before-atomic-overflow');
  writeLogical(persistent.extent, [0, 1]);
  writeLogical(persistent.count, [0xfffffffe]);
  writeLogical(persistent.histogram, [0xfffffffe, 0, 0, 0xfffffffe]);

  const atomicGraph = new GPUCommandGraph(device, {id: 'simultaneous-global-bin-overflow'});
  const atomicAccumulator = importAccumulator(atomicGraph, persistent);
  const opposingSamples = makeBand(
    atomicGraph,
    device,
    owned,
    'opposing-bins',
    [0, 0, 1, 1],
    [1, 1, 1, 1]
  );
  new GPURasterGlobalStatisticsMerge({
    width: 4,
    height: 1,
    input: opposingSamples,
    accumulator: atomicAccumulator
  }).addToGraph(atomicGraph);
  new GPURasterGlobalHistogramMerge({
    width: 4,
    height: 1,
    input: opposingSamples,
    accumulator: atomicAccumulator
  }).addToGraph(atomicGraph);
  const atomicOutput = makeGuardedBuffer(
    device,
    owned,
    'atomic-overflow-percentile',
    'float32',
    1,
    2
  );
  const atomicValidity = makeGuardedBuffer(
    device,
    owned,
    'atomic-overflow-validity',
    'uint32',
    1,
    2
  );
  new GPURasterGlobalPercentile({
    accumulator: atomicAccumulator,
    percentile: 0.5,
    output: importView(atomicGraph, atomicOutput, 'float32'),
    outputValidity: importView(atomicGraph, atomicValidity, 'uint32')
  }).addToGraph(atomicGraph);
  const compiledAtomic = atomicGraph.compile();
  submitGraph(device, compiledAtomic, 'submit-independent-atomic-overflow');

  expect(
    (await readLogical(persistent.count))[0],
    'global population saturates without allocating billions of samples'
  ).toBe(0xffffffff);
  expect(
    await readLogical(persistent.histogram),
    'concurrent independent bins saturate rather than wrap'
  ).toEqual([0xffffffff, 0, 0, 0xffffffff]);
  expect(
    (await readLogical(persistent.overflow))[0],
    'atomic histogram flags preserve the previously published count overflow'
  ).toBe(3);
  expect(
    (await readLogical(atomicValidity))[0],
    'either saturated statistic invalidates percentile consumption'
  ).toBe(0);
  expect(
    Boolean(Number.isNaN((await readLogical(atomicOutput))[0])),
    'saturated populations never masquerade as valid quantiles'
  ).toBe(true);

  submitGraph(device, compiledReset, 'final-explicit-global-reset');
  expect(
    await readLogical(persistent.histogram),
    'only explicit dataset reset clears every saturated persistent bin'
  ).toEqual([0, 0, 0, 0]);
  expect(
    (await readLogical(persistent.overflow))[0],
    'explicit dataset reset clears all independent sticky bits'
  ).toBe(0);

  compiledAtomic.destroy();
  compiledSum.destroy();
  compiledReset.destroy();
  for (const {buffer} of owned) buffer.destroy();
  void 0;
});

function makeAccumulator(
  device: Device,
  owned: GuardedGlobalBuffer[],
  bins: number
): GuardedAccumulator {
  return {
    extent: makeGuardedBuffer(device, owned, 'global-extent', 'float32', 2, 2),
    count: makeGuardedBuffer(device, owned, 'global-count', 'uint32', 1, 1),
    sum: makeGuardedBuffer(device, owned, 'global-sum', 'float32', 1, 3),
    histogram: makeGuardedBuffer(device, owned, 'global-histogram', 'uint32', bins, 2),
    overflow: makeGuardedBuffer(device, owned, 'global-overflow', 'uint32', 1, 1)
  };
}

function importAccumulator(
  graph: GPUCommandGraph,
  persistent: GuardedAccumulator
): GPURasterGlobalAccumulator {
  return {
    extent: importView(graph, persistent.extent, 'float32'),
    count: importView(graph, persistent.count, 'uint32'),
    sum: importView(graph, persistent.sum, 'float32'),
    histogram: importView(graph, persistent.histogram, 'uint32'),
    overflow: importView(graph, persistent.overflow, 'uint32')
  };
}

function makeBand(
  graph: GPUCommandGraph,
  device: Device,
  owned: GuardedGlobalBuffer[],
  id: string,
  values: readonly number[],
  validity: readonly number[],
  scale: number = 1,
  offset: number = 0
): GPURasterBufferBand<'float32'> {
  const samples = makeGuardedBuffer(device, owned, `${id}-values`, 'float32', values.length, 2);
  const flags = makeGuardedBuffer(device, owned, `${id}-validity`, 'uint32', validity.length, 3);
  writeLogical(samples, values);
  writeLogical(flags, validity);
  return {
    id,
    format: 'float32',
    noDataValue: -999,
    scale,
    offset,
    storage: {kind: 'buffer', values: importView(graph, samples, 'float32')},
    validity: importView(graph, flags, 'uint32')
  };
}

function makeGuardedBuffer(
  device: Device,
  owned: GuardedGlobalBuffer[],
  id: string,
  format: GlobalFormat,
  length: number,
  prefixLength: number
): GuardedGlobalBuffer {
  const values = makeSamples(format, prefixLength + length + 1);
  values.fill(format === 'float32' ? floatGuard() : unsignedGuard());
  const entry = {
    buffer: device.createBuffer({
      id,
      data: values,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    }),
    format,
    length,
    prefixLength
  };
  owned.push(entry);
  return entry;
}

function importView<Format extends GlobalFormat>(
  graph: GPUCommandGraph,
  entry: GuardedGlobalBuffer,
  format: Format
): GraphDataView<Format> {
  const handle = graph.importBuffer(
    {id: entry.buffer.id, byteLength: entry.buffer.byteLength, usage: entry.buffer.usage},
    entry.buffer
  );
  return graph.createDataView(handle, {
    format,
    length: entry.length,
    byteOffset: entry.prefixLength * Uint32Array.BYTES_PER_ELEMENT
  });
}

function writeLogical(entry: GuardedGlobalBuffer, values: readonly number[]): void {
  const complete = makeSamples(entry.format, entry.prefixLength + entry.length + 1);
  complete.fill(entry.format === 'float32' ? floatGuard() : unsignedGuard());
  complete.set(values, entry.prefixLength);
  entry.buffer.write(complete);
}

async function readGuarded(entry: GuardedGlobalBuffer): Promise<number[]> {
  const bytes = await entry.buffer.readAsync();
  const typedArrayConstructor = entry.format === 'float32' ? Float32Array : Uint32Array;
  return Array.from(
    new typedArrayConstructor(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)
  );
}

async function readLogical(entry: GuardedGlobalBuffer): Promise<number[]> {
  return (await readGuarded(entry)).slice(entry.prefixLength, entry.prefixLength + entry.length);
}

function makeSamples(format: GlobalFormat, length: number): GlobalSamples {
  return format === 'float32' ? new Float32Array(length) : new Uint32Array(length);
}

function floatGuard(): number {
  return -123456;
}

function unsignedGuard(): number {
  return 4000000001;
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
