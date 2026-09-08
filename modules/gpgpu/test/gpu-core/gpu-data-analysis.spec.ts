import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

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
} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUData, GPUVector, type GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';
import {getGPUGroupAggregationDispatchLayout} from '../../src/gpu-core/gpu-group-aggregation';

it('GPUReduction handles operations, formats, hierarchy, and invalid floats', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  expect(await runReduction(device, Uint32Array.from([0xffffffff, 2]), 'uint32', 'sum')).toEqual([
    1
  ]);
  expect(await runReduction(device, Uint32Array.from([7, 3, 9, 3]), 'uint32', 'min')).toEqual([3]);
  expect(await runReduction(device, Uint32Array.from([7, 3, 9, 3]), 'uint32', 'max')).toEqual([9]);
  expect(await runReduction(device, Uint32Array.from([7, 3, 9, 3]), 'uint32', 'extent')).toEqual([
    3, 9
  ]);
  expect(await runReduction(device, Int32Array.from([-7, 3, -2]), 'sint32', 'sum')).toEqual([-6]);
  expect(await runReduction(device, Int32Array.from([-7, 3, -2]), 'sint32', 'min')).toEqual([-7]);
  expect(await runReduction(device, Int32Array.from([-7, 3, -2]), 'sint32', 'max')).toEqual([3]);
  expect(await runReduction(device, Int32Array.from([-7, 3, -2]), 'sint32', 'extent')).toEqual([
    -7, 3
  ]);
  const hierarchical = Uint32Array.from({length: 513}, (_, index) => index % 11);
  expect(await runReduction(device, hierarchical, 'uint32', 'sum')).toEqual([2551]);

  const invalidFloats = Float32Array.from([Number.NaN, 4, Number.POSITIVE_INFINITY, -2]);
  const floatSum = await runReduction(device, Float32Array.from([0.1, 0.2, 0.3]), 'float32', 'sum');
  expect(
    Boolean(Math.abs(floatSum[0] - 0.6) < 1e-6),
    'float sum remains numerically accurate'
  ).toBe(true);
  expect(await runReduction(device, invalidFloats, 'float32', 'min')).toEqual([-2]);
  expect(await runReduction(device, invalidFloats, 'float32', 'max')).toEqual([4]);
  expect(await runReduction(device, invalidFloats, 'float32', 'extent')).toEqual([-2, 4]);
  expect(
    await runReduction(
      device,
      Float32Array.from([Number.NaN, Number.NEGATIVE_INFINITY]),
      'float32',
      'min'
    )
  ).toEqual([0]);
  expect(await runReduction(device, new Float32Array(0), 'float32', 'extent')).toEqual([0, 0]);
});

it('GPUReduction combines fixed-width GPUVector chunks', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  expect(
    await runVectorReduction(
      device,
      [Uint32Array.from([7, 3]), new Uint32Array(0), Uint32Array.from([9, 4])],
      'uint32',
      'sum'
    ),
    'sum combines non-empty chunks and skips empty chunks'
  ).toEqual([23]);
  expect(
    await runVectorReduction(
      device,
      [Uint32Array.from([7, 3]), Uint32Array.from([9, 4])],
      'uint32',
      'extent'
    ),
    'extent combines per-chunk minima and maxima'
  ).toEqual([3, 9]);
  expect(
    await runVectorReduction(
      device,
      [Float32Array.from([Number.NaN, Number.POSITIVE_INFINITY]), Float32Array.from([4, -2])],
      'float32',
      'min'
    ),
    'invalid-only chunks do not inject zero into a valid floating reduction'
  ).toEqual([-2]);
  expect(
    await runVectorReduction(
      device,
      [Float32Array.from([Number.NaN]), Float32Array.from([Number.NEGATIVE_INFINITY])],
      'float32',
      'max'
    ),
    'all-invalid floating chunks produce zero'
  ).toEqual([0]);
  expect(
    await runVectorReduction(device, [new Int32Array(0), new Int32Array(0)], 'sint32', 'extent'),
    'an all-empty vector produces zero'
  ).toEqual([0, 0]);
});

it('GPUHistogram supports literal, GPU, and automatic domains', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  expect(
    await runHistogram(device, Uint32Array.from([0, 1, 2, 3, 4, 4, 5]), 'uint32', 4, [0, 4]),
    'literal uint32 domain includes exact maximum in final bin'
  ).toEqual([1, 1, 1, 3]);
  expect(
    await runHistogram(
      device,
      Uint32Array.from([0, 0x7fffffff, 0x80000000, 0xffffffff]),
      'uint32',
      2,
      [0, 0xffffffff]
    ),
    'full-range uint32 bin boundaries stay in integer space'
  ).toEqual([2, 2]);
  expect(
    await runHistogram(
      device,
      Int32Array.from([-0x80000000, -1, 0, 0x7fffffff]),
      'sint32',
      2,
      [-0x80000000, 0x7fffffff]
    ),
    'full-range sint32 bin boundaries stay in integer space'
  ).toEqual([2, 2]);
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
  expect(
    await runHistogram(device, fullRangeValues, 'uint32', fullRangeBinCount, [0, 0xffffffff]),
    'wide integer multiply/divide matches an exact BigInt reference above 256 bins'
  ).toEqual(expectedFullRangeCounts);
  expect(
    await runHistogram(device, Int32Array.from([-2, -1, 0, 1, 2]), 'sint32', 2, [-2, 2], true),
    'GPU sint32 domain is accepted'
  ).toEqual([2, 3]);
  expect(
    await runHistogram(
      device,
      Float32Array.from([Number.NaN, -1, 0, 1, Number.POSITIVE_INFINITY]),
      'float32',
      2,
      'auto'
    ),
    'automatic float domain ignores non-finite values'
  ).toEqual([1, 2]);
  expect(
    await runHistogram(device, Uint32Array.from([7, 7, 8]), 'uint32', 3, [7, 7]),
    'degenerate domain counts matching values in bin zero'
  ).toEqual([2, 0, 0]);
  expect(
    await runHistogram(device, new Float32Array(0), 'float32', 4, 'auto'),
    'empty automatic histogram is cleared'
  ).toEqual([0, 0, 0, 0]);
  const globalValues = Uint32Array.from({length: 300}, (_, index) => index);
  expect(
    await runHistogram(device, globalValues, 'uint32', 300, [0, 299]),
    'more than 256 bins uses the global atomic path'
  ).toEqual(Array.from({length: 300}, () => 1));
});

it('GPUHistogram supports irregular literal and GPU-resident edges', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  expect(
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
    'literal edges use half-open intervals and include the final edge'
  ).toEqual([2, 2, 3]);
  expect(
    await runIrregularHistogram(
      device,
      Float32Array.from([0, 1e21, 2e21]),
      'float32',
      [0, 1e21, 2e21]
    ),
    'exponential float edges generate valid WGSL literals'
  ).toEqual([1, 2]);
  expect(
    await runIrregularHistogram(
      device,
      Uint32Array.from([0, 1, 9, 10, 99, 100]),
      'uint32',
      [0, 10, 100]
    ),
    'integer edge comparisons remain exact'
  ).toEqual([3, 3]);
  expect(
    await runIrregularHistogram(
      device,
      Int32Array.from([-10, -1, 0, 9, 10]),
      'sint32',
      [-10, 0, 10],
      true
    ),
    'GPU-resident signed edges are accepted'
  ).toEqual([2, 3]);
  expect(
    await runIrregularHistogram(
      device,
      Uint32Array.from([0, 1, 5, 10, 100]),
      'uint32',
      [0, 10, 5, 100],
      true
    ),
    'unordered GPU-resident edges suppress accumulation without a readback'
  ).toEqual([0, 0, 0]);
  expect(
    await runIrregularHistogram(
      device,
      Uint32Array.from([1, 3, 4, 7]),
      'uint32',
      [0, 5, 10],
      true,
      [0, 2, 10]
    ),
    'rewriting GPU edges changes bins without recompiling the graph'
  ).toEqual([1, 3]);
  expect(
    await runIrregularHistogram(device, new Float32Array(0), 'float32', [0, 1, 10]),
    'an empty irregular histogram is cleared'
  ).toEqual([0, 0]);

  const globalEdges = Uint32Array.from({length: 301}, (_, index) => index);
  const globalValues = Uint32Array.from({length: 301}, (_, index) => index);
  expect(
    await runIrregularHistogram(device, globalValues, 'uint32', globalEdges, true),
    'GPU edges support more than 256 bins through the global atomic path'
  ).toEqual([...Array.from({length: 299}, () => 1), 2]);
});

it('GPUHistogram reads interleaved scalar columns with explicit edges', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const inputBuffer = createInputBuffer(
    device,
    Float32Array.from([100, 0.25, 200, 1.5, 300, 7.5, 400, 12])
  );
  const outputBuffer = createOutputBuffer(device, 3);
  const graph = new GPUCommandGraph(device);
  const inputHandle = graph.importBuffer(
    {
      id: 'interleaved-histogram-input',
      byteLength: inputBuffer.byteLength,
      usage: inputBuffer.usage
    },
    inputBuffer
  );
  const input = graph.createDataView(inputHandle, {
    format: 'float32',
    length: 4,
    byteOffset: 4,
    byteStride: 8
  });
  const output = importView(graph, 'interleaved-histogram-output', outputBuffer, 'uint32', 3);
  new GPUHistogram({input, output, edges: [0, 1, 10, 20]}).addToGraph(graph);

  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'interleaved-histogram-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());

  expect(await readUint32(outputBuffer, 3)).toEqual([1, 2, 1]);
  compiled.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
});

it('GPUHistogram accumulates fixed-width GPUVector chunks after one clear', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const literal = await runVectorHistogram(
    device,
    [Uint32Array.from([0, 1]), new Uint32Array(0), Uint32Array.from([2, 3, 3])],
    'uint32',
    4,
    [0, 3]
  );
  expect(literal.counts, 'every non-empty chunk contributes counts').toEqual([1, 1, 1, 2]);
  expect(
    literal.nodeOrder,
    'one clear precedes ordered per-chunk accumulation and empty chunks keep their source index'
  ).toEqual(['gpu-histogram-clear', 'gpu-histogram-chunk-0-local', 'gpu-histogram-chunk-2-local']);
  expect(
    literal.logicalTransientBufferCount,
    'a literal-domain histogram does not pack or concatenate input chunks'
  ).toBe(0);

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
  expect(
    automatic.counts,
    'automatic domain reduction spans all chunks and ignores non-finite values'
  ).toEqual([1, 1, 0, 2]);

  const globalValues = [
    Uint32Array.from({length: 150}, (_, index) => index),
    Uint32Array.from({length: 150}, (_, index) => index + 150)
  ];
  const global = await runVectorHistogram(device, globalValues, 'uint32', 300, [0, 299]);
  expect(global.counts, 'the global atomic path accumulates every chunk').toEqual(
    Array.from({length: 300}, () => 1)
  );
});

it('GPUHistogram preserves vector chunks with irregular edges', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const result = await runIrregularVectorHistogram(
    device,
    [Float32Array.from([0, 0.5]), new Float32Array(0), Float32Array.from([1, 9.5, 10, 100])],
    'float32',
    [0, 1, 10, 100]
  );
  expect(result.counts, 'every non-empty source chunk contributes counts').toEqual([2, 2, 2]);
  expect(
    result.nodeOrder,
    'edge validation and one clear precede ordered per-chunk accumulation'
  ).toEqual([
    'gpu-histogram-validate-edges',
    'gpu-histogram-clear',
    'gpu-histogram-chunk-0-edges-local',
    'gpu-histogram-chunk-2-edges-local'
  ]);
  expect(
    result.logicalTransientBufferCount,
    'GPU edges use only one graph-owned ordering flag'
  ).toBe(1);
});

it('GPUHistogram clears counts for every graph encoding and composes with reduction', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(await readUint32(countsBuffer, 4), 'second encoding resets output').toEqual([1, 2, 1, 3]);
  expect(await readUint32(totalBuffer, 1), 'reduced count equals accepted rows').toEqual([7]);
  compiled.destroy();
  expect(Boolean(inputBuffer.destroyed), 'compiled graph preserves imported input').toBe(false);
  expect(Boolean(countsBuffer.destroyed), 'compiled graph preserves imported output').toBe(false);
  inputBuffer.destroy();
  countsBuffer.destroy();
  totalBuffer.destroy();
});

it('GPUGroupAggregation counts dense keys with optional dynamic selection', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const keys = Uint32Array.from([0, 1, 3, 4, 0xffffffff, 1, 0]);
  expect(
    await runGroupAggregation(device, keys, 4),
    'dense keys count into output rows and out-of-range keys are ignored'
  ).toEqual([2, 2, 0, 1]);
  expect(
    await runGroupAggregation(device, keys, 4, Uint32Array.from([7, 0, 1, 1, 1, 1, 0])),
    'nonzero mask rows contribute to their groups'
  ).toEqual([1, 1, 0, 1]);
  expect(
    await runGroupAggregation(
      device,
      keys,
      4,
      Uint32Array.from([7, 0, 1, 1, 1, 1, 0]),
      Uint32Array.from({length: keys.length}, () => 1)
    ),
    'rewriting the selection changes counts without recompiling the graph'
  ).toEqual([2, 2, 0, 1]);
  expect(
    await runGroupAggregation(device, new Uint32Array(0), 3),
    'empty input still clears every group'
  ).toEqual([0, 0, 0]);

  const globalKeys = Uint32Array.from({length: 301}, (_, index) => index);
  expect(
    await runGroupAggregation(device, globalKeys, 300),
    'more than 256 groups uses global atomics and ignores key 300'
  ).toEqual(Array.from({length: 300}, () => 1));
});

it('GPUGroupAggregation plans bounded multidimensional dispatches', () => {
  expect(
    getGPUGroupAggregationDispatchLayout(5 * 256, 4),
    'workgroups spill from x into y at the device limit'
  ).toEqual({x: 4, y: 2, z: 1});
  expect(
    getGPUGroupAggregationDispatchLayout(20 * 256, 4),
    'larger chunks spill into the third dimension'
  ).toEqual({x: 4, y: 4, z: 2});
  expect(
    () => getGPUGroupAggregationDispatchLayout((4 * 4 * 4 + 1) * 256, 4),
    'chunks beyond the full 3D device limit are rejected before encoding'
  ).toThrow(/exceeding the 3D dispatch limit/);
});

it('GPUGroupAggregation computes filtered floating-point group statistics', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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

  expect(sum, 'sum accepts finite selected values with valid keys').toEqual([3, 5, -3, 0]);
  expect(minimum.slice(0, 3), 'minimum retains each smallest value').toEqual([-2, 1, -3]);
  expect(
    Boolean(Number.isNaN(minimum[3])),
    'minimum marks a group with no finite values as NaN'
  ).toBe(true);
  expect(maximum.slice(0, 3), 'maximum retains each largest value').toEqual([5, 4, -3]);
  expect(
    Boolean(Number.isNaN(maximum[3])),
    'maximum marks a group with no finite values as NaN'
  ).toBe(true);
  expect(mean.slice(0, 3), 'mean divides sums by accepted values').toEqual([1.5, 2.5, -3]);
  expect(Boolean(Number.isNaN(mean[3])), 'mean marks a group with no finite values as NaN').toBe(
    true
  );

  const emptyMean = await runGroupStatistic(
    device,
    new Uint32Array(0),
    new Float32Array(0),
    3,
    'mean'
  );
  expect(Boolean(emptyMean.every(Number.isNaN)), 'empty means finalize every group to NaN').toBe(
    true
  );
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
  expect(
    Boolean(Object.is(minimumZero[0], -0)),
    'minimum preserves the ordered-float signed-zero contract'
  ).toBe(true);
  expect(
    Boolean(Object.is(maximumZero[0], 0)),
    'maximum preserves the ordered-float signed-zero contract'
  ).toBe(true);
});

it('GPUGroupAggregation preserves aligned vector chunks', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const result = await runVectorGroupAggregation(
    device,
    [Uint32Array.from([0, 1]), new Uint32Array(0), Uint32Array.from([1, 3, 9])],
    [Uint32Array.from([1, 0]), new Uint32Array(0), Uint32Array.from([1, 1, 1])],
    4
  );
  expect(result.counts, 'aligned non-empty chunks share dense counts').toEqual([1, 1, 0, 1]);
  expect(result.nodeOrder, 'one clear precedes ordered per-chunk accumulation').toEqual([
    'gpu-group-aggregation-clear',
    'gpu-group-aggregation-chunk-0-local',
    'gpu-group-aggregation-chunk-2-local'
  ]);
  expect(
    result.logicalTransientBufferCount,
    'group counting does not pack chunks or allocate scratch storage'
  ).toBe(0);

  const mean = await runVectorGroupStatistic(
    device,
    [Uint32Array.from([0, 1]), new Uint32Array(0), Uint32Array.from([0, 1, 8])],
    [Float32Array.from([1, 3]), new Float32Array(0), Float32Array.from([5, 7, 100])],
    [Uint32Array.from([1, 0]), new Uint32Array(0), Uint32Array.from([1, 1, 1])],
    2,
    'mean'
  );
  expect(mean.values, 'weighted groups combine aligned selected chunks').toEqual([3, 7]);
  expect(
    mean.nodeOrder,
    'weighted vector aggregation initializes and finalizes once around non-empty chunks'
  ).toEqual([
    'gpu-group-aggregation-initialize',
    'gpu-group-aggregation-chunk-0-mean',
    'gpu-group-aggregation-chunk-2-mean',
    'gpu-group-aggregation-finalize'
  ]);
  expect(mean.logicalTransientBufferCount, 'mean owns one transient group-count buffer').toBe(1);
});

it('GPUGridBinning handles literal/GPU bounds, boundaries, and both atomic paths', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }
  const positions = Float32Array.from([0, 0, 1, 0, 0, 1, 2, 2, 2, 2, -1, 0, Number.NaN, 1]);
  expect(
    await runGrid(device, positions, [2, 2], [0, 0, 2, 2]),
    'row-major cells include exact maximum boundaries'
  ).toEqual([1, 1, 1, 2]);
  expect(
    await runGrid(device, positions, [2, 2], [0, 0, 2, 2], true),
    'GPU bounds view is accepted'
  ).toEqual([1, 1, 1, 2]);
  const globalPositions = new Float32Array(17 * 17 * 2);
  for (let row = 0; row < 17; row++) {
    for (let column = 0; column < 17; column++) {
      const index = row * 17 + column;
      globalPositions[index * 2] = column;
      globalPositions[index * 2 + 1] = row;
    }
  }
  expect(
    await runGrid(device, globalPositions, [17, 17], [0, 0, 16, 16]),
    'more than 256 cells uses the global atomic path'
  ).toEqual(Array.from({length: 289}, () => 1));
  expect(
    await runGrid(device, new Float32Array(0), [2, 2], [0, 0, 1, 1]),
    'empty grid is cleared'
  ).toEqual([0, 0, 0, 0]);
});

it('GPUGridBinning clears once and accumulates GPUVector chunks in order', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const result = await runVectorGrid(
    device,
    [Float32Array.from([0, 0, 1, 0]), new Float32Array(0), Float32Array.from([0, 1, 2, 2, 2, 2])],
    [2, 2],
    [0, 0, 2, 2]
  );
  expect(result.counts, 'every non-empty position chunk contributes').toEqual([1, 1, 1, 2]);
  expect(
    result.nodeOrder,
    'one clear precedes ordered accumulation and empty chunks keep their source index'
  ).toEqual([
    'gpu-grid-binning-clear',
    'gpu-grid-binning-chunk-0-local',
    'gpu-grid-binning-chunk-2-local'
  ]);
  expect(result.logicalTransientBufferCount, 'position chunks are not packed or concatenated').toBe(
    0
  );
});

it('GPUGridAggregation sums finite weights with float32 atomics', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const positions = Float32Array.from([0, 0, 1, 0, 0, 1, 2, 2, 2, 2, -1, 0, Number.NaN, 1, 1, 1]);
  const weights = Float32Array.from([1.5, -2, 3, 4, 0.25, 100, 100, Number.POSITIVE_INFINITY]);
  expect(
    await runGridAggregation(device, positions, weights, [2, 2], [0, 0, 2, 2]),
    'finite in-bounds weights contribute to row-major cell sums'
  ).toEqual([1.5, -2, 3, 4.25]);
  expect(
    await runGridAggregation(device, positions, weights, [2, 2], [0, 0, 2, 2], true),
    'GPU-resident bounds preserve weighted sums'
  ).toEqual([1.5, -2, 3, 4.25]);
  expect(
    await runGridAggregation(
      device,
      new Float32Array(0),
      new Float32Array(0),
      [2, 2],
      [0, 0, 1, 1]
    ),
    'empty inputs still clear every sum'
  ).toEqual([0, 0, 0, 0]);
  expect(
    await runGridAggregation(
      device,
      Float32Array.from([0, 0, 0, 0]),
      Float32Array.from([3.402823466e38, 3.402823466e38]),
      [1, 1],
      [0, 0, 0, 0]
    ),
    'finite contributions may overflow their float32 cell sum'
  ).toEqual([Number.POSITIVE_INFINITY]);
});

it('GPUGridAggregation computes minimum, maximum, and mean cell statistics', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const positions = Float32Array.from([0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1]);
  const weights = Float32Array.from([5, -2, 4, -3, Number.NaN, Number.POSITIVE_INFINITY]);
  const run = (operation: GPUGridAggregationOperation) =>
    runGridAggregation(device, positions, weights, [2, 2], [0, 0, 1, 1], false, operation);
  const mean = await run('mean');
  const minimum = await run('min');
  const maximum = await run('max');

  expect(minimum.slice(0, 3), 'minimum retains the smallest finite weight').toEqual([-2, 4, -3]);
  expect(Boolean(Number.isNaN(minimum[3])), 'minimum marks an empty cell with NaN').toBe(true);
  expect(maximum.slice(0, 3), 'maximum retains the largest finite weight').toEqual([5, 4, -3]);
  expect(Boolean(Number.isNaN(maximum[3])), 'maximum marks an empty cell with NaN').toBe(true);
  expect(mean.slice(0, 3), 'mean divides the float32 sum by accepted rows').toEqual([1.5, 4, -3]);
  expect(Boolean(Number.isNaN(mean[3])), 'mean marks an empty cell with NaN').toBe(true);

  const emptyMean = await runGridAggregation(
    device,
    new Float32Array(0),
    new Float32Array(0),
    [2, 2],
    [0, 0, 1, 1],
    false,
    'mean'
  );
  expect(
    Boolean(emptyMean.every(Number.isNaN)),
    'an empty mean aggregation finalizes every cell to NaN'
  ).toBe(true);

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
  expect(
    Boolean(Object.is(minimumZero[0], -0)),
    'minimum uses the ordered-float signed-zero contract'
  ).toBe(true);
  expect(
    Boolean(Object.is(maximumZero[0], 0)),
    'maximum uses the ordered-float signed-zero contract'
  ).toBe(true);
});

it('GPUGridAggregation preserves paired GPUVector chunk topology', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const result = await runVectorGridAggregation(
    device,
    [Float32Array.from([0, 0, 1, 0]), new Float32Array(0), Float32Array.from([0, 1, 2, 2])],
    [Float32Array.from([1.25, 2.5]), new Float32Array(0), Float32Array.from([-3, 4.75])],
    [2, 2],
    [0, 0, 2, 2]
  );
  expect(result.values, 'aligned chunks accumulate in source order').toEqual([1.25, 2.5, -3, 4.75]);
  expect(result.nodeOrder, 'one clear precedes each non-empty aligned chunk').toEqual([
    'gpu-grid-aggregation-clear',
    'gpu-grid-aggregation-chunk-0-sum',
    'gpu-grid-aggregation-chunk-2-sum'
  ]);
  expect(result.logicalTransientBufferCount, 'paired chunks are not packed or concatenated').toBe(
    0
  );

  const mean = await runVectorGridAggregation(
    device,
    [Float32Array.from([0, 0, 0, 0]), new Float32Array(0), Float32Array.from([0, 0])],
    [Float32Array.from([1, 3]), new Float32Array(0), Float32Array.from([5])],
    [1, 1],
    [0, 0, 0, 0],
    'mean'
  );
  expect(mean.values, 'mean combines sums and counts across aligned chunks').toEqual([3]);
  expect(
    mean.nodeOrder,
    'mean initializes once, accumulates every non-empty chunk, and finalizes once'
  ).toEqual([
    'gpu-grid-aggregation-initialize',
    'gpu-grid-aggregation-chunk-0-mean',
    'gpu-grid-aggregation-chunk-2-mean',
    'gpu-grid-aggregation-finalize'
  ]);
  expect(mean.logicalTransientBufferCount, 'mean owns one transient cell-count buffer').toBe(1);
});

it('GPU data analysis primitives validate layouts and ownership', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(
    () => new GPUReduction({input, output: two, operation: 'sum'}),
    'scalar reduction requires one output row'
  ).toThrow(/must contain 1 row/);
  expect(
    () => new GPUReduction({input, output: one, operation: 'extent'}),
    'extent requires two output rows'
  ).toThrow(/must contain 2 row/);
  expect(
    () => new GPUHistogram({input, output: two, domain: [2, 1]}),
    'inverted literal histogram domain is rejected'
  ).toThrow(/finite \[min, max\]/);
  expect(
    () => new GPUHistogram({input, output: two, edges: [0, 1]}),
    'literal histogram edges must match the output size'
  ).toThrow(/output.length \+ 1/);
  expect(
    () => new GPUHistogram({input, output: two, edges: [0, 1, 1]}),
    'literal histogram edges must be strictly increasing'
  ).toThrow(/strictly increasing/);
  const floatInput = graph.createDataView(inputHandle, {format: 'float32', length: 4});
  expect(
    () =>
      new GPUHistogram({
        input: floatInput,
        output: two,
        edges: [16_777_216, 16_777_217, 16_777_218]
      }),
    'literal histogram edges must remain ordered after float32 conversion'
  ).toThrow(/strictly increasing/);
  expect(
    () =>
      new GPUGroupAggregation({
        keys: input,
        output: two,
        operation: 'median' as GPUGroupAggregationOperation
      }),
    'unsupported group statistics are rejected'
  ).toThrow(/operation must be count/);
  expect(
    () =>
      new GPUGroupAggregation({
        keys: input,
        mask: graph.createDataView(inputHandle, {format: 'uint32', length: 3}),
        output: two
      }),
    'group keys and masks require row alignment'
  ).toThrow(/lengths must match/);
  expect(
    () =>
      new GPUGroupAggregation({
        keys: input,
        output: graph.createDataView(outputHandle, {format: 'uint32', length: 0})
      }),
    'group output must define a nonempty key range'
  ).toThrow(/at least one group/);
  expect(
    () =>
      new GPUGroupAggregation({
        keys: input,
        output: graph.createDataView(inputHandle, {format: 'uint32', length: 2})
      }),
    'group output cannot alias its keys'
  ).toThrow(/separate buffers/);
  const floatGroupOutput = graph.createDataView(outputHandle, {format: 'float32', length: 2});
  expect(
    () =>
      new GPUGroupAggregation({
        keys: input,
        values: graph.createDataView(inputHandle, {format: 'float32', length: 3}),
        output: floatGroupOutput,
        operation: 'sum'
      }),
    'group keys and floating-point values require row alignment'
  ).toThrow(/lengths must match/);
  expect(
    () =>
      new GPUGroupAggregation({
        keys: input,
        output: floatGroupOutput,
        operation: 'mean'
      } as never),
    'weighted group statistics require an aligned value input'
  ).toThrow(/requires values/);
  const positions = graph.createDataView(inputHandle, {format: 'float32x2', length: 4});
  expect(
    () => new GPUGridBinning({positions, output: two, gridSize: [2, 2], bounds: [0, 0, 1, 1]}),
    'grid output layout is validated'
  ).toThrow(/output.length/);
  const weights = graph.createDataView(inputHandle, {format: 'float32', length: 3});
  const floatOutput = graph.createDataView(outputHandle, {format: 'float32', length: 4});
  expect(
    () =>
      new GPUGridAggregation({
        positions,
        weights,
        output: floatOutput,
        gridSize: [2, 2],
        bounds: [0, 0, 1, 1]
      }),
    'weighted grid inputs require row alignment'
  ).toThrow(/same number of rows/);
  expect(
    () =>
      new GPUGridAggregation({
        positions,
        weights: graph.createDataView(inputHandle, {format: 'float32', length: 4}),
        output: floatOutput,
        operation: 'median' as GPUGridAggregationOperation,
        gridSize: [2, 2],
        bounds: [0, 0, 1, 1]
      }),
    'weighted grid operations only support sum'
  ).toThrow(/operation must be sum/);
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
