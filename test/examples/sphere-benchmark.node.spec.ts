// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  advanceSphereClock,
  createSphereBenchmark,
  recordSphereBenchmarkSample
} from '../../examples/experimental/gpu-sphere-world/benchmark';

it('sphere benchmark clock never leaves a playback backlog', () => {
  let accumulator = 0;
  for (let frame = 0; frame < 330; frame++) {
    const clock = advanceSphereClock(accumulator, 1 / 60, 1.5, true);
    expect(clock.steps).toBe(1);
    accumulator = clock.accumulator;
  }
  expect(accumulator).toBe(0);
  expect(advanceSphereClock(accumulator, 1 / 60, 1.5, false).steps).toBe(3);
  expect(advanceSphereClock(10, 1, 3, false)).toEqual({steps: 8, accumulator: 0});
});

it('sphere benchmark rejects old-run and warmup timings but retains invalid-workload evidence', () => {
  const previous = createSphereBenchmark();
  const current = createSphereBenchmark();
  const diagnostics = {droppedContacts: 2, invalidBodies: 1};
  recordSphereBenchmarkSample(undefined, current, true, diagnostics, 99);
  recordSphereBenchmarkSample(previous, current, true, diagnostics, 99);
  current.warmup = 0;
  recordSphereBenchmarkSample(current, current, false, diagnostics, 99);
  expect(current.gpu).toEqual([]);
  current.finishing = true;
  recordSphereBenchmarkSample(current, current, true, {droppedContacts: 0, invalidBodies: 0}, 2);
  expect(current.gpu).toEqual([2]);
  expect(current.diagnosticSamples).toBe(2);
  expect(current.maximumDroppedContacts).toBe(2);
  expect(current.maximumInvalidBodies).toBe(1);
});
