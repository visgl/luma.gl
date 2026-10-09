// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  clipProjectionSegment,
  compileProjectionPartition,
  compileProjectionProgram,
  evaluateProjectionProgram,
  findProjectionPatch,
  invertProjectionProgram,
  type ProjectionProgram
} from '@luma.gl/experimental/gpu-project';

const identity = (position: number[]) => position;

it('fits disjoint branches independently, rejects seams and requires independent inverse domains', () => {
  const {plan, branches} = compileProjectionPartition({
    branches: [
      {
        id: 'west',
        bounds: [-4, -1, -1, 1],
        projection: position => [position[0] + 10, position[1]]
      },
      {id: 'east', bounds: [1, -1, 4, 1], projection: position => [position[0] + 20, position[1]]}
    ],
    tolerance: 1e-8
  });
  expect(branches.map(branch => branch.id)).toEqual(['west', 'east']);
  expect(plan.strictDomains).toBe(true);
  const program: ProjectionProgram = {
    precision: 'double-single',
    operations: [{type: 'adaptive', plan}]
  };
  expect(evaluateProjectionProgram(program, [0, 0])).toEqual({position: [0, 0], valid: false});
  expect(evaluateProjectionProgram(program, [1 - 1e-10, 0]).valid).toBe(false);
  expect(() => invertProjectionProgram(program)).toThrow(/inverse/);
  const inverse = compileProjectionPartition({
    branches: [
      {id: 'west', bounds: [6, -1, 9, 1], projection: position => [position[0] - 10, position[1]]},
      {id: 'east', bounds: [21, -1, 24, 1], projection: position => [position[0] - 20, position[1]]}
    ],
    tolerance: 1e-8
  }).plan;
  const inverted = invertProjectionProgram({
    ...program,
    operations: [{type: 'adaptive', plan, inversePlan: inverse}]
  });
  expect(evaluateProjectionProgram(inverted, [15, 0]).valid).toBe(false);
  expect(evaluateProjectionProgram(inverted, [22, 0]).position[0]).toBeCloseTo(2, 10);
  expect(compileProjectionProgram(program).metadata.invertible).toBe(false);
  const segments = clipProjectionSegment(plan, [-5, 0], [5, 0]);
  expect(segments.map(segment => [segment.start, segment.end])).toEqual([
    [
      [-4, 0],
      [-1, 0]
    ],
    [
      [1, 0],
      [4, 0]
    ]
  ]);
  expect(clipProjectionSegment(plan, [0, -2], [0, 2])).toEqual([]);
});

it('never samples outside the conservative clipping disk and reports excluded boundary cells', () => {
  let samples = 0;
  const result = compileProjectionPartition({
    branches: [
      {
        id: 'disk',
        bounds: [-1, -1, 1, 1],
        disk: {center: [0, 0], radius: 1},
        projection: position => {
          expect(Math.hypot(...position)).toBeLessThan(1);
          samples++;
          return position;
        }
      }
    ],
    domainDepth: 4,
    tolerance: 1e-8
  });
  expect(samples).toBeGreaterThan(0);
  expect(result.unresolvedCells).toBeGreaterThan(0);
  expect(result.plan.patches.length).toBeGreaterThan(1);
  expect(findProjectionPatch(result.plan, [0, 0])).toBeGreaterThanOrEqual(0);
  for (const position of [
    [1, 0],
    [0, 1],
    [0.9, 0.9],
    [NaN, 0]
  ] as const)
    expect(findProjectionPatch(result.plan, position)).toBe(-1);
  for (const patch of result.plan.patches)
    for (const horizontal of [patch.bounds[0], patch.bounds[2]])
      for (const vertical of [patch.bounds[1], patch.bounds[3]])
        expect(Math.hypot(horizontal, vertical)).toBeLessThan(1);
});

it('rejects ambiguous branches, exhausted budgets and empty or invalid clipping domains', () => {
  const first = {id: 'first', bounds: [-1, -1, 1, 1] as const, projection: identity};
  expect(() => compileProjectionPartition({branches: []})).toThrow();
  expect(() =>
    compileProjectionPartition({branches: [first, {...first, id: 'second', bounds: [1, -1, 2, 1]}]})
  ).toThrow(/disjoint/);
  expect(() => compileProjectionPartition({branches: [first, first]})).toThrow();
  for (const radius of [0, -1, NaN, Infinity])
    expect(() =>
      compileProjectionPartition({branches: [{...first, disk: {center: [0, 0], radius}}]})
    ).toThrow();
  const disk = {...first, disk: {center: [0, 0] as const, radius: 1}};
  expect(() =>
    compileProjectionPartition({
      branches: [{...first, disk: JSON.parse('{"center": [], "radius": 1}')}]
    })
  ).toThrow(/clipping disk/);
  expect(() => compileProjectionPartition({branches: [disk], domainDepth: 0})).toThrow(
    /no accepted/
  );
  expect(() => compileProjectionPartition({branches: [disk], maxDomainCells: 1})).toThrow(
    /cell limit/
  );
  expect(() => compileProjectionPartition({branches: [disk], maxPatches: 1})).toThrow(
    /patch limit/
  );
});
