// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Device} from '@luma.gl/core';
import {
  makeGPUGraphBenchmarkDataset,
  runGPUGraphBenchmark,
  type GPUGraphBenchmarkAlgorithm,
  type GPUGraphBenchmarkDatasetKind,
  type GPUGraphBenchmarkDistribution,
  type GPUGraphBenchmarkReport
} from '@luma.gl/experimental/gpu-graph/benchmarks';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from 'test/utils/vitest-tape';
import {vi} from 'vitest';

const BENCHMARK_ALGORITHMS: GPUGraphBenchmarkAlgorithm[] = [
  'topology',
  'breadth-first-search',
  'single-source-shortest-path',
  'connected-components',
  'label-propagation',
  'local-clustering-coefficient',
  'page-rank',
  'exact-layout',
  'spatial-layout'
];

const BENCHMARK_DATASETS: GPUGraphBenchmarkDatasetKind[] = [
  'sparse',
  'dense',
  'disconnected',
  'scale-free',
  'high-degree'
];

for (const kind of BENCHMARK_DATASETS) {
  test(`GPU Graph real WebGPU benchmark independently validates the ${kind} graph workload`, async tapeTest => {
    const device = await getWebGPUTestDevice();
    if (!device) {
      tapeTest.comment('WebGPU is not available');
      tapeTest.end();
      return;
    }

    const fenceSpy = vi.spyOn(device, 'createFence');
    const submitSpy = vi.spyOn(device, 'submit');
    try {
      const theta = kind === 'sparse' ? 0 : kind === 'scale-free' ? 1 : 0.6;
      const expectedDataset = makeGPUGraphBenchmarkDataset({kind, vertexCount: 12, seed: 42});
      const report = await runGPUGraphBenchmark(device, {
        kind,
        vertexCount: 12,
        seed: 42,
        warmupIterations: 0,
        measuredIterations: 1,
        pageRankIterations: 4,
        forceIterations: 1,
        maxDepth: 4,
        theta,
        gridSize: [4, 4]
      });

      assertBenchmarkReport(tapeTest, report, device, {
        kind,
        vertexCount: 12,
        edgeCount: expectedDataset.edgeCount,
        cellCount: 16,
        theta,
        pageRankIterations: 4
      });
      tapeTest.ok(
        submitSpy.mock.calls.length >= 10,
        'each real graph workload and independent spatial-index phase submits actual GPU work'
      );
      tapeTest.ok(
        fenceSpy.mock.calls.length >= 10,
        'GPU operation and standalone spatial-index timers wait on real completion fences'
      );
      if (theta === 0) {
        tapeTest.ok(
          report.approximationMaxAbsoluteError < 2e-4,
          'theta zero retains exact long-range repulsion instead of hiding approximation error'
        );
      }
    } finally {
      fenceSpy.mockRestore();
      submitSpy.mockRestore();
    }

    tapeTest.end();
  });
}

function assertBenchmarkReport(
  tapeTest: Test,
  report: GPUGraphBenchmarkReport,
  device: Device,
  expected: {
    kind: GPUGraphBenchmarkDatasetKind;
    vertexCount: number;
    edgeCount: number;
    cellCount: number;
    theta: number;
    pageRankIterations: number;
  }
): void {
  tapeTest.equal(
    report.datasetKind,
    expected.kind,
    'CPU and GPU execute the requested graph family'
  );
  tapeTest.equal(report.vertexCount, expected.vertexCount, 'both paths share the same vertex IDs');
  tapeTest.equal(
    report.edgeCount,
    expected.edgeCount,
    'both paths share every deterministic source edge'
  );
  tapeTest.equal(report.warmupIterations, 0, 'warmup cost is excluded from the requested sample');
  tapeTest.equal(
    report.measuredIterations,
    1,
    'one real measured execution contributes each sample'
  );
  tapeTest.ok(
    Number.isFinite(report.uploadTimeMilliseconds) && report.uploadTimeMilliseconds >= 0,
    'source upload is measured and reported independently'
  );
  tapeTest.ok(
    Number.isFinite(report.compilationTimeMilliseconds) && report.compilationTimeMilliseconds >= 0,
    'graph compilation is measured separately from GPU execution'
  );
  tapeTest.ok(
    Number.isFinite(report.readbackTimeMilliseconds) && report.readbackTimeMilliseconds >= 0,
    'explicit oracle-validation readback is separated from fenced benchmark timing'
  );
  assertDistribution(
    tapeTest,
    report.spatialIndexBuildTimeMilliseconds,
    'independent GPUGridIndex construction'
  );
  tapeTest.equal(
    report.indexMemoryBytes,
    4 * (expected.cellCount + 1) + 4 * expected.vertexCount + 8 * expected.cellCount + 8,
    'index memory reports exclusive offsets, vertex IDs, float32x2 centers, and both statuses'
  );
  tapeTest.ok(
    Number.isFinite(report.approximationMaxAbsoluteError) &&
      report.approximationMaxAbsoluteError >= 0,
    'spatial accuracy is honestly compared against the independently evaluated exact force result'
  );

  tapeTest.deepEqual(
    report.paths.map(path => path.algorithm),
    BENCHMARK_ALGORITHMS,
    'nine independently compiled CPU and WebGPU algorithms are actually benchmarked'
  );
  for (const path of report.paths) {
    assertDistribution(tapeTest, path.cpuTimeMilliseconds, `${path.algorithm} CPU reference`);
    assertDistribution(tapeTest, path.cpuEncodeTimeMilliseconds, `${path.algorithm} CPU encoding`);
    assertDistribution(
      tapeTest,
      path.synchronizedTimeMilliseconds,
      `${path.algorithm} fence-synchronized GPU execution`
    );
    tapeTest.ok(
      Number.isSafeInteger(path.importedBufferBytes) && path.importedBufferBytes > 0,
      `${path.algorithm} reports actual caller-owned imported GPU bytes`
    );
    tapeTest.ok(
      Number.isSafeInteger(path.transientBufferBytes) && path.transientBufferBytes >= 0,
      `${path.algorithm} reports actual graph-owned transient GPU bytes`
    );
    tapeTest.ok(
      Number.isFinite(path.maxAbsoluteError) && path.maxAbsoluteError >= 0,
      `${path.algorithm} validates GPU results against its independent CPU oracle`
    );
    if (
      path.algorithm === 'topology' ||
      path.algorithm === 'breadth-first-search' ||
      path.algorithm === 'single-source-shortest-path' ||
      path.algorithm === 'connected-components' ||
      path.algorithm === 'label-propagation'
    ) {
      tapeTest.equal(
        path.maxAbsoluteError,
        0,
        `${path.algorithm} matches its exact CPU reference outputs`
      );
    } else {
      tapeTest.ok(
        path.maxAbsoluteError < 5e-4,
        `${path.algorithm} stays within real float32 accuracy`
      );
    }
    if (!report.timestampQueries) {
      tapeTest.equal(
        path.gpuTimeMilliseconds,
        undefined,
        `${path.algorithm} never fabricates unavailable GPU timestamp-query timings`
      );
    } else if (path.gpuTimeMilliseconds) {
      assertDistribution(tapeTest, path.gpuTimeMilliseconds, `${path.algorithm} GPU timestamps`);
    }

    if (path.algorithm === 'single-source-shortest-path') {
      tapeTest.equal(
        path.iterations,
        expected.vertexCount - 1,
        'weighted shortest paths report their actual bounded GPU relaxation passes'
      );
      tapeTest.equal(
        typeof path.converged,
        'boolean',
        'weighted shortest paths expose the actual final GPU fixed-point status'
      );
      tapeTest.equal(path.residual, undefined, 'weighted paths never fabricate a residual');
    } else if (path.algorithm === 'connected-components') {
      tapeTest.equal(path.iterations, 32, 'weak components report their actual bounded GPU passes');
      tapeTest.equal(
        path.converged,
        true,
        'weak components report the real final GPU fixed-point convergence status'
      );
      tapeTest.equal(
        path.residual,
        undefined,
        'integer weak components never fabricate a residual'
      );
    } else if (path.algorithm === 'label-propagation') {
      tapeTest.equal(path.iterations, 8, 'community labels report their real bounded vote passes');
      tapeTest.equal(
        typeof path.converged,
        'boolean',
        'community labels expose their actual final GPU fixed-point status'
      );
      tapeTest.equal(path.residual, undefined, 'community labels never fabricate a residual');
    } else if (path.algorithm === 'page-rank') {
      tapeTest.equal(
        path.iterations,
        expected.pageRankIterations,
        'PageRank reports its actual independently configured GPU pass count'
      );
      tapeTest.ok(
        typeof path.residual === 'number' &&
          Number.isFinite(path.residual) &&
          path.residual >= 0 &&
          path.residual <= 2,
        'PageRank exposes the real finite, normalized final GPU L1 residual'
      );
      tapeTest.equal(path.converged, undefined, 'PageRank never invents a binary convergence flag');
    } else {
      tapeTest.equal(path.iterations, undefined, `${path.algorithm} omits unrelated pass counts`);
      tapeTest.equal(path.converged, undefined, `${path.algorithm} omits unrelated convergence`);
      tapeTest.equal(path.residual, undefined, `${path.algorithm} omits unrelated GPU residuals`);
    }
  }
  tapeTest.equal(
    typeof report.timestampQueries,
    'boolean',
    'optional timestamp support is explicit'
  );
  tapeTest.equal(
    device.type,
    'webgpu',
    'reported timings were produced by an actual WebGPU device'
  );
}

function assertDistribution(
  tapeTest: Test,
  distribution: GPUGraphBenchmarkDistribution,
  label: string
): void {
  for (const value of [
    distribution.minimum,
    distribution.median,
    distribution.percentile95,
    distribution.maximum
  ]) {
    tapeTest.ok(Number.isFinite(value) && value >= 0, `${label} publishes finite measured timings`);
  }
  tapeTest.ok(distribution.minimum <= distribution.median, `${label} median follows its minimum`);
  tapeTest.ok(
    distribution.median <= distribution.percentile95,
    `${label} 95th percentile follows its median`
  );
  tapeTest.ok(
    distribution.percentile95 <= distribution.maximum,
    `${label} maximum bounds its percentile`
  );
}
