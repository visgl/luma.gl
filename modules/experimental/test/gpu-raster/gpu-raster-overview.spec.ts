// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {
  GPURasterCategoricalOverview,
  GPURasterOverview,
  type GPURasterBufferBand,
  type GPURasterCategoricalOverviewFormat,
  type GPURasterMetadata,
  type GPURasterOverviewCategoricalPolicy,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/gpu-raster';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from '../../../../test/utils/vitest-tape';

type Samples = Float32Array | Uint32Array | Int32Array;

type OwnedOverview = {
  values: Buffer;
  validity: Buffer;
  sums: Buffer;
  counts: Buffer;
};

test('GPURaster analytical overview skips invalid/nodata samples and preserves ragged weighted coverage', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'ragged-analytical-overview'});
  const metadata = makeMetadata(5, 4);
  const rawValues = Float32Array.from([
    1,
    2,
    -999,
    4,
    5,
    6,
    Number.NaN,
    8,
    Number.POSITIVE_INFINITY,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    -999
  ]);
  const rawValidity = Uint32Array.from(Array.from({length: rawValues.length}, () => 1));
  rawValidity[1] = 0;
  const sourceValues = makeGuardedBuffer(device, 'float32', rawValues, 1);
  const sourceValidity = makeGuardedBuffer(device, 'uint32', rawValidity, 2);
  const outputLength = 6;
  const overviewBuffers = makeOwnedOverview(device, outputLength);
  new GPURasterOverview({
    id: 'weighted-odd-coverage',
    metadata,
    scale: [2, 3],
    input: {
      id: 'radiance',
      format: 'float32',
      noDataValue: -999,
      scale: 0.5,
      offset: 2,
      storage: {
        kind: 'buffer',
        values: importView(graph, 'source', sourceValues, 'float32', rawValues.length, 4)
      },
      validity: importView(graph, 'source-validity', sourceValidity, 'uint32', rawValues.length, 8)
    },
    output: importView(graph, 'mean', overviewBuffers.values, 'float32', outputLength, 4),
    outputValidity: importView(
      graph,
      'validity',
      overviewBuffers.validity,
      'uint32',
      outputLength,
      4
    ),
    sum: importView(graph, 'sum', overviewBuffers.sums, 'float32', outputLength, 4),
    validCount: importView(graph, 'count', overviewBuffers.counts, 'uint32', outputLength, 4)
  }).addToGraph(graph);

  const compiled = submitGraph(device, graph, 'submit-ragged-overview');
  const oracle = computeFloatingOracle(
    rawValues,
    rawValidity,
    metadata.width,
    metadata.height,
    2,
    3
  );
  assertNumberLists(
    testCase,
    await readSamples(overviewBuffers.values, 'float32'),
    [getGuard('float32'), ...oracle.values, getGuard('float32')],
    'coverage-weighted calibrated mean and unchanged output guards'
  );
  assertNumberLists(
    testCase,
    await readSamples(overviewBuffers.sums, 'float32'),
    [getGuard('float32'), ...oracle.sums, getGuard('float32')],
    'calibrated sums remain available for the next generated overview'
  );
  testCase.deepEqual(
    await readSamples(overviewBuffers.counts, 'uint32'),
    [getGuard('uint32'), ...oracle.counts, getGuard('uint32')],
    'odd final footprints divide by valid observations, not nominal cell area'
  );
  testCase.deepEqual(
    await readSamples(overviewBuffers.validity, 'uint32'),
    [getGuard('uint32'), ...oracle.validity, getGuard('uint32')],
    'sentinel-only parent publishes zero validity and retains neighboring guards'
  );
  testCase.ok(Number.isNaN(oracle.values.at(-1)!), 'the final all-nodata parent is explicitly NaN');

  compiled.destroy();
  for (const buffer of [sourceValues, sourceValidity, ...Object.values(overviewBuffers)]) {
    testCase.notOk(buffer.destroyed, 'graph destruction never destroys borrowed overview storage');
    buffer.destroy();
  }
  testCase.end();
});

test('GPURaster analytical overviews merge child sums/counts and reject dishonest coverage bounds', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'weighted-child-overview'});
  const sourceMeans = makeGuardedBuffer(device, 'float32', [10, 100, 20, 30], 1);
  const sourceSums = makeGuardedBuffer(device, 'float32', [10, 300, 20, 30], 1);
  const sourceCounts = makeGuardedBuffer(device, 'uint32', [1, 3, 1, 1], 1);
  const sourceValidity = makeGuardedBuffer(device, 'uint32', [1, 1, 1, 1], 1);
  const outputs = makeOwnedOverview(device, 1);
  const contributor = new GPURasterOverview({
    metadata: makeMetadata(2, 2, 1),
    scale: 2,
    input: {
      id: 'child-mean',
      format: 'float32',
      storage: {kind: 'buffer', values: importView(graph, 'means', sourceMeans, 'float32', 4, 4)},
      validity: importView(graph, 'child-validity', sourceValidity, 'uint32', 4, 4)
    },
    inputSum: importView(graph, 'child-sums', sourceSums, 'float32', 4, 4),
    inputValidCount: importView(graph, 'child-counts', sourceCounts, 'uint32', 4, 4),
    maximumInputValidCount: 4,
    output: importView(graph, 'mean', outputs.values, 'float32', 1, 4),
    outputValidity: importView(graph, 'validity', outputs.validity, 'uint32', 1, 4),
    sum: importView(graph, 'sum', outputs.sums, 'float32', 1, 4),
    validCount: importView(graph, 'count', outputs.counts, 'uint32', 1, 4)
  });
  contributor.addToGraph(graph);
  const compiled = graph.compile();
  encodeGraph(device, compiled, 'weighted-child-valid');

  testCase.equal(
    (await readSamples(outputs.sums, 'float32'))[1],
    360,
    'child sums are merged directly'
  );
  testCase.equal(
    (await readSamples(outputs.counts, 'uint32'))[1],
    6,
    'unequal child populations remain exact'
  );
  testCase.equal(
    (await readSamples(outputs.values, 'float32'))[1],
    60,
    'weighted mean differs from averaging child means'
  );
  testCase.notEqual(
    (await readSamples(outputs.values, 'float32'))[1],
    40,
    'already averaged means are never averaged again'
  );

  sourceCounts.write(Uint32Array.from([getGuard('uint32'), 1, 5, 1, 1, getGuard('uint32')]));
  encodeGraph(device, compiled, 'weighted-child-overflow');
  testCase.equal(
    (await readSamples(outputs.validity, 'uint32'))[1],
    0,
    'a child exceeding its declared count bound invalidates the parent'
  );
  testCase.equal(
    (await readSamples(outputs.counts, 'uint32'))[1],
    0,
    'dishonest bounds never publish a wrapped or partial count'
  );
  testCase.equal(
    (await readSamples(outputs.sums, 'float32'))[1],
    0,
    'unsafe aggregates never publish a misleading sum'
  );
  testCase.ok(
    Number.isNaN((await readSamples(outputs.values, 'float32'))[1]!),
    'unsafe means publish the standard invalid NaN'
  );

  compiled.destroy();
  for (const buffer of [
    sourceMeans,
    sourceSums,
    sourceCounts,
    sourceValidity,
    ...Object.values(outputs)
  ]) {
    buffer.destroy();
  }
  testCase.end();
});

test('GPURaster categorical overviews preserve exact unsigned/signed labels and deterministic nodata policies', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  for (const format of ['uint32', 'sint32'] as const) {
    await assertCategoricalPolicy(testCase, device, format, 'nearest');
    await assertCategoricalPolicy(testCase, device, format, 'mode');
  }
  testCase.end();
});

async function assertCategoricalPolicy<Format extends GPURasterCategoricalOverviewFormat>(
  testCase: Test,
  device: Device,
  format: Format,
  policy: GPURasterOverviewCategoricalPolicy
): Promise<void> {
  const graph = new GPUCommandGraph(device, {id: `${format}-${policy}-overview`});
  const noDataValue = format === 'uint32' ? 4294967295 : -2147483648;
  const values =
    format === 'uint32'
      ? [
          4294967295, 16777217, 4294967294, 4294967293, 9, 16777219, 16777217, 4294967294,
          4294967293, 10
        ]
      : [-2147483648, -2147483647, -9, -11, 7, -2147483646, -2147483647, -9, -11, 8];
  const validity = [0, 1, 1, 1, 1, 1, 1, 1, 1, 0];
  const sourceValues = makeGuardedBuffer(device, format, values, 1);
  const sourceValidity = makeGuardedBuffer(device, 'uint32', validity, 1);
  const selected = makeGuardedBuffer(device, format, [], 1, 3);
  const selectedValidity = makeGuardedBuffer(device, 'uint32', [], 1, 3);
  const coverage = makeGuardedBuffer(device, 'uint32', [], 1, 3);
  new GPURasterCategoricalOverview({
    metadata: makeMetadata(5, 2),
    scale: 2,
    policy,
    input: {
      id: 'labels',
      format,
      noDataValue,
      storage: {
        kind: 'buffer',
        values: importView(graph, 'labels', sourceValues, format, values.length, 4)
      },
      validity: importView(graph, 'source-validity', sourceValidity, 'uint32', values.length, 4)
    } as GPURasterBufferBand<Format>,
    output: importView(graph, 'selected', selected, format, 3, 4),
    outputValidity: importView(graph, 'selected-validity', selectedValidity, 'uint32', 3, 4),
    validCount: importView(graph, 'coverage', coverage, 'uint32', 3, 4)
  }).addToGraph(graph);
  const compiled = submitGraph(device, graph, `${format}-${policy}-submit`);
  const expectedValues =
    policy === 'nearest'
      ? format === 'uint32'
        ? [0, 4294967294, 9]
        : [0, -9, 7]
      : format === 'uint32'
        ? [16777217, 4294967293, 9]
        : [-2147483647, -11, 7];
  const expectedValidity = policy === 'nearest' ? [0, 1, 1] : [1, 1, 1];

  testCase.deepEqual(
    await readSamples(selected, format),
    [getGuard(format), ...expectedValues, getGuard(format)],
    `${format} ${policy} keeps exact labels, deterministic ties, and output guards`
  );
  testCase.deepEqual(
    await readSamples(selectedValidity, 'uint32'),
    [getGuard('uint32'), ...expectedValidity, getGuard('uint32')],
    `${format} ${policy} rejects an invalid nearest without interpolating categories`
  );
  testCase.deepEqual(
    await readSamples(coverage, 'uint32'),
    [getGuard('uint32'), 3, 4, 1, getGuard('uint32')],
    `${format} ${policy} records the actual valid footprint even when nearest is invalid`
  );
  compiled.destroy();
  for (const buffer of [sourceValues, sourceValidity, selected, selectedValidity, coverage]) {
    buffer.destroy();
  }
}

function makeMetadata(width: number, height: number, level: number = 0): GPURasterMetadata {
  return {
    width,
    height,
    affine: [2, 1, 100, -1, -3, 200],
    pixelInterpretation: 'area',
    coordinateReferenceSystem: {authority: 'EPSG:32610'},
    level,
    levelZeroOrigin: [0, 0]
  };
}

function makeOwnedOverview(device: Device, length: number): OwnedOverview {
  return {
    values: makeGuardedBuffer(device, 'float32', [], 1, length),
    validity: makeGuardedBuffer(device, 'uint32', [], 1, length),
    sums: makeGuardedBuffer(device, 'float32', [], 1, length),
    counts: makeGuardedBuffer(device, 'uint32', [], 1, length)
  };
}

function makeGuardedBuffer(
  device: Device,
  format: GPURasterScalarFormat,
  values: readonly number[] | Samples,
  prefixLength: number,
  length: number = values.length
): Buffer {
  const totalLength = prefixLength + length + 1;
  const data = makeTypedArray(format, totalLength);
  data.fill(getGuard(format));
  data.set(values, prefixLength);
  return device.createBuffer({data, usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST});
}

function makeTypedArray(format: GPURasterScalarFormat, length: number): Samples {
  if (format === 'float32') return new Float32Array(length);
  if (format === 'uint32') return new Uint32Array(length);
  return new Int32Array(length);
}

function getGuard(format: GPURasterScalarFormat): number {
  if (format === 'float32') return -123456;
  if (format === 'uint32') return 4000000001;
  return -2000000001;
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
  graph: GPUCommandGraph,
  id: string
): ReturnType<GPUCommandGraph['compile']> {
  const compiled = graph.compile();
  encodeGraph(device, compiled, id);
  return compiled;
}

function encodeGraph(
  device: Device,
  compiled: ReturnType<GPUCommandGraph['compile']>,
  id: string
): void {
  const encoder = device.createCommandEncoder({id});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
}

async function readSamples(buffer: Buffer, format: GPURasterScalarFormat): Promise<number[]> {
  const bytes = await buffer.readAsync();
  const length = bytes.byteLength / 4;
  if (format === 'float32')
    return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
  if (format === 'uint32')
    return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
  return Array.from(new Int32Array(bytes.buffer, bytes.byteOffset, length));
}

function computeFloatingOracle(
  values: Float32Array,
  validity: Uint32Array,
  width: number,
  height: number,
  horizontalScale: number,
  verticalScale: number
): {values: number[]; sums: number[]; counts: number[]; validity: number[]} {
  const output = {
    values: [] as number[],
    sums: [] as number[],
    counts: [] as number[],
    validity: [] as number[]
  };
  for (let outputRow = 0; outputRow < Math.ceil(height / verticalScale); outputRow++) {
    for (let outputColumn = 0; outputColumn < Math.ceil(width / horizontalScale); outputColumn++) {
      let sum = 0;
      let count = 0;
      for (
        let row = outputRow * verticalScale;
        row < Math.min((outputRow + 1) * verticalScale, height);
        row++
      ) {
        for (
          let column = outputColumn * horizontalScale;
          column < Math.min((outputColumn + 1) * horizontalScale, width);
          column++
        ) {
          const index = row * width + column;
          const value = values[index]!;
          if (validity[index] && Number.isFinite(value) && value !== -999) {
            sum = Math.fround(sum + Math.fround(value * 0.5 + 2));
            count++;
          }
        }
      }
      output.sums.push(count > 0 ? sum : 0);
      output.counts.push(count);
      output.validity.push(Number(count > 0));
      output.values.push(count > 0 ? Math.fround(sum / count) : Number.NaN);
    }
  }
  return output;
}

function assertNumberLists(
  testCase: Test,
  actual: readonly number[],
  expected: readonly number[],
  label: string
): void {
  testCase.equal(actual.length, expected.length, `${label}: length`);
  for (let index = 0; index < expected.length; index++) {
    if (Number.isNaN(expected[index])) {
      testCase.ok(Number.isNaN(actual[index]), `${label}: invalid pixel ${index}`);
    } else {
      testCase.ok(
        Math.abs(actual[index]! - expected[index]!) < 0.00001,
        `${label}: value ${index} (${actual[index]} versus ${expected[index]})`
      );
    }
  }
}
