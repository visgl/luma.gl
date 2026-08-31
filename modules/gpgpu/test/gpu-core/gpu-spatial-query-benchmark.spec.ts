import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPUCommandGraph,
  runGPUSpatialQueryBenchmark,
  summarizeGPUSpatialBenchmarkSamples,
  type CompiledGPUCommandGraph,
  type GPUSpatialBenchmarkPath,
  type GPUSpatialBenchmarkStrategy
} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

it('summarizeGPUSpatialBenchmarkSamples reports nearest-rank distributions', () => {
  expect(summarizeGPUSpatialBenchmarkSamples([4, 1, 3, 2])).toEqual({
    minimum: 1,
    median: 2,
    percentile95: 4,
    maximum: 4
  });
  expect(
    () => summarizeGPUSpatialBenchmarkSamples([1, Number.NaN]),
    'invalid samples cannot produce misleading reports'
  ).toThrow(/finite non-negative/);
});

it('runGPUSpatialQueryBenchmark applies one oracle to scan, grid, and BVH paths', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }
  const compiledGraphs: CompiledGPUCommandGraph<void>[] = [];
  const makePath = (
    strategy: GPUSpatialBenchmarkStrategy,
    metrics: {candidateCount?: number; visitedCount?: number}
  ): GPUSpatialBenchmarkPath => {
    const graph = new GPUCommandGraph(device, {id: `benchmark-${strategy}`});
    const compiled = graph.compile();
    compiledGraphs.push(compiled);
    return {
      id: strategy,
      strategy,
      memoryByteLength: strategy === 'scan' ? 0 : 1024,
      encode: commandEncoder => compiled.encode(commandEncoder, {parameters: undefined}),
      readResult: async () => ({ids: [9, 2], ...metrics}),
      getNodePhase: () => undefined
    };
  };
  const paths = [
    makePath('scan', {}),
    makePath('grid', {candidateCount: 4}),
    makePath('bvh', {visitedCount: 7})
  ];
  const report = await runGPUSpatialQueryBenchmark(device, {
    paths,
    expectedIds: [2, 9],
    warmupIterations: 1,
    measuredIterations: 2,
    reuseCounts: [1, 4]
  });

  expect(report.expectedResultCount).toBe(2);
  expect(report.paths.length).toBe(3);
  expect(report.paths[1].candidateCount, 'grid candidate work is retained').toBe(4);
  expect(report.paths[2].visitedCount, 'BVH traversal work is retained').toBe(7);
  expect(report.paths[0].amortizedGPUTime, 'GPU costs require timestamped phases').toEqual([]);
  expect(Boolean(report.paths.every(path => path.cpuEncodeTimeMilliseconds.minimum >= 0))).toBe(
    true
  );

  let mismatchError: unknown;
  try {
    await runGPUSpatialQueryBenchmark(device, {
      paths: [{...paths[0], readResult: async () => ({ids: [2]})}, paths[1], paths[2]],
      expectedIds: [2, 9],
      warmupIterations: 1,
      measuredIterations: 1
    });
  } catch (error) {
    mismatchError = error;
  }
  expect(String(mismatchError), 'incorrect paths cannot report timings').toMatch(
    /shared CPU oracle/
  );

  const resourceCounts = device.statsManager.getStats('Resource Counts');
  const activeCommandEncodersBeforeFailure = resourceCounts.get('CommandEncoders Active').count;
  let encodeCount = 0;
  let encodingError: unknown;
  try {
    await runGPUSpatialQueryBenchmark(device, {
      paths: [
        {
          ...paths[0],
          id: 'failing-path',
          encode: commandEncoder => {
            encodeCount++;
            if (encodeCount === 2) {
              throw new Error('intentional measured encoding failure');
            }
            return paths[0].encode(commandEncoder);
          }
        },
        paths[1],
        paths[2]
      ],
      expectedIds: [2, 9],
      warmupIterations: 1,
      measuredIterations: 1
    });
  } catch (error) {
    encodingError = error;
  }
  expect(String(encodingError)).toMatch(/intentional measured encoding failure/);
  expect(
    resourceCounts.get('CommandEncoders Active').count,
    'a failed measured encoding releases its command encoder'
  ).toBe(activeCommandEncodersBeforeFailure);

  for (const compiled of compiledGraphs) compiled.destroy();
});
