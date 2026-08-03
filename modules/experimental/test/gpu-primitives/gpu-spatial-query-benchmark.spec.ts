// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  GPUCommandGraph,
  runGPUSpatialQueryBenchmark,
  summarizeGPUSpatialBenchmarkSamples,
  type CompiledGPUCommandGraph,
  type GPUSpatialBenchmarkPath,
  type GPUSpatialBenchmarkStrategy
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('summarizeGPUSpatialBenchmarkSamples reports nearest-rank distributions', t => {
  t.deepEqual(summarizeGPUSpatialBenchmarkSamples([4, 1, 3, 2]), {
    minimum: 1,
    median: 2,
    percentile95: 4,
    maximum: 4
  });
  t.throws(
    () => summarizeGPUSpatialBenchmarkSamples([1, Number.NaN]),
    /finite non-negative/,
    'invalid samples cannot produce misleading reports'
  );
  t.end();
});

test('runGPUSpatialQueryBenchmark applies one oracle to scan, grid, and BVH paths', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
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

  t.equal(report.expectedResultCount, 2);
  t.equal(report.paths.length, 3);
  t.equal(report.paths[1].candidateCount, 4, 'grid candidate work is retained');
  t.equal(report.paths[2].visitedCount, 7, 'BVH traversal work is retained');
  t.deepEqual(report.paths[0].amortizedGPUTime, [], 'GPU costs require timestamped phases');
  t.ok(report.paths.every(path => path.cpuEncodeTimeMilliseconds.minimum >= 0));

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
  t.match(String(mismatchError), /shared CPU oracle/, 'incorrect paths cannot report timings');

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
  t.match(String(encodingError), /intentional measured encoding failure/);
  t.equal(
    resourceCounts.get('CommandEncoders Active').count,
    activeCommandEncodersBeforeFailure,
    'a failed measured encoding releases its command encoder'
  );

  for (const compiled of compiledGraphs) compiled.destroy();
  t.end();
});
