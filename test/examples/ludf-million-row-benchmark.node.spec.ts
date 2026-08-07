// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {
  createLuDataFrameBenchmarkReference,
  summarizeLuDataFrameBenchmarkSamples
} from '../../examples/experimental/gpu-data-analysis/src/ludf-benchmark';

describe('million-row luDF benchmark measurements', () => {
  test('materializes adjusted fares for every row of all four CPU workloads', () => {
    const roundFloat32 = vi.spyOn(Math, 'fround');

    try {
      const reference = createLuDataFrameBenchmarkReference(
        {
          fares: Float32Array.from([999, 21, 30, 50, 10]),
          categories: Uint32Array.from([0, 0, 1, 2, 3]),
          fareValidity: Uint8Array.from([0xff]),
          categoryValidity: Uint8Array.from([0xff]),
          rowCount: 4,
          sliceOffset: 1
        },
        [2, 0, 2]
      );

      expect(roundFloat32).toHaveBeenCalledTimes(16);
      expect(roundFloat32.mock.calls.map(([fare]) => fare)).toEqual(
        Array.from({length: 4}, () => [23.5, 32.5, 52.5, 12.5]).flat()
      );
      expect(reference.filterCounts).toEqual([2, 0, 1]);
      expect(reference.groupSums).toEqual([23.5, 32.5, 52.5, 0]);
      expect(reference.topKRowIds).toEqual([[1, 0], [], [2]]);
      expect(reference.joinRequiredCounts).toEqual([2, 0, 1]);
    } finally {
      roundFloat32.mockRestore();
    }
  });

  test('reports median CPU/GPU durations, observed throughput, and honest speedup', () => {
    expect(summarizeLuDataFrameBenchmarkSamples(1_000_000, [24, 8, 12], [10, 4, 6])).toEqual({
      cpuMilliseconds: 12,
      gpuMilliseconds: 6,
      cpuRowsPerSecond: 1_000_000_000 / 12,
      gpuRowsPerSecond: 1_000_000_000 / 6,
      speedup: 2
    });
  });

  test('averages the middle observations for an even number of samples', () => {
    const result = summarizeLuDataFrameBenchmarkSamples(4096, [14, 6, 18, 10], [9, 3, 7, 5]);
    expect(result.cpuMilliseconds).toBe(12);
    expect(result.gpuMilliseconds).toBe(6);
    expect(result.speedup).toBe(2);
  });

  test('does not invent throughput or speedup from zero-duration observations', () => {
    expect(summarizeLuDataFrameBenchmarkSamples(1024, [0], [0])).toEqual({
      cpuMilliseconds: 0,
      gpuMilliseconds: 0,
      cpuRowsPerSecond: 0,
      gpuRowsPerSecond: 0,
      speedup: 0
    });
  });

  test('rejects invalid row counts and invalid timing observations', () => {
    expect(() => summarizeLuDataFrameBenchmarkSamples(0, [1], [1])).toThrow(/row count/i);
    expect(() => summarizeLuDataFrameBenchmarkSamples(1024, [], [1])).toThrow(/samples/i);
    expect(() => summarizeLuDataFrameBenchmarkSamples(1024, [1], [Number.NaN])).toThrow(/samples/i);
    expect(() => summarizeLuDataFrameBenchmarkSamples(1024, [-1], [1])).toThrow(/samples/i);
  });
});
