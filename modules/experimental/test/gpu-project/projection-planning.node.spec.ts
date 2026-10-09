// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {build} from 'esbuild';
import {describe, expect, it, vi} from 'vitest';
import {
  projectionEngine,
  ProjectionTransform,
  createProjectionDescriptor,
  mercator
} from '@math.gl/projection';
import {
  planProjection,
  ProjectionPlanningError,
  evaluateProjectionProgram,
  invertProjectionProgram,
  type ProjectionPlanningResult
} from '@luma.gl/experimental/gpu-project';
import {ProjectionPlanningError as CRSPlanningError} from '@luma.gl/experimental/gpu-project/crs';

const bounds = [-1, -1, 1, 1] as const;
const options = {bounds, tolerance: 1e-6};

function requireReady(result: ProjectionPlanningResult) {
  if (result.status !== 'ready') throw new Error(JSON.stringify(result.reasons));
  return result;
}

describe('provider-independent projection planning', () => {
  it('fits a callback with binary64 input and double-single output by default', () => {
    const result = requireReady(
      planProjection({
        ...options,
        projection: coordinates => [10_000_000 + coordinates[0], coordinates[1] * 2]
      })
    );
    expect(result.strategy).toBe('adaptive');
    expect(result.reasons).toEqual([]);
    expect(result.compiled.inputFormat).toBe('uint32x4');
    expect(result.compiled.precision).toBe('double-single');
    expect(result.compiled.metadata).toMatchObject({
      inputEncoding: 'binary64',
      outputPrecision: 'double-single',
      approximationError: {kind: 'sampled-estimate', guaranteed: false}
    });
    const projected = evaluateProjectionProgram(result.program, [0.000002, 0.5]);
    expect(projected.valid).toBe(true);
    expect(projected.position[0]).toBeCloseTo(10_000_000.000002, 7);
    expect(projected.position[1]).toBeCloseTo(1, 10);
    expect(evaluateProjectionProgram(result.program, [2, 0]).valid).toBe(false);
    expect(() => invertProjectionProgram(result.program)).toThrow();
  });

  it('preserves legacy provider receivers and explicitly fits an independent inverse domain', () => {
    const provider = {
      offset: 10,
      project(coordinates: number[]) {
        return [coordinates[0] + this.offset, coordinates[1] * 2];
      },
      unproject(coordinates: number[]) {
        return [coordinates[0] - this.offset, coordinates[1] / 2];
      }
    };
    const result = requireReady(
      planProjection({
        ...options,
        projection: provider,
        inverse: {bounds: [9, -2, 11, 2], tolerance: 1e-7},
        precision: 'local-f32',
        inputFormat: 'float32x4',
        destinationOrigin: [10, 0]
      })
    );
    expect(result.compiled.precision).toBe('local-f32');
    expect(result.compiled.inputFormat).toBe('float32x4');
    expect(result.compiled.destinationOrigin).toEqual([10, 0]);
    const inverse = invertProjectionProgram(result.program);
    const projected = evaluateProjectionProgram(result.program, [0.25, 0.75]);
    expect(evaluateProjectionProgram(inverse, projected.position).position).toEqual([0.25, 0.75]);
    expect(evaluateProjectionProgram(inverse, [12, 0]).valid).toBe(false);
    provider.offset = 100;
    expect(evaluateProjectionProgram(result.program, [0.25, 0.75])).toEqual(projected);
  });

  it('uses synchronous methods in both directions without starting deferred methods or preload', () => {
    const provider = {
      offset: 3,
      project: vi.fn(async () => [999, 999]),
      unproject: vi.fn(async () => [999, 999]),
      preload: vi.fn(async () => {}),
      projectSync(coordinates: readonly number[]) {
        return [coordinates[0] + this.offset, coordinates[1]];
      },
      unprojectSync(coordinates: readonly number[]) {
        return [coordinates[0] - this.offset, coordinates[1]];
      }
    };
    const result = requireReady(
      planProjection({
        ...options,
        projection: provider,
        inverse: {bounds: [2, -1, 4, 1], tolerance: 1e-6}
      })
    );
    expect(evaluateProjectionProgram(result.program, [0, 0]).position).toEqual([3, 0]);
    for (const value of evaluateProjectionProgram(invertProjectionProgram(result.program), [3, 0])
      .position) {
      expect(value).toBeCloseTo(0, 12);
    }
    expect(provider.project).not.toHaveBeenCalled();
    expect(provider.unproject).not.toHaveBeenCalled();
    expect(provider.preload).not.toHaveBeenCalled();
  });

  it('accepts the pinned math.gl convenience projection without resolving its CRS again', () => {
    const projection = projectionEngine.createProjection({from: 'EPSG:4326', to: 'EPSG:3857'});
    const result = requireReady(
      planProjection({
        projection,
        bounds: [-0.01, -0.01, 0.01, 0.01],
        tolerance: 0.001
      })
    );
    const coordinate = [0.001, 0.002] as const;
    const reference = projection.project([...coordinate]);
    const projected = evaluateProjectionProgram(result.program, coordinate);
    expect(
      Math.hypot(projected.position[0] - reference[0], projected.position[1] - reference[1])
    ).toBeLessThan(0.001);
  });

  it('leaves real lazy-provider preparation with the caller and supports retry after preload', async () => {
    const load = vi.fn(async () => mercator);
    const descriptor = createProjectionDescriptor(
      {name: mercator.name, aliases: mercator.aliases},
      load
    );
    const projection = new ProjectionTransform({to: 'EPSG:3857', projections: [descriptor]});
    const request = {projection, bounds: [-0.01, -0.01, 0.01, 0.01] as const, tolerance: 0.001};
    const unavailable = planProjection(request);
    expect(unavailable.status).toBe('unsupported');
    expect(unavailable.reasons[0].message).toContain('preload');
    expect(load).not.toHaveBeenCalled();
    await projection.preload();
    expect(load).toHaveBeenCalledTimes(1);
    const result = requireReady(planProjection(request));
    expect(evaluateProjectionProgram(result.program, [0, 0]).valid).toBe(true);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('declines explicitly lossy transforms before evaluating coordinates', () => {
    const projectSync = vi.fn((coordinates: readonly number[]) => [...coordinates]);
    const result = planProjection({...options, projection: {projectSync, lossy: true}});
    expect(result.status).toBe('unsupported');
    expect(result.reasons[0].code).toBe('unsupported-dimensions');
    expect(projectSync).not.toHaveBeenCalled();
  });

  it('does not invent or mix inverse provider methods', () => {
    const projectSync = vi.fn((coordinates: readonly number[]) => [...coordinates]);
    const unproject = vi.fn((coordinates: number[]) => coordinates);
    const result = planProjection({
      ...options,
      projection: {projectSync, unproject},
      inverse: {bounds, tolerance: 1e-6}
    });
    expect(result.status).toBe('unsupported');
    expect(result.reasons[0].code).toBe('provider-unavailable');
    expect(projectSync).not.toHaveBeenCalled();
    expect(unproject).not.toHaveBeenCalled();
  });

  it.each([
    {position: [1]},
    {position: [1, 2, 3]},
    {position: [NaN, 0]},
    {position: [Infinity, 0]}
  ])('declines invalid coordinates $position', ({position}) => {
    const result = planProjection({...options, projection: () => position});
    expect(result.status).toBe('unsupported');
    expect(result.reasons[0].code).toBe('approximation-failed');
  });

  it('declines deferred callbacks rather than treating a promise as coordinates', () => {
    const result = planProjection({
      ...options,
      // @ts-expect-error Async callbacks are not synchronous projection providers.
      projection: async () => [0, 0]
    });
    expect(result.status).toBe('unsupported');
    expect(result.reasons[0].message).toContain('exactly two coordinates');
  });

  it('retains provider errors and shares the CRS throwing interface', () => {
    const projection = () => {
      throw new Error('application projection domain');
    };
    const result = planProjection({...options, projection});
    expect(result.reasons).toEqual([
      {code: 'approximation-failed', message: 'application projection domain'}
    ]);
    expect(ProjectionPlanningError).toBe(CRSPlanningError);
    try {
      planProjection({...options, projection, onUnsupported: 'throw'});
      throw new Error('expected planning failure');
    } catch (error) {
      expect(error).toBeInstanceOf(ProjectionPlanningError);
      if (!(error instanceof ProjectionPlanningError)) throw error;
      expect(error.reasons).toEqual(result.reasons);
      expect(Object.isFrozen(error.reasons)).toBe(true);
      expect(Object.isFrozen(error.reasons[0])).toBe(true);
    }
  });

  it('keeps math.gl and proj4 runtime code out of the provider-planning bundle', async () => {
    const result = await build({
      stdin: {
        contents:
          "export {planProjection, ProjectionPlanningError} from './modules/experimental/src/gpu-project/index';",
        resolveDir: process.cwd()
      },
      bundle: true,
      write: false,
      metafile: true,
      format: 'esm',
      platform: 'browser',
      external: ['@luma.gl/*']
    });
    expect(Object.keys(result.metafile!.inputs).some(path => /@math.gl|proj4/.test(path))).toBe(
      false
    );
    expect(result.outputFiles[0].text).toContain('planProjection');
  });
});
