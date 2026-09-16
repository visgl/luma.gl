// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {runProjectionProgramBenchmark} from '@luma.gl/experimental/gpu-project/benchmarks';

it('refuses accuracy/validity failures before warmup and does not return misleading timing', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  if (device.info.gpu === 'software' || device.info.gpuType === 'cpu' || device.info.fallback)
    context.skip();
  const submit = vi.spyOn(device, 'submit');
  try {
    for (const valid of [true, false]) {
      submit.mockClear();
      await expect(
        runProjectionProgramBenchmark(device, {
          coordinates: [[1, 2]],
          oracle: () => ({position: [100, 200], valid}),
          variants: ['first', 'second'].map(id => ({
            id,
            maximumError: 0,
            createProgram: () => ({precision: 'double-single', operations: []})
          })),
          warmupIterations: 5,
          measuredIterations: 5
        })
      ).rejects.toThrow(valid ? /exceeds error budget/ : /validity differs/);
      expect(submit).toHaveBeenCalledTimes(1);
    }
  } finally {
    vi.restoreAllMocks();
  }
});

it.each([
  'local-f32',
  'double-single'
] as const)('decodes %s identity output and refuses mismatched output precision', async (precision, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  if (device.info.gpu === 'software' || device.info.gpuType === 'cpu' || device.info.fallback)
    context.skip();
  const report = await runProjectionProgramBenchmark(device, {
    coordinates: [[10000000.25, 20000000.5]],
    oracle: position => ({position, valid: true}),
    variants: ['first', 'second'].map(id => ({
      id,
      maximumError: 0,
      createProgram: () => ({
        precision,
        destinationOrigin: [10000000, 20000000],
        operations: []
      })
    })),
    warmupIterations: 0,
    measuredIterations: 1
  });
  expect(report.paths.every(path => path.maximumObservedError === 0)).toBe(true);
  await expect(
    runProjectionProgramBenchmark(device, {
      coordinates: [[1, 2]],
      oracle: position => ({position, valid: true}),
      variants: [
        {
          id: 'local',
          maximumError: 0,
          createProgram: () => ({precision: 'local-f32', operations: []})
        },
        {
          id: 'double',
          maximumError: 0,
          createProgram: () => ({precision: 'double-single', operations: []})
        }
      ],
      warmupIterations: 0,
      measuredIterations: 1
    })
  ).rejects.toThrow(/share output precision/);
});
