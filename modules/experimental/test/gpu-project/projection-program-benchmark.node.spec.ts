// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {NullDevice} from '@luma.gl/test-utils';
import {
  runProjectionProgramBenchmark,
  type ProjectionProgramBenchmarkOptions
} from '@luma.gl/experimental/gpu-project/benchmarks';

const options: ProjectionProgramBenchmarkOptions = {
  coordinates: [[1, 2]],
  oracle: position => ({position, valid: true}),
  variants: ['first', 'second'].map(id => ({
    id,
    maximumError: 0,
    createProgram: () => ({precision: 'double-single', operations: []})
  })),
  warmupIterations: 0,
  measuredIterations: 1
};

it.each([
  {coordinates: []},
  {variants: []},
  {variants: [options.variants[0], options.variants[0]]},
  {warmupIterations: -1},
  {measuredIterations: 0},
  {measuredIterations: 1.5},
  {variants: options.variants.map(variant => ({...variant, maximumError: NaN}))}
])('rejects invalid benchmark controls without GPU allocation: %j', async invalid => {
  const device = new NullDevice({});
  const allocation = vi.spyOn(device, 'createBuffer');
  try {
    await expect(runProjectionProgramBenchmark(device, {...options, ...invalid})).rejects.toThrow(
      /benchmark options/
    );
    expect(allocation).not.toHaveBeenCalled();
  } finally {
    device.destroy();
    vi.restoreAllMocks();
  }
});

it('refuses a non-finite valid oracle result before GPU work', async () => {
  const device = new NullDevice({});
  try {
    await expect(
      runProjectionProgramBenchmark(device, {
        ...options,
        oracle: () => ({position: [NaN, 0], valid: true})
      })
    ).rejects.toThrow(/oracle/);
  } finally {
    device.destroy();
  }
});

it('destroys allocated buffers when graph compilation fails before execution', async () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  Object.defineProperty(device.limits, 'maxComputeWorkgroupsPerDimension', {value: 65535});
  const allocation = vi.spyOn(device, 'createBuffer');
  const submit = vi.spyOn(device, 'submit');
  try {
    // NullDevice cannot compile a compute pipeline; partially allocated resources must be released.
    await expect(
      runProjectionProgramBenchmark(device, {...options, warmupIterations: 2})
    ).rejects.toThrow(/ComputePipeline/);
    expect(submit).not.toHaveBeenCalled();
    expect(allocation.mock.results.length).toBeGreaterThan(0);
    for (const result of allocation.mock.results) expect(result.value.destroyed).toBe(true);
  } finally {
    device.destroy();
    vi.restoreAllMocks();
  }
});
