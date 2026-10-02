// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  compileProjectionPlan,
  compileProjectionProgram,
  evaluateProjectionProgram,
  invertProjectionProgram,
  type ProjectionProgram
} from '@luma.gl/experimental/gpu-project';
import {planCRSProjection} from '@luma.gl/experimental/gpu-project/crs';
import {Proj4Projection} from '@math.gl/proj4';
import {geographicCRS, makeTransverseMercatorCRS} from './projection-crs-fixtures';

const program: ProjectionProgram = {
  precision: 'double-single',
  operations: [{type: 'longitude-wrap', interval: [-180, 180]}]
};

it.each([
  [-180, 180],
  [0, 360],
  [-Math.PI, Math.PI]
] as const)('normalizes the declared interval %j with periodicity and idempotence', (minimum, maximum) => {
  const definition: ProjectionProgram = {
    ...program,
    operations: [{type: 'longitude-wrap', interval: [minimum, maximum]}]
  };
  const period = maximum - minimum;
  for (const turns of [-1024, -100, -1, 0, 1, 100, 1024]) {
    for (const fraction of [0.0001, 0.25, 0.5, 0.75, 0.9999]) {
      const longitude = minimum + (turns + fraction) * period;
      const expected = minimum + ((((longitude - minimum) % period) + period) % period);
      const result = evaluateProjectionProgram(definition, [longitude, 12345678.000001]);
      expect(result.valid).toBe(true);
      expect(Math.abs(result.position[0] - expected)).toBeLessThan(period * 1e-12);
      expect(result.position[1]).toBe(12345678.000001);
      expect(evaluateProjectionProgram(definition, result.position)).toEqual(result);
    }
  }
});

it('rejects seam guards, excessive turns and non-finite coordinates without clamping', () => {
  const tolerance = 360 * 2 ** -32;
  for (const longitude of [
    -180,
    180,
    540,
    -540,
    180 - tolerance / 2,
    180 + tolerance / 2,
    360 * 1025,
    -360 * 1025,
    Infinity,
    NaN
  ]) {
    expect(evaluateProjectionProgram(program, [longitude, 1])).toEqual({
      position: [0, 0],
      valid: false
    });
  }
  for (const longitude of [180 - tolerance * 2, 180 + tolerance * 2, 0, -0]) {
    expect(evaluateProjectionProgram(program, [longitude, 1]).valid).toBe(true);
  }
  expect(evaluateProjectionProgram(program, [0, Infinity]).valid).toBe(false);
  const widened: ProjectionProgram = {
    ...program,
    operations: [{type: 'longitude-wrap', interval: [-180, 180], seamTolerance: 1}]
  };
  expect(evaluateProjectionProgram(widened, [179.5, 0]).valid).toBe(false);
  expect(evaluateProjectionProgram(widened, [178.5, 0]).valid).toBe(true);
});

it('never advertises a many-to-one inverse and snapshots the seam contract', () => {
  const interval: [number, number] = [-180, 180];
  const first = compileProjectionProgram({
    ...program,
    operations: [{type: 'longitude-wrap', interval}]
  });
  interval[0] = 0;
  expect(first.metadata).toMatchObject({
    arithmetic: 'double-single',
    invertible: false,
    stages: [
      {
        invertible: false,
        errorAmplification: null,
        longitudeWrap: {
          interval: [-180, 180],
          seamTolerance: 360 * 2 ** -32,
          seamValidity: 'invalid'
        }
      }
    ]
  });
  expect(Object.isFrozen(first.metadata.stages[0].longitudeWrap?.interval)).toBe(true);
  expect(() => invertProjectionProgram(program)).toThrow(/no automatic inverse/);
  const updated = compileProjectionProgram({
    ...program,
    operations: [{type: 'longitude-wrap', interval: [0, 360]}]
  });
  expect(first.isCompatible(updated)).toBe(true);
  expect(first.packParameters()).not.toEqual(updated.packParameters());
  const plan = compileProjectionPlan({
    projection: coordinates => coordinates,
    bounds: [-1, -1, 1, 1],
    precision: 'double-single'
  });
  expect(
    compileProjectionProgram({
      ...program,
      operations: [
        {type: 'adaptive', plan: {...plan, doubleSingleMaxError: 0.01}},
        ...program.operations
      ]
    }).metadata.approximationError.kind
  ).toBe('unknown');
});

it.each([
  {interval: [1, 1]},
  {interval: [180, -180]},
  {interval: [NaN, 180]},
  {interval: [0, 1e40]},
  {interval: [0, 1e-40]},
  {interval: [1e9, 1e9 + 360]},
  {interval: [-180, 180], seamTolerance: 0},
  {interval: [-180, 180], seamTolerance: 180},
  {interval: [-180, 180], seamTolerance: NaN}
])('rejects unsupported wrap parameters %j', operation => {
  expect(() =>
    compileProjectionProgram({
      ...program,
      operations: [JSON.parse(JSON.stringify({type: 'longitude-wrap', ...operation}))]
    })
  ).toThrow();
});

it.each([
  'float32',
  'double-single'
] as const)('composes explicit antimeridian UTM planning with %s arithmetic', projectionArithmetic => {
  const planned = planCRSProjection({
    from: geographicCRS,
    to: makeTransverseMercatorCRS(60),
    projectionArithmetic,
    bounds: [179, -1, 181, 1],
    tolerance: 1e-5
  });
  expect(planned.status).toBe('ready');
  if (planned.status !== 'ready') return;
  const wrapped: ProjectionProgram = {
    ...planned.program,
    operations: [{type: 'longitude-wrap', interval: [0, 360]}, ...planned.program.operations]
  };
  const oracle = new Proj4Projection({from: 'EPSG:4326', to: '+proj=utm +zone=60 +datum=WGS84'});
  for (const longitude of [179.25, 179.99, -179.99, -179.25]) {
    const expected = oracle.project([longitude, 0.5]);
    const actual = evaluateProjectionProgram(wrapped, [longitude, 0.5]);
    expect(actual.valid).toBe(true);
    expect(
      Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
    ).toBeLessThan(1e-5);
  }
  expect(() => invertProjectionProgram(wrapped)).toThrow();
  expect(compileProjectionProgram(wrapped).metadata.invertible).toBe(false);
});
