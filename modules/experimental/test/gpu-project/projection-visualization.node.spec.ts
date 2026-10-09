// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {projectionEngine} from '@math.gl/projection';
import {evaluateProjectionProgram} from '@luma.gl/experimental/gpu-project';
import {
  prepareCRSProjection,
  ProjectionTableTransform
} from '@luma.gl/experimental/gpu-project/crs';
import {makeVisualizationFixture} from './projection-visualization-fixtures';
import {makePerformanceCoordinates} from './projection-performance-fixtures';

for (const method of ['gnom', 'ortho'] as const) {
  for (const inverse of [false, true]) {
    it(`qualifies bounded ${method} ${inverse ? 'inverse' : 'forward'} for prepared CPU tables and adaptive programs`, () => {
      const fixture = makeVisualizationFixture(method, inverse);
      const prepared = prepareCRSProjection(fixture);
      if (prepared.status !== 'ready') throw new Error(JSON.stringify(prepared.reasons));
      const coordinates = makePerformanceCoordinates(fixture.bounds, 128);
      const table = new ProjectionTableTransform(prepared).projectBatch({
        positions: Float64Array.from(coordinates.flat())
      });
      for (const [index, position] of coordinates.entries()) {
        const valid = fixture.isValid(position);
        const actual = evaluateProjectionProgram(prepared.program, position);
        expect(actual.valid).toBe(valid);
        expect(table.validity[index]).toBe(Number(valid));
        if (!valid) {
          expect(actual.position).toEqual([0, 0]);
          expect(Array.from(table.positions.subarray(index * 2, index * 2 + 2))).toEqual([0, 0]);
          continue;
        }
        const expected = fixture.project(position);
        expect(
          Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
        ).toBeLessThan(fixture.tolerance);
        expect(
          Math.hypot(
            table.positions[index * 2] - expected[0],
            table.positions[index * 2 + 1] - expected[1]
          )
        ).toBeLessThan(inverse ? 1e-12 : 1e-8);
      }
    });
  }
  it(`${method} rejects nonfinite/singular fitting and requires an explicit front-facing domain`, () => {
    const fixture = makeVisualizationFixture(method);
    // Gnomonic's horizon is singular; orthographic has a nonfinite hidden hemisphere.
    const unsafe = method === 'gnom' ? ([89.9, -1, 90.1, 1] as const) : ([89, -1, 91, 1] as const);
    expect(
      prepareCRSProjection({...fixture, bounds: unsafe, maxDepth: 1, maxPatches: 4}).status
    ).toBe('unsupported');
    const prepared = prepareCRSProjection(fixture);
    if (prepared.status !== 'ready') throw new Error(JSON.stringify(prepared.reasons));
    for (const position of [
      [90, 0],
      [100, 0],
      [-180, 0],
      [360, 0]
    ] as const) {
      expect(evaluateProjectionProgram(prepared.program, position)).toEqual({
        position: [0, 0],
        valid: false
      });
    }
  });
}

it('uses the public gnomonic engine guard rather than the legacy finite horizon fallback', () => {
  const fixture = makeVisualizationFixture('gnom');
  const projection = projectionEngine.createProjection(fixture);
  expect(() => projection.projectSync([120, 0])).toThrow('horizon');
  expect(() => projection.projectSync([90, 0])).toThrow('horizon');
  // The public adapter rejects the hidden hemisphere before its legacy kernel can return
  // plausible finite coordinates. Applications still clip geometry crossing the horizon.
  const hidden = prepareCRSProjection({
    ...fixture,
    bounds: [119.9, -0.1, 120.1, 0.1],
    tolerance: 1
  });
  expect(hidden.status).toBe('unsupported');
});

it('does not fit an orthographic inverse rectangle that extends outside the disk', () => {
  const fixture = makeVisualizationFixture('ortho', true);
  expect(
    prepareCRSProjection({
      ...fixture,
      bounds: [-fixture.radius, -fixture.radius, fixture.radius, fixture.radius]
    }).status
  ).toBe('unsupported');
});
