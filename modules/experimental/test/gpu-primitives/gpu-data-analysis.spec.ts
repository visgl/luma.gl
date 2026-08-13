// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUGridAggregation,
  GPUGridBinning,
  GPUGroupAggregation,
  GPUHistogram,
  GPUReduction,
  type GPUGridAggregationOperation,
  type GPUGroupAggregationOperation,
  type GPUReductionOperation
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUData, GPUVector, type GPUVectorFormat} from '@luma.gl/tables';
import {getGPUGroupAggregationDispatchLayout} from '../../src/gpu-primitives/gpu-group-aggregation';

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
  t.ok(Math.abs(floatSum[0] - 0.6) < 1e-6, 'float sum remains numerically accurate');
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

test('GPUHistogram supports irregular literal and GPU-resident edges', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  t.deepEqual(
    await runIrregularHistogram(
      device,
      Float32Array.from([
        -1,
        0,
        0.5,
        1,
        9.5,
        10,
        99,
        100,
        101,
        Number.NaN,
        Number.POSITIVE_INFINITY
      ]),
      'float32',
      [0, 1, 10, 100]
    ),
    [2, 2, 3],
    'literal edges use half-open intervals and include the final edge'
  );
  t.deepEqual(
    await runIrregularHistogram(
      device,
      Float32Array.from([0, 1e21, 2e21]),
      'float32',
      [0, 1e21, 2e21]
    ),
    [1, 2],
    'exponential float edges generate valid WGSL literals'
  );
  t.deepEqual(
    await runIrregularHistogram(
      device,
      Uint32Array.from([0, 1, 9, 10, 99, 100]),
      'uint32',
      [0, 10, 100]
    ),
    [3, 3],
    'integer edge comparisons remain exact'
  );
  t.deepEqual(
    await runIrregularHistogram(
      device,
      Int32Array.from([-10, -1, 0, 9, 10]),
      'sint32',
      [-10, 0, 10],
      true
    ),
    [2, 3],
    'GPU-resident signed edges are accepted'
  );
  t.deepEqual(
    await runIrregularHistogram(
      device,
      Uint32Array.from([0, 1, 5, 10, 100]),
      'uint32',
      [0, 10, 5, 100],
      true
    ),
    [0, 0, 0],
    'unordered GPU-resident edges suppress accumulation without a readback'
  );
  t.deepEqual(
    await runIrregularHistogram(
      device,
      Uint32Array.from([1, 3, 4, 7]),
      'uint32',
      [0, 5, 10],
      true,
      [0, 2, 10]
    ),
    [1, 3],
    'rewriting GPU edges changes bins without recompiling the graph'
  );
  t.deepEqual(
    await runIrregularHistogram(device, new Float32Array(0), 'float32', [0, 1, 10]),
    [0, 0],
    'an empty irregular histogram is cleared'
  );

  const globalEdges = Uint32Array.from({length: 301}, (_, index) => index);
  const globalValues = Uint32Array.from({length: 301}, (_, index) => index);
  t.deepEqual(
    await runIrregularHistogram(device, globalValues, 'uint32', globalEdges, true),
    [...Array.from({length: 299}, () => 1), 2],
    'GPU edges support more than 256 bins through the global atomic path'
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

test('GPUHistogram preserves vector chunks with irregular edges', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const result = await runIrregularVectorHistogram(
    device,
    [Float32Array.from([0, 0.5]), new Float32Array(0), Float32Array.from([1, 9.5, 10, 100])],
    'float32',
    [0, 1, 10, 100]
  );
  t.deepEqual(result.counts, [2, 2, 2], 'every non-empty source chunk contributes counts');
  t.deepEqual(
    result.nodeOrder,
    [
      'gpu-histogram-validate-edges',
      'gpu-histogram-clear',
      'gpu-histogram-chunk-0-edges-local',
      'gpu-histogram-chunk-2-edges-local'
    ],
    'edge validation and one clear precede ordered per-chunk accumulation'
  );
  t.equal(
    result.logicalTransientBufferCount,
    1,
    'GPU edges use only one graph-owned ordering flag'
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

test('GPUGroupAggregation counts dense keys with optional dynamic selection', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const keys = Uint32Array.from([0, 1, 3, 4, 0xffffffff, 1, 0]);
  t.deepEqual(
    await runGroupAggregation(device, keys, 4),
    [2, 2, 0, 1],
    'dense keys count into output rows and out-of-range keys are ignored'
  );
  t.deepEqual(
    await runGroupAggregation(device, keys, 4, Uint32Array.from([7, 0, 1, 1, 1, 1, 0])),
    [1, 1, 0, 1],
    'nonzero mask rows contribute to their groups'
  );
  t.deepEqual(
    await runGroupAggregation(
      device,
      keys,
      4,
      Uint32Array.from([7, 0, 1, 1, 1, 1, 0]),
      Uint32Array.from({length: keys.length}, () => 1)
    ),
    [2, 2, 0, 1],
    'rewriting the selection changes counts without recompiling the graph'
  );
  t.deepEqual(
    await runGroupAggregation(device, new Uint32Array(0), 3),
    [0, 0, 0],
    'empty input still clears every group'
  );

  const globalKeys = Uint32Array.from({length: 301}, (_, index) => index);
  t.deepEqual(
    await runGroupAggregation(device, globalKeys, 300),
    Array.from({length: 300}, () => 1),
    'more than 256 groups uses global atomics and ignores key 300'
  );
  t.end();
});

test('GPUGroupAggregation plans bounded multidimensional dispatches', t => {
  t.deepEqual(
    getGPUGroupAggregationDispatchLayout(5 * 256, 4),
    {x: 4, y: 2, z: 1},
    'workgroups spill from x into y at the device limit'
  );
  t.deepEqual(
    getGPUGroupAggregationDispatchLayout(20 * 256, 4),
    {x: 4, y: 4, z: 2},
    'larger chunks spill into the third dimension'
  );
  t.throws(
    () => getGPUGroupAggregationDispatchLayout((4 * 4 * 4 + 1) * 256, 4),
    /exceeding the 3D dispatch limit/,
    'chunks beyond the full 3D device limit are rejected before encoding'
  );
  t.end();
});

test('GPUGroupAggregation computes filtered floating-point group statistics', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const keys = Uint32Array.from([0, 0, 1, 2, 2, 3, 1, 9]);
  const values = Float32Array.from([5, -2, 4, -3, Number.NaN, Number.POSITIVE_INFINITY, 1, 100]);
  const mask = Uint32Array.from([1, 1, 1, 1, 1, 1, 7, 1]);
  const run = (operation: Exclude<GPUGroupAggregationOperation, 'count'>) =>
    runGroupStatistic(device, keys, values, 4, operation, mask);
  const sum = await run('sum');
  const minimum = await run('min');
  const maximum = await run('max');
  const mean = await run('mean');

  t.deepEqual(sum, [3, 5, -3, 0], 'sum accepts finite selected values with valid keys');
  t.deepEqual(minimum.slice(0, 3), [-2, 1, -3], 'minimum retains each smallest value');
  t.ok(Number.isNaN(minimum[3]), 'minimum marks a group with no finite values as NaN');
  t.deepEqual(maximum.slice(0, 3), [5, 4, -3], 'maximum retains each largest value');
  t.ok(Number.isNaN(maximum[3]), 'maximum marks a group with no finite values as NaN');
  t.deepEqual(mean.slice(0, 3), [1.5, 2.5, -3], 'mean divides sums by accepted values');
  t.ok(Number.isNaN(mean[3]), 'mean marks a group with no finite values as NaN');

  const emptyMean = await runGroupStatistic(
    device,
    new Uint32Array(0),
    new Float32Array(0),
    3,
    'mean'
  );
  t.ok(emptyMean.every(Number.isNaN), 'empty means finalize every group to NaN');
  const minimumZero = await runGroupStatistic(
    device,
    Uint32Array.from([0, 0]),
    Float32Array.from([0, -0]),
    1,
    'min'
  );
  const maximumZero = await runGroupStatistic(
    device,
    Uint32Array.from([0, 0]),
    Float32Array.from([0, -0]),
    1,
    'max'
  );
  t.ok(Object.is(minimumZero[0], -0), 'minimum preserves the ordered-float signed-zero contract');
  t.ok(Object.is(maximumZero[0], 0), 'maximum preserves the ordered-float signed-zero contract');
  t.end();
});

test('GPUGroupAggregation preserves aligned vector chunks', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const result = await runVectorGroupAggregation(
    device,
    [Uint32Array.from([0, 1]), new Uint32Array(0), Uint32Array.from([1, 3, 9])],
    [Uint32Array.from([1, 0]), new Uint32Array(0), Uint32Array.from([1, 1, 1])],
    4
  );
  t.deepEqual(result.counts, [1, 1, 0, 1], 'aligned non-empty chunks share dense counts');
  t.deepEqual(
    result.nodeOrder,
    [
      'gpu-group-aggregation-clear',
      'gpu-group-aggregation-chunk-0-local',
      'gpu-group-aggregation-chunk-2-local'
    ],
    'one clear precedes ordered per-chunk accumulation'
  );
  t.equal(
    result.logicalTransientBufferCount,
    0,
    'group counting does not pack chunks or allocate scratch storage'
  );

  const mean = await runVectorGroupStatistic(
    device,
    [Uint32Array.from([0, 1]), new Uint32Array(0), Uint32Array.from([0, 1, 8])],
    [Float32Array.from([1, 3]), new Float32Array(0), Float32Array.from([5, 7, 100])],
    [Uint32Array.from([1, 0]), new Uint32Array(0), Uint32Array.from([1, 1, 1])],
    2,
    'mean'
  );
  t.deepEqual(mean.values, [3, 7], 'weighted groups combine aligned selected chunks');
  t.deepEqual(
    mean.nodeOrder,
    [
      'gpu-group-aggregation-initialize',
      'gpu-group-aggregation-chunk-0-mean',
      'gpu-group-aggregation-chunk-2-mean',
      'gpu-group-aggregation-finalize'
    ],
    'weighted vector aggregation initializes and finalizes once around non-empty chunks'
  );
  t.equal(mean.logicalTransientBufferCount, 1, 'mean owns one transient group-count buffer');
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

test('GPUGridAggregation sums finite weights with float32 atomics', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const positions = Float32Array.from([0, 0, 1, 0, 0, 1, 2, 2, 2, 2, -1, 0, Number.NaN, 1, 1, 1]);
  const weights = Float32Array.from([1.5, -2, 3, 4, 0.25, 100, 100, Number.POSITIVE_INFINITY]);
  t.deepEqual(
    await runGridAggregation(device, positions, weights, [2, 2], [0, 0, 2, 2]),
    [1.5, -2, 3, 4.25],
    'finite in-bounds weights contribute to row-major cell sums'
  );
  t.deepEqual(
    await runGridAggregation(device, positions, weights, [2, 2], [0, 0, 2, 2], true),
    [1.5, -2, 3, 4.25],
    'GPU-resident bounds preserve weighted sums'
  );
  t.deepEqual(
    await runGridAggregation(
      device,
      new Float32Array(0),
      new Float32Array(0),
      [2, 2],
      [0, 0, 1, 1]
    ),
    [0, 0, 0, 0],
    'empty inputs still clear every sum'
  );
  t.deepEqual(
    await runGridAggregation(
      device,
      Float32Array.from([0, 0, 0, 0]),
      Float32Array.from([3.402823466e38, 3.402823466e38]),
      [1, 1],
      [0, 0, 0, 0]
    ),
    [Number.POSITIVE_INFINITY],
    'finite contributions may overflow their float32 cell sum'
  );
  t.end();
});

test('GPUGridAggregation computes minimum, maximum, and mean cell statistics', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const positions = Float32Array.from([0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1]);
  const weights = Float32Array.from([5, -2, 4, -3, Number.NaN, Number.POSITIVE_INFINITY]);
  const run = (operation: GPUGridAggregationOperation) =>
    runGridAggregation(device, positions, weights, [2, 2], [0, 0, 1, 1], false, operation);
  const mean = await run('mean');
  const minimum = await run('min');
  const maximum = await run('max');

  t.deepEqual(minimum.slice(0, 3), [-2, 4, -3], 'minimum retains the smallest finite weight');
  t.ok(Number.isNaN(minimum[3]), 'minimum marks an empty cell with NaN');
  t.deepEqual(maximum.slice(0, 3), [5, 4, -3], 'maximum retains the largest finite weight');
  t.ok(Number.isNaN(maximum[3]), 'maximum marks an empty cell with NaN');
  t.deepEqual(mean.slice(0, 3), [1.5, 4, -3], 'mean divides the float32 sum by accepted rows');
  t.ok(Number.isNaN(mean[3]), 'mean marks an empty cell with NaN');

  const emptyMean = await runGridAggregation(
    device,
    new Float32Array(0),
    new Float32Array(0),
    [2, 2],
    [0, 0, 1, 1],
    false,
    'mean'
  );
  t.ok(emptyMean.every(Number.isNaN), 'an empty mean aggregation finalizes every cell to NaN');

  const zeroPositions = Float32Array.from([0, 0, 0, 0]);
  const zeroWeights = Float32Array.from([0, -0]);
  const minimumZero = await runGridAggregation(
    device,
    zeroPositions,
    zeroWeights,
    [1, 1],
    [0, 0, 0, 0],
    false,
    'min'
  );
  const maximumZero = await runGridAggregation(
    device,
    zeroPositions,
    zeroWeights,
    [1, 1],
    [0, 0, 0, 0],
    false,
    'max'
  );
  t.ok(Object.is(minimumZero[0], -0), 'minimum uses the ordered-float signed-zero contract');
  t.ok(Object.is(maximumZero[0], 0), 'maximum uses the ordered-float signed-zero contract');
  t.end();
});

test('GPUGridAggregation preserves paired GPUVector chunk topology', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const result = await runVectorGridAggregation(
    device,
    [Float32Array.from([0, 0, 1, 0]), new Float32Array(0), Float32Array.from([0, 1, 2, 2])],
    [Float32Array.from([1.25, 2.5]), new Float32Array(0), Float32Array.from([-3, 4.75])],
    [2, 2],
    [0, 0, 2, 2]
  );
  t.deepEqual(result.values, [1.25, 2.5, -3, 4.75], 'aligned chunks accumulate in source order');
  t.deepEqual(
    result.nodeOrder,
    [
      'gpu-grid-aggregation-clear',
      'gpu-grid-aggregation-chunk-0-sum',
      'gpu-grid-aggregation-chunk-2-sum'
    ],
    'one clear precedes each non-empty aligned chunk'
  );
  t.equal(result.logicalTransientBufferCount, 0, 'paired chunks are not packed or concatenated');

  const mean = await runVectorGridAggregation(
    device,
    [Float32Array.from([0, 0, 0, 0]), new Float32Array(0), Float32Array.from([0, 0])],
    [Float32Array.from([1, 3]), new Float32Array(0), Float32Array.from([5])],
    [1, 1],
    [0, 0, 0, 0],
    'mean'
  );
  t.deepEqual(mean.values, [3], 'mean combines sums and counts across aligned chunks');
  t.deepEqual(
    mean.nodeOrder,
    [
      'gpu-grid-aggregation-initialize',
      'gpu-grid-aggregation-chunk-0-mean',
      'gpu-grid-aggregation-chunk-2-mean',
      'gpu-grid-aggregation-finalize'
    ],
    'mean initializes once, accumulates every non-empty chunk, and finalizes once'
  );
  t.equal(mean.logicalTransientBufferCount, 1, 'mean owns one transient cell-count buffer');
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
  t.throws(
    () => new GPUHistogram({input, output: two, edges: [0, 1]}),
    /output.length \+ 1/,
    'literal histogram edges must match the output size'
  );
  t.throws(
    () => new GPUHistogram({input, output: two, edges: [0, 1, 1]}),
    /strictly increasing/,
    'literal histogram edges must be strictly increasing'
  );
  const floatInput = graph.createDataView(inputHandle, {format: 'float32', length: 4});
  t.throws(
    () =>
      new GPUHistogram({
        input: floatInput,
        output: two,
        edges: [16_777_216, 16_777_217, 16_777_218]
      }),
    /strictly increasing/,
    'literal histogram edges must remain ordered after float32 conversion'
  );
  t.throws(
    () =>
      new GPUGroupAggregation({
        keys: input,
        output: two,
        operation: 'median' as GPUGroupAggregationOperation
      }),
    /operation must be count/,
    'unsupported group statistics are rejected'
  );
  t.throws(
    () =>
      new GPUGroupAggregation({
        keys: input,
        mask: graph.createDataView(inputHandle, {format: 'uint32', length: 3}),
        output: two
      }),
    /lengths must match/,
    'group keys and masks require row alignment'
  );
  t.throws(
    () =>
      new GPUGroupAggregation({
        keys: input,
        output: graph.createDataView(outputHandle, {format: 'uint32', length: 0})
      }),
    /at least one group/,
    'group output must define a nonempty key range'
  );
  t.throws(
    () =>
      new GPUGroupAggregation({
        keys: input,
        output: graph.createDataView(inputHandle, {format: 'uint32', length: 2})
      }),
    /separate buffers/,
    'group output cannot alias its keys'
  );
  const floatGroupOutput = graph.createDataView(outputHandle, {format: 'float32', length: 2});
  t.throws(
    () =>
      new GPUGroupAggregation({
        keys: input,
        values: graph.createDataView(inputHandle, {format: 'float32', length: 3}),
        output: floatGroupOutput,
        operation: 'sum'
      }),
    /lengths must match/,
    'group keys and floating-point values require row alignment'
  );
  t.throws(
    () =>
      new GPUGroupAggregation({
        keys: input,
        output: floatGroupOutput,
        operation: 'mean'
      } as never),
    /requires values/,
    'weighted group statistics require an aligned value input'
  );
  const positions = graph.createDataView(inputHandle, {format: 'float32x2', length: 4});
  t.throws(
    () => new GPUGridBinning({positions, output: two, gridSize: [2, 2], bounds: [0, 0, 1, 1]}),
    /output.length/,
    'grid output layout is validated'
  );
  const weights = graph.createDataView(inputHandle, {format: 'float32', length: 3});
  const floatOutput = graph.createDataView(outputHandle, {format: 'float32', length: 4});
  t.throws(
    () =>
      new GPUGridAggregation({
        positions,
        weights,
        output: floatOutput,
        gridSize: [2, 2],
        bounds: [0, 0, 1, 1]
      }),
    /same number of rows/,
    'weighted grid inputs require row alignment'
  );
  t.throws(
    () =>
      new GPUGridAggregation({
        positions,
        weights: graph.createDataView(inputHandle, {format: 'float32', length: 4}),
        output: floatOutput,
        operation: 'median' as GPUGridAggregationOperation,
        gridSize: [2, 2],
        bounds: [0, 0, 1, 1]
      }),
    /operation must be sum, min, max, or mean/,
    'unsupported grid statistics are rejected'
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

async function runIrregularHistogram(
  device: Device,
  values: ScalarArray,
  format: ScalarFormat,
  edges: readonly number[] | ScalarArray,
  gpuEdges = false,
  updatedEdges?: readonly number[]
): Promise<number[]> {
  const binCount = edges.length - 1;
  const inputBuffer = createInputBuffer(device, values);
  const outputBuffer = createOutputBuffer(device, binCount);
  const graph = new GPUCommandGraph(device);
  const input = importView(graph, 'input', inputBuffer, format, values.length);
  const output = importView(graph, 'output', outputBuffer, 'uint32', binCount);
  let histogramEdges: readonly number[] | ReturnType<typeof importView> = Array.from(edges);
  let edgesBuffer: Buffer | undefined;
  if (gpuEdges) {
    const EdgeArray =
      format === 'uint32' ? Uint32Array : format === 'sint32' ? Int32Array : Float32Array;
    edgesBuffer = createInputBuffer(device, EdgeArray.from(edges));
    histogramEdges = importView(graph, 'edges', edgesBuffer, format, edges.length);
  }
  new GPUHistogram({input, output, edges: histogramEdges as never}).addToGraph(graph);
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'irregular-histogram-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  if (updatedEdges && edgesBuffer) {
    await readUint32(outputBuffer, binCount);
    const EdgeArray =
      format === 'uint32' ? Uint32Array : format === 'sint32' ? Int32Array : Float32Array;
    edgesBuffer.write(EdgeArray.from(updatedEdges));
    const updatedCommandEncoder = device.createCommandEncoder({id: 'updated-irregular-edges'});
    compiled.encode(updatedCommandEncoder, {parameters: undefined});
    device.submit(updatedCommandEncoder.finish());
  }
  const result = await readUint32(outputBuffer, binCount);
  compiled.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
  edgesBuffer?.destroy();
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

async function runIrregularVectorHistogram(
  device: Device,
  chunks: ScalarArray[],
  format: ScalarFormat,
  edges: readonly number[]
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
  const EdgeArray =
    format === 'uint32' ? Uint32Array : format === 'sint32' ? Int32Array : Float32Array;
  const edgesBuffer = createInputBuffer(device, EdgeArray.from(edges));
  const outputBuffer = createOutputBuffer(device, edges.length - 1);
  const graph = new GPUCommandGraph(device);
  const input = graph.importGPUVector('input', vector);
  const edgeView = importView(graph, 'edges', edgesBuffer, format, edges.length);
  const output = importView(graph, 'output', outputBuffer, 'uint32', edges.length - 1);
  new GPUHistogram({input, output, edges: edgeView as never}).addToGraph(graph);
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'irregular-vector-histogram-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const counts = await readUint32(outputBuffer, output.length);
  const {nodeOrder, logicalTransientBufferCount} = compiled.stats;
  compiled.destroy();
  vector.destroy();
  for (const buffer of inputBuffers) buffer.destroy();
  edgesBuffer.destroy();
  outputBuffer.destroy();
  return {counts, nodeOrder, logicalTransientBufferCount};
}

async function runGroupAggregation(
  device: Device,
  keys: Uint32Array,
  groupCount: number,
  mask?: Uint32Array,
  updatedMask?: Uint32Array
): Promise<number[]> {
  const keysBuffer = createInputBuffer(device, keys);
  const maskBuffer = mask ? createInputBuffer(device, mask) : undefined;
  const outputBuffer = createOutputBuffer(device, groupCount);
  const graph = new GPUCommandGraph(device);
  const keysView = importView(graph, 'group-keys', keysBuffer, 'uint32', keys.length);
  const maskView = maskBuffer
    ? importView(graph, 'group-mask', maskBuffer, 'uint32', mask!.length)
    : undefined;
  const output = importView(graph, 'group-counts', outputBuffer, 'uint32', groupCount);
  new GPUGroupAggregation({keys: keysView, mask: maskView, output}).addToGraph(graph);
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'group-aggregation-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  if (updatedMask && maskBuffer) {
    await readUint32(outputBuffer, groupCount);
    maskBuffer.write(updatedMask);
    const updatedCommandEncoder = device.createCommandEncoder({id: 'updated-group-selection'});
    compiled.encode(updatedCommandEncoder, {parameters: undefined});
    device.submit(updatedCommandEncoder.finish());
  }
  const counts = await readUint32(outputBuffer, groupCount);
  compiled.destroy();
  keysBuffer.destroy();
  maskBuffer?.destroy();
  outputBuffer.destroy();
  return counts;
}

async function runGroupStatistic(
  device: Device,
  keys: Uint32Array,
  values: Float32Array,
  groupCount: number,
  operation: Exclude<GPUGroupAggregationOperation, 'count'>,
  mask?: Uint32Array
): Promise<number[]> {
  const keysBuffer = createInputBuffer(device, keys);
  const valuesBuffer = createInputBuffer(device, values);
  const maskBuffer = mask ? createInputBuffer(device, mask) : undefined;
  const outputBuffer = createOutputBuffer(device, groupCount);
  const graph = new GPUCommandGraph(device);
  const keysView = importView(graph, 'group-keys', keysBuffer, 'uint32', keys.length);
  const valuesView = importView(graph, 'group-values', valuesBuffer, 'float32', values.length);
  const maskView = maskBuffer
    ? importView(graph, 'group-mask', maskBuffer, 'uint32', mask!.length)
    : undefined;
  const output = importView(graph, 'group-statistic', outputBuffer, 'float32', groupCount);
  new GPUGroupAggregation({
    keys: keysView,
    values: valuesView,
    mask: maskView,
    output,
    operation
  }).addToGraph(graph);
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'group-statistic-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const result = await readFloat32(outputBuffer, groupCount);
  compiled.destroy();
  keysBuffer.destroy();
  valuesBuffer.destroy();
  maskBuffer?.destroy();
  outputBuffer.destroy();
  return result;
}

async function runVectorGroupAggregation(
  device: Device,
  keyChunks: Uint32Array[],
  maskChunks: Uint32Array[],
  groupCount: number
): Promise<{counts: number[]; nodeOrder: string[]; logicalTransientBufferCount: number}> {
  const keyBuffers = keyChunks.map(chunk => createInputBuffer(device, chunk));
  const maskBuffers = maskChunks.map(chunk => createInputBuffer(device, chunk));
  const keysVector = new GPUVector({
    type: 'data',
    name: 'group-keys',
    format: 'uint32',
    data: keyChunks.map(
      (chunk, chunkIndex) =>
        new GPUData({
          buffer: keyBuffers[chunkIndex],
          format: 'uint32',
          length: chunk.length,
          ownsBuffer: false
        })
    ),
    ownsData: false
  });
  const maskVector = new GPUVector({
    type: 'data',
    name: 'group-mask',
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
  const outputBuffer = createOutputBuffer(device, groupCount);
  const graph = new GPUCommandGraph(device);
  const keys = graph.importGPUVector('group-keys', keysVector);
  const mask = graph.importGPUVector('group-mask', maskVector);
  const output = importView(graph, 'group-counts', outputBuffer, 'uint32', groupCount);
  new GPUGroupAggregation({keys, mask, output}).addToGraph(graph);
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'vector-group-aggregation-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const counts = await readUint32(outputBuffer, groupCount);
  const {nodeOrder, logicalTransientBufferCount} = compiled.stats;
  compiled.destroy();
  keysVector.destroy();
  maskVector.destroy();
  for (const buffer of [...keyBuffers, ...maskBuffers]) buffer.destroy();
  outputBuffer.destroy();
  return {counts, nodeOrder, logicalTransientBufferCount};
}

async function runVectorGroupStatistic(
  device: Device,
  keyChunks: Uint32Array[],
  valueChunks: Float32Array[],
  maskChunks: Uint32Array[],
  groupCount: number,
  operation: Exclude<GPUGroupAggregationOperation, 'count'>
): Promise<{values: number[]; nodeOrder: string[]; logicalTransientBufferCount: number}> {
  const keyBuffers = keyChunks.map(chunk => createInputBuffer(device, chunk));
  const valueBuffers = valueChunks.map(chunk => createInputBuffer(device, chunk));
  const maskBuffers = maskChunks.map(chunk => createInputBuffer(device, chunk));
  const keysVector = new GPUVector({
    type: 'data',
    name: 'group-keys',
    format: 'uint32',
    data: keyChunks.map(
      (chunk, chunkIndex) =>
        new GPUData({
          buffer: keyBuffers[chunkIndex],
          format: 'uint32',
          length: chunk.length,
          ownsBuffer: false
        })
    ),
    ownsData: false
  });
  const valuesVector = new GPUVector({
    type: 'data',
    name: 'group-values',
    format: 'float32',
    data: valueChunks.map(
      (chunk, chunkIndex) =>
        new GPUData({
          buffer: valueBuffers[chunkIndex],
          format: 'float32',
          length: chunk.length,
          ownsBuffer: false
        })
    ),
    ownsData: false
  });
  const maskVector = new GPUVector({
    type: 'data',
    name: 'group-mask',
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
  const outputBuffer = createOutputBuffer(device, groupCount);
  const graph = new GPUCommandGraph(device);
  const keys = graph.importGPUVector('group-keys', keysVector);
  const values = graph.importGPUVector('group-values', valuesVector);
  const mask = graph.importGPUVector('group-mask', maskVector);
  const output = importView(graph, 'group-statistic', outputBuffer, 'float32', groupCount);
  new GPUGroupAggregation({keys, values, mask, output, operation}).addToGraph(graph);
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'vector-group-statistic-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const result = await readFloat32(outputBuffer, groupCount);
  const {nodeOrder, logicalTransientBufferCount} = compiled.stats;
  compiled.destroy();
  keysVector.destroy();
  valuesVector.destroy();
  maskVector.destroy();
  for (const buffer of [...keyBuffers, ...valueBuffers, ...maskBuffers]) buffer.destroy();
  outputBuffer.destroy();
  return {values: result, nodeOrder, logicalTransientBufferCount};
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

async function runGridAggregation(
  device: Device,
  positionValues: Float32Array,
  weightValues: Float32Array,
  gridSize: readonly [number, number],
  bounds: readonly [number, number, number, number],
  gpuBounds = false,
  operation: GPUGridAggregationOperation = 'sum'
): Promise<number[]> {
  const positionsBuffer = createInputBuffer(device, positionValues);
  const weightsBuffer = createInputBuffer(device, weightValues);
  const outputBuffer = createOutputBuffer(device, gridSize[0] * gridSize[1]);
  const graph = new GPUCommandGraph(device);
  const positions = importView(
    graph,
    'positions',
    positionsBuffer,
    'float32x2',
    positionValues.length / 2
  );
  const weights = importView(graph, 'weights', weightsBuffer, 'float32', weightValues.length);
  const output = importView(graph, 'output', outputBuffer, 'float32', gridSize[0] * gridSize[1]);
  let aggregationBounds: typeof bounds | ReturnType<typeof importView> = bounds;
  let boundsBuffer: Buffer | undefined;
  if (gpuBounds) {
    boundsBuffer = createInputBuffer(device, Float32Array.from(bounds));
    aggregationBounds = importView(graph, 'bounds', boundsBuffer, 'float32x4', 1);
  }
  new GPUGridAggregation({
    positions,
    weights,
    output,
    operation,
    gridSize,
    bounds: aggregationBounds as never
  }).addToGraph(graph);
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'grid-aggregation-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const result = await readFloat32(outputBuffer, output.length);
  compiled.destroy();
  positionsBuffer.destroy();
  weightsBuffer.destroy();
  outputBuffer.destroy();
  boundsBuffer?.destroy();
  return result;
}

async function runVectorGridAggregation(
  device: Device,
  positionChunks: Float32Array[],
  weightChunks: Float32Array[],
  gridSize: readonly [number, number],
  bounds: readonly [number, number, number, number],
  operation: GPUGridAggregationOperation = 'sum'
): Promise<{values: number[]; nodeOrder: string[]; logicalTransientBufferCount: number}> {
  const positionBuffers = positionChunks.map(chunk => createInputBuffer(device, chunk));
  const weightBuffers = weightChunks.map(chunk => createInputBuffer(device, chunk));
  const positionsVector = new GPUVector({
    type: 'data',
    name: 'positions',
    format: 'float32x2',
    data: positionChunks.map(
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
  const weightsVector = new GPUVector({
    type: 'data',
    name: 'weights',
    format: 'float32',
    data: weightChunks.map(
      (chunk, chunkIndex) =>
        new GPUData({
          buffer: weightBuffers[chunkIndex],
          format: 'float32',
          length: chunk.length,
          ownsBuffer: false
        })
    ),
    ownsData: false
  });
  const outputBuffer = createOutputBuffer(device, gridSize[0] * gridSize[1]);
  const graph = new GPUCommandGraph(device);
  const positions = graph.importGPUVector('positions', positionsVector);
  const weights = graph.importGPUVector('weights', weightsVector);
  const output = importView(graph, 'output', outputBuffer, 'float32', gridSize[0] * gridSize[1]);
  new GPUGridAggregation({positions, weights, output, operation, gridSize, bounds}).addToGraph(
    graph
  );
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'vector-grid-aggregation-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const values = await readFloat32(outputBuffer, output.length);
  const {nodeOrder, logicalTransientBufferCount} = compiled.stats;
  compiled.destroy();
  positionsVector.destroy();
  weightsVector.destroy();
  for (const buffer of [...positionBuffers, ...weightBuffers]) buffer.destroy();
  outputBuffer.destroy();
  return {values, nodeOrder, logicalTransientBufferCount};
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

async function readFloat32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
}
