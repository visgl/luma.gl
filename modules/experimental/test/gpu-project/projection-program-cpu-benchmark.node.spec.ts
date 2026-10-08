// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import type {ProjectionCoordinates} from '@luma.gl/experimental/gpu-project';
import {
  measureProjectionProgramCPU,
  type ProjectionProgramCPUVariant
} from '../../src/gpu-project/projection-program-cpu-benchmark';

it('measures actual repeated projection and shared-result CPU consumers with binary64 outputs', () => {
  const coordinates: ProjectionCoordinates[] = [
    [0, 0],
    [10000000.25, 20000000.5],
    [NaN, 0]
  ];
  const oracle = vi.fn((position: ProjectionCoordinates) => ({
    position,
    valid: position.every(Number.isFinite)
  }));
  const expected = coordinates.map(oracle);
  oracle.mockClear();
  const reports = measureProjectionProgramCPU({
    coordinates,
    expected,
    oracle,
    consumerCount: 3,
    warmupIterations: 2,
    measuredIterations: 3
  });
  expect(oracle).toHaveBeenCalledTimes(3 * (1 + 2 + 3) * (3 + 1));
  expect(reports.map(report => report.mode)).toEqual(['inline', 'materialized']);
  for (const report of reports) {
    expect(report.checksum).toBe(90000002.25);
    expect(report.validRows).toBe(2);
    expect(report.outputEncoding).toBe('binary64');
    expect(report.outputByteLength).toBe(180);
    expect(report.intermediateByteLength).toBe(report.mode === 'inline' ? 0 : 60);
    expect(report.projectionsPerRow).toBe(report.mode === 'inline' ? 3 : 1);
    expect(report.durationMilliseconds.minimum).toBeGreaterThanOrEqual(0);
  }
});

it.each([
  1, 2, 3, 4
])('rejects an unstable CPU reference before/after each mode (call %s)', changedCall => {
  let calls = 0;
  const oracle = () => ({position: [++calls === changedCall ? NaN : 1, 2] as const, valid: true});
  expect(() =>
    measureProjectionProgramCPU({
      coordinates: [[1, 2]],
      expected: [{position: [1, 2], valid: true}],
      oracle,
      consumerCount: 1,
      warmupIterations: 0,
      measuredIterations: 1
    })
  ).toThrow(/oracle changed/);
  expect(calls).toBe(changedCall);
});

it('rejects changed CPU validity before returning timing', () => {
  expect(() =>
    measureProjectionProgramCPU({
      coordinates: [[0, 0]],
      expected: [{position: [0, 0], valid: false}],
      oracle: position => ({position, valid: true}),
      consumerCount: 2,
      warmupIterations: 0,
      measuredIterations: 1
    })
  ).toThrow(/oracle changed/);
});

function measureRoundedVariant(maximumError?: number, changing = false, valid = true) {
  const variant: ProjectionProgramCPUVariant = {
    api: 'rounded',
    provider: 'independent',
    maximumError,
    prepare: () => {
      let executions = 0;
      return {
        scratchByteLength: 0,
        execute: output => {
          output.positions.set([1 + 1e-8 * (changing ? ++executions : 1), 2]);
          output.validity[0] = Number(valid);
        }
      };
    }
  };
  return measureProjectionProgramCPU({
    coordinates: [[1, 2]],
    oracle: position => ({position, valid: true}),
    expected: [{position: [1, 2], valid: true}],
    consumerCount: 1,
    warmupIterations: 0,
    measuredIterations: 1,
    variants: [variant]
  });
}

it('accepts a declared CPU rounding budget and reports observed error', () => {
  const reports = measureRoundedVariant(1e-7);
  for (const report of reports.filter(report => report.api === 'rounded')) {
    expect(report.maximumAllowedError).toBe(1e-7);
    expect(report.maximumObservedError).toBeGreaterThan(0);
    expect(report.maximumObservedError).toBeLessThan(1e-7);
  }
  expect(() => measureRoundedVariant()).toThrow(/consumer output differs/);
  expect(() => measureRoundedVariant(1e-9)).toThrow(/consumer output differs/);
});

it('retains exact repeatability and validity checks even within a CPU error budget', () => {
  expect(() => measureRoundedVariant(1e-7, true)).toThrow(/oracle changed/);
  expect(() => measureRoundedVariant(1e-7, false, false)).toThrow(/consumer output differs/);
});

it.each([-1, NaN, Infinity])('rejects an invalid CPU error budget: %s', budget => {
  expect(() => measureRoundedVariant(budget)).toThrow(/invalid CPU projection error budget/);
});
