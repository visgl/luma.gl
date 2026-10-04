// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, GPUGroupAggregation} from '@luma.gl/gpgpu/gpu-core';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';
import {getGPUGroupSumPlan} from '../../src/gpu-core/gpu-group-aggregation';

type SumOperation = 'sum' | 'mean';

type GroupSumInput = {
  keyChunks: Uint32Array[];
  valueChunks: Float32Array[];
  maskChunks?: Uint32Array[];
  groupCount: number;
  operation: SumOperation;
};

type GroupSumResult = {
  values: Float32Array;
  nodeOrder: string[];
  logicalTransientBufferCount: number;
};

it('GPUGroupAggregation sums integer-valued floats exactly across row blocks', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const rowCount = 70_001;
  for (const groupCount of [1, 16, 300]) {
    const keys = makeKeys(rowCount, groupCount + 3);
    const values = Float32Array.from(
      {length: rowCount},
      (_, index) => (hashUint32(index) % 17) - 8
    );
    const mask = Uint32Array.from({length: rowCount}, (_, index) => hashUint32(index + 7) % 3);
    for (const operation of ['sum', 'mean'] as const) {
      const input = {
        keyChunks: [keys],
        valueChunks: [values],
        maskChunks: [mask],
        groupCount,
        operation
      };
      const expected = getCPUGroupStatistic(input);
      const first = await runGroupSum(device, input);
      expectGroupStatistic(
        first.values,
        expected,
        operation,
        `${operation} over ${groupCount} groups matches the CPU reference`
      );
      const second = await runGroupSum(device, input);
      expect(
        Array.from(new Uint32Array(second.values.buffer)),
        `${operation} over ${groupCount} groups is bitwise deterministic`
      ).toEqual(Array.from(new Uint32Array(first.values.buffer)));
    }
  }
});

it('GPUGroupAggregation sums fractional floats deterministically within tolerance', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const rowCount = 200_000;
  const keys = makeKeys(rowCount, 16);
  const values = Float32Array.from(
    {length: rowCount},
    (_, index) => (hashUint32(index * 3 + 1) / 0x100000000) * 2 - 0.5
  );
  for (const operation of ['sum', 'mean'] as const) {
    const input = {keyChunks: [keys], valueChunks: [values], groupCount: 16, operation};
    const expected = getCPUGroupStatistic(input);
    const runs = [await runGroupSum(device, input), await runGroupSum(device, input)];
    for (let groupIndex = 0; groupIndex < 16; groupIndex++) {
      expect(
        Math.abs(runs[0].values[groupIndex] - expected[groupIndex]) <=
          1e-5 * Math.max(1, Math.abs(expected[groupIndex])),
        `${operation} group ${groupIndex} is within float32 rounding of the float64 reference`
      ).toBe(true);
    }
    expect(
      Array.from(new Uint32Array(runs[1].values.buffer)),
      `${operation} with fractional values is bitwise deterministic`
    ).toEqual(Array.from(new Uint32Array(runs[0].values.buffer)));
  }
});

it('GPUGroupAggregation accumulates groups beyond workgroup memory in scratch', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const groupCount = 9_000;
  const rowCount = 50_000;
  for (const operation of ['sum', 'mean'] as const) {
    const plan = getGPUGroupSumPlan(
      [rowCount],
      groupCount,
      operation,
      device.limits.maxComputeWorkgroupStorageSize
    );
    expect(plan.accumulateInWorkgroup, `${operation} accumulates in scratch columns`).toBe(false);
  }
  const keys = makeKeys(rowCount, groupCount + 10);
  const values = Float32Array.from({length: rowCount}, (_, index) => (hashUint32(index) % 9) - 4);
  for (const operation of ['sum', 'mean'] as const) {
    const input = {keyChunks: [keys], valueChunks: [values], groupCount, operation};
    const result = await runGroupSum(device, input);
    expectGroupStatistic(
      result.values,
      getCPUGroupStatistic(input),
      operation,
      `${operation} over ${groupCount} scratch-accumulated groups matches the CPU reference`
    );
  }
});

it('GPUGroupAggregation sums keep chunk order, empty inputs, and non-finite values', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const chunkLengths = [5_000, 0, 1, 9_999, 4_096];
  const keyChunks = chunkLengths.map((length, chunkIndex) =>
    makeKeys(length, 40, chunkIndex * 100_000)
  );
  const valueChunks = chunkLengths.map((length, chunkIndex) =>
    Float32Array.from({length}, (_, index) => {
      const hash = hashUint32(chunkIndex * 100_000 + index);
      if (hash % 101 === 0) return Number.NaN;
      if (hash % 103 === 0) return Number.NEGATIVE_INFINITY;
      return (hash % 13) - 6;
    })
  );
  const maskChunks = chunkLengths.map((length, chunkIndex) =>
    Uint32Array.from({length}, (_, index) => hashUint32(chunkIndex * 7 + index) % 4)
  );
  for (const operation of ['sum', 'mean'] as const) {
    const input = {keyChunks, valueChunks, maskChunks, groupCount: 37, operation};
    const result = await runGroupSum(device, input);
    expectGroupStatistic(
      result.values,
      getCPUGroupStatistic(input),
      operation,
      `${operation} over ordered chunks ignores masked, out-of-range, and non-finite rows`
    );
    expect(result.nodeOrder, `${operation} reduces each non-empty chunk, then combines`).toEqual([
      `group-sum-chunk-0-${operation}`,
      `group-sum-chunk-1-${operation}`,
      `group-sum-chunk-2-${operation}`,
      `group-sum-chunk-3-${operation}`,
      'group-sum-finalize'
    ]);
    expect(result.logicalTransientBufferCount, `${operation} owns its partial scratch`).toBe(
      operation === 'mean' ? 2 : 1
    );
  }

  const emptySum = await runGroupSum(device, {
    keyChunks: [new Uint32Array(0)],
    valueChunks: [new Float32Array(0)],
    groupCount: 3,
    operation: 'sum'
  });
  expect(Array.from(emptySum.values), 'empty sums are zero').toEqual([0, 0, 0]);
  const emptyMean = await runGroupSum(device, {
    keyChunks: [new Uint32Array(0)],
    valueChunks: [new Float32Array(0)],
    groupCount: 3,
    operation: 'mean'
  });
  expect(Boolean(emptyMean.values.every(Number.isNaN)), 'empty means are NaN').toBe(true);
});

it('GPUGroupAggregation sum plan bounds scratch and workgroup storage', () => {
  const small = getGPUGroupSumPlan([4 * 1024 * 1024], 16, 'sum', 16_384);
  expect(small.rowsPerWorkgroup, 'few groups use the minimum row block').toBe(4096);
  expect(small.partialCount, 'few groups keep scratch small').toBe(16 * 1024);
  expect(small.accumulateInWorkgroup, 'few groups accumulate in workgroup memory').toBe(true);
  const large = getGPUGroupSumPlan([4 * 1024 * 1024], 4096, 'mean', 16_384);
  expect(large.partialCount <= 1 << 20, 'many groups grow row blocks to bound scratch').toBe(true);
  expect(large.accumulateInWorkgroup, 'many groups accumulate in scratch columns').toBe(false);
  expect(
    getGPUGroupSumPlan([100], 2048, 'sum', 16_384).accumulateInWorkgroup,
    '2048 sum accumulators fit the workgroup budget'
  ).toBe(true);
  expect(
    getGPUGroupSumPlan([100], 1025, 'mean', 16_384).accumulateInWorkgroup,
    'mean accumulators also hold counts'
  ).toBe(false);
  expect(
    getGPUGroupSumPlan([100], 16, 'sum', 4096).accumulateInWorkgroup,
    'accumulators respect the device workgroup storage limit'
  ).toBe(false);
  const chunked = getGPUGroupSumPlan([10, 0, 5000], 2, 'sum', 16_384);
  expect(chunked.rowBlockCount, 'row blocks do not cross chunk boundaries').toBe(3);
});

async function runGroupSum(device: Device, input: GroupSumInput): Promise<GroupSumResult> {
  const buffers: Buffer[] = [];
  const makeVector = <T extends 'uint32' | 'float32'>(
    name: string,
    format: T,
    chunks: (Uint32Array | Float32Array)[]
  ): GPUVector<T> =>
    new GPUVector({
      type: 'data',
      name,
      format,
      data: chunks.map(chunk => {
        const buffer = device.createBuffer({
          data: chunk.length > 0 ? chunk : new Uint32Array(1),
          usage: Buffer.STORAGE | Buffer.COPY_DST
        });
        buffers.push(buffer);
        return new GPUData({buffer, format, length: chunk.length, ownsBuffer: false});
      }),
      ownsData: false
    });
  const keysVector = makeVector('keys', 'uint32', input.keyChunks);
  const valuesVector = makeVector('values', 'float32', input.valueChunks);
  const maskVector = input.maskChunks ? makeVector('mask', 'uint32', input.maskChunks) : undefined;
  const outputBuffer = device.createBuffer({
    byteLength: input.groupCount * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device);
  const output = graph.createDataView(
    graph.importBuffer(
      {id: 'output', byteLength: outputBuffer.byteLength, usage: outputBuffer.usage},
      outputBuffer
    ),
    {format: 'float32', length: input.groupCount}
  );
  graph.add(
    new GPUGroupAggregation({
      id: 'group-sum',
      keys: graph.importGPUVector('keys', keysVector),
      values: graph.importGPUVector('values', valuesVector),
      mask: maskVector ? graph.importGPUVector('mask', maskVector) : undefined,
      output,
      operation: input.operation
    })
  );
  const compiled = graph.compile();
  try {
    const encoder = device.createCommandEncoder({id: 'group-sum-test'});
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const bytes = await outputBuffer.readAsync();
    const {nodeOrder, logicalTransientBufferCount} = compiled.stats;
    return {
      values: new Float32Array(
        bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + input.groupCount * 4)
      ),
      nodeOrder,
      logicalTransientBufferCount
    };
  } finally {
    compiled.destroy();
    keysVector.destroy();
    valuesVector.destroy();
    maskVector?.destroy();
    for (const buffer of buffers) buffer.destroy();
    outputBuffer.destroy();
  }
}

/**
 * Integer-valued sums are exact in float32 at these sizes. Means allow the 2.5 ULP WGSL division
 * bound on top of the exact sum.
 */
function expectGroupStatistic(
  actual: Float32Array,
  expected: Float64Array,
  operation: SumOperation,
  message: string
): void {
  if (operation === 'sum') {
    expect(Array.from(actual), message).toEqual(Array.from(expected, value => Math.fround(value)));
    return;
  }
  const mismatches = Array.from(expected).filter((value, groupIndex) =>
    Number.isNaN(value)
      ? !Number.isNaN(actual[groupIndex])
      : Math.abs(actual[groupIndex] - value) > 4e-7 * Math.max(Math.abs(value), 1e-30)
  );
  expect(mismatches, message).toEqual([]);
}

/** Computes float64 group sums or means over accepted finite rows in input order. */
function getCPUGroupStatistic(input: GroupSumInput): Float64Array {
  const sums = new Float64Array(input.groupCount);
  const counts = new Float64Array(input.groupCount);
  for (const [chunkIndex, keys] of input.keyChunks.entries()) {
    const values = input.valueChunks[chunkIndex];
    const mask = input.maskChunks?.[chunkIndex];
    for (let rowIndex = 0; rowIndex < keys.length; rowIndex++) {
      const key = keys[rowIndex];
      const value = values[rowIndex];
      if (key < input.groupCount && Number.isFinite(value) && (!mask || mask[rowIndex] !== 0)) {
        sums[key] += value;
        counts[key]++;
      }
    }
  }
  return input.operation === 'sum'
    ? sums
    : sums.map((sum, groupIndex) => (counts[groupIndex] ? sum / counts[groupIndex] : Number.NaN));
}

/** Creates pseudo-random keys, including some beyond the output range when `range > groups`. */
function makeKeys(length: number, range: number, seed = 0): Uint32Array {
  return Uint32Array.from({length}, (_, index) => hashUint32(seed + index + 0x51ed) % range);
}

/** Mixes one integer into a well-distributed unsigned 32-bit value. */
function hashUint32(value: number): number {
  let hash = value >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  return (hash ^ (hash >>> 16)) >>> 0;
}
