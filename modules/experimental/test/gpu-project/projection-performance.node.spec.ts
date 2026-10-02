// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {evaluateProjectionProgram} from '@luma.gl/experimental/gpu-project';
import {
  makePerformanceOptions,
  parsePerformanceSweep,
  performanceFixtures
} from './projection-performance-fixtures';

it('parses explicit sweep dimensions without silently dropping invalid values', () => {
  expect(parsePerformanceSweep(undefined, [1, 4])).toEqual([1, 4]);
  expect(parsePerformanceSweep('1024,16384', [1])).toEqual([1024, 16384]);
  for (const value of ['', '0', '-1', '1.5', 'NaN', 'Infinity', '1,', '1,1'])
    expect(() => parsePerformanceSweep(value, [1])).toThrow(/sweep values/);
});

for (const fixture of performanceFixtures) {
  it(`provides independently checked multi-patch ${fixture.id} workloads at one error budget`, () => {
    const options = makePerformanceOptions(fixture, 128, 4);
    const patchCounts: number[] = [];
    expect(options.coordinates.length).toBe(139);
    expect(options.coordinates.filter(position => options.oracle(position).valid).length).toBe(137);
    for (const variant of options.variants) {
      const program = variant.createProgram();
      expect(program.precision).toBe('double-single');
      const stages = program.operations.filter(operation => operation.type === 'adaptive');
      expect(stages).toHaveLength(1);
      patchCounts.push(stages[0].plan.patches.length);
      for (const coordinate of options.coordinates) {
        const expected = options.oracle(coordinate);
        const actual = evaluateProjectionProgram(program, coordinate);
        expect(actual.valid).toBe(expected.valid);
        if (expected.valid)
          expect(
            Math.hypot(
              actual.position[0] - expected.position[0],
              actual.position[1] - expected.position[1]
            )
          ).toBeLessThanOrEqual(variant.maximumError);
      }
    }
    expect(patchCounts[0]).toBeGreaterThan(patchCounts[1]);
    expect(patchCounts[0]).toBeGreaterThan(1);
  });
}
