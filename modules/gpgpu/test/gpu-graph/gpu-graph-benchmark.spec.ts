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
} from '@luma.gl/gpgpu/gpu-graph/benchmarks';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, it, vi} from 'vitest';

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
  it(`GPU Graph real WebGPU benchmark independently validates the ${kind} graph workload`, async () => {
    const device = await getWebGPUTestDevice();
    if (!device) {
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

      assertBenchmarkReport(report, device, {
        kind,
        vertexCount: 12,
        edgeCount: expectedDataset.edgeCount,
        cellCount: 16,
        theta,
        pageRankIterations: 4
      });
      expect(
        Boolean(submitSpy.mock.calls.length >= 10),
        'each real graph workload and independent spatial-index phase submits actual GPU work'
      ).toBe(true);
      expect(
        Boolean(fenceSpy.mock.calls.length >= 10),
        'GPU operation and standalone spatial-index timers wait on real completion fences'
      ).toBe(true);
      if (theta === 0) {
        expect(
          Boolean(report.approximationMaxAbsoluteError < 2e-4),
          'theta zero retains exact long-range repulsion instead of hiding approximation error'
        ).toBe(true);
      }
    } finally {
      fenceSpy.mockRestore();
      submitSpy.mockRestore();
    }
  });
}

function assertBenchmarkReport(
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
  expect(report.datasetKind, 'CPU and GPU execute the requested graph family').toBe(expected.kind);
  expect(report.vertexCount, 'both paths share the same vertex IDs').toBe(expected.vertexCount);
  expect(report.edgeCount, 'both paths share every deterministic source edge').toBe(
    expected.edgeCount
  );
  expect(report.warmupIterations, 'warmup cost is excluded from the requested sample').toBe(0);
  expect(report.measuredIterations, 'one real measured execution contributes each sample').toBe(1);
  expect(
    Boolean(Number.isFinite(report.uploadTimeMilliseconds) && report.uploadTimeMilliseconds >= 0),
    'source upload is measured and reported independently'
  ).toBe(true);
  expect(
    Boolean(
      Number.isFinite(report.compilationTimeMilliseconds) && report.compilationTimeMilliseconds >= 0
    ),
    'graph compilation is measured separately from GPU execution'
  ).toBe(true);
  expect(
    Boolean(
      Number.isFinite(report.readbackTimeMilliseconds) && report.readbackTimeMilliseconds >= 0
    ),
    'explicit oracle-validation readback is separated from fenced benchmark timing'
  ).toBe(true);
  assertDistribution(
    report.spatialIndexBuildTimeMilliseconds,
    'independent GPUGridIndex construction'
  );
  expect(
    report.indexMemoryBytes,
    'index memory reports exclusive offsets, vertex IDs, float32x2 centers, and both statuses'
  ).toBe(4 * (expected.cellCount + 1) + 4 * expected.vertexCount + 8 * expected.cellCount + 8);
  expect(
    Boolean(
      Number.isFinite(report.approximationMaxAbsoluteError) &&
        report.approximationMaxAbsoluteError >= 0
    ),
    'spatial accuracy is honestly compared against the independently evaluated exact force result'
  ).toBe(true);

  expect(
    report.paths.map(path => path.algorithm),
    'nine independently compiled CPU and WebGPU algorithms are actually benchmarked'
  ).toEqual(BENCHMARK_ALGORITHMS);
  for (const path of report.paths) {
    assertDistribution(path.cpuTimeMilliseconds, `${path.algorithm} CPU reference`);
    assertDistribution(path.cpuEncodeTimeMilliseconds, `${path.algorithm} CPU encoding`);
    assertDistribution(
      path.synchronizedTimeMilliseconds,
      `${path.algorithm} fence-synchronized GPU execution`
    );
    expect(
      Boolean(Number.isSafeInteger(path.importedBufferBytes) && path.importedBufferBytes > 0),
      `${path.algorithm} reports actual caller-owned imported GPU bytes`
    ).toBe(true);
    expect(
      Boolean(Number.isSafeInteger(path.transientBufferBytes) && path.transientBufferBytes >= 0),
      `${path.algorithm} reports actual graph-owned transient GPU bytes`
    ).toBe(true);
    expect(
      Boolean(Number.isFinite(path.maxAbsoluteError) && path.maxAbsoluteError >= 0),
      `${path.algorithm} validates GPU results against its independent CPU oracle`
    ).toBe(true);
    if (
      path.algorithm === 'topology' ||
      path.algorithm === 'breadth-first-search' ||
      path.algorithm === 'single-source-shortest-path' ||
      path.algorithm === 'connected-components' ||
      path.algorithm === 'label-propagation'
    ) {
      expect(
        path.maxAbsoluteError,
        `${path.algorithm} matches its exact CPU reference outputs`
      ).toBe(0);
    } else {
      expect(
        Boolean(path.maxAbsoluteError < 5e-4),
        `${path.algorithm} stays within real float32 accuracy`
      ).toBe(true);
    }
    if (!report.timestampQueries) {
      expect(
        path.gpuTimeMilliseconds,
        `${path.algorithm} never fabricates unavailable GPU timestamp-query timings`
      ).toBe(undefined);
    } else if (path.gpuTimeMilliseconds) {
      assertDistribution(path.gpuTimeMilliseconds, `${path.algorithm} GPU timestamps`);
    }

    if (path.algorithm === 'single-source-shortest-path') {
      expect(
        path.iterations,
        'weighted shortest paths report their actual bounded GPU relaxation passes'
      ).toBe(expected.vertexCount - 1);
      expect(
        typeof path.converged,
        'weighted shortest paths expose the actual final GPU fixed-point status'
      ).toBe('boolean');
      expect(path.residual, 'weighted paths never fabricate a residual').toBe(undefined);
    } else if (path.algorithm === 'connected-components') {
      expect(path.iterations, 'weak components report their actual bounded GPU passes').toBe(32);
      expect(
        path.converged,
        'weak components report the real final GPU fixed-point convergence status'
      ).toBe(true);
      expect(path.residual, 'integer weak components never fabricate a residual').toBe(undefined);
    } else if (path.algorithm === 'label-propagation') {
      expect(path.iterations, 'community labels report their real bounded vote passes').toBe(8);
      expect(
        typeof path.converged,
        'community labels expose their actual final GPU fixed-point status'
      ).toBe('boolean');
      expect(path.residual, 'community labels never fabricate a residual').toBe(undefined);
    } else if (path.algorithm === 'page-rank') {
      expect(
        path.iterations,
        'PageRank reports its actual independently configured GPU pass count'
      ).toBe(expected.pageRankIterations);
      expect(
        Boolean(
          typeof path.residual === 'number' &&
            Number.isFinite(path.residual) &&
            path.residual >= 0 &&
            path.residual <= 2
        ),
        'PageRank exposes the real finite, normalized final GPU L1 residual'
      ).toBe(true);
      expect(path.converged, 'PageRank never invents a binary convergence flag').toBe(undefined);
    } else {
      expect(path.iterations, `${path.algorithm} omits unrelated pass counts`).toBe(undefined);
      expect(path.converged, `${path.algorithm} omits unrelated convergence`).toBe(undefined);
      expect(path.residual, `${path.algorithm} omits unrelated GPU residuals`).toBe(undefined);
    }
  }
  expect(typeof report.timestampQueries, 'optional timestamp support is explicit').toBe('boolean');
  expect(device.type, 'reported timings were produced by an actual WebGPU device').toBe('webgpu');
}

function assertDistribution(distribution: GPUGraphBenchmarkDistribution, label: string): void {
  for (const value of [
    distribution.minimum,
    distribution.median,
    distribution.percentile95,
    distribution.maximum
  ]) {
    expect(
      Boolean(Number.isFinite(value) && value >= 0),
      `${label} publishes finite measured timings`
    ).toBe(true);
  }
  expect(
    Boolean(distribution.minimum <= distribution.median),
    `${label} median follows its minimum`
  ).toBe(true);
  expect(
    Boolean(distribution.median <= distribution.percentile95),
    `${label} 95th percentile follows its median`
  ).toBe(true);
  expect(
    Boolean(distribution.percentile95 <= distribution.maximum),
    `${label} maximum bounds its percentile`
  ).toBe(true);
}
