// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {
  compileProjectionPlan,
  compileProjectionProgram,
  getProjectionProgramMetadata,
  invertProjectionProgram,
  type ProjectionProgram
} from '@luma.gl/experimental/gpu-project';

const plan = compileProjectionPlan({
  projection: coordinates => [coordinates[0] ** 2, coordinates[1] * 3],
  bounds: [-1, -1, 1, 1],
  precision: 'double-single',
  tolerance: 1e-6
});

describe('projection numerical metadata', () => {
  it('distinguishes input transport, intermediate arithmetic, and output rounding', () => {
    const program: ProjectionProgram = {precision: 'local-f32', operations: []};
    const compiled = compileProjectionProgram(program, {inputFormat: 'uint32x4'});
    expect(compiled.metadata).toMatchObject({
      inputDimensions: 2,
      outputDimensions: 2,
      inputEncoding: 'binary64',
      arithmetic: 'double-single',
      outputPrecision: 'local-f32',
      outputFrame: 'origin-relative',
      approximationError: {kind: 'none', maximum: 0, guaranteed: false}
    });
    expect(
      getProjectionProgramMetadata({...program, precision: 'double-single'}, 'float32x4')
    ).toMatchObject({
      inputEncoding: 'double-single',
      outputFrame: 'absolute'
    });
    expect(getProjectionProgramMetadata(program).inputEncoding).toBe('float32');
  });

  it('propagates sampled error through native scales in destination units', () => {
    // Use a known sampled error to make the propagation independent of fitting roundoff.
    const sampledPlan = {...plan, doubleSingleMaxError: 0.25};
    const program: ProjectionProgram = {
      precision: 'double-single',
      operations: [
        {type: 'adaptive', plan: sampledPlan},
        {type: 'axis', order: [1, 0]},
        {type: 'unit', factor: 2},
        {type: 'affine', scale: [-0.5, 4], offset: [1e7, -1e7], inverse: true}
      ]
    };
    const metadata = getProjectionProgramMetadata(program);
    expect(metadata.stages.map(stage => stage.approximationError.maximum)).toEqual([
      0.25, 0.25, 0.5, 1
    ]);
    expect(metadata.approximationError).toEqual({
      kind: 'sampled-estimate',
      maximum: 1,
      guaranteed: false
    });
    expect(metadata.stages[0].inputBounds).toEqual(plan.bounds);
    expect(metadata.invertible).toBe(false);
  });

  it('does not fabricate a composed error bound through a second adaptive stage', () => {
    const metadata = getProjectionProgramMetadata({
      precision: 'double-single',
      operations: [
        {type: 'adaptive', plan},
        {type: 'adaptive', plan},
        {type: 'unit', factor: 1000}
      ]
    });
    expect(metadata.approximationError).toEqual({
      kind: 'unknown',
      maximum: null,
      guaranteed: false
    });
  });

  it('snapshots immutable stage bounds and reports inversion requirements', () => {
    const mutablePlan = {...plan, bounds: [-1, -1, 1, 1] as [number, number, number, number]};
    const program: ProjectionProgram = {
      precision: 'double-single',
      operations: [
        {type: 'adaptive', plan: mutablePlan, inversePlan: {...plan, bounds: [0, -3, 1, 3]}}
      ]
    };
    const compiled = compileProjectionProgram(program);
    mutablePlan.bounds[0] = -99;
    expect(compiled.metadata.stages[0].inputBounds).toEqual([-1, -1, 1, 1]);
    expect(Object.isFrozen(compiled.metadata.stages[0].inputBounds)).toBe(true);
    expect(Object.isFrozen(compiled.metadata.stages)).toBe(true);
    expect(Object.isFrozen(compiled.metadata.approximationError)).toBe(true);
    expect(compiled.metadata.invertible).toBe(true);
    expect(
      getProjectionProgramMetadata(invertProjectionProgram(program)).stages[0].inputBounds
    ).toEqual([0, -3, 1, 3]);
  });
});
