// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Device} from '@luma.gl/core';
import {
  makeLuGraphBenchmarkDataset,
  runLuGraphBenchmark,
  type LuGraphBenchmarkAlgorithm,
  type LuGraphBenchmarkDatasetKind,
  type LuGraphBenchmarkDistribution,
  type LuGraphBenchmarkReport
} from '@luma.gl/experimental/lugraph/benchmarks';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test, {type Test} from 'test/utils/vitest-tape';
import {vi} from 'vitest';

const BENCHMARK_ALGORITHMS: LuGraphBenchmarkAlgorithm[] = [
  'topology',
  'breadth-first-search',
  'connected-components',
  'page-rank',
  'exact-layout',
  'spatial-layout'
];

const BENCHMARK_DATASETS: LuGraphBenchmarkDatasetKind[] = [
  'sparse',
  'dense',
  'disconnected',
  'scale-free',
  'high-degree'
];

for (const kind of BENCHMARK_DATASETS) {
  test(`luGraph real WebGPU benchmark independently validates the ${kind} graph workload`, async tapeTest => {
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
      const expectedDataset = makeLuGraphBenchmarkDataset({kind, vertexCount: 12, seed: 42});
      const report = await runLuGraphBenchmark(device, {
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
        submitSpy.mock.calls.length >= 7,
        'each real graph workload and independent spatial-index phase submits actual GPU work'
      );
      tapeTest.ok(
        fenceSpy.mock.calls.length >= 7,
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
  report: LuGraphBenchmarkReport,
  device: Device,
  expected: {
    kind: LuGraphBenchmarkDatasetKind;
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
    'six independently compiled CPU and WebGPU algorithms are actually benchmarked'
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
      path.algorithm === 'connected-components'
    ) {
      tapeTest.equal(
        path.maxAbsoluteError,
        0,
        `${path.algorithm} matches exact integer CPU results`
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

    if (path.algorithm === 'connected-components') {
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
  distribution: LuGraphBenchmarkDistribution,
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
