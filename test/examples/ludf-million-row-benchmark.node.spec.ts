// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {summarizeLuDataFrameBenchmarkSamples} from '../../examples/experimental/gpu-data-analysis/src/ludf-benchmark';

describe('million-row luDF benchmark measurements', () => {
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
