// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, test} from 'vitest';
import {
  isLuvsCandidatePass,
  runLuvsBenchmark,
  validateLuvsOutput
} from '../../website/src/components/docs/luvs-benchmark-runtime';

test('luVS candidate timings exclude common graph prefixes, initialization, and IVF probes', () => {
  expect(isLuvsCandidatePass('exact-search-initialize')).toBe(false);
  expect(isLuvsCandidatePass('filtered-search-clear-output')).toBe(false);
  expect(isLuvsCandidatePass('approximate-search-probe-query-0')).toBe(false);
  expect(isLuvsCandidatePass('exact-search-count-candidates-0-0')).toBe(true);
  expect(isLuvsCandidatePass('filtered-search-score-tile-1')).toBe(true);
  expect(isLuvsCandidatePass('approximate-search-rerank-query-0-tile-1')).toBe(true);
  expect(isLuvsCandidatePass('exact-search-select-top-k')).toBe(true);
});

test('luVS benchmark accepts only Float32-equivalent exact-neighbor rank swaps', () => {
  const makeOutput = (ids: number[], scores: number[]) => ({
    ids: Uint32Array.from(ids),
    scores: Float32Array.from(scores),
    resultCounts: Uint32Array.from([ids.length]),
    candidateCounts: Uint32Array.from([4])
  });
  const firstScore = Math.fround(1);
  const nearlyTiedScore = Math.fround(1 + 2 ** -22);
  const oracle = makeOutput([10, 20], [firstScore, nearlyTiedScore]);
  const equivalentSwap = makeOutput([20, 10], [firstScore, nearlyTiedScore]);

  expect(validateLuvsOutput(equivalentSwap, oracle, 'WebGPU exact', false)).toBe(1);
  expect(() =>
    validateLuvsOutput(
      makeOutput([99, 10], [firstScore, nearlyTiedScore]),
      oracle,
      'WebGPU exact',
      false
    )
  ).toThrow('different nearest-neighbor set');
  expect(() =>
    validateLuvsOutput(
      makeOutput([20, 10], [1, 2]),
      makeOutput([10, 20], [1, 2]),
      'WebGPU exact',
      false
    )
  ).toThrow('different nearest-neighbor order');
});

test('luVS documentation benchmark executes real exact, filtered, and IVF-flat WebGPU work', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const report = await runLuvsBenchmark(device, {
    datasetRowCount: 32,
    dimensions: 4,
    queryCount: 1,
    resultCount: 2,
    filterPercentage: 50,
    listCount: 2,
    probeCount: 1
  });

  expect(report.results.map(result => result.label)).toEqual([
    'CPU exact',
    'WebGPU exact',
    'WebGPU exact + selection',
    'WebGPU IVF-flat + selection'
  ]);
  const [cpuExact, gpuExact, gpuFiltered, gpuApproximate] = report.results;
  expect(cpuExact.resultCount).toBe(2);
  expect(gpuExact.resultCount).toBe(cpuExact.resultCount);
  expect(gpuExact.candidateCount).toBe(32);
  expect(gpuFiltered.candidateCount).toBeGreaterThan(0);
  expect(gpuFiltered.candidateCount).toBeLessThan(32);
  expect(gpuApproximate.candidateCount).toBeLessThanOrEqual(gpuFiltered.candidateCount);
  expect(gpuApproximate.recall).toBeGreaterThanOrEqual(0);
  expect(gpuApproximate.recall).toBeLessThanOrEqual(1);
  expect(report.uploadMilliseconds).toBeGreaterThanOrEqual(0);
  expect(report.indexBuildMilliseconds).toBeGreaterThanOrEqual(0);
  expect(report.indexByteLength).toBe(
    (report.options.listCount * report.options.dimensions +
      report.options.datasetRowCount * 3 +
      report.options.listCount * 2 +
      4) *
      Uint32Array.BYTES_PER_ELEMENT
  );
  for (const result of report.results) {
    expect(result.medianMilliseconds).toBeGreaterThanOrEqual(0);
  }
  for (const result of report.results.slice(1)) {
    expect(result.encodeMilliseconds).toBeGreaterThanOrEqual(0);
    expect(result.readbackMilliseconds).toBeGreaterThanOrEqual(0);
  }
});
