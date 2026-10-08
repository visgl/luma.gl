// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {projectionEngine} from '@math.gl/projection';
import {createCRSProjectionCPUBenchmarks} from '@luma.gl/experimental/gpu-project/crs';
import {measureProjectionProgramCPU} from '@luma.gl/experimental/gpu-project/benchmarks';
import {makePerformanceOptions, performanceFixtures} from './projection-performance-fixtures';

it.each(
  performanceFixtures
)('validates every CPU API, layout and consumer mode for $id', fixture => {
  const options = makePerformanceOptions(fixture, 16, 3);
  const reports = measureProjectionProgramCPU({
    ...options,
    expected: options.coordinates.map(options.oracle),
    consumerCount: 3,
    warmupIterations: 0,
    measuredIterations: 1,
    variants: options.cpuVariants
  });
  expect(reports).toHaveLength(12);
  expect(new Set(reports.map(report => report.api)).size).toBe(6);
  for (const report of reports) {
    expect(report.validRows).toBe(25);
    expect(report.checksum).toBe(reports[0].checksum);
    expect(report.preparationTimeMilliseconds).toBeGreaterThanOrEqual(0);
  }
});

it('propagates bulk prefix-commit failures without returning a timing report', () => {
  const projection = projectionEngine.createProjection({from: 'EPSG:4326', to: 'EPSG:3857'});
  const variants = createCRSProjectionCPUBenchmarks({
    projection,
    provider: 'test',
    isValid: () => true
  });
  for (const variant of variants) {
    const batch = variant.prepare([
      [1, 1],
      [1, 100],
      [2, 2]
    ]);
    expect(() =>
      batch.execute({positions: new Float64Array(6), validity: new Uint32Array(3)})
    ).toThrow();
  }
});

it('rejects changing predicates instead of treating unwritten bulk rows as valid', () => {
  const projection = projectionEngine.createProjection({from: 'EPSG:4326', to: 'EPSG:3857'});
  let valid = false;
  const variants = createCRSProjectionCPUBenchmarks({
    projection,
    provider: 'test',
    isValid: () => valid
  });
  const batch = variants[2].prepare([[1, 1]]);
  valid = true;
  expect(() =>
    batch.execute({positions: new Float64Array(2), validity: new Uint32Array(1)})
  ).toThrow(/predicate changed/);
});
