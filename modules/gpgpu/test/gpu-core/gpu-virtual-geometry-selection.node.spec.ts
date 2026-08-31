import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {makeGPUVirtualGeometrySelectionPlan} from '@luma.gl/gpgpu/gpu-core';

it('GPU virtual geometry publishes an immutable breadth-level plan', () => {
  const levelOffsets = [0, 2, 6, 10];
  const plan = makeGPUVirtualGeometrySelectionPlan(levelOffsets, 10);

  expect(plan).toEqual({
    nodeCount: 10,
    rootCount: 2,
    levelCount: 3,
    traversalPassCount: 3,
    levelOffsets: [0, 2, 6, 10]
  });
  expect(Boolean(Object.isFrozen(plan)), 'the plan is immutable').toBe(true);
  expect(
    Boolean(Object.isFrozen(plan.levelOffsets)),
    'the copied level offsets are immutable'
  ).toBe(true);

  levelOffsets[1] = 4;
  expect(plan.levelOffsets, 'caller mutation cannot change the plan').toEqual([0, 2, 6, 10]);
});

it('GPU virtual geometry rejects invalid CPU-known hierarchy layouts', () => {
  expect(
    () => makeGPUVirtualGeometrySelectionPlan([1, 2], 2),
    'the first breadth level begins at node zero'
  ).toThrow(/begin with zero/);
  expect(
    () => makeGPUVirtualGeometrySelectionPlan([0, 2, 2], 2),
    'empty or overlapping breadth levels are rejected'
  ).toThrow(/strictly increasing/);
  expect(
    () => makeGPUVirtualGeometrySelectionPlan([0, 2, 5], 6),
    'the final level must cover every node'
  ).toThrow(/end at nodeCount/);
  expect(
    () => makeGPUVirtualGeometrySelectionPlan([0, 1], 0),
    'empty hierarchies are rejected'
  ).toThrow(/positive safe integer/);
});
